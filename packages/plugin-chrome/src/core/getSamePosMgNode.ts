import type { DistanceInfo } from './type'

export default function getSamePosMgNode(currentDistanceInfo: DistanceInfo, mgDistanceInfoMap: Map<string, DistanceInfo>) {
  const entries = Array.from(mgDistanceInfoMap.entries())
  let minDistance = Number.MAX_SAFE_INTEGER
  let matchedNodeId = ''

  // 设置最大可接受的距离阈值（可以根据实际需求调整）
  const MAX_ACCEPTABLE_DISTANCE = 100

  entries.forEach(([mgNodeId, mgDistanceInfo]) => {
    const { left, top, width, height } = currentDistanceInfo
    const { left: mgLeft, top: mgTop, width: mgWidth, height: mgHeight } = mgDistanceInfo

    // 计算位置和尺寸的欧几里得距离
    const positionDistance = Math.sqrt(
      (left - mgLeft) ** 2
      + (top - mgTop) ** 2,
    )

    const sizeDistance = Math.sqrt(
      (width - mgWidth) ** 2
      + (height - mgHeight) ** 2,
    )

    // 综合距离（可以调整位置和尺寸的权重）
    const totalDistance = positionDistance * 0.7 + sizeDistance * 0.3

    // 只有在距离小于阈值时才考虑更新
    if (totalDistance < minDistance && totalDistance < MAX_ACCEPTABLE_DISTANCE) {
      minDistance = totalDistance
      matchedNodeId = mgNodeId
    }
  })

  return matchedNodeId
}
