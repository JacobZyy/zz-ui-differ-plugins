import { handleContentMessage } from './handlers/contentMessageListener'

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  return handleContentMessage(message, sender, sendResponse)
})
