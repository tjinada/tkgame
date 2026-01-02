import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../ui/Button'

export function ChoicePanel({ 
  choices = [], 
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCustomSubmit()
    }
  }

  const getChoiceTypeIcon = (choice) => {
    if (choice.rollRequired) return '🎲'
    if (choice.type === 'submit') return '🙇'
    if (choice.type === 'defy') return '💢'
    if (choice.type === 'observe') return '👁️'
    return '▸'
  }

  const getChoiceTypeLabel = (choice) => {
    if (choice.rollRequired) {
      return `DC ${choice.rollRequired.dc} ${choice.rollRequired.stat || ''}`
    }
    return null
  }

  if (choices.length === 0 && !onCustomAction) {
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
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
        Choices
      </h3>
      
      {/* Choice buttons */}
      <div className="space-y-2">
        {choices.map((choice, index) => (
          <motion.div
            key={choice.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
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
                <span className="text-lg flex-shrink-0">
                  {getChoiceTypeIcon(choice)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary">
                    {choice.text}
                  </p>
                  {getChoiceTypeLabel(choice) && (
                    <p className="text-xs text-accent-warning mt-1">
                      {getChoiceTypeLabel(choice)}
                    </p>
                  )}
                </div>
                <span className="text-accent-primary/60 text-sm flex-shrink-0">
                  {index + 1}
                </span>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

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
            Press Enter to submit, or type a custom action
          </p>
        </div>
      )}
    </div>
  )
}

export default ChoicePanel
