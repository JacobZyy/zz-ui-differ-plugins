import type { NodeCanBeMask, NodeWithChild } from '../types'
import { nodeCanBeMaskSet, nodeNoChildSet } from '../types'

const emptyFrameNode = {
  name: 'mask替换为容器',
  removed: false,
  type: 'FRAME',
  isVisible: true,
  isLocked: false,
  attachedConnectors: [],
  componentPropertyReferences: null,
  children: [],
  paddingTop: 10,
  paddingRight: 10,
  paddingBottom: 10,
  paddingLeft: 10,
  flexMode: 'NONE',
  flexWrap: 'NO_WRAP',
  itemSpacing: 10,
  mainAxisAlignItems: 'FLEX_START',
  crossAxisAlignItems: 'FLEX_START',
  mainAxisSizingMode: 'AUTO',
  crossAxisSizingMode: 'AUTO',
  crossAxisAlignContent: 'AUTO',
  crossAxisSpacing: 0,
  itemReverseZIndex: false,
  strokesIncludedInLayout: false,
  expanded: false,
  clipsContent: true,
  layoutGrids: [],
  gridStyleId: '',
  overflowDirection: 'NONE',
  strokeTopWeight: 1,
  strokeLeftWeight: 1,
  strokeBottomWeight: 1,
  strokeRightWeight: 1,
  fills: [],
  fillStyleId: '',
  strokes: [],
  strokeWeight: 1,
  strokeAlign: 'INSIDE',
  strokeStyle: 'SOLID',
  strokeCap: 'NONE',
  strokeJoin: 'MITER',
  strokeDashes: [],
  dashCap: 'NONE',
  strokeStyleId: '',
  strokeFillStyleId: '',
  strokeWidthStyleId: '',
  paddingStyleId: '',
  spacingStyleId: '',
  cornerRadiusStyleId: '',
  cornerSmooth: 0,
  topLeftRadius: 0,
  topRightRadius: 0,
  bottomLeftRadius: 0,
  bottomRightRadius: 0,
  cornerRadius: 0,
  opacity: 1,
  blendMode: 'PASS_THROUGH',
  isMask: false,
  isMaskOutline: true,
  isMaskVisible: false,
  effects: [],
  effectStyleId: '',
  absoluteTransform: [[1, 0, -2855], [0, 1, -1259]],
  relativeTransform: [[1, 0, -2855], [0, 1, -1259]],
  absoluteRenderBounds: { x: -2855, y: -1259, width: 137, height: 75 },
  absoluteBoundingBox: { x: -2855, y: -1259, width: 137, height: 75 },
  x: -2855,
  y: -1259,
  bound: { x: -2855, y: -1259, width: 137, height: 75 },
  width: 137,
  maxWidth: 0,
  minWidth: 0,
  height: 75,
  maxHeight: 0,
  minHeight: 0,
  flexGrow: 0,
  alignSelf: 'INHERIT',
  constrainProportions: false,
  layoutPositioning: 'AUTO',
  constraints: {
    horizontal: 'START',
    vertical: 'START',
  },
  rotation: 0,
  scaleFactor: 1,
  exportSettings: [],
  reactions: [],
  id: '151:4167',
}

export function combineMaskLayers<T extends SceneNode>(currentNode: T): T {
  if (currentNode.type !== 'GROUP' && currentNode.type !== 'FRAME') {
    if (nodeNoChildSet.has(currentNode.type)) {
      return currentNode
    }
    return {
      ...currentNode,
      children: (currentNode as NodeWithChild).children.map(child => combineMaskLayers(child)),
    }
  }

  const originChildNodeList = currentNode.children as NodeCanBeMask[]
  const reversedChildNodeList = originChildNodeList.toReversed()

  /** mask子节点index列表 */
  const childMastIndexList = reversedChildNodeList.reduce((prev, it, index) => {
    const curNode = it as NodeCanBeMask
    if (!nodeCanBeMaskSet.has(curNode.type) || !curNode.isMask) {
      return prev
    }
    return [...prev, index]
  }, [] as number[])

  if (!childMastIndexList.length) {
    return {
      ...currentNode,
      children: originChildNodeList.map(child => combineMaskLayers(child)),
    }
  }

  // 根据子节点index的列表。把子节点进行切割
  const maskChildIndexStartEndList = childMastIndexList
    .map((it, index, originArr) => {
      if (index === 0) {
        return [reversedChildNodeList.length - it, reversedChildNodeList.length]
      }
      return [reversedChildNodeList.length - it, reversedChildNodeList.length - originArr[index - 1] - 1]
    })
    .toReversed()

  /** 更新后的子节点列表 */
  const newChildGroupList = maskChildIndexStartEndList
    .map(([start, end]) => {
      const children = originChildNodeList.slice(start, end)
      const maskNode = originChildNodeList[start - 1]
      if (children.length === 0) {
        return null
      }
      const {
        id,
        name,
        absoluteTransform,
        relativeTransform,
        absoluteRenderBounds,
        absoluteBoundingBox,
        x,
        y,
        bound,
        width,
        height,
        cornerRadius = 0,
        topLeftRadius = 0,
        topRightRadius = 0,
        bottomLeftRadius = 0,
        bottomRightRadius = 0,
      } = maskNode as FrameNode

      const newFrameNode = {
        ...emptyFrameNode,
        id: `${id}-mask-replace`,
        name: `${name}-mask-replace`,
        absoluteTransform,
        relativeTransform,
        absoluteRenderBounds,
        absoluteBoundingBox,
        x,
        y,
        bound,
        width,
        height,
        cornerRadius,
        topLeftRadius,
        topRightRadius,
        bottomLeftRadius,
        bottomRightRadius,
        clipsContent: true,
        // 尺寸信息同步
        children,
      }
      // 强转类型，最后作为一个frame输出
      return newFrameNode as unknown as FrameNode
    })
    .filter(it => it !== null)
  return {
    ...currentNode,
    children: newChildGroupList.map(it => combineMaskLayers(it)),
  }
}
