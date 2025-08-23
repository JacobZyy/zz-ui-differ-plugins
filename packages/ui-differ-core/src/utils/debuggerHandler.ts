export function debuggerHandler(currentId: string, targetCls: string) {
  const currentEl = document.querySelector(`[unique-id="${currentId}"]`)
  if (!currentEl) {
    return
  }

  if (!currentEl.classList.contains(targetCls)) {
    return
  }
  const elementList = document.querySelectorAll(`.${targetCls}`)
  const elementArray = Array.from(elementList)
  const targetIdx = elementArray.findIndex(el => el === currentEl)
  if (!targetIdx) {
    // eslint-disable-next-line no-debugger
    debugger
  }
}
