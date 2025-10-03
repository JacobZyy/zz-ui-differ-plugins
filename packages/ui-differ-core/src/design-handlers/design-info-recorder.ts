import type { BoundingRect, NodeInfo, NodeWithChild, RootNodeOffsetInfo, UniqueId } from '../types'
import type { DesignConvertConfig } from './design-converter'
import { clone } from 'radash'
import { nodeWithChildSet } from '../types'
import { floorOrderTraversalWithNode } from '../utils'
import { getDesignNodeTextStyle } from '../utils/getTextStyleInfo'
import { createCoordinateConverter } from './design-converter'
import { createDesignStyleValueGetters, getDesignBackgroundColor } from './get-design-style-value'
import { getParentSiblingNodes } from './get-parent-sibling-nodes'

/**
 * 创建可配置的设计信息记录器
 * @param config 设计转换配置
 * @returns 设计信息记录器函数
 */
export function createDesignInfoRecorder(config: DesignConvertConfig) {
  const coordinateConverter = createCoordinateConverter(config)
  const styleGetters = createDesignStyleValueGetters(coordinateConverter.convertPadding)

  function processSingleDesignNodeInfo(
    designNode: SceneNode,
    rootOffset: { x: number, y: number, id: UniqueId },
    designNodeParentSiblingMap: Map<UniqueId, Pick<NodeInfo, 'parentId' | 'sibling'>>,
  ) {
    const nodeId = designNode.id
    // 在上方已经进行过滤了
    const boundingRect = designNode.absoluteBoundingBox!
    const isRoot = nodeId === rootOffset.id

    const realBoundingRect: BoundingRect = {
      x: coordinateConverter.convertX(boundingRect.x, rootOffset.x),
      y: coordinateConverter.convertY(boundingRect.y, rootOffset.y, isRoot),
      width: coordinateConverter.convertWidth(boundingRect.width),
      height: coordinateConverter.convertHeight(boundingRect.height, isRoot),
    }

    const hasChildren = nodeWithChildSet.has(designNode.type)
    // 获取子节点id
    const childrenIds = hasChildren ? Array.from((designNode as NodeWithChild).children).map(child => child.id) : []
    const paddingInfo = styleGetters.getDesignPaddingInfo(designNode)
    const borderInfo = styleGetters.getDesignBorderInfo(designNode)
    const backgroundColor = getDesignBackgroundColor(designNode)
    const siblingParentInfo = designNodeParentSiblingMap.get(nodeId)
    const parentId = siblingParentInfo?.parentId || ''
    const siblingIds = siblingParentInfo?.sibling || []
    const textStyleInfo = getDesignNodeTextStyle(designNode)

    const newNode: NodeInfo = {
      nodeName: designNode.name,
      uniqueId: nodeId,
      boundingRect: realBoundingRect,
      parentId,
      children: childrenIds,
      sibling: siblingIds,
      paddingInfo,
      borderInfo,
      backgroundColor,
      neighborMarginInfo: {},
      initialNeighborInfos: {},
      textStyleInfo,
      originBounding: clone(realBoundingRect),
    }
    return newNode
  }

  return async function getDesignInfoRecorder(rootDesignNode: SceneNode, rootNodeBoundingOffset: RootNodeOffsetInfo) {
    const floorOrderNodeList = Array.from(floorOrderTraversalWithNode(rootDesignNode))
    const designNodeParentSiblingMap = getParentSiblingNodes(rootDesignNode)

    const flatNodeMapEntries = floorOrderNodeList
      .filter((designNode) => {
        const realBoundingRect = designNode.absoluteBoundingBox
        if (!realBoundingRect || !designNode.id)
          // 没有渲染的节点，或者没有id的节点，直接过滤掉
          return false

        // 位于上下安全区的节点先全都过滤掉
        const currentY = realBoundingRect.y - rootNodeBoundingOffset.y
        const isOverTopNode = currentY + realBoundingRect.height <= config.safeTopHeight
        const isOverBottomNode = currentY >= (rootDesignNode.height - config.safeBottomHeight)
        return (!isOverTopNode && !isOverBottomNode) || designNode.id === rootDesignNode.id
      })
      .map((designNode) => {
        // 格式化节点信息
        const nodeInfo = processSingleDesignNodeInfo(designNode, rootNodeBoundingOffset, designNodeParentSiblingMap)
        return [nodeInfo.uniqueId, nodeInfo] as const
      })

    const initialNodeMap = new Map(flatNodeMapEntries)
    return initialNodeMap
  }
}
