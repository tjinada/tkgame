import { useState, useEffect, useCallback, useRef } from 'react'
import { assetService } from '../services/AssetService'
import { subscribeToAssetChanges } from './useAssets'

/**
 * Hook for managing slideshow behavior
 * - Can be used for global slideshow backgrounds OR location-based backgrounds
 * - If location is provided, loads backgrounds for that specific location
 * - If no location, falls back to global slideshow backgrounds
 */
export function useSlideshow(options = {}) {
  const {
    location = null,  // If provided, uses location-based backgrounds
    interval = 10000,
    transitionDuration = 1500,
    shuffle = false,
    autoStart = true,
  } = options

  const [images, setImages] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoStart)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const intervalRef = useRef(null)
  const prevLocationRef = useRef(null)

  // Subscribe to asset changes from useAssets
  useEffect(() => {
    const unsubscribe = subscribeToAssetChanges(() => {
      console.log('Slideshow: Asset change detected, refreshing...')
      assetService.clearCache()
      setRefreshTrigger(prev => prev + 1)
    })
    return unsubscribe
  }, [])

  const loadImages = useCallback(async () => {
    setIsLoading(true)
    console.log('Slideshow: Loading images for location:', location)
    
    try {
      let urls = []
      
      if (location) {
        // Load location-specific backgrounds
        const assets = await assetService.getAllBackgroundUrls(location)
        console.log('Slideshow: Got assets for location:', assets)
        urls = assets.map(a => a.url)
      } else {
        // Fall back to global slideshow backgrounds
        const backgrounds = await assetService.getSlideshowBackgrounds()
        urls = backgrounds.map(bg => URL.createObjectURL(bg.blob))
      }
      
      console.log('Slideshow: Final URLs:', urls)
      
      if (shuffle && urls.length > 1) {
        // Fisher-Yates shuffle
        for (let i = urls.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[urls[i], urls[j]] = [urls[j], urls[i]]
        }
      }
      
      setImages(urls)
    } catch (err) {
      console.error('Failed to load slideshow images:', err)
      setImages([])
    } finally {
      setIsLoading(false)
    }
  }, [location, shuffle])

  // Load images when location changes or on refresh trigger
  useEffect(() => {
    const locationChanged = location !== prevLocationRef.current
    prevLocationRef.current = location
    
    if (locationChanged) {
      setCurrentIndex(0)
    }
    
    loadImages()
  }, [location, refreshTrigger, loadImages])

  // Handle auto-advance (only if multiple images)
  useEffect(() => {
    if (isPlaying && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % images.length)
      }, interval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, images.length, interval])

  const play = useCallback(() => {
    setIsPlaying(true)
  }, [])

  const pause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const next = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length)
  }, [images.length])

  const prev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length)
  }, [images.length])

  const goTo = useCallback((index) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index)
    }
  }, [images.length])

  // Cleanup URLs on unmount (only for blob URLs from global slideshow)
  useEffect(() => {
    return () => {
      if (!location) {
        // Only revoke blob URLs (global slideshow uses blobs)
        images.forEach(url => {
          if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url)
          }
        })
      }
    }
  }, [images, location])

  return {
    images,
    currentIndex,
    currentImage: images[currentIndex] || null,
    isPlaying,
    isLoading,
    hasImages: images.length > 0,
    imageCount: images.length,
    transitionDuration,
    location,
    play,
    pause,
    next,
    prev,
    goTo,
    refresh: loadImages,
  }
}

export default useSlideshow
