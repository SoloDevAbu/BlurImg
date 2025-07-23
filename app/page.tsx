'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import ImageUpload from '@/components/ImageUpload'
import CanvasEditor from '@/components/CanvasEditor'
import Toolbar from '@/components/Toolbar'
import { useEditor } from '@/hooks/useEditor'

export default function Home() {
  const editor = useEditor()
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  const handlePreview = () => {
    setIsPreviewMode(!isPreviewMode)
  }

  const handleExport = () => {
    if (!editor.canvasRef.current) return
    
    const canvas = editor.canvasRef.current
    const link = document.createElement('a')
    link.download = `blurred-image-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex h-[calc(100vh-80px)]">
        <div className="flex-1 flex flex-col">
          <ImageUpload 
            onImageLoad={editor.loadImage} 
            hasImage={!!editor.state.image}
          />
          
          {editor.state.image && (
            <div className="flex-1 flex items-center justify-center p-6">
              <CanvasEditor
                state={editor.state}
                onAddBlurRegion={editor.addBlurRegion}
                onSelectShape={editor.selectShape}
                onUpdateBlurRegion={editor.updateBlurRegion}
                className="max-w-full"
              />
            </div>
          )}
        </div>

        {editor.state.image && (
          <Toolbar
            state={editor.state}
            onToolChange={editor.updateTool}
            onBrushSizeChange={editor.updateBrushSize}
            onBlurOpacityChange={editor.updateBlurOpacity}
            onBlurRadiusChange={editor.updateBlurRadius}
            onUndo={editor.undo}
            onRedo={editor.redo}
            canUndo={editor.canUndo}
            canRedo={editor.canRedo}
            onPreview={handlePreview}
            onExport={handleExport}
            onDeleteSelected={editor.deleteSelectedShape}
          />
        )}
      </main>
    </div>
  )
}