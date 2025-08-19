import type { BorderInfo, DomMarginInfo, PaddingInfo } from '../types'
import { getRealColor, processTransparentColor } from '../utils/process-color-value'

function getDomScaleTransformValue(computedStyle: CSSStyleDeclaration) {
  // 获取transform矩阵
  const transformMatrix = computedStyle.getPropertyValue('transform')
  // 获取transform矩阵数组
  const transformMatrixArray = transformMatrix.split('(')?.[1]?.split(')')?.[0]?.split(',')?.map(Number) || []
  // 判断是否为3d变换
  const is3dTransform = transformMatrixArray.length > 6
  // 获取x轴缩放比例
  const scaleX = (is3dTransform ? transformMatrixArray[0] : transformMatrixArray[0]) || 1
  // 获取y轴缩放比例
  const scaleY = is3dTransform ? transformMatrixArray[3] : transformMatrixArray[1] || 1
  return {
    scaleX,
    scaleY,
  }
}

/**
 * 获取dom的内边距的值
 * @param dom 目标dom
 * @param styleName 样式名
 * @returns 样式值
 */
export function getDomPaddingInfo(dom: Element): PaddingInfo {
  // 获取dom的计算样式
  const computedStyle = window.getComputedStyle(dom)

  // 获取dom的样式值
  const paddingLeft = Number(computedStyle.getPropertyValue('padding-left').replace('px', '')) || 0
  const paddingRight = Number(computedStyle.getPropertyValue('padding-right').replace('px', '')) || 0
  const paddingTop = Number(computedStyle.getPropertyValue('padding-top').replace('px', '')) || 0
  const paddingBottom = Number(computedStyle.getPropertyValue('padding-bottom').replace('px', '')) || 0
  const { scaleX, scaleY } = getDomScaleTransformValue(computedStyle)

  const paddingInfo: PaddingInfo = {
    paddingLeft: paddingLeft / scaleX,
    paddingRight: paddingRight / scaleX,
    paddingTop: paddingTop / scaleY,
    paddingBottom: paddingBottom / scaleY,
  }
  return paddingInfo
}

/**
 * 获取dom的背景色，如果背景色为透明，则返回'transparent'
 * @param dom 目标dom
 * @returns 背景色
 */
export function getDomBackgroundColor(dom: Element): string {
  const computedStyle = window.getComputedStyle(dom)
  const image = computedStyle.getPropertyValue('background-image')
  if (image && image !== 'none') {
    return 'background-image'
  }
  const color = computedStyle.getPropertyValue('background-color')
  return processTransparentColor(color)
}

/**
 * 获取dom的边框信息
 * @param computedStyle 目标dom的计算样式
 * @returns 边框信息
 */
function getDomBorderInfoByComputedStyle(computedStyle: CSSStyleDeclaration): BorderInfo {
  const { scaleX, scaleY } = getDomScaleTransformValue(computedStyle)
  const borderWidthLeft = (Number(computedStyle.getPropertyValue('border-left-width').replace('px', '')) || 0) / scaleX
  const borderWidthRight = (Number(computedStyle.getPropertyValue('border-right-width').replace('px', '')) || 0) / scaleX
  const borderWidthTop = (Number(computedStyle.getPropertyValue('border-top-width').replace('px', '')) || 0) / scaleY
  const borderWidthBottom = (Number(computedStyle.getPropertyValue('border-bottom-width').replace('px', '')) || 0) / scaleY
  const borderColorLeft = processTransparentColor(computedStyle.getPropertyValue('border-left-color'))
  const borderColorRight = processTransparentColor(computedStyle.getPropertyValue('border-right-color'))
  const borderColorTop = processTransparentColor(computedStyle.getPropertyValue('border-top-color'))
  const borderColorBottom = processTransparentColor(computedStyle.getPropertyValue('border-bottom-color'))

  const borderWidth: BorderInfo['borderWidth'] = {
    borderWidthLeft: borderWidthLeft > 0 ? Math.max(borderWidthLeft, 1) : 0,
    borderWidthRight: borderWidthRight > 0 ? Math.max(borderWidthRight, 1) : 0,
    borderWidthTop: borderWidthTop > 0 ? Math.max(borderWidthTop, 1) : 0,
    borderWidthBottom: borderWidthBottom > 0 ? Math.max(borderWidthBottom, 1) : 0,
  }

  const borderColor: BorderInfo['borderColor'] = {
    borderColorLeft,
    borderColorRight,
    borderColorTop,
    borderColorBottom,
  }
  return {
    borderWidth,
    borderColor,
  }
}

/**
 * 获取dom的边框信息
 * @param dom 目标dom
 * @returns 边框信息
 */
