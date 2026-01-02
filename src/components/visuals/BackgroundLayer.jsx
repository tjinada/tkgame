import { useState, useEffect } from 'react'
import { useAssets } from '../../hooks/useAssets'
import placeholderBg from '../../assets/placeholders/background.svg'

export function BackgroundLayer({ location }) {
  const { getBackgroundUrl, hasAsset } = useAssets()
  const [backgroundUrl, setBackgroundUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!location) {
      setBackgroundUrl(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    
    getBackgroundUrl(location).then(url => {
      setBackgroundUrl(url)
      setIsLoading(false)
    }).catch(() => {
      setBackgroundUrl(null)
      setIsLoading(false)
    })
  }, [location, getBackgroundUrl])

  const hasBackground = backgroundUrl !== null

  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl">
      {/* Placeholder or actual background */}
      {hasBackground ? (
        <img
          src={backgroundUrl}
          alt={`${location} background`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-background-secondary">
          {/* Location name badge */}
          {location && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-background-tertiary/80 rounded-lg">
              <span className="text-xs text-text-muted uppercase tracking-wider">
                {location.replace(/_/g, ' ')}
              </span>
            </div>
          )}
          
          {/* Decorative background */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 70% 70%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)
              `,
            }}
          />
          
          {/* Placeholder content */}
          <div className="relative z-10 text-center p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-background-tertiary flex items-center justify-center">
              <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-text-muted">Scene Background</p>
            <p className="text-xs text-text-muted/60 mt-1">Upload in Admin Panel</p>
          </div>
        </div>
      )}

      {/* Gradient overlay for text readability */}
      {hasBackground && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(10,10,15,0.3) 0%, rgba(10,10,15,0.6) 100%)',
          }}
        />
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background-secondary">
          <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

export default BackgroundLayer
