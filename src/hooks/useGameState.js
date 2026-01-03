import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { GameEngine } from '../engine/GameEngine'
import { CommandManager } from '../engine/CommandManager'
import { saveSystem } from '../engine/SaveSystem'
import { progressionSystem } from '../engine/ProgressionSystem'
import npcsData from '../data/npcs.json'
import configData from '../data/config.json'

/**
 * Remove consecutive duplicate lines and sentences from content
 */
function removeDuplicates(content) {
  if (!content) return ''
  
  // Remove consecutive duplicate lines
  const lines = content.split('\n')
  const dedupedLines = []
  let lastLine = null
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && trimmed !== lastLine) {
      dedupedLines.push(line)
      lastLine = trimmed
    } else if (!trimmed && lastLine !== '') {
      dedupedLines.push(line)
      lastLine = ''
    }
  }
  
  // Remove duplicate sentences within lines
  const finalLines = dedupedLines.map(line => {
    if (!line.trim()) return line
    const sentences = line.split(/(?<=[.!?])\s+/)
    const seen = new Set()
    const unique = []
    for (const s of sentences) {
      const norm = s.trim().toLowerCase()
      if (norm && !seen.has(norm)) {
        seen.add(norm)
        unique.push(s)
      }
    }
    return unique.join(' ')
  })
  
  return finalLines.join('\n')
}

/**
 * Extract just the description content from streaming JSON response
 * This allows us to display narrative text cleanly during streaming
 * without showing raw JSON structure
 */
