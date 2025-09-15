import type { DiffResultInfo, NodeInfo, UniqueId } from '@ui-differ/core'
import { SiblingPosition } from '@ui-differ/core'

function getIsPureTextNode(nodeInfo: NodeInfo, flatNodeMap: Map<UniqueId, NodeInfo>) {
  // 有两个及以上的子节点，不是纯文本节点
  if (nodeInfo.children.length > 1)
    return false
  // 有一个子节点
  if (nodeInfo.children.length === 1) {
    const childNode = flatNodeMap.get(nodeInfo.children[0])
    // 子节点没信息，视为异常
    if (!childNode)
      return false
    const { width: childWidth, height: childHeight, x: childX, y: childY } = childNode?.boundingRect || {}
    const { width: nodeWidth, height: nodeHeight, x: nodeX, y: nodeY } = nodeInfo.boundingRect
    const isTotallySame = childWidth === nodeWidth && childHeight === nodeHeight && childX === nodeX && childY === nodeY
    // 和子节点不完全重合，不是纯文本节点
    if (!isTotallySame) {
      return false
    }
    // 完全重合，判断子节点是否为纯文本节点
    return getIsPureTextNode(childNode, flatNodeMap)
  }

  // 没有子节点，常规判断
  const element = document.querySelector(`[unique-id="${nodeInfo.uniqueId}"]`)
  const childNodeList = Array.from(element?.childNodes || [])
  const isPureText = !!childNodeList.length && childNodeList.every(it => it.nodeType === Node.TEXT_NODE)
  return isPureText
}

/**
 * 过滤差异结果
 * @param diffResult 差异结果
 * @returns
 */
export function diffResultFilterRules(diffResult: DiffResultInfo, flatNodeMap: Map<UniqueId, NodeInfo>) {
  const { distanceResult, originNode, designNode } = diffResult
  const originElement = document.querySelector(`[unique-id="${originNode.uniqueId}"]`)
  // 过滤文本节点
  const isDataTextWrapper = originElement?.getAttribute('data-text-wrapper')
  if (isDataTextWrapper) {
    const { marginLeft } = distanceResult
    return !!marginLeft
  }

  const isPureText = getIsPureTextNode(originNode, flatNodeMap)

  // // 过滤空节点
  // const hasNoChild = !originNode.children?.length
  // const emptyText = originElement?.textContent?.trim() === ''
  // const transparentBg = originNode.backgroundColor === 'transparent'
  // const borderWidthList = Object.values(originNode.borderInfo?.borderWidth || {})
  // const borderColorList = Object.values(originNode.borderInfo?.borderColor || {})
  // const noneBorder = borderWidthList.every(it => !it) || borderColorList.every(it => it === 'transparent')
  // const isEmptyNode = hasNoChild && emptyText && transparentBg && noneBorder
  // if (isEmptyNode) {
  //   // 空节点直接过滤
  //   return false
  // }

  const { marginLeft, marginTop, marginBottom, marginRight, width, height } = distanceResult
  const originNodeLeftMargin = originNode.neighborMarginInfo[SiblingPosition.LEFT]
  const designNodeLeftMargin = designNode.neighborMarginInfo[SiblingPosition.LEFT]
  const originNodeTopMargin = originNode.neighborMarginInfo[SiblingPosition.TOP]
  const designNodeTopMargin = designNode.neighborMarginInfo[SiblingPosition.TOP]
  const originNodeRightMargin = originNode.neighborMarginInfo[SiblingPosition.RIGHT]
  const designNodeRightMargin = designNode.neighborMarginInfo[SiblingPosition.RIGHT]
  const originNodeBottomMargin = originNode.neighborMarginInfo[SiblingPosition.BOTTOM]
  const designNodeBottomMargin = designNode.neighborMarginInfo[SiblingPosition.BOTTOM]

  const isValidateLeft = originNodeLeftMargin?.isDirectlySibling === designNodeLeftMargin?.isDirectlySibling
  const isValidateTop = originNodeTopMargin?.isDirectlySibling === designNodeTopMargin?.isDirectlySibling
  const isValidateRight = originNodeRightMargin?.isDirectlySibling === designNodeRightMargin?.isDirectlySibling
  const isValidateBottom = originNodeBottomMargin?.isDirectlySibling === designNodeBottomMargin?.isDirectlySibling

  const isSameWidth = !!width && !isPureText
  const isSameHeight = !!height && !isPureText
  const isSameMarginLeft = !!marginLeft && isValidateLeft
  const isSameMarginTop = !!marginTop && isValidateTop
  const isSameMarginRight = !!marginRight && isValidateRight
  const isSameMarginBottom = !!marginBottom && isValidateBottom

  return isSameWidth
    || isSameHeight
    || isSameMarginLeft
    || isSameMarginTop
    || isSameMarginRight
    || isSameMarginBottom
}
