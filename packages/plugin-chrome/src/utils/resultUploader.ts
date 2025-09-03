import { uploadFile } from './uploadFile'

/**
 * 生成 JSON 文件并上传，返回上传后的 URL
 * @param resultData 结果数据
 * @returns Promise<string> 上传成功后的 CDN URL
 */
export async function uploadResultAsJson(resultData: Record<string, any>): Promise<string> {
  const resultJSON = JSON.stringify(resultData, null, 2)

  // 创建 JSON 文件
  const jsonBlob = new Blob([resultJSON], { type: 'application/json' })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `ui-differ-result-${timestamp}.json`
  const jsonFile = new File([jsonBlob], fileName, { type: 'application/json' })

  // 上传 JSON 文件
  const uploadResult = await uploadFile(jsonFile, {
    author: 'ui-differ-plugin',
    onSuccess: (url, file) => {
      console.log('JSON 文件上传成功:', url, file.name)
    },
    onError: (error) => {
      console.error('JSON 文件上传失败:', error)
    },
  })

  if (!uploadResult.success) {
    throw new Error(uploadResult.message || '上传失败')
  }

  return uploadResult.cdnUrl || ''
}
