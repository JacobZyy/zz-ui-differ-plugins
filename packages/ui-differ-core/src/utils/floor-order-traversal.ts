import type { NodeWithChild } from '../types'
import { nodeNoChildSet } from '../types'

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
 * @description 同步层序遍历设计稿节点生成器，内存友好
 * @param {SceneNode} rootNode 设计稿根节点
 * @yields {SceneNode} 按层序遍历的每个设计稿节点
 * @example
 * ```typescript
 * const domOrderList = Array.from(floorOrderTraversalWithNode(rootNode))
 * console.log(domOrderList)
 * ```
 */
/**
 * @description 同步层序遍历DOM节点生成器，包含文本节点，内存友好
 * @param {Element} rootDom HTML根节点
 * @yields {Node} 按层序遍历的每个DOM节点（包括元素节点和文本节点）
 * @example
 * ```typescript
 * const allNodes = Array.from(floorOrderTraversalWithAllNodes(rootDom))
 * console.log(allNodes) // 包含元素节点和非空文本节点
 * ```
 */
export function* floorOrderTraversalWithAllNodes(rootDom: Element): Generator<Node, void, unknown> {
  const queue: Node[] = [rootDom]

  while (queue.length > 0) {
    const currentNode = queue.shift()
    if (!currentNode)
      continue

    // 产出当前节点
    yield currentNode

    // 如果是元素节点，将所有子节点加入队列（包括文本节点）
    if (currentNode.nodeType === Node.ELEMENT_NODE) {
      const children = Array.from(currentNode.childNodes || [])
      // 过滤掉空白文本节点，只保留有意义的文本内容
      const meaningfulChildren = children.filter((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const textContent = child.textContent || ''
          return textContent.trim().length > 0 // 只保留非空白文本节点
        }
        return child.nodeType === Node.ELEMENT_NODE
      })
      queue.push(...meaningfulChildren)
    }
  }
}

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
