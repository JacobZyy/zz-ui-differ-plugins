import type { NodeInfo, PaddingInfo, UniqueId } from '../types'
import { produce } from 'immer'
import { camel, clone } from 'radash'
import { judgePaddingMergable } from '../utils'

const paddingInfoDirectionList = ['left', 'right', 'top', 'bottom'] as const

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
 * 减去已被合并的padding值
 * @param curNodeInfo 当前节点信息
 * @param position 目标方向
 * @param paddingInfo 目标方向的padding值
 * @returns 减去padding值后的节点信息
 */
function handleSubtractPaddingValue(curNodeInfo: NodeInfo, position: 'left' | 'right' | 'top' | 'bottom', paddingInfo: number) {
  const clonedPaddingInfo = clone(curNodeInfo.paddingInfo)
  const paddingKey = camel(`padding ${position}`) as keyof PaddingInfo
  clonedPaddingInfo[paddingKey] -= paddingInfo
  return clonedPaddingInfo
}

export const processPaddingInfo = produce((flatNodeMap: Map<UniqueId, NodeInfo>) => {
  const entries = Array.from(flatNodeMap.entries()).toReversed()
  entries.forEach(([nodeId]) => {
    paddingInfoDirectionList.forEach((currentPosition) => {
      const currentNodeInfo = flatNodeMap.get(nodeId)!
      // 第一步，坍缩作为外边距的padding
      const targetDirectionPaddingValue = judgePaddingMergable({
        currentNodeInfo,
        flatNodeMap,
        position: currentPosition,
      })
      const paddingMergedBoundingRect = handleMergePadding(currentNodeInfo, currentPosition, targetDirectionPaddingValue)
      const newPaddingInfo = handleSubtractPaddingValue(currentNodeInfo, currentPosition, targetDirectionPaddingValue)
      currentNodeInfo.boundingRect = paddingMergedBoundingRect
      currentNodeInfo.paddingInfo = newPaddingInfo
    })
  })
})
