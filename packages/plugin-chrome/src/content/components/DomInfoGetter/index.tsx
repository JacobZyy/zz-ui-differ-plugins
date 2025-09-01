import type { DiffResultInfo, NodeInfo, UniqueId } from '@ui-differ/core'
import chalk from '@alita/chalk'
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
  shrinkRectBounding,
  uiDiff,
} from '@ui-differ/core'
import { Button, Flex, FloatButton, message, Modal, Spin } from 'antd'
import { useRef, useState } from 'react'
import { ChromeMessageType } from '@/types'
import { chromeMessageSender, generateScreenShot } from '@/utils'
import { diffResultFilterRules } from '@/utils/diffResultFilterRules'
import { drawCurrentNodeInfos } from '@/utils/drawCurrentNodeInfos'
import styles from './index.module.scss'
import ResultRenderer from './ResultRenderer'
import RootDetector from './RootDetector'

export default function DomInfoGetter() {
  const [messageApi, contextHolder] = message.useMessage({ maxCount: 1 })
  const [modalApi, modalContextHolder] = Modal.useModal()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isResultModalOpen, setIsResultModalOpen] = useState(false)
  const [screenShotInfo, setScreenShotInfo] = useState<{ imgUrl: string, width: number, height: number }>({
    imgUrl: '',
    width: 0,
    height: 0,
  })
  // 比对结果
  const [diffResultInfo, setDiffResultInfo] = useState<DiffResultInfo[]>([])
  // 设计稿节点信息
  const designNodeInfo = useRef<Map<UniqueId, NodeInfo>>(new Map())
  const flatNodeMap = useRef<Map<UniqueId, NodeInfo>>(new Map())
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
      designNodeInfo.current = new Map<UniqueId, NodeInfo>(entries)
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
      await handleChangeWindowSize()
      await handleGetClipboardContent()
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

  /** 关闭 结果弹窗 */
  const handleCloseResultModal = () => {
    setIsResultModalOpen(false)
  }

  /**
   * dom节点信息链式处理
   */
  const handleDomNodePreProcessChain = async (rootNode: HTMLElement) => {
    flatNodeMap.current = await onDomInfoRecorder(rootNode)
      .then(searchNeighborNodesInitial)
      .then(processMarginCollapsing)
      .then(processPaddingInfo)
      .then(removeSameSizePositionChildren)
      .then(searchNeighborNodes)
      .then(getNeighborNodeDistance)
      .then(nodeMap => recordHybridNodeMatchResult(nodeMap, designNodeInfo.current))
  }

  /** 开始UI差异对比 */
  const handleStartUiDiff = async (rootNode: HTMLElement) => {
    // 直接关闭弹窗
    handleCloseModal()
    // 等待关闭后继续
    await new Promise(resolve => setTimeout(resolve, 1000))
    await handleDomNodePreProcessChain(rootNode)
    const diffResult = uiDiff(flatNodeMap.current, designNodeInfo.current)
    const filteredCorrectDiffResult = diffResult.filter(diffResultFilterRules)
    if (__DEV__) {
      filteredCorrectDiffResult.forEach((resultItem) => {
        const { originNode, designNode, distanceResult } = resultItem
        const nodeEl = document.querySelector(`[unique-id="${originNode.uniqueId}"]`)
        const designNodeName = designNode.nodeName
        chalk.info('========dom节点:========\n')
        console.info(nodeEl)
        console.info(originNode)
        chalk.info(`========设计稿节点:${designNodeName}========\n`)
        console.info(designNode)
        chalk.info(`========比对结果:========\n`)
        console.info(distanceResult)
        chalk.info('-------------------------\n')
      })
    }
    const imageResultInfo = await generateScreenShot()
    // 缓存截图信息
    setScreenShotInfo(imageResultInfo)
    setDiffResultInfo(filteredCorrectDiffResult)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsResultModalOpen(true)
  }

  const handleTestDomNodeProcessor = async () => {
    const rootNode = document.querySelector('.app-wrapper')?.children[0]
    if (!rootNode)
      return
    const initiedFlatNodeMap = await onDomInfoRecorder(rootNode as HTMLElement)
    const initiedFlatNodeMapWithInitialNeighborInfos = searchNeighborNodesInitial(initiedFlatNodeMap)
    // 处理margin collapse问题
    const marginCollapsedFlatNodeMap = processMarginCollapsing(initiedFlatNodeMapWithInitialNeighborInfos)
    // 合并无效padding
    const paddingMergedFlatNodeMap = processPaddingInfo(marginCollapsedFlatNodeMap)
    const boundingRectShrinkedNodeMap = shrinkRectBounding(paddingMergedFlatNodeMap)
    // 移除相同尺寸、位置的子节点
    const removedSameSizePositionChildrenFlatNodeMap = await removeSameSizePositionChildren(boundingRectShrinkedNodeMap)
    // 搜索邻居节点
    const flatNodeMap = searchNeighborNodes(removedSameSizePositionChildrenFlatNodeMap)

    drawCurrentNodeInfos(flatNodeMap)

    // const targetEl = document.querySelector('.z-nav-bar')
    // const targetId = targetEl?.getAttribute('unique-id')
    // const targetChildEl = targetEl?.querySelector('.z-nav-bar__left')
    // const targetChildId = targetChildEl?.getAttribute('unique-id')
    // if (!targetChildId || !targetId)
    //   return
    // const initNode = initiedFlatNodeMap.get(targetId)
    // const initChildNode = initiedFlatNodeMap.get(targetChildId)
    // const marginCollapsedNode = marginCollapsedFlatNodeMap.get(targetId)
    // const marginCollapsedChildNode = marginCollapsedFlatNodeMap.get(targetChildId)
    // const paddingMergedNode = paddingMergedFlatNodeMap.get(targetId)
    // const paddingMergedChildNode = paddingMergedFlatNodeMap.get(targetChildId)
    // const removedSameSizePositionChildrenNode = removedSameSizePositionChildrenFlatNodeMap.get(targetId)
    // const removedSameSizePositionChildrenChildNode = removedSameSizePositionChildrenFlatNodeMap.get(targetChildId)
    // const flatNode = flatNodeMap.get(targetId)
    // const flatChildNode = flatNodeMap.get(targetChildId)
  }

  const handleFinishResult = async (resultImage?: string) => {
    setIsResultModalOpen(false)
    //  结果组装
    const resultData = {
      screenShot: screenShotInfo.imgUrl,
      resultImage,
      diffResultInfo,
      domNodeList: Array.from(flatNodeMap.current.values()),
      designNodeList: Array.from(designNodeInfo.current.values()),
      pageUrl: location.href,
    }
    const resultJSON = JSON.stringify(resultData)
    await navigator.clipboard.writeText(resultJSON)
    await modalApi.success({
      title: '自动走查完成',
      content: '结果已复制到剪切板，点击链接提交结果',
      okText: '去提交',
    })
    window.open('https://doc.weixin.qq.com/smartsheet/form/1_wpnn3gDAAARYuiUwJ_LnVQrdgd81PAPw_a8bcdd')
  }

  const handleTestCanvas = () => {
    const imageResultInfo = {
      imgUrl: 'https://pic2.zhuanstatic.com/zhuanzh/0296d4c8-0822-44ee-a53c-1a4e9a14481b.png',
      width: 375,
      height: 1623,
    }
    // 缓存截图信息
    setScreenShotInfo(imageResultInfo)
    setIsResultModalOpen(true)
  }

  return (
    <>
      {contextHolder}
      {modalContextHolder}
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
          {!!__DEV__ && (
            <Flex wrap gap={16}>
              <Button variant="filled" color="magenta" onClick={handleResetDeviceEmulation}>
                重置设备模拟
              </Button>
              <Button variant="filled" color="gold" onClick={handleChangeWindowSize}>
                调整设备模拟
              </Button>

              <Button variant="filled" color="blue" onClick={handleGetClipboardContent}>
                获取剪切板内容
              </Button>
              <Button variant="filled" color="red" onClick={handleTestDomNodeProcessor}>
                dom数据处理测试
              </Button>
              <Button variant="filled" color="volcano" onClick={handleTestCanvas}>
                canvas测试
              </Button>

            </Flex>
          )}
        </Spin>
      </Modal>

      <Modal
        title="DOM节点检测结果展示"
        rootClassName={styles.uiDifferResultModal}
        open={isResultModalOpen}
        onCancel={handleCloseResultModal}
        footer={null}
        maskClosable={false}
        width={800}
        centered
        destroyOnHidden
      >
        <ResultRenderer
          onFinishResult={handleFinishResult}
          diffResultInfo={diffResultInfo}
          screenShotHeight={screenShotInfo.height}
          screenShotWidth={screenShotInfo.width}
          screenShot={screenShotInfo.imgUrl}
        />
      </Modal>

    </>
  )
}
