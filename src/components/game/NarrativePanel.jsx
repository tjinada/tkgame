import { useMemo } from 'react'
import { motion } from 'framer-motion'

/**
 * Parse narrative text to separate dialogue from description
 * Returns an array of segments with type 'dialogue' or 'narrative'
 */
function parseNarrative(text) {
  if (!text) return []
  
  const segments = []
  // Match text in single or double quotes, including the quotes
  const dialoguePattern = /(['"])(.*?)\1/g
  
  let lastIndex = 0
  let match

  while ((match = dialoguePattern.exec(text)) !== null) {
    // Add narrative before dialogue
    if (match.index > lastIndex) {
      const narrativeText = text.slice(lastIndex, match.index).trim()
      if (narrativeText) {
        segments.push({ type: 'narrative', content: narrativeText })
      }
    }
    
    // Add dialogue (without the outer quotes)
    segments.push({ type: 'dialogue', content: match[2] })
    lastIndex = match.index + match[0].length
  }

  // Add remaining narrative
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex).trim()
    if (remaining) {
      segments.push({ type: 'narrative', content: remaining })
    }
  }

  return segments
}

/**
 * Render a paragraph with mixed dialogue and narrative
 */
function NarrativeParagraph({ text, toneStyles, index }) {
  const segments = useMemo(() => parseNarrative(text), [text])

  // If no segments found, render as pure narrative
  if (segments.length === 0) {
    return (
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        className="narrative-text"
        style={toneStyles}
      >
        {text}
      </motion.p>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="paragraph-block"
    >
      {segments.map((segment, i) => {
        if (segment.type === 'dialogue') {
          return (
            <span key={i} className="dialogue-text">
              "{segment.content}"
            </span>
          )
        }
        return (
          <span key={i} className="narrative-text" style={toneStyles}>
            {segment.content}
          </span>
        )
      })}
    </motion.div>
  )
}

export function NarrativePanel({ 
  scene, 
  toneStyles = {}, 
  isLoading = false,
  streamingContent = '',
}) {
  // Use streaming content if available, otherwise scene description
  const displayContent = streamingContent || scene?.description || ''
  
  if (!scene && !streamingContent) {
    return (
      <div className="flex flex-col h-full bg-background-secondary/80 backdrop-blur-sm rounded-xl overflow-hidden border border-background-elevated/50">
        <div className="flex-1 p-8 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <p className="text-text-muted italic text-xl mb-3">
              Narrative will appear here...
            </p>
            <p className="text-text-muted/50 text-base">
              Start a new game to begin your journey through the dungeon.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Parse description into paragraphs
  const paragraphs = displayContent.split('\n\n').filter(p => p.trim())

  return (
    <div className="flex flex-col h-full bg-background-secondary/80 backdrop-blur-sm rounded-xl overflow-hidden border border-background-elevated/50">
      {/* Header with location/NPC info */}
      {(scene?.location || scene?.npc) && (
        <div className="px-6 py-3 border-b border-background-tertiary/50 flex items-center gap-4 bg-background-tertiary/30">
          {scene.location && (
            <span className="text-sm text-text-muted uppercase tracking-wider flex items-center gap-2">
              <span className="text-base">📍</span>
              {scene.location.replace(/_/g, ' ')}
            </span>
          )}
          {scene.npc && (
            <span className="text-sm text-accent-primary uppercase tracking-wider flex items-center gap-2">
              <span className="text-base">👤</span>
              {scene.npc}
            </span>
          )}
          {scene.source === 'ai' && (
            <span className="ml-auto text-sm text-accent-secondary/60 flex items-center gap-1">
              <span>✨</span> AI Generated
            </span>
          )}
        </div>
      )}

      {/* Narrative content */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto narrative-container">
        {isLoading && !streamingContent ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-base text-text-muted">Generating scene...</p>
            </div>
          </div>
        ) : (
          <div className="narrative-content">
            {paragraphs.map((paragraph, index) => (
              <NarrativeParagraph
                key={index}
                text={paragraph}
                toneStyles={toneStyles}
                index={index}
              />
            ))}
            
            {/* Streaming cursor */}
            {streamingContent && (
              <span className="streaming-cursor" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default NarrativePanel
