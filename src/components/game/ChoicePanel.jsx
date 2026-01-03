import { useState } from 'react'
import { motion } from 'framer-motion'

// Minimal archetype icons
const ICONS = {
  SUBMIT: '🙇', RESIST: '💢', ENDURE: '🛡️', NEGOTIATE: '🤝',
  OFFER: '🎁', DISTRACT: '👀', GROVEL: '🙏', OBSERVE: '👁️',
}

const TYPE_MAP = {
  submit: 'SUBMIT', defy: 'RESIST', resist: 'RESIST', observe: 'OBSERVE',
  endure: 'ENDURE', beg: 'GROVEL', grovel: 'GROVEL', negotiate: 'NEGOTIATE',
  offer: 'OFFER', distract: 'DISTRACT', custom: 'NEGOTIATE', wait: 'OBSERVE',
}

export function ChoicePanel({ 
  choices = [], 
  lockedChoices = [],
  onChoiceSelect, 
  onCustomAction,
  disabled = false,
  isLoading = false,
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

  const getIcon = (choice) => {
    const arch = choice.archetype || TYPE_MAP[choice.type?.toLowerCase()] || 'NEGOTIATE'
    return ICONS[arch] || '🤝'
  }

  if (choices.length === 0 && !onCustomAction) return null

  return (
    <div className="space-y-2">
      {/* Two-column grid for choices */}
      <div className="grid grid-cols-2 gap-2">
        {choices.map((choice, i) => {
          const roll = choice.rollRequired
          return (
            <motion.button
              key={choice.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => handleChoiceClick(choice.id)}
              disabled={disabled || isLoading}
              className={`
                text-left px-3 py-2 rounded-lg flex items-start gap-2
                bg-background-secondary/60 backdrop-blur-sm border border-background-elevated/30
                ${disabled || isLoading
                  ? 'text-text-muted cursor-not-allowed opacity-50'
                  : 'hover:bg-background-elevated/50 hover:border-accent-primary/40 cursor-pointer'
                }
                transition-colors
              `}
            >
              <span className="text-lg flex-shrink-0 mt-0.5">{getIcon(choice)}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-text-primary leading-snug">{choice.text}</span>
                {roll && (
                  <span className="ml-2 text-xs text-accent-warning">🎲{roll.dc}</span>
                )}
              </div>
              <span className="text-xs text-text-muted/40 flex-shrink-0">{i + 1}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Locked choices - minimal inline */}
      {lockedChoices.length > 0 && (
        <div className="text-xs text-text-muted/40 px-1">
          🔒 {lockedChoices.map(c => c.text.slice(0, 25) + '...').join(' · ')}
        </div>
      )}

      {/* Custom action - full width below */}
      {onCustomAction && (
        <div className="flex gap-2">
          <input
            type="text"
            value={customAction}
            onChange={(e) => setCustomAction(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
            placeholder="Custom action..."
            disabled={disabled || isLoading}
            className="flex-1 px-3 py-2 rounded-lg text-sm bg-background-secondary/60 backdrop-blur-sm border border-background-elevated/30 text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-primary/50"
          />
          <button 
            onClick={handleCustomSubmit}
            disabled={disabled || isLoading || !customAction.trim()}
            className="px-4 py-2 rounded-lg bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30 disabled:opacity-30 transition-colors"
          >
            ➤
          </button>
        </div>
      )}
    </div>
  )
}

export default ChoicePanel
