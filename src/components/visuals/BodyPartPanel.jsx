import { useState, useEffect } from 'react'
import { useBodyPart } from '../../hooks/useBodyPart'

/**
 * Slide-in body part panel that appears on the right side
 * - Slides in when bodyPart is active
 * - Slides out when bodyPart is null
 * - Has internal slideshow if multiple images exist
 * - Same height/width as portrait panel
 */
export function BodyPartPanel({ 
  npcId, 
  bodyPart,
  npcName = '',
  animationDuration = 300,
}) {
  const {
    currentImage,
    isVisible,
    isLoading,
    hasImages,
    imageCount,
    currentIndex,
    transitionDuration,
  } = useBodyPart({
    npcId,
    bodyPart,
    interval: 10000,
    transitionDuration: 500,
  })

  // Track mount state for animations
  const [shouldRender, setShouldRender] = useState(false)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      setIsAnimatingOut(false)
    } else if (shouldRender) {
      // Start exit animation
      setIsAnimatingOut(true)
      // Remove from DOM after animation completes
      const timer = setTimeout(() => {
        setShouldRender(false)
        setIsAnimatingOut(false)
      }, animationDuration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, shouldRender, animationDuration])

  if (!shouldRender) {
    return null
  }

  const displayName = bodyPart?.replace(/_/g, ' ') || 'body part'

  return (
    <div 
      className={`
        w-96 flex-shrink-0 transform transition-transform ease-out
        ${isAnimatingOut ? 'translate-x-full' : 'translate-x-0'}
      `}
      style={{ 
        transitionDuration: `${animationDuration}ms`,
      }}
    >
      <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-background-secondary">
        {/* Image or placeholder */}
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background-secondary">
            <div className="w-8 h-8 border-2 border-accent-secondary/30 border-t-accent-secondary rounded-full animate-spin" />
          </div>
        ) : hasImages && currentImage ? (
          <img
            src={currentImage}
            alt={`${npcName || npcId} - ${displayName}`}
            className="w-full h-full object-cover transition-opacity"
            style={{ transitionDuration: `${transitionDuration}ms` }}
          />
        ) : (
          <BodyPartPlaceholder displayName={displayName} />
        )}

        {/* Frame decoration */}
        <div className="absolute inset-0 pointer-events-none rounded-xl border border-accent-secondary/10" />
        
        {/* Corner accents */}
        <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-accent-secondary/30 rounded-tl" />
        <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-accent-secondary/30 rounded-tr" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-accent-secondary/30 rounded-bl" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-accent-secondary/30 rounded-br" />

        {/* Body part label */}
        <div className="absolute top-3 left-3 right-3">
          <div className="inline-block px-3 py-1 rounded-lg bg-background-primary/80 backdrop-blur-sm">
            <span className="text-sm font-medium text-text-primary capitalize">
              {displayName}
            </span>
            {npcName && (
              <span className="ml-2 text-xs text-text-muted">
                ({npcName})
              </span>
            )}
          </div>
        </div>

        {/* Image counter (if multiple) */}
        {imageCount > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background-primary/80 backdrop-blur-sm">
              {Array.from({ length: imageCount }).map((_, idx) => (
                <div
                  key={idx}
                  className={`
                    w-1.5 h-1.5 rounded-full transition-colors
                    ${idx === currentIndex ? 'bg-accent-secondary' : 'bg-text-muted/40'}
                  `}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BodyPartPlaceholder({ displayName }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {/* Decorative background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.1) 0%, transparent 60%),
            linear-gradient(to bottom, #12121a 0%, #1a1a24 100%)
          `,
        }}
      />
      
      {/* Focus frame placeholder */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Crosshair decoration */}
        <div className="relative w-32 h-32">
          {/* Outer circle */}
          <div className="absolute inset-0 rounded-full border-2 border-accent-secondary/20" />
          
          {/* Inner circle */}
          <div className="absolute inset-4 rounded-full border border-accent-secondary/30" />
          
          {/* Crosshair lines */}
          <div className="absolute top-0 left-1/2 w-0.5 h-6 -translate-x-1/2 bg-accent-secondary/30" />
          <div className="absolute bottom-0 left-1/2 w-0.5 h-6 -translate-x-1/2 bg-accent-secondary/30" />
          <div className="absolute left-0 top-1/2 w-6 h-0.5 -translate-y-1/2 bg-accent-secondary/30" />
          <div className="absolute right-0 top-1/2 w-6 h-0.5 -translate-y-1/2 bg-accent-secondary/30" />
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-accent-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Upload prompt */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-background-tertiary/80 border border-accent-secondary/20">
          <svg className="w-4 h-4 text-accent-secondary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-xs text-text-muted">Upload {displayName}</span>
        </div>
      </div>
    </div>
  )
}

export default BodyPartPanel
