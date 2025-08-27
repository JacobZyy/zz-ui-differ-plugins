import { v4 } from 'uuid'

/**
 * 为 DOM 树中的所有节点（包括文本节点）添加唯一标识符
 * 文本节点只有在其兄弟节点中存在非文本节点时才会被包装在 span 元素中
 * @param rootDom - 根节点元素
 */
export function initialDomUUID(rootDom: Element): void {
  // 如果节点已经有 unique-id，则跳过
  if (!rootDom.getAttribute('unique-id')) {
    rootDom.setAttribute('unique-id', v4())
  }

  // 处理所有子节点（包括文本节点）
  const childNodes = Array.from(rootDom.childNodes)

  // NOTE: 这段逻辑删除，方便处理文本节点比对
  // 检查是否需要包装文本节点（只有在兄弟节点中有非文本节点时才包装）
  // const shouldWrapTextNodes = hasMixedNodeTypes(childNodes)

  childNodes.forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      // 递归处理元素节点
      return initialDomUUID(child as Element)
    }

    if (child.nodeType === Node.TEXT_NODE) {
      // 只有在需要包装且文本非空时才处理文本节点
      const textContent = child.textContent?.trim()
      if (!textContent) {
        return
      }
      return wrapTextNodeWithSpan(child as Text, rootDom)
    }
  })
}

/**
 * 检查子节点列表是否包含混合的节点类型（文本节点和元素节点）
 * @param childNodes - 子节点列表
 * @returns 是否包含混合类型的节点
 */
// function hasMixedNodeTypes(childNodes: Node[]): boolean {
//   const hasTextNode = childNodes.some(node => node.nodeType === Node.TEXT_NODE)
//   const hasElementNode = childNodes.some(node => node.nodeType === Node.ELEMENT_NODE)
//   return hasTextNode && hasElementNode
// }

/**
 * 将文本节点包装在带有 unique-id 的 span 元素中
 * 使用内联样式重置所有可能的样式属性，避免被外部 CSS 影响
 * @param textNode - 要包装的文本节点
 * @param parentElement - 父元素
 */
function wrapTextNodeWithSpan(textNode: Text, parentElement: Element): void {
  // 创建包装的 span 元素
  const wrapper = document.createElement('span')
  wrapper.setAttribute('unique-id', v4())
  wrapper.setAttribute('data-text-wrapper', 'true') // 标记这是文本包装器

  // 使用内联样式重置所有可能影响文本显示的样式属性
  // 这样可以确保 span 不会改变文本的任何视觉表现
  wrapper.style.cssText = `
    display: inline-block !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    background: transparent !important;
    font: inherit !important;
    color: inherit !important;
    text-decoration: inherit !important;
    text-transform: inherit !important;
    letter-spacing: inherit !important;
    word-spacing: inherit !important;
    text-align: inherit !important;
    vertical-align: inherit !important;
    white-space: inherit !important;
    overflow: inherit !important;
    position: static !important;
    float: none !important;
    clear: none !important;
    visibility: inherit !important;
    opacity: inherit !important;
    z-index: auto !important;
    box-shadow: none !important;
    outline: none !important;
    transform: none !important;
    transition: none !important;
    animation: none !important;
    lineHeight: 1em !important;
  `.replace(/\s+/g, ' ').trim()

  // 将文本节点移动到 span 中
  wrapper.appendChild(textNode.cloneNode(true))

  // 替换原文本节点
  parentElement.replaceChild(wrapper, textNode)
}
