import type { NodeInfo, UniqueId } from '../types'
import { produce } from 'immer'
import { SiblingPosition } from '../types'
import { getNodePosition } from '../utils/get-node-position'

function sortCompareFn(prev: NodeInfo, next: NodeInfo) {
  const position = getNodePosition(prev, next)
  if (position === SiblingPosition.LEFT) {
    return -1
  }
  if (position === SiblingPosition.RIGHT) {
    return 1
  }

  if (position === SiblingPosition.TOP) {
    return -1
  }
  if (position === SiblingPosition.BOTTOM) {
    return 1
  }
  return 0
}
/**
 * @description 重新排序设计稿节点
 * 只需要处理当前节点及其兄弟节点就行
 * @param rootNode 设计稿根节点
 */
export function reOrderDesignNodes(originNodeMap: Map<UniqueId, NodeInfo>) {
  const newNodeMap = produce(originNodeMap, (draftNodeMap) => {
    draftNodeMap.forEach((nodeInfo) => {
      const childrenNodeList = nodeInfo.children.map(id => draftNodeMap.get(id)).filter(it => it != null)
      const newChildrenNodeList = childrenNodeList.toSorted(sortCompareFn)
      nodeInfo.children = newChildrenNodeList.map(it => it.uniqueId)
    })
  })
  return newNodeMap
}
