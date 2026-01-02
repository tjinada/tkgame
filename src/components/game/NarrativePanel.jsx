import { useMemo } from 'react'
import { motion } from 'framer-motion'

/**
 * Parse AI-formatted narrative text
 * Format:
 * - *text* = narrative/description (italic, muted)
 * - Plain text or "quoted" = dialogue (bold, prominent, own line)
 * 
 * Returns array of { type: 'narrative' | 'dialogue', content: string }
 */
function parseFormattedText(text) {
  if (!text) return []
  
  const segments = []
  
  // Split by lines first to preserve structure
  const lines = text.split('\n')
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    
    // Check if entire line is wrapped in asterisks: *narrative text*
    const narrativeMatch = trimmedLine.match(/^\*(.+)\*$/)
    if (narrativeMatch) {
      segments.push({ 
        type: 'narrative', 
        content: narrativeMatch[1].trim() 
      })
      continue
    }
    
    // Check if line contains mixed content with asterisks
    if (trimmedLine.includes('*')) {
      // Parse inline asterisks: some *narrative* more text *more narrative*
      const parts = trimmedLine.split(/(\*[^*]+\*)/)
      
      for (const part of parts) {
        if (!part.trim()) continue
        
        const inlineNarrative = part.match(/^\*(.+)\*$/)
        if (inlineNarrative) {
          segments.push({ 
            type: 'narrative', 
            content: inlineNarrative[1].trim() 
          })
        } else if (part.trim()) {
          // This is dialogue (text outside asterisks)
          segments.push({ 
            type: 'dialogue', 
            content: part.trim() 
          })
        }
      }
      continue
    }
    
    // No asterisks - treat as dialogue
    segments.push({ 
      type: 'dialogue', 
      content: trimmedLine 
    })
  }
  
  return segments
}

/**
 * Render narrative segment (descriptions, actions)
 */
function NarrativeSegment({ content, index }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="narrative-line"
    >
      {content}
    </motion.p>
  )
}

/**
 * Render dialogue segment (speech)
 */
function DialogueSegment({ content, index }) {
  // Clean up content - ensure it has quotes
  const displayContent = content.startsWith('"') || content.startsWith("'") 
    ? content 
    : `"${content}"`
  
  return (
    <motion.p
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="dialogue-line"
    >
      {displayContent}
    </motion.p>
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
  
  // Parse the formatted text
  const segments = useMemo(() => parseFormattedText(displayContent), [displayContent])
  
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
            {segments.map((segment, index) => (
              segment.type === 'dialogue' ? (
                <DialogueSegment 
                  key={index} 
                  content={segment.content} 
                  index={index}
                />
              ) : (
                <NarrativeSegment 
                  key={index} 
                  content={segment.content} 
                  index={index}
                />
              )
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
