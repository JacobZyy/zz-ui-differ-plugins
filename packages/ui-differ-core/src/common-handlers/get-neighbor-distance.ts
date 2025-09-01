import type { NodeInfo, SiblingPosition, UniqueId } from '../types'
import { produce } from 'immer'
import { convertPositionToBoundingKeys, currentNodeToSiblingPositionMap, validateSiblingPosList } from '../types'

/**
 * @description 判断当前节点与目标节点的兄弟关系
 * @description 当既不是父节点又不是兄弟节点时，需要向上递归查找结果
 * @param currentNodeInfo 当前节点信息
 * @param targetNodeId 目标节点id
 * @param flatNodeMap 扁平化节点信息
 * @returns 'sibling' | 'parent'
 */
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

/**
 * @description 获取当前节点与兄弟节点之间目标方向上的距离
 * @description 该函数计算当前节点与兄弟节点之间的距离，通过计算当前节点的 boundingRect 的某些 key 的值
 *              与兄弟节点的 boundingRect 的某些 key 的值的差值，并返回绝对值
 * @param currentNodeInfo 当前节点信息
 * @param siblingNodeInfo 兄弟节点信息
 * @param direction 目标方向
 * @returns 两个节点之间的距离
 */
export function getDistanceWidthSiblingNode(currentNodeInfo: NodeInfo, siblingNodeInfo: NodeInfo, direction: SiblingPosition) {
  const { boundingRect: currentRect } = currentNodeInfo
  const { boundingRect: siblingRect } = siblingNodeInfo

  const currentBoundingKeys = convertPositionToBoundingKeys[direction]
  const siblingDirection = currentNodeToSiblingPositionMap[direction]

  const siblingBoundingKeys = convertPositionToBoundingKeys[siblingDirection]

  const currentValue = currentBoundingKeys.reduce((acc, key) => acc + currentRect[key], 0)
  const siblingValue = siblingBoundingKeys.reduce((acc, key) => acc + siblingRect[key], 0)
  return Math.abs(currentValue - siblingValue)
}

/**
 * 获取当前节点与父节点之间目标方向上的距离
 * @param childNode 当前节点信息
 * @param parentNodeInfo 父节点信息
 */
export function getDistanceWithParentNode(childNode: NodeInfo, parentNodeInfo: NodeInfo, direction: SiblingPosition) {
  const { boundingRect: childRect } = childNode
  const { boundingRect: parentRect } = parentNodeInfo
  const targetKeys = convertPositionToBoundingKeys[direction]
  const childValue = targetKeys.reduce((acc, curKey) => acc += childRect[curKey], 0)
  const parentValue = targetKeys.reduce((acc, curKey) => acc += parentRect[curKey], 0)
  return Math.abs(childValue - parentValue)
}

const distanceCalculateFnMap = {
  parent: getDistanceWithParentNode,
  sibling: getDistanceWidthSiblingNode,
} as const

export const getNeighborNodeDistance = produce((flatNodeMap: Map<UniqueId, NodeInfo>) => {
  flatNodeMap.forEach((currentNodeInfo) => {
    validateSiblingPosList.forEach((direction) => {
      const neighborNodeId = currentNodeInfo[direction]
      const neighborNodeInfo = flatNodeMap.get(neighborNodeId || '')
      if (!neighborNodeId || !neighborNodeInfo) {
        currentNodeInfo.neighborMarginInfo[direction] = { isParent: false, value: 0, isDirectlySibling: false }
        return
      }
      const neighborNodeType = getIsSiblingOrParents(currentNodeInfo, neighborNodeId, flatNodeMap)
      const distanceCalculateFn = distanceCalculateFnMap[neighborNodeType]
      const distanceValue = distanceCalculateFn(currentNodeInfo, neighborNodeInfo, direction)
      const isParentNode = neighborNodeType === 'parent'
      const isSiblingNode = currentNodeInfo.sibling.includes(neighborNodeId)
      currentNodeInfo.neighborMarginInfo[direction] = { isParent: isParentNode, value: distanceValue || 0, isDirectlySibling: isSiblingNode }
    })
  })
})
