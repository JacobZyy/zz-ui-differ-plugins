import type { NodeInfo, UniqueId } from '@ui-differ/core'
import { PluginMessage, sendMsgToPlugin, UIMessage } from '@messages/sender'
import {
  DESIGN_NODE_PREFIX,
  getDesignInfoRecorder,
  processPaddingInfo,
  removeSameSizePositionChildren,
  reOrderDesignNodes,
  searchNeighborNodes,
} from '@ui-differ/core'
import { useMemoizedFn } from 'ahooks'
import { Button, message, Typography } from 'antd'
import ClipboardJS from 'clipboard'
import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [selectedNode, setSelectedNode] = useState<Record<UniqueId, NodeInfo>>({})
  // 监听来自插件的消息
  const messageHandler = useMemoizedFn((event: MessageEvent) => {
    const { type, data } = event.data
    if (type === PluginMessage.SELECTION_CHANGE) {
      if (!data?.length) {
        message.error('请选中你需要走查的设计稿')
        return
      }
      // 初始化设计稿节点信息
      const initialFlatNodeMap = getDesignInfoRecorder(data[0])
      console.log('🚀 ~ App ~ initialFlatNodeMap:', initialFlatNodeMap)
      // 重新排序设计稿节点
      const reorderedFlatNodeMap = reOrderDesignNodes(initialFlatNodeMap)
      // 合并无效padding
      const paddingMergedFlatNodeMap = processPaddingInfo(reorderedFlatNodeMap)
      // 移除相同尺寸、位置的子节点
      const removedSameSizePositionChildrenFlatNodeMap = removeSameSizePositionChildren(paddingMergedFlatNodeMap)
      // 搜索邻居节点
      const flatNodeMap = searchNeighborNodes(removedSameSizePositionChildrenFlatNodeMap)

      setSelectedNode(Object.fromEntries(flatNodeMap.entries()))
    }
  })

  const getInitialSelectionNode = useMemoizedFn(() => {
    sendMsgToPlugin({
      type: UIMessage.GET_SELECTION,
      data: null,
    })
  })

  const handleInitClipboard = () => {
    const clipboard = new ClipboardJS('.copy-btn')
    clipboard.on('success', () => {
      message.success('复制成功')
    })
    clipboard.on('error', (e) => {
      console.error(e)
      message.error('复制失败')
    })
  }

  useEffect(() => {
    getInitialSelectionNode()
    handleInitClipboard()
    window.addEventListener('message', messageHandler)
    return () => window.removeEventListener('message', messageHandler)
  }, [])

  const selectedNodeJson = JSON.stringify(selectedNode, null, 2)

  const copyText = `${DESIGN_NODE_PREFIX}${JSON.stringify(Object.values(selectedNode), null, 2)}`

  return (
    <div className="app">
      <Typography>
        <Button variant="filled" color="geekblue" className="copy-btn" data-clipboard-text={copyText}>
          复制节点信息
        </Button>
        <pre>
          {selectedNodeJson}
        </pre>
      </Typography>
    </div>
  )
}

export default App
