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

export enum NodeFlexType {
  NOT_FLEX = -1,
  NOT_FLEX_1 = 0,
  FLEX_COLUMN_1 = 1,
  FLEX_ROW_1 = 2,
}

/** ios部分头的高度 */
export const PHONE_HEADER_HEIGHT = 88
/** ios底部安全距离的高度 */
export const SAFE_BOTTOM_HEIGHT = 68
