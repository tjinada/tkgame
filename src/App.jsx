import { useState } from 'react'
import { GameScreen } from './components/layout/GameScreen'
import { MainMenu } from './components/menu/MainMenu'
import { AdminPanel } from './components/admin/AdminPanel'
import { SlideshowBackground } from './components/visuals/SlideshowBackground'
import { useGameState } from './hooks/useGameState'

function App() {
  const gameState = useGameState()
  const { 
    isInitialized, 
    isGameRunning, 
    startNewGame, 
    continueGame, 
    loadGame,
    stopGame,
    getFullState,
    setFullState,
  } = gameState

  const [isAdminOpen, setIsAdminOpen] = useState(false)

  // Handle returning to main menu
  const handleMainMenu = () => {
    stopGame()
  }

  // Handle state changes from admin panel
  const handleStateChange = (newState) => {
    if (setFullState) {
      setFullState(newState)
    }
  }

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
      <div className="relative min-h-screen text-white">
        <SlideshowBackground />
        <MainMenu
          onStartNewGame={startNewGame}
          onLoadGame={loadGame}
          onContinue={continueGame}
          onAdminClick={() => setIsAdminOpen(true)}
        />
        
        {/* Admin Panel - accessible from main menu too */}
        <AdminPanel
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          gameState={getFullState?.()}
          onStateChange={handleStateChange}
        />
      </div>
    )
  }

  // Show game screen - NO bg-background-primary here, let slideshow show through
  return (
    <div className="relative min-h-screen text-white">
      <GameScreen 
        gameState={gameState}
        onAdminClick={() => setIsAdminOpen(true)}
        onMainMenu={handleMainMenu}
      />
      
      {/* Admin Panel */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        gameState={getFullState?.()}
        onStateChange={handleStateChange}
      />
    </div>
  )
}

export default App
