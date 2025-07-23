'use client'

import { useCallback } from 'react'
import { Upload, Image as ImageIcon } from 'lucide-react'

interface ImageUploadProps {
  onImageLoad: (file: File) => void
  hasImage: boolean
}

export default function ImageUpload({ onImageLoad, hasImage }: ImageUploadProps) {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    if (imageFile) {
      onImageLoad(imageFile)
    }
  }, [onImageLoad])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      onImageLoad(file)
    }
  }, [onImageLoad])

  if (hasImage) return null

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="w-full max-w-2xl border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center hover:border-blue-400 transition-colors duration-200 cursor-pointer group"
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="sr-only"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="cursor-pointer block">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
              <ImageIcon className="w-8 h-8 text-blue-600" />
              <Upload className="w-4 h-4 text-blue-600 ml-1 -mt-1" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-700">
                Upload Your Image
              </h3>
              <p className="text-gray-500">
                Drag and drop an image or click to browse
              </p>
              <p className="text-sm text-gray-400">
                Supports JPG, PNG, WEBP up to 10MB
              </p>
            </div>
          </div>
        </label>
      </div>
    </div>
  )
}