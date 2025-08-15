import type { DiffResultInfo, NodeInfo, UniqueId } from '../types'
import { convertSiblingPositionToBoundingValue, currentNodeToSiblingPositionMap, SiblingPosition } from '../types'

import { getSamePositionNode } from './get-same-position-node'

function getDomTargetNeighborDistanceInfo(currentNodeInfo: NodeInfo, flatNodeMap: Map<UniqueId, NodeInfo>, diretcion: SiblingPosition) {
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

function getDesignTargetNeighborDistanceInfo(currentNodeInfo: NodeInfo, flatNodeMap: Map<UniqueId, NodeInfo>, diretcion: SiblingPosition) {
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

export function nodeDistanceDiff(domNodeInfo: Map<UniqueId, NodeInfo>, mgNodeInfo: Map<UniqueId, NodeInfo>) {
  const resultMap = new Map<UniqueId, DiffResultInfo>()

  domNodeInfo.forEach((currentDomNode, currentDomNodeId) => {
    const targetDeisignNodeId = getSamePositionNode(currentDomNode, mgNodeInfo)
    const designNodeInfo = mgNodeInfo.get(targetDeisignNodeId)
    if (!targetDeisignNodeId || !designNodeInfo) {
      console.error(`当前节点${currentDomNodeId}在mg中没有找到相同位置的节点`, designNodeInfo, mgNodeInfo)
      return
    }

    const curNodeLeftMargin = getDomTargetNeighborDistanceInfo(currentDomNode, domNodeInfo, SiblingPosition.LEFT)
    const curNodeRightMargin = getDomTargetNeighborDistanceInfo(currentDomNode, domNodeInfo, SiblingPosition.RIGHT)
    const curNodeTopMargin = getDomTargetNeighborDistanceInfo(currentDomNode, domNodeInfo, SiblingPosition.TOP)
    const curNodeBottomMargin = getDomTargetNeighborDistanceInfo(currentDomNode, domNodeInfo, SiblingPosition.BOTTOM)

    // const diffResultInfo: DiffResultInfo = {
    //   width: fixedSubstract(currentNodeDistanceInfo.width, designNodeDistanceInfo.width),
    //   height: fixedSubstract(currentNodeDistanceInfo.height, designNodeDistanceInfo.height),
    //   marginRight: fixedSubstract(domRealMarginRight, designRealMarginRight),
    //   marginBottom: fixedSubstract(domRealMarginBottom, designRealMarginBottom),
    //   marginLeft: fixedSubstract(domRealMarginLeft, designRealMarginLeft),
    //   marginTop: fixedSubstract(domRealMarginTop, designRealMarginTop),
    //   nodeLeft: currentNodeDistanceInfo.left,
    //   nodeTop: currentNodeDistanceInfo.top,
    //   nodeWidth: currentNodeDistanceInfo.width,
    //   nodeHeight: currentNodeDistanceInfo.height,
    //   designNodeName: designNodeDistanceInfo.nodeName || '设计图节点未命名',
    //   designNodeId: designNodeDistanceInfo.uniqueId,
    //   domMarginRight: calculateMargin({
    //     keys: rightKeys,
    //     distanceMap: domDistanceInfo,
    //     currentNode: currentNodeDistanceInfo,
    //     direction: 'right',
    //     shouldCalculateParentNode: true,
    //   }),
    //   domMarginBottom: calculateMargin({
    //     keys: bottomKeys,
    //     distanceMap: domDistanceInfo,
    //     currentNode: currentNodeDistanceInfo,
    //     direction: 'bottom',
    //     shouldCalculateParentNode: true,
    //   }),
    //   domMarginLeft: calculateMargin({
    //     keys: leftKeys,
    //     distanceMap: domDistanceInfo,
    //     currentNode: currentNodeDistanceInfo,
    //     direction: 'left',
    //     shouldCalculateParentNode: true,
    //   }),
    //   domMarginTop: calculateMargin({
    //     keys: topKeys,
    //     distanceMap: domDistanceInfo,
    //     currentNode: currentNodeDistanceInfo,
    //     direction: 'top',
    //     shouldCalculateParentNode: true,
    //   }),
    // }

    // if (designNodeDistanceInfo.uniqueId === '18:217') {
    //   console.log('🚀 ~ handleCalculateDiffInfo ~ diffResultInfo: 18:217', currentNodeDistanceInfo)
    // }

    // return diffResultInfo
    // if (diffedDesignNodeSet.has(targetDeisignNodeId))
    //   return
    // diffedDesignNodeSet.add(targetDeisignNodeId)
  })
}
