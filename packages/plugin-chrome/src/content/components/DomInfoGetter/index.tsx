import type { NodeInfo, UniqueId } from '@ui-differ/core'
import {
  DESIGN_NODE_PREFIX,
  getNeighborNodeDistance,
  onDomInfoRecorder,
  processMarginCollapsing,
  processPaddingInfo,
  recordHybridNodeMatchResult,
  removeSameSizePositionChildren,
  searchNeighborNodes,
  searchNeighborNodesInitial,
  uiDiff,
} from '@ui-differ/core'
import { Button, FloatButton, message, Modal, Space, Spin } from 'antd'
import { useState } from 'react'
import { ChromeMessageType } from '@/types'
import { chromeMessageSender } from '@/utils'
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
      const result = designNodeJSON.replace(DESIGN_NODE_PREFIX, '')
      return result
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

  // /** 获取屏幕截图 */
  // const handleGetScreenShot = async () => {
  //   const { imgUrl: screenShot, width, height } = await generateScreenShot()
  //   return {
  //     screenShot,
  //     documentSize: { width, height },
  //   }
  // }

  /**
   * dom节点信息链式处理
   */
  const handleDomNodePreProcessChain = async (rootNode: HTMLElement) => {
    const flatNodeMap = await onDomInfoRecorder(rootNode)
      .then(searchNeighborNodesInitial)
      .then(processMarginCollapsing)
      .then(processPaddingInfo)
      .then(removeSameSizePositionChildren)
      .then(searchNeighborNodes)
      .then(getNeighborNodeDistance)
      .then(nodeMap => recordHybridNodeMatchResult(nodeMap, designNodeInfo))
    return flatNodeMap
  }

  /** 开始UI差异对比 */
  const handleStartUiDiff = async (rootNode: HTMLElement) => {
    const flatNodeMap = await handleDomNodePreProcessChain(rootNode)
    console.log('🚀 ~ handleStartUiDiff ~ flatNodeMap:', flatNodeMap)

    const diffResult = uiDiff(flatNodeMap, designNodeInfo)
    // diffResult.forEach((resultItem) => {
    //   const { originNode, designNode, distanceResult } = resultItem
    //   const nodeEl = document.querySelector(`[unique-id="${originNode.uniqueId}"]`)
    //   const designNodeName = designNode.nodeName
    //   chalk.info('========dom节点:========\n')
    //   console.info(nodeEl)
    //   chalk.info(`========设计稿节点:${designNodeName}========\n`)
    //   console.info(distanceResult)
    //   chalk.info('-------------------------\n')
    // })
    // await handleGetScreenShot()
  }

  const handleTestDomNodeProcessor = async () => {
    const rootNode = document.querySelector('.app-wrapper')?.children[0]
    if (!rootNode)
      return
    const initiedFlatNodeMap = await onDomInfoRecorder(rootNode as HTMLElement)
    const initiedFlatNodeMapWithInitialNeighborInfos = searchNeighborNodesInitial(initiedFlatNodeMap)
    // 处理margin collapse问题
    const marginCollapsedFlatNodeMap = processMarginCollapsing(initiedFlatNodeMapWithInitialNeighborInfos)
    console.log('🚀 ~ handleStartUiDiff ~ marginCollapsedFlatNodeMap:', marginCollapsedFlatNodeMap)
    // 合并无效padding
    const paddingMergedFlatNodeMap = processPaddingInfo(marginCollapsedFlatNodeMap)
    console.log('🚀 ~ handleTestDomNodeProcessor ~ paddingMergedFlatNodeMap:', paddingMergedFlatNodeMap)
    // 移除相同尺寸、位置的子节点
    const removedSameSizePositionChildrenFlatNodeMap = await removeSameSizePositionChildren(paddingMergedFlatNodeMap)
    console.log('🚀 ~ handleTestDomNodeProcessor ~ removedSameSizePositionChildrenFlatNodeMap:', removedSameSizePositionChildrenFlatNodeMap)
    // 搜索邻居节点
    const flatNodeMap = searchNeighborNodes(removedSameSizePositionChildrenFlatNodeMap)
    console.log('🚀 ~ handleTestDomNodeProcessor ~ flatNodeMap:', flatNodeMap)

    const targetEl = document.querySelector('.z-nav-bar')
    const targetId = targetEl?.getAttribute('unique-id')
    const targetChildEl = targetEl?.querySelector('.z-nav-bar__left')
    const targetChildId = targetChildEl?.getAttribute('unique-id')
    if (!targetChildId || !targetId)
      return
    const initNode = initiedFlatNodeMap.get(targetId)
    console.log('🚀 ~ handleTestDomNodeProcessor ~ targetId:', targetId)
    const initChildNode = initiedFlatNodeMap.get(targetChildId)
    console.log('🚀 ~ handleTestDomNodeProcessor ~ targetChildId:', targetChildId)
    console.log('🚀 ~ handleTestDomNodeProcessor ~ initNode:', initNode?.boundingRect, initNode?.paddingInfo)
    console.log('🚀 ~ handleTestDomNodeProcessor ~ initChildNode:', initChildNode?.boundingRect, initChildNode?.paddingInfo)
    const marginCollapsedNode = marginCollapsedFlatNodeMap.get(targetId)
    const marginCollapsedChildNode = marginCollapsedFlatNodeMap.get(targetChildId)
    console.log('🚀 ~ handleTestDomNodeProcessor ~ marginCollapsedNode:', marginCollapsedNode?.boundingRect, marginCollapsedNode?.paddingInfo)
    console.log('🚀 ~ handleTestDomNodeProcessor ~ marginCollapsedChildNode:', marginCollapsedChildNode?.boundingRect, marginCollapsedChildNode?.paddingInfo)
    const paddingMergedNode = paddingMergedFlatNodeMap.get(targetId)
    const paddingMergedChildNode = paddingMergedFlatNodeMap.get(targetChildId)
    console.log('🚀 ~ handleTestDomNodeProcessor ~ paddingMergedNode:', paddingMergedNode?.boundingRect, paddingMergedNode?.paddingInfo)
    console.log('🚀 ~ handleTestDomNodeProcessor ~ paddingMergedChildNode:', paddingMergedChildNode?.boundingRect, paddingMergedChildNode?.paddingInfo)
    const removedSameSizePositionChildrenNode = removedSameSizePositionChildrenFlatNodeMap.get(targetId)
    const removedSameSizePositionChildrenChildNode = removedSameSizePositionChildrenFlatNodeMap.get(targetChildId)
    console.log('🚀 ~ handleTestDomNodeProcessor ~ removedSameSizePositionChildrenNode:', removedSameSizePositionChildrenNode?.boundingRect, removedSameSizePositionChildrenNode?.paddingInfo)
    console.log('🚀 ~ handleTestDomNodeProcessor ~ removedSameSizePositionChildrenChildNode:', removedSameSizePositionChildrenChildNode?.boundingRect, removedSameSizePositionChildrenChildNode?.paddingInfo)
    const flatNode = flatNodeMap.get(targetId)
    const flatChildNode = flatNodeMap.get(targetChildId)
    console.log('🚀 ~ handleTestDomNodeProcessor ~ flatNode:', flatNode?.boundingRect, flatNode?.paddingInfo)
    console.log('🚀 ~ handleTestDomNodeProcessor ~ flatChildNode:', flatChildNode?.boundingRect, flatChildNode?.paddingInfo)
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

          <Space.Compact>
            <Button variant="filled" color="cyan" onClick={handleResetDeviceEmulation}>
              重置设备模拟
            </Button>
            <Button variant="filled" color="gold" onClick={handleChangeWindowSize}>
              调整设备模拟
            </Button>
          </Space.Compact>
          <Space.Compact>
            <Button variant="filled" color="lime" onClick={handleGetClipboardContent}>
              获取剪切板内容
            </Button>
            <Button variant="filled" color="red" onClick={handleTestDomNodeProcessor}>
              dom数据处理测试
            </Button>
          </Space.Compact>
        </Spin>
      </Modal>
    </>
  )
}
