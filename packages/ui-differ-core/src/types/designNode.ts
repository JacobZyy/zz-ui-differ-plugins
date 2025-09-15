/** 有子节点的节点类型 */
export type NodeWithChild = GroupNode | FrameNode | ComponentNode | ComponentSetNode | InstanceNode

/** 无子节点的节点类型 */
export type NodeNoChild
  = | PenNode
    | StarNode
    | LineNode
    | EllipseNode
    | PolygonNode
    | RectangleNode
    | TextNode
    | SliceNode
    | BooleanOperationNode
    | ConnectorNode

export const nodeWithChildSet = new Set<SceneNode['type']>(['FRAME', 'COMPONENT', 'COMPONENT_SET', 'GROUP', 'INSTANCE'])
export const nodeNoChildSet = new Set<SceneNode['type']>(['BOOLEAN_OPERATION', 'CONNECTOR', 'ELLIPSE', 'LINE', 'PEN', 'POLYGON', 'RECTANGLE', 'SLICE', 'STAR', 'TEXT'])

export const DESIGN_NODE_PREFIX = '~$$MASTER_GO_UI_DIFFER_NODE_INFO$$~'

export interface RootNodeOffsetInfo {
  x: number
  y: number
  height: number
  id: string
}

export interface RootNodeBoundingOffsetInfo {
  x: number
  y: number
  height: number
  id: string
}
