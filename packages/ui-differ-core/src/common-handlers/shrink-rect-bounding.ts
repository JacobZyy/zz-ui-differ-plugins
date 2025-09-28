import type { NodeInfo, UniqueId } from '../types'
import { produce } from 'immer'
import { convertDirectionKeyToBoudingKeys } from '../types'

type PaddingInfoDirection = 'left' | 'right' | 'top' | 'bottom'
const paddingInfoDirectionList = ['left', 'right', 'top', 'bottom'] as const

/**
 * 获取当前节点下，目标方向的最小距离
 * @param currentNode 当前节点
 * @param currentPosition 目标方向
 * @param flatNodeMap 扁平化节点map
 * @returns
 */
function getMinChildrenPositionDistance(currentNode: NodeInfo, currentPosition: PaddingInfoDirection, flatNodeMap: Map<UniqueId, NodeInfo>) {
  const boundingKeyList = convertDirectionKeyToBoudingKeys[currentPosition]
  const currentNodeTargetPosValue = boundingKeyList.reduce((acc, cur) => acc + currentNode.boundingRect[cur], 0)
  // 左上取小，右下取大
  const targetPositionGetter = currentPosition === 'left' || currentPosition === 'top' ? 'min' : 'max'
  const targetPositionChildren = currentNode.children
    .map((childId) => {
      const childNode = flatNodeMap.get(childId)!
      const childTargetValue = boundingKeyList.reduce((acc, cur) => acc + childNode.boundingRect[cur], 0)
      return childTargetValue
    })

  const targetChildValue = targetPositionChildren?.length ? Math[targetPositionGetter](...targetPositionChildren) : 0

  if (targetPositionGetter === 'min') {
    if (targetChildValue < currentNodeTargetPosValue) {
      return 0
    }
    return targetChildValue - currentNodeTargetPosValue
  }
  if (targetPositionGetter === 'max') {
    if (targetChildValue > currentNodeTargetPosValue) {
      return 0
    }
    return currentNodeTargetPosValue - targetChildValue
  }

  return 0
}

export const shrinkRectBounding = produce((flatNodeMap: Map<UniqueId, NodeInfo>) => {
  console.log('🚀 ~ shrinkRectBounding ~ flatNodeMap:', flatNodeMap)
  const entries = Array.from(flatNodeMap.entries()).toReversed()
  // 反向遍历
  entries.forEach(([nodeId]) => {
    const currentNodeInfo = flatNodeMap.get(nodeId)!
    if (!currentNodeInfo.children.length)
      return

    // 找当前节点下的子节点里的最小边距
    paddingInfoDirectionList.forEach((currentPosition) => {
      // 子节点中，目标方向的最小距离
      const targetPositionDistance = getMinChildrenPositionDistance(currentNodeInfo, currentPosition, flatNodeMap)
      // 把当前节点这个方向的位置减少对应的值
      if (currentPosition === 'left') {
        currentNodeInfo.boundingRect.x += targetPositionDistance
        currentNodeInfo.boundingRect.width -= targetPositionDistance
      }
      if (currentPosition === 'right') {
        currentNodeInfo.boundingRect.width -= targetPositionDistance
      }
      if (currentPosition === 'top') {
        currentNodeInfo.boundingRect.y += targetPositionDistance
        currentNodeInfo.boundingRect.height -= targetPositionDistance
      }
      if (currentPosition === 'bottom') {
        currentNodeInfo.boundingRect.height -= targetPositionDistance
      }
    })

    console.log('🚀 ~ currentNodeInfo.textStyleInfo:', !!currentNodeInfo.textStyleInfo)
    if (!currentNodeInfo.textStyleInfo)
      return
    // 只有内部节点是文本节点的节点，把宽度设置为父节点的宽度
    const parentNodeInfo = flatNodeMap.get(currentNodeInfo.parentId)
    console.log('🚀 ~ parentNodeInfo:', parentNodeInfo)
    if (!parentNodeInfo)
      return
    currentNodeInfo.boundingRect.x = parentNodeInfo.boundingRect.x
    currentNodeInfo.boundingRect.width = parentNodeInfo.boundingRect.width
  })
},
)
