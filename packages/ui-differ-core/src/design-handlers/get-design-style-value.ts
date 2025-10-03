import type { BorderInfo, PaddingInfo } from '../types'
import type { ConvertFunction } from './design-converter'

/**
 * 获取dom的背景色，如果背景色为透明，则返回'transparent'
 * @param designNode 目标设计稿节点
 * @returns 背景色
 */
export function getDesignBackgroundColor(designNode: SceneNode) {
  if (!('fills' in designNode) || !designNode.fills?.length) {
    return 'transparent'
  }
  const fillInfo = designNode.fills[0]
  if (fillInfo.type !== 'SOLID') {
    return 'background-image'
  }
  const { r, g, b, a } = fillInfo.color
  if (!a) {
    return 'transparent'
  }
  return `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`
}

/**
 * 获取设计稿的边框颜色信息
 * @param designNode 目标设计稿节点
 * @returns 边框颜色信息
 */
function getBorderColorInfo(designNode: SceneNode): BorderInfo['borderColor'] {
  if (designNode.type === 'SLICE') {
    return {
      borderColorLeft: 'transparent',
      borderColorRight: 'transparent',
      borderColorTop: 'transparent',
      borderColorBottom: 'transparent',
    }
  }

  const strokeFill = designNode.strokes?.[0]
  if (!strokeFill || strokeFill.type !== 'SOLID' || !strokeFill.color.a) {
    return {
      borderColorLeft: 'transparent',
      borderColorRight: 'transparent',
      borderColorTop: 'transparent',
      borderColorBottom: 'transparent',
    }
  }
  const { r, g, b, a } = strokeFill.color
  const color = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`
  return {
    borderColorLeft: color,
    borderColorRight: color,
    borderColorTop: color,
    borderColorBottom: color,
  }
}

/**
 * 创建可配置的设计样式值获取器
 * @param converter 转换函数
 * @returns 样式值获取器对象
 */
export function createDesignStyleValueGetters(converter: ConvertFunction) {
  /**
   * 获取设计稿的内边距的值
   * @param designNode 目标设计稿节点
   * @returns 内边距信息
   */
  function getDesignPaddingInfo(designNode: SceneNode): PaddingInfo {
    // 只有Frame节点开启自动布局的时候才会产生有效padding
    if (designNode.type !== 'FRAME' || designNode.flexMode === 'NONE') {
      return {
        paddingLeft: 0,
        paddingRight: 0,
        paddingTop: 0,
        paddingBottom: 0,
      }
    }
    const paddingLeft = converter(designNode.paddingLeft)
    const paddingRight = converter(designNode.paddingRight)
    const paddingTop = converter(designNode.paddingTop)
    const paddingBottom = converter(designNode.paddingBottom)
    return {
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
    }
  }

  /**
   * 获取设计稿的边框宽度信息
   * @param designNode 目标设计稿节点
   * @returns 边框宽度信息
   */
  function getBorderWidthInfo(designNode: SceneNode): BorderInfo['borderWidth'] {
    // 切片节点没有边框
    if (designNode.type === 'SLICE') {
      return {
        borderWidthLeft: 0,
        borderWidthRight: 0,
        borderWidthTop: 0,
        borderWidthBottom: 0,
      }
    }
    // 矩形、实例、组件、组件集节点
    if (designNode.type === 'FRAME' || designNode.type === 'RECTANGLE' || designNode.type === 'INSTANCE' || designNode.type === 'COMPONENT' || designNode.type === 'COMPONENT_SET') {
      // 有单独的边框宽度，返回对应的边框宽度
      return {
        borderWidthLeft: converter(designNode.strokeTopWeight),
        borderWidthRight: converter(designNode.strokeRightWeight),
        borderWidthTop: converter(designNode.strokeTopWeight),
        borderWidthBottom: converter(designNode.strokeBottomWeight),
      }
    }
    // 其他节点，返回统一的边框宽度
    return {
      borderWidthLeft: converter(designNode.strokeWeight),
      borderWidthRight: converter(designNode.strokeWeight),
      borderWidthTop: converter(designNode.strokeWeight),
      borderWidthBottom: converter(designNode.strokeWeight),
    }
  }

  /**
   * 获取设计稿的边框信息
   * @param designNode 目标设计稿节点
   * @returns 边框信息
   */
  function getDesignBorderInfo(designNode: SceneNode): BorderInfo {
    return {
      borderWidth: getBorderWidthInfo(designNode),
      borderColor: getBorderColorInfo(designNode),
    }
  }

  return {
    getDesignPaddingInfo,
    getDesignBorderInfo,
    getDesignBackgroundColor,
  }
}
