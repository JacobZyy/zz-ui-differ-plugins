import type { NodeInfo, UniqueId } from '../types'
import { produce } from 'immer'
import { convertPositionToBoundingKeys, SiblingPosition } from '../types'
import { judgePaddingMergable } from '../utils'

type PaddingInfoDirection = 'left' | 'right' | 'top' | 'bottom'
const paddingInfoDirectionList = ['left', 'right', 'top', 'bottom'] as const

const paddingDirectionToSiblingPosition: Record<PaddingInfoDirection, SiblingPosition> = {
  left: SiblingPosition.LEFT,
  right: SiblingPosition.RIGHT,
  top: SiblingPosition.TOP,
  bottom: SiblingPosition.BOTTOM,
}

/**
 * 获取当前节点下，目标方向的最小距离
 * @param currentNode 当前节点
 * @param currentPosition 目标方向
 * @param flatNodeMap 扁平化节点map
 * @returns
 */
function getMinChildrenPositionDistance(currentNode: NodeInfo, currentPosition: PaddingInfoDirection, flatNodeMap: Map<UniqueId, NodeInfo>) {
  const siblingPosition = paddingDirectionToSiblingPosition[currentPosition]
  const boundingKeyList = convertPositionToBoundingKeys[siblingPosition]
  const currentNodeTargetPosValue = boundingKeyList.reduce((acc, cur) => acc + currentNode.boundingRect[cur], 0)
  const targetPositionChildren = currentNode.children
    .map(childId => flatNodeMap.get(childId)!)
    .filter(childNode => !childNode.initialNeighborInfos?.[siblingPosition])
    .map((childNode) => {
      const childTargetValue = boundingKeyList.reduce((acc, cur) => acc + childNode.boundingRect[cur], 0)
      return Math.abs(currentNodeTargetPosValue - childTargetValue)
    })
  if (!targetPositionChildren?.length) {
    return 0
  }
  return Math.min(...targetPositionChildren)
}

export const shrinkRectBounding = produce((flatNodeMap: Map<UniqueId, NodeInfo>) => {
  const entries = Array.from(flatNodeMap.entries()).toReversed()
  // 反向遍历
  entries.forEach(([nodeId]) => {
    const currentNodeInfo = flatNodeMap.get(nodeId)
    if (!currentNodeInfo || !currentNodeInfo.children?.length)
      return
    // 找当前节点下的子节点里的最小边距
    paddingInfoDirectionList.forEach((currentPosition) => {
      const targetDirectionPaddingValue = judgePaddingMergable({
        currentNodeInfo,
        flatNodeMap,
        position: currentPosition,
      })
      if (!targetDirectionPaddingValue) {
        return
      }
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
  })
},
)
