import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function DiceModal({ 
  isOpen, 
  rollResult, 
  onClose,
  autoCloseDelay = 3000,
}) {
  const [displayNumber, setDisplayNumber] = useState(1)
  const [phase, setPhase] = useState('rolling') // 'rolling' | 'result' | 'details'
  const [showModifiers, setShowModifiers] = useState(false)

  useEffect(() => {
    if (!isOpen || !rollResult) return

    setPhase('rolling')
    setShowModifiers(false)

    // Rolling animation - cycle through numbers
    let rollCount = 0
    const maxRolls = 15
    const rollInterval = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * 20) + 1)
      rollCount++
      
      if (rollCount >= maxRolls) {
        clearInterval(rollInterval)
        setDisplayNumber(rollResult.base)
        setPhase('result')
        
        // Show modifiers after a short delay
        setTimeout(() => {
          setShowModifiers(true)
          setPhase('details')
        }, 500)
      }
    }, 80)

    return () => clearInterval(rollInterval)
  }, [isOpen, rollResult])

  // Auto-close after delay
  useEffect(() => {
    if (phase === 'details' && autoCloseDelay > 0) {
      const timer = setTimeout(onClose, autoCloseDelay)
      return () => clearTimeout(timer)
    }
  }, [phase, autoCloseDelay, onClose])

  if (!rollResult) return null

  const isCritSuccess = rollResult.critical === 'success'
  const isCritFail = rollResult.critical === 'failure'
  const isSuccess = rollResult.success === true
  const isFailure = rollResult.success === false

  const getResultColor = () => {
    if (isCritSuccess) return 'text-yellow-400'
    if (isCritFail) return 'text-red-500'
    if (isSuccess) return 'text-green-400'
    if (isFailure) return 'text-red-400'
    return 'text-white'
  }

  const getGlowColor = () => {
    if (isCritSuccess) return 'rgba(250, 204, 21, 0.5)'
    if (isCritFail) return 'rgba(239, 68, 68, 0.5)'
    if (isSuccess) return 'rgba(74, 222, 128, 0.4)'
    if (isFailure) return 'rgba(248, 113, 113, 0.4)'
    return 'rgba(139, 92, 246, 0.3)'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative bg-background-secondary rounded-2xl p-8 min-w-[320px] border border-accent-primary/20"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: `0 0 60px ${getGlowColor()}`,
            }}
          >
            {/* D20 Icon */}
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🎲</div>
              <p className="text-sm text-text-muted uppercase tracking-wider">
                {phase === 'rolling' ? 'Rolling...' : 'D20 Roll'}
              </p>
            </div>

            {/* Main Number Display */}
            <motion.div
              className="text-center mb-6"
              animate={phase === 'rolling' ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.1, repeat: phase === 'rolling' ? Infinity : 0 }}
            >
              <span 
                className={`text-7xl font-bold font-mono ${getResultColor()}`}
                style={{
                  textShadow: phase !== 'rolling' ? `0 0 30px ${getGlowColor()}` : 'none',
                }}
              >
                {displayNumber}
              </span>
            </motion.div>

            {/* Modifiers */}
            <AnimatePresence>
              {showModifiers && rollResult.modifiers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2 mb-4"
                >
                  {rollResult.modifiers.map((mod, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="flex justify-between items-center text-sm px-4 py-2 bg-background-tertiary rounded-lg"
                    >
                      <span className="text-text-secondary capitalize">{mod.source}</span>
                      <span className={mod.value >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {mod.value >= 0 ? '+' : ''}{mod.value}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Total */}
            {showModifiers && rollResult.modifiers.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: rollResult.modifiers.length * 0.15 }}
                className="flex justify-between items-center text-lg font-semibold px-4 py-2 border-t border-background-tertiary mb-4"
              >
                <span className="text-text-primary">Total</span>
                <span className={getResultColor()}>{rollResult.total}</span>
              </motion.div>
            )}

            {/* DC and Result */}
            {showModifiers && rollResult.dc !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <p className="text-sm text-text-muted mb-2">
                  vs DC <span className="font-mono text-text-primary">{rollResult.dc}</span>
                </p>
                
                {/* Success/Failure Banner */}
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`
                    inline-block px-6 py-2 rounded-lg font-bold uppercase tracking-wider
                    ${isCritSuccess ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : ''}
                    ${isCritFail ? 'bg-red-500/20 text-red-400 border border-red-500/50' : ''}
                    ${isSuccess && !isCritSuccess ? 'bg-green-500/20 text-green-400 border border-green-500/50' : ''}
                    ${isFailure && !isCritFail ? 'bg-red-500/20 text-red-400 border border-red-500/50' : ''}
                  `}
                >
                  {isCritSuccess && '⭐ Critical Success! ⭐'}
                  {isCritFail && '💀 Critical Failure! 💀'}
                  {isSuccess && !isCritSuccess && '✓ Success'}
                  {isFailure && !isCritFail && '✗ Failure'}
                </motion.div>
              </motion.div>
            )}

            {/* Click to close hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-center text-xs text-text-muted mt-6"
            >
              Click anywhere to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default DiceModal
