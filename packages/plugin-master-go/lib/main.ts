import { PluginMessage, UIMessage } from '@messages/sender'

mg.showUI(__html__, {
  width: 400,
  height: 800,
})

function sendSelectionToUI() {
  const selection = mg.document.currentPage.selection
  mg.ui.postMessage({ type: PluginMessage.SELECTION_CHANGE, data: selection })
}

// 监听选择变化事件
mg.on('selectionchange', sendSelectionToUI)

mg.ui.onmessage = (msg: { type: UIMessage, data: any }) => {
  const { type } = msg
  if (type === UIMessage.GET_SELECTION) {
    return sendSelectionToUI()
  }
}
