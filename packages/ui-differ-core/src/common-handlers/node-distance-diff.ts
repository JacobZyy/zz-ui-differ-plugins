import type { DiffResultInfo, NodeInfo, SiblingPosition, UniqueId } from '../types'

import { getSamePositionNode } from './get-same-position-node'

function calculateTopMargin(currentNodeInfo: NodeInfo, topNodeInfo: NodeInfo) {
  return currentNodeInfo.boundingRect.y - topNodeInfo.boundingRect.y - currentNodeInfo.boundingRect.height
}

function calculateBottomMargin(currentNodeInfo: NodeInfo, bottomNodeInfo: NodeInfo) {
  return bottomNodeInfo.boundingRect.y - currentNodeInfo.boundingRect.y - currentNodeInfo.boundingRect.height
}

function calculateLeftMargin(currentNodeInfo: NodeInfo, leftNodeInfo: NodeInfo) {
  return currentNodeInfo.boundingRect.x - leftNodeInfo.boundingRect.x - currentNodeInfo.boundingRect.width
}

function calculateRightMargin(currentNodeInfo: NodeInfo, rightNodeInfo: NodeInfo) {
  return rightNodeInfo.boundingRect.x - currentNodeInfo.boundingRect.x - currentNodeInfo.boundingRect.width
}

/** 计算单个方向的边距 */
function calculateMargin(
  nodeInfo: NodeInfo,
  direction: SiblingPosition,
): number {
  const extraDistanceValueKey: Record<string, 'width' | 'height'> = {
    left: 'width',
    right: 'width',
    top: 'height',
    bottom: 'height',
  }
  if (shouldCalculateParentNode)
    console.log('🚀 ~ calculateMargin :', currentNode.uniqueId, currentNode, shouldCalculateParentNode, currentNode.parentNodeId, distanceMap.has(currentNode.parentNodeId || ''))
  if (shouldCalculateParentNode && currentNode.parentNodeId && distanceMap.has(currentNode.parentNodeId)) {
    const parentNode = distanceMap.get(currentNode.parentNodeId)!
    console.log('🚀 ~ calculateMargin ~ parentNode:', parentNode)
    return parentNode[direction] - currentNode[direction]
  }
  const targetNeighbor = distanceMap.get(keys || '')
  if (shouldSkipCalculateNeighbor || !keys || !targetNeighbor) {
    return currentNode[direction]
  }

  const neighborOppositeDirectValue = targetNeighbor[extraDistanceValueKey[direction]] + targetNeighbor[direction]
  return neighborOppositeDirectValue - currentNode[direction]
}

