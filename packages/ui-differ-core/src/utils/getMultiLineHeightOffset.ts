import type { NodeInfo, UniqueId } from '../types'

interface OffsetResult {
  top: number
  height: number
}
interface FlexPositionStrategy {
  calculate: (deltaLineHeight: number, siblingInfo?: SiblingInfo) => OffsetResult
}
interface SiblingInfo {
  currentIndex: number
  totalSiblings: number
  isFirstChild: boolean
  isLastChild: boolean
}

class TopAlignStrategy implements FlexPositionStrategy {
  calculate(deltaLineHeight: number): OffsetResult {
    return {
      top: 0,
      height: deltaLineHeight,
    }
  }
}

class CenterAlignStrategy implements FlexPositionStrategy {
  calculate(deltaLineHeight: number): OffsetResult {
    return {
      top: deltaLineHeight / 2,
      height: deltaLineHeight,
    }
  }
}
class BottomAlignStrategy implements FlexPositionStrategy {
  calculate(deltaLineHeight: number): OffsetResult {
    return {
      top: deltaLineHeight,
      height: deltaLineHeight,
    }
  }
}

type StrategyType = 'top' | 'center' | 'bottom'
class FlexPositionCalculator {
  private elementSiblingInfo: SiblingInfo | undefined

  private strategies = {
    top: new TopAlignStrategy(),
    center: new CenterAlignStrategy(),
    bottom: new BottomAlignStrategy(),
  }

  constructor(elementSiblingInfo: SiblingInfo | undefined) {
    this.elementSiblingInfo = elementSiblingInfo
  }

  /** 计算space-between, space-around, space-evenly的对应的策略 */
  getSpaceStrategyType(justifyContent: string) {
    if (!this.elementSiblingInfo) {
      return 'top'
    }
    const { isFirstChild, isLastChild, totalSiblings } = this.elementSiblingInfo
    if (totalSiblings === 1) {
      if (justifyContent === 'space-between') {
        return 'top'
      }
      return 'center'
    }
    if (isFirstChild) {
      return 'top'
    }
    if (isLastChild) {
      return 'bottom'
    }
    return 'center'
  }

  getNormalFlexStrategyType(flexDirection: string, justifyContent: string, alignItems: string) {
    // 列方向：主轴对齐决定垂直位置
    if (flexDirection === 'column') {
      switch (justifyContent) {
        case 'center':
          return 'center'
        case 'flex-end':
          return 'bottom'
        case 'space-between':
        case 'space-around':
        case 'space-evenly':
          return this.getSpaceStrategyType(justifyContent)
        default:
          return 'top'
      }
    }

    // 行方向：交叉轴对齐决定垂直位置
    if (flexDirection === 'row') {
      switch (alignItems) {
        case 'center':
          return 'center'
        case 'flex-end':
          return 'bottom'
        default:
          return 'top'
      }
    }
  }

  getReverseFlexStrategyType(flexDirection: string, justifyContent: string, alignItems: string): StrategyType {
    const normalValue = this.getNormalFlexStrategyType(flexDirection, justifyContent, alignItems)
    if (normalValue === 'top') {
      return 'bottom'
    }
    if (normalValue === 'bottom') {
      return 'top'
    }

    if (normalValue === 'center') {
      return 'center'
    }
    return 'bottom'
  }

  getStrategyType(flexDirection: string, justifyContent: string, alignItems: string): StrategyType {
    if (flexDirection === 'column-reverse' || flexDirection === 'row-reverse') {
      return this.getReverseFlexStrategyType(flexDirection, justifyContent, alignItems) ?? 'top'
    }
    return this.getNormalFlexStrategyType(flexDirection, justifyContent, alignItems) ?? 'top'
  }

  calculate(strategyType: StrategyType, deltaLineHeight: number): OffsetResult {
    return this.strategies[strategyType].calculate(deltaLineHeight)
  }
}

function getSiblingInfo(currentNodeInfo: NodeInfo, flatNodeMap: Map<UniqueId, NodeInfo>): SiblingInfo | undefined {
  const parentNode = flatNodeMap.get(currentNodeInfo.parentId)
  const parentEl = document.querySelector(`[unique-id="${parentNode?.uniqueId}"]`)
  if (!parentEl) {
    return undefined
  }

  const siblings = Array.from(parentEl.children)
  const currentIndex = siblings.findIndex(el => el.getAttribute('unique-id') === currentNodeInfo.uniqueId)

  if (currentIndex === -1) {
    return undefined
  }

  return {
    currentIndex,
    totalSiblings: siblings.length,
    isFirstChild: currentIndex === 0,
    isLastChild: currentIndex === siblings.length - 1,
  }
}

/**
 * 计算多行文本高度的offset
 * @param currentNodeInfo 当前节点信息
 * @param designNode 设计稿节点信息
 * @param flatNodeMap 扁平化节点信息
 * @returns
 */
export function getMultiLineHeightOffset(currentNodeInfo: NodeInfo, designNode: NodeInfo, flatNodeMap: Map<UniqueId, NodeInfo>) {
  const { textStyleInfo } = currentNodeInfo
  const { textStyleInfo: designNodeTextStyleInfo } = designNode

  const deltaLineCount = (textStyleInfo?.textLineCount || 0) - (designNodeTextStyleInfo?.textLineCount || 0)
  const deltaLineHeight = Math.abs(deltaLineCount) * (textStyleInfo?.lineHeight || 0)

  // 实际行数大于设计稿行数，比对结果应该要减去实际offset，否则应该要加上offset
  const coefficient = deltaLineCount > 0 ? -1 : 1

  if (!deltaLineHeight) {
    return {
      top: 0,
      height: 0,
      coefficient,
    }
  }

  const { flexDirection, justifyContent, alignItems, isFlex } = flatNodeMap.get(currentNodeInfo.parentId)?.nodeFlexInfo || {}

  if (!isFlex) {
    // 不是flex，默认正常文档流。文字居顶，高度变化
    return {
      top: 0,
      height: deltaLineHeight,
      coefficient,
    }
  }

  const elementSiblingInfo = getSiblingInfo(currentNodeInfo, flatNodeMap)

  const calculator = new FlexPositionCalculator(elementSiblingInfo)
  const strategyType = calculator.getStrategyType(flexDirection || '', justifyContent || '', alignItems || '')

  const result = calculator.calculate(strategyType, deltaLineHeight)
  return {
    ...result,
    coefficient,
  }
}
