import { useState, useEffect, useCallback, useRef } from 'react'
import { assetService } from '../services/AssetService'
import { subscribeToAssetChanges } from './useAssets'

/**
 * Hook for managing body part panel state and slideshow
 * - Handles visibility of the slide-in panel
 * - Manages slideshow cycling through multiple body part images
 * - 10 second interval per image
 */
export function useBodyPart(options = {}) {
  const {
    npcId = null,
    bodyPart = null,
    interval = 10000,
    transitionDuration = 500,
  } = options

  const [images, setImages] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const intervalRef = useRef(null)
  const prevBodyPartRef = useRef(null)

  // Subscribe to asset changes
  useEffect(() => {
    const unsubscribe = subscribeToAssetChanges(() => {
      assetService.clearCache()
      setRefreshTrigger(prev => prev + 1)
    })
    return unsubscribe
  }, [])

  // Load body part images when npcId or bodyPart changes
  useEffect(() => {
    if (!npcId || !bodyPart) {
      // No body part active - hide panel
      setIsVisible(false)
      setImages([])
      setCurrentIndex(0)
      prevBodyPartRef.current = null
      return
    }

    // Check if body part changed
    const bodyPartKey = `${npcId}-${bodyPart}`
    if (prevBodyPartRef.current === bodyPartKey && refreshTrigger === 0) {
      return // Same body part and no refresh needed
    }
    prevBodyPartRef.current = bodyPartKey

    loadBodyPartImages(npcId, bodyPart)
  }, [npcId, bodyPart, refreshTrigger])

  const loadBodyPartImages = async (npcId, bodyPart) => {
    setIsLoading(true)
    setCurrentIndex(0)
    
    try {
      const assets = await assetService.getAllNpcAssetUrls('bodypart', npcId, bodyPart)
      
      if (assets.length > 0) {
        setImages(assets.map(a => a.url))
        setIsVisible(true)
      } else {
        // No images uploaded, still show panel with placeholder
        setImages([])
        setIsVisible(true)
      }
    } catch (err) {
      console.error('Failed to load body part images:', err)
      setImages([])
      setIsVisible(true) // Show placeholder
    } finally {
      setIsLoading(false)
    }
  }

  // Handle slideshow auto-advance (only if multiple images)
  useEffect(() => {
    if (images.length > 1 && isVisible) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % images.length)
      }, interval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [images.length, isVisible, interval])

  const next = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex(prev => (prev + 1) % images.length)
    }
  }, [images.length])

  const prev = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex(prev => (prev - 1 + images.length) % images.length)
    }
  }, [images.length])

  const goTo = useCallback((index) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index)
    }
  }, [images.length])

  return {
    // State
    images,
    currentIndex,
    currentImage: images[currentIndex] || null,
    isVisible,
    isLoading,
    hasImages: images.length > 0,
    imageCount: images.length,
    
    // Computed
    transitionDuration,
    
    // Actions
    next,
    prev,
    goTo,
  }
}

export default useBodyPart
