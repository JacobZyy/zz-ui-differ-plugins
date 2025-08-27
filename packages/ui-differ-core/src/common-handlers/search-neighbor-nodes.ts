import type { BoundingRect, NodeInfo, UniqueId } from '../types'
import { produce } from 'immer'
import { currentNodeToSiblingPositionMap, SiblingPosition, validateSiblingPosList } from '../types'
import { getNodePosition } from '../utils'

/** 寻找单个位置的兄弟节点配置 */
interface FindSinglePositionSiblingConfig {
  curNodeId: UniqueId
  flatNodeMap: Map<UniqueId, NodeInfo>
  position: SiblingPosition
}

/**
 * 计算当前节点与兄弟节点之间的距离
 * @param curRect 当前节点边界
 * @param siblingRect 兄弟节点边界
 * @param position 当前节点与兄弟节点之间的位置
 * @returns 距离
 */
function getTargetPositionSiblingDistance(curRect: BoundingRect, siblingRect: BoundingRect, position: SiblingPosition) {
  if (position === SiblingPosition.TOP) {
    return curRect.y - (siblingRect.y + siblingRect.height)
  }
  if (position === SiblingPosition.BOTTOM) {
    return siblingRect.y - (curRect.y + curRect.height)
  }
  if (position === SiblingPosition.LEFT) {
    return curRect.x - (siblingRect.x + siblingRect.width)
  }
  if (position === SiblingPosition.RIGHT) {
    return siblingRect.x - (curRect.x + curRect.width)
  }
  // 方向不对则返回最大值（不变更对应的最小值）
  return Number.MAX_SAFE_INTEGER
}

/**
 * 寻找单个位置的兄弟节点
 * @param config
 * @returns
 */
function findSinglePositionSibling(config: FindSinglePositionSiblingConfig) {
  const { curNodeId, flatNodeMap, position } = config
  const curNodeInfo = flatNodeMap.get(curNodeId)
  if (!curNodeInfo) {
    console.error('curNodeInfo is not found')
    return
  }
  let minDirection = Number.MAX_SAFE_INTEGER
  let minSiblingId: UniqueId = ''

  // 遍历兄弟节点，找到距离最小的节点
  curNodeInfo.sibling?.forEach((siblingId) => {
    const siblingInfo = flatNodeMap.get(siblingId)
    if (!siblingInfo)
      return
    // 计算兄弟节点位于当前节点的哪个位置
    const currentPos = getNodePosition(curNodeInfo, siblingInfo)
    // 如果兄弟节点不在当前位置，则跳过
    if (currentPos !== position)
      return
    // 计算兄弟节点与当前节点的距离
    const currentDistance = getTargetPositionSiblingDistance(curNodeInfo.boundingRect, siblingInfo.boundingRect, position)
    if (currentDistance >= minDirection)
      return
    // 更新最小距离和最小兄弟节点
    minDirection = currentDistance
    minSiblingId = siblingId
  })

  return minSiblingId
}

/** 判断当前节点在对应方向上是否与父节点重合 */
function isNodeTopOverlapWithParent(position: SiblingPosition, parentRect?: BoundingRect, curRect?: BoundingRect) {
  if (!parentRect || !curRect)
    return false
  if (position === SiblingPosition.TOP) {
    return parentRect.y === curRect.y
  }
  if (position === SiblingPosition.BOTTOM) {
    return parentRect.y + parentRect.height === curRect.y + curRect.height
  }
  if (position === SiblingPosition.LEFT) {
    return parentRect.x === curRect.x
  }
  if (position === SiblingPosition.RIGHT) {
    return parentRect.x + parentRect.width === curRect.x + curRect.width
  }
  return false
}
/**
 * 若兄弟节点中，没有节点位于当前节点上方，且当前节点与其父节点在 top上是重合的，则找当前节点的父节点的上方节点作为当前节点的上方节点，并且将该上方节点的下方节点处理成当前节点。
 * 若兄弟节点中，没有节点位于当前节点上方，且当前节点与其父节点在 top上是未重合，则将其父节点视为其上方节点。
 */
