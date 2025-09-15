import type { NodeInfo, RootNodeOffsetInfo, UniqueId } from '@ui-differ/core'
import { sendMsgToPlugin, UIMessage } from '@messages/sender'

const PHONE_HEADER_HEIGHT = 88
// const PHONE_HEADER_HEIGHT = 0

function createColors() {
  return [
    { r: 1, g: 0, b: 0, a: 1 },
    { r: 0, g: 1, b: 0, a: 1 },
    { r: 0, g: 0, b: 1, a: 1 },
    { r: 1, g: 1, b: 0, a: 1 },
    { r: 1, g: 0, b: 1, a: 1 },
    { r: 0, g: 1, b: 1, a: 1 },
    { r: 1, g: 0.65, b: 0, a: 1 },
    { r: 0.5, g: 0, b: 0.5, a: 1 },
    { r: 0, g: 0.5, b: 0, a: 1 },
    { r: 1, g: 0.75, b: 0.8, a: 1 },
  ]
}

function calculateAbsolutePosition(
  boundingRect: NodeInfo['boundingRect'],
  rootOffset: RootNodeOffsetInfo,
) {
  return {
    x: rootOffset.x + boundingRect.x,
    y: rootOffset.y + boundingRect.y + PHONE_HEADER_HEIGHT,
    width: boundingRect.width,
    height: boundingRect.height,
  }
}

function createDrawingData(flatNodeMap: Map<UniqueId, NodeInfo>, rootOffset: RootNodeOffsetInfo) {
  const colors = createColors()

  return {
    overlays: Array.from(flatNodeMap.entries()).map(([uniqueId, nodeInfo], index) => ({
      uniqueId,
      name: `ui-differ-overlay-${index}`,
      position: calculateAbsolutePosition(nodeInfo.boundingRect, rootOffset),
      style: {
        fills: [],
        strokes: [{
          type: 'SOLID' as const,
          color: colors[index % colors.length],
        }],
        strokeWeight: 1,
        strokeAlign: 'INSIDE' as const,
      },
    })),
    rootOffset,
  }
}

export function drawCurrentNodeInfos(flatNodeMap: Map<UniqueId, NodeInfo>, rootOffset: RootNodeOffsetInfo) {
  const drawingData = createDrawingData(flatNodeMap, rootOffset)

  sendMsgToPlugin({
    type: UIMessage.DRAW_NODE_OVERLAYS,
    data: drawingData,
  })
}
