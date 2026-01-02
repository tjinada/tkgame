import { useSlideshow } from '../../hooks/useSlideshow'

export function SlideshowBackground({ 
  interval = 10000, 
  transitionDuration = 1500,
  shuffle = false,
}) {
  const { 
    currentImage, 
    hasImages, 
    isLoading,
  } = useSlideshow({ interval, transitionDuration, shuffle })

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient background (always visible) */}
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

      {/* Slideshow images (if any uploaded) */}
      {hasImages && currentImage && (
        <div 
          className="absolute inset-0 transition-opacity"
          style={{ 
            transitionDuration: `${transitionDuration}ms`,
          }}
        >
          <img
            src={currentImage}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Dark overlay for text readability */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: hasImages 
            ? 'rgba(10, 10, 15, 0.7)' 
            : 'transparent',
        }}
      />

      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(10, 10, 15, 0.4) 100%)',
        }}
      />
    </div>
  )
}

export default SlideshowBackground
