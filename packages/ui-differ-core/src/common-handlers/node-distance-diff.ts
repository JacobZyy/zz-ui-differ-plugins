import type { DiffResultInfo, NodeInfo, UniqueId } from '../types'
import { convertPositionToBoundingKeys, currentNodeToSiblingPositionMap, SiblingPosition } from '../types'
import { fixedSubstract } from '../utils'
import { getSamePositionNode } from './get-same-position-node'

function getIsSiblingOrParents(currentNodeInfo: NodeInfo, targetNodeId: UniqueId, flatNodeMap: Map<UniqueId, NodeInfo>): 'sibling' | 'parent' {
  const siblingSet = new Set(currentNodeInfo.sibling)
  const isSibling = siblingSet.has(targetNodeId)
  const isParent = currentNodeInfo.parentId === targetNodeId

  if (isParent) {
    return 'parent'
  }
  if (isSibling) {
    return 'sibling'
  }
  const parentNode = flatNodeMap.get(currentNodeInfo.parentId)
  if (!currentNodeInfo.parentId || !parentNode) {
    return 'parent'
  }
  return getIsSiblingOrParents(parentNode, targetNodeId, flatNodeMap)
}

function getTargetNeighborDistanceInfo(currentNodeInfo: NodeInfo, flatNodeMap: Map<UniqueId, NodeInfo>, diretcion: SiblingPosition) {
  const { [diretcion]: targetKeys } = currentNodeInfo
  const targetNeighbor = flatNodeMap.get(targetKeys || '')
  if (!targetKeys || !targetNeighbor) {
    return 0
  }
  const curBoundingRect = currentNodeInfo.boundingRect
  const neighborBoundingRect = targetNeighbor.boundingRect
  const curNodeBoundingKeys = convertPositionToBoundingKeys[diretcion]

  const neighborType = getIsSiblingOrParents(currentNodeInfo, targetKeys, flatNodeMap)

  // 如果和父节点比，则直接用当前位置的值， 和兄弟节点相比，则用映射值
  const neighborDirection = neighborType === 'parent' ? diretcion : currentNodeToSiblingPositionMap[diretcion]
  const neighborBoundingKeys = convertPositionToBoundingKeys[neighborDirection]
  const curNodePosValue = curNodeBoundingKeys.reduce((acc, key) => acc + curBoundingRect[key], 0)
  const neighborNodePosValue = neighborBoundingKeys.reduce((acc, key) => acc + neighborBoundingRect[key], 0)
  return Math.abs(curNodePosValue - neighborNodePosValue)
}

export function nodeDistanceDiff(domNodeInfo: Map<UniqueId, NodeInfo>, mgNodeInfo: Map<UniqueId, NodeInfo>): Map<UniqueId, DiffResultInfo> {
  const diffResultEntries = Array.from(domNodeInfo.entries())
    .map(([currentDomNodeId, currentDomNode]) => {
      const targetDeisignNodeId = getSamePositionNode(currentDomNode, mgNodeInfo)
      const designNodeInfo = mgNodeInfo.get(targetDeisignNodeId)
      const currentEl = document.querySelector(`[unique-id="${currentDomNodeId}"]`)
      if (!targetDeisignNodeId || !designNodeInfo) {
        console.error(`当前节点`, currentEl, `在mg中没有找到相同位置的节点`, designNodeInfo, mgNodeInfo)
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
        designMarginInfo: {
          left: designNodeLeftMargin,
          right: designNodeRightMargin,
          top: designNodeTopMargin,
          bottom: designNodeBottomMargin,
        },
        originNodeInfo: currentDomNode,
        designNodeInfo,
      }
      console.log(`🚀 对比节点:${diffResultInfo.designNodeInfo.nodeName}\n`, '节点id', currentDomNodeId, '\n对应的dom:', currentEl, '\n比对结果：', diffResultInfo)
      return [currentDomNodeId, diffResultInfo] as const
    })
    .filter(entry => entry != null)

  return new Map(diffResultEntries)
}
