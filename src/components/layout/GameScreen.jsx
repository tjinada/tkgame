import { Header } from './Header'
import { SplitLayout } from './SplitLayout'
import { Dashboard } from '../game/Dashboard'
import { NarrativePanel } from '../game/NarrativePanel'
import { ChoicePanel } from '../game/ChoicePanel'

export function GameScreen({ gameState }) {
  const { chapter, turn } = gameState

  // Left panel content
  const leftContent = (
    <>
      {/* Visual placeholder - will be replaced with portrait/background in Phase 3 */}
      <div className="aspect-[3/4] bg-background-secondary rounded-xl flex items-center justify-center">
        <div className="text-center text-text-muted">
          <div className="text-4xl mb-2">👤</div>
          <p className="text-sm">Character portrait</p>
          <p className="text-xs">will appear here</p>
        </div>
      </div>

      {/* Dashboard */}
      <Dashboard gameState={gameState} />
    </>
  )

  // Right panel content
  const rightContent = (
    <>
      {/* Narrative Panel */}
      <div className="flex-1 min-h-0">
        <NarrativePanel />
      </div>

      {/* Choice Panel */}
      <ChoicePanel />
    </>
  )

  return (
    <div className="flex flex-col h-screen bg-background-primary">
      <Header chapter={chapter} turn={turn} />
      <SplitLayout left={leftContent} right={rightContent} />
    </div>
  )
}

export default GameScreen
