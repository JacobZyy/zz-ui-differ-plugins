import type { RectProps, TextProps } from 'fabric'
import type { DiffResultInfo, PageSize } from '@/core/type'
import { Canvas, FabricImage, FabricText, Rect } from 'fabric'
import { useRef } from 'react'

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

export default function useFabric(canvasId: string) {
  const fabricCanvasRef = useRef<Canvas>(null)
  const documentSizeRef = useRef<PageSize>({ width: 0, height: 0 })
  /** 从url创建一个图片对象 */
  const getBackgroundImageObj = async (imgUrl: string) => {
    const bgImage = await FabricImage.fromURL(imgUrl, {
      crossOrigin: 'anonymous',
    })

    const width = fabricCanvasRef.current?.getWidth() || bgImage.width
    const height = fabricCanvasRef.current?.getHeight() || bgImage.height

    const scaleX = width / bgImage.width
    const scaleY = height / bgImage.height

    bgImage.set({
      scaleX,
      scaleY,
      left: width / 2,
      top: height / 2,
      originX: 'center',
      originY: 'center',
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

  const onInitCanvas = async (documentSize: PageSize, screenShot: string) => {
    documentSizeRef.current = documentSize
    fabricCanvasRef.current = new Canvas(canvasId, {
      width: documentSize.width,
      height: documentSize.height,
    })

    const bgImage = await getBackgroundImageObj(screenShot)
    fabricCanvasRef.current.backgroundImage = bgImage
    const rect = new Rect({
      left: 0,
      top: 0,
      width: documentSize.width - 2,
      height: documentSize.height - 2,
      stroke: '#83d445',
      fill: 'transparent',
      strokeWidth: 1,
    })
    fabricCanvasRef.current?.add(rect)
    fabricCanvasRef.current?.renderAll()
  }

  const onAddMaskRect = async (distanceInfo: DiffResultInfo) => {
    const {
      nodeTop,
      nodeHeight,
      domMarginRight,
      domMarginLeft,
      domMarginTop,
      nodeLeft,
      marginLeft,
      marginTop,
      nodeWidth,
      width,
      height,
      designNodeId,
    } = distanceInfo

    if (marginLeft !== 0) {
      const rectSize = {
        left: nodeLeft,
        top: nodeTop,
        width: marginLeft > 0 ? domMarginLeft : domMarginLeft - marginLeft,
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
    if (marginTop !== 0 && (nodeTop + nodeHeight) <= documentSizeRef.current.height / 2) {
      const rectSize = {
        left: nodeLeft,
        top: nodeTop,
        width: nodeWidth,
        height: marginTop > 0 ? domMarginTop : domMarginTop - marginTop,
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
      console.log('🚀 ~ onAddMaskRect ~ distanceInfo:', text, rectSize, distanceInfo)
    }

    // if (width !== 0) {
    //   handleAddRect({
    //     left: nodeLeft,
    //     top: nodeTop,
    //     width: nodeWidth,
    //     height: nodeHeight,
    //     fill: '#83d445',
    //     opacity: 0.5,
    //   })
    //   const text = width > 0 ? `宽度大了${width}px` : width < 0 ? `宽度小了${width}px` : ''

    //   const textLeft = nodeLeft + nodeWidth / 2
    //   const textTop = nodeTop + nodeHeight / 2

    //   handleAddText(text, {
    //     left: textLeft,
    //     top: textTop,
    //     fill: '#111',
    //     fontSize: 10,
    //   })
    // }
  }

  return {
    onInitCanvas,
    fabricCanvasRef,
    onAddMaskRect,
  }
}
