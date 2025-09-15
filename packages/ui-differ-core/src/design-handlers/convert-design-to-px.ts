/** 设计稿默认宽度 */
const DESIGN_DEFAULT_WIDTH = 750
/** DOM的宽度 */
const DOM_DEFAULT_WIDTH = 37.5

export function convertDesignToPx(designPx: number) {
  // return designPx
  if (designPx <= 1) {
    return designPx
  }
  // TODO:这边按zz px2rem的原逻辑来， 保留了两位小数 坑就是会导致精度丢失
  const originRemValue = designPx / DESIGN_DEFAULT_WIDTH * 10
  const remValue = Math.round(originRemValue * 100) / 100
  return Math.round(remValue * DOM_DEFAULT_WIDTH)
}
