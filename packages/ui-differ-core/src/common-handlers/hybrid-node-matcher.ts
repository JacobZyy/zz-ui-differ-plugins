import type { BoundingRect, MatchResult, NodeInfo, UniqueId } from '../types'
import { produce } from 'immer'
import { SiblingPosition } from '../types'

interface OffsetCorrection {
  x: number
  y: number
  confidence: number
}

interface MatchedPair {
  domNodeId: UniqueId
  designNodeId: UniqueId
  offset: { x: number, y: number }
}

/**
 * 计算两个矩形的重叠面积比例 (IoU)
 */
function calculateOverlapRatio(domRect: BoundingRect, designRect: BoundingRect, offset: OffsetCorrection = { x: 0, y: 0, confidence: 0 }): number {
  const correctedDesignRect = {
    x: designRect.x + offset.x,
    y: designRect.y + offset.y,
    width: designRect.width,
    height: designRect.height,
  }

  const overlapX = Math.max(0, Math.min(domRect.x + domRect.width, correctedDesignRect.x + correctedDesignRect.width) - Math.max(domRect.x, correctedDesignRect.x))
  const overlapY = Math.max(0, Math.min(domRect.y + domRect.height, correctedDesignRect.y + correctedDesignRect.height) - Math.max(domRect.y, correctedDesignRect.y))
  const overlapArea = overlapX * overlapY

  const domArea = domRect.width * domRect.height
  const designArea = correctedDesignRect.width * correctedDesignRect.height
  const unionArea = domArea + designArea - overlapArea

  return unionArea > 0 ? overlapArea / unionArea : 0
}

/**
 * 计算中心点距离
 */
function calculateCenterDistance(domRect: BoundingRect, designRect: BoundingRect, offset: OffsetCorrection = { x: 0, y: 0, confidence: 0 }): number {
  const domCenterX = domRect.x + domRect.width / 2
  const domCenterY = domRect.y + domRect.height / 2

  const designCenterX = designRect.x + offset.x + designRect.width / 2
  const designCenterY = designRect.y + offset.y + designRect.height / 2

  return Math.sqrt((domCenterX - designCenterX) ** 2 + (domCenterY - designCenterY) ** 2)
}

/**
 * 检查设计稿节点是否在DOM父节点边界内
 */
function isWithinParentBounds(designNode: NodeInfo, domParent: NodeInfo, offset: OffsetCorrection = { x: 0, y: 0, confidence: 0 }): boolean {
  const { x, y } = designNode.boundingRect
  const correctedX = x + offset.x
  const correctedY = y + offset.y

  const { x: px, y: py, width: pw, height: ph } = domParent.boundingRect

  return correctedX >= px && correctedY >= py && correctedX <= px + pw && correctedY <= py + ph
}

/**
 * 基于已匹配的相邻节点计算偏移量修正
 */
function calculateOffsetFromNeighbors(
  domNode: NodeInfo,
  matchedPairs: MatchedPair[],
): OffsetCorrection {
  const matchedMap = new Map(matchedPairs.map(pair => [pair.domNodeId, pair]))

  // 优先使用左侧节点的偏移量
  const leftNeighborId = domNode[SiblingPosition.LEFT]
  if (leftNeighborId) {
    const matchedLeft = matchedMap.get(leftNeighborId)
    if (matchedLeft) {
      return {
        x: matchedLeft.offset.x,
        y: matchedLeft.offset.y,
        confidence: 0.8,
      }
    }
  }

  // 其次使用上方节点的偏移量
  const topNeighborId = domNode[SiblingPosition.TOP]
  if (topNeighborId) {
    const matchedTop = matchedMap.get(topNeighborId)
    if (matchedTop) {
      return {
        x: matchedTop.offset.x,
        y: matchedTop.offset.y,
        confidence: 0.7,
      }
    }
  }

  // 如果没有相邻节点匹配，使用平均偏移量
  if (matchedPairs.length > 0) {
    const avgOffsetX = matchedPairs.reduce((sum, pair) => sum + pair.offset.x, 0) / matchedPairs.length
    const avgOffsetY = matchedPairs.reduce((sum, pair) => sum + pair.offset.y, 0) / matchedPairs.length

    return {
      x: avgOffsetX,
      y: avgOffsetY,
      confidence: 0.3,
    }
  }

  return { x: 0, y: 0, confidence: 0 }
}

