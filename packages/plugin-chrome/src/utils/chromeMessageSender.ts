import type { ChromeListenerMessageType, ChromeListenerMsgResponse } from '@/types/message'

export function chromeMessageSender(data: ChromeListenerMessageType): Promise<ChromeListenerMsgResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(data, (response) => {
      console.log('🚀 ~ chromeMessageSender ~ chrome.runtime.lastError:', chrome.runtime.lastError)
      console.log('🚀 ~ chromeMessageSender ~ response:', response)
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message))
      }
      resolve(response)
    })
  })
}
