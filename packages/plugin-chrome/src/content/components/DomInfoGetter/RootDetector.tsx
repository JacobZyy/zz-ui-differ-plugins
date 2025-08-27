import { initialDomUUID } from '@ui-differ/core'
import { Button, Flex, Form, Input, Space, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import styles from './index.module.scss'

const { Text } = Typography

const DEFAULT_ROOT_NODE_ID = 'app'
const DEFAULT_ROOT_NODE_CLASS_NAME = '.app-wrapper'

interface RootDetectorProps {
  onClose: () => void
  onConfirm: (rootNode: HTMLElement) => void

}

export default function RootDetector({ onClose, onConfirm }: RootDetectorProps) {
  const [targetRootNode, setTargetRootNode] = useState<HTMLElement | null>(null)
  const [isEdit, _setIsEdit] = useState(false)
  const [form] = Form.useForm()

  function processNotFountError(className?: string) {
    const errorText = className ? `未找到className为${className}的节点` : '未找到默认根节点'
    form.setFields([{ name: 'rootClsName', errors: [errorText] }])
  }

  const handleInitRootNode = () => {
    const appNode = document.getElementById(DEFAULT_ROOT_NODE_ID)
    if (!appNode) {
      processNotFountError()
      return
    }
    const appWrapperNode = appNode.querySelector(DEFAULT_ROOT_NODE_CLASS_NAME)
    if (!appWrapperNode) {
      processNotFountError()
      return
    }
    const targetNode = appWrapperNode.firstElementChild
    if (!(targetNode instanceof HTMLElement)) {
      processNotFountError()
      return
    }
    setTargetRootNode(targetNode)
    /** 初始化节点唯一 id */
    initialDomUUID(targetNode)
  }

  const handleSubmitFindNode = (values: { rootClsName: string }) => {
    const { rootClsName } = values
    const targetNode = document.querySelector(`.${rootClsName}`)
    if (!targetNode || !(targetNode instanceof HTMLElement)) {
      processNotFountError(rootClsName)
      return
    }
    setTargetRootNode(targetNode)
    /** 初始化节点唯一 id */
    initialDomUUID(targetNode)
  }

  const handleCloseModal = () => {
    onClose()
  }

  const handleStartUiDiff = () => {
    if (!targetRootNode) {
      return
    }
    onConfirm(targetRootNode)
    onClose()
  }

  useEffect(() => {
    handleInitRootNode()
  }, [])

  return (
    <Flex vertical gap={8}>
      <Flex vertical align="center">
        <Text strong>节点搜索的默认路线</Text>
        <Flex gap={8} align="center">
          <Tag color="blue" className={styles.defaultNodeTag}>app</Tag>
          👉
          <Tag color="geekblue" className={styles.defaultNodeTag}>app-wrapper</Tag>
          👉
          <Tag color="green" className={styles.defaultNodeTag}>[第一个子节点]</Tag>
        </Flex>
      </Flex>
      {(!targetRootNode || isEdit) && (
        <Form form={form} onFinish={handleSubmitFindNode} layout="vertical">
          <Form.Item name="rootClsName" label="根节点className" required rules={[{ required: true, message: '请输入根节点的className' }]}>
            <Input placeholder="请输入根节点的className" />
          </Form.Item>
          <Flex justify="end" gap={4}>
            <Button type="primary" htmlType="submit">
              确定
            </Button>
            <Button onClick={handleCloseModal}>
              取消
            </Button>
          </Flex>
        </Form>
      )}

      {(targetRootNode && !isEdit) && (
        <Flex vertical gap={4} justify="center">
          <Typography.Text>您的HTML根节点为：</Typography.Text>
          <Space.Compact>
            <Tag color="lime" className={styles.defaultNodeTag}>{targetRootNode.className}</Tag>
          </Space.Compact>
          <Flex justify="end" gap={4}>
            <Button type="primary" onClick={handleStartUiDiff}>
              开始ui比对
            </Button>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
