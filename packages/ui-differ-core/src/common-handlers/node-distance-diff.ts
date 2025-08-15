import type { DiffResultInfo, NodeInfo, UniqueId } from '../types'
import { convertSiblingPositionToBoundingValue, currentNodeToSiblingPositionMap, SiblingPosition } from '../types'
import { fixedSubstract } from '../utils/compare-distance'

import { getSamePositionNode } from './get-same-position-node'

function getTargetNeighborDistanceInfo(currentNodeInfo: NodeInfo, flatNodeMap: Map<UniqueId, NodeInfo>, diretcion: SiblingPosition) {
  const { [diretcion]: targetKeys } = currentNodeInfo
  const targetNeighbor = flatNodeMap.get(targetKeys || '')
  if (!targetKeys || !targetNeighbor) {
    return 0
  }
  const curBoundingRect = currentNodeInfo.boundingRect
  const neighborBoundingRect = targetNeighbor.boundingRect
  const neighborDirection = currentNodeToSiblingPositionMap[diretcion]
  const curNodeBoundingKeys = convertSiblingPositionToBoundingValue[diretcion]
  const neighborBoundingKeys = convertSiblingPositionToBoundingValue[neighborDirection]
  const curNodePosValue = curNodeBoundingKeys.reduce((acc, key) => acc + curBoundingRect[key], 0)
  const neighborNodePosValue = neighborBoundingKeys.reduce((acc, key) => acc + neighborBoundingRect[key], 0)
  return Math.abs(curNodePosValue - neighborNodePosValue)
}

export function nodeDistanceDiff(domNodeInfo: Map<UniqueId, NodeInfo>, mgNodeInfo: Map<UniqueId, NodeInfo>): Map<UniqueId, DiffResultInfo> {
  const diffResultEntries = Array.from(domNodeInfo.entries())
    .map(([currentDomNodeId, currentDomNode]) => {
      const targetDeisignNodeId = getSamePositionNode(currentDomNode, mgNodeInfo)
      const designNodeInfo = mgNodeInfo.get(targetDeisignNodeId)
      if (!targetDeisignNodeId || !designNodeInfo) {
        console.error(`当前节点${currentDomNodeId}在mg中没有找到相同位置的节点`, designNodeInfo, mgNodeInfo)
        return null
      }

      const curNodeLeftMargin = getTargetNeighborDistanceInfo(currentDomNode, domNodeInfo, SiblingPosition.LEFT)
      const curNodeRightMargin = getTargetNeighborDistanceInfo(currentDomNode, domNodeInfo, SiblingPosition.RIGHT)
      const curNodeTopMargin = getTargetNeighborDistanceInfo(currentDomNode, domNodeInfo, SiblingPosition.TOP)
      const curNodeBottomMargin = getTargetNeighborDistanceInfo(currentDomNode, domNodeInfo, SiblingPosition.BOTTOM)

      const designNodeLeftMargin = getTargetNeighborDistanceInfo(designNodeInfo, mgNodeInfo, SiblingPosition.LEFT)
      const designNodeRightMargin = getTargetNeighborDistanceInfo(designNodeInfo, mgNodeInfo, SiblingPosition.RIGHT)
      const designNodeTopMargin = getTargetNeighborDistanceInfo(designNodeInfo, mgNodeInfo, SiblingPosition.TOP)
      const designNodeBottomMargin = getTargetNeighborDistanceInfo(designNodeInfo, mgNodeInfo, SiblingPosition.BOTTOM)

      const diffResultInfo: DiffResultInfo = {
        diffWidth: fixedSubstract(currentDomNode.boundingRect.width, designNodeInfo.boundingRect.width),
        diffHeight: fixedSubstract(currentDomNode.boundingRect.height, designNodeInfo.boundingRect.height),
        diffMarginInfo: {
          left: fixedSubstract(curNodeLeftMargin, designNodeLeftMargin),
          right: fixedSubstract(curNodeRightMargin, designNodeRightMargin),
          top: fixedSubstract(curNodeTopMargin, designNodeTopMargin),
          bottom: fixedSubstract(curNodeBottomMargin, designNodeBottomMargin),
        },
        originMarginInfo: {
          left: curNodeLeftMargin,
          right: curNodeRightMargin,
          top: curNodeTopMargin,
          bottom: curNodeBottomMargin,
        },
        originBoundingRect: currentDomNode.boundingRect,
        originWidth: currentDomNode.boundingRect.width,
        originHeight: currentDomNode.boundingRect.height,
        designNodeName: designNodeInfo.nodeName,
        designNodeId: designNodeInfo.uniqueId,
        uniqueId: currentDomNodeId,
        nodeName: currentDomNode.nodeName,
      }
      return [currentDomNodeId, diffResultInfo] as const
    })
    .filter(entry => entry != null)

  return new Map(diffResultEntries)
}
