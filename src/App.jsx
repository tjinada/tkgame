import { GameScreen } from './components/layout/GameScreen'
import { MainMenu } from './components/menu/MainMenu'
import { SlideshowBackground } from './components/visuals/SlideshowBackground'
import { useGameState } from './hooks/useGameState'

function App() {
  const gameState = useGameState()
  const { isInitialized, isGameRunning, startNewGame, continueGame, loadGame } = gameState

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">Loading...</p>
        </div>
      </div>
    )
  }

  // Show main menu if game not running
  if (!isGameRunning) {
    return (
      <div className="min-h-screen bg-background-primary text-white">
        <SlideshowBackground />
        <MainMenu
          onStartNewGame={startNewGame}
          onLoadGame={loadGame}
          onContinue={continueGame}
        />
      </div>
    )
  }

  // Show game screen
  return (
    <div className="min-h-screen bg-background-primary text-white">
      <GameScreen gameState={gameState} />
    </div>
  )
}

export default App
