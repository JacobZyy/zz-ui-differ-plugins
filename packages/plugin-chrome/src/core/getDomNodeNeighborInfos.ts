import type { DistanceInfo, NeighborInfo } from './type'
import { calculateDirectionKey, notNeighborPositionSet, SiblingNodeRelativePosition } from './type'

export default function getDomNodeNeighborInfos(currentNode: DistanceInfo, siblingNodes: DistanceInfo[]) {
  // 按方向分组存储候选节点
  const neighbors: Partial<Record<SiblingNodeRelativePosition, DistanceInfo>> = {}

  siblingNodes.forEach((siblingNode) => {
    const siblingNodePos = getNodePosition(currentNode, siblingNode)

    // 完全没有任何边有重叠的节点
    if (notNeighborPositionSet.has(siblingNodePos)) {
      return
    }

    const recordedSiblingNode = neighbors[siblingNodePos]
    if (!recordedSiblingNode) {
      neighbors[siblingNodePos] = siblingNode
      return
    }

    const calculateKey = calculateDirectionKey[siblingNodePos]
    if (!calculateKey)
      return
    // 间距更小，则更新相邻节点
    if (siblingNode[calculateKey] < recordedSiblingNode[calculateKey])
      neighbors[siblingNodePos] = siblingNode
  })
  const neighborInfo: NeighborInfo = Object.fromEntries(Object.entries(neighbors).filter(([_, value]) => !!value).map(([key, value]) => [key, value.uniqueId]))
  return neighborInfo
}

/**
 * ------------------------------
 * | 1 |      2      | 3 |
 * ------------------------------
 * | 4 | currentNode | 6 |
 * -----------------------
 * | 7 |      8      | 9 |
 * ------------------------------
 * @description 判断兄弟节点位于主节点的哪个位置
 * @returns 返回位置序号1-9,如果不在任何位置则返回0
 */
function getNodePosition(mainNode: DistanceInfo, siblingNode: DistanceInfo): SiblingNodeRelativePosition {
  const isAtLeft = siblingNode.left + siblingNode.width <= mainNode.left
  const isAtRight = siblingNode.right + siblingNode.width <= mainNode.right
  const isAtTop = siblingNode.top + siblingNode.height <= mainNode.top
  const isAtBottom = siblingNode.bottom + siblingNode.height <= mainNode.bottom
  // 是否在 2和 8 的区域
  const isHorizontalMiddle = !isAtLeft && !isAtRight
  // 是否在 4和 6 的区域
  const isVerticalMiddle = !isAtTop && !isAtBottom

  // 1 3 7 9
  if (isAtLeft && isAtTop)
    return SiblingNodeRelativePosition.TOP_LEFT
  if (isAtRight && isAtTop)
    return SiblingNodeRelativePosition.TOP_RIGHT
  if (isAtLeft && isAtBottom)
    return SiblingNodeRelativePosition.BOTTOM_LEFT
  if (isAtRight && isAtBottom)
    return SiblingNodeRelativePosition.BOTTOM_RIGHT

  // 2 8
  if (isHorizontalMiddle && isAtTop)
    return SiblingNodeRelativePosition.TOP
  if (isHorizontalMiddle && isAtBottom)
    return SiblingNodeRelativePosition.BOTTOM

  // 4 6
  if (isAtLeft && isVerticalMiddle)
    return SiblingNodeRelativePosition.LEFT
  if (isAtRight && isVerticalMiddle)
    return SiblingNodeRelativePosition.RIGHT

  // 其他情况都是0
  return SiblingNodeRelativePosition.NONE
}
