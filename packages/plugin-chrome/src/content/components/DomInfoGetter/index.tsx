import type { NodeInfo, UniqueId } from '@ui-differ/core'
import { onDomInfoRecorder, processPaddingInfo, removeSameSizePositionChildren, searchNeighborNodes, SiblingPosition } from '@ui-differ/core'
import { Button, Flex, FloatButton, message, Modal, Spin } from 'antd'
import { DESIGN_NODE_PREFIX } from 'node_modules/@ui-differ/core/dist/types'
import { useState } from 'react'
import { ChromeMessageType } from '@/types'
import { chromeMessageSender, generateScreenShot } from '@/utils'
import styles from './index.module.scss'
import RootDetector from './RootDetector'

export default function DomInfoGetter() {
  const [messageApi, contextHolder] = message.useMessage({ maxCount: 1 })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [designNodeInfo, setDesignNodeInfo] = useState<Map<UniqueId, NodeInfo>>(new Map())
  const [clipboardLoading, setClipboardLoading] = useState(false)

  /** 获取剪切板内容 */
  const onReadingClipboard = async () => {
    try {
      const designNodeJSON = await navigator.clipboard.readText()
      if (!designNodeJSON || !designNodeJSON.startsWith(DESIGN_NODE_PREFIX)) {
        messageApi.warning('剪切板中没有设计稿信息')
        return
      }
      return designNodeJSON.replace(DESIGN_NODE_PREFIX, '')
    }
    catch (error) {
      console.error(error)
      messageApi.error('剪切板读取信息失败，请查看权限设置')
    }
    finally {
      setClipboardLoading(false)
    }
  }

  /** 剪切板内容转换成object */
  const handleGetClipboardContent = async () => {
    try {
      const designNodeJSON = await onReadingClipboard()
      if (!designNodeJSON)
        return
      const nodeList = JSON.parse(designNodeJSON)
      if (!Array.isArray(nodeList)) {
        messageApi.warning('设计稿节点不是一个List')
      }

      const entries = nodeList.map((item: NodeInfo) => [item.uniqueId, item] as const)
      const designNodeInfo = new Map<UniqueId, NodeInfo>(entries)
      setDesignNodeInfo(designNodeInfo)
    }
    catch (error) {
      console.error(error)
      messageApi.error('JSON解析失败')
    }
  }

  /** 修改设备模拟 */
  const handleChangeWindowSize = async () => {
    try {
      // 向background script发送修改窗口尺寸的消息
      const response = await chromeMessageSender({ type: ChromeMessageType.CHANGE_WINDOW_SIZE, data: null })
      if (!response?.success) {
        messageApi.error(response?.message || '调用修改窗口尺寸API失败')
        return
      }
      messageApi.success('修改窗口尺寸成功')
    }
    catch (error) {
      console.error('调用设备模拟API失败:', error)
      messageApi.error('调用设备模拟API失败')
    }
  }

  /** 重置设备模拟 */
  const handleResetDeviceEmulation = async () => {
    try {
      // 向background script发送重置设备模拟的消息
      const response = await chromeMessageSender({ type: ChromeMessageType.RESET_DEVICE_EMULATION, data: null })
      if (!response?.success) {
        messageApi.error(response?.message || '调用重置设备模拟API失败')
        return
      }
      messageApi.success('重置设备模拟成功')
    }
    catch (error) {
      console.error('调用重置设备模拟API失败:', error)
      messageApi.error('调用重置设备模拟API失败')
    }
  }

  /** 打开 情况弹窗 */
  const handleOpenModal = async () => {
    try {
      setIsModalOpen(true)
      setClipboardLoading(true)
      // await handleChangeWindowSize()
      // await handleGetClipboardContent()
    }
    catch (error) {
      console.error(error)
      messageApi.error('无效的json，请确认复制的节点内容')
    }
    finally {
      setClipboardLoading(false)
    }
  }

  /** 关闭 情况弹窗 */
  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  /** 获取屏幕截图 */
  const handleGetScreenShot = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    const { imgUrl: screenShot, width, height } = await generateScreenShot()
    return {
      screenShot,
      documentSize: { width, height },
    }
  }

  /** 开始UI差异对比 */
  const handleStartUiDiff = async (rootNode: HTMLElement) => {
    const initiedFlatNodeMap = onDomInfoRecorder(rootNode)
    const rootNodeId = rootNode.getAttribute('unique-id') || ''
    const rootNodeInfo = initiedFlatNodeMap.get(rootNodeId)
    if (!rootNodeInfo) {
      console.error('rootNode has no unique-id')
      return
    }
    // 合并无效padding
    const paddingMergedFlatNodeMap = processPaddingInfo(initiedFlatNodeMap)
    // 移除相同尺寸、位置的子节点
    const removedSameSizePositionChildrenFlatNodeMap = removeSameSizePositionChildren(paddingMergedFlatNodeMap)
    // 搜索邻居节点
    const flatNodeMap = searchNeighborNodes(removedSameSizePositionChildrenFlatNodeMap)

    flatNodeMap.forEach((value, key) => {
      const currentDom = document.querySelector(`[unique-id="${key}"]`)
      console.log('🚀 ~ handleStartUiDiff ~ currentDom:', currentDom)
      const topDom = document.querySelector(`[unique-id="${value[SiblingPosition.TOP]}"]`)
      if (topDom) {
        console.log('             🚀 ~ handleStartUiDiff ~ topDom:', topDom)
      }
      const leftDom = document.querySelector(`[unique-id="${value[SiblingPosition.LEFT]}"]`)
      if (leftDom) {
        console.log('             🚀 ~ handleStartUiDiff ~ leftDom:', leftDom)
      }
      const rightDom = document.querySelector(`[unique-id="${value[SiblingPosition.RIGHT]}"]`)
      if (rightDom) {
        console.log('             🚀 ~ handleStartUiDiff ~ rightDom:', rightDom)
      }
      const bottomDom = document.querySelector(`[unique-id="${value[SiblingPosition.BOTTOM]}"]`)
      if (bottomDom) {
        console.log('              🚀 ~ handleStartUiDiff ~ bottomDom:', bottomDom)
      }
    })
  }

  return (
    <>
      {contextHolder}
      <FloatButton
        className={styles.floatButton}
        icon={<span className="ui-differ-icon" />}
        type="default"
        onClick={handleOpenModal}
      />

      <Modal
        title="Dom节点检测"
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        maskClosable={false}
        width={800}
        centered
        destroyOnHidden
      >
        <Spin spinning={clipboardLoading} tip="读取剪切板信息中...">
          <RootDetector onClose={handleCloseModal} onConfirm={handleStartUiDiff} />
          <Flex gap={4} wrap>
            <Button variant="filled" color="cyan" onClick={handleResetDeviceEmulation}>
              重置设备模拟
            </Button>
            <Button variant="filled" color="gold" onClick={handleChangeWindowSize}>
              调整设备模拟
            </Button>
            <Button variant="filled" color="lime" onClick={handleGetClipboardContent}>
              获取剪切板内容
            </Button>
          </Flex>
        </Spin>
      </Modal>
    </>
  )
}
