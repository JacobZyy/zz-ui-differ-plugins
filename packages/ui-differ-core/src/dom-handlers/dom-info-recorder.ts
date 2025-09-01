import type { BoundingRect, NodeInfo } from '../types'
import { floorOrderTraversalWithDom } from '../utils'
import { getDomBackgroundColor, getDomBorderInfo, getDomIsBfc, getDomPaddingInfo } from './get-dom-style-value'

function processSingleDomNodeInfo(domNode: Element, rootDomId: string | null) {
  const nodeId = domNode.getAttribute('unique-id')
  const computedStyle = window.getComputedStyle(domNode)
  if (!nodeId)
    return
  const boundingRect = domNode.getBoundingClientRect()

  const fixedHeight = rootDomId === nodeId ? Math.min(boundingRect.height, document.documentElement.offsetHeight) : boundingRect.height

  const realBoundingRect: BoundingRect = {
    x: boundingRect.x,
    y: boundingRect.y + window.scrollY,
    width: boundingRect.width,
    height: fixedHeight,
  }
  const isInlineNode = computedStyle.display === 'inline'

  if (isInlineNode) {
    const lineHeight = computedStyle.lineHeight
    const lineHeightValue = Number(lineHeight.replace('px', ''))
    realBoundingRect.height = Math.round(lineHeightValue)
    const fixedY = (fixedHeight - lineHeightValue) / 2 + realBoundingRect.y
    realBoundingRect.y = fixedY
  }

  const nodeName = `.${Array.from(domNode.classList).join('.')}`

  // 获取子节点id
  const childrenIds = Array.from(domNode.children).map(child => child.getAttribute('unique-id')).filter(id => id != null)
  const parentId = domNode.parentElement?.getAttribute('unique-id')
  const siblingIds = Array.from(domNode.parentElement?.children || []).map(sibling => sibling.getAttribute('unique-id')).filter(id => id !== nodeId).filter(id => id != null)
  const borderInfo = getDomBorderInfo(domNode)
  const paddingInfo = getDomPaddingInfo(domNode)
  const backgroundColor = getDomBackgroundColor(domNode)
  const isBFC = getDomIsBfc(domNode)
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
    neighborMarginInfo: {},
    initialNeighborInfos: {},
    isBFC,
  }
  return newNode
}

/** 打平dom树，绑定当前节点的父节点、子节点、兄弟节点信息（仅需要uniqueId）以及当前节点的boundingRect */
export async function onDomInfoRecorder(rootDom: HTMLElement) {
  const floorOrderDomList = Array.from(floorOrderTraversalWithDom(rootDom))
  const rootDomId = rootDom.getAttribute('unique-id')
  const flatNodeMapEntries = floorOrderDomList.map((domNode) => {
    const nodeInfo = processSingleDomNodeInfo(domNode, rootDomId)
    if (!nodeInfo)
      return null
    return [nodeInfo?.uniqueId, nodeInfo] as const
  }).filter(entry => entry != null)
  return new Map(flatNodeMapEntries)
}
