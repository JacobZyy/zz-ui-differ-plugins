import { PluginMessage, UIMessage } from '@messages/sender'

mg.showUI(__html__, {
  width: 400,
  height: 800,
})

function sendSelectionToUI() {
  const selection = mg.document.currentPage.selection
  mg.ui.postMessage({ type: PluginMessage.SELECTION_CHANGE, data: selection })
}
function drawNodeOverlays(drawingData: {
  overlays: Array<{
    uniqueId: string
    name: string
    position: { x: number, y: number, width: number, height: number }
    style: {
      fills: any[]
      strokes: Array<{ type: 'SOLID', color: { r: number, g: number, b: number, a: number } }>
      strokeWeight: number
      strokeAlign: 'INSIDE'
    }
  }>
  rootOffset: { minX: number, minY: number }
}) {
  const currentPage = mg.document.currentPage

  // 清除之前的绘制元素
  const existingOverlays = currentPage.findAll(node =>
    node.type === 'RECTANGLE' && node.name.startsWith('ui-differ-overlay-'),
  )
  existingOverlays.forEach(overlay => overlay.remove())

  // 直接使用处理好的数据进行绘制
  drawingData.overlays.forEach((overlayData) => {
    const overlay = mg.createRectangle()
    overlay.name = overlayData.name

    // 设置位置和尺寸
    overlay.x = overlayData.position.x
    overlay.y = overlayData.position.y
    overlay.width = overlayData.position.width
    overlay.height = overlayData.position.height

    // 设置样式
    overlay.fills = overlayData.style.fills
    overlay.strokes = overlayData.style.strokes
    overlay.strokeWeight = overlayData.style.strokeWeight
    overlay.strokeAlign = overlayData.style.strokeAlign

    // 添加到当前页面
    currentPage.appendChild(overlay)
  })
}

// 监听选择变化事件
mg.on('selectionchange', sendSelectionToUI)

mg.ui.onmessage = (msg: { type: UIMessage, data: any }) => {
  const { type, data } = msg
  if (type === UIMessage.GET_SELECTION) {
    return sendSelectionToUI()
  }
  if (type === UIMessage.DRAW_NODE_OVERLAYS) {
    return drawNodeOverlays(data)
  }
}
