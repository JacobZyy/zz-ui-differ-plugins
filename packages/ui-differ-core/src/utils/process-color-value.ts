export function processTransparentColor(color: string) {
  const colorArray = color.split('(')[1].split(')')[0].split(',').map(Number)
  const alphaValue = colorArray[3] || 1
  if (!alphaValue) {
    return 'transparent'
  }
  return color
}

export function getRealColor(colors: string[]) {
  return colors.filter(color => color !== 'transparent')[0] || 'transparent'
}
