import type { BorderInfo, NodeInfo, PaddingInfo, UniqueId } from '../types'
import { camel } from 'radash'

type PaddingInfoDirection = 'left' | 'right' | 'top' | 'bottom'
interface JudgeMergableConfig {
  currentNodeInfo: NodeInfo
  position: PaddingInfoDirection
  flatNodeMap: Map<UniqueId, NodeInfo>
}

/**
 * 获取当前节点的不是透明色的父节点的背景色背景色
 * @param currentNodeInfo 当前节点信息
 * @param flatNodeMap 扁平化节点信息
 * @returns
 */
function getNotTransparentParentBgColor(parentNodeId: UniqueId, flatNodeMap: Map<UniqueId, NodeInfo>) {
  const parentNode = flatNodeMap.get(parentNodeId)
  if (!parentNode) {
    return 'transparent'
  }
  const parentBg = parentNode.backgroundColor
  if (parentBg !== 'transparent') {
    return parentBg
  }
  return getNotTransparentParentBgColor(parentNode.parentId, flatNodeMap)
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
export function judgePaddingMergable({ currentNodeInfo, position, flatNodeMap }: JudgeMergableConfig): boolean {
  const borderWidthKey = camel(`border width ${position}`) as keyof BorderInfo['borderWidth']
  const borderColorKey = camel(`border color ${position}`) as keyof BorderInfo['borderColor']

  // 当前节点的背景色
  const currentBgColor = currentNodeInfo.backgroundColor
  // 当前节点的背景色是背景图，或者当前节点的背景色和父节点的背景色不同
  const hasBackgroundColor = currentBgColor === 'background-image' || (currentBgColor !== 'transparent' && currentBgColor !== getNotTransparentParentBgColor(currentNodeInfo.parentId, flatNodeMap))
  const { borderWidth, borderColor } = currentNodeInfo.borderInfo
  // 是否存目标方向的有效边框（有宽度、颜色且颜色不为透明且不和背景相同）
  const hasTargetBorderInfo = !!borderWidth[borderWidthKey] && borderColor[borderColorKey] !== 'transparent' && borderColor[borderColorKey] !== currentBgColor
  if (hasBackgroundColor || hasTargetBorderInfo) {
    // 有背景色或者有有效边框，则不需要合并
    return false
  }
  return true
}

export function getTargetDirectionPaddingValue({ currentNodeInfo, position }: JudgeMergableConfig) {
  const paddingKey = camel(`padding ${position}`) as keyof PaddingInfo
  // 是否存在目标方向的padding
  const targetDirectionPaddingValue = currentNodeInfo.paddingInfo[paddingKey]
  return targetDirectionPaddingValue || 0
}
