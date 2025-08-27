import type { NodeInfo, NodeWithChild, UniqueId } from '../types'
import { nodeWithChildSet } from '../types'
/**
 * 根据根节点构建节点父子关系信息Map
 * @param rootNode 设计稿根节点
 * @returns 返回包含每个节点的parentId和sibling信息的Map
 */
export function getParentSiblingNodes(rootNode: SceneNode): Map<UniqueId, Pick<NodeInfo, 'parentId' | 'sibling'>> {
  const flatNodeMap = new Map<UniqueId, Pick<NodeInfo, 'parentId' | 'sibling'>>()

  // 递归构建父子关系
  function buildNodeRelations(designNode: SceneNode) {
    const currentNodeId = designNode.id

    const hasChildren = nodeWithChildSet.has(designNode.type)
    if (!hasChildren) {
      return
    }

    const nodeWithChild = designNode as NodeWithChild
    const childrenIds = nodeWithChild.children.map(child => child.id)

    // 为每个子节点设置兄弟关系
    childrenIds.forEach((childId) => {
      const prevNodeInfo = flatNodeMap.get(childId)
      const siblingNodeInfo = childrenIds.filter(id => id !== childId)
      const newNodeInfo = {
        ...(prevNodeInfo || {}),
        parentId: currentNodeId,
        sibling: siblingNodeInfo,
      }
      flatNodeMap.set(childId, newNodeInfo)
    })

    // 递归处理子节点
    nodeWithChild.children.forEach((child) => {
      buildNodeRelations(child)
    })
  }

  // 从根节点开始构建关系
  buildNodeRelations(rootNode)

  return flatNodeMap
}
