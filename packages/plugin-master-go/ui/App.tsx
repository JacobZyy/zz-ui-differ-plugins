import type { NodeInfo, RootNodeOffsetInfo, UniqueId } from '@ui-differ/core'
import { PluginMessage, sendMsgToPlugin, UIMessage } from '@messages/sender'
import {
  combineMaskLayers,
  createDesignNodeProcessChain,
  DESIGN_NODE_PREFIX,
  getRootBoundingOffset,
  hoistingRectangleStyle,
  processOverFlowHidden,
} from '@ui-differ/core'
import { useMemoizedFn } from 'ahooks'
import { Button, Input, message, Space } from 'antd'
import ClipboardJS from 'clipboard'
import { useEffect, useMemo, useRef, useState } from 'react'
import ReactJson from 'react-json-view'
import { drawCurrentNodeInfos } from './drawCurrentNodeInfos'
import './App.css'

function App() {
  const [selectedNode, setSelectedNode] = useState<Record<UniqueId, NodeInfo>>({})
  const [originNodeData, setOriginNodeData] = useState<SceneNode>()
  const [originNodeNoChild, setOriginNodeNoChild] = useState<SceneNode>()
  const rootOffset = useRef<RootNodeOffsetInfo>({
    x: 0,
    y: 0,
    height: 0,
    id: '',
  })

  /** 获取转换成px信息后的设计稿信息（用于复制） */
  const handleGetConvertedNodeData = async (rootNode: SceneNode) => {
    const defaultConfig = {
      safeTopHeight: 88, // 原PHONE_HEADER_HEIGHT
      safeBottomHeight: 68, // 原SAFE_BOTTOM_HEIGHT
      convertPxTrigger: true,
    }
    const processChain = createDesignNodeProcessChain(defaultConfig)
    rootOffset.current = getRootBoundingOffset(rootNode)
    const flatNodeMap = await processChain(rootNode, rootOffset.current)
    setSelectedNode(Object.fromEntries(flatNodeMap.entries()))
  }

  /** 获取转换成px信息后的设计稿信息（用于测试绘制） */
  const handleGetNodeConvertedNodeData = async (rootNode: SceneNode) => {
    const customConfig = {
      safeTopHeight: 0,
      safeBottomHeight: 0,
      convertPxTrigger: false,
    }
    const customProcessChain = createDesignNodeProcessChain(customConfig)
    rootOffset.current = getRootBoundingOffset(rootNode)
    const flatNodeMap = await customProcessChain(rootNode, rootOffset.current)
    return flatNodeMap
  }

  const handlePreProcessNodeData = (rootNode: SceneNode) => {
    const combinedNode = combineMaskLayers(rootNode)
    const hoistedNode = hoistingRectangleStyle(combinedNode)
    const overFlowHiddenNode = processOverFlowHidden(hoistedNode)
    return overFlowHiddenNode
  }

  // 监听来自插件的消息
  const messageHandler = useMemoizedFn(async (event: MessageEvent) => {
    const { type, data } = event.data
    if (type === PluginMessage.SELECTION_CHANGE) {
      if (!data?.length) {
        message.error('请选中你需要走查的设计稿')
        return
      }
      const processOriginData: any = handlePreProcessNodeData(data[0])
      setOriginNodeData(processOriginData)
      handleGetConvertedNodeData(processOriginData)
      const { children, ...rest } = processOriginData
      setOriginNodeNoChild(rest)
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

  const handleDrawNodeInfos = async () => {
    if (!originNodeData) {
      message.error('请选中你需要走查的设计稿')
      return
    }
    const nodeDataForDraw = await handleGetNodeConvertedNodeData(originNodeData)
    drawCurrentNodeInfos(nodeDataForDraw, rootOffset.current)
  }

  /** 测试用 */
  const handleBackgroundRectangleTest = async () => {
    if (!originNodeData)
      return
    const updatedNode = hoistingRectangleStyle(originNodeData)
    setOriginNodeData(updatedNode)
  }

  const copyText = `${DESIGN_NODE_PREFIX}${JSON.stringify(Object.values(selectedNode), null, 2)}`

  const [searchKey, setSearchKey] = useState('')

  const showSelectedNode = useMemo(() => {
    if (!searchKey)
      return selectedNode
    return selectedNode[searchKey]
  }, [selectedNode, searchKey])

  return (
    <div className="app">
      <ReactJson src={originNodeNoChild || {}} />
      <Input value={searchKey} onChange={e => setSearchKey(e.target.value)} />
      <Space.Compact>
        <Button variant="filled" color="geekblue" className="copy-btn" data-clipboard-text={copyText}>
          复制节点信息
        </Button>
      </Space.Compact>
      <Space.Compact>
        <Button variant="filled" color="blue" onClick={handleDrawNodeInfos}>
          绘制节点
        </Button>
        <Button variant="filled" color="blue" onClick={handleBackgroundRectangleTest}>
          背景rectangle样式提升测试
        </Button>
      </Space.Compact>
      <ReactJson src={showSelectedNode} collapsed theme="solarized" />
    </div>
  )
}

export default App