export function nodeDistanceDiff(domNodeInfo: Map<UniqueId, NodeInfo>, mgNodeInfo: Map<UniqueId, NodeInfo>) {
  const resultMap = new Map<UniqueId, DiffResultInfo>()

  // const diffedDesignNodeSet = new Set<string>()

  domNodeInfo.forEach((currentDomNode, currentDomNodeId) => {
    const targetDeisignNodeId = getSamePositionNode(currentDomNode, mgNodeInfo)
    const designNodeInfo = mgNodeInfo.get(targetDeisignNodeId)
    if (!targetDeisignNodeId || !designNodeInfo) {
      console.error(`当前节点${currentDomNodeId}在mg中没有找到相同位置的节点`, designNodeInfo, mgNodeInfo)
      return
    }

    const {
      [SiblingPosition.BOTTOM]: bottomKeys,
      [SiblingPosition.LEFT]: leftKeys,
      [SiblingPosition.RIGHT]: rightKeys,
      [SiblingPosition.TOP]: topKeys,
    } = currentDomNode
    const {
      [SiblingPosition.BOTTOM]: designBottomKeys,
      [SiblingPosition.LEFT]: designLeftKeys,
      [SiblingPosition.RIGHT]: designRightKeys,
      [SiblingPosition.TOP]: designTopKeys,
    } = designNodeInfo

    const realHasTopNeighbors = !!topKeys && !!designTopKeys
    const realHasBottomNeighbors = !!bottomKeys && !!designBottomKeys
    const realHasLeftNeighbors = !!leftKeys && !!designLeftKeys
    const realHasRightNeighbors = !!rightKeys && !!designRightKeys

    // 计算DOM节点的四个方向边距
    const domRealMarginLeft = calculateMargin({
      keys: leftKeys,
      distanceMap: domDistanceInfo,
      currentNode: currentNodeDistanceInfo,
      direction: 'left',
      shouldSkipCalculateNeighbor: !realHasLeftNeighbors,
    })
    const domRealMarginRight = calculateMargin({
      keys: rightKeys,
      distanceMap: domDistanceInfo,
      currentNode: currentNodeDistanceInfo,
      direction: 'right',
      shouldSkipCalculateNeighbor: !realHasRightNeighbors,
    })
    const domRealMarginTop = calculateMargin({
      keys: topKeys,
      distanceMap: domDistanceInfo,
      currentNode: currentNodeDistanceInfo,
      direction: 'top',
      shouldSkipCalculateNeighbor: !realHasTopNeighbors,
    })
    const domRealMarginBottom = calculateMargin({
      keys: bottomKeys,
      distanceMap: domDistanceInfo,
      currentNode: currentNodeDistanceInfo,
      direction: 'bottom',
      shouldSkipCalculateNeighbor: !realHasBottomNeighbors,
    })

    // 计算设计稿节点的四个方向边距
    const designRealMarginLeft = calculateMargin({
      keys: designLeftKeys,
      distanceMap: mgDistanceInfoMap,
      currentNode: designNodeDistanceInfo,
      direction: 'left',
      shouldSkipCalculateNeighbor: !realHasLeftNeighbors,
    })
    const designRealMarginRight = calculateMargin({
      keys: designRightKeys,
      distanceMap: mgDistanceInfoMap,
      currentNode: designNodeDistanceInfo,
      direction: 'right',
      shouldSkipCalculateNeighbor: !realHasRightNeighbors,
    })
    const designRealMarginTop = calculateMargin({
      keys: designTopKeys,
      distanceMap: mgDistanceInfoMap,
      currentNode: designNodeDistanceInfo,
      direction: 'top',
      shouldSkipCalculateNeighbor: !realHasTopNeighbors,
    })
    const designRealMarginBottom = calculateMargin({
      keys: designBottomKeys,
      distanceMap: mgDistanceInfoMap,
      currentNode: designNodeDistanceInfo,
      direction: 'bottom',
      shouldSkipCalculateNeighbor: !realHasBottomNeighbors,
    })

    const diffResultInfo: DiffResultInfo = {
      width: fixedSubstract(currentNodeDistanceInfo.width, designNodeDistanceInfo.width),
      height: fixedSubstract(currentNodeDistanceInfo.height, designNodeDistanceInfo.height),
      marginRight: fixedSubstract(domRealMarginRight, designRealMarginRight),
      marginBottom: fixedSubstract(domRealMarginBottom, designRealMarginBottom),
      marginLeft: fixedSubstract(domRealMarginLeft, designRealMarginLeft),
      marginTop: fixedSubstract(domRealMarginTop, designRealMarginTop),
      nodeLeft: currentNodeDistanceInfo.left,
      nodeTop: currentNodeDistanceInfo.top,
      nodeWidth: currentNodeDistanceInfo.width,
      nodeHeight: currentNodeDistanceInfo.height,
      designNodeName: designNodeDistanceInfo.nodeName || '设计图节点未命名',
      designNodeId: designNodeDistanceInfo.uniqueId,
      domMarginRight: calculateMargin({
        keys: rightKeys,
        distanceMap: domDistanceInfo,
        currentNode: currentNodeDistanceInfo,
        direction: 'right',
        shouldCalculateParentNode: true,
      }),
      domMarginBottom: calculateMargin({
        keys: bottomKeys,
        distanceMap: domDistanceInfo,
        currentNode: currentNodeDistanceInfo,
        direction: 'bottom',
        shouldCalculateParentNode: true,
      }),
      domMarginLeft: calculateMargin({
        keys: leftKeys,
        distanceMap: domDistanceInfo,
        currentNode: currentNodeDistanceInfo,
        direction: 'left',
        shouldCalculateParentNode: true,
      }),
      domMarginTop: calculateMargin({
        keys: topKeys,
        distanceMap: domDistanceInfo,
        currentNode: currentNodeDistanceInfo,
        direction: 'top',
        shouldCalculateParentNode: true,
      }),
    }

    if (designNodeDistanceInfo.uniqueId === '18:217') {
      console.log('🚀 ~ handleCalculateDiffInfo ~ diffResultInfo: 18:217', currentNodeDistanceInfo)
    }

    return diffResultInfo
    // if (diffedDesignNodeSet.has(targetDeisignNodeId))
    //   return
    // diffedDesignNodeSet.add(targetDeisignNodeId)
  })
}
