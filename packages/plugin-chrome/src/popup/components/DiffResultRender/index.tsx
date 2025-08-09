import type { DiffResultInfo, MsgDataType } from '@/core/type'
import { useEffect, useState } from 'react'
import useFabric from '@/hooks/useFabirc'

export default function DiffResultRender() {
  const [differResult, setDifferResult] = useState<Record<string, DiffResultInfo>>()
  const [screenShot, setScreenShot] = useState<string>('')
  const [documentSize, setDocumentSize] = useState<{ width: number, height: number }>({
    width: 0,
    height: 0,
  })
  const { fabricCanvasRef, onInitCanvas, onAddMaskRect } = useFabric('diff-result-canvas')

  const handleInitResultInfo = () => {
    return new Promise<MsgDataType>((resolve) => {
      chrome.storage.local.get(['differResult'], (result) => {
        const { differResult: msgDifferResult } = result || {}
        resolve(msgDifferResult)
      })
    })
  }

  const handleAddMaskRect = async (diffResult: Record<string, DiffResultInfo>) => {
    const promises = Object.values(diffResult).map((item) => {
      return onAddMaskRect(item)
    })
    await Promise.all(promises)
    fabricCanvasRef.current?.renderAll()
  }

  const handleInitPageInfo = async () => {
    const result = await handleInitResultInfo()
    const { diffResult, screenShot, documentSize } = result || {}
    if (diffResult) {
      setDifferResult(diffResult)
    }

    await onInitCanvas(documentSize, screenShot)

    await handleAddMaskRect(diffResult)
  }

  useEffect(() => {
    handleInitPageInfo()
    // 清理storage中的临时数据
    // return () => {
    //   chrome.storage.local.remove(['differResult', 'mockerData', 'popupOpenType'])
    // }
  }, [])

  return (
    <div className="w-full h-full">
      {JSON.stringify(documentSize)}
      <canvas id="diff-result-canvas" />
    </div>
  )
}
