import { useMemo } from 'react'
import { motion } from 'framer-motion'

/**
 * Parse narrative text into structured blocks for display
 * Creates separate blocks for dialogue vs narrative for better visual separation
 */
function parseFormattedText(text) {
  if (!text) return []
  
  const blocks = []
  
  // First, split by newlines to preserve intentional breaks
  const lines = text.split('\n').filter(line => line.trim())
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // Check if entire line is wrapped in asterisks: *narrative text*
    const fullAsteriskMatch = trimmedLine.match(/^\*(.+)\*$/)
    if (fullAsteriskMatch) {
      blocks.push({ 
        type: 'narrative', 
        content: fullAsteriskMatch[1].trim() 
      })
      continue
    }
    
    // Check if line is pure dialogue (starts and ends with quotes)
    if (trimmedLine.match(/^[""].+[""]$/)) {
      blocks.push({
        type: 'dialogue',
        content: trimmedLine
      })
      continue
    }
    
    // Mixed content - split by dialogue quotes and asterisks
    parseMixedLine(trimmedLine, blocks)
  }
  
  return blocks
}

/**
 * Parse a line with mixed narrative and dialogue
 * Splits inline quotes into separate blocks for better readability
 */
function parseMixedLine(line, blocks) {
  // Pattern to capture: *narrative*, "dialogue", "dialogue", or "dialogue"
  const pattern = /(\*[^*]+\*)|("[^"]+"|"[^"]+"|"[^"]+")/g
  
  let lastIndex = 0
  let match
  
  while ((match = pattern.exec(line)) !== null) {
    // Add narrative text before this match
    if (match.index > lastIndex) {
      const before = line.slice(lastIndex, match.index).trim()
      if (before) {
        blocks.push({ type: 'narrative', content: before })
      }
    }
    
    const matched = match[0]
    
    if (matched.startsWith('*') && matched.endsWith('*')) {
      // Asterisk-wrapped narrative
      blocks.push({ type: 'narrative', content: matched.slice(1, -1).trim() })
    } else {
      // Quoted dialogue - push as separate block
      blocks.push({ type: 'dialogue', content: matched })
    }
    
    lastIndex = match.index + matched.length
  }
  
  // Add any remaining text after last match
  if (lastIndex < line.length) {
    const remaining = line.slice(lastIndex).trim()
    if (remaining) {
      blocks.push({ type: 'narrative', content: remaining })
    }
  }
  
  // If no matches found, treat whole line as narrative
  if (lastIndex === 0) {
    blocks.push({ type: 'narrative', content: line })
  }
}

/**
 * Render a narrative block (descriptions, actions)
 */
function NarrativeBlock({ content, index }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.4 }}
      className="text-slate-300 italic leading-[1.9] text-[1.05rem] mb-5"
    >
      {content}
    </motion.p>
  )
}

/**
 * Render a dialogue block (speech) - visually distinct
 */
function DialogueBlock({ content, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.4 }}
      className="my-5 pl-5 border-l-[3px] border-purple-500/60"
    >
      <p className="text-white font-medium leading-[1.8] text-[1.1rem]">
        {content}
      </p>
    </motion.div>
  )
}

export function NarrativePanel({ 
  scene, 
  toneStyles = {}, 
  isLoading = false,
  streamingContent = '',
  bodyPart = null,
  npcName = '',
}) {
  // Use streaming content if available, otherwise scene description
  const displayContent = streamingContent || scene?.description || ''
  
  // Parse the formatted text into blocks
  const blocks = useMemo(() => parseFormattedText(displayContent), [displayContent])
  
  if (!scene && !streamingContent) {
    return (
      <div className="flex flex-col h-full bg-background-secondary/60 backdrop-blur-md rounded-xl overflow-hidden border border-background-elevated/30">
        <div className="flex-1 p-8 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <p className="text-text-muted italic text-xl mb-3">
              Narrative will appear here...
            </p>
            <p className="text-text-muted/50 text-base">
              Start a new game to begin your journey.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background-secondary/60 backdrop-blur-md rounded-xl overflow-hidden border border-background-elevated/30">
      {/* Header with location/NPC/body part info */}
      {(scene?.location || scene?.npc || bodyPart) && (
        <div className="px-6 py-3 border-b border-background-tertiary/30 flex items-center gap-4 bg-background-tertiary/20">
          {scene?.location && (
            <span className="text-sm text-text-muted uppercase tracking-wider flex items-center gap-2">
              <span className="text-base">📍</span>
              {scene.location.replace(/_/g, ' ')}
            </span>
          )}
          {scene?.npc && (
            <span className="text-sm text-accent-primary uppercase tracking-wider flex items-center gap-2">
              <span className="text-base">👤</span>
              {scene.npc}
            </span>
          )}
          {bodyPart && (
            <span className="text-sm text-pink-400 uppercase tracking-wider flex items-center gap-2 animate-pulse">
              <span className="text-base">🎯</span>
              Focus: {bodyPart.replace(/_/g, ' ')}
              {npcName && <span className="text-pink-400/60">({npcName})</span>}
            </span>
          )}
          {scene?.source === 'ai' && (
            <span className="ml-auto text-sm text-accent-secondary/60 flex items-center gap-1">
              <span>✨</span> AI Generated
            </span>
          )}
        </div>
      )}

      {/* Narrative content */}
      <div className="flex-1 px-8 py-6 overflow-y-auto">
        {isLoading && !streamingContent ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-base text-text-muted">Generating scene...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl">
            {blocks.map((block, index) => (
              block.type === 'dialogue' ? (
                <DialogueBlock 
                  key={index}
                  content={block.content}
                  index={index}
                />
              ) : (
                <NarrativeBlock
                  key={index}
                  content={block.content}
                  index={index}
                />
              )
            ))}
            
            {/* Streaming cursor */}
            {streamingContent && (
              <span className="inline-block w-2 h-5 bg-purple-500/70 animate-pulse ml-1 align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default NarrativePanel
