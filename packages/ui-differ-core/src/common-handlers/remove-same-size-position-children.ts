import type { NodeInfo, UniqueId } from '../types'
import { produce } from 'immer'
import { SiblingPosition } from '../types'
import { isSameDistance } from '../utils/compare-distance'

/**
 * 替换目标位置的节点
 * @param sourceId 需要被替换的节点
 * @param targetId 取代的节点
 * @param originIdList 原始的节点列表
 * @returns 新的节点列表
 */
function replaceTargetPositionNode(sourceId: UniqueId, targetId: UniqueId, originIdList: UniqueId[]) {
  return originIdList.map((id) => {
    if (id === sourceId) {
      return targetId
    }
    if (id === targetId) {
      return null
    }
    return id
  }).filter(it => it != null)
}

/**
 * 合并父节点信息到子节点中
 * @param parentNodeInfo 父节点信息
 * @param childNodeInfo 子节点信息
 * @returns 合并后的节点信息
 */
function mergeParentNodeIntoChildNode(parentNodeInfo: NodeInfo, childNodeInfo: NodeInfo) {
  // 合并父子节点信息
  // NODE!: 这里合并会丢一些后续用不到的信息
  const mergedNodeInfo: NodeInfo = {
    nodeName: childNodeInfo.nodeName,
    uniqueId: childNodeInfo.uniqueId,
    children: childNodeInfo.children,
    boundingRect: childNodeInfo.boundingRect,
    parentId: parentNodeInfo.parentId,
    paddingInfo: childNodeInfo.paddingInfo,
    borderInfo: childNodeInfo.borderInfo,
    backgroundColor: childNodeInfo.backgroundColor,
    originBounding: childNodeInfo.originBounding,
    isBFC: childNodeInfo.isBFC,
    isEmptyNode: childNodeInfo.isEmptyNode,
    isOutOfDocumentFlow: childNodeInfo.isOutOfDocumentFlow,
    textStyleInfo: childNodeInfo.textStyleInfo,
    nodeFlexInfo: parentNodeInfo.nodeFlexInfo,
    // 判断的逻辑是父节点只有一个子节点
    // 所以可以直接把父节点的兄弟节点作为该子节点的兄弟节点
    sibling: parentNodeInfo.sibling,
    initialNeighborInfos: parentNodeInfo.initialNeighborInfos,
    neighborMarginInfo: parentNodeInfo.neighborMarginInfo,
    // 相邻节点同步为父节点的相邻节点
    [SiblingPosition.TOP]: parentNodeInfo[SiblingPosition.TOP],
    [SiblingPosition.BOTTOM]: parentNodeInfo[SiblingPosition.BOTTOM],
    [SiblingPosition.LEFT]: parentNodeInfo[SiblingPosition.LEFT],
    [SiblingPosition.RIGHT]: parentNodeInfo[SiblingPosition.RIGHT],

  }
  return mergedNodeInfo
}

function updateOtherNodeInfo(parentNodeId: UniqueId, replaceChildNodeId: UniqueId, currentNodeInfo: NodeInfo) {
  const {
    sibling,
    children,
    [SiblingPosition.TOP]: topNodeId,
    [SiblingPosition.BOTTOM]: bottomNodeId,
    [SiblingPosition.LEFT]: leftNodeId,
    [SiblingPosition.RIGHT]: rightNodeId,
    ...restNodeInfo
  } = currentNodeInfo
  const newSibling = replaceTargetPositionNode(parentNodeId, replaceChildNodeId, sibling)
  const newChildren = replaceTargetPositionNode(replaceChildNodeId, parentNodeId, children)
  const newTopNodeId = topNodeId === parentNodeId ? replaceChildNodeId : topNodeId
  const newBottomNodeId = bottomNodeId === parentNodeId ? replaceChildNodeId : bottomNodeId
  const newLeftNodeId = leftNodeId === parentNodeId ? replaceChildNodeId : leftNodeId
  const newRightNodeId = rightNodeId === parentNodeId ? replaceChildNodeId : rightNodeId
  return {
    sibling: newSibling,
    children: newChildren,
    [SiblingPosition.TOP]: newTopNodeId,
    [SiblingPosition.BOTTOM]: newBottomNodeId,
    [SiblingPosition.LEFT]: newLeftNodeId,
    [SiblingPosition.RIGHT]: newRightNodeId,
    ...restNodeInfo,
  }
}

