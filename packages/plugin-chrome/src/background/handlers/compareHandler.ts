import type { MsgDataType } from '@/core/type'

interface CompareMessage {
  type: 'COMPARE_SUCCESS'
  data: MsgDataType
}

export async function handleCompareSuccess(message: CompareMessage, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
  // 确保消息来自内容脚本且有有效的标签页 ID
  if (message.type !== 'COMPARE_SUCCESS' || !sender.tab?.id) {
    return
  }

  const tabId = sender.tab.id

  try {
    // 存储比对结果和打开类型
    await chrome.storage.local.set({
      differResult: message.data,
      popupOpenType: 'differ',
    })

    try {
      // 尝试打开 popup
      await chrome.action.openPopup()
      sendResponse({ success: true })
    }
    catch (error) {
      console.error('Failed to open popup:', error)

      // 如果 openPopup 失败，使用 badge 通知用户
      await chrome.action.setBadgeText({
        text: '✓',
        tabId,
      })

      await chrome.action.setBadgeBackgroundColor({
        color: '#4CAF50',
        tabId,
      })

      // 5秒后清除 badge
      setTimeout(() => {
        chrome.action.setBadgeText({
          text: '',
          tabId,
        })
      }, 5000)

      sendResponse({ success: true })
    }
  }
  catch (error) {
    console.error('Failed to store diff result:', error)
    sendResponse({ success: false, error: (error as Error).message })
  }

  return true
}
