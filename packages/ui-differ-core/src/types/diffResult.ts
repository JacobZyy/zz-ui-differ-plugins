export interface DiffResultInfo {
  // diff宽高的结果
  width: number
  height: number
  // diff结果
  marginRight: number
  marginBottom: number
  marginLeft: number
  marginTop: number
  // 原dom的边距
  domMarginRight: number
  domMarginBottom: number
  domMarginLeft: number
  domMarginTop: number
  // 原dom节点信息
  nodeLeft: number
  nodeTop: number
  nodeWidth: number
  nodeHeight: number
  // 设计稿节点信息
  designNodeName: string
  designNodeId: string
}
