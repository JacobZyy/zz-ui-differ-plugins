import type { BorderInfo, PaddingInfo } from '../types'

/**
 * 获取dom的内边距的值
 * @param dom 目标dom
 * @param styleName 样式名
 * @returns 样式值
 */
export function getPaddingInfo(dom: Element): PaddingInfo {
  // 获取dom的计算样式
  const computedStyle = window.getComputedStyle(dom)
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
  // 获取dom的样式值
  const paddingLeft = Number(computedStyle.getPropertyValue('padding-left').replace('px', '')) || 0
  const paddingRight = Number(computedStyle.getPropertyValue('padding-right').replace('px', '')) || 0
  const paddingTop = Number(computedStyle.getPropertyValue('padding-top').replace('px', '')) || 0
  const paddingBottom = Number(computedStyle.getPropertyValue('padding-bottom').replace('px', '')) || 0

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
export function getBackgroundColor(dom: Element) {
  const computedStyle = window.getComputedStyle(dom)
  const image = computedStyle.getPropertyValue('background-image')
  if (image) {
    return 'background-image'
  }
  const color = computedStyle.getPropertyValue('background-color')
  const colorArray = color.split('(')[1].split(')')[0].split(',').map(Number)
  const alphaValue = colorArray[3] || 1
  if (!alphaValue) {
    return 'transparent'
  }
  return color
}

/**
 * 获取dom的边框信息
 * @param dom 目标dom
 * @returns 边框信息
 */
export function getBorderInfo(dom: Element): BorderInfo {
  const computedStyle = window.getComputedStyle(dom)
  const borderWidthLeft = Number(computedStyle.getPropertyValue('border-left-width').replace('px', '')) || 0
  const borderWidthRight = Number(computedStyle.getPropertyValue('border-right-width').replace('px', '')) || 0
  const borderWidthTop = Number(computedStyle.getPropertyValue('border-top-width').replace('px', '')) || 0
  const borderWidthBottom = Number(computedStyle.getPropertyValue('border-bottom-width').replace('px', '')) || 0

  const borderColorLeft = computedStyle.getPropertyValue('border-left-color')
  const borderColorRight = computedStyle.getPropertyValue('border-right-color')
  const borderColorTop = computedStyle.getPropertyValue('border-top-color')
  const borderColorBottom = computedStyle.getPropertyValue('border-bottom-color')

  const borderWidth: BorderInfo['borderWidth'] = {
    borderWidthLeft,
    borderWidthRight,
    borderWidthTop,
    borderWidthBottom,
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
