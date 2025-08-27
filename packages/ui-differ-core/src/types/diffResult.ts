import type { NodeInfo } from './node'

export interface DomMarginInfo {
  marginTop: number
  marginBottom: number
}

export interface MarginInfo {
  left: number
  right: number
  top: number
  bottom: number
}

/** 距离比对结果 */
export interface DistanceResult {
  // diff宽高的结果
  width: number
  height: number
  // diff结果
  marginRight: number
  marginBottom: number
  marginLeft: number
  marginTop: number
}

/** 比对结果 */
export interface DiffResultInfo {
  distanceResult: DistanceResult
  designNode: NodeInfo
  originNode: NodeInfo
}
