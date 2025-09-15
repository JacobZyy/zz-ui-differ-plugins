import type { DistanceResult } from './diffResult'
import { SiblingPosition } from './enums'

export type UniqueId = string

type BorderWidthKey = 'borderWidthLeft' | 'borderWidthRight' | 'borderWidthTop' | 'borderWidthBottom'
type BorderColorKey = 'borderColorLeft' | 'borderColorRight' | 'borderColorTop' | 'borderColorBottom'
export interface BorderInfo {
  borderWidth: Record<BorderWidthKey, number>
  borderColor: Record<BorderColorKey, string>
}

export interface PaddingInfo {
  paddingLeft: number
  paddingRight: number
  paddingTop: number
  paddingBottom: number
}

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

/** 单节点匹配结果 */
export interface MatchResult {
  designNodeId: UniqueId
  confidence: number
  centerDistance: number
  overlapRatio: number
}

export interface NeighborMarginInfo {
  isParent: boolean
  value: number
  isDirectlySibling: boolean
}

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
  nodeName: string
  /** 节点边界 */
  boundingRect: BoundingRect
  /** padding信息 */
  paddingInfo: PaddingInfo
  /** border信息 */
  borderInfo: BorderInfo
  /** 背景色 */
  backgroundColor: string
  /** 相邻节点的边距 */
  neighborMarginInfo: Partial<Record<SiblingPosition, NeighborMarginInfo>>
  /**
   * 是否是bfc元素
   * @default false
   */
  isBFC?: boolean
  /** 第一次找邻居节点的信息，用于后续的使用 */
  initialNeighborInfos?: SiblingRelativeNodeInfo
  /** 是否脱离了文档流 */
  isOutOfDocumentFlow?: boolean
  /** 是否是空节点 */
  isEmptyNode?: boolean
  /** 匹配的设计稿节点id */
  matchedDesignNodeId?: UniqueId
  matchResult?: MatchResult
  originBounding: BoundingRect
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
export const currentNodeToSiblingPositionMap: Record<SiblingPosition, SiblingPosition> = {
  [SiblingPosition.TOP]: SiblingPosition.BOTTOM,
  [SiblingPosition.BOTTOM]: SiblingPosition.TOP,
  [SiblingPosition.LEFT]: SiblingPosition.RIGHT,
  [SiblingPosition.RIGHT]: SiblingPosition.LEFT,
  [SiblingPosition.TOP_LEFT]: SiblingPosition.BOTTOM_RIGHT,
  [SiblingPosition.TOP_RIGHT]: SiblingPosition.BOTTOM_LEFT,
  [SiblingPosition.BOTTOM_LEFT]: SiblingPosition.TOP_RIGHT,
  [SiblingPosition.BOTTOM_RIGHT]: SiblingPosition.TOP_LEFT,
  [SiblingPosition.NONE]: SiblingPosition.NONE,
}

export const siblingPositionToDiffResultKey: Record<SiblingPosition, keyof DistanceResult> = {
  [SiblingPosition.TOP]: 'marginTop',
  [SiblingPosition.BOTTOM]: 'marginBottom',
  [SiblingPosition.LEFT]: 'marginLeft',
  [SiblingPosition.RIGHT]: 'marginRight',
  /** @deprecated 无效的兄弟节点位置 */
  [SiblingPosition.TOP_LEFT]: 'marginTop',
  /** @deprecated 无效的兄弟节点位置 */
  [SiblingPosition.TOP_RIGHT]: 'marginTop',
  /** @deprecated 无效的兄弟节点位置 */
  [SiblingPosition.BOTTOM_LEFT]: 'marginBottom',
  /** @deprecated 无效的兄弟节点位置 */
  [SiblingPosition.BOTTOM_RIGHT]: 'marginBottom',
  /** @deprecated 无效的兄弟节点位置 */
  [SiblingPosition.NONE]: 'marginTop',
}

export const convertPositionToBoundingKeys: Record<SiblingPosition, (keyof BoundingRect)[]> = {
  [SiblingPosition.TOP]: ['y'],
  [SiblingPosition.BOTTOM]: ['y', 'height'],
  [SiblingPosition.LEFT]: ['x'],
  [SiblingPosition.RIGHT]: ['x', 'width'],
  [SiblingPosition.TOP_LEFT]: [],
  [SiblingPosition.TOP_RIGHT]: [],
  [SiblingPosition.BOTTOM_LEFT]: [],
  [SiblingPosition.BOTTOM_RIGHT]: [],
  [SiblingPosition.NONE]: [],
}

export const convertDirectionKeyToBoudingKeys: Record<'left' | 'right' | 'top' | 'bottom', (keyof BoundingRect)[]> = {
  left: ['x'],
  right: ['x', 'width'],
  top: ['y'],
  bottom: ['y', 'height'],
}
