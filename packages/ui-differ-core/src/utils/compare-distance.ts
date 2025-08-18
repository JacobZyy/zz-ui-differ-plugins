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

  // 返回值为0即为同一个数值
  return !fixedDiffVal
}

/**
 * 计算两个值的差值，将结果四舍五入
 * @param prevValue 第一个值
 * @param nextValue 第二个值
 * @returns 四舍五入后的差值
 */
export function fixedSubstract(prevValue: number, nextValue: number) {
  const diff = prevValue - nextValue
  // 四舍五入到整数
  const fixedValue = Math.round(diff)
  return fixedValue
}
