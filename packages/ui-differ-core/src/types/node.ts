import { SiblingPosition } from './enums'

export type UniqueId = string

/**
 * 节点边界
 */
export interface BoundingRect {
  /** 左上角 x 坐标 */
  x: number
  y: number
  width: number
  height: number
}

/** 只记录2 4 6 8 四个方向的兄弟节点信息 */
type SiblingRelativeNodeInfo = Partial<Record<SiblingPosition, UniqueId>>

/**
 * 节点信息
 */
export interface NodeInfo extends SiblingRelativeNodeInfo {
  /** 父节点 id */
  parentId: UniqueId
  /** 子节点 id */
  children: UniqueId[]
  /** 兄弟节点 id */
  sibling: UniqueId[]
  uniqueId: UniqueId
  /** 节点边界 */
  boundingRect: BoundingRect
}

/** 有效的兄弟节点位置 */
export const validateSiblingPosList = [SiblingPosition.TOP, SiblingPosition.BOTTOM, SiblingPosition.LEFT, SiblingPosition.RIGHT]

/** 无效的兄弟节点位置合集 */
export const invalidSiblingPositionSet = new Set([
  SiblingPosition.NONE,
  SiblingPosition.TOP_LEFT,
  SiblingPosition.TOP_RIGHT,
  SiblingPosition.BOTTOM_LEFT,
  SiblingPosition.BOTTOM_RIGHT,
])

/** 当前节点与兄弟节点之间的位置映射 */
export const currentNodeToSiblingPositionMap: Partial<Record<SiblingPosition, SiblingPosition>> = {
  [SiblingPosition.TOP]: SiblingPosition.BOTTOM,
  [SiblingPosition.BOTTOM]: SiblingPosition.TOP,
  [SiblingPosition.LEFT]: SiblingPosition.RIGHT,
  [SiblingPosition.RIGHT]: SiblingPosition.LEFT,
}
