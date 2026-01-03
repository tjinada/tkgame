import { useMemo } from 'react'
import { motion } from 'framer-motion'

/**
 * Parse narrative text with smart dialogue detection
 * Format:
 * - "quoted text" = dialogue (bold, prominent)
 * - *text* = narrative (italic, muted) - AI format compatibility
 * - Plain unquoted text = narrative (italic, muted) - default for prose
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
    const fullAsteriskMatch = trimmedLine.match(/^\*(.+)\*$/)
    if (fullAsteriskMatch) {
      segments.push({ 
        type: 'narrative', 
        content: fullAsteriskMatch[1].trim() 
      })
      continue
    }
    
    // Check if line contains asterisks (AI format)
    if (trimmedLine.includes('*')) {
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
          // Text outside asterisks - parse for quotes
          parseLineForQuotes(part.trim(), segments)
        }
      }
      continue
    }
    
    // No asterisks - parse for quoted dialogue vs narrative prose
    parseLineForQuotes(trimmedLine, segments)
  }
  
  return segments
}

/**
 * Parse a line for quoted dialogue vs narrative prose
 * "Quoted text" becomes dialogue, everything else is narrative
 * Handles straight quotes (") and curly quotes ("")
 */
function parseLineForQuotes(line, segments) {
  // Match quoted strings - handles:
  // - Straight double quotes: "..."
  // - Curly/smart double quotes: "..."
  // Using a regex that captures the quote content
  const quotePattern = /"([^"]+)"|"([^"]+)"/g
  
  let lastIndex = 0
  let match
  const localSegments = []
  
  while ((match = quotePattern.exec(line)) !== null) {
    // Add any narrative text before this quote
    if (match.index > lastIndex) {
      const narrativeText = line.slice(lastIndex, match.index).trim()
      if (narrativeText) {
        localSegments.push({ type: 'narrative', content: narrativeText })
      }
    }
    
    // Get the captured content (from whichever group matched)
    const dialogueContent = match[1] || match[2]
    
    // Add the quoted dialogue (include quotes in display)
    if (dialogueContent) {
      localSegments.push({ type: 'dialogue', content: `"${dialogueContent}"` })
    }
    
    lastIndex = match.index + match[0].length
  }
  
  // Add any remaining narrative text after the last quote
  if (lastIndex < line.length) {
    const remainingText = line.slice(lastIndex).trim()
    if (remainingText) {
      localSegments.push({ type: 'narrative', content: remainingText })
    }
  }
  
  // If no quotes were found, the entire line is narrative
  if (localSegments.length === 0) {
    segments.push({ type: 'narrative', content: line })
  } else {
    // Add all local segments to main segments array
    segments.push(...localSegments)
  }
}

/**
 * Render narrative segment (descriptions, actions) - inline
 */
function NarrativeSegment({ content, index }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.015, duration: 0.3 }}
      className="narrative-segment"
    >
      {content}{' '}
    </motion.span>
  )
}

/**
 * Render dialogue segment (speech) - inline
 */
function DialogueSegment({ content, index }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.015, duration: 0.3 }}
      className="dialogue-segment"
    >
      {content}{' '}
    </motion.span>
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
      <div className="flex flex-col h-full bg-background-secondary/60 backdrop-blur-md rounded-xl overflow-hidden border border-background-elevated/30">
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
    <div className="flex flex-col h-full bg-background-secondary/60 backdrop-blur-md rounded-xl overflow-hidden border border-background-elevated/30">
      {/* Header with location/NPC info */}
      {(scene?.location || scene?.npc) && (
        <div className="px-6 py-3 border-b border-background-tertiary/30 flex items-center gap-4 bg-background-tertiary/20">
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
            <p className="narrative-paragraph">
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
            </p>
            
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
