import type { BorderInfo, NodeInfo, PaddingInfo, UniqueId } from '../types'
import { produce } from 'immer'
import { camel } from 'radash'
import { SiblingPosition } from '../types'
import { getDomMarginInfo } from './get-dom-style-value'

type MarginInfoDirection = 'top' | 'bottom'
const marginInfoDirectionList = ['top', 'bottom'] as const

/**
 * 判断是否需要合并margin
 * @param currentNodeInfo 当前节点信息
 * @param position 目标方向
 * @returns 是否需要合并margin
 */
function judgeMarginCollapsing({ currentNodeInfo, position }: { currentNodeInfo: NodeInfo, position: MarginInfoDirection }) {
  const { paddingInfo, backgroundColor, borderInfo, isBFC } = currentNodeInfo
  const paddingKey = camel(`padding ${position}`) as keyof PaddingInfo
  const borderWidthKey = camel(`border width ${position}`) as keyof BorderInfo['borderWidth']
  const borderColorKey = camel(`border color ${position}`) as keyof BorderInfo['borderColor']
  const borderWidth = borderInfo?.borderWidth?.[borderWidthKey]
  const borderColor = borderInfo?.borderColor?.[borderColorKey]
  const hasTargetDirectionPadding = paddingInfo?.[paddingKey]
  const hasTargetBorderInfo = !!borderWidth && !!borderColor && borderColor !== 'transparent' && borderColor !== backgroundColor

  // 如果是bfc，并且没有有效的padding、border
  // 则需要把最上方或者最下方的子节点的margin造成的撑大的边框给排除出去
  const shouldMergeMargin = !!isBFC && !hasTargetDirectionPadding && !hasTargetBorderInfo

  return shouldMergeMargin
}

/**
 * 获取需要合并的margin信息
 * @param currentNodeInfo 当前节点信息
 * @param flatNodeMap 扁平化节点信息
 * @returns 需要合并的margin信息
 */
function getMarginInfoForMerge(currentNodeInfo: NodeInfo, flatNodeMap: Map<UniqueId, NodeInfo>): Record<MarginInfoDirection, number> {
  const children = currentNodeInfo?.children || []

  // 最上方的子节点
  const topChildNodeMarginInfo = children
    .filter((childId) => {
      const childNodeInfo = flatNodeMap.get(childId)
      if (!childNodeInfo) {
        return true
      }
      const topPositionNode = childNodeInfo.initialNeighborInfos?.[SiblingPosition.TOP]
      return !topPositionNode
    })
    .map((childId) => {
      const childNodeInfo = flatNodeMap.get(childId)
      const element = document.querySelector(`[unique-id="${childId}"]`)
      if (!childNodeInfo || !element)
        return undefined
      const marginInfo = getDomMarginInfo(element)
      return marginInfo.marginTop
    })
    .filter(marginInfo => marginInfo !== undefined)

  // 最下方的子节点
  const bottomChildNodeMarginInfo = children
    .filter((childId) => {
      const childNodeInfo = flatNodeMap.get(childId)
      if (!childNodeInfo) {
        return true
      }
      const bottomPositionNode = childNodeInfo.initialNeighborInfos?.[SiblingPosition.BOTTOM]
      return !bottomPositionNode
    })
    .map((childId) => {
      const childNodeInfo = flatNodeMap.get(childId)
      const element = document.querySelector(`[unique-id="${childId}"]`)
      if (!childNodeInfo || !element)
        return undefined
      const marginInfo = getDomMarginInfo(element)
      return marginInfo.marginBottom
    })
    .filter(marginInfo => marginInfo !== undefined)
  // 获取最上方子节点中的最小marginBottom
  const minTopMargin = topChildNodeMarginInfo.length ? Math.min(...topChildNodeMarginInfo) : 0
  const minBottomMargin = bottomChildNodeMarginInfo.length ? Math.min(...bottomChildNodeMarginInfo) : 0
  return {
    top: minTopMargin,
    bottom: minBottomMargin,
  }
}

/**
 * 处理margin合并
 * @param flatNodeMap 扁平化节点信息
 * @returns 处理后的扁平化节点信息
 */
export async function processMarginCollapsing(flatNodeMap: Map<UniqueId, NodeInfo>) {
  return produce(flatNodeMap, (newFlatNodeMap) => {
    newFlatNodeMap.forEach((currentNodeInfo, nodeId) => {
      const shouldMergeDirectionList = marginInfoDirectionList.filter(currentPosition => judgeMarginCollapsing({ currentNodeInfo, position: currentPosition }))
      if (!shouldMergeDirectionList.length) {
        return
      }

      const marginInfoForMerge = getMarginInfoForMerge(currentNodeInfo, newFlatNodeMap)

      shouldMergeDirectionList.forEach((currentPosition) => {
        const targetMarginInfo = marginInfoForMerge[currentPosition]
        if (!targetMarginInfo) {
          return
        }
        // 把因为bfc等原因撑开的margin合并到当前元素的padding里面,
        //  这样这边的合并可以吃到后方的padding合并逻辑
        // NOTE: !不需要处理boundingRect相关的东西，因为会在爬到顶合并的时候统一处理
        if (currentPosition === 'top') {
          currentNodeInfo.paddingInfo.paddingTop += targetMarginInfo
        }
        if (currentPosition === 'bottom') {
          currentNodeInfo.paddingInfo.paddingBottom += targetMarginInfo
        }
      })

      newFlatNodeMap.set(nodeId, currentNodeInfo)
    })
  })
}
