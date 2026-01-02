import { useState, useRef } from 'react'
import { Plus, X, GripVertical, Play, Pause, Trash2 } from 'lucide-react'
import { Button } from '../../ui/Button'

export function SlideshowManager({ 
  images = [], 
  onAdd, 
  onRemove, 
  onReorder,
  onPreview,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragIndex, setDragIndex] = useState(null)
  const inputRef = useRef(null)

  const handleDragStart = (index) => {
    setDragIndex(index)
    setIsDragging(true)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== index) {
      onReorder?.(dragIndex, index)
      setDragIndex(index)
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setDragIndex(null)
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    for (const file of files) {
      await onAdd?.(file)
    }
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div 
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-background-elevated rounded-lg p-8 text-center cursor-pointer hover:border-text-muted transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Plus size={32} className="mx-auto mb-2 text-text-muted" />
        <p className="text-text-muted">Click to add slideshow backgrounds</p>
        <p className="text-xs text-text-muted/60 mt-1">Supports multiple files</p>
      </div>

      {/* Image list */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">{images.length} image(s)</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onPreview}>
                <Play size={14} className="mr-1" /> Preview
              </Button>
              <Button variant="ghost" size="sm" onClick={() => images.forEach((_, i) => onRemove(i))}>
                <Trash2 size={14} className="mr-1" /> Clear All
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {images.map((image, index) => (
              <div
                key={image.id || index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  relative group aspect-video rounded-lg overflow-hidden border
                  ${dragIndex === index ? 'border-accent-primary opacity-50' : 'border-background-elevated'}
                  cursor-grab active:cursor-grabbing
                `}
              >
                <img 
                  src={image.url} 
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Order badge */}
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white">
                  {index + 1}
                </div>

                {/* Hover controls */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => onRemove(index)}
                    className="p-1.5 bg-accent-danger rounded hover:bg-accent-danger/80 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Drag handle */}
                <div className="absolute top-1 right-1 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && (
        <p className="text-center text-text-muted/60 text-sm py-4">
          No slideshow images added yet
        </p>
      )}
    </div>
  )
}

export default SlideshowManager
