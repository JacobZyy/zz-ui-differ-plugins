import type { DiffResultInfo, NodeInfo, UniqueId } from '../types'
import chalk from '@alita/chalk'
import { SiblingPosition, siblingPositionToDiffResultKey } from '../types'
import { debuggerHandler, fixedSubstract } from '../utils'

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

export function uiDiff(flatNodeMap: Map<UniqueId, NodeInfo>, designNodeMap: Map<UniqueId, NodeInfo>): DiffResultInfo[] {
  const diffResultMap = new Map<UniqueId, DiffResultInfo>()
  flatNodeMap.forEach((currentNodeInfo) => {
    const { matchedDesignNodeId, boundingRect } = currentNodeInfo
    const designNode = designNodeMap.get(matchedDesignNodeId || '')
    if (!designNode) {
      chalk.error(`当前节点${currentNodeInfo.uniqueId}没有匹配到设计稿节点`)
      return null
    }

    debuggerHandler(currentNodeInfo.uniqueId, 'stParam-title')

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

    const distanceResult: DiffResultInfo = {
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
    diffResultMap.set(currentNodeInfo.uniqueId, distanceResult)
  })
  return Array.from(diffResultMap.values())
}
