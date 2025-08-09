import { handleCompareSuccess } from './handlers/compareHandler'
import { handleMockerMessage } from './handlers/mockerHandler'
import { networkMonitor } from './network/networkMonitor'

// 监听来自content script的连接
chrome.runtime.onConnect.addListener(async (port) => {
  // 从发送者获取标签页ID
  if (port.sender?.tab?.id) {
    await networkMonitor.addPort(port, port.sender.tab.id)
  }
})

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'COMPARE_SUCCESS') {
    return handleCompareSuccess(message, sender, sendResponse)
  }
  else if (message.type === 'OPEN_DATA_MOCKER') {
    return handleMockerMessage(message, sender, sendResponse)
  }
})
