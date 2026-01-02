import { useState, useEffect, useCallback, useRef } from 'react'
import { assetService } from '../services/AssetService'

// Global event emitter for asset changes
const assetChangeListeners = new Set()

export function notifyAssetChange() {
  assetChangeListeners.forEach(listener => listener())
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
   * Get URL for an NPC portrait
   */
  const getPortraitUrl = useCallback(async (npcId, emotion = 'neutral') => {
    const cacheKey = `portrait-${npcId}-${emotion}`
    
    if (urlCacheRef.current.has(cacheKey)) {
      return urlCacheRef.current.get(cacheKey)
    }

    const url = await assetService.getNpcAssetUrl('portrait', npcId, emotion)
    
    // Only cache if we got a URL (don't cache null/missing assets)
    if (url) {
      urlCacheRef.current.set(cacheKey, url)
    }
    return url
  }, [refreshTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Get URL for an NPC body part
   */
  const getBodyPartUrl = useCallback(async (npcId, bodyPart) => {
    const cacheKey = `bodypart-${npcId}-${bodyPart}`
    
    if (urlCacheRef.current.has(cacheKey)) {
      return urlCacheRef.current.get(cacheKey)
    }

    const url = await assetService.getNpcAssetUrl('bodypart', npcId, bodyPart)
    
    // Only cache if we got a URL
    if (url) {
      urlCacheRef.current.set(cacheKey, url)
    }
    return url
  }, [refreshTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Get URL for a background
   */
  const getBackgroundUrl = useCallback(async (location) => {
    const cacheKey = `background-${location}`
    
    if (urlCacheRef.current.has(cacheKey)) {
      return urlCacheRef.current.get(cacheKey)
    }

    const url = await assetService.getBackgroundUrl(location)
    
    // Only cache if we got a URL
    if (url) {
      urlCacheRef.current.set(cacheKey, url)
    }
    return url
  }, [refreshTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Check if an asset exists
   */
  const hasAsset = useCallback((category, npcId, assetType) => {
    if (!manifest) return false
    
    if (category === 'background') {
      return manifest.backgrounds?.[npcId]?.uploaded || false
    }
    
    const categoryKey = category === 'portrait' ? 'portraits' : 'bodyparts'
    return manifest.npcs?.[npcId]?.[categoryKey]?.[assetType]?.uploaded || false
  }, [manifest])

  /**
   * Upload an asset
   */
  const uploadAsset = useCallback(async (category, npcId, assetType, file) => {
    setIsLoading(true)
    try {
      if (category === 'background') {
        await assetService.uploadBackground(npcId, file)
      } else if (category === 'slideshow') {
        await assetService.uploadSlideshowBackground(npcId, file)
      } else {
        await assetService.uploadAsset(category, npcId, assetType, file)
      }
      
      // Clear cache for this asset
      const cacheKey = category === 'background' 
        ? `background-${npcId}` 
        : `${category}-${npcId}-${assetType}`
      urlCacheRef.current.delete(cacheKey)
      
      await loadManifest()
      
      // Notify all listeners
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
    getBackgroundUrl,
    hasAsset,
    uploadAsset,
    clearCache,
    refresh,
    refreshManifest: loadManifest,
  }
}

export default useAssets
