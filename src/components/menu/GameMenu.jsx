import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { 
  Play, Save, FolderOpen, Home, X, 
  Trash2, Clock, MapPin 
} from 'lucide-react'

export function GameMenu({ 
  isOpen, 
  onClose, 
  onResume,
  onSave,
  onLoad,
  onMainMenu,
  saves = [],
  currentChapter,
  currentTurn,
  currentLocation,
}) {
  const [view, setView] = useState('main') // main, save, load
  const [saveName, setSaveName] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)

  const handleSave = () => {
    if (selectedSlot !== null) {
      onSave(selectedSlot, saveName || `Save ${selectedSlot + 1}`)
      setView('main')
      setSaveName('')
      setSelectedSlot(null)
    }
  }

  const handleLoad = () => {
    if (selectedSlot !== null && saves[selectedSlot]) {
      onLoad(selectedSlot)
      onClose()
    }
  }

  const handleMainMenu = () => {
    if (confirm('Return to main menu? Unsaved progress will be lost.')) {
      onMainMenu()
      onClose()
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleString()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Menu */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md bg-background-secondary border border-background-elevated rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-background-tertiary text-center relative">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                {view === 'main' ? 'Game Paused' : view === 'save' ? 'Save Game' : 'Load Game'}
              </h2>
              
              {view === 'main' && (
                <div className="flex items-center justify-center gap-4 text-sm text-text-muted">
                  <span>Chapter {currentChapter}</span>
                  <span>•</span>
                  <span>Turn {currentTurn}</span>
                  {currentLocation && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {currentLocation.replace(/_/g, ' ')}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {view === 'main' && (
                <div className="space-y-3">
                  <Button 
                    variant="primary" 
                    className="w-full justify-center py-3"
                    onClick={() => { onResume(); onClose(); }}
                  >
                    <Play size={18} className="mr-2" />
                    Resume Game
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    className="w-full justify-center py-3"
                    onClick={() => setView('save')}
                  >
                    <Save size={18} className="mr-2" />
                    Save Game
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    className="w-full justify-center py-3"
                    onClick={() => setView('load')}
                  >
                    <FolderOpen size={18} className="mr-2" />
                    Load Game
                  </Button>
                  
                  <div className="pt-3 border-t border-background-tertiary">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-center py-3 text-text-muted hover:text-accent-danger"
                      onClick={handleMainMenu}
                    >
                      <Home size={18} className="mr-2" />
                      Main Menu
                    </Button>
                  </div>
                </div>
              )}

              {(view === 'save' || view === 'load') && (
                <div className="space-y-4">
                  {/* Back button */}
                  <button
                    onClick={() => {
                      setView('main')
                      setSelectedSlot(null)
                      setSaveName('')
                    }}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors"
                  >
                    ← Back
                  </button>

                  {/* Save slots */}
                  <div className="space-y-2">
                    {[0, 1, 2, 3, 4].map(slot => {
                      const save = saves[slot]
                      const isSelected = selectedSlot === slot
                      
                      return (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`
                            w-full p-4 rounded-lg border text-left transition-all
                            ${isSelected 
                              ? 'bg-accent-primary/10 border-accent-primary' 
                              : 'bg-background-tertiary/50 border-background-elevated hover:border-text-muted'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-text-primary">
                                {save ? save.name : `Empty Slot ${slot + 1}`}
                              </p>
                              {save && (
                                <p className="text-sm text-text-muted mt-1">
                                  Chapter {save.chapter}, Turn {save.turn}
                                </p>
                              )}
                            </div>
                            {save && (
                              <div className="text-right">
                                <p className="text-xs text-text-muted flex items-center gap-1">
                                  <Clock size={12} />
                                  {formatDate(save.timestamp)}
                                </p>
                              </div>
                            )}
                          </div>
                          {save?.preview && (
                            <p className="text-xs text-text-muted/60 mt-2 truncate">
                              {save.preview}
                            </p>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Save name input (save mode only) */}
                  {view === 'save' && selectedSlot !== null && (
                    <Input
                      label="Save Name"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder={`Save ${selectedSlot + 1}`}
                    />
                  )}

                  {/* Action button */}
                  <Button
                    variant="primary"
                    className="w-full justify-center"
                    disabled={selectedSlot === null || (view === 'load' && !saves[selectedSlot])}
                    onClick={view === 'save' ? handleSave : handleLoad}
                  >
                    {view === 'save' ? (
                      <>
                        <Save size={16} className="mr-2" />
                        {saves[selectedSlot] ? 'Overwrite Save' : 'Save Game'}
                      </>
                    ) : (
                      <>
                        <FolderOpen size={16} className="mr-2" />
                        Load Game
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default GameMenu
