import { Header } from './Header'
import { SplitLayout } from './SplitLayout'
import { Dashboard } from '../game/Dashboard'
import { NarrativePanel } from '../game/NarrativePanel'
import { ChoicePanel } from '../game/ChoicePanel'
import { DiceModal } from '../game/DiceModal'
import { SlideshowBackground } from '../visuals/SlideshowBackground'
import { CharacterPortrait } from '../visuals/CharacterPortrait'
import { BodyPartDisplay } from '../visuals/BodyPartDisplay'

export function GameScreen({ gameState }) {
  const { 
    chapter, 
    turn, 
    currentScene,
    currentNpc, 
    currentLocation,
    npcs,
    isLoading,
    pendingRoll,
    clearPendingRoll,
    processChoice,
    processCustomAction,
    getToneStyles,
    streamingContent,
  } = gameState

  // Find current NPC data
  const currentNpcData = npcs?.find(n => n.id === currentNpc)

  // Determine what visual to show based on scene
  const showBodyPart = currentScene?.bodyPart != null
  const currentBodyPart = currentScene?.bodyPart
  const currentEmotion = currentScene?.npcEmotion || 'neutral'

  // Get tone styles for narrative
  const toneStyles = getToneStyles()

  // Handle choice selection
  const handleChoiceSelect = async (choiceId) => {
    await processChoice(choiceId)
  }

  // Handle custom action
  const handleCustomAction = async (actionText) => {
    await processCustomAction(actionText)
  }

  // Left panel content
  const leftContent = (
    <>
      {/* Visual display - Portrait or Body Part */}
      <div className="relative">
        {showBodyPart && currentBodyPart ? (
          <BodyPartDisplay
            npcId={currentNpc}
            bodyPart={currentBodyPart}
            npcName={currentNpcData?.name}
          />
        ) : (
          <CharacterPortrait
            npcId={currentNpc}
            emotion={currentEmotion}
            npcName={currentNpcData?.name}
            showLabel={true}
          />
        )}
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
        <NarrativePanel 
          scene={currentScene}
          toneStyles={toneStyles}
          isLoading={isLoading}
          streamingContent={streamingContent}
        />
      </div>

      {/* Choice Panel */}
      <ChoicePanel 
        choices={currentScene?.choices || []}
        onChoiceSelect={handleChoiceSelect}
        onCustomAction={handleCustomAction}
        disabled={isLoading || !!streamingContent}
        isLoading={isLoading}
      />
    </>
  )

  return (
    <div className="relative flex flex-col h-screen">
      {/* Slideshow Background */}
      <SlideshowBackground />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-full">
        <Header chapter={chapter} turn={turn} />
        <SplitLayout left={leftContent} right={rightContent} />
      </div>

      {/* Dice Roll Modal */}
      <DiceModal
        isOpen={pendingRoll !== null}
        rollResult={pendingRoll}
        onClose={clearPendingRoll}
        autoCloseDelay={3000}
      />
    </div>
  )
}

export default GameScreen
