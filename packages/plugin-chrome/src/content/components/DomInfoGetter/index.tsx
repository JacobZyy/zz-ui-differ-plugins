import type { NodeInfo, UniqueId } from '@ui-differ/core'
import { onDomInfoRecorder, processPaddingInfo, removeSameSizePositionChildren, searchNeighborNodes, SiblingPosition } from '@ui-differ/core'
import { FloatButton, Modal } from 'antd'
import { useEffect, useState } from 'react'
import useDocumentWidth from '@/content/storage/useDocumentWidth'
import { generateScreenShot } from '@/core/generateScreenShot'
import styles from './index.module.scss'
import RootDetector from './RootDetector'

export default function DomInfoGetter() {
  // 控制 Modal 显示状态
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [designNodeInfo, setDesignNodeInfo] = useState<Record<UniqueId, NodeInfo>>({})
  const setDocumentWidth = useDocumentWidth(state => state.setDocumentWidth)
  const setRootFontSize = useDocumentWidth(state => state.setRootFontSize)
  // 打开 Modal
  const handleOpenModal = async () => {
    setIsModalOpen(true)
    const designNodeJSON = await navigator.clipboard.readText()
  }

  // 关闭 Modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleGetScreenShot = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    const { imgUrl: screenShot, width, height } = await generateScreenShot()
    return {
      screenShot,
      documentSize: { width, height },
    }
  }

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

  const handleInitRemInfo = () => {
    const fontSize = document.documentElement.style.fontSize.replace('px', '')
    setDocumentWidth(document.documentElement.clientWidth)
    setRootFontSize(Number(fontSize) || 16)
  }

  useEffect(() => {
    handleInitRemInfo()
  }, [])

  return (
    <>
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
        <RootDetector onClose={handleCloseModal} onConfirm={handleStartUiDiff} />
      </Modal>
    </>
  )
}
