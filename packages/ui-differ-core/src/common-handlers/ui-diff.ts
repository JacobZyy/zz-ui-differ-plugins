import type { DiffResultInfo, NodeInfo, UniqueId } from '../types'
import chalk from '@alita/chalk'
import { produce } from 'immer'
import { NodeFlexType, SiblingPosition, siblingPositionToDiffResultKey } from '../types'
import { fixedSubstract } from '../utils'
import { getMultiLineHeightOffset } from '../utils/getMultiLineHeightOffset'

interface DiffResultOptions {
  currentNodeInfo: NodeInfo
  designNode: NodeInfo
  diffResultMap: Map<UniqueId, DiffResultInfo>
}

interface FixDistanceInfoOptions {
  direction: SiblingPosition
  currentNodeInfo: NodeInfo
  currentDiffResult: Map<UniqueId, DiffResultInfo>
}

/**
 * 判断当前节点是否为flex1
 * @param nodeInfo 当前节点
 * @param flatNodeMap 所有节点map
 * @returns {NodeFlexType} flex类型
 */
function getIsFlex1(nodeInfo: NodeInfo, flatNodeMap: Map<UniqueId, NodeInfo>): NodeFlexType {
  const parentNode = flatNodeMap.get(nodeInfo.parentId)
  if (!parentNode)
    return NodeFlexType.NOT_FLEX
  if (!parentNode.nodeFlexInfo?.isFlex)
    return NodeFlexType.NOT_FLEX
  if (nodeInfo.nodeFlexInfo?.flexGrow !== '1') {
    return NodeFlexType.NOT_FLEX_1
  }
  if (parentNode.nodeFlexInfo?.flexDirection === 'column' || parentNode.nodeFlexInfo?.flexDirection === 'column-reverse') {
    return NodeFlexType.FLEX_COLUMN_1
  }
  return NodeFlexType.FLEX_ROW_1
}

function calculateWeightedDifference(diffResult: DiffResultInfo): number {
  const { distanceResult } = diffResult
  const marginWeight = 0.2
  const sizeWeight = 0.1

  return Math.abs(distanceResult.marginTop) * marginWeight
    + Math.abs(distanceResult.marginBottom) * marginWeight
    + Math.abs(distanceResult.marginLeft) * marginWeight
    + Math.abs(distanceResult.marginRight) * marginWeight
    + Math.abs(distanceResult.width) * sizeWeight
    + Math.abs(distanceResult.height) * sizeWeight
}

// TODO: 临时修正方法，正解应该需要找父节点的匹配结果
function getFixedDistanceInfo({ direction, currentNodeInfo, currentDiffResult }: FixDistanceInfoOptions) {
  const { neighborMarginInfo, [direction]: targetNeighborId } = currentNodeInfo
  const { value = 0 } = neighborMarginInfo?.[direction] || {}
  const currentNeighborDiffInfo = currentDiffResult.get(targetNeighborId || '')
  if (!currentDiffResult) {
    return value
  }

  const siblingPosition = siblingPositionToDiffResultKey[direction]

  const targetOriginDistance = currentNeighborDiffInfo?.distanceResult[siblingPosition] || 0

  return value + targetOriginDistance
}

function createDiffResult({ currentNodeInfo, designNode, diffResultMap }: DiffResultOptions): DiffResultInfo {
  const { boundingRect } = currentNodeInfo
  const fixedRight = getFixedDistanceInfo({ direction: SiblingPosition.RIGHT, currentNodeInfo, currentDiffResult: diffResultMap })
  const fixedBottom = getFixedDistanceInfo({ direction: SiblingPosition.BOTTOM, currentNodeInfo, currentDiffResult: diffResultMap })
  const fixedLeft = getFixedDistanceInfo({ direction: SiblingPosition.LEFT, currentNodeInfo, currentDiffResult: diffResultMap })
  const fixedTop = getFixedDistanceInfo({ direction: SiblingPosition.TOP, currentNodeInfo, currentDiffResult: diffResultMap })

  const { boundingRect: designNodeBoundingRect, neighborMarginInfo: designNodeNeighborMarginInfo } = designNode

  const widthDiff = fixedSubstract(boundingRect.width, designNodeBoundingRect.width)
  const heightDiff = fixedSubstract(boundingRect.height, designNodeBoundingRect.height)
  const marginRightDiff = fixedSubstract(fixedRight, designNodeNeighborMarginInfo[SiblingPosition.RIGHT]?.value || 0)
  const marginBottomDiff = fixedSubstract(fixedBottom, designNodeNeighborMarginInfo[SiblingPosition.BOTTOM]?.value || 0)
  const marginLeftDiff = fixedSubstract(fixedLeft, designNodeNeighborMarginInfo[SiblingPosition.LEFT]?.value || 0)
  const marginTopDiff = fixedSubstract(fixedTop, designNodeNeighborMarginInfo[SiblingPosition.TOP]?.value || 0)

  return {
    distanceResult: {
      width: widthDiff,
      height: heightDiff,
      marginRight: marginRightDiff,
      marginBottom: marginBottomDiff,
      marginLeft: marginLeftDiff,
      marginTop: marginTopDiff,
    },
    originNode: currentNodeInfo,
    designNode,
  }
}

