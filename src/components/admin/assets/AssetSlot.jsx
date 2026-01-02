import { useState, useRef } from 'react'
import { X, Check, Image } from 'lucide-react'

export function AssetSlot({ 
  label, 
  asset, 
  onUpload, 
  onDelete,
  accept = 'image/*',
  placeholder = null,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      await handleFile(file)
    }
  }

  const handleFileSelect = async (e) => {
    e.stopPropagation()
    const file = e.target.files[0]
    if (file) {
      await handleFile(file)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleFile = async (file) => {
    setIsUploading(true)
    try {
      await onUpload(file)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    inputRef.current?.click()
  }

  const handleDelete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete?.()
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative w-full aspect-[3/4] rounded-lg border-2 border-dashed cursor-pointer
          transition-all overflow-hidden
          ${isDragging 
            ? 'border-accent-primary bg-accent-primary/10' 
            : asset 
              ? 'border-accent-success/50 bg-background-tertiary' 
              : 'border-background-elevated hover:border-text-muted bg-background-tertiary/50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          onClick={(e) => e.stopPropagation()}
          className="hidden"
        />

        {isUploading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
          </div>
        ) : asset ? (
          <>
            <img 
              src={asset} 
              alt={label} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={handleDelete}
                className="p-2 bg-accent-danger rounded-lg hover:bg-accent-danger/80 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="absolute top-2 right-2 p-1 bg-accent-success rounded-full">
              <Check size={12} />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted p-4">
            {placeholder ? (
              <img src={placeholder} alt="Placeholder" className="w-full h-full object-contain opacity-30" />
            ) : (
              <>
                <Image size={32} className="mb-2 opacity-50" />
                <span className="text-xs text-center">Click or drag</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AssetSlot
