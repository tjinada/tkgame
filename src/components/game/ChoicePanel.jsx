import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../ui/Button'

// Archetype icons and colors
const ARCHETYPE_CONFIG = {
  SUBMIT: { icon: '🙇', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  RESIST: { icon: '💢', color: 'text-red-400', bgColor: 'bg-red-500/10' },
  ENDURE: { icon: '🛡️', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  NEGOTIATE: { icon: '🤝', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  OFFER: { icon: '🎁', color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
  DISTRACT: { icon: '👀', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  GROVEL: { icon: '🙏', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  OBSERVE: { icon: '👁️', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
}

// Legacy type mappings
const TYPE_TO_ARCHETYPE = {
  submit: 'SUBMIT',
  defy: 'RESIST',
  resist: 'RESIST',
  observe: 'OBSERVE',
  endure: 'ENDURE',
  beg: 'GROVEL',
  grovel: 'GROVEL',
  negotiate: 'NEGOTIATE',
  offer: 'OFFER',
  distract: 'DISTRACT',
  custom: 'NEGOTIATE',
  wait: 'OBSERVE',
}

export function ChoicePanel({ 
  choices = [], 
  lockedChoices = [],
  sceneContext = null,
  onChoiceSelect, 
  onCustomAction,
  disabled = false,
  isLoading = false,
  showDebug = false,
}) {
  const [customAction, setCustomAction] = useState('')

  const handleChoiceClick = (choiceId) => {
    if (disabled || isLoading) return
    onChoiceSelect?.(choiceId)
  }

  const handleCustomSubmit = () => {
    if (!customAction.trim() || disabled || isLoading) return
    onCustomAction?.(customAction.trim())
    setCustomAction('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCustomSubmit()
    }
  }

  const getArchetype = (choice) => {
    // Use explicit archetype if present
    if (choice.archetype && ARCHETYPE_CONFIG[choice.archetype]) {
      return choice.archetype
    }
    // Map from type
    const mapped = TYPE_TO_ARCHETYPE[choice.type?.toLowerCase()]
    return mapped || 'NEGOTIATE'
  }

  const getArchetypeConfig = (choice) => {
    const archetype = getArchetype(choice)
    return ARCHETYPE_CONFIG[archetype] || ARCHETYPE_CONFIG.NEGOTIATE
  }

  const getChoiceLabel = (choice) => {
    // Use explicit label if present
    if (choice.label) return choice.label
    // Fallback to archetype name
    const archetype = getArchetype(choice)
    return archetype.charAt(0) + archetype.slice(1).toLowerCase()
  }

  const getRollInfo = (choice) => {
    if (!choice.rollRequired) return null
    const { dc, stat } = choice.rollRequired
    return `DC ${dc}${stat ? ` ${stat}` : ''}`
  }

  const getConsequenceHint = (choice) => {
    return choice.consequenceHint || null
  }

  if (choices.length === 0 && lockedChoices.length === 0 && !onCustomAction) {
    return (
      <div className="p-4 bg-background-secondary/60 backdrop-blur-md rounded-xl border border-background-elevated/30">
        <p className="text-center text-text-muted text-sm">
          No choices available
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 bg-background-secondary/60 backdrop-blur-md rounded-xl border border-background-elevated/30">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Choices
        </h3>
        {showDebug && sceneContext && (
          <span className="text-xs px-2 py-0.5 rounded bg-accent-primary/20 text-accent-primary">
            Context: {sceneContext}
          </span>
        )}
      </div>
      
      {/* Available choice buttons */}
      <div className="space-y-2">
        {choices.map((choice, index) => {
          const config = getArchetypeConfig(choice)
          const rollInfo = getRollInfo(choice)
          const hint = getConsequenceHint(choice)
          const label = getChoiceLabel(choice)
          
          return (
            <motion.div
              key={choice.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <button
                onClick={() => handleChoiceClick(choice.id)}
                disabled={disabled || isLoading}
                className={`
                  w-full text-left px-4 py-3 rounded-lg border transition-all
                  ${disabled || isLoading
                    ? 'bg-background-tertiary/40 border-background-tertiary/50 text-text-muted cursor-not-allowed'
                    : 'bg-background-tertiary/50 border-background-elevated/50 hover:border-accent-primary hover:bg-background-elevated/60 cursor-pointer'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Archetype icon */}
                  <span className={`text-lg flex-shrink-0 ${config.color}`}>
                    {config.icon}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    {/* Choice text */}
                    <p className="text-text-primary">
                      {choice.text}
                    </p>
                    
                    {/* Meta info row */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {/* Archetype tag */}
                      <span className={`text-xs px-2 py-0.5 rounded ${config.bgColor} ${config.color}`}>
                        {label}
                      </span>
                      
                      {/* Roll info */}
                      {rollInfo && (
                        <span className="text-xs px-2 py-0.5 rounded bg-accent-warning/20 text-accent-warning flex items-center gap-1">
                          🎲 {rollInfo}
                        </span>
                      )}
                      
                      {/* Consequence hint */}
                      {hint && (
                        <span className="text-xs text-text-muted">
                          → {hint}
                        </span>
                      )}
                      
                      {/* Special markers */}
                      {choice.isStateGated && (
                        <span className="text-xs text-accent-success">★</span>
                      )}
                      {choice.isNpcSpecific && (
                        <span className="text-xs text-accent-secondary">♦</span>
                      )}
                      {choice.isAIGenerated && (
                        <span className="text-xs text-accent-primary">✧</span>
                      )}
                      {choice.riskOverGrovel && (
                        <span className="text-xs text-accent-warning">⚠</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Number indicator */}
                  <span className="text-accent-primary/60 text-sm flex-shrink-0 font-mono">
                    {index + 1}
                  </span>
                </div>
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* Locked choices */}
      {lockedChoices.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-background-tertiary/30">
          <p className="text-xs text-text-muted uppercase tracking-wider">Locked</p>
          {lockedChoices.map((choice, index) => {
            const config = getArchetypeConfig(choice)
            
            return (
              <motion.div
                key={choice.id || `locked-${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: (choices.length + index) * 0.08 }}
              >
                <div className="w-full text-left px-4 py-2 rounded-lg border border-background-tertiary/30 bg-background-tertiary/20 cursor-not-allowed">
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 opacity-40">
                      🔒
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-muted text-sm line-through opacity-60">
                        {choice.text}
                      </p>
                      <p className="text-xs text-accent-warning/70 mt-1">
                        {choice.lockReason || 'Requirements not met'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Custom action input */}
      {onCustomAction && (
        <div className="pt-2 border-t border-background-tertiary/30">
          <div className="flex gap-2">
            <input
              type="text"
              value={customAction}
              onChange={(e) => setCustomAction(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type custom action..."
              disabled={disabled || isLoading}
              className={`
                flex-1 px-4 py-2 rounded-lg border focus:outline-none transition-colors
                ${disabled || isLoading
                  ? 'bg-background-tertiary/40 border-background-tertiary/50 text-text-muted cursor-not-allowed'
                  : 'bg-background-tertiary/50 border-background-elevated/50 text-text-primary focus:border-accent-primary placeholder:text-text-muted/50'
                }
              `}
            />
            <Button 
              variant="primary" 
              onClick={handleCustomSubmit}
              disabled={disabled || isLoading || !customAction.trim()}
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                '➤'
              )}
            </Button>
          </div>
          <p className="text-xs text-text-muted mt-2">
            Press Enter to submit a custom action
          </p>
        </div>
      )}
    </div>
  )
}

export default ChoicePanel
