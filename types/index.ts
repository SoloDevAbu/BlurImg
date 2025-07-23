export interface BlurShape {
  id: string
  type: 'square' | 'circle' | 'freehand'
  x: number
  y: number
  width: number
  height: number
  radius: number
  opacity: number
  blurRadius: number
  points?: number[] // for freehand
}

export interface EditorState {
  shapes: BlurShape[]
  selectedTool: 'select' | 'square' | 'circle' | 'freehand'
  selectedShapeId: string | null
  blurRadius: number
  blurOpacity: number
  history: BlurShape[][]
  historyIndex: number
  image: HTMLImageElement | null
  blurRegions: BlurRegion[]
  brushSize: number
}

export interface BlurRegion {
  id: string
  type: 'square' | 'circle' | 'freehand'
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  points?: { x: number; y: number }[]
  opacity: number
  blurRadius: number
}

export interface User {
  id: string
  email?: string
  name?: string
  avatar_url?: string
}