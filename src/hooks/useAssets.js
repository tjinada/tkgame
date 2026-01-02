import { useState, useEffect, useCallback, useRef } from 'react'
import { assetService } from '../services/AssetService'

// Global event emitter for asset changes
const assetChangeListeners = new Set()

export function notifyAssetChange() {
  assetChangeListeners.forEach(listener => listener())
}

export function subscribeToAssetChanges(callback) {
  assetChangeListeners.add(callback)
  return () => assetChangeListeners.delete(callback)
}

export function useAssets() {
  const [isLoading, setIsLoading] = useState(false)
  const [manifest, setManifest] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const urlCacheRef = useRef(new Map())

  // Load manifest on mount
  useEffect(() => {
    loadManifest()
  }, [])

  // Listen for asset changes from other components (e.g., admin panel)
  useEffect(() => {
    const handleAssetChange = () => {
      clearCache()
      loadManifest()
      setRefreshTrigger(prev => prev + 1)
    }
    
    assetChangeListeners.add(handleAssetChange)
    return () => assetChangeListeners.delete(handleAssetChange)
  }, [])

  const loadManifest = useCallback(async () => {
    const m = await assetService.getManifest()
    setManifest(m)
  }, [])

  /**
   * Get URL for an NPC portrait (first one)
   */
  const getPortraitUrl = useCallback(async (npcId, emotion = 'neutral') => {
    const cacheKey = `portrait-${npcId}-${emotion}`
    
    if (urlCacheRef.current.has(cacheKey)) {
      return urlCacheRef.current.get(cacheKey)
    }

    const url = await assetService.getNpcAssetUrl('portrait', npcId, emotion)
    
    if (url) {
      urlCacheRef.current.set(cacheKey, url)
    }
    return url
  }, [refreshTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Get URL for an NPC body part (first one)
   */
  const getBodyPartUrl = useCallback(async (npcId, bodyPart) => {
    const cacheKey = `bodypart-${npcId}-${bodyPart}`
    
    if (urlCacheRef.current.has(cacheKey)) {
      return urlCacheRef.current.get(cacheKey)
    }

    const url = await assetService.getNpcAssetUrl('bodypart', npcId, bodyPart)
    
    if (url) {
      urlCacheRef.current.set(cacheKey, url)
    }
    return url
  }, [refreshTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Get ALL URLs for an NPC body part (for slideshow)
   */
  const getAllBodyPartUrls = useCallback(async (npcId, bodyPart) => {
    const cacheKey = `bodypart-${npcId}-${bodyPart}-all`
    
    if (urlCacheRef.current.has(cacheKey)) {
      return urlCacheRef.current.get(cacheKey)
    }

    const urls = await assetService.getAllNpcAssetUrls('bodypart', npcId, bodyPart)
    
    if (urls.length > 0) {
      urlCacheRef.current.set(cacheKey, urls)
    }
    return urls
  }, [refreshTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Get URL for a background (first one)
   */
  const getBackgroundUrl = useCallback(async (location) => {
    const cacheKey = `background-${location}`
    
    if (urlCacheRef.current.has(cacheKey)) {
      return urlCacheRef.current.get(cacheKey)
    }

    const url = await assetService.getBackgroundUrl(location)
    
    if (url) {
      urlCacheRef.current.set(cacheKey, url)
    }
    return url
  }, [refreshTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Get ALL URLs for a background (for slideshow)
   */
  const getAllBackgroundUrls = useCallback(async (location) => {
    const cacheKey = `background-${location}-all`
    
    if (urlCacheRef.current.has(cacheKey)) {
      return urlCacheRef.current.get(cacheKey)
    }

    const urls = await assetService.getAllBackgroundUrls(location)
    
    if (urls.length > 0) {
      urlCacheRef.current.set(cacheKey, urls)
    }
    return urls
  }, [refreshTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Check if an asset exists
   */
  const hasAsset = useCallback((category, npcId, assetType) => {
    if (!manifest) return false
    
    if (category === 'background') {
      const bgAssets = manifest.backgrounds?.[npcId]
      return Array.isArray(bgAssets) ? bgAssets.length > 0 : !!bgAssets?.uploaded
    }
    
    const categoryKey = category === 'portrait' ? 'portraits' : 'bodyparts'
    const assets = manifest.npcs?.[npcId]?.[categoryKey]?.[assetType]
    return Array.isArray(assets) ? assets.length > 0 : !!assets?.uploaded
  }, [manifest])

  /**
   * Upload an asset
   */
  const uploadAsset = useCallback(async (category, npcId, assetType, file, replaceExisting = true) => {
    setIsLoading(true)
    try {
      if (category === 'background') {
        await assetService.uploadBackground(npcId, file)
      } else if (category === 'slideshow') {
        await assetService.uploadSlideshowBackground(npcId, file)
      } else {
        await assetService.uploadAsset(category, npcId, assetType, file, replaceExisting)
      }
      
      // Clear cache for this asset
      const cacheKey = category === 'background' 
        ? `background-${npcId}` 
        : `${category}-${npcId}-${assetType}`
      urlCacheRef.current.delete(cacheKey)
      urlCacheRef.current.delete(`${cacheKey}-all`)
      
      await loadManifest()
      
      notifyAssetChange()
    } finally {
      setIsLoading(false)
    }
  }, [loadManifest])

  /**
   * Clear URL cache (call when assets change)
   */
  const clearCache = useCallback(() => {
    urlCacheRef.current.clear()
    assetService.clearCache()
  }, [])

  /**
   * Force refresh all assets
   */
  const refresh = useCallback(() => {
    clearCache()
    loadManifest()
    setRefreshTrigger(prev => prev + 1)
  }, [clearCache, loadManifest])

  return {
    manifest,
    isLoading,
    getPortraitUrl,
    getBodyPartUrl,
    getAllBodyPartUrls,
    getBackgroundUrl,
    getAllBackgroundUrls,
    hasAsset,
    uploadAsset,
    clearCache,
    refresh,
    refreshManifest: loadManifest,
  }
}

export default useAssets
