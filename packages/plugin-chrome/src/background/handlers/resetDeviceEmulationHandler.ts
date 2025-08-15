import type { ChromeListenerMsgProcessorParams, ChromeListenerMsgResponse } from '@/types/message'
/**
 * 处理重置设备模拟请求
 * 清除所有设备模拟设置，恢复正常的桌面浏览器模式
 */
export async function handleResetDeviceEmulation(configs: ChromeListenerMsgProcessorParams): Promise<ChromeListenerMsgResponse> {
  const { sender } = configs
  try {
    if (!sender.tab?.id) {
      return { success: false, message: '无法获取标签页ID', data: null }
    }

    // 清除设备度量覆盖，恢复正常视口
    await chrome.debugger.sendCommand({ tabId: sender.tab.id }, 'Emulation.clearDeviceMetricsOverride')

    // 清除用户代理覆盖，恢复桌面浏览器UA
    await chrome.debugger.sendCommand({ tabId: sender.tab.id }, 'Emulation.setUserAgentOverride', {
      userAgent: '',
    })

    // 禁用触摸事件模拟
    await chrome.debugger.sendCommand({ tabId: sender.tab.id }, 'Emulation.setTouchEmulationEnabled', {
      enabled: false,
    })

    // 断开调试器连接
    await chrome.debugger.detach({ tabId: sender.tab.id })

    return {
      success: true,
      message: '设备模拟已重置，恢复正常桌面浏览器模式',
      data: null,
    }
  }
  catch (error) {
    console.error('重置设备模拟失败:', error)
    // 尝试清理调试器连接
    if (sender.tab?.id) {
      try {
        await chrome.debugger.detach({ tabId: sender.tab.id })
      }
      catch (detachError) {
        console.error('断开调试器失败:', detachError)
      }
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : '重置设备模拟失败',
      data: null,
    }
  }
}
