import type { DiffResultInfo, DistanceInfo } from './type'
import getSamePosMgNode from './getSamePosNode'
import { SiblingNodeRelativePosition } from './type'

function fixedSubstract(prevValue: number, nextValue: number) {
  const diff = prevValue - nextValue
  // 四舍五入到整数
  const fixedValue = Math.round(diff)
  return fixedValue
}

/** 计算单个方向的边距 */
function calculateMargin(
  config: {
    keys: string | undefined
    distanceMap: Map<string, DistanceInfo>
    currentNode: DistanceInfo
    direction: 'left' | 'right' | 'top' | 'bottom'
    shouldSkipCalculateNeighbor?: boolean
    shouldCalculateParentNode?: boolean
  },
): number {
  const { keys, distanceMap, currentNode, direction, shouldSkipCalculateNeighbor, shouldCalculateParentNode } = config
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

function handleCalculateDiffInfo(
  currentDomId: string,
  mgDistanceInfoMap: Map<string, DistanceInfo>,
  domDistanceInfo: Map<string, DistanceInfo>,
  diffedDesignNodeSet: Set<string>,
): DiffResultInfo | undefined {
  const currentNodeDistanceInfo = domDistanceInfo.get(currentDomId)
  if (!currentNodeDistanceInfo) {
    console.error(`当前节点${currentDomId}在dom中没有distanceInfo·`)
    return
  }
  const targetDeisignNodeId = getSamePosMgNode(currentNodeDistanceInfo, mgDistanceInfoMap)
  const designNodeDistanceInfo = mgDistanceInfoMap.get(targetDeisignNodeId)
  if (!designNodeDistanceInfo) {
    console.error(`当前节点${currentDomId}在mg中没有找到相同位置的节点`, targetDeisignNodeId, designNodeDistanceInfo)
    return
  }
  if (diffedDesignNodeSet.has(targetDeisignNodeId)) {
    console.warn('🚀 ~ handleCalculateDiffInfo ~ targetDeisignNodeId:节点已被比对过', targetDeisignNodeId)
    return
  }

  diffedDesignNodeSet.add(targetDeisignNodeId)
  const {
    [SiblingNodeRelativePosition.BOTTOM]: bottomKeys,
    [SiblingNodeRelativePosition.LEFT]: leftKeys,
    [SiblingNodeRelativePosition.RIGHT]: rightKeys,
    [SiblingNodeRelativePosition.TOP]: topKeys,
  } = currentNodeDistanceInfo
  const {
    [SiblingNodeRelativePosition.BOTTOM]: designBottomKeys,
    [SiblingNodeRelativePosition.LEFT]: designLeftKeys,
    [SiblingNodeRelativePosition.RIGHT]: designRightKeys,
    [SiblingNodeRelativePosition.TOP]: designTopKeys,
  } = designNodeDistanceInfo

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
}

export default function distanceDiff(mgDistanceInfoMap: Map<string, DistanceInfo>, nodeRoot: HTMLElement) {
  const resultMap = new Map<string, DiffResultInfo>()
  const domDistanceInfo = getDomDistanceInfo(rootDomNode)

  const diffedDesignNodeSet = new Set<string>()

  const getDistanceDiff = (currentDomNode: Element) => {
    const curId = currentDomNode.getAttribute('unique-id')
    if (!curId)
      return

    const diffResult = handleCalculateDiffInfo(curId, mgDistanceInfoMap, domDistanceInfo, diffedDesignNodeSet)
    if (diffResult) {
      resultMap.set(curId, diffResult)
    }

    const childNodes = Array.from(currentDomNode.children)
    if (!childNodes.length)
      return
    childNodes.forEach((childNode) => {
      getDistanceDiff(childNode)
    })
  }

  const rootChildren = Array.from(rootDomNode.children)
  rootChildren.forEach((childNode) => {
    getDistanceDiff(childNode)
  })

  return resultMap
}
