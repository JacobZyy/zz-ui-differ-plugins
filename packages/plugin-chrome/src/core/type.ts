export interface DistanceInfoValues {
  left: number
  top: number
  width: number
  height: number
  right: number
  bottom: number
}

/** 相邻节点信息 */
export type NeighborInfo = Partial<Record<SiblingNodeRelativePosition, string>>

export interface NodeBaseInfo {
  nodeName?: string
  parentNodeId?: string
  uniqueId: string
}

/** 节点距离信息 */
export type DistanceInfo = DistanceInfoValues & NeighborInfo & NodeBaseInfo

export interface MarginInfo {
  left: number
  right: number
  top: number
  bottom: number
}

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
/**
 * 相对于当前节点的兄弟节点位置枚举
 */
export enum SiblingNodeRelativePosition {
  /** 不在任何位置 */
  NONE = 0,
  /** 左上角 */
  TOP_LEFT = 1,
  /** 正上方 */
  TOP = 2,
  /** 右上角 */
  TOP_RIGHT = 3,
  /** 左侧 */
  LEFT = 4,
  /** 右侧 */
  RIGHT = 6,
  /** 左下角 */
  BOTTOM_LEFT = 7,
  /** 正下方 */
  BOTTOM = 8,
  /** 右下角 */
  BOTTOM_RIGHT = 9,
}

export const notNeighborPositionSet = new Set([
  SiblingNodeRelativePosition.NONE,
  SiblingNodeRelativePosition.TOP_LEFT,
  SiblingNodeRelativePosition.TOP_RIGHT,
  SiblingNodeRelativePosition.BOTTOM_LEFT,
  SiblingNodeRelativePosition.BOTTOM_RIGHT,
])

export const calculateDirectionKey: Partial<Record<SiblingNodeRelativePosition, keyof DistanceInfoValues>> = {
  [SiblingNodeRelativePosition.LEFT]: 'right',
  [SiblingNodeRelativePosition.RIGHT]: 'left',
  [SiblingNodeRelativePosition.TOP]: 'bottom',
  [SiblingNodeRelativePosition.BOTTOM]: 'top',
}

export interface PageSize {
  width: number
  height: number
}

export interface MsgDataType {
  diffResult: Record<string, DiffResultInfo>
  screenShot: string
  documentSize: PageSize
}
