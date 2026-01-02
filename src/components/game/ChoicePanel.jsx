import { Button } from '../ui/Button'

export function ChoicePanel() {
  const placeholderChoices = [
    { id: 1, text: '"Yes, Mistress..." (Submit)', disabled: true },
    { id: 2, text: '"I refuse." (Defy - DC 15)', disabled: true },
    { id: 3, text: 'Look around the room', disabled: true },
  ]

  return (
    <div className="space-y-4 p-4 bg-background-secondary rounded-xl">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
        Choices
      </h3>
      
      <div className="space-y-2">
        {placeholderChoices.map((choice) => (
          <Button
            key={choice.id}
            variant="secondary"
            className="w-full text-left justify-start"
            disabled={choice.disabled}
          >
            <span className="text-accent-primary mr-2">{choice.id}.</span>
            {choice.text}
          </Button>
        ))}
      </div>

      {/* Custom action input */}
      <div className="pt-2 border-t border-background-tertiary">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type custom action..."
            disabled
            className="flex-1 px-4 py-2 bg-background-tertiary text-text-primary rounded-lg border border-background-elevated focus:border-accent-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button variant="primary" disabled>
            ➤
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ChoicePanel
