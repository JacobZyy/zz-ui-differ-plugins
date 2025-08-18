/**
 * 相对于当前节点的兄弟节点位置枚举
 */
export enum SiblingPosition {
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

export const convertSiblingPositionToBoundingValue: Record<SiblingPosition, (keyof BoundingRect)[]> = {
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

/**
 * TODO: 添加根据相邻节点的offset修正当前节点的信息的功能
 * @description 根据节点的绝对位置信息，匹配HTML节点与设计稿节点
 * @param currentNodeInfo
 * @param mgNodeInfoMap
 * @returns
 */
export function getSamePositionNode(currentNodeInfo: NodeInfo, mgNodeInfo: NodeInfo) {
  let minDistance = Number.MAX_SAFE_INTEGER
  let matchedNodeId = ''

  // 设置最大可接受的距离阈值（可以根据实际需求调整）
  const MAX_ACCEPTABLE_DISTANCE = 100

  const { x, y, height, width } = currentNodeInfo.boundingRect
  const { x: mgX, y: mgY, height: mgHeight, width: mgWidth } = mgNodeInfo.boundingRect

  // 计算位置和尺寸的欧几里得距离
  const positionDistance = Math.sqrt(
    (x - mgX) ** 2
    + (y - mgY) ** 2,
  )
  console.log(`🚀 ~${currentNodeInfo.nodeName} ~ ${mgNodeInfo.nodeName}`, positionDistance)

  const sizeDistance = Math.sqrt(
    (width - mgWidth) ** 2
    + (height - mgHeight) ** 2,
  )

  // 综合距离（可以调整位置和尺寸的权重）
  const totalDistance = positionDistance * 0.7 + sizeDistance * 0.3

  // 只有在距离小于阈值时才考虑更新
  if (totalDistance < minDistance && totalDistance < MAX_ACCEPTABLE_DISTANCE) {
    minDistance = totalDistance
    matchedNodeId = mgNodeInfo.uniqueId
  }
  return matchedNodeId
}

const domNode = {
  2: '771fca70-15b5-4571-b571-febbfcd07106',
  4: '771fca70-15b5-4571-b571-febbfcd07106',
  6: '771fca70-15b5-4571-b571-febbfcd07106',
  8: 'c2cc8ddf-74ec-4c32-af74-0d6133031793',
  nodeName: '.',
  uniqueId: '51807590-d955-4579-bcc7-333d354e95c8',
  children: [],
  boundingRect: {
    x: 16.125,
    y: 63.875,
    width: 3,
    height: 16.125,
  },
  parentId: '771fca70-15b5-4571-b571-febbfcd07106',
  paddingInfo: {
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  borderInfo: {
    borderWidth: {
      borderWidthLeft: 0,
      borderWidthRight: 0,
      borderWidthTop: 0,
      borderWidthBottom: 0,
    },
    borderColor: {
      borderColorLeft: 'rgb(17, 17, 17)',
      borderColorRight: 'rgb(17, 17, 17)',
      borderColorTop: 'rgb(17, 17, 17)',
      borderColorBottom: 'rgb(17, 17, 17)',
    },
  },
  backgroundColor: 'background-image',
  sibling: [
    'c2cc8ddf-74ec-4c32-af74-0d6133031793',
  ],
}

const designNode = {
  sibling: [],
  children: [],
  nodeName: '矩形',
  uniqueId: '68:0184',
  boundingRect: {
    x: 16,
    y: 63,
    width: 3,
    height: 16,
  },
  parentId: '',
  paddingInfo: {
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  borderInfo: {
    borderWidth: {
      borderWidthLeft: 0,
      borderWidthRight: 0,
      borderWidthTop: 0,
      borderWidthBottom: 0,
    },
    borderColor: {
      borderColorLeft: 'rgba(150.9600019454956, 150.9600019454956, 150.9600019454956, 1)',
      borderColorRight: 'rgba(150.9600019454956, 150.9600019454956, 150.9600019454956, 1)',
      borderColorTop: 'rgba(150.9600019454956, 150.9600019454956, 150.9600019454956, 1)',
      borderColorBottom: 'rgba(150.9600019454956, 150.9600019454956, 150.9600019454956, 1)',
    },
  },
  backgroundColor: 'rgba(255, 72.00000330805779, 60.00000022351742, 1)',
}

getSamePositionNode(domNode, designNode)
