import type { DiffResultInfo } from '@ui-differ/core'
import { SiblingPosition } from '@ui-differ/core'

/**
 * 过滤差异结果
 * @param diffResult 差异结果
 * @returns
 */
export function diffResultFilterRules(diffResult: DiffResultInfo) {
  const { distanceResult, originNode, designNode } = diffResult
  const originElement = document.querySelector(`[unique-id="${originNode.uniqueId}"]`)
  // 过滤文本节点
  const isDataTextWrapper = originElement?.getAttribute('data-text-wrapper')
  if (isDataTextWrapper) {
    const { marginLeft } = distanceResult
    return !!marginLeft
  }

  // 过滤空节点
  const hasNoChild = !originNode.children?.length
  const emptyText = originElement?.textContent?.trim() === ''
  const transparentBg = originNode.backgroundColor === 'transparent'
  const borderWidthList = Object.values(originNode.borderInfo?.borderWidth || {})
  const borderColorList = Object.values(originNode.borderInfo?.borderColor || {})
  const noneBorder = borderWidthList.every(it => !it) || borderColorList.every(it => it === 'transparent')
  const isEmptyNode = hasNoChild && emptyText && transparentBg && noneBorder
  if (isEmptyNode) {
    // 空节点直接过滤
    return false
  }

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

  const isSameWidth = !!width
  const isSameHeight = !!height
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
