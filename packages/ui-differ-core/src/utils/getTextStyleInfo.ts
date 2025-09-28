import type { TextStyleInfo } from '../types'

export function getDomTextStyleInfo(domNode: Element): TextStyleInfo | undefined {
  // 检查节点是否包含子元素（非纯文本）
  if (domNode.children.length > 0) {
    return undefined
  }

  const textContent = domNode.textContent?.trim()
  if (!textContent) {
    return undefined
  }

  // 创建临时测量元素
  const measureElement = document.createElement('div')
  const computedStyle = window.getComputedStyle(domNode)

  // 复制关键样式到测量元素
  measureElement.style.position = 'absolute'
  measureElement.style.visibility = 'hidden'
  measureElement.style.whiteSpace = computedStyle.whiteSpace
  measureElement.style.wordBreak = computedStyle.wordBreak
  measureElement.style.wordWrap = computedStyle.wordWrap
  measureElement.style.fontSize = computedStyle.fontSize
  measureElement.style.fontFamily = computedStyle.fontFamily
  measureElement.style.fontWeight = computedStyle.fontWeight
  measureElement.style.lineHeight = computedStyle.lineHeight
  measureElement.style.width = `${domNode.getBoundingClientRect().width}px`
  measureElement.style.padding = '0'
  measureElement.style.margin = '0'
  measureElement.style.border = 'none'

  // 设置文本内容
  measureElement.textContent = textContent

  // 添加到DOM中进行测量
  document.body.appendChild(measureElement)

  // 获取文本内容的实际高度
  const textHeight = measureElement.getBoundingClientRect().height

  // 移除临时元素
  document.body.removeChild(measureElement)

  // 获取行高数值
  const lineHeightValue: number = Number(computedStyle.lineHeight.replace('px', ''))

  // 计算行数：文本高度除以行高
  const lineCount = Math.max(1, Math.round(textHeight / lineHeightValue))

  return {
    lineHeight: lineHeightValue,
    textLineCount: lineCount,
  }
}

export function getDesignNodeTextStyle(designNode: SceneNode): TextStyleInfo | undefined {
  if (designNode.type !== 'TEXT') {
    return undefined
  }

  const { textAutoResize, textStyles } = designNode
  // 行高四舍五入他的px值
  const lineHeightValue = Math.max(...textStyles.map(it => Math.round(it.textStyle.lineHeightByPx)))
  if (textAutoResize === 'WIDTH_AND_HEIGHT') {
    // 单行模式
    return {
      lineHeight: lineHeightValue,
      textLineCount: 1,
    }
  }

  if (textAutoResize === 'HEIGHT') {
    // 行数自适应，返回高度 / 行高的最小整数, 至少是1行
    return {
      lineHeight: lineHeightValue,
      textLineCount: Math.max(Math.floor(designNode.height / lineHeightValue), 1),
    }
  }

  const currentBoundingHeight = designNode.absoluteBoundingBox.height

  const realRenderHeight = designNode.absoluteRenderBounds?.height ?? currentBoundingHeight

  const deltaHeight = currentBoundingHeight - realRenderHeight

  if (deltaHeight < 0) {
    // TODO: 需要在插件侧限制处理
    console.error('实际高度小于当前高度，请联系ui')
  }

  if (deltaHeight > lineHeightValue) {
    // TODO: 需要在插件侧限制处理
    console.error('文本节点设置了过高的宽度，不符合标准，请联系UI修改设计图')
  }

  return {
    lineHeight: lineHeightValue,
    // 实际渲染的高度肯定小于行高，所以向上取整 TODO: 需要处理文字高度小于整体高度的情况
    textLineCount: Math.max(Math.ceil(realRenderHeight / lineHeightValue), 1),
  }
}
