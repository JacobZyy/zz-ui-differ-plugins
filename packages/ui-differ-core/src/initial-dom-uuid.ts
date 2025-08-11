import { v4 } from 'uuid'

export function initialDomUUID(rootDom: Element) {
// 如果节点已经有 unique-id，则跳过
  if (!rootDom.getAttribute('unique-id')) {
    rootDom.setAttribute('unique-id', v4())
  }

  // 递归处理所有子节点
  const children = rootDom.children
  for (let i = 0; i < children.length; i++) {
    initialDomUUID(children[i])
  }
}
