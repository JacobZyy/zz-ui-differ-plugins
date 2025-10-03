export function judgeIsBgStyleRectangle(currentNode: PenNode | RectangleNode, parentNode: FrameNode | GroupNode) {
  const { width, height } = currentNode
  const { width: parentWidth, height: parentHeight } = parentNode
  // 大于为图片 + mask 或者 图片+overflow hidden的场景
  const isSameSize = width >= parentWidth && height >= parentHeight
  return isSameSize
}
