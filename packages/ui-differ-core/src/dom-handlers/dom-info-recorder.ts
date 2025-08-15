import type { BoundingRect, NodeInfo } from '../types'
import { floorOrderTraversalWithDom } from '../utils/floor-order-traversal'
import { getBackgroundColor, getBorderInfo, getPaddingInfo } from './get-dom-style-value'

function processSingleDomNodeInfo(domNode: Element) {
  const nodeId = domNode.getAttribute('unique-id')
  if (!nodeId)
    return
  const boundingRect = domNode.getBoundingClientRect()

  const realBoundingRect: BoundingRect = {
    x: boundingRect.x,
    y: boundingRect.y + window.scrollY,
    width: boundingRect.width,
    height: boundingRect.height,
  }

  const nodeName = `.${Array.from(domNode.classList).join('.')}`

  // 获取子节点id
  const childrenIds = Array.from(domNode.children).map(child => child.getAttribute('unique-id')).filter(id => id != null)
  const parentId = domNode.parentElement?.getAttribute('unique-id')
  const siblingIds = Array.from(domNode.parentElement?.children || []).map(sibling => sibling.getAttribute('unique-id')).filter(id => id !== nodeId).filter(id => id != null)
  const borderInfo = getBorderInfo(domNode)
  const paddingInfo = getPaddingInfo(domNode)
  const backgroundColor = getBackgroundColor(domNode)
  const newNode: NodeInfo = {
    nodeName,
    uniqueId: nodeId,
    boundingRect: realBoundingRect,
    parentId: parentId || '',
    children: childrenIds,
    sibling: siblingIds,
    borderInfo,
    paddingInfo,
    backgroundColor,
  }
  return newNode
}

/** 打平dom树，绑定当前节点的父节点、子节点、兄弟节点信息（仅需要uniqueId）以及当前节点的boundingRect */
export function onDomInfoRecorder(rootDom: HTMLElement) {
  const floorOrderDomList = Array.from(floorOrderTraversalWithDom(rootDom))
  const flatNodeMapEntries = floorOrderDomList.map((domNode) => {
    const nodeInfo = processSingleDomNodeInfo(domNode)
    if (!nodeInfo)
      return null
    return [nodeInfo?.uniqueId, nodeInfo] as const
  }).filter(entry => entry != null)
  return new Map(flatNodeMapEntries)
}
