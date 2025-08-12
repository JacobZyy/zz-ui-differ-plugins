import type { BorderInfo, NodeInfo, PaddingInfo, UniqueId } from '../types'
import { produce } from 'immer'
import { camel, clone } from 'radash'

type PaddingInfoDirection = 'left' | 'right' | 'top' | 'bottom'
const paddingInfoDirectionList = ['left', 'right', 'top', 'bottom'] as const

interface JudgeMergableConfig {
  currentNodeId: UniqueId
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
function judgePaddingMergable({ currentNodeId, position, flatNodeMap }: JudgeMergableConfig) {
  const currentNodeInfo = flatNodeMap.get(currentNodeId)
  // 没有父节点，不需要合并
  if (!currentNodeInfo) {
    return
  }

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
    return
  }
  const { borderWidth, borderColor } = currentNodeInfo.borderInfo
  // 是否存目标方向的有效边框（有宽度、颜色且颜色不为透明且不和背景相同）
  const hasTargetBorderInfo = !!borderWidth[borderWidthKey] && borderColor[borderColorKey] !== 'transparent' && borderColor[borderColorKey] !== currentBgColor
  if (hasBackgroundColor || hasTargetBorderInfo) {
    // 有背景色或者有有效边框，则不需要合并
    return
  }
  return currentNodeInfo.paddingInfo[paddingKey]
}

function handleMergePadding(curNodeInfo: NodeInfo, position: 'left' | 'right' | 'top' | 'bottom', paddingInfo: number) {
  return produce(curNodeInfo, (draft) => {
    if (position === 'left') {
      draft.boundingRect.x += paddingInfo
      draft.boundingRect.width -= paddingInfo
      return
    }
    if (position === 'right') {
      draft.boundingRect.width -= paddingInfo
      return
    }
    if (position === 'top') {
      draft.boundingRect.y += paddingInfo
      draft.boundingRect.height -= paddingInfo
      return
    }
    if (position === 'bottom') {
      draft.boundingRect.height -= paddingInfo
    }
  })
}

export function processPaddingInfo(flatNodeMap: Map<UniqueId, NodeInfo>) {
  const newFlatNodeMap = new Map(Array.from(flatNodeMap.entries()).map(([key, value]) => [key, clone(value)]))
  const floorOrderNodeIdList = Array.from(newFlatNodeMap.keys())
  floorOrderNodeIdList.forEach((nodeId) => {
    paddingInfoDirectionList.forEach((currentPosition) => {
      const paddingInfo = judgePaddingMergable({
        currentNodeId: nodeId,
        flatNodeMap: newFlatNodeMap,
        position: currentPosition,
      })
      const prevNodeInfo = newFlatNodeMap.get(nodeId)
      if (!paddingInfo || !prevNodeInfo) {
        return
      }
      const newNodeInfo = handleMergePadding(prevNodeInfo, currentPosition, paddingInfo)
      newFlatNodeMap.set(nodeId, newNodeInfo)
    })
  })
  return newFlatNodeMap
}