function extractDescriptionFromStreaming(content) {
  if (!content) return ''
  
  // If it doesn't look like JSON at all, return as-is
  if (!content.includes('"description"') && !content.includes('{')) {
    return content
  }
  
  // Try to extract the description field value
  // Pattern: "description": "content here
  const descMatch = content.match(/"description"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:npc|location|choices|bodyPart|npcEmotion|statChanges|affinityChanges)"|$)/)
  
  if (descMatch && descMatch[1]) {
    // Unescape JSON string escapes
    let desc = descMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
    
    // Remove trailing incomplete escape sequences or quotes
    desc = desc.replace(/\\$/, '')
    
    return desc
  }
  
  // If we can see JSON structure but can't extract description,
  // it might be incomplete - return empty or a loading indicator
  if (content.trim().startsWith('{') && content.includes('"description"')) {
    // Try a more lenient extraction - just get what's after "description":
    const simpleMatch = content.match(/"description"\s*:\s*"([\s\S]*)/)
    if (simpleMatch && simpleMatch[1]) {
      let desc = simpleMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
      
      // Remove any trailing JSON that leaked through
      const jsonEndPatterns = [
        /"\s*,\s*"npc"[\s\S]*$/,
        /"\s*,\s*"location"[\s\S]*$/,
        /"\s*,\s*"choices"[\s\S]*$/,
        /"\s*,\s*"bodyPart"[\s\S]*$/,
        /"\s*,\s*"npcEmotion"[\s\S]*$/,
        /"\s*,\s*"statChanges"[\s\S]*$/,
        /"\s*,\s*"affinityChanges"[\s\S]*$/,
        /"\s*\}\s*$/,
      ]
      
      for (const pattern of jsonEndPatterns) {
        desc = desc.replace(pattern, '')
      }
      
      // Clean up trailing partial content
      desc = desc.replace(/"\s*$/, '')
      
      return desc
    }
  }
  
  // Fallback: if content looks like plain JSON object, don't show it
  if (content.trim().startsWith('{') && !content.includes('*')) {
    return '' // Still parsing JSON, wait for description
  }
  
  return content
}

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
  const [progression, setProgression] = useState(null)
  const [lastMilestone, setLastMilestone] = useState(null)
  const [lastStageAdvance, setLastStageAdvance] = useState(null)

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
      // Try to extract just the description from JSON-like content during streaming
      const cleanedContent = extractDescriptionFromStreaming(fullContent)
      // Remove any duplicate lines/sentences that may have appeared during streaming
      const dedupedContent = removeDuplicates(cleanedContent)
      setStreamingContent(dedupedContent)
    })

    // Progression event subscriptions
    engine.onProgressionUpdate((results) => {
      if (results) {
        // Fetch fresh progression data
        refreshProgression()
      }
    })

    engine.onMilestoneCompleted((milestone) => {
      setLastMilestone(milestone)
      // Auto-clear after 5 seconds
      setTimeout(() => setLastMilestone(null), 5000)
    })

    engine.onStageAdvanced((stageInfo) => {
      setLastStageAdvance(stageInfo)
      // Auto-clear after 5 seconds
      setTimeout(() => setLastStageAdvance(null), 5000)
    })

    setIsInitialized(true)

    return () => {
      saveSystem.disableAutoSave()
    }
  }, [])

  const npcs = useMemo(() => npcsData.npcs, [])
  const statConfigs = useMemo(() => configData.stats, [])

  // Refresh progression data from backend
  const refreshProgression = useCallback(async () => {
    if (!gameEngineRef.current) return
    const saveSlotId = gameEngineRef.current.stateManager.getSaveSlotId()
    if (!saveSlotId) return
    
    try {
      const prog = await progressionSystem.getProgression()
      setProgression(prog)
    } catch (error) {
      console.warn('Failed to fetch progression:', error)
    }
  }, [])

  // Game actions
  const startNewGame = useCallback(async () => {
    if (!gameEngineRef.current) return
    
    setIsLoading(true)
    setStreamingContent('')
    try {
      await gameEngineRef.current.startNewGame()
      setIsGameRunning(true)
      setState(gameEngineRef.current.getState())
      
      // Fetch initial progression
      await refreshProgression()
      
      // Enable auto-save
      saveSystem.enableAutoSave(60000, () => gameEngineRef.current.getState())
    } finally {
      setIsLoading(false)
    }
  }, [refreshProgression])

  // Start a specific scenario by ID
  const startScenario = useCallback(async (scenarioId) => {
    if (!gameEngineRef.current) return
    
    setIsLoading(true)
    setStreamingContent('')
    try {
      await gameEngineRef.current.startScenarioById(scenarioId)
      setIsGameRunning(true)
      setState(gameEngineRef.current.getState())
      
      // Fetch initial progression
      await refreshProgression()
      
      // Enable auto-save
      saveSystem.enableAutoSave(60000, () => gameEngineRef.current.getState())
    } finally {
      setIsLoading(false)
    }
  }, [refreshProgression])

  // Start with a scenario object directly
  const startWithScenario = useCallback(async (scenarioData) => {
    if (!gameEngineRef.current) return
    
    setIsLoading(true)
    setStreamingContent('')
    try {
      await gameEngineRef.current.startWithScenario(scenarioData)
      setIsGameRunning(true)
      setState(gameEngineRef.current.getState())
      
      // Fetch initial progression
      await refreshProgression()
      
      // Enable auto-save
      saveSystem.enableAutoSave(60000, () => gameEngineRef.current.getState())
    } finally {
      setIsLoading(false)
    }
  }, [refreshProgression])

  // Start a new AI-only game (no JSON scenario)
  const startAIOnlyGame = useCallback(async () => {
    if (!gameEngineRef.current) return
    
    setIsLoading(true)
    setStreamingContent('')
    try {
      await gameEngineRef.current.startAIOnlyGame()
      setIsGameRunning(true)
      setState(gameEngineRef.current.getState())
      
      // Fetch initial progression
      await refreshProgression()
      
      // Enable auto-save
      saveSystem.enableAutoSave(60000, () => gameEngineRef.current.getState())
    } finally {
      setIsLoading(false)
    }
  }, [refreshProgression])

  // Get available scenarios from localStorage
  const getAvailableScenarios = useCallback(() => {
    if (!gameEngineRef.current) return []
    return gameEngineRef.current.getAvailableScenarios()
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
        
        // Fetch progression
        await refreshProgression()
        
        saveSystem.enableAutoSave(60000, () => gameEngineRef.current.getState())
      }
      return result
    } finally {
      setIsLoading(false)
    }
  }, [refreshProgression])

  const loadGame = useCallback(async (slotId) => {
    if (!commandManagerRef.current) return
    
    setIsLoading(true)
    setStreamingContent('')
    try {
      const result = await commandManagerRef.current.executeCommand('load', { slotId })
      if (result.success) {
        setIsGameRunning(true)
        setState(gameEngineRef.current.getState())
        
        // Fetch progression
        await refreshProgression()
        
        saveSystem.enableAutoSave(60000, () => gameEngineRef.current.getState())
      }
      return result
    } finally {
      setIsLoading(false)
    }
  }, [refreshProgression])

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
      
      // Handle END scene
      if (result.isEnd) {
        // Could show a summary screen, for now just stop the game
        // You can customize this behavior
      }
      
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

    // Progression
    progression,
    lastMilestone,
    lastStageAdvance,

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
    startAIOnlyGame,
    startScenario,
    startWithScenario,
    getAvailableScenarios,
    continueGame,
    loadGame,
    saveGame,
    stopGame,
    processChoice,
    processCustomAction,
    clearPendingRoll,
    clearLastEvent,
    refreshProgression,

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