function correctDiffResult({ diffResultMap, flatNodeMap, designNodeMap }: { diffResultMap: Map<UniqueId, DiffResultInfo>, flatNodeMap: Map<UniqueId, NodeInfo>, designNodeMap: Map<UniqueId, NodeInfo> }) {
  return produce(diffResultMap, (draftDiffResultMap) => {
    draftDiffResultMap.forEach((diffResult) => {
      const { originNode, designNode } = diffResult
      // 修正flex1场景下的宽高比对结果
      const currentFlexType = getIsFlex1(originNode, flatNodeMap)
      const isRowFlex1 = currentFlexType === NodeFlexType.FLEX_ROW_1
      const isColumnFlex1 = currentFlexType === NodeFlexType.FLEX_COLUMN_1
      if (isRowFlex1) {
        diffResult.distanceResult.width = 0
      }
      if (isColumnFlex1) {
        diffResult.distanceResult.height = 0
      }

      const topSiblingNodeInfo = flatNodeMap.get(originNode[SiblingPosition.TOP] || '')
      const topMatchedDesignNode = designNodeMap.get(topSiblingNodeInfo?.matchedDesignNodeId || '')

      const originEl = document.querySelector(`[unique-id="${originNode.uniqueId}"]`)
      // if (originEl?.textContent === '隐私清除') {
      //   debugger
      // }

      const { top: siblingTopOffset, height: siblingHeightOffset, coefficient: siblingCoefficient = 1 } = (topSiblingNodeInfo && topMatchedDesignNode) ? getMultiLineHeightOffset(topSiblingNodeInfo, topMatchedDesignNode, flatNodeMap) : { top: 0, height: 0 }
      const { top: textStyleTopOffset, height: textStyleHeightOffset, coefficient: textStyleCoefficient = 1 } = getMultiLineHeightOffset(originNode, designNode, flatNodeMap)
      if (originEl?.textContent === '隐私清除') {
        console.log('🚀 ~ correctDiffResult ~ siblingTopOffset:', topSiblingNodeInfo, siblingTopOffset, siblingHeightOffset)
      }
      const siblingBottomOffsetValue = siblingHeightOffset - siblingTopOffset
      // 上方边距纠正：上方节点的bottom+当前节点的top
      diffResult.distanceResult.marginTop += siblingBottomOffsetValue * siblingCoefficient + textStyleTopOffset * textStyleCoefficient
      // height纠正
      diffResult.distanceResult.height += textStyleHeightOffset * textStyleCoefficient
      // 下方边距纠正 TODO: 这个不重要
    })
  })
}

export function uiDiff(flatNodeMap: Map<UniqueId, NodeInfo>, designNodeMap: Map<UniqueId, NodeInfo>): DiffResultInfo[] {
  const allDiffResultMap = new Map<UniqueId, DiffResultInfo>()

  const filteredDiffResultMap = new Map<UniqueId, DiffResultInfo>()
  // 第一次遍历：收集所有DOM节点的diff结果
  flatNodeMap.forEach((currentNodeInfo) => {
    const { matchedDesignNodeId } = currentNodeInfo
    const designNode = designNodeMap.get(matchedDesignNodeId || '')
    if (!designNode) {
      chalk.warn(`当前节点${currentNodeInfo.uniqueId}没有匹配到设计稿节点`)
      return
    }

    const diffResult = createDiffResult({ currentNodeInfo, designNode, diffResultMap: allDiffResultMap })
    allDiffResultMap.set(currentNodeInfo.uniqueId, diffResult)
  })

  console.log('🚀 ~ uiDiff ~ allDiffResultMap:', allDiffResultMap)
  // 第二遍遍历：遍历一遍修正一些间距
  const correctedDiffResultMap = correctDiffResult({ diffResultMap: allDiffResultMap, flatNodeMap, designNodeMap })
  console.log('🚀 ~ uiDiff ~ candidatesByDesignNode:', correctedDiffResultMap)

  // 第二次遍历：按design节点分组并筛选最佳匹配
  const candidatesByDesignNode = new Map<UniqueId, DiffResultInfo[]>()

  correctedDiffResultMap.forEach((diffResult) => {
    const designNodeId = diffResult.designNode.uniqueId

    if (!candidatesByDesignNode.has(designNodeId)) {
      candidatesByDesignNode.set(designNodeId, [])
    }
    candidatesByDesignNode.get(designNodeId)!.push(diffResult)
  })

  candidatesByDesignNode.forEach((candidates, designNodeId) => {
    if (candidates.length <= 1) {
      const result = candidates[0]
      filteredDiffResultMap.set(result.originNode.uniqueId, result)
    }

    if (__DEV__) {
      console.log(`设计节点 ${designNodeMap.get(designNodeId)!.nodeName} 匹配到 ${candidates.length} 个DOM节点，正在选择最佳匹配`)
    }
    const bestMatch = candidates.reduce((best, current) => {
      const bestScore = calculateWeightedDifference(best)
      const currentScore = calculateWeightedDifference(current)
      return currentScore < bestScore ? current : best
    })

    if (__DEV__) {
      const bestScore = calculateWeightedDifference(bestMatch)
      console.log(`选择DOM节点 `, document.querySelector(`[unique-id="${bestMatch.originNode.uniqueId}"]`), `，加权差距: ${bestScore.toFixed(3)}`)
      const filteredCount = candidates.length - 1
      console.log(`过滤掉 ${filteredCount} 个差距较大的DOM节点`)
    }

    filteredDiffResultMap.set(bestMatch.originNode.uniqueId, bestMatch)
  })

  return Array.from(filteredDiffResultMap.values())
}
