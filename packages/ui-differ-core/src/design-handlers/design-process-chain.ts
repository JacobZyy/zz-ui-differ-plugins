import type { RootNodeOffsetInfo } from '../types'
import type { DesignConvertConfig } from './design-converter'
import {
  getNeighborNodeDistance,
  processPaddingInfo,
  removeSameSizePositionChildren,
  searchNeighborNodes,
  shrinkRectBounding,
} from '../common-handlers'
import { createDesignInfoRecorder } from './design-info-recorder'
import { reOrderDesignNodes } from './re-order-design-nodes'

/**
 * 创建配置化的设计节点处理链
 * @param config 设计转换配置
 * @returns 处理链函数
 */
export function createDesignNodeProcessChain(config: DesignConvertConfig) {
  const getDesignInfoRecorder = createDesignInfoRecorder(config)

  return async function handleDesignNodePreProcessChain(rootNode: SceneNode, rootOffset: RootNodeOffsetInfo) {
    return getDesignInfoRecorder(rootNode, rootOffset)
      .then(reOrderDesignNodes)
      .then(processPaddingInfo)
      .then(shrinkRectBounding)
      .then(removeSameSizePositionChildren)
      .then(searchNeighborNodes)
      .then(getNeighborNodeDistance)
  }
}
