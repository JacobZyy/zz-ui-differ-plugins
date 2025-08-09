interface MockerMessage {
  type: 'OPEN_DATA_MOCKER'
  data: {
    url: string
    response?: string
  }
}

export async function handleMockerMessage(message: MockerMessage, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
  if (message.type !== 'OPEN_DATA_MOCKER') {
    return
  }

  try {
    // 存储数据和打开类型
    await chrome.storage.local.set({
      mockerData: message.data,
      popupOpenType: 'mocker',
    })

    // 尝试打开popup
    await chrome.action.openPopup()
    sendResponse({ success: true })
  }
  catch (error) {
    console.error('Failed to handle mocker message:', error)
    sendResponse({ success: false, error: (error as Error).message })
  }

  return true
}