export async function removeSameSizePositionChildren(flatNodeMap: Map<UniqueId, NodeInfo>) {
  // 原层序的顺序
  const floorNodeIdList = Array.from(flatNodeMap.keys())

  // 需要取代的节点的键值对 key: 需要被取代的节点，value: 取代的节点
  const nodeIdReplaceEntries = Array.from(floorNodeIdList).map((currentNodeId: UniqueId) => {
    const curNode = flatNodeMap.get(currentNodeId)
    const childrenList = curNode?.children || []
    if (!curNode || childrenList.length !== 1)
      return null

    const childNodeId = childrenList[0]
    const childNode = flatNodeMap.get(childNodeId)
    if (!childNode)
      return null
    const { width, height, x, y } = childNode.boundingRect
    const originEl = document.querySelector(`[unique-id="${currentNodeId}"]`)
    const childEl = document.querySelector(`[unique-id="${childNodeId}"]`)
    const isSameSize = isSameDistance(curNode.boundingRect.width, width) && isSameDistance(curNode.boundingRect.height, height)
    const isSamePosition = isSameDistance(curNode.boundingRect.x, x) && isSameDistance(curNode.boundingRect.y, y)
    if (!isSameSize || !isSamePosition)
      return null
    // 如果当前节点和子节点尺寸和位置相同，则返回当前节点id(需要被排除)
    return [currentNodeId, childNodeId] as const
  }).filter(it => it != null)
  if (nodeIdReplaceEntries.length === 0) {
    return flatNodeMap
  }

  // 更新层序的顺序
  const newFloorNodeIdList = produce(floorNodeIdList, (draft) => {
    nodeIdReplaceEntries.forEach(([parentNodeId, replaceChildNodeId]) => {
      draft = replaceTargetPositionNode(parentNodeId, replaceChildNodeId, draft)
    })
  })

  /** key: 需要被取代的节点，value: 取代的节点 */
  const nodeIdReplaceMap = new Map(nodeIdReplaceEntries)

  const updatedFlatMap = produce(flatNodeMap, (draftNodeMap) => {
    draftNodeMap.forEach((nodeInfo, nodeId) => {
      const replaceChildNodeId = nodeIdReplaceMap.get(nodeId)
      // 如果当前不是被替换的节点，则需要更新当前节点中的所有替换关系
      if (!replaceChildNodeId) {
        nodeIdReplaceMap.forEach((replaceChildNodeId, parentNodeId) => {
          const newNodeInfo = updateOtherNodeInfo(parentNodeId, replaceChildNodeId, nodeInfo)
          draftNodeMap.set(nodeId, newNodeInfo)
        })
        return
      }

      const replaceChildNodeInfo = draftNodeMap.get(replaceChildNodeId)
      if (!replaceChildNodeInfo)
        return
      // 如果当前是替换的节点，则需要更新当前节点中的替换关系
      const newNodeInfo = mergeParentNodeIntoChildNode(nodeInfo, replaceChildNodeInfo)
      draftNodeMap.set(nodeId, newNodeInfo)
    })
  })

  // 调整层序的顺序
  const resultMapEntries = newFloorNodeIdList
    .map((nodeId) => {
      const nodeInfo = updatedFlatMap.get(nodeId)
      if (!nodeInfo)
        return null
      return [nodeId, nodeInfo] as const
    })
    .filter(it => it != null)

  const newFlatMap = new Map<UniqueId, NodeInfo>(resultMapEntries)
  return removeSameSizePositionChildren(newFlatMap)
}
