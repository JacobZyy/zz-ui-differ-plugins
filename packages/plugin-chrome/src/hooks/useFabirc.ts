import type { DiffResultInfo } from '@ui-differ/core'
import type { RectProps, TextProps } from 'fabric'
import { SiblingPosition } from '@ui-differ/core'
import { Canvas, FabricImage, FabricText, Rect } from 'fabric'
import { useRef } from 'react'
import { v4 } from 'uuid'

const horizontalTextStyle = {
  fill: '#ff4d4f',
  fontWeight: 'bold',
  fontFamily: 'sans-serif',
  fontSize: 12,
}

const verticalTextStyle = {
  fill: '#0019FF',
  fontWeight: 'bold',
  fontFamily: 'sans-serif',
  fontSize: 12,
}

const horizontalMarginRectStyle = {
  fill: '#ff9c55',
  opacity: 0.85,
}

const verticalMarginRectStyle = {
  fill: '#7a86f6',
  opacity: 0.85,
}

const sizeRectStyle = {
  stroke: '#83d445',
  strokeWidth: 2,
}

interface UseFabricOptions {
  canvasId: string
  diffResultInfo: DiffResultInfo[]
  imageCount: number
  screenShot: string
  screenShotHeight: number
  screenShotWidth: number
}

export default function useFabric({ canvasId, diffResultInfo, imageCount, screenShot, screenShotHeight, screenShotWidth }: UseFabricOptions) {
  const fabricCanvasRef = useRef<Canvas>(new Canvas(canvasId))

  // 每张图上渲染的异常数量
  const resultCountPerImage = Math.floor(diffResultInfo.length / imageCount)

  /** 从url创建一个图片对象 */
  const getBackgroundImageObj = async (imgUrl: string, position: { left: number, top: number }) => {
    const bgImage = await FabricImage.fromURL(imgUrl, {
      crossOrigin: 'anonymous',
    })

    bgImage.set({
      scaleX: 1,
      scaleY: 1,
      originX: 'left',
      originY: 'top',
      ...position,
    })

    return bgImage
  }

  const handleAddRect = (props: Partial<RectProps>) => {
    const rect = new Rect(props)
    fabricCanvasRef.current?.add(rect)
  }

  const handleAddText = (text: string, props: Partial<TextProps>) => {
    const fabricText = new FabricText(text, props)
    fabricCanvasRef.current?.add(fabricText)
  }

  const onAddMaskRect = async (diffResultItem: DiffResultInfo, imageIdx: number) => {
    const { distanceResult, originNode, designNode } = diffResultItem
    const { marginLeft, marginTop, width, height } = distanceResult
    const { neighborMarginInfo: designNeighborMarginInfo } = designNode

    const imageTopOffset = Math.max(imageIdx * (screenShotHeight + 16), 16)

    const {
      x: nodeLeft,
      y: nodeTop,
      height: nodeHeight,
      width: nodeWidth,
    } = originNode.boundingRect

    if (marginLeft !== 0) {
      const designMarginLeft = designNeighborMarginInfo[SiblingPosition.LEFT]?.value || 0
      const rectWidth = designMarginLeft + marginLeft
      const rectSize = {
        left: nodeLeft - rectWidth,
        top: nodeTop + imageTopOffset,
        width: rectWidth,
        height: nodeHeight,
      }
      handleAddRect({
        ...rectSize,
        ...horizontalMarginRectStyle,
      })
      const text = marginLeft > 0 ? `间距小了${Math.abs(marginLeft)}px` : `间距大了${Math.abs(marginLeft)}px`
      handleAddText(text, {
        left: rectSize.left,
        top: rectSize.top + rectSize.height / 2,
        ...horizontalTextStyle,
      })
    }
    if (marginTop !== 0) {
      const designNodeTop = designNeighborMarginInfo[SiblingPosition.TOP]?.value || 0
      const rectHeight = designNodeTop + marginTop
      const rectSize = {
        left: nodeLeft,
        top: nodeTop - rectHeight + imageTopOffset,
        width: nodeWidth,
        height: rectHeight,
      }
      handleAddRect({
        ...rectSize,
        ...verticalMarginRectStyle,
      })
      const text = marginTop > 0 ? `间距大了${Math.abs(marginTop)}px` : `间距小了${Math.abs(marginTop)}px`
      handleAddText(text, {
        left: rectSize.left + rectSize.width / 2,
        top: rectSize.top,
        ...verticalTextStyle,
      })
    }

    if (width !== 0) {
      handleAddRect({
        left: nodeLeft,
        top: nodeTop + imageTopOffset,
        width: nodeWidth,
        height: nodeHeight,
        fill: '#83d445',
        opacity: 0.5,
        ...sizeRectStyle,
      })
      const text = width > 0 ? `宽度大了${width}px` : width < 0 ? `宽度小了${width}px` : ''

      const textLeft = nodeLeft + nodeWidth / 2
      const textTop = nodeTop + nodeHeight / 2

      handleAddText(text, {
        left: textLeft,
        top: textTop,
        fill: '#111',
        fontSize: 10,
      })
    }

    if (height !== 0) {
      handleAddRect({
        left: nodeLeft,
        top: nodeTop + imageTopOffset,
        width: nodeWidth,
        height: nodeHeight,
        fill: '#83d445',
        opacity: 0.5,
        ...sizeRectStyle,
      })
      const text = height > 0 ? `高度大了${height}px` : height < 0 ? `高度小了${height}px` : ''

      const textLeft = nodeLeft + nodeWidth / 2
      const textTop = nodeTop + nodeHeight / 2

      handleAddText(text, {
        left: textLeft,
        top: textTop,
        fill: '#111',
        fontSize: 10,
      })
    }
  }

  /** 初始化背景图 */
  const onInitCanvas = async () => {
    const canvasHeight = Math.max(imageCount * (screenShotHeight + 16) + 16, screenShotHeight)
    fabricCanvasRef.current = new Canvas(canvasId, {
      width: screenShotWidth,
      height: canvasHeight,
      backgroundColor: '#121b38',
    })

    const bgImagesListPromises = Array.from({ length: Math.max(imageCount, 1) }).map(async (_, imgIdx) => {
      const left = 0
      const top = Math.max(imgIdx * (screenShotHeight + 16), 16)
      // 生成背景图片
      const bgImage = await getBackgroundImageObj(screenShot, { left, top })
      return bgImage
    })
    const bgImagesList = await Promise.all(bgImagesListPromises)
    // 绘制背景图
    bgImagesList.forEach((bgImage) => {
      const rect = new Rect({
        left: bgImage.left,
        top: bgImage.top,
        width: bgImage.width,
        height: bgImage.height,
        stroke: '#121b38',
        fill: 'transparent',
        strokeWidth: 2,
      })
      fabricCanvasRef.current.add(rect)
      fabricCanvasRef.current.add(bgImage)
    })

    // 绘制对应的图
    const renderListPromises = bgImagesList.flatMap((_, imgIdx) => {
      return Array.from({ length: resultCountPerImage }).map((_, resultIdx) => {
        const targetIdx = imgIdx * resultCountPerImage + resultIdx
        const diffResultItem = diffResultInfo[targetIdx]
        return onAddMaskRect(diffResultItem, imgIdx)
      })
    })
    await Promise.all(renderListPromises)
    fabricCanvasRef.current.renderAll()
  }

  const handleGenerateImages = async () => {
    try {
      // 将 fabric canvas 转换为 dataURL
      const canvasDataUrl = fabricCanvasRef.current?.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
      })

      if (!canvasDataUrl) {
        throw new Error('Failed to generate canvas data URL')
      }

      // 转换为 Blob
      const response = await fetch(canvasDataUrl)
      const blob = await response.blob()

      // 创建 FormData
      const formData = new FormData()
      formData.append('file', blob, `${v4()}.png`)

      // 上传图片到 CDN
      const uploadResponse = await fetch('https://tools.zhuanspirit.com/api/postMinPic', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`)
      }

      const result = await uploadResponse.json()
      const picCount = Math.floor(Math.random() * 6) + 1
      const imgUrl = `https://pic${picCount}.zhuanstatic.com/zhuanzh/${result.respData}`

      return imgUrl
    }
    catch (error) {
      console.error('Failed to generate and upload fabric canvas image:', error)
      throw error
    }
  }

  return {
    onInitCanvas,
    fabricCanvasRef,
    handleGenerateImages,
  }
}
