import type { NodeInfo, UniqueId } from '../types'
import { produce } from 'immer'

export const filterOutOfDocumentFlowNodes = produce((draftNodeMap: Map<UniqueId, NodeInfo>) => {
  draftNodeMap.forEach((nodeInfo) => {
    if (nodeInfo.isOutOfDocumentFlow)
      draftNodeMap.delete(nodeInfo.uniqueId)
  })
})
