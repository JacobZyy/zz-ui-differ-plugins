import type { PortInfo } from './types'

class NetworkMonitor {
  private portInfos: PortInfo[] = []
  private debuggerTargets = new Map<number, boolean>() // 跟踪已启用debugger的标签页
  private requestCache = new Map<string, any>() // 缓存请求信息

  constructor() {
    this.setupDebuggerListeners()
  }

  private cleanupPort(port: chrome.runtime.Port) {
    const index = this.portInfos.findIndex(info => info.port === port)
    if (index > -1) {
      this.portInfos.splice(index, 1)
    }
  }

  public async addPort(port: chrome.runtime.Port, tabId: number) {
    if (port.name !== 'request-monitor') {
      return
    }

    console.log('🔌 [Network Monitor] Port connected:', { tabId, portName: port.name })

    const portInfo: PortInfo = { port, tabId }
    this.portInfos.push(portInfo)

    // 启用debugger for this tab
    await this.enableDebuggerForTab(tabId)

    // 设置端口断开连接的处理
    port.onDisconnect.addListener(() => {
      console.log('🔌 [Network Monitor] Port disconnected:', { tabId })
      this.cleanupPort(port)
      // 如果没有其他端口使用这个tab，则禁用debugger
      const hasOtherPorts = this.portInfos.some(info => info.tabId === tabId)
      if (!hasOtherPorts) {
        this.disableDebuggerForTab(tabId)
      }
    })
  }

  private async enableDebuggerForTab(tabId: number) {
    if (this.debuggerTargets.has(tabId)) {
      return // 已经启用
    }

    try {
      const target = { tabId }

      // 附加debugger
      await chrome.debugger.attach(target, '1.3')

      // 启用网络域
      await chrome.debugger.sendCommand(target, 'Network.enable')

      // 启用运行时域以获取响应体
      await chrome.debugger.sendCommand(target, 'Runtime.enable')

      this.debuggerTargets.set(tabId, true)
      console.log(`Debugger attached to tab ${tabId}`)
    }
    catch (error) {
      console.error(`Failed to attach debugger to tab ${tabId}:`, error)
    }
  }

  private async disableDebuggerForTab(tabId: number) {
    if (!this.debuggerTargets.has(tabId)) {
      return
    }

    try {
      const target = { tabId }
      await chrome.debugger.detach(target)
      this.debuggerTargets.delete(tabId)
      console.log(`Debugger detached from tab ${tabId}`)
    }
    catch (error) {
      console.error(`Failed to detach debugger from tab ${tabId}:`, error)
    }
  }

  private setupDebuggerListeners() {
    // 监听debugger事件
    chrome.debugger.onEvent.addListener((source, method, params) => {
      if (!source.tabId)
        return

      // 监听请求发送事件
      if (method === 'Network.requestWillBeSent') {
        this.handleRequestSent(source.tabId, params)
      }
      // 监听响应接收完成事件
      else if (method === 'Network.responseReceived') {
        this.handleResponseReceived(source.tabId, params)
      }
    })

    // 监听debugger断开连接
    chrome.debugger.onDetach.addListener((source, reason) => {
      if (source.tabId) {
        this.debuggerTargets.delete(source.tabId)
        // 清理该标签页的请求缓存
        for (const [key] of this.requestCache) {
          if (key.startsWith(`${source.tabId}:`)) {
            this.requestCache.delete(key)
          }
        }
        console.log(`Debugger detached from tab ${source.tabId}, reason: ${reason}`)
      }
    })
  }

  private handleRequestSent(tabId: number, params: any) {
    const { requestId, request } = params

    // 记录请求信息
    console.log('🚀 [Network Monitor] Request Sent:', {
      tabId,
      requestId,
      method: request.method,
      url: request.url,
      postData: request.postData || '',
      timestamp: new Date().toISOString(),
    })

    // 缓存请求信息
    const cacheKey = `${tabId}:${requestId}`
    this.requestCache.set(cacheKey, {
      method: request.method,
      url: request.url,
      postData: request.postData || '',
      timestamp: Date.now(),
    })
  }

  private async handleResponseReceived(tabId: number, params: any) {
    const { requestId, response } = params

    // 检查是否是我们关心的请求类型
    if (!this.shouldProcessResponse(response)) {
      return
    }

    const matchingPorts = this.portInfos.filter(info => info.tabId === tabId)
    if (matchingPorts.length === 0) {
      return
    }

    // 获取缓存的请求信息
    const cacheKey = `${tabId}:${requestId}`
    const cachedRequest = this.requestCache.get(cacheKey)

    try {
      // 获取响应体
      const target = { tabId }
      const responseBodyResult = await chrome.debugger.sendCommand(
        target,
        'Network.getResponseBody',
        { requestId },
      ) as { body?: string, base64Encoded?: boolean }

      // 构建请求数据
      const requestData = {
        method: cachedRequest?.method || 'GET',
        url: cachedRequest?.url || response.url,
        timestamp: Date.now(),
        request: cachedRequest?.postData || '',
        response: responseBodyResult?.body || '',
        status: response.status,
        statusText: response.statusText,
      }

      // 记录响应信息
      console.log('📥 [Network Monitor] Response Received:', {
        tabId,
        requestId,
        url: requestData.url,
        method: requestData.method,
        status: response.status,
        statusText: response.statusText,
        requestData: requestData.request,
        responseData: requestData.response.substring(0, 500) + (requestData.response.length > 500 ? '...[truncated]' : ''),
        timestamp: new Date().toISOString(),
      })

      // 发送消息给所有匹配的端口
      matchingPorts.forEach(({ port }) => {
        port.postMessage({
          type: 'request',
          data: requestData,
        })
      })

      // 清理缓存
      this.requestCache.delete(cacheKey)
    }
    catch (error) {
      console.error('Failed to get response body:', error)
      // 即使失败也要清理缓存
      this.requestCache.delete(cacheKey)
    }
  }

  private shouldProcessResponse(response: any): boolean {
    // 只处理JSON响应
    const contentType = response.headers?.['content-type'] || response.headers?.['Content-Type'] || ''
    if (!contentType.includes('application/json')) {
      return false
    }

    // 过滤掉一些不需要的请求
    const url = response.url || ''
    if (url.includes('chrome-extension://') || url.includes('data:')) {
      return false
    }

    return true
  }
}

export const networkMonitor = new NetworkMonitor()
