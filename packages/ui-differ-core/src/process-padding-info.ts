import type { NodeInfo, UniqueId } from './types'
import { produce } from 'immer'
import { camel, clone } from 'radash'
import { getBackgroundColor, getBorderInfo, getPaddingInfo } from './get-dom-style-value'
import { floorOrderTraversal } from './utils/floor-order-traversal'

function getNotTransparentParentBgColor(curDom: Element) {
  const parentDom = curDom.parentElement
  if (!parentDom) {
    return 'transparent'
  }
  const backgroundColor = getBackgroundColor(parentDom)
  if (backgroundColor !== 'transparent') {
    return backgroundColor
  }
  return getNotTransparentParentBgColor(parentDom)
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
function judgePaddingMergable(currentDom: Element, position: 'left' | 'right' | 'top' | 'bottom') {
  const paddingKey = camel(`padding ${position}`)
  const borderWidthKey = camel(`border width ${position}`)
  const borderColorKey = camel(`border color ${position}`)
  const currentBgColor = getBackgroundColor(currentDom)
  const parentBgColor = getNotTransparentParentBgColor(currentDom)
  const hasBackgroundColor = currentBgColor !== 'transparent' && currentBgColor !== parentBgColor
  const paddingInfo = getPaddingInfo(currentDom)
  // 是否存在目标方向的padding
  const hasTargetDirectionPadding = !!paddingInfo[paddingKey]
  if (!hasTargetDirectionPadding) {
    // 没有目标方向的padding，则不需要合并
    return
  }
  const borderInfo = getBorderInfo(currentDom)
  // 是否存目标方向的有效边框（有宽度、颜色且颜色不为透明且不和背景相同）
  const hasTargetBorderInfo = !!borderInfo.borderWidth[borderWidthKey] && borderInfo.borderColor[borderColorKey] !== 'transparent' && borderInfo.borderColor[borderColorKey] !== currentBgColor
  if (hasBackgroundColor || hasTargetBorderInfo) {
    // 有背景色或者有有效边框，则不需要合并
    return
  }
  return paddingInfo[paddingKey]
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

const paddingInfoDirectionList = ['left', 'right', 'top', 'bottom'] as const

export function processPaddingInfo(rootNode: NodeInfo, flatNodeMap: Map<UniqueId, NodeInfo>) {
  const newFlatNodeMap = new Map(Array.from(flatNodeMap.entries()).map(([key, value]) => [key, clone(value)]))
  const rootId = rootNode.uniqueId
  const floorOrderIdList = Array.from(floorOrderTraversal(rootId, newFlatNodeMap))
  floorOrderIdList.forEach((nodeId) => {
    const currentDom = document.querySelector(`[unique-id="${nodeId}"]`)
    if (!currentDom) {
      return
    }
    paddingInfoDirectionList.forEach((currentPosition) => {
      const paddingInfo = judgePaddingMergable(currentDom, currentPosition)
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
