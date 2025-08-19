import type { BorderInfo, NodeInfo, PaddingInfo, UniqueId } from '../types'
import { produce } from 'immer'
import { camel } from 'radash'
import { SiblingPosition } from '../types'

type PaddingInfoDirection = 'left' | 'right' | 'top' | 'bottom'
const paddingInfoDirectionList = ['left', 'right', 'top', 'bottom'] as const

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

/**
 * 合并padding
 * @param curNodeInfo 当前节点信息
 * @param position 目标方向
 * @param paddingInfo 目标方向的padding值
 * @returns 合并后的节点信息
 */
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
/**
 * 获取指定方向上最边缘的子节点
 * @param currentNodeInfo 当前节点信息
 * @param direction 目标方向
 * @param flatNodeMap 扁平化节点信息
 * @returns 该方向最边缘的子节点信息
 */
function getEdgeChildNodes(
  currentNodeInfo: NodeInfo,
  direction: PaddingInfoDirection,
  flatNodeMap: Map<UniqueId, NodeInfo>,
): NodeInfo[] {
  const children = currentNodeInfo.children || []

  const directionToSiblingPosition: Record<PaddingInfoDirection, SiblingPosition> = {
    top: SiblingPosition.TOP,
    bottom: SiblingPosition.BOTTOM,
    left: SiblingPosition.LEFT,
    right: SiblingPosition.RIGHT,
  }

  const targetPosition = directionToSiblingPosition[direction]

  return children
    .map(childId => flatNodeMap.get(childId))
    .filter((childNodeInfo): childNodeInfo is NodeInfo => !!childNodeInfo)
    .filter((childNodeInfo) => {
      if (!childNodeInfo.initialNeighborInfos) {
        return false
      }
      return !childNodeInfo.initialNeighborInfos[targetPosition]
    })
}

/**
 * 合并内部间距到padding中
 * @param currentNodeInfo 当前节点信息
 * @param direction 方向
 * @param gapValue 间距值
 * @returns 更新后的节点信息
 */
function handleMergeInternalGap(
  currentNodeInfo: NodeInfo,
  direction: PaddingInfoDirection,
  gapValue: number,
): NodeInfo {
  return produce(currentNodeInfo, (draft) => {
    const paddingKey = camel(`padding ${direction}`) as keyof PaddingInfo

    // 将间距添加到对应方向的padding中
    draft.paddingInfo[paddingKey] += gapValue

    // 相应调整boundingRect，缩小父元素的视觉边界
    switch (direction) {
      case 'left':
        draft.boundingRect.x += gapValue
        draft.boundingRect.width -= gapValue
        draft.paddingInfo.paddingLeft += gapValue
        break
      case 'right':
        draft.boundingRect.width -= gapValue
        draft.paddingInfo.paddingRight += gapValue
        break
      case 'top':
        draft.boundingRect.y += gapValue
        draft.boundingRect.height -= gapValue
        draft.paddingInfo.paddingTop += gapValue
        break
      case 'bottom':
        draft.boundingRect.height -= gapValue
        draft.paddingInfo.paddingBottom += gapValue
        break
    }
  })
}
export async function processPaddingInfo(flatNodeMap: Map<UniqueId, NodeInfo>) {
  const flatNodeMapWithPaddingMerged = produce(flatNodeMap, (newFlatNodeMap) => {
    newFlatNodeMap.forEach((currentNodeInfo, nodeId) => {
      paddingInfoDirectionList.forEach((currentPosition) => {
        const paddingInfo = judgePaddingMergable({
          currentNodeInfo,
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
  })
  const finalMergedFlatNodeMap = produce(flatNodeMapWithPaddingMerged, (newFlatNodeMap) => {
    newFlatNodeMap.forEach((currentNodeInfo, nodeId) => {
      if (!currentNodeInfo.children?.length) {
        return
      }

      paddingInfoDirectionList.forEach((direction) => {
        // 边界上的子节点
        const edgeChildNodes = getEdgeChildNodes(currentNodeInfo, direction, flatNodeMap)
        // 边界上的子节点为空，则不需要合并
        if (edgeChildNodes.length === 0) {
          return
        }
        const paddingKey = camel(`padding ${direction}`) as keyof PaddingInfo
        // 边界上的子节点，获取其padding值
        const gaps = edgeChildNodes.map((childNode) => {
          const paddingValue = childNode.paddingInfo[paddingKey] || 0
          return paddingValue
        })
        if (gaps.length === 0) {
          return
        }
        // 获取最小padding值
        const internalGap = Math.min(...gaps)
        // 合并内部间距到padding中
        const resultNodeInfo = handleMergeInternalGap(currentNodeInfo, direction, internalGap)
        newFlatNodeMap.set(nodeId, resultNodeInfo)

        // 处理边界节点中的padding
        edgeChildNodes.forEach((childNode) => {
          const newChildNode = {
            ...childNode,
            paddingInfo: {
              ...childNode.paddingInfo,
              [paddingKey]: childNode.paddingInfo[paddingKey] - internalGap,
            },
          }
          newFlatNodeMap.set(childNode.uniqueId, newChildNode)
        })
      })
    })
  })

  return finalMergedFlatNodeMap
}
