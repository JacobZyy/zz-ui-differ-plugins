import { judgeIsBgStyleRectangle } from './judge-is-bg-style-rectangle'

type ExtractNodeRadiusInfoResult = Pick<RectangleNode, 'cornerRadius' | 'topLeftRadius' | 'topRightRadius' | 'bottomLeftRadius' | 'bottomRightRadius'>

function extractNodeRadiusInfo(node?: PenNode | RectangleNode): ExtractNodeRadiusInfoResult {
  if (!node) {
    return {
      cornerRadius: 0,
      topLeftRadius: 0,
      topRightRadius: 0,
      bottomLeftRadius: 0,
      bottomRightRadius: 0,
    }
  }
  const { cornerRadius } = node
  if (cornerRadius !== 'Symbol(mg.mixed)') {
    return {
      cornerRadius,
      topLeftRadius: Number(cornerRadius),
      topRightRadius: Number(cornerRadius),
      bottomLeftRadius: Number(cornerRadius),
      bottomRightRadius: Number(cornerRadius),
    }
  }
  if (node.type === 'RECTANGLE') {
    // 矩形直接返回
    return {
      cornerRadius: 'Symbol(mg.mixed)',
      topLeftRadius: node.topLeftRadius,
      topRightRadius: node.topRightRadius,
      bottomLeftRadius: node.bottomLeftRadius,
      bottomRightRadius: node.bottomRightRadius,
    }
  }
  // 从路径点上的半径提取圆角信息
  const { penNetwork } = node
  const { nodes } = penNetwork

  // 找到最小和最大的 x、y 坐标来确定角的位置
  const xCoords = nodes.map(node => node.x).sort((a, b) => a - b)
  const yCoords = nodes.map(node => node.y).sort((a, b) => a - b)
  const [minX, maxX] = [xCoords[0], xCoords[xCoords.length - 1]]
  const [minY, maxY] = [yCoords[0], yCoords[yCoords.length - 1]]

  // 根据坐标位置确定每个角的半径
  let topLeftRadius = 0
  let topRightRadius = 0
  let bottomLeftRadius = 0
  let bottomRightRadius = 0

  nodes.forEach((node) => {
    const { x, y, cornerRadius } = node
    if (x === minX && y === minY) {
      // 左上角
      topLeftRadius = cornerRadius || 0
    }
    else if (x === maxX && y === minY) {
      // 右上角
      topRightRadius = cornerRadius || 0
    }
    else if (x === minX && y === maxY) {
      // 左下角
      bottomLeftRadius = cornerRadius || 0
    }
    else if (x === maxX && y === maxY) {
      // 右下角
      bottomRightRadius = cornerRadius || 0
    }
  })

  return {
    cornerRadius: 'Symbol(mg.mixed)',
    topLeftRadius,
    topRightRadius,
    bottomLeftRadius,
    bottomRightRadius,
  }
}
function hoistingRectangleStyle(currentNode: SceneNode): SceneNode {
  if ((currentNode.type !== 'GROUP' && currentNode.type !== 'FRAME')) {
    return currentNode
  }

  const bgStyleNodeList = currentNode.children.filter((it) => {
    if (it.type !== 'RECTANGLE' && it.type !== 'PEN') {
      return false
    }
    return judgeIsBgStyleRectangle(it, currentNode)
  }) as (PenNode | RectangleNode)[]

  const restNodeChildList = currentNode.children.filter((it) => {
    if (it.type !== 'RECTANGLE' && it.type !== 'PEN') {
      return true
    }
    return !judgeIsBgStyleRectangle(it, currentNode)
  })

  // 递归处理子节点
  const processedRestChildren = restNodeChildList.map((child) => {
    return hoistingRectangleStyle(child)
  })

  const combinedFillList = bgStyleNodeList.flatMap(node => node.fills || [])
  const { cornerRadius, topLeftRadius, topRightRadius, bottomLeftRadius, bottomRightRadius } = extractNodeRadiusInfo(bgStyleNodeList[0])

  // 返回新的节点对象
  return {
    ...currentNode,
    fills: [...(currentNode.fills || []), ...combinedFillList],
    cornerRadius,
    topLeftRadius,
    topRightRadius,
    bottomLeftRadius,
    bottomRightRadius,
    children: processedRestChildren,
  }
}
export { hoistingRectangleStyle }
