import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/Button'
import { saveSystem } from '../../engine/SaveSystem'

export function MainMenu({ onStartNewGame, onLoadGame, onContinue }) {
  const [view, setView] = useState('main') // 'main' | 'load' | 'saves'
  const [saves, setSaves] = useState(() => saveSystem.listSaves())
  const [selectedSlot, setSelectedSlot] = useState(null)

  const hasSaves = saves.length > 0
  const hasAutoSave = saveSystem.hasSave('auto')

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
