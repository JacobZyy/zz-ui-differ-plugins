import type { DiffResultInfo, NodeInfo, UniqueId } from '../types'
import chalk from '@alita/chalk'
import { SiblingPosition } from '../types'
import { fixedSubstract } from '../utils'

export function uiDiff(flatNodeMap: Map<UniqueId, NodeInfo>, designNodeMap: Map<UniqueId, NodeInfo>): DiffResultInfo[] {
  const domNodeList = Array.from(flatNodeMap.values())
  const diffResult = domNodeList
    .map((nodeInfo) => {
      const { matchedDesignNodeId, neighborMarginInfo, boundingRect } = nodeInfo
      const designNode = designNodeMap.get(matchedDesignNodeId || '')
      if (!designNode) {
        chalk.error(`当前节点${nodeInfo.uniqueId}没有匹配到设计稿节点`)
        return null
      }

      const { boundingRect: designNodeBoundingRect, neighborMarginInfo: designNodeNeighborMarginInfo } = designNode

      const distanceResult: DiffResultInfo = {
        distanceResult: {
          width: fixedSubstract(boundingRect.width, designNodeBoundingRect.width),
          height: fixedSubstract(boundingRect.height, designNodeBoundingRect.height),
          marginRight: fixedSubstract(neighborMarginInfo[SiblingPosition.RIGHT] || 0, designNodeNeighborMarginInfo[SiblingPosition.RIGHT] || 0),
          marginBottom: fixedSubstract(neighborMarginInfo[SiblingPosition.BOTTOM] || 0, designNodeNeighborMarginInfo[SiblingPosition.BOTTOM] || 0),
          marginLeft: fixedSubstract(neighborMarginInfo[SiblingPosition.LEFT] || 0, designNodeNeighborMarginInfo[SiblingPosition.LEFT] || 0),
          marginTop: fixedSubstract(neighborMarginInfo[SiblingPosition.TOP] || 0, designNodeNeighborMarginInfo[SiblingPosition.TOP] || 0),
        },
        originNode: nodeInfo,
        designNode,
      }
      return distanceResult
    })
    .filter(it => it != null)
  return diffResult
}
