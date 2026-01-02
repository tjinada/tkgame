export function NarrativePanel() {
  return (
    <div className="flex flex-col h-full bg-background-secondary rounded-xl overflow-hidden">
      {/* Narrative content area */}
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

export default NarrativePanel
