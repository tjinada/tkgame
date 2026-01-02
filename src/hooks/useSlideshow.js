import { useState, useEffect, useCallback, useRef } from 'react'
import { assetService } from '../services/AssetService'

export function useSlideshow(options = {}) {
  const {
    interval = 10000,
    transitionDuration = 1500,
    shuffle = false,
    autoStart = true,
  } = options

  const [images, setImages] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoStart)
  const [isLoading, setIsLoading] = useState(true)
  const intervalRef = useRef(null)

  // Load slideshow images
  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = useCallback(async () => {
    setIsLoading(true)
    try {
      const backgrounds = await assetService.getSlideshowBackgrounds()
      const urls = backgrounds.map(bg => URL.createObjectURL(bg.blob))
      
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
    } finally {
      setIsLoading(false)
    }
  }, [shuffle])

  // Handle auto-advance
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

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach(url => URL.revokeObjectURL(url))
    }
  }, [images])

  return {
    images,
    currentIndex,
    currentImage: images[currentIndex] || null,
    isPlaying,
    isLoading,
    hasImages: images.length > 0,
    transitionDuration,
    play,
    pause,
    next,
    prev,
    goTo,
    refresh: loadImages,
  }
}

export default useSlideshow
