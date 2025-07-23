'use client'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Square, Circle, PenTool, Undo, Redo, Eye, Download, MousePointer, Trash2 } from 'lucide-react'
import { EditorState } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'

interface ToolbarProps {
  state: EditorState
  onToolChange: (tool: EditorState['selectedTool']) => void
  onBrushSizeChange: (size: number) => void
  onBlurOpacityChange: (opacity: number) => void
  onBlurRadiusChange: (radius: number) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onPreview: () => void
  onExport: () => void
  onDeleteSelected?: () => void
}

export default function Toolbar({
  state,
  onToolChange,
  onBrushSizeChange,
  onBlurOpacityChange,
  onBlurRadiusChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onPreview,
  onExport,
  onDeleteSelected
}: ToolbarProps) {
  const { isAuthenticated, signInWithGoogle } = useAuth()
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)

  const handleExport = () => {
    if (isAuthenticated) {
      onExport()
    } else {
      setShowAuthPrompt(true)
    }
  }

  const tools = [
    { id: 'select' as const, icon: MousePointer, label: 'Select' },
    { id: 'square' as const, icon: Square, label: 'Square' },
    { id: 'circle' as const, icon: Circle, label: 'Circle' },
    { id: 'freehand' as const, icon: PenTool, label: 'Freehand' }
  ]

  // Get current values from selected shape or default values
  const selectedRegion = state.selectedShapeId 
    ? state.blurRegions.find(r => r.id === state.selectedShapeId)
    : null
  
  const currentOpacity = selectedRegion ? selectedRegion.opacity : state.blurOpacity
  const currentBlurRadius = selectedRegion ? selectedRegion.blurRadius : state.blurRadius

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6 space-y-8">
      {/* Undo/Redo */}
      <div className="flex justify-center space-x-2">
        <Button
          onClick={onUndo}
          disabled={!canUndo}
          variant="outline"
          size="sm"
          className="p-2"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          onClick={onRedo}
          disabled={!canRedo}
          variant="outline"
          size="sm"
          className="p-2"
        >
          <Redo className="w-4 h-4" />
        </Button>
        {state.selectedShapeId && onDeleteSelected && (
          <Button
            onClick={onDeleteSelected}
            variant="outline"
            size="sm"
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Separator />

      {/* Tool Selection */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-700">
          {state.selectedShapeId ? 'Edit Selected Shape' : 'Select Tool'}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {tools.map(({ id, icon: Icon, label }) => (
            <Button
              key={id}
              onClick={() => onToolChange(id)}
              variant={state.selectedTool === id ? 'default' : 'outline'}
              className="h-12 flex flex-col items-center justify-center space-y-1 text-xs"
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Size Control */}
      {state.selectedTool !== 'select' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="font-medium text-gray-700">Size</label>
            <span className="text-sm text-gray-500">{state.brushSize}px</span>
          </div>
          <Slider
            value={[state.brushSize]}
            onValueChange={([value]) => onBrushSizeChange(value)}
            min={10}
            max={200}
            step={5}
            className="w-full"
          />
        </div>
      )}

      {state.selectedTool !== 'select' && <Separator />}

      {/* Blur Opacity */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="font-medium text-gray-700">Blur Opacity</label>
          <span className="text-sm text-gray-500">{Math.round(currentOpacity * 100)}%</span>
        </div>
        <Slider
          value={[currentOpacity]}
          onValueChange={([value]) => onBlurOpacityChange(value)}
          min={0.1}
          max={1}
          step={0.1}
          className="w-full"
        />
      </div>

      <Separator />

      {/* Blur Radius */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="font-medium text-gray-700">Blur Intensity</label>
          <span className="text-sm text-gray-500">{currentBlurRadius}px</span>
        </div>
        <Slider
          value={[currentBlurRadius]}
          onValueChange={([value]) => onBlurRadiusChange(value)}
          min={1}
          max={30}
          step={1}
          className="w-full"
        />
      </div>

      <Separator />

      {/* Selected Shape Info */}
      {state.selectedShapeId && (
        <div className="space-y-2 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 text-sm">Selected Shape</h4>
          <p className="text-blue-700 text-xs">
            {selectedRegion?.type.charAt(0).toUpperCase() + selectedRegion?.type.slice(1)} blur region
          </p>
          <p className="text-blue-600 text-xs">
            Adjust opacity and intensity above
          </p>
        </div>
      )}

      {state.selectedShapeId && <Separator />}

      {/* Shape List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-700">Blur Regions ({state.blurRegions.length})</h3>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {state.blurRegions.map((region, index) => (
            <button
              key={region.id}
              onClick={() => onToolChange('select')}
              className={`w-full text-left p-2 rounded text-sm transition-colors ${
                state.selectedShapeId === region.id
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="capitalize">{region.type} {index + 1}</span>
                <span className="text-xs opacity-75">
                  {Math.round(region.opacity * 100)}% • {region.blurRadius}px
                </span>
              </div>
            </button>
          ))}
          {state.blurRegions.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">
              No blur regions yet
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Preview and Export */}
      <div className="space-y-3 pt-4">
        <Button
          onClick={onPreview}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
        
        <Button
          onClick={handleExport}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>

        {!isAuthenticated && (
          <p className="text-xs text-gray-500 text-center">
            Sign in to export your edited images
          </p>
        )}
      </div>

      {/* Auth Prompt Modal */}
      {showAuthPrompt && !isAuthenticated && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-4">
            <h3 className="font-semibold text-lg mb-2">Sign in Required</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Please sign in with Google to export your edited images.
            </p>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowAuthPrompt(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  signInWithGoogle()
                  setShowAuthPrompt(false)
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}