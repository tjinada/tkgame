import { useSlideshow } from '../../hooks/useSlideshow'

/**
 * Fullscreen background component that displays location-based backgrounds
 */
export function SlideshowBackground({ 
  location = null,
  interval = 10000, 
  transitionDuration = 1500,
  shuffle = false,
}) {
  const { 
    currentImage, 
    hasImages, 
    isLoading,
    imageCount,
    currentIndex,
  } = useSlideshow({ 
    location,
    interval, 
    transitionDuration, 
    shuffle,
  })

  return (
    <div 
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: -10 }}
    >
      {/* Background image OR gradient fallback */}
      {hasImages && currentImage ? (
        <>
          {/* The actual background image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: `url(${currentImage})`,
            }}
          />
          
          {/* Gradient overlay - darker at edges, lighter in center */}
          <div 
            className="absolute inset-0"
            style={{ 
              background: `
                radial-gradient(
                  ellipse at center,
                  rgba(10, 10, 15, 0.3) 0%,
                  rgba(10, 10, 15, 0.5) 50%,
                  rgba(10, 10, 15, 0.7) 100%
                )
              `,
            }}
          />
          
          {/* Bottom gradient for better text readability near choices */}
          <div 
            className="absolute inset-0"
            style={{ 
              background: `
                linear-gradient(
                  to top,
                  rgba(10, 10, 15, 0.8) 0%,
                  rgba(10, 10, 15, 0.4) 20%,
                  transparent 40%
                )
              `,
            }}
          />
        </>
      ) : (
        <>
          {/* Fallback gradient when no image */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 25%, #1a1a24 50%, #12121a 75%, #0a0a0f 100%)',
            }}
          />
          
          {/* Subtle pattern overlay */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(236, 72, 153, 0.05) 0%, transparent 50%)
              `,
            }}
          />

          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        </>
      )}

      {/* Subtle vignette effect (always) */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(10, 10, 15, 0.3) 100%)',
        }}
      />

      {/* Image indicator */}
      {hasImages && imageCount > 1 && (
        <div 
          className="absolute bottom-4 right-4 flex items-center gap-1.5"
          style={{ opacity: 0.5 }}
        >
          {Array.from({ length: imageCount }).map((_, idx) => (
            <div
              key={idx}
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/40'}
              `}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default SlideshowBackground
