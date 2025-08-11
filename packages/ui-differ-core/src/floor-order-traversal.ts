import type { NodeInfo, UniqueId } from './types'

/**
 * @description 层序遍历节点
 * @param {NodeInfo} rootNode HTML根节点
 * @param {Function} processorFn 遍历到当前节点时的处理方法
 */
export function floorOrderTraversal(rootId: UniqueId, flatNodeMap: Map<UniqueId, NodeInfo>, processorFn: (nodeId: UniqueId) => void) {
  const queue: UniqueId[] = [rootId]

  while (queue.length > 0) {
    const currentNodeId = queue.shift()
    if (!currentNodeId)
      continue
    // 处理当前节点
    processorFn(currentNodeId)

    // 将所有子元素节点加入队列（只处理元素节点，忽略文本节点等）
    const childrenIds = flatNodeMap.get(currentNodeId)?.children || []
    queue.push(...childrenIds)
  }
}
