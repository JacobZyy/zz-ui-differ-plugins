/**
 * @description 判断是否是因为设置了节点的圆角导致rectangle节点变成了path节点
 */
export function judgeIsRadiusRectanglePath(nodeInfo: PenNode) {
  const { penNetwork } = nodeInfo
  if (!penNetwork)
    return false
  console.log('🚀 ~ judgeIsRadiusRectanglePath ~ penNetwork:', penNetwork)
  const { nodes } = penNetwork
  if (!nodes || nodes.length !== 4)
    // 只处理四边形
    return false
  // 判断四个点是否能组成矩形
  // 获取所有 x 和 y 坐标
  const xCoords = nodes.map(node => node.x).sort((a, b) => a - b)
  const yCoords = nodes.map(node => node.y).sort((a, b) => a - b)

  // 矩形应该只有两个不同的 x 坐标和两个不同的 y 坐标
  const uniqueXCoords = [...new Set(xCoords)]
  const uniqueYCoords = [...new Set(yCoords)]

  if (uniqueXCoords.length !== 2 || uniqueYCoords.length !== 2) {
    return false
  }

  // 验证每个坐标组合都存在
  const [minX, maxX] = uniqueXCoords
  const [minY, maxY] = uniqueYCoords

  const expectedPoints = [
    { x: minX, y: minY },
    { x: minX, y: maxY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
  ]

  // 检查是否所有预期的点都存在
  return expectedPoints.every(expectedPoint =>
    nodes.some(node => node.x === expectedPoint.x && node.y === expectedPoint.y),
  )
}
