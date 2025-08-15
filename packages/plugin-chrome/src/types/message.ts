import type { ChromeMessageType } from './enums'

/**
 * 监听器消息处理器参数
 */
export interface ChromeListenerMsgProcessorParams { message: any, sender: chrome.runtime.MessageSender }

/**
 * 监听器消息处理器响应
 */
export interface ChromeListenerMsgResponse<T = any> { success: boolean, data?: T, message?: string }

/**
 * 监听器消息处理器
 */
export type ChromeListenerMsgProcessor<T = any> = (configs: ChromeListenerMsgProcessorParams) => Promise<ChromeListenerMsgResponse<T>>

/**
 * 监听器消息类型
 */
export interface ChromeListenerMessageType<T = any> {
  type: ChromeMessageType
  data?: T
}

/**
 * 响应发送回调
 */
export type ResponseSenderCallback = (response: ChromeListenerMsgResponse) => void
