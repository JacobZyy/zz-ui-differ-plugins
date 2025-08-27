import type { NodeInfo, UniqueId } from '@ui-differ/core'
import { PluginMessage, sendMsgToPlugin, UIMessage } from '@messages/sender'
import {
  DESIGN_NODE_PREFIX,
  getDesignInfoRecorder,
  getNeighborNodeDistance,
  processPaddingInfo,
  removeSameSizePositionChildren,
  reOrderDesignNodes,
  searchNeighborNodes,
} from '@ui-differ/core'
import { useMemoizedFn } from 'ahooks'
import { Button, message } from 'antd'
import ClipboardJS from 'clipboard'
import { useEffect, useState } from 'react'
import ReactJson from 'react-json-view'
import './App.css'

function App() {
  const [selectedNode, setSelectedNode] = useState<Record<UniqueId, NodeInfo>>({})
  const [originNode, setOriginNode] = useState<SceneNode>()

  const handleDesignNodePreProcessChain = async (rootNode: SceneNode) => {
    const designInfoRecorder = await getDesignInfoRecorder(rootNode)
    console.log('🚀 ~ handleDesignNodePreProcessChain ~ designInfoRecorder:', designInfoRecorder)
    const reOrderDesignNodeList = await reOrderDesignNodes(designInfoRecorder)
    console.log('🚀 ~ handleDesignNodePreProcessChain ~ reOrderDesignNodeList:', reOrderDesignNodeList)
    const processedPaddingInfo = await processPaddingInfo(reOrderDesignNodeList)
    console.log('🚀 ~ handleDesignNodePreProcessChain ~ processedPaddingInfo:', processedPaddingInfo)
    const removedSameSizePositionChildren = await removeSameSizePositionChildren(processedPaddingInfo)
    console.log('🚀 ~ handleDesignNodePreProcessChain ~ removedSameSizePositionChildren:', removedSameSizePositionChildren)
    const neighborNodes = await searchNeighborNodes(removedSameSizePositionChildren)
    console.log('🚀 ~ handleDesignNodePreProcessChain ~ neighborNodes:', neighborNodes)
    const distanceResult = await getNeighborNodeDistance(neighborNodes)
    console.log('🚀 ~ handleDesignNodePreProcessChain ~ distanceResult:', distanceResult)
    return distanceResult
  }

  // const handleDesignNodePreProcessChain = async (rootNode: SceneNode) => {
  //   return getDesignInfoRecorder(rootNode)
  //     .then(reOrderDesignNodes)
  //     .then(processPaddingInfo)
  //     .then(removeSameSizePositionChildren)
  //     .then(searchNeighborNodes)
  //     .then(getNeighborNodeDistance)
  // }

  // 监听来自插件的消息
  const messageHandler = useMemoizedFn(async (event: MessageEvent) => {
    const { type, data } = event.data
    const { children, ...rest } = data[0]
    setOriginNode(rest)
    if (type === PluginMessage.SELECTION_CHANGE) {
      if (!data?.length) {
        message.error('请选中你需要走查的设计稿')
        return
      }
      const flatNodeMap = await handleDesignNodePreProcessChain(data[0])
      console.log('🚀 ~ App ~ flatNodeMap:', flatNodeMap)
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

  const copyText = `${DESIGN_NODE_PREFIX}${JSON.stringify(Object.values(selectedNode), null, 2)}`

  return (
    <div className="app">
      <ReactJson src={originNode || {}} />
      <Button variant="filled" color="geekblue" className="copy-btn" data-clipboard-text={copyText}>
        复制节点信息
      </Button>
      <ReactJson src={selectedNode} />
    </div>
  )
}

export default App
