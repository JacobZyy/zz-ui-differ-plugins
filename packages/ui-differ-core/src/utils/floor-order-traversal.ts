import type { NodeInfo, NodeWithChild, UniqueId } from '../types'
import { nodeNoChildSet } from '../types/'

/**
 * @description 层序遍历节点
 * @param {NodeInfo} rootNode HTML根节点
 * @param {Function} processorFn 遍历到当前节点时的处理方法
 */
export function* floorOrderTraversal(rootId: UniqueId, flatNodeMap: Map<UniqueId, NodeInfo>): Generator<UniqueId, void, unknown> {
  const queue: UniqueId[] = [rootId]

  while (queue.length > 0) {
    const currentNodeId = queue.shift()
    if (!currentNodeId)
      continue
    // 处理当前节点
    yield currentNodeId

    // 将所有子元素节点加入队列（只处理元素节点，忽略文本节点等）
    const childrenIds = flatNodeMap.get(currentNodeId)?.children || []
    queue.push(...childrenIds)
  }
}

/**
 * @description 同步层序遍历DOM节点生成器，内存友好
 * @param {Element} rootDom HTML根节点
 * @yields {Element} 按层序遍历的每个DOM元素
 * @example
 * ```typescript
 * const domOrderList = Array.from(floorOrderTraversalWithDom(rootDom))
 * console.log(domOrderList)
 * ```
 */
export function* floorOrderTraversalWithDom(rootDom: Element): Generator<Element, void, unknown> {
  const queue: Element[] = [rootDom]

  while (queue.length > 0) {
    const currentDom = queue.shift()
    if (!currentDom)
      continue

    // 产出当前节点
    yield currentDom

    // 将所有子元素节点加入队列（只处理元素节点，忽略文本节点等）
    const children = Array.from(currentDom.children || [])
    queue.push(...children)
  }
}

/**
 * @description 同步层序遍历DOM节点生成器，内存友好
 * @param {SceneNode} rootNode 设计稿根节点
 * @yields {SceneNode} 按层序遍历的每个设计稿节点
 * @example
 * ```typescript
 * const domOrderList = Array.from(floorOrderTraversalWithNode(rootNode))
 * console.log(domOrderList)
 * ```
 */
export function* floorOrderTraversalWithNode(rootNode: SceneNode): Generator<SceneNode, void, unknown> {
  const queue: SceneNode[] = [rootNode]

  while (queue.length > 0) {
    const currentNode = queue.shift()
    if (!currentNode)
      continue

    // 产出当前节点
    yield currentNode

    if (nodeNoChildSet.has(currentNode.type)) {
      continue
    }

    // 将所有子元素节点加入队列（只处理元素节点，忽略文本节点等）
    const children = Array.from((currentNode as NodeWithChild).children || [])
    queue.push(...children)
  }
}
