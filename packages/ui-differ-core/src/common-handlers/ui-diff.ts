import type { DiffResultInfo, NodeInfo, UniqueId } from '../types'
import chalk from '@alita/chalk'
import { SiblingPosition, siblingPositionToDiffResultKey } from '../types'
import { fixedSubstract } from '../utils'

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

interface FixDistanceInfoOptions {
  direction: SiblingPosition
  currentNodeInfo: NodeInfo
  currentDiffResult: Map<UniqueId, DiffResultInfo>
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
function createDiffResult(currentNodeInfo: NodeInfo, designNode: NodeInfo, diffResultMap: Map<UniqueId, DiffResultInfo>): DiffResultInfo {
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

export function uiDiff(flatNodeMap: Map<UniqueId, NodeInfo>, designNodeMap: Map<UniqueId, NodeInfo>): DiffResultInfo[] {
  const allDiffResultMap = new Map<UniqueId, DiffResultInfo>()

  const filteredDiffResultMap = new Map<UniqueId, DiffResultInfo>()
  // 第一次遍历：收集所有DOM节点的diff结果
  flatNodeMap.forEach((currentNodeInfo) => {
    const { matchedDesignNodeId } = currentNodeInfo
    const designNode = designNodeMap.get(matchedDesignNodeId || '')
    if (!designNode) {
      chalk.error(`当前节点${currentNodeInfo.uniqueId}没有匹配到设计稿节点`)
      return
    }

    const diffResult = createDiffResult(currentNodeInfo, designNode, allDiffResultMap)
    allDiffResultMap.set(currentNodeInfo.uniqueId, diffResult)
  })

  // 第二次遍历：按design节点分组并筛选最佳匹配
  const candidatesByDesignNode = new Map<UniqueId, DiffResultInfo[]>()

  allDiffResultMap.forEach((diffResult) => {
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
