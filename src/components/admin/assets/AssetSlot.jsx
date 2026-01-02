import { useState, useRef } from 'react'
import { X, Check, Image, ChevronDown, ChevronUp, Plus } from 'lucide-react'

/**
 * Asset slot component that supports multiple images
 * - Collapsed: Shows first image with count indicator
 * - Expanded: Shows all images in a grid with add/remove functionality
 */
export function AssetSlot({ 
  label, 
  assets = [],  // Array of { id, url } objects
  onUpload, 
  onDelete,
  accept = 'image/*',
  placeholder = null,
  allowMultiple = false,  // For body parts and backgrounds
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef(null)

  // Normalize assets to array format
  const assetList = Array.isArray(assets) ? assets : (assets ? [assets] : [])
  const hasAssets = assetList.length > 0
  const firstAsset = assetList[0]
  const assetCount = assetList.length

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
    
    // If we have assets and allow multiple, toggle expand
    if (hasAssets && allowMultiple) {
      setIsExpanded(!isExpanded)
    } else {
      inputRef.current?.click()
    }
  }

  const handleAddClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    inputRef.current?.click()
  }

  const handleDelete = (e, assetId = null) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete?.(assetId)
  }

  // Collapsed view (default)
  if (!isExpanded) {
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
              : hasAssets 
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
          ) : hasAssets && firstAsset?.url ? (
            <>
              <img 
                src={firstAsset.url} 
                alt={label} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {allowMultiple ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(true) }}
                    className="p-2 bg-accent-primary rounded-lg hover:bg-accent-primary/80 transition-colors"
                    title="Expand to manage images"
                  >
                    <ChevronDown size={18} />
                  </button>
                ) : (
                  <button
                    onClick={(e) => handleDelete(e, firstAsset.id)}
                    className="p-2 bg-accent-danger rounded-lg hover:bg-accent-danger/80 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              {/* Asset count badge */}
              <div className="absolute top-2 right-2 flex items-center gap-1">
                {assetCount > 1 && (
                  <div className="px-2 py-0.5 bg-accent-primary/80 rounded-full text-xs font-medium">
                    {assetCount} imgs
                  </div>
                )}
                <div className="p-1 bg-accent-success rounded-full">
                  <Check size={12} />
                </div>
              </div>
              {/* Expand indicator for multiple */}
              {allowMultiple && assetCount > 0 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                  <div className="px-2 py-1 bg-background-primary/80 rounded text-xs flex items-center gap-1">
                    <ChevronDown size={12} />
                    <span>Click to expand</span>
                  </div>
                </div>
              )}
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

  // Expanded view (for multiple images)
  return (
    <div className="space-y-2 col-span-full">
      <div className="p-4 bg-background-elevated rounded-lg border border-accent-primary/30">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-text-primary capitalize">
            {label}
          </label>
          <button
            onClick={() => setIsExpanded(false)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            <ChevronUp size={14} />
            Close
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {/* Existing images */}
          {assetList.map((asset, index) => (
            <div 
              key={asset.id || index}
              className="relative aspect-square rounded-lg overflow-hidden bg-background-tertiary group"
            >
              <img 
                src={asset.url} 
                alt={`${label} ${index + 1}`} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={(e) => handleDelete(e, asset.id)}
                  className="p-2 bg-accent-danger rounded-lg hover:bg-accent-danger/80 transition-colors"
                  title="Delete this image"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-background-primary/80 rounded text-xs">
                #{index + 1}
              </div>
            </div>
          ))}

          {/* Add new image button */}
          <div
            onClick={handleAddClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative aspect-square rounded-lg border-2 border-dashed cursor-pointer
              transition-all flex items-center justify-center
              ${isDragging 
                ? 'border-accent-primary bg-accent-primary/10' 
                : 'border-background-tertiary hover:border-text-muted bg-background-tertiary/30'
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
              <div className="w-6 h-6 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
            ) : (
              <div className="flex flex-col items-center text-text-muted">
                <Plus size={24} className="mb-1" />
                <span className="text-xs">Add</span>
              </div>
            )}
          </div>
        </div>

        {assetList.length === 0 && (
          <p className="text-xs text-text-muted mt-2 text-center">
            No images uploaded. Click "Add" to upload.
          </p>
        )}
      </div>
    </div>
  )
}

export default AssetSlot
