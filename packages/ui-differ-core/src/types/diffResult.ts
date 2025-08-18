import type { NodeInfo } from './node'

export interface MarginInfo {
  left: number
  right: number
  top: number
  bottom: number
}

export interface DiffResultInfo {
  /** diff宽高的结果 */
  diffWidth: number
  diffHeight: number
  /** diff结果 */
  diffMarginInfo: MarginInfo
  /** 原dom的边距 */
  originMarginInfo: MarginInfo
  designMarginInfo: MarginInfo
  // /** 原dom节点信息 */
  // originBoundingRect: BoundingRect
  // /** 原节点宽高 */
  // originWidth: number
  // originHeight: number
  // /** 设计稿节点名称 */
  // designNodeName: string
  // /** 设计稿节点Id */
  // designNodeId: UniqueId
  // /** 当前节点Id */
  // uniqueId: UniqueId
  // /** 当前节点名称 */
  // nodeName: string
  originNodeInfo: NodeInfo
  designNodeInfo: NodeInfo
}
