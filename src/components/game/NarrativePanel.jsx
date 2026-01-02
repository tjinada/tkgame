import { motion } from 'framer-motion'

export function NarrativePanel({ scene, toneStyles = {}, isLoading = false }) {
  if (!scene) {
    return (
      <div className="flex flex-col h-full bg-background-secondary rounded-xl overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="font-narrative text-lg text-text-secondary leading-relaxed">
            <p className="text-text-muted italic text-center py-12">
              Narrative will appear here...
            </p>
            <p className="text-text-muted/50 text-sm text-center">
              Start a new game to begin your journey through the dungeon.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Parse description into paragraphs
  const paragraphs = scene.description?.split('\n\n').filter(p => p.trim()) || []

  return (
    <div className="flex flex-col h-full bg-background-secondary rounded-xl overflow-hidden">
      {/* Header with location/NPC info */}
      {(scene.location || scene.npc) && (
        <div className="px-6 py-3 border-b border-background-tertiary flex items-center gap-4">
          {scene.location && (
            <span className="text-xs text-text-muted uppercase tracking-wider">
              📍 {scene.location.replace(/_/g, ' ')}
            </span>
          )}
          {scene.npc && (
            <span className="text-xs text-accent-primary uppercase tracking-wider">
              👤 {scene.npc}
            </span>
          )}
          {scene.source === 'ai' && (
            <span className="ml-auto text-xs text-accent-secondary/60">
              ✨ AI Generated
            </span>
          )}
        </div>
      )}

      {/* Narrative content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-text-muted">Loading...</p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="font-narrative text-lg leading-relaxed space-y-4"
            style={toneStyles}
          >
            {paragraphs.map((paragraph, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-text-primary"
              >
                {paragraph}
              </motion.p>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default NarrativePanel
