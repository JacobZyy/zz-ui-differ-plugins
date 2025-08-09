import useDocumentWidth from '@/content/storage/useDocumentWidth'
import { DESIGN_DEFAULT_WIDTH } from './type'

export function convertDesignToPx(designPx: number) {
  const rootWidth = useDocumentWidth.getState().documentWidth
  // TODO:这边按zz px2rem的原逻辑来， 保留了两位小数 坑就是会导致精度丢失
  const remValue = Number((designPx / DESIGN_DEFAULT_WIDTH).toFixed(3))
  return Math.round(remValue * rootWidth)
}
