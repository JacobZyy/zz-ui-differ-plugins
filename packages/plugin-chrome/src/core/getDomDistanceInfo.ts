import type { DistanceInfo } from './type'
import getNeighborNodes from './getDomNodeNeighborInfos'

export default function getDomDistanceInfo(rootNode: HTMLElement) {
  const distanceInfoMap = new Map<string, DistanceInfo>()

  const getDistanceInfo = (node: HTMLElement) => {
    const childrenNodes = Array.from(node.children) as HTMLElement[]
    childrenNodes.forEach((childNode) => {
      const childNodeId = childNode.getAttribute('unique-id')
      if (!childNodeId)
        return
      const currentDistanceInfo = getDistanceVal(childNode, node)

      const siblingNodes = childrenNodes
        .filter(sibling => sibling.getAttribute('unique-id') !== childNodeId)
        .map(sibling => getDistanceVal(sibling, node))

      const neighborInfo = getNeighborNodes(currentDistanceInfo, siblingNodes)

      distanceInfoMap.set(childNodeId, {
        ...currentDistanceInfo,
        ...neighborInfo,
      })
      getDistanceInfo(childNode)
    })
  }

  getDistanceInfo(rootNode)

  return distanceInfoMap
}

function getDistanceVal(currentNode: HTMLElement, parentNode: HTMLElement): DistanceInfo {
  const { width, height, left, top } = currentNode.getBoundingClientRect()
  const parentRect = parentNode.getBoundingClientRect()
  const parentNodeId = parentNode.getAttribute('unique-id')
  const nodeId = currentNode.getAttribute('unique-id')
  return {
    width,
    height,
    left,
    top,
    right: parentRect.width - left - width,
    bottom: parentRect.height - top - height,
    parentNodeId: parentNodeId || '',
    uniqueId: nodeId || '',
  }
}
