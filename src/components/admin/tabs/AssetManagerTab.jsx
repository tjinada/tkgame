import { useState, useEffect, useCallback } from 'react'
import { TabPanel } from '../../ui/Tabs'
import { Select } from '../../ui/Select'
import { Button } from '../../ui/Button'
import { AssetGrid } from '../assets/AssetGrid'
import { SlideshowManager } from '../assets/SlideshowManager'
import { assetService } from '../../../services/AssetService'
import { notifyAssetChange } from '../../../hooks/useAssets'
import { Trash2, RefreshCw } from 'lucide-react'
import npcsData from '../../../data/npcs.json'
import configData from '../../../data/config.json'

export function AssetManagerTab() {
  const [selectedNpc, setSelectedNpc] = useState(npcsData.npcs[0]?.id || 'sandy')
  const [npcAssets, setNpcAssets] = useState({})
  const [slideshowImages, setSlideshowImages] = useState([])
  const [backgrounds, setBackgrounds] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  // Load assets on mount and when NPC changes
  const loadAssets = useCallback(async () => {
    setIsLoading(true)
    try {
      const newNpcAssets = {}
      
      // Load portraits for selected NPC
      for (const emotion of configData.emotionTypes) {
        try {
          const blob = await assetService.getAsset('portrait', selectedNpc, emotion)
          if (blob) {
            newNpcAssets[`portrait_${emotion}`] = URL.createObjectURL(blob)
          }
        } catch (e) {
          // Asset doesn't exist, that's OK
        }
      }
      
      // Load body parts for selected NPC
      for (const part of configData.bodyPartTypes) {
        try {
          const blob = await assetService.getAsset('bodypart', selectedNpc, part)
          if (blob) {
            newNpcAssets[`bodypart_${part}`] = URL.createObjectURL(blob)
          }
        } catch (e) {
          // Asset doesn't exist, that's OK
        }
      }
      
      setNpcAssets(newNpcAssets)

      // Load scene backgrounds
      const newBackgrounds = {}
      for (const location of configData.locations) {
        try {
          const blob = await assetService.getBackground(location)
          if (blob) {
            newBackgrounds[location] = URL.createObjectURL(blob)
          }
        } catch (e) {
          // Background doesn't exist, that's OK
        }
      }
      setBackgrounds(newBackgrounds)

      // Load slideshow images
      try {
        const slideshowAssets = await assetService.getSlideshowBackgrounds()
        setSlideshowImages(slideshowAssets.map((item) => ({
          id: item.id,
          url: URL.createObjectURL(item.blob)
        })))
      } catch (e) {
        console.error('Error loading slideshow:', e)
        setSlideshowImages([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [selectedNpc])

  useEffect(() => {
    loadAssets()
    
    // Cleanup URLs on unmount
    return () => {
      Object.values(npcAssets).forEach(url => {
        if (url) URL.revokeObjectURL(url)
      })
      Object.values(backgrounds).forEach(url => {
        if (url) URL.revokeObjectURL(url)
      })
      slideshowImages.forEach(img => {
        if (img.url) URL.revokeObjectURL(img.url)
      })
    }
  }, [selectedNpc]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePortraitUpload = async (emotion, file) => {
    console.log('Uploading portrait:', emotion, file.name)
    
    // Immediately show the uploaded file (optimistic update)
    const tempUrl = URL.createObjectURL(file)
    setNpcAssets(prev => ({
      ...prev,
      [`portrait_${emotion}`]: tempUrl
    }))
    
    // Upload to server
    await assetService.uploadAsset('portrait', selectedNpc, emotion, file)
    
    // Notify game screen to refresh
    notifyAssetChange()
  }

  const handlePortraitDelete = async (emotion) => {
    // Immediately remove from UI (optimistic update)
    setNpcAssets(prev => {
      const newAssets = { ...prev }
      if (newAssets[`portrait_${emotion}`]) {
        URL.revokeObjectURL(newAssets[`portrait_${emotion}`])
        delete newAssets[`portrait_${emotion}`]
      }
      return newAssets
    })
    
    await assetService.deleteNpcAsset('portrait', selectedNpc, emotion)
    notifyAssetChange()
  }

  const handleBodyPartUpload = async (part, file) => {
    console.log('Uploading body part:', part, file.name)
    
    // Immediately show the uploaded file (optimistic update)
    const tempUrl = URL.createObjectURL(file)
    setNpcAssets(prev => ({
      ...prev,
      [`bodypart_${part}`]: tempUrl
    }))
    
    await assetService.uploadAsset('bodypart', selectedNpc, part, file)
    notifyAssetChange()
  }

  const handleBodyPartDelete = async (part) => {
    // Immediately remove from UI (optimistic update)
    setNpcAssets(prev => {
      const newAssets = { ...prev }
      if (newAssets[`bodypart_${part}`]) {
        URL.revokeObjectURL(newAssets[`bodypart_${part}`])
        delete newAssets[`bodypart_${part}`]
      }
      return newAssets
    })
    
    await assetService.deleteNpcAsset('bodypart', selectedNpc, part)
    notifyAssetChange()
  }

  const handleBackgroundUpload = async (location, file) => {
    console.log('Uploading background:', location, file.name)
    
    // Immediately show the uploaded file (optimistic update)
    const tempUrl = URL.createObjectURL(file)
    setBackgrounds(prev => ({
      ...prev,
      [location]: tempUrl
    }))
    
    await assetService.uploadBackground(location, file)
    notifyAssetChange()
  }

  const handleBackgroundDelete = async (location) => {
    // Immediately remove from UI (optimistic update)
    setBackgrounds(prev => {
      const newBackgrounds = { ...prev }
      if (newBackgrounds[location]) {
        URL.revokeObjectURL(newBackgrounds[location])
        delete newBackgrounds[location]
      }
      return newBackgrounds
    })
    
    await assetService.deleteBackgroundAsset(location)
    notifyAssetChange()
  }

  const handleSlideshowAdd = async (file) => {
    console.log('Adding slideshow image:', file.name)
    
    // Immediately show the uploaded file (optimistic update)
    const tempId = `temp_${Date.now()}`
    const tempUrl = URL.createObjectURL(file)
    setSlideshowImages(prev => [...prev, { id: tempId, url: tempUrl }])
    
    // Upload and get real ID
    const result = await assetService.uploadSlideshowBackground(`slide_${Date.now()}`, file)
    
    // Update with real ID
    setSlideshowImages(prev => prev.map(img => 
      img.id === tempId ? { ...img, id: result.id } : img
    ))
    
    notifyAssetChange()
  }

  const handleSlideshowRemove = async (index) => {
    const image = slideshowImages[index]
    
    // Immediately remove from UI
    setSlideshowImages(prev => {
      const newImages = [...prev]
      if (newImages[index]?.url) {
        URL.revokeObjectURL(newImages[index].url)
      }
      newImages.splice(index, 1)
      return newImages
    })
    
    if (image?.id && !image.id.startsWith('temp_')) {
      await assetService.deleteAsset(image.id)
    }
    
    notifyAssetChange()
  }

  const handleSlideshowReorder = (fromIndex, toIndex) => {
    const newImages = [...slideshowImages]
    const [moved] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, moved)
    setSlideshowImages(newImages)
  }

  const handleClearNpcAssets = async () => {
    if (confirm(`Clear all assets for ${selectedNpc}?`)) {
      // Clear UI immediately
      setNpcAssets({})
      await assetService.clearNpcAssets(selectedNpc)
      notifyAssetChange()
    }
  }

  const handleClearAllAssets = async () => {
    if (confirm('Clear ALL assets? This cannot be undone.')) {
      // Clear UI immediately
      setNpcAssets({})
      setBackgrounds({})
      setSlideshowImages([])
      await assetService.clearAllAssets()
      notifyAssetChange()
    }
  }

  // Build portrait items
  const portraitItems = configData.emotionTypes.map(emotion => ({
    id: emotion,
    label: emotion.charAt(0).toUpperCase() + emotion.slice(1),
    url: npcAssets[`portrait_${emotion}`] || null,
  }))

  // Build body part items
  const bodyPartItems = configData.bodyPartTypes.map(part => ({
    id: part,
    label: part.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    url: npcAssets[`bodypart_${part}`] || null,
  }))

  // Build background items
  const backgroundItems = configData.locations.map(location => ({
    id: location,
    label: location.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    url: backgrounds[location] || null,
  }))

  const npcOptions = npcsData.npcs.map(npc => ({
    value: npc.id,
    label: `${npc.name} - ${npc.title}`,
  }))

  return (
    <TabPanel>
      <div className="space-y-8">
        
        {/* Global Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={loadAssets}
              disabled={isLoading}
            >
              <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {isLoading && <span className="text-sm text-text-muted">Loading assets...</span>}
          </div>
          <Button variant="danger" onClick={handleClearAllAssets}>
            <Trash2 size={16} className="mr-2" />
            Clear All Assets
          </Button>
        </div>

        {/* NPC Assets Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-text-primary">NPC Assets</h3>
            <div className="flex items-center gap-3">
              <Select
                value={selectedNpc}
                onChange={(e) => setSelectedNpc(e.target.value)}
                options={npcOptions}
                className="w-64"
              />
              <Button variant="ghost" size="sm" onClick={handleClearNpcAssets}>
                <Trash2 size={14} className="mr-1" /> Clear NPC
              </Button>
            </div>
          </div>

          {/* Portraits */}
          <div className="p-4 bg-background-tertiary/50 rounded-lg space-y-4">
            <h4 className="font-medium text-text-secondary">Portraits (Emotions)</h4>
            <AssetGrid
              items={portraitItems}
              columns={6}
              onUpload={handlePortraitUpload}
              onDelete={handlePortraitDelete}
            />
          </div>

          {/* Body Parts */}
          <div className="p-4 bg-background-tertiary/50 rounded-lg space-y-4">
            <h4 className="font-medium text-text-secondary">Body Parts</h4>
            <AssetGrid
              items={bodyPartItems}
              columns={4}
              onUpload={handleBodyPartUpload}
              onDelete={handleBodyPartDelete}
            />
          </div>
        </section>

        {/* Scene Backgrounds */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Scene Backgrounds</h3>
          <div className="p-4 bg-background-tertiary/50 rounded-lg">
            <AssetGrid
              items={backgroundItems}
              columns={4}
              onUpload={handleBackgroundUpload}
              onDelete={handleBackgroundDelete}
            />
          </div>
        </section>

        {/* Slideshow Backgrounds */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Slideshow Backgrounds</h3>
          <div className="p-4 bg-background-tertiary/50 rounded-lg">
            <SlideshowManager
              images={slideshowImages}
              onAdd={handleSlideshowAdd}
              onRemove={handleSlideshowRemove}
              onReorder={handleSlideshowReorder}
              onPreview={() => {
                console.log('Preview slideshow')
              }}
            />
          </div>
        </section>

      </div>
    </TabPanel>
  )
}

export default AssetManagerTab
