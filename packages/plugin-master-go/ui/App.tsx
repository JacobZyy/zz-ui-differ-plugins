import type { NodeInfo, RootNodeOffsetInfo, UniqueId } from '@ui-differ/core'
import { PluginMessage, sendMsgToPlugin, UIMessage } from '@messages/sender'
import {
  DESIGN_NODE_PREFIX,
  getDesignInfoRecorder,
  getNeighborNodeDistance,
  processPaddingInfo,
  removeSameSizePositionChildren,
  reOrderDesignNodes,
  searchNeighborNodes,
  shrinkRectBounding,
} from '@ui-differ/core'
import { useMemoizedFn } from 'ahooks'
import { Button, message, Space } from 'antd'
import ClipboardJS from 'clipboard'
import { useEffect, useRef, useState } from 'react'
import ReactJson from 'react-json-view'
import { drawCurrentNodeInfos } from './drawCurrentNodeInfos'
import './App.css'

function App() {
  const [selectedNode, setSelectedNode] = useState<Record<UniqueId, NodeInfo>>({})
  const [originNode, setOriginNode] = useState<SceneNode>()
  const rootOffset = useRef<RootNodeOffsetInfo>({
    x: 0,
    y: 0,
    height: 0,
    id: '',
  })

  const handleDesignNodePreProcessChain = async (rootNode: SceneNode) => {
    const { initialNodeMap: designInfoRecorder, rootNodeBoundingOffset } = await getDesignInfoRecorder(rootNode)
    rootOffset.current = rootNodeBoundingOffset
    console.log('🚀 ~ handleDesignNodePreProcessChain ~ designInfoRecorder:', designInfoRecorder)
    const reOrderDesignNodeList = await reOrderDesignNodes(designInfoRecorder)
    console.log('🚀 ~ handleDesignNodePreProcessChain ~ reOrderDesignNodeList:', reOrderDesignNodeList)
    const processedPaddingInfo = await processPaddingInfo(reOrderDesignNodeList)
    console.log('🚀 ~ handleDesignNodePreProcessChain ~ processedPaddingInfo:', processedPaddingInfo)
    const shrinkedBoundingRectInfo = await shrinkRectBounding(processedPaddingInfo)
    console.log('🚀 ~ handleDesignNodePreProcessChain ~ shrinkedBoundingRectInfo:', shrinkedBoundingRectInfo)
    const removedSameSizePositionChildren = await removeSameSizePositionChildren(shrinkedBoundingRectInfo)
    console.log('🚀 ~ handleDesignNodePreProcessChain ~ removedSameSizePositionChildren:', removedSameSizePositionChildren)
    const neighborNodes = await searchNeighborNodes(removedSameSizePositionChildren)
    console.log('🚀 ~ handleDesignNodePreProcessChain ~ neighborNodes:', neighborNodes)
    const distanceResult = await getNeighborNodeDistance(neighborNodes)
    console.log('🚀 ~ handleDesignNodePreProcessChain ~ distanceResult:', distanceResult)
    return distanceResult
  }

  // const handleDesignNodePreProcessChain = async (rootNode: SceneNode) => {
  //   return getDesignInfoRecorder(rootNode)
  //     .then(({ initialNodeMap: designInfoRecorder }) => reOrderDesignNodes(designInfoRecorder))
  //     .then(processPaddingInfo)
  //     .then(shrinkRectBounding)
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

  const handleDrawNodeInfos = () => {
    drawCurrentNodeInfos(new Map(Object.entries(selectedNode)), rootOffset.current)
  }

  const copyText = `${DESIGN_NODE_PREFIX}${JSON.stringify(Object.values(selectedNode), null, 2)}`
  return (
    <div className="app">
      <ReactJson src={originNode || {}} />
      <Space.Compact>
        <Button variant="filled" color="geekblue" className="copy-btn" data-clipboard-text={copyText}>
          复制节点信息
        </Button>
        <Button variant="filled" color="blue" onClick={handleDrawNodeInfos}>
          绘制节点
        </Button>
      </Space.Compact>
      <ReactJson src={selectedNode} collapsed theme="solarized" />
    </div>
  )
}

export default App
