import type { NodeWithChild } from '../types'
import { nodeNoChildSet } from '../types'

interface ClipConstraint extends Pick<FrameNode, 'width' | 'height' | 'x' | 'y' | 'bound' | 'absoluteRenderBounds'
  | 'absoluteBoundingBox' | 'absoluteTransform' | 'relativeTransform'> {}

/**
 * TODO: 这个需要一个超出边界的场景来测试，暂时用不上
 * 处理 overflow hidden
 * @param rootNode 根节点
 * @returns 处理后的根节点
 */
export function processOverFlowHidden<T extends SceneNode>(rootNode: T): T {
  return processNodeWithClipConstraint(rootNode)
}

/**
 * 获取最新的裁剪约束
 * @param node 节点
 * @param prevClipConstraint 上一个节点的裁剪约束
 * @returns
 */
function getLastestClipConstraint(node: SceneNode, prevClipConstraint?: ClipConstraint): ClipConstraint | undefined {
  if (nodeNoChildSet.has(node.type)) {
    // 没有子节点，直接返回之前的值
    return prevClipConstraint
  }
  const reTypedNode = node as NodeWithChild
  if (!reTypedNode.children || reTypedNode.type === 'GROUP' || !reTypedNode.clipsContent) {
    return prevClipConstraint
  }

  const {
    width,
    height,
    x,
    y,
    bound,
    absoluteRenderBounds,
    absoluteBoundingBox,
    absoluteTransform,
    relativeTransform,
  } = reTypedNode

  const currentNodeConstraint: ClipConstraint = { width, height, x, y, bound, absoluteRenderBounds, absoluteBoundingBox, absoluteTransform, relativeTransform }

  if (!prevClipConstraint || prevClipConstraint.width > width || prevClipConstraint.height > height) {
    // 返回小的
    return currentNodeConstraint
  }

  return prevClipConstraint
}

/**
 * 处理节点的裁剪约束
 * @param node 节点
 * @param clipConstraint 裁剪约束
 * @returns 处理后的节点
 */
function processNodeWithClipConstraint<T extends SceneNode>(node: T, clipConstraint?: ClipConstraint): T {
  /** 新的裁剪约束 */
  const newClipConstraint = getLastestClipConstraint(node, clipConstraint)

  /** 当前节点的属性 */
  const { width, height } = node

  const shouldChangeSize = newClipConstraint && (newClipConstraint.width < width || newClipConstraint.height < height)

  /** 新的节点信息 */
  const newNodeInfo = shouldChangeSize
    ? { ...node, ...newClipConstraint }
    : node

  if (nodeNoChildSet.has(node.type)) {
    // 没有子节点，则直接返回
    return newNodeInfo
  }
  const reTypedNode = node as NodeWithChild

  const children = reTypedNode.children.map(child => processNodeWithClipConstraint(child, newClipConstraint))

  return {
    ...newNodeInfo,
    children,
  }
}
