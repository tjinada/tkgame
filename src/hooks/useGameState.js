import { useState, useEffect, useMemo } from 'react'
import { StateManager } from '../engine/StateManager'
import { DiceSystem } from '../engine/DiceSystem'
import npcsData from '../data/npcs.json'
import configData from '../data/config.json'

export function useGameState() {
  const [stateManager] = useState(() => new StateManager())
  const [diceSystem] = useState(() => new DiceSystem(stateManager))
  const [state, setState] = useState(() => stateManager.getState())

  useEffect(() => {
    const unsubscribe = stateManager.onStateChange((newState) => {
      setState(newState)
    })
    return unsubscribe
  }, [stateManager])

  const npcs = useMemo(() => npcsData.npcs, [])
  const statConfigs = useMemo(() => configData.stats, [])

  return {
    // Current state
    stats: state.stats,
    affinities: state.affinities,
    chapter: state.chapter,
    turn: state.turn,
    currentScene: state.currentScene,
    currentNpc: state.currentNpc,
    currentLocation: state.currentLocation,
    activeTone: state.activeTone,
    perks: state.perks,
    scars: state.scars,

    // Data
    npcs,
    statConfigs,

    // Managers
    stateManager,
    diceSystem,

    // Convenience methods
    getStat: (name) => stateManager.getStat(name),
    getAffinity: (npcId) => stateManager.getAffinity(npcId),
    getAffinityTier: (npcId) => stateManager.getAffinityTier(npcId),
    
    // Actions
    modifyStat: (name, delta) => stateManager.modifyStat(name, delta),
    modifyAffinity: (npcId, delta) => stateManager.modifyAffinity(npcId, delta),
    roll: (options) => diceSystem.roll(options),
    reset: () => stateManager.reset(),
  }
}

export default useGameState
