interface UploadOptions {
  author?: string
  onSuccess?: (url: string, file: File) => void
  onError?: (error: any) => void
}

interface UploadResult {
  success: boolean
  cdnUrl?: string
  message?: string
  error?: any
}

/**
 * 基于 fetch 的文件上传方法
 * @param file 要上传的文件
 * @param options 上传配置选项
 * @returns Promise<UploadResult> 上传结果，包含 CDN 地址
 */
export async function uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
  const {
    author = 'unknown',
    onSuccess = () => {},
    onError = () => {},
  } = options

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('author', author)
    formData.append('cover', 'false')

    const response = await fetch('https://tools.zhuanspirit.com/api/postUploadBigFile', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.status === 'success') {
      const cdnUrl = result.srcUrl
      onSuccess(cdnUrl, file)

      return {
        success: true,
        cdnUrl,
        message: '上传成功',
      }
    }
    else {
      throw new Error(result.message || '上传出错')
    }
  }
  catch (error: any) {
    const errorObj = {
      success: false,
      message: error.message || '上传出错',
      error,
    }

    onError(errorObj)
    return errorObj
  }
}
