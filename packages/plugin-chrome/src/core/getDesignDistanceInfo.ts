import type { DistanceInfo } from './type'
import { convertDesignToPx } from './convertDesignToPx'
import getNeighborNodes from './getDomNodeNeighborInfos'

export function getDesignDistanceInfo(designNode: FrameNode) {
  const { absoluteBoundingBox } = designNode
  const distanceInfoMap = new Map<string, DistanceInfo>()

  const getDistanceInfo = (node: SceneNode) => {
    if (node.type !== 'FRAME' && node.type !== 'SECTION' && node.type !== 'GROUP' && node.type !== 'INSTANCE') {
      return
    }
    node.children?.forEach((childNode) => {
      const currentDistanceInfo = getDistanceVal(childNode, node, absoluteBoundingBox)
      const siblingDistanceInfos = node.children.filter(sibling => sibling.id !== childNode.id).map(sibling => getDistanceVal(sibling, node, absoluteBoundingBox))
      const neighborInfo = getNeighborNodes(currentDistanceInfo, siblingDistanceInfos)
      distanceInfoMap.set(childNode.id, {
        ...currentDistanceInfo,
        ...neighborInfo,
      })
      getDistanceInfo(childNode)
    })
  }
  getDistanceInfo(designNode)
  return distanceInfoMap
}

function getDistanceVal(node: SceneNode, parentNode: SceneNode, rootAbsoluteBoundingBox: Bound): DistanceInfo {
  const { absoluteBoundingBox } = node
  const leftValue = (absoluteBoundingBox.x - rootAbsoluteBoundingBox.x)
  const topValue = (absoluteBoundingBox.y - rootAbsoluteBoundingBox.y)

  return {
    left: convertDesignToPx(leftValue),
    top: convertDesignToPx(topValue),
    width: convertDesignToPx(node.width),
    height: convertDesignToPx(node.height),
    right: convertDesignToPx(parentNode.width - leftValue - node.width),
    bottom: convertDesignToPx(parentNode.height - topValue - node.height),
    parentNodeId: parentNode.id,
    nodeName: node.name,
    uniqueId: node.id,
  }
}
