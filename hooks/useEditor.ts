'use client'

import { useState, useCallback, useRef } from 'react'
import { EditorState, BlurRegion } from '@/types'

export const useEditor = () => {
  const [state, setState] = useState<EditorState>({
    image: null,
    blurRegions: [],
    shapes: [], // Only BlurShape[]
    selectedTool: 'select',
    selectedShapeId: null,
    brushSize: 50,
    blurOpacity: 0.8,
    blurRadius: 10,
    history: [[]], // Only BlurRegion[][]
    historyIndex: 0
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)

  const addToHistory = useCallback((regions: BlurRegion[]) => {
    setState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1)
      newHistory.push([...regions]) // Remove 'as any', ensure BlurRegion[]
      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1
      }
    })
  }, [])

  const loadImage = useCallback((file: File) => {
    const img = new Image()
    img.onload = () => {
      setState(prev => ({
        ...prev,
        image: img,
        blurRegions: [],
        selectedShapeId: null,
        history: [[]],
        historyIndex: 0
      }))
    }
    img.src = URL.createObjectURL(file)
  }, [])

  const addBlurRegion = useCallback((region: Omit<BlurRegion, 'id'>) => {
    const newRegion: BlurRegion = {
      ...region,
      id: Math.random().toString(36).substr(2, 9)
    }
    
    setState(prev => {
      const newRegions = [...prev.blurRegions, newRegion]
      addToHistory(newRegions)
      return {
        ...prev,
        blurRegions: newRegions,
        selectedShapeId: newRegion.id
      }
    })
  }, [addToHistory])

  const updateBlurRegion = useCallback((id: string, updates: Partial<BlurRegion>) => {
    setState(prev => {
      const newRegions = prev.blurRegions.map(region =>
        region.id === id ? { ...region, ...updates } : region
      )
      addToHistory(newRegions)
      return {
        ...prev,
        blurRegions: newRegions
      }
    })
  }, [addToHistory])

  const selectShape = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedShapeId: id }))
  }, [])

  const deleteSelectedShape = useCallback(() => {
    setState(prev => {
      if (!prev.selectedShapeId) return prev
      
      const newRegions = prev.blurRegions.filter(region => region.id !== prev.selectedShapeId)
      addToHistory(newRegions)
      return {
        ...prev,
        blurRegions: newRegions,
        selectedShapeId: null
      }
    })
  }, [addToHistory])
  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1
        return {
          ...prev,
          blurRegions: [...prev.history[newIndex]], // Only BlurRegion[]
          historyIndex: newIndex,
          selectedShapeId: null
        }
      }
      return prev
    })
  }, [])

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1
        return {
          ...prev,
          blurRegions: [...prev.history[newIndex]], // Only BlurRegion[]
          historyIndex: newIndex,
          selectedShapeId: null
        }
      }
      return prev
    })
  }, [])

  const updateTool = useCallback((tool: EditorState['selectedTool']) => {
    setState(prev => ({ 
      ...prev, 
      selectedTool: tool,
      selectedShapeId: tool === 'select' ? prev.selectedShapeId : null
    }))
  }, [])

  const updateBrushSize = useCallback((size: number) => {
    setState(prev => ({ ...prev, brushSize: size }))
  }, [])

  const updateBlurOpacity = useCallback((opacity: number) => {
    setState(prev => {
      const newState = { ...prev, blurOpacity: opacity }
      
      // Update selected shape if any
      if (prev.selectedShapeId) {
        const newRegions = prev.blurRegions.map(region =>
          region.id === prev.selectedShapeId ? { ...region, opacity } : region
        )
        return { ...newState, blurRegions: newRegions }
      }
      
      return newState
    })
  }, [])

  const updateBlurRadius = useCallback((radius: number) => {
    setState(prev => {
      const newState = { ...prev, blurRadius: radius }
      
      // Update selected shape if any
      if (prev.selectedShapeId) {
        const newRegions = prev.blurRegions.map(region =>
          region.id === prev.selectedShapeId ? { ...region, blurRadius: radius } : region
        )
        return { ...newState, blurRegions: newRegions }
      }
      
      return newState
    })
  }, [])

  const canUndo = state.historyIndex > 0
  const canRedo = state.historyIndex < state.history.length - 1

  return {
    state,
    canvasRef,
    contextRef,
    loadImage,
    addBlurRegion,
    updateBlurRegion,
    selectShape,
    deleteSelectedShape,
    undo,
    redo,
    updateTool,
    updateBrushSize,
    updateBlurOpacity,
    updateBlurRadius,
    canUndo,
    canRedo
  }
}