interface MatchSingleNodeOptions {
  domNode: NodeInfo
  designNodeMap: Map<UniqueId, NodeInfo>
  domParentNode?: NodeInfo
  matchedPairs: MatchedPair[]
}

/**
 * 单个DOM节点的混合匹配
 */
function matchSingleNode({ domNode, designNodeMap, domParentNode, matchedPairs }: MatchSingleNodeOptions): MatchResult | undefined {
  const offsetCorrection = calculateOffsetFromNeighbors(domNode, matchedPairs)

  let bestMatch: MatchResult | undefined
  let bestScore = -1

  designNodeMap.forEach((designNode) => {
    // 父节点边界检查
    if (domParentNode && !isWithinParentBounds(designNode, domParentNode, offsetCorrection)) {
      return
    }

    // 计算中心点距离和重叠面积比例
    const centerDistance = calculateCenterDistance(domNode.boundingRect, designNode.boundingRect, offsetCorrection)
    const overlapRatio = calculateOverlapRatio(domNode.boundingRect, designNode.boundingRect, offsetCorrection)

    // 综合评分：重叠面积权重更高，中心点距离作为辅助
    // 距离越小越好，重叠比例越大越好
    const normalizedCenterScore = Math.max(0, 1 - centerDistance / 50) // 假设50px为最大可接受距离
    const finalScore = normalizedCenterScore * 0.4 + overlapRatio * 0.6

    // 偏移量修正的置信度加成
    const confidenceBonus = offsetCorrection.confidence * 0.1
    const adjustedScore = finalScore + confidenceBonus

    if (adjustedScore > bestScore && adjustedScore > 0.3) { // 最低置信度阈值
      bestScore = adjustedScore
      bestMatch = {
        designNodeId: designNode.uniqueId,
        confidence: adjustedScore,
        centerDistance,
        overlapRatio,
        offsetCorrected: offsetCorrection.confidence > 0,
      }
    }
  })

  return bestMatch
}

/**
 * 混合节点匹配器主函数
 */
export const recordHybridNodeMatchResult = produce((flatNodeMap: Map<UniqueId, NodeInfo>, designNodeMap: Map<UniqueId, NodeInfo>) => {
  const matchedPairs: MatchedPair[] = []
  flatNodeMap.forEach((domNode) => {
    // 获取父节点信息
    const domParentNode = flatNodeMap.get(domNode.parentId)
    // 单节点匹配
    const matchResult = matchSingleNode({ domNode, designNodeMap, domParentNode, matchedPairs })
    if (!matchResult)
      return
    // 记录匹配结果
    domNode.matchedDesignNodeId = matchResult.designNodeId
    domNode.matchResult = matchResult

    // 计算并记录偏移量（考虑宽高差异）·
    const designNode = designNodeMap.get(matchResult.designNodeId)!

    // 基于中心点计算偏移量，考虑宽高差异
    const domCenterX = domNode.boundingRect.x + domNode.boundingRect.width / 2
    const domCenterY = domNode.boundingRect.y + domNode.boundingRect.height / 2
    const designCenterX = designNode.boundingRect.x + designNode.boundingRect.width / 2
    const designCenterY = designNode.boundingRect.y + designNode.boundingRect.height / 2

    const offsetX = domCenterX - designCenterX
    const offsetY = domCenterY - designCenterY

    const matchPairInfo: MatchedPair = {
      domNodeId: domNode.uniqueId,
      designNodeId: matchResult.designNodeId,
      offset: { x: offsetX, y: offsetY },
    }

    matchedPairs.push(matchPairInfo)
  })
})
