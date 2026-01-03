import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/Button'
import { saveSystem } from '../../engine/SaveSystem'
import { Settings, ChevronLeft, Play, FileJson, Sparkles } from 'lucide-react'

const SCENARIOS_KEY = 'fd-scenarios'

export function MainMenu({ 
  onStartNewGame,
  onStartAIGame,
  onStartScenario,
  getAvailableScenarios,
  onLoadGame, 
  onContinue, 
  onAdminClick 
}) {
  const [view, setView] = useState('main') // 'main' | 'load' | 'scenarios'
  const [saves, setSaves] = useState(() => saveSystem.listSaves())
  const [scenarios, setScenarios] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)

  const hasSaves = saves.length > 0
  const hasAutoSave = saveSystem.hasSave('auto')

  // Load scenarios from localStorage
  useEffect(() => {
    if (view === 'scenarios') {
      try {
        const stored = localStorage.getItem(SCENARIOS_KEY)
        const parsed = stored ? JSON.parse(stored) : []
        setScenarios(parsed)
      } catch {
        setScenarios([])
      }
    }
  }, [view])

  const refreshSaves = () => {
    setSaves(saveSystem.listSaves())
  }

  const handleLoadSave = (slotId) => {
    onLoadGame(slotId)
  }

  const handleDeleteSave = (slotId) => {
    saveSystem.delete(slotId)
    refreshSaves()
    setSelectedSlot(null)
  }

  const handleSelectScenario = (scenario) => {
    if (onStartScenario) {
      onStartScenario(scenario)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {/* Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
            linear-gradient(to bottom, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)
          `,
        }}
      />

      {/* Admin Button - Top Right */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onAdminClick}
        className="absolute top-6 right-6 p-3 rounded-lg bg-background-tertiary/50 hover:bg-background-tertiary border border-background-elevated transition-colors text-text-muted hover:text-text-primary"
        title="Admin Panel"
      >
        <Settings size={20} />
      </motion.button>

      {/* Decorative chains */}
      <div className="absolute top-0 left-1/4 w-px h-32 bg-gradient-to-b from-accent-primary/30 to-transparent" />
      <div className="absolute top-0 right-1/4 w-px h-48 bg-gradient-to-b from-accent-primary/20 to-transparent" />
      <div className="absolute top-0 left-1/3 w-px h-24 bg-gradient-to-b from-accent-secondary/20 to-transparent" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center"
      >
        <AnimatePresence mode="wait">
          {view === 'main' && (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <div className="text-6xl mb-4">⛓️</div>
                <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-2">
                  Fetish Dominion
                </h1>
                <p className="text-xl text-accent-primary/80 font-narrative italic">
                  The Infinite Slave Saga
                </p>
              </motion.div>

              {/* Menu Buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-4 max-w-xs mx-auto"
              >
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={onStartNewGame}
                >
                  Start New Game
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={onStartAIGame}
                >
                  <Sparkles size={18} className="mr-2" />
                  Start AI Game
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => setView('scenarios')}
                >
                  <FileJson size={18} className="mr-2" />
                  Select Scenario
                </Button>

                {hasAutoSave && (
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    onClick={onContinue}
                  >
                    Continue
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    refreshSaves()
                    setView('load')
                  }}
                  disabled={!hasSaves}
                >
                  Load Game
                </Button>
              </motion.div>

              {/* Version */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-12 text-xs text-text-muted"
              >
                Version 1.0 • Adult Content
              </motion.p>
            </motion.div>
          )}

          {view === 'scenarios' && (
            <motion.div
              key="scenarios"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-[450px]"
            >
              <h2 className="text-2xl font-bold text-text-primary mb-6">Select Scenario</h2>

              {/* Scenario List */}
              <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto">
                {scenarios.length === 0 ? (
                  <div className="text-text-muted py-8">
                    <FileJson size={48} className="mx-auto mb-3 opacity-30" />
                    <p>No scenarios loaded</p>
                    <p className="text-sm text-text-muted/60 mt-2">
                      Use the Admin Panel to upload scenario JSON files
                    </p>
                  </div>
                ) : (
                  scenarios.map((scenario) => (
                    <motion.div
                      key={scenario.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 rounded-lg border bg-background-tertiary border-background-elevated hover:border-accent-primary/50 transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <div className="text-left">
                          <p className="font-medium text-text-primary">{scenario.name}</p>
                          <p className="text-sm text-text-muted">
                            {scenario.scenes?.length || 0} scenes
                            {scenario.chapter && ` • Chapter ${scenario.chapter}`}
                          </p>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSelectScenario(scenario)}
                        >
                          <Play size={14} className="mr-1" />
                          Play
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Back Button */}
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setView('main')}
              >
                <ChevronLeft size={18} className="mr-1" />
                Back
              </Button>
            </motion.div>
          )}

          {view === 'load' && (
            <motion.div
              key="load"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-[400px]"
            >
              <h2 className="text-2xl font-bold text-text-primary mb-6">Load Game</h2>

              {/* Save Slots */}
              <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto">
                {saves.length === 0 ? (
                  <p className="text-text-muted py-8">No saved games found</p>
                ) : (
                  saves.map((save) => (
                    <motion.div
                      key={save.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`
                        p-4 rounded-lg border cursor-pointer transition-all
                        ${selectedSlot === save.id 
                          ? 'bg-accent-primary/20 border-accent-primary' 
                          : 'bg-background-tertiary border-background-elevated hover:border-accent-primary/50'
                        }
                      `}
                      onClick={() => setSelectedSlot(save.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="text-left">
                          <p className="font-medium text-text-primary">{save.name}</p>
                          <p className="text-sm text-text-muted">{save.preview}</p>
                        </div>
                        <span className="text-xs text-text-muted">
                          {formatDate(save.timestamp)}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setView('main')
                    setSelectedSlot(null)
                  }}
                >
                  Back
                </Button>
                
                {selectedSlot && (
                  <>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteSave(selectedSlot)}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => handleLoadSave(selectedSlot)}
                    >
                      Load
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default MainMenu
