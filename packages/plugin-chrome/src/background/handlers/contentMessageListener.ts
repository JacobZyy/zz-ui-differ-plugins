import type { ChromeListenerMessageType, ChromeListenerMsgProcessor, ResponseSenderCallback } from '@/types/message'
import { ChromeMessageType } from '@/types'
import { handleResetDeviceEmulation } from './resetDeviceEmulationHandler'
import { handleChangeWindowSize } from './windowSizeChangeHandler'

const messageHandlerMap: Record<ChromeMessageType, ChromeListenerMsgProcessor> = {
  [ChromeMessageType.CHANGE_WINDOW_SIZE]: handleChangeWindowSize,
  [ChromeMessageType.RESET_DEVICE_EMULATION]: handleResetDeviceEmulation,
}

export async function handleContentMessage(message: ChromeListenerMessageType, sender: chrome.runtime.MessageSender, sendResponse: ResponseSenderCallback): Promise<boolean> {
  const processor = messageHandlerMap[message.type]
  if (!processor) {
    sendResponse({ success: false, message: '未找到消息处理器', data: null })
    return true
  }

  try {
    // 异步处理消息，保持端口开放
    const response = await processor({ message, sender })
    console.log('🚀 ~ handleContentMessage ~ response:', response)
    sendResponse(response)
    return true
  }
  catch (error) {
    sendResponse({
      success: false,
      message: error instanceof Error ? error.message : '消息处理失败',
      data: null,
    })
    return true
  }
}