function processNodeWithoutNeighbors(config: FindSinglePositionSiblingConfig) {
  const { curNodeId, flatNodeMap, position } = config
  // 获取当前节点信息
  const curNodeInfo = flatNodeMap.get(curNodeId)
  // 获取父节点id
  const parentNodeId = curNodeInfo?.parentId || ''
  // 获取父节点信息
  const parentNodeInfo = flatNodeMap.get(parentNodeId)
  // 判断当前节点在对应方向上是否与父节点重合
  const positionOverlapWithParent = isNodeTopOverlapWithParent(position, parentNodeInfo?.boundingRect, curNodeInfo?.boundingRect)
  // 不重合，将父节点作为当前节点的对应位置的节点
  if (!positionOverlapWithParent)
    return parentNodeId
  // 重合，则将父节点的兄弟节点作为当前节点的对应位置的节点
  return parentNodeInfo?.[position]
}

/**
 * 兄弟节点不存在，则在父节点及父节点的相邻节点中找当前节点的相邻节点信息
 * @param nodeId
 * @param flatNodeMap
 * @param position
 * @returns
 */
function onSearchParentNeighborNodes(nodeId: UniqueId, flatNodeMap: Map<UniqueId, NodeInfo>, position: SiblingPosition) {
  // 获取当前节点信息
  const currentNodeInfo = flatNodeMap.get(nodeId)
  // 获取当前节点在对应方向上的兄弟节点位置
  const siblingPos = currentNodeToSiblingPositionMap[position]
  // 如果当前节点信息不存在，则返回
  if (!currentNodeInfo) {
    return
  }
  // 如果当前节点在对应方向上的兄弟节点位置不存在，则返回(说明是无效position)
  if (!siblingPos) {
    console.error('invalid sibling position', position, siblingPos)
    return
  }

  // 如果兄弟节点不存在，则在父节点及父节点的相邻节点中找当前节点的相邻节点信息
  const targetParentSiblingNodeId = processNodeWithoutNeighbors({ curNodeId: nodeId, flatNodeMap, position })
  return targetParentSiblingNodeId
}

/**
 * 在兄弟节点中查找当前节点的上下左右节点信息
 * @param nodeId
 * @param flatNodeMap
 * @param position
 * @returns
 */
function onSearchNeighborSiblingNodes(nodeId: UniqueId, flatNodeMap: Map<UniqueId, NodeInfo>, position: SiblingPosition) {
  // 获取当前节点信息
  const currentNodeInfo = flatNodeMap.get(nodeId)
  // 获取当前节点在对应方向上的兄弟节点位置
  const siblingPos = currentNodeToSiblingPositionMap[position]
  // 如果当前节点信息不存在，则返回
  if (!currentNodeInfo) {
    return
  }
  // 如果当前节点在对应方向上的兄弟节点位置不存在，则返回(说明是无效position)
  if (!siblingPos) {
    console.error('invalid sibling position', position, siblingPos)
    return
  }
  // 寻找当前节点在对应方向上的兄弟节点
  const targetSiblingNodeId = findSinglePositionSibling({ curNodeId: nodeId, flatNodeMap, position })
  return targetSiblingNodeId
}

/**
 * 基于flatNodeMap, walk一遍，寻找当前节点的上下左右节点。
 * @see  https://f9fq8frk69.feishu.cn/wiki/BzKOwRz89iu77wkJfhwc81EBnGb?fromScene=spaceOverview#share-RhjddIzZwoul3oxoNUgc6rVcnRb
 */
export const searchNeighborNodes = produce((flatNodeMap: Map<UniqueId, NodeInfo>) => {
  flatNodeMap.forEach((currentNodeInfo, nodeId) => {
    validateSiblingPosList.forEach((position) => {
      const targetSiblingNodeId = onSearchNeighborSiblingNodes(nodeId, flatNodeMap, position)

      if (targetSiblingNodeId) {
        currentNodeInfo[position] = targetSiblingNodeId
        return
      }

      const targetParentSiblingNodeId = onSearchParentNeighborNodes(nodeId, flatNodeMap, position)
      if (targetParentSiblingNodeId) {
        currentNodeInfo[position] = targetParentSiblingNodeId
      }
    })
  })
})

/**
 * 第一次找邻居节点的信息，用于后续的使用
 */
export const searchNeighborNodesInitial = produce((flatNodeMap: Map<UniqueId, NodeInfo>) => {
  flatNodeMap.forEach((currentNodeInfo, nodeId) => {
    validateSiblingPosList.forEach((position) => {
      const targetSiblingNodeId = onSearchNeighborSiblingNodes(nodeId, flatNodeMap, position)
      if (!targetSiblingNodeId)
        return

      const prevInitialNeighborInfo = currentNodeInfo.initialNeighborInfos || {}
      currentNodeInfo.initialNeighborInfos = {
        ...prevInitialNeighborInfo,
        [position]: targetSiblingNodeId,
      }
    })
  })
})
