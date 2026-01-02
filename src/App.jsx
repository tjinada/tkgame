import { GameScreen } from './components/layout/GameScreen'
import { useGameState } from './hooks/useGameState'

function App() {
  const gameState = useGameState()

  return (
    <div className="min-h-screen bg-background-primary text-white">
      <GameScreen gameState={gameState} />
    </div>
  )
}

export default App
