import type { BoundingRect, NodeInfo } from '../types'
import type { NodeWithChild } from '../types/designNode'
import { nodeWithChildSet } from '../types/designNode'
import { floorOrderTraversalWithNode } from '../utils/floor-order-traversal'
import { getBackgroundColor, getBorderInfo, getPaddingInfo } from './get-design-style-value'

function processSingleDesignNodeInfo(designNode: SceneNode) {
  const nodeId = designNode.id
  if (!nodeId)
    return
  const boundingRect = designNode.absoluteBoundingBox

  const realBoundingRect: BoundingRect = {
    x: boundingRect.x,
    y: boundingRect.y,
    width: boundingRect.width,
    height: boundingRect.height,
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
  const flatNodeMapEntries = floorOrderNodeList.map((designNode) => {
    const nodeInfo = processSingleDesignNodeInfo(designNode)
    if (!nodeInfo)
      return null
    return [nodeInfo.uniqueId, nodeInfo] as const
  }).filter(entry => entry != null)
  return new Map(flatNodeMapEntries)
}
