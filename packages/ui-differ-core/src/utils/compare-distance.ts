/**
 * 比较两个值的距离，并返回一个固定值
 * @param firstVal 第一个值
 * @param nextVal 第二个值
 * @returns 返回一个固定值
 *
 */
export function isSameDistance(firstVal: number, nextVal: number) {
  const diff = nextVal - firstVal

  const fixedDiffVal = Math.round(diff)

  return !!fixedDiffVal
}