export function getDomBorderInfo(dom: Element): BorderInfo {
  const computedStyle = window.getComputedStyle(dom)
  const pseudoBeforeStyle = window.getComputedStyle(dom, '::before')
  const pseudoAfterStyle = window.getComputedStyle(dom, '::after')
  const originDomBorderInfo = getDomBorderInfoByComputedStyle(computedStyle)
  const pseudoBeforeBorderInfo = getDomBorderInfoByComputedStyle(pseudoBeforeStyle)
  const pseudoAfterBorderInfo = getDomBorderInfoByComputedStyle(pseudoAfterStyle)

  /**
   * 获取真实的边框宽度
   * 优先使用原始dom的边框宽度
   * 如果原始dom的边框宽度为0，则使用伪元素的边框宽度
   */
  const realBorderWidthLeft = originDomBorderInfo.borderWidth.borderWidthLeft || pseudoBeforeBorderInfo.borderWidth.borderWidthLeft || pseudoAfterBorderInfo.borderWidth.borderWidthLeft
  const realBorderWidthRight = originDomBorderInfo.borderWidth.borderWidthRight || pseudoBeforeBorderInfo.borderWidth.borderWidthRight || pseudoAfterBorderInfo.borderWidth.borderWidthRight
  const realBorderWidthTop = originDomBorderInfo.borderWidth.borderWidthTop || pseudoBeforeBorderInfo.borderWidth.borderWidthTop || pseudoAfterBorderInfo.borderWidth.borderWidthTop
  const realBorderWidthBottom = originDomBorderInfo.borderWidth.borderWidthBottom || pseudoBeforeBorderInfo.borderWidth.borderWidthBottom || pseudoAfterBorderInfo.borderWidth.borderWidthBottom

  /**
   * 获取真实的边框颜色
   * 优先使用原始dom的边框颜色
   * 如果原始dom的边框颜色为透明，则使用伪元素的边框颜色
   */
  const realBorderColorLeft = getRealColor([originDomBorderInfo.borderColor.borderColorLeft, pseudoBeforeBorderInfo.borderColor.borderColorLeft, pseudoAfterBorderInfo.borderColor.borderColorLeft])
  const realBorderColorRight = getRealColor([originDomBorderInfo.borderColor.borderColorRight, pseudoBeforeBorderInfo.borderColor.borderColorRight, pseudoAfterBorderInfo.borderColor.borderColorRight])
  const realBorderColorTop = getRealColor([originDomBorderInfo.borderColor.borderColorTop, pseudoBeforeBorderInfo.borderColor.borderColorTop, pseudoAfterBorderInfo.borderColor.borderColorTop])
  const realBorderColorBottom = getRealColor([originDomBorderInfo.borderColor.borderColorBottom, pseudoBeforeBorderInfo.borderColor.borderColorBottom, pseudoAfterBorderInfo.borderColor.borderColorBottom])

  return {
    borderWidth: {
      borderWidthLeft: realBorderWidthLeft,
      borderWidthRight: realBorderWidthRight,
      borderWidthTop: realBorderWidthTop,
      borderWidthBottom: realBorderWidthBottom,
    },
    borderColor: {
      borderColorLeft: realBorderColorLeft,
      borderColorRight: realBorderColorRight,
      borderColorTop: realBorderColorTop,
      borderColorBottom: realBorderColorBottom,
    },
  }
}
/**
 * 判断DOM元素是否建立了块级格式化上下文(BFC)
 * @param dom 目标DOM元素
 * @returns 是否为BFC元素
 */
export function getDomIsBfc(dom: Element): boolean {
  const computedStyle = window.getComputedStyle(dom)
  // 根元素(html)
  if (dom === document.documentElement) {
    return true
  }

  // float值不为none
  const float = computedStyle.getPropertyValue('float')
  if (float !== 'none') {
    return true
  }

  // position值为absolute或fixed
  const position = computedStyle.getPropertyValue('position')
  const bfcPositionSet = new Set(['absolute', 'fixed'])
  if (bfcPositionSet.has(position)) {
    return true
  }

  // display值为inline-block、table-cell、table-caption、flex、inline-flex、grid、inline-grid
  const display = computedStyle.getPropertyValue('display')
  const bfcDisplayValues = new Set(['inline-block', 'table-cell', 'table-caption', 'flex', 'inline-flex', 'grid', 'inline-grid', 'flow-root'])
  if (bfcDisplayValues.has(display)) {
    return true
  }

  // overflow值不为visible
  const overflow = computedStyle.getPropertyValue('overflow')
  const overflowX = computedStyle.getPropertyValue('overflow-x')
  const overflowY = computedStyle.getPropertyValue('overflow-y')

  if (overflow !== 'visible' || overflowX !== 'visible' || overflowY !== 'visible') {
    return true
  }

  // contain值为layout、content或paint
  const contain = computedStyle.getPropertyValue('contain')
  if (contain && (contain.includes('layout') || contain.includes('content') || contain.includes('paint'))) {
    return true
  }

  // column-count或column-width不为auto
  const columnCount = computedStyle.getPropertyValue('column-count')
  const columnWidth = computedStyle.getPropertyValue('column-width')
  if (columnCount !== 'auto' || columnWidth !== 'auto') {
    return true
  }

  return false
}

/**
 * 获取dom的内边距的值
 * @param dom 目标dom
 * @param styleName 样式名
 * @returns 样式值
 */
export function getDomMarginInfo(dom: Element): DomMarginInfo {
  // 获取dom的计算样式
  const computedStyle = window.getComputedStyle(dom)
  const marginTop = Number(computedStyle.getPropertyValue('margin-top').replace('px', '')) || 0
  const marginBottom = Number(computedStyle.getPropertyValue('margin-bottom').replace('px', '')) || 0

  const marginInfo: DomMarginInfo = {
    marginTop,
    marginBottom,
  }
  return marginInfo
}
