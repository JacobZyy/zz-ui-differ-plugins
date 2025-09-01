import html2canvas from 'html2canvas'
import { v4 } from 'uuid'

export async function generateScreenShot() {
  try {
    // 获取body的完整高度,包含滚动部分
    const body = document.body
    const html = document.documentElement
    const height = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight,
    )

    // 获取完整宽度
    const width = Math.max(
      body.scrollWidth,
      body.offsetWidth,
      html.clientWidth,
      html.scrollWidth,
      html.offsetWidth,
    )

    // 创建canvas
    const canvas = await html2canvas(document.documentElement, {
      height,
      width,
      windowHeight: height,
      windowWidth: width,
      backgroundColor: '#fff',
      scale: 1,
      logging: false,
      useCORS: true,
      // 允许截取整个滚动区域
      scrollY: -window.scrollY,
      scrollX: -window.scrollX,
    })

    // 转换为base64
    const imageData = canvas.toDataURL('image/png')

    // 转换为Blob
    const response = await fetch(imageData)
    const blob = await response.blob()

    // 创建FormData
    const formData = new FormData()
    formData.append('file', blob, `${v4()}.png`)

    // 上传图片
    try {
      const uploadResponse = await fetch('https://tools.zhuanspirit.com/api/postMinPic', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok)
        throw new Error(`Upload failed: ${uploadResponse.statusText}`)

      const result = await uploadResponse.json()
      const picCount = Math.floor(Math.random() * 6) + 1
      const imgUrl = `https://pic${picCount}.zhuanstatic.com/zhuanzh/${result.respData}`

      return {
        imgUrl,
        width,
        height,
      }
    }
    catch (uploadError) {
      console.error('Failed to upload image:', uploadError)
      throw uploadError
    }
  }
  catch (error) {
    console.error('Failed to generate screenshot:', error)
    throw error
  }
}
