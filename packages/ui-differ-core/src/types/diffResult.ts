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

// 父元素没有padding-top/padding-bottom
// 父元素没有border-top/border-bottom
// 父元素没有建立BFC（Block Formatting Context）
// 父元素没有内容分隔父子margin
// 元素不是浮动或绝对定位

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
