export function getRootBoundingOffset(rootNode: SceneNode) {
  const boundingRect = rootNode.absoluteBoundingBox
  return {
    x: boundingRect?.x || 0,
    y: boundingRect?.y || 0,
    height: boundingRect?.height || 0,
    id: rootNode.id,
  }
}
