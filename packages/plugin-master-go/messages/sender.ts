// 插件发出的消息
export enum PluginMessage {
  SELECTION_CHANGE = 'SELECTION_CHANGE',
}

// UI发出的消息
export enum UIMessage {
  GET_SELECTION = 'GET_SELECTION',
}

interface MessageType {
  type: UIMessage | PluginMessage
  data?: any
}

/**
 * 向UI发送消息
 */
export function sendMsgToUI(data: MessageType) {
  mg.ui.postMessage(data, '*')
}

/**
 * 向插件发送消息
 */
export function sendMsgToPlugin(data: MessageType) {
  parent.postMessage(data, '*')
}
