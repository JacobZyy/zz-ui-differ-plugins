import type { ChromeListenerMsgProcessorParams, ChromeListenerMsgResponse } from '@/types/message'
/**
 * 设备模拟配置接口
 */
interface IDeviceEmulationConfig {
  width: number
  height: number
  deviceScaleFactor: number
  mobile: boolean
  userAgent: string
}

/**
 * 处理设备模拟请求
 * 模拟移动设备视口(375x734)，类似Chrome DevTools的Device功能
 */
export async function handleChangeWindowSize(configs: ChromeListenerMsgProcessorParams): Promise<ChromeListenerMsgResponse> {
  const { sender } = configs
  try {
    if (!sender.tab?.id) {
      return { success: false, message: '无法获取标签页ID', data: null }
    }

    // 设备模拟配置：iPhone 13 Pro类似尺寸
    const deviceConfig: IDeviceEmulationConfig = {
      width: 375,
      height: 734,
      deviceScaleFactor: 2.0, // 高密度屏幕
      mobile: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    }
    // 启用调试器
    await chrome.debugger.attach({ tabId: sender.tab.id }, '1.3')

    // 设置设备度量覆盖
    await chrome.debugger.sendCommand({ tabId: sender.tab.id }, 'Emulation.setDeviceMetricsOverride', {
      width: deviceConfig.width,
      height: deviceConfig.height,
      deviceScaleFactor: deviceConfig.deviceScaleFactor,
      mobile: deviceConfig.mobile,
      fitWindow: false,
    })

    // 设置用户代理覆盖
    await chrome.debugger.sendCommand({ tabId: sender.tab.id }, 'Emulation.setUserAgentOverride', {
      userAgent: deviceConfig.userAgent,
    })

    // 启用触摸事件模拟
    await chrome.debugger.sendCommand({ tabId: sender.tab.id }, 'Emulation.setTouchEmulationEnabled', {
      enabled: true,
    })

    return {
      success: true,
      message: `设备模拟已启用 - ${deviceConfig.width}x${deviceConfig.height} (移动设备视口)`,
      data: {
        width: deviceConfig.width,
        height: deviceConfig.height,
        deviceScaleFactor: deviceConfig.deviceScaleFactor,
        mobile: deviceConfig.mobile,
      },
    }
  }
  catch (error) {
    console.error('设备模拟失败:', error)
    // 清理调试器连接
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
      message: error instanceof Error ? error.message : '设备模拟失败',
      data: null,
    }
  }
}
