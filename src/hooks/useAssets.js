import { useState, useEffect, useCallback, useRef } from 'react'
import { assetService } from '../services/AssetService'

export function useAssets() {
  const [isLoading, setIsLoading] = useState(false)
  const [manifest, setManifest] = useState(null)
  const urlCacheRef = useRef(new Map())

  // Load manifest on mount
  useEffect(() => {
    loadManifest()
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
    if (url) {
      urlCacheRef.current.set(cacheKey, url)
    }
    return url
  }, [])

  /**
   * Get URL for an NPC body part
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
  }, [])

  /**
   * Get URL for a background
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
  }, [])

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
      await loadManifest()
    } finally {
      setIsLoading(false)
    }
  }, [loadManifest])

  /**
   * Clear URL cache (call when assets change)
   */
  const clearCache = useCallback(() => {
    for (const url of urlCacheRef.current.values()) {
      URL.revokeObjectURL(url)
    }
    urlCacheRef.current.clear()
  }, [])

  return {
    manifest,
    isLoading,
    getPortraitUrl,
    getBodyPartUrl,
    getBackgroundUrl,
    hasAsset,
    uploadAsset,
    clearCache,
    refreshManifest: loadManifest,
  }
}

export default useAssets
