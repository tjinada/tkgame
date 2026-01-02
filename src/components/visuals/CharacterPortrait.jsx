import { useState, useEffect, useCallback } from 'react'
import { useAssets } from '../../hooks/useAssets'

export function CharacterPortrait({ 
  npcId, 
  emotion = 'neutral',
  npcName = '',
  showLabel = true,
}) {
  const { getPortraitUrl, manifest } = useAssets()
  const [portraitUrl, setPortraitUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadPortrait = useCallback(async () => {
    if (!npcId) {
      setPortraitUrl(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setHasError(false)
    
    try {
      const url = await getPortraitUrl(npcId, emotion)
      setPortraitUrl(url)
    } catch (e) {
      setPortraitUrl(null)
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [npcId, emotion, getPortraitUrl])

  // Reload when npcId, emotion, or manifest changes
  useEffect(() => {
    loadPortrait()
  }, [loadPortrait, manifest])

  const hasPortrait = portraitUrl !== null

  return (
    <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-background-secondary">
      {/* Portrait image or placeholder */}
      {hasPortrait ? (
        <img
          src={portraitUrl}
          alt={`${npcName || npcId} - ${emotion}`}
          className="w-full h-full object-cover"
          onError={() => {
            setPortraitUrl(null)
            setHasError(true)
          }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center">
          {/* Decorative background */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                linear-gradient(to bottom, #12121a 0%, #1a1a24 100%)
              `,
            }}
          />
          
          {/* Silhouette placeholder */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Head silhouette */}
            <div className="w-24 h-28 rounded-full bg-background-tertiary mb-2" 
              style={{
                borderRadius: '50% 50% 45% 45%',
              }}
            />
            {/* Body silhouette */}
            <div 
              className="w-40 h-32 bg-background-tertiary"
              style={{
                borderRadius: '40% 40% 0 0',
                marginTop: '-20px',
              }}
            />
          </div>

          {/* Upload prompt */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-background-tertiary/80 border border-accent-primary/20">
              <svg className="w-4 h-4 text-accent-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-text-muted">Upload Portrait</span>
            </div>
          </div>
        </div>
      )}

      {/* Frame decoration */}
      <div className="absolute inset-0 pointer-events-none rounded-xl border border-accent-primary/10" />
      <div className="absolute inset-2 pointer-events-none rounded-lg border border-accent-primary/5" />

      {/* NPC name label */}
      {showLabel && (npcName || npcId) && (
        <div className="absolute top-3 left-3 right-3">
          <div className="inline-block px-3 py-1 rounded-lg bg-background-primary/80 backdrop-blur-sm">
            <span className="text-sm font-medium text-text-primary">
              {npcName || npcId}
            </span>
            {emotion !== 'neutral' && (
              <span className="ml-2 text-xs text-text-muted">
                ({emotion})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background-secondary/80">
          <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

export default CharacterPortrait
