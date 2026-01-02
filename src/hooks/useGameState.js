import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { GameEngine } from '../engine/GameEngine'
import { CommandManager } from '../engine/CommandManager'
import { saveSystem } from '../engine/SaveSystem'
import npcsData from '../data/npcs.json'
import configData from '../data/config.json'

export function useGameState() {
  const gameEngineRef = useRef(null)
  const commandManagerRef = useRef(null)
  
  const [isInitialized, setIsInitialized] = useState(false)
  const [isGameRunning, setIsGameRunning] = useState(false)
  const [state, setState] = useState(null)
  const [currentScene, setCurrentScene] = useState(null)
  const [pendingRoll, setPendingRoll] = useState(null)
  const [lastEvent, setLastEvent] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  // Initialize game engine
  useEffect(() => {
    const engine = new GameEngine()
    gameEngineRef.current = engine
    commandManagerRef.current = new CommandManager(engine)

    // Subscribe to engine events
    engine.onStateChange((newState) => {
      setState(newState)
    })

    engine.onSceneChange((scene) => {
      setCurrentScene(scene)
      setStreamingContent('') // Clear streaming content when scene changes
    })

    engine.onDiceRoll((roll) => {
      setPendingRoll(roll)
    })

    engine.onEventTrigger((event) => {
      setLastEvent(event)
    })

    engine.onStreamChunk(({ delta, fullContent }) => {
      setStreamingContent(fullContent)
    })

    setIsInitialized(true)

    return () => {
      saveSystem.disableAutoSave()
    }
  }, [])

  const npcs = useMemo(() => npcsData.npcs, [])
  const statConfigs = useMemo(() => configData.stats, [])

  // Game actions
  const startNewGame = useCallback(async () => {
    if (!gameEngineRef.current) return
    
    setIsLoading(true)
    setStreamingContent('')
    try {
      await gameEngineRef.current.startNewGame()
      setIsGameRunning(true)
      setState(gameEngineRef.current.getState())
      
      // Enable auto-save
      saveSystem.enableAutoSave(60000, () => gameEngineRef.current.getState())
    } finally {
      setIsLoading(false)
    }
  }, [])

  const continueGame = useCallback(async () => {
    if (!commandManagerRef.current) return
    
    setIsLoading(true)
    setStreamingContent('')
    try {
      const result = await commandManagerRef.current.executeCommand('continue')
      if (result.success) {
        setIsGameRunning(true)
        setState(gameEngineRef.current.getState())
        saveSystem.enableAutoSave(60000, () => gameEngineRef.current.getState())
      }
      return result
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadGame = useCallback(async (slotId) => {
    if (!commandManagerRef.current) return
    
    setIsLoading(true)
    setStreamingContent('')
    try {
      const result = await commandManagerRef.current.executeCommand('load', { slotId })
      if (result.success) {
        setIsGameRunning(true)
        setState(gameEngineRef.current.getState())
        saveSystem.enableAutoSave(60000, () => gameEngineRef.current.getState())
      }
      return result
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveGame = useCallback((slotId, name) => {
    if (!commandManagerRef.current) return
    return commandManagerRef.current.executeCommand('save', { slotId, name })
  }, [])

  const stopGame = useCallback(() => {
    saveSystem.disableAutoSave()
    setIsGameRunning(false)
    setCurrentScene(null)
    setStreamingContent('')
    setPendingRoll(null)
    setLastEvent(null)
  }, [])

  const processChoice = useCallback(async (choiceId) => {
    if (!gameEngineRef.current || !isGameRunning) return null
    
    setIsLoading(true)
    setStreamingContent('')
    try {
      const result = await gameEngineRef.current.processChoice(choiceId)
      return result
    } finally {
      setIsLoading(false)
    }
  }, [isGameRunning])

  const processCustomAction = useCallback(async (actionText) => {
    if (!gameEngineRef.current || !isGameRunning) return null
    
    setIsLoading(true)
    setStreamingContent('')
    try {
      const result = await gameEngineRef.current.processCustomAction(actionText)
      return result
    } finally {
      setIsLoading(false)
    }
  }, [isGameRunning])

  const clearPendingRoll = useCallback(() => {
    setPendingRoll(null)
  }, [])

  const clearLastEvent = useCallback(() => {
    setLastEvent(null)
  }, [])

  // Convenience getters
  const getStat = useCallback((name) => {
    return state?.stats?.[name] ?? 0
  }, [state])

  const getAffinity = useCallback((npcId) => {
    return state?.affinities?.[npcId] ?? 0
  }, [state])

  const getAffinityTier = useCallback((npcId) => {
    if (!gameEngineRef.current) return null
    return gameEngineRef.current.stateManager.getAffinityTier(npcId)
  }, [])

  const getToneStyles = useCallback(() => {
    if (!gameEngineRef.current) return {}
    return gameEngineRef.current.getToneStyles()
  }, [])

  const getSaves = useCallback(() => {
    return saveSystem.listSaves()
  }, [])

  // Get full state for admin panel
  const getFullState = useCallback(() => {
    if (!gameEngineRef.current) return null
    return gameEngineRef.current.getState()
  }, [])

  // Set full state from admin panel (cheats)
  const setFullState = useCallback((newState) => {
    if (!gameEngineRef.current || !newState) return
    
    // Update state manager directly
    const stateManager = gameEngineRef.current.stateManager
    
    if (newState.stats) {
      Object.entries(newState.stats).forEach(([stat, value]) => {
        const currentValue = stateManager.getStat(stat)
        const delta = value - currentValue
        if (delta !== 0) {
          stateManager.modifyStat(stat, delta)
        }
      })
    }
    
    if (newState.affinities) {
      Object.entries(newState.affinities).forEach(([npc, value]) => {
        const currentValue = stateManager.getAffinity(npc)
        const delta = value - currentValue
        if (delta !== 0) {
          stateManager.modifyAffinity(npc, delta)
        }
      })
    }
    
    if (newState.chapter !== undefined) {
      stateManager.state.chapter = newState.chapter
    }
    
    if (newState.turn !== undefined) {
      stateManager.state.turn = newState.turn
    }
    
    if (newState.currentScene !== undefined) {
      stateManager.state.currentScene = newState.currentScene
    }
    
    if (newState.currentNpc !== undefined) {
      stateManager.state.currentNpc = newState.currentNpc
    }
    
    if (newState.currentLocation !== undefined) {
      stateManager.state.currentLocation = newState.currentLocation
    }
    
    if (newState.activeTone !== undefined) {
      stateManager.state.activeTone = newState.activeTone
    }
    
    if (newState.flags) {
      stateManager.state.flags = { ...newState.flags }
    }
    
    // Trigger state update
    setState({ ...stateManager.state })
  }, [])

  return {
    // State
    isInitialized,
    isGameRunning,
    isLoading,
    
    // Current state values
    stats: state?.stats || {},
    affinities: state?.affinities || {},
    chapter: state?.chapter || 1,
    turn: state?.turn || 0,
    currentScene,
    currentNpc: state?.currentNpc,
    currentLocation: state?.currentLocation,
    activeTone: state?.activeTone || 'Neutral',
    perks: state?.perks || [],
    scars: state?.scars || ['Fresh Meat'],

    // Streaming
    streamingContent,

    // Events
    pendingRoll,
    lastEvent,

    // Data
    npcs,
    statConfigs,

    // Actions
    startNewGame,
    continueGame,
    loadGame,
    saveGame,
    stopGame,
    processChoice,
    processCustomAction,
    clearPendingRoll,
    clearLastEvent,

    // Getters
    getStat,
    getAffinity,
    getAffinityTier,
    getToneStyles,
    getSaves,
    getFullState,
    setFullState,
  }
}

export default useGameState
