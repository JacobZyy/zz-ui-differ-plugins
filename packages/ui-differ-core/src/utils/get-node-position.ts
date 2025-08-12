import type { NodeInfo } from '../types'
import { SiblingPosition } from '../types'

/**
 * ------------------------------
 * | 1 |      2      | 3 |
 * ------------------------------
 * | 4 | currentNode | 6 |
 * -----------------------
 * | 7 |      8      | 9 |
 * ------------------------------
 * @description 判断兄弟节点位于主节点的哪个位置
 * @see  https://f9fq8frk69.feishu.cn/wiki/BzKOwRz89iu77wkJfhwc81EBnGb?fromScene=spaceOverview#share-RhjddIzZwoul3oxoNUgc6rVcnRb
 * @returns 返回位置序号1-9,如果不在任何位置则返回0
 */
export function getNodePosition(currentNode: NodeInfo, siblingNode: NodeInfo): SiblingPosition {
  // 是否在147
  const isAtLeft = siblingNode.boundingRect.x + siblingNode.boundingRect.width <= currentNode.boundingRect.x
  // 是否在369
  const isAtRight = currentNode.boundingRect.x + currentNode.boundingRect.width <= siblingNode.boundingRect.x
  // 是否在123
  const isAtTop = siblingNode.boundingRect.y + siblingNode.boundingRect.height <= currentNode.boundingRect.y
  // 是否在789
  const isAtBottom = currentNode.boundingRect.y + currentNode.boundingRect.height <= siblingNode.boundingRect.y
  // 是否在 2和 8 的区域
  const isHorizontalMiddle = !isAtLeft && !isAtRight
  // 是否在 4和 6 的区域
  const isVerticalMiddle = !isAtTop && !isAtBottom
  // 1 3 7 9
  if (isAtLeft && isAtTop)
    return SiblingPosition.TOP_LEFT
  if (isAtRight && isAtTop)
    return SiblingPosition.TOP_RIGHT
  if (isAtLeft && isAtBottom)
    return SiblingPosition.BOTTOM_LEFT
  if (isAtRight && isAtBottom)
    return SiblingPosition.BOTTOM_RIGHT
  // 2 8
  if (isHorizontalMiddle && isAtTop)
    return SiblingPosition.TOP
  if (isHorizontalMiddle && isAtBottom)
    return SiblingPosition.BOTTOM
  // 4 6
  if (isAtLeft && isVerticalMiddle)
    return SiblingPosition.LEFT
  if (isAtRight && isVerticalMiddle)
    return SiblingPosition.RIGHT
  // 其他情况都是0
  return SiblingPosition.NONE
}
