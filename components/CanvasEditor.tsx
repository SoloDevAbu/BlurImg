'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { BlurRegion, EditorState } from '@/types'

interface CanvasEditorProps {
  state: EditorState
  onAddBlurRegion: (region: Omit<BlurRegion, 'id'>) => void
  onSelectShape: (id: string | null) => void
  onUpdateBlurRegion: (id: string, updates: Partial<BlurRegion>) => void
  className?: string
}

export default function CanvasEditor({ state, onAddBlurRegion, onSelectShape, onUpdateBlurRegion, className }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)

  // Track cursor style for resize handles
  const [cursorStyle, setCursorStyle] = useState<string>('default')

  // Draw resize handles for selected shape
  const drawResizeHandles = useCallback((region: BlurRegion) => {
    if (!overlayCanvasRef.current) return
    
    const overlayCtx = overlayCanvasRef.current.getContext('2d')
    if (!overlayCtx) return

    overlayCtx.fillStyle = '#3B82F6'
    overlayCtx.strokeStyle = '#FFFFFF'
    overlayCtx.lineWidth = 2
    const handleSize = 8

    if (region.type === 'square') {
      const x = region.x
      const y = region.y
      const w = region.width || 100
      const h = region.height || 100

      // Draw 8 resize handles
      const handles = [
        { x: x - handleSize/2, y: y - handleSize/2, cursor: 'nw-resize', handle: 'nw' },
        { x: x + w/2 - handleSize/2, y: y - handleSize/2, cursor: 'n-resize', handle: 'n' },
        { x: x + w - handleSize/2, y: y - handleSize/2, cursor: 'ne-resize', handle: 'ne' },
        { x: x + w - handleSize/2, y: y + h/2 - handleSize/2, cursor: 'e-resize', handle: 'e' },
        { x: x + w - handleSize/2, y: y + h - handleSize/2, cursor: 'se-resize', handle: 'se' },
        { x: x + w/2 - handleSize/2, y: y + h - handleSize/2, cursor: 's-resize', handle: 's' },
        { x: x - handleSize/2, y: y + h - handleSize/2, cursor: 'sw-resize', handle: 'sw' },
        { x: x - handleSize/2, y: y + h/2 - handleSize/2, cursor: 'w-resize', handle: 'w' }
      ]

      handles.forEach(handle => {
        overlayCtx.fillRect(handle.x, handle.y, handleSize, handleSize)
        overlayCtx.strokeRect(handle.x, handle.y, handleSize, handleSize)
      })
    } else if (region.type === 'circle') {
      const radius = region.radius || 50
      // Draw 4 resize handles for circle
      const handles = [
        { x: region.x - handleSize/2, y: region.y - radius - handleSize/2, handle: 'n' },
        { x: region.x + radius - handleSize/2, y: region.y - handleSize/2, handle: 'e' },
        { x: region.x - handleSize/2, y: region.y + radius - handleSize/2, handle: 's' },
        { x: region.x - radius - handleSize/2, y: region.y - handleSize/2, handle: 'w' }
      ]

      handles.forEach(handle => {
        overlayCtx.fillRect(handle.x, handle.y, handleSize, handleSize)
        overlayCtx.strokeRect(handle.x, handle.y, handleSize, handleSize)
      })
    }
  }, [])

  // Get cursor style based on resize handle
  const getResizeCursor = (handle: string): string => {
    switch (handle) {
      case 'nw': case 'se': return 'nw-resize'
      case 'ne': case 'sw': return 'ne-resize'
      case 'n': case 's': return 'n-resize'
      case 'e': case 'w': return 'e-resize'
      default: return 'default'
    }
  }

  // Apply blur effects to the main canvas
  const applyBlurEffects = useCallback(() => {
    if (!canvasRef.current || !state.image) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear and redraw original image
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(state.image, 0, 0, canvas.width, canvas.height)

    // Apply each blur region
    state.blurRegions.forEach(region => {
      ctx.save()
      ctx.globalAlpha = region.opacity

      if (region.type === 'square') {
        // Create square blur region
        const imageData = ctx.getImageData(region.x, region.y, region.width || 100, region.height || 100)
        applyGaussianBlur(imageData, region.blurRadius)
        ctx.putImageData(imageData, region.x, region.y)
      } else if (region.type === 'circle') {
        // Create circular clip path
        ctx.beginPath()
        ctx.arc(region.x, region.y, region.radius || 50, 0, Math.PI * 2)
        ctx.clip()
        
        const size = (region.radius || 50) * 2
        const imageData = ctx.getImageData(
          region.x - (region.radius || 50), 
          region.y - (region.radius || 50), 
          size, 
          size
        )
        applyGaussianBlur(imageData, region.blurRadius)
        ctx.putImageData(imageData, region.x - (region.radius || 50), region.y - (region.radius || 50))
      } else if (region.type === 'freehand' && region.points) {
        // Create freehand path clip
        ctx.beginPath()
        ctx.moveTo(region.points[0].x, region.points[0].y)
        region.points.forEach(point => ctx.lineTo(point.x, point.y))
        ctx.closePath()
        ctx.clip()

        // Apply blur to the entire canvas area (will be clipped)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        applyGaussianBlur(imageData, region.blurRadius)
        ctx.putImageData(imageData, 0, 0)
      }

      ctx.restore()
    })

  }, [state.image, state.blurRegions])

  // Draw selection indicators and resize handles
  const drawSelectionIndicators = useCallback(() => {
    if (!overlayCanvasRef.current || !state.selectedShapeId) return
    
    const overlayCtx = overlayCanvasRef.current.getContext('2d')
    if (!overlayCtx) return

    const selectedRegion = state.blurRegions.find(r => r.id === state.selectedShapeId)
    if (!selectedRegion) return

    overlayCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)
    overlayCtx.strokeStyle = '#3B82F6'
    overlayCtx.lineWidth = 2
    overlayCtx.setLineDash([5, 5])
    
    if (selectedRegion.type === 'square') {
      overlayCtx.strokeRect(selectedRegion.x, selectedRegion.y, selectedRegion.width || 100, selectedRegion.height || 100)
    } else if (selectedRegion.type === 'circle') {
      overlayCtx.beginPath()
      overlayCtx.arc(selectedRegion.x, selectedRegion.y, selectedRegion.radius || 50, 0, Math.PI * 2)
      overlayCtx.stroke()
    }
    
    // Draw resize handles
    drawResizeHandles(selectedRegion)
  }, [state.selectedShapeId, state.blurRegions, drawResizeHandles])
  // Simple Gaussian blur implementation
  const applyGaussianBlur = (imageData: ImageData, radius: number) => {
    if (radius === 0) return

    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    
    // Simple box blur approximation
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, count = 0
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = Math.max(0, Math.min(width - 1, x + dx))
            const ny = Math.max(0, Math.min(height - 1, y + dy))
            const idx = (ny * width + nx) * 4
            
            r += data[idx]
            g += data[idx + 1]
            b += data[idx + 2]
            count++
          }
        }
        
        const idx = (y * width + x) * 4
        data[idx] = r / count
        data[idx + 1] = g / count
        data[idx + 2] = b / count
      }
    }
  }

  // Check if point is on a resize handle
  const getResizeHandle = (x: number, y: number, region: BlurRegion): string | null => {
    const handleSize = 8
    const tolerance = 4

    if (region.type === 'square') {
      const rx = region.x
      const ry = region.y
      const w = region.width || 100
      const h = region.height || 100

      const handles = [
        { x: rx - handleSize/2, y: ry - handleSize/2, handle: 'nw' },
        { x: rx + w/2 - handleSize/2, y: ry - handleSize/2, handle: 'n' },
        { x: rx + w - handleSize/2, y: ry - handleSize/2, handle: 'ne' },
        { x: rx + w - handleSize/2, y: ry + h/2 - handleSize/2, handle: 'e' },
        { x: rx + w - handleSize/2, y: ry + h - handleSize/2, handle: 'se' },
        { x: rx + w/2 - handleSize/2, y: ry + h - handleSize/2, handle: 's' },
        { x: rx - handleSize/2, y: ry + h - handleSize/2, handle: 'sw' },
        { x: rx - handleSize/2, y: ry + h/2 - handleSize/2, handle: 'w' }
      ]

      for (const handle of handles) {
        if (x >= handle.x - tolerance && x <= handle.x + handleSize + tolerance &&
            y >= handle.y - tolerance && y <= handle.y + handleSize + tolerance) {
          return handle.handle
        }
      }
    } else if (region.type === 'circle') {
      const radius = region.radius || 50
      const handles = [
        { x: region.x - handleSize/2, y: region.y - radius - handleSize/2, handle: 'n' },
        { x: region.x + radius - handleSize/2, y: region.y - handleSize/2, handle: 'e' },
        { x: region.x - handleSize/2, y: region.y + radius - handleSize/2, handle: 's' },
        { x: region.x - radius - handleSize/2, y: region.y - handleSize/2, handle: 'w' }
      ]

      for (const handle of handles) {
        if (x >= handle.x - tolerance && x <= handle.x + handleSize + tolerance &&
            y >= handle.y - tolerance && y <= handle.y + handleSize + tolerance) {
          return handle.handle
        }
      }
    }

    return null
  }

  // Check if point is inside a blur region
  const getRegionAtPoint = (x: number, y: number): BlurRegion | null => {
    // Check in reverse order to get topmost region
    for (let i = state.blurRegions.length - 1; i >= 0; i--) {
      const region = state.blurRegions[i]
      
      if (region.type === 'square') {
        if (x >= region.x && x <= region.x + (region.width || 100) &&
            y >= region.y && y <= region.y + (region.height || 100)) {
          return region
        }
      } else if (region.type === 'circle') {
        const distance = Math.sqrt(Math.pow(x - region.x, 2) + Math.pow(y - region.y, 2))
        if (distance <= (region.radius || 50)) {
          return region
        }
      }
    }
    return null
  }

  // Setup canvas when image loads
  useEffect(() => {
    if (!state.image || !canvasRef.current) return

    const canvas = canvasRef.current
    const overlay = overlayCanvasRef.current
    
    // Set canvas dimensions to match image
    const aspectRatio = state.image.width / state.image.height
    const maxWidth = 800
    const maxHeight = 600
    
    let canvasWidth = maxWidth
    let canvasHeight = maxWidth / aspectRatio
    
    if (canvasHeight > maxHeight) {
      canvasHeight = maxHeight
      canvasWidth = maxHeight * aspectRatio
    }
    
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    
    if (overlay) {
      overlay.width = canvasWidth
      overlay.height = canvasHeight
    }

    applyBlurEffects()
  }, [state.image, applyBlurEffects])

  // Redraw when blur regions change
  useEffect(() => {
    applyBlurEffects()
  }, [applyBlurEffects])

  // Draw selection indicators when selection changes
  useEffect(() => {
    drawSelectionIndicators()
  }, [drawSelectionIndicators])

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)
    
    if (state.selectedTool === 'select') {
      const region = getRegionAtPoint(pos.x, pos.y)
      if (region) {
        // Check if clicking on resize handle
        const handle = getResizeHandle(pos.x, pos.y, region)
        if (handle) {
          setIsResizing(true)
          setResizeHandle(handle)
          onSelectShape(region.id)
          setCursorStyle(getResizeCursor(handle))
        } else {
          onSelectShape(region.id)
          setIsDragging(true)
          setDragOffset({
            x: pos.x - region.x,
            y: pos.y - region.y
          })
          setCursorStyle('move')
        }
      } else {
        onSelectShape(null)
        setCursorStyle('default')
      }
    } else {
      setIsDrawing(true)
      setStartPos(pos)
      
      if (state.selectedTool === 'freehand') {
        setCurrentPath([pos])
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)
    
    // Update cursor style based on what's under the mouse
    if (state.selectedTool === 'select' && state.selectedShapeId && !isResizing && !isDragging) {
      const selectedRegion = state.blurRegions.find(r => r.id === state.selectedShapeId)
      if (selectedRegion) {
        const handle = getResizeHandle(pos.x, pos.y, selectedRegion)
        if (handle) {
          setCursorStyle(getResizeCursor(handle))
        } else if (getRegionAtPoint(pos.x, pos.y)) {
          setCursorStyle('move')
        } else {
          setCursorStyle('default')
        }
      }
    }
    
    if (isResizing && state.selectedShapeId && resizeHandle) {
      const selectedRegion = state.blurRegions.find(r => r.id === state.selectedShapeId)
      if (selectedRegion) {
        if (selectedRegion.type === 'square') {
          const updates: Partial<BlurRegion> = {}
          const currentX = selectedRegion.x
          const currentY = selectedRegion.y
          const currentW = selectedRegion.width || 100
          const currentH = selectedRegion.height || 100

          switch (resizeHandle) {
            case 'nw':
              updates.x = pos.x
              updates.y = pos.y
              updates.width = currentW + (currentX - pos.x)
              updates.height = currentH + (currentY - pos.y)
              break
            case 'n':
              updates.y = pos.y
              updates.height = currentH + (currentY - pos.y)
              break
            case 'ne':
              updates.y = pos.y
              updates.width = pos.x - currentX
              updates.height = currentH + (currentY - pos.y)
              break
            case 'e':
              updates.width = pos.x - currentX
              break
            case 'se':
              updates.width = pos.x - currentX
              updates.height = pos.y - currentY
              break
            case 's':
              updates.height = pos.y - currentY
              break
            case 'sw':
              updates.x = pos.x
              updates.width = currentW + (currentX - pos.x)
              updates.height = pos.y - currentY
              break
            case 'w':
              updates.x = pos.x
              updates.width = currentW + (currentX - pos.x)
              break
          }

          // Ensure minimum size
          if (updates.width !== undefined && updates.width < 20) updates.width = 20
          if (updates.height !== undefined && updates.height < 20) updates.height = 20

          onUpdateBlurRegion(state.selectedShapeId, updates)
        } else if (selectedRegion.type === 'circle') {
          const centerX = selectedRegion.x
          const centerY = selectedRegion.y
          const newRadius = Math.sqrt(Math.pow(pos.x - centerX, 2) + Math.pow(pos.y - centerY, 2))
          
          if (newRadius >= 10) {
            onUpdateBlurRegion(state.selectedShapeId, { radius: newRadius })
          }
        }
      }
      return
    }
    
    if (isDragging && state.selectedShapeId) {
      const selectedRegion = state.blurRegions.find(r => r.id === state.selectedShapeId)
      if (selectedRegion) {
        const newX = pos.x - dragOffset.x
        const newY = pos.y - dragOffset.y
        onUpdateBlurRegion(state.selectedShapeId, { x: newX, y: newY })
      }
      return
    }
    
    if (!isDrawing || !overlayCanvasRef.current) return
    
    const overlay = overlayCanvasRef.current
    const ctx = overlay.getContext('2d')
    if (!ctx) return

    // Clear overlay
    ctx.clearRect(0, 0, overlay.width, overlay.height)

    if (state.selectedTool === 'square' && startPos) {
      // Draw preview square
      ctx.strokeStyle = '#3B82F6'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(
        startPos.x, 
        startPos.y, 
        pos.x - startPos.x, 
        pos.y - startPos.y
      )
    } else if (state.selectedTool === 'circle' && startPos) {
      // Draw preview circle
      const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2))
      ctx.strokeStyle = '#3B82F6'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2)
      ctx.stroke()
    } else if (state.selectedTool === 'freehand') {
      // Add to current path
      setCurrentPath(prev => [...prev, pos])
      
      // Draw current path
      ctx.strokeStyle = '#3B82F6'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.setLineDash([])
      ctx.beginPath()
      if (currentPath.length > 0) {
        ctx.moveTo(currentPath[0].x, currentPath[0].y)
        currentPath.forEach(point => ctx.lineTo(point.x, point.y))
        ctx.lineTo(pos.x, pos.y)
      }
      ctx.stroke()
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isResizing) {
      setIsResizing(false)
      setResizeHandle(null)
      setCursorStyle('default')
      return
    }
    
    if (isDragging) {
      setIsDragging(false)
      setCursorStyle('default')
      return
    }
    
    if (!isDrawing || !startPos) return
    
    const pos = getMousePos(e)
    setIsDrawing(false)

    // Clear overlay
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d')
      ctx?.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)
    }

    if (state.selectedTool === 'square') {
      onAddBlurRegion({
        type: 'square',
        x: Math.min(startPos.x, pos.x),
        y: Math.min(startPos.y, pos.y),
        width: Math.abs(pos.x - startPos.x),
        height: Math.abs(pos.y - startPos.y),
        opacity: state.blurOpacity,
        blurRadius: state.blurRadius
      })
    } else if (state.selectedTool === 'circle') {
      const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2))
      onAddBlurRegion({
        type: 'circle',
        x: startPos.x,
        y: startPos.y,
        radius,
        opacity: state.blurOpacity,
        blurRadius: state.blurRadius
      })
    } else if (state.selectedTool === 'freehand' && currentPath.length > 2) {
      onAddBlurRegion({
        type: 'freehand',
        x: 0,
        y: 0,
        points: [...currentPath, pos],
        opacity: state.blurOpacity,
        blurRadius: state.blurRadius
      })
    }

    setCurrentPath([])
    setStartPos(null)
  }

  const getCanvasCursorClass = () => {
    if (state.selectedTool === 'select') return 'cursor-pointer'
    return 'cursor-crosshair'
  }

  if (!state.image) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="border border-gray-200 rounded-lg shadow-sm"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <canvas
        ref={overlayCanvasRef}
        className="absolute top-0 left-0 pointer-events-auto"
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
          cursor: state.selectedTool === 'select' ? cursorStyle : 'crosshair'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDrawing(false)
          setIsDragging(false)
          setIsResizing(false)
          setCursorStyle('default')
        }}
      />
    </div>
  )
}