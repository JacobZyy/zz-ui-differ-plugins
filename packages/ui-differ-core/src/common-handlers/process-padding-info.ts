import type { BorderInfo, NodeInfo, PaddingInfo, UniqueId } from '../types'
import { produce } from 'immer'
import { camel, clone } from 'radash'
import { SiblingPosition } from '../types'
import { getDistanceWithParentNode } from './get-neighbor-distance'

type PaddingInfoDirection = 'left' | 'right' | 'top' | 'bottom'
const paddingInfoDirectionList = ['left', 'right', 'top', 'bottom'] as const

const paddingDirectionToSiblingPosition: Record<PaddingInfoDirection, SiblingPosition> = {
  left: SiblingPosition.LEFT,
  right: SiblingPosition.RIGHT,
  top: SiblingPosition.TOP,
  bottom: SiblingPosition.BOTTOM,
}

interface JudgeMergableConfig {
  currentNodeInfo: NodeInfo
  position: PaddingInfoDirection
  flatNodeMap: Map<UniqueId, NodeInfo>
}

function getNotTransparentParentBgColor(currentNodeInfo: NodeInfo, flatNodeMap: Map<UniqueId, NodeInfo>) {
  const backgroundColor = currentNodeInfo.backgroundColor
  if (backgroundColor !== 'transparent') {
    return backgroundColor
  }
  const parentNodeInfo = flatNodeMap.get(currentNodeInfo.parentId)
  if (!parentNodeInfo) {
    return 'transparent'
  }
  return getNotTransparentParentBgColor(parentNodeInfo, flatNodeMap)
}

/**
 * 判断是否可以合并目标方向的padding
 * 可被合并的条件如下
 * 1. 对应的padding外侧有border
 * 2. 有background，且background与父节点的background不同
 * @param nodeInfo 当前节点信息
 * @param position 目标方向
 * @returns padding值，如果不能合并，则返回undefined
 */
function judgePaddingMergable({ currentNodeInfo, position, flatNodeMap }: JudgeMergableConfig) {
  const paddingKey = camel(`padding ${position}`) as keyof PaddingInfo
  const borderWidthKey = camel(`border width ${position}`) as keyof BorderInfo['borderWidth']
  const borderColorKey = camel(`border color ${position}`) as keyof BorderInfo['borderColor']

  // 当前节点的背景色
  const currentBgColor = currentNodeInfo.backgroundColor
  // 当前节点的背景色是背景图，或者当前节点的背景色和父节点的背景色不同
  const hasBackgroundColor = currentBgColor === 'background-image' || (currentBgColor !== 'transparent' && currentBgColor !== getNotTransparentParentBgColor(currentNodeInfo, flatNodeMap))
  // 是否存在目标方向的padding
  const hasTargetDirectionPadding = !!currentNodeInfo.paddingInfo[paddingKey]
  if (!hasTargetDirectionPadding) {
    // 没有目标方向的padding，则不需要合并
    return 0
  }
  const { borderWidth, borderColor } = currentNodeInfo.borderInfo
  // 是否存目标方向的有效边框（有宽度、颜色且颜色不为透明且不和背景相同）
  const hasTargetBorderInfo = !!borderWidth[borderWidthKey] && borderColor[borderColorKey] !== 'transparent' && borderColor[borderColorKey] !== currentBgColor
  if (hasBackgroundColor || hasTargetBorderInfo) {
    // 有背景色或者有有效边框，则不需要合并
    return 0
  }
  return currentNodeInfo.paddingInfo[paddingKey]
}

/**
 * 合并padding
 * @param curNodeInfo 当前节点信息
 * @param position 目标方向
 * @param paddingInfo 目标方向的padding值
 * @returns 合并后的节点信息
 */
function handleMergePadding(curNodeInfo: NodeInfo, position: 'left' | 'right' | 'top' | 'bottom', paddingInfo: number) {
  const clonedBoundingRect = clone(curNodeInfo.boundingRect)

  if (position === 'left') {
    clonedBoundingRect.x += paddingInfo
    clonedBoundingRect.width -= paddingInfo
  }
  if (position === 'right') {
    clonedBoundingRect.width -= paddingInfo
  }
  if (position === 'top') {
    clonedBoundingRect.y += paddingInfo
    clonedBoundingRect.height -= paddingInfo
  }
  if (position === 'bottom') {
    clonedBoundingRect.height -= paddingInfo
  }

  return clonedBoundingRect
}

/**
 * 获取当前节点与父节点之间目标方向上的距离
 * @param currentNodeInfo 当前节点信息
 * @param direction 目标方向
 * @param flatNodeMap 扁平化节点信息
 * @returns
 */
function handleGetEdgeChildNodesInternalGap(currentNodeInfo: NodeInfo, direction: PaddingInfoDirection, flatNodeMap: Map<UniqueId, NodeInfo>) {
  const currentPosition = paddingDirectionToSiblingPosition[direction]
  const targetDirectionChildren = currentNodeInfo.children
    ?.filter((childId) => {
      const childNodeInfo = flatNodeMap.get(childId)
      const { initialNeighborInfos } = childNodeInfo || {}
      if (!initialNeighborInfos) {
        return false
      }
      return !initialNeighborInfos[currentPosition]
    })
    ?.map(childId => flatNodeMap.get(childId)!)

  const targetDirectionDistanceList = targetDirectionChildren.map(childNode => getDistanceWithParentNode(childNode, currentNodeInfo, currentPosition))

  if (!targetDirectionDistanceList.length) {
    return 0
  }
  const targetGapValue = Math.min(...targetDirectionDistanceList)
  return targetGapValue
}

export const processPaddingInfo = produce((flatNodeMap: Map<UniqueId, NodeInfo>) => {
  const entries = Array.from(flatNodeMap.entries()).toReversed()
  entries.forEach(([nodeId]) => {
    paddingInfoDirectionList.forEach((currentPosition) => {
      const currentNodeInfo = flatNodeMap.get(nodeId)!
      // 第一步，坍缩作为外边距的padding
      const paddingInfo = judgePaddingMergable({
        currentNodeInfo,
        flatNodeMap,
        position: currentPosition,
      })
      const paddingMergedBoundingRect = handleMergePadding(currentNodeInfo, currentPosition, paddingInfo)
      currentNodeInfo.boundingRect = paddingMergedBoundingRect

      // 第二步，与子节点之间的内边距
      const targetGapValue = handleGetEdgeChildNodesInternalGap(currentNodeInfo, currentPosition, flatNodeMap)
      const gapMergedBoundingRect = handleMergePadding(currentNodeInfo, currentPosition, targetGapValue)
      currentNodeInfo.boundingRect = gapMergedBoundingRect
    })
  })
})
