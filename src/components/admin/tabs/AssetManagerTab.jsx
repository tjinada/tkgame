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
  const [npcAssets, setNpcAssets] = useState({ portraits: {}, bodyparts: {} })
  const [slideshowImages, setSlideshowImages] = useState([])
  const [backgrounds, setBackgrounds] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  // Load assets on mount and when NPC changes
  const loadAssets = useCallback(async () => {
    setIsLoading(true)
    try {
      const newPortraits = {}
      const newBodyParts = {}
      
      // Load portraits for selected NPC (single image each)
      for (const emotion of configData.emotionTypes) {
        try {
          const blob = await assetService.getAsset('portrait', selectedNpc, emotion)
          if (blob) {
            const result = await assetService.getNpcAssetUrl('portrait', selectedNpc, emotion)
            if (result) {
              newPortraits[emotion] = [{ id: `portrait_${emotion}`, url: result }]
            }
          }
        } catch (e) {
          // Asset doesn't exist
        }
      }
      
      // Load body parts for selected NPC (multiple images allowed)
      for (const part of configData.bodyPartTypes) {
        try {
          const assets = await assetService.getAllNpcAssetUrls('bodypart', selectedNpc, part)
          if (assets.length > 0) {
            newBodyParts[part] = assets
          }
        } catch (e) {
          // Asset doesn't exist
        }
      }
      
      setNpcAssets({ portraits: newPortraits, bodyparts: newBodyParts })

      // Load scene backgrounds (multiple images per location)
      const newBackgrounds = {}
      for (const location of configData.locations) {
        try {
          const assets = await assetService.getAllBackgroundUrls(location)
          if (assets.length > 0) {
            newBackgrounds[location] = assets
          }
        } catch (e) {
          // Background doesn't exist
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
  }, [selectedNpc, loadAssets])

  // Portrait upload (replaces existing)
  const handlePortraitUpload = async (emotion, file) => {
    console.log('Uploading portrait:', emotion, file.name)
    
    // Optimistic update
    const tempUrl = URL.createObjectURL(file)
    setNpcAssets(prev => ({
      ...prev,
      portraits: {
        ...prev.portraits,
        [emotion]: [{ id: `temp_${Date.now()}`, url: tempUrl }]
      }
    }))
    
    // Upload (replaces existing for portraits)
    await assetService.uploadAsset('portrait', selectedNpc, emotion, file, true)
    notifyAssetChange()
    
    // Reload to get correct asset ID
    loadAssets()
  }

  // Portrait delete
  const handlePortraitDelete = async (emotion, assetId) => {
    setNpcAssets(prev => ({
      ...prev,
      portraits: {
        ...prev.portraits,
        [emotion]: []
      }
    }))
    
    await assetService.deleteNpcAsset('portrait', selectedNpc, emotion)
    notifyAssetChange()
  }

  // Body part upload (adds to existing)
  const handleBodyPartUpload = async (part, file) => {
    console.log('Uploading body part:', part, file.name)
    
    // Optimistic update - add to existing
    const tempUrl = URL.createObjectURL(file)
    setNpcAssets(prev => ({
      ...prev,
      bodyparts: {
        ...prev.bodyparts,
        [part]: [...(prev.bodyparts[part] || []), { id: `temp_${Date.now()}`, url: tempUrl }]
      }
    }))
    
    // Upload (does NOT replace existing for body parts)
    await assetService.uploadAsset('bodypart', selectedNpc, part, file, false)
    notifyAssetChange()
    
    // Reload to get correct asset IDs
    loadAssets()
  }

  // Body part delete (specific image)
  const handleBodyPartDelete = async (part, assetId) => {
    if (!assetId) {
      // Delete all for this part
      const partAssets = npcAssets.bodyparts[part] || []
      setNpcAssets(prev => ({
        ...prev,
        bodyparts: {
          ...prev.bodyparts,
          [part]: []
        }
      }))
      for (const asset of partAssets) {
        if (asset.id && !asset.id.startsWith('temp_')) {
          await assetService.deleteAsset(asset.id)
        }
      }
    } else {
      // Delete specific image
      setNpcAssets(prev => ({
        ...prev,
        bodyparts: {
          ...prev.bodyparts,
          [part]: (prev.bodyparts[part] || []).filter(a => a.id !== assetId)
        }
      }))
      if (!assetId.startsWith('temp_')) {
        await assetService.deleteAsset(assetId)
      }
    }
    notifyAssetChange()
  }

  // Background upload (adds to existing)
  const handleBackgroundUpload = async (location, file) => {
    console.log('Uploading background:', location, file.name)
    
    // Optimistic update - add to existing
    const tempUrl = URL.createObjectURL(file)
    setBackgrounds(prev => ({
      ...prev,
      [location]: [...(prev[location] || []), { id: `temp_${Date.now()}`, url: tempUrl }]
    }))
    
    // Upload
    await assetService.uploadBackground(location, file)
    notifyAssetChange()
    
    // Reload to get correct asset IDs
    loadAssets()
  }

  // Background delete (specific image)
  const handleBackgroundDelete = async (location, assetId) => {
    if (!assetId) {
      // Delete all for this location
      const locationAssets = backgrounds[location] || []
      setBackgrounds(prev => ({
        ...prev,
        [location]: []
      }))
      for (const asset of locationAssets) {
        if (asset.id && !asset.id.startsWith('temp_')) {
          await assetService.deleteAsset(asset.id)
        }
      }
    } else {
      // Delete specific image
      setBackgrounds(prev => ({
        ...prev,
        [location]: (prev[location] || []).filter(a => a.id !== assetId)
      }))
      if (!assetId.startsWith('temp_')) {
        await assetService.deleteAsset(assetId)
      }
    }
    notifyAssetChange()
  }

  const handleSlideshowAdd = async (file) => {
    console.log('Adding slideshow image:', file.name)
    
    const tempId = `temp_${Date.now()}`
    const tempUrl = URL.createObjectURL(file)
    setSlideshowImages(prev => [...prev, { id: tempId, url: tempUrl }])
    
    const result = await assetService.uploadSlideshowBackground(`slide_${Date.now()}`, file)
    
    setSlideshowImages(prev => prev.map(img => 
      img.id === tempId ? { ...img, id: result.id } : img
    ))
    
    notifyAssetChange()
  }

  const handleSlideshowRemove = async (index) => {
    const image = slideshowImages[index]
    
    setSlideshowImages(prev => {
      const newImages = [...prev]
      if (newImages[index]?.url?.startsWith('blob:')) {
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
      setNpcAssets({ portraits: {}, bodyparts: {} })
      await assetService.clearNpcAssets(selectedNpc)
      notifyAssetChange()
    }
  }

  const handleClearAllAssets = async () => {
    if (confirm('Clear ALL assets? This cannot be undone.')) {
      setNpcAssets({ portraits: {}, bodyparts: {} })
      setBackgrounds({})
      setSlideshowImages([])
      await assetService.clearAllAssets()
      notifyAssetChange()
    }
  }

  // Build portrait items (single image mode)
  const portraitItems = configData.emotionTypes.map(emotion => ({
    id: emotion,
    label: emotion.charAt(0).toUpperCase() + emotion.slice(1),
    assets: npcAssets.portraits[emotion] || [],
  }))

  // Build body part items (multiple image mode)
  const bodyPartItems = configData.bodyPartTypes.map(part => ({
    id: part,
    label: part.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    assets: npcAssets.bodyparts[part] || [],
  }))

  // Build background items (multiple image mode)
  const backgroundItems = configData.locations.map(location => ({
    id: location,
    label: location.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    assets: backgrounds[location] || [],
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

          {/* Portraits (single image mode) */}
          <div className="p-4 bg-background-tertiary/50 rounded-lg space-y-4">
            <h4 className="font-medium text-text-secondary">Portraits (Emotions)</h4>
            <p className="text-xs text-text-muted">Single image per emotion. Uploading replaces existing.</p>
            <AssetGrid
              items={portraitItems}
              columns={6}
              onUpload={handlePortraitUpload}
              onDelete={handlePortraitDelete}
              allowMultiple={false}
            />
          </div>

          {/* Body Parts (multiple image mode) */}
          <div className="p-4 bg-background-tertiary/50 rounded-lg space-y-4">
            <h4 className="font-medium text-text-secondary">Body Parts</h4>
            <p className="text-xs text-text-muted">
              Multiple images allowed per body part. Click slot to expand and manage images.
              Images cycle as slideshow (10 sec each) during gameplay.
            </p>
            <AssetGrid
              items={bodyPartItems}
              columns={4}
              onUpload={handleBodyPartUpload}
              onDelete={handleBodyPartDelete}
              allowMultiple={true}
            />
          </div>
        </section>

        {/* Scene Backgrounds */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Scene Backgrounds</h3>
          <div className="p-4 bg-background-tertiary/50 rounded-lg space-y-4">
            <p className="text-xs text-text-muted">
              Multiple images allowed per location. Images cycle as slideshow (10 sec each) when location is active.
            </p>
            <AssetGrid
              items={backgroundItems}
              columns={4}
              onUpload={handleBackgroundUpload}
              onDelete={handleBackgroundDelete}
              allowMultiple={true}
            />
          </div>
        </section>

        {/* Global Slideshow Backgrounds (fallback) */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Global Slideshow (Fallback)</h3>
          <div className="p-4 bg-background-tertiary/50 rounded-lg">
            <p className="text-xs text-text-muted mb-4">
              Used when no location-specific backgrounds are available.
            </p>
            <SlideshowManager
              images={slideshowImages}
              onAdd={handleSlideshowAdd}
              onRemove={handleSlideshowRemove}
              onReorder={handleSlideshowReorder}
              onPreview={() => console.log('Preview slideshow')}
            />
          </div>
        </section>

      </div>
    </TabPanel>
  )
}

export default AssetManagerTab
