export interface NetworkRequest {
  method: string
  url: string
  timestamp: number
  request?: string
  response?: string
  status?: number
  statusText?: string
}

export interface NetworkMessage {
  type: 'request'
  data: NetworkRequest
}

export interface PortInfo {
  port: chrome.runtime.Port
  tabId: number
}
