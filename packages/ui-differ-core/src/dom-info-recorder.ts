import type { BoundingRect, NodeInfo, UniqueId } from './types'

function recursionRectInfo(domNode: Element, flatNodeMap: Map<UniqueId, NodeInfo>) {
  const nodeId = domNode.getAttribute('unique-id')
  if (!nodeId)
    return
  const boundingRect = domNode.getBoundingClientRect()
  const realBoundingRect: BoundingRect = {
    x: boundingRect.x,
    y: boundingRect.y,
    width: boundingRect.width,
    height: boundingRect.height,
  }

  const childrenDomList = Array.from(domNode.children)

  const childrenIds = childrenDomList.map(child => child.getAttribute('unique-id')).filter(id => id != null)
  const parentDom = domNode.parentElement
  const parentId = parentDom?.getAttribute('unique-id')
  const siblingIds = Array.from(parentDom?.children || []).map(sibling => sibling.getAttribute('unique-id')).filter(id => id !== nodeId).filter(id => id != null)

  flatNodeMap.set(nodeId, {
    uniqueId: nodeId,
    boundingRect: realBoundingRect,
    parentId: parentId || '',
    children: childrenIds,
    sibling: siblingIds,
  })

  if (childrenDomList.length) {
    return childrenDomList.forEach((childDom) => {
      recursionRectInfo(childDom, flatNodeMap)
    })
  }
}

/** 打平dom树，绑定当前节点的父节点、子节点、兄弟节点信息（仅需要uniqueId）以及当前节点的boundingRect */
export function onDomInfoRecorder(rootDom: HTMLElement) {
  const flatNodeMap = new Map<UniqueId, NodeInfo>()
  recursionRectInfo(rootDom, flatNodeMap)
  return flatNodeMap
}
