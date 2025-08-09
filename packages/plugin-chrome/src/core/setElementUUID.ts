import { v4 } from 'uuid'

export default function setElementUUID(rootNode: Element) {
  // 如果节点已经有 unique-id，则跳过
  if (!rootNode.getAttribute('unique-id')) {
    rootNode.setAttribute('unique-id', v4())
  }

  // 递归处理所有子节点
  const children = rootNode.children
  for (let i = 0; i < children.length; i++) {
    setElementUUID(children[i])
  }
}
