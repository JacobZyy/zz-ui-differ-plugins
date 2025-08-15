import type { BoundingRect, NodeInfo, NodeWithChild, UniqueId } from '../types'
import { nodeWithChildSet } from '../types'
import { floorOrderTraversalWithNode } from '../utils/floor-order-traversal'
import { convertDesignToPx } from './convertDesignToPx'
import { getBackgroundColor, getBorderInfo, getPaddingInfo } from './get-design-style-value'
/** ios部分头的高度 */
const PHONE_HEADER_HEIGHT = 88
/** ios底部安全距离的高度 */
export const SAFE_BOTTOM_HEIGHT = 68

function processSingleDesignNodeInfo(designNode: SceneNode, rootOffset: { x: number, y: number, id: UniqueId }) {
  const nodeId = designNode.id
  // 在上方已经进行过滤了
  const boundingRect = designNode.absoluteRenderBounds!

  const realBoundingRect: BoundingRect = {
    x: convertDesignToPx(boundingRect.x - rootOffset.x),
    // 算y的时候需要把手机头的高度去掉
    y: convertDesignToPx(boundingRect.y - rootOffset.y - PHONE_HEADER_HEIGHT),
    width: convertDesignToPx(boundingRect.width),
    height: convertDesignToPx(boundingRect.height),
  }

  if (nodeId === rootOffset.id) {
    // 根节点，top置为0，height减去上下安全距离
    realBoundingRect.y = 0
    realBoundingRect.height -= (PHONE_HEADER_HEIGHT + SAFE_BOTTOM_HEIGHT)
  }
  const hasChildren = nodeWithChildSet.has(designNode.type)
  // 获取子节点id
  const childrenIds = hasChildren ? Array.from((designNode as NodeWithChild).children).map(child => child.id) : []
  const parentId = designNode.parent?.id
  const siblingIds = Array.from(designNode.parent?.children || []).map(sibling => sibling.id).filter(id => id !== nodeId)
  const paddingInfo = getPaddingInfo(designNode)
  const borderInfo = getBorderInfo(designNode)
  const backgroundColor = getBackgroundColor(designNode)
  const newNode: NodeInfo = {
    uniqueId: nodeId,
    boundingRect: realBoundingRect,
    parentId: parentId || '',
    children: childrenIds,
    sibling: siblingIds,
    paddingInfo,
    borderInfo,
    backgroundColor,
  }
  return newNode
}

export function getDesignInfoRecorder(rootDesignNode: SceneNode) {
  const floorOrderNodeList = Array.from(floorOrderTraversalWithNode(rootDesignNode))
  const rootDesignNodeBoundingRect = rootDesignNode.absoluteRenderBounds
  const rootNodeBoundingOffset = {
    x: rootDesignNodeBoundingRect?.x || 0,
    y: rootDesignNodeBoundingRect?.y || 0,
    id: rootDesignNode.id,
  }

  const flatNodeMapEntries = floorOrderNodeList
    .filter((designNode) => {
      const realBoundingRect = designNode.absoluteRenderBounds
      if (!realBoundingRect || !designNode.id)
        // 没有渲染的节点，或者没有id的节点，直接过滤掉
        return false
      // 位于上下安全区的节点先全都过滤掉
      const isOverTopNode = realBoundingRect.y + realBoundingRect.height <= PHONE_HEADER_HEIGHT
      const isOverBottomNode = realBoundingRect.y >= SAFE_BOTTOM_HEIGHT
      return !isOverTopNode && !isOverBottomNode
    })
    .map((designNode) => {
      // 格式化节点信息
      const nodeInfo = processSingleDesignNodeInfo(designNode, rootNodeBoundingOffset)
      return [nodeInfo.uniqueId, nodeInfo] as const
    })

  const initialNodeMap = new Map(flatNodeMapEntries)

  return initialNodeMap
}
