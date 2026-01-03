import { StateManager } from './StateManager'
import { DiceSystem } from './DiceSystem'
import { EventSystem } from './EventSystem'
import { ToneEngine } from './ToneEngine'
import { ContentRouter } from '../content/ContentRouter'
import { progressionSystem } from './ProgressionSystem.js'
import { debugLog } from '../components/admin/tabs/DebugTab'
import sampleScenario from '../data/scenarios/sample.json'

const SCENARIOS_KEY = 'fd-scenarios'

export class GameEngine {
  constructor(options = {}) {
    this.stateManager = options.stateManager || new StateManager()
    this.diceSystem = new DiceSystem(this.stateManager)
    this.eventSystem = new EventSystem(this.stateManager)
    this.toneEngine = new ToneEngine(this.stateManager)
    this.contentRouter = options.contentRouter || new ContentRouter()

    this.currentScene = null
    this.currentScenario = null
    this.isRunning = false
    this.listeners = {
      sceneChange: [],
      diceRoll: [],
      eventTrigger: [],
      stateChange: [],
      streamChunk: [],
      progressionUpdate: [],
      milestoneCompleted: [],
      stageAdvanced: [],
    }

    // Subscribe to state changes
    this.stateManager.onStateChange((state) => {
      this._emit('stateChange', state)
    })
  }

  /**
   * Get all available scenarios from localStorage
   * @returns {Array} List of scenario metadata
   */
  getAvailableScenarios() {
    try {
      const stored = localStorage.getItem(SCENARIOS_KEY)
      const scenarios = stored ? JSON.parse(stored) : []
      return scenarios.map(s => ({
        id: s.id,
        name: s.name,
        chapter: s.chapter,
        sceneCount: s.scenes?.length || 0,
        requires: s.requires || null,
      }))
    } catch {
      return []
    }
  }

  /**
   * Get a scenario by ID from localStorage
   * @param {string} scenarioId - The scenario ID
   * @returns {Object|null}
   */
  getScenarioById(scenarioId) {
    try {
      const stored = localStorage.getItem(SCENARIOS_KEY)
      const scenarios = stored ? JSON.parse(stored) : []
      return scenarios.find(s => s.id === scenarioId) || null
    } catch {
      return null
    }
  }

  /**
   * Check if player meets scenario entry requirements
   * @param {Object} requires - The requirements object
   * @returns {boolean}
   */
  checkRequirements(requires) {
    if (!requires) return true

    const state = this.stateManager.getState()

    // Check chapter requirement
    if (requires.chapter && state.chapter < requires.chapter) {
      return false
    }

    // Check stat requirements
    if (requires.stats) {
      for (const [stat, range] of Object.entries(requires.stats)) {
        const value = state.stats[stat] || 0
        if (range.min !== undefined && value < range.min) return false
        if (range.max !== undefined && value > range.max) return false
      }
    }

    // Check affinity requirements
    if (requires.affinities) {
      for (const [npc, range] of Object.entries(requires.affinities)) {
        const value = state.affinities[npc] || 0
        if (range.min !== undefined && value < range.min) return false
        if (range.max !== undefined && value > range.max) return false
      }
    }

    // Check flag requirements
    if (requires.flags) {
      for (const [flag, value] of Object.entries(requires.flags)) {
        if (state.flags[flag] !== value) return false
      }
    }

    // Check notFlags requirements
    if (requires.notFlags) {
      for (const flag of requires.notFlags) {
        if (state.flags[flag]) return false
      }
    }

    return true
  }

  /**
   * Filter choices based on showIf conditions
   * @param {Array} choices - The choices array
   * @returns {Array} Filtered choices
   */
  filterChoicesByConditions(choices) {
    if (!choices) return []
    
    const state = this.stateManager.getState()
    
    return choices.filter(choice => {
      if (!choice.showIf) return true
      
      const { stats, affinities, flags, notFlags } = choice.showIf
      
      // Check stat conditions
      if (stats) {
        for (const [stat, range] of Object.entries(stats)) {
          const value = state.stats[stat] || 0
          if (range.min !== undefined && value < range.min) return false
          if (range.max !== undefined && value > range.max) return false
        }
      }
      
      // Check affinity conditions
      if (affinities) {
        for (const [npc, range] of Object.entries(affinities)) {
          const value = state.affinities[npc] || 0
          if (range.min !== undefined && value < range.min) return false
          if (range.max !== undefined && value > range.max) return false
        }
      }
      
      // Check flag conditions
      if (flags) {
        for (const [flag, value] of Object.entries(flags)) {
          if (state.flags[flag] !== value) return false
        }
      }
      
      // Check notFlags conditions
      if (notFlags) {
        for (const flag of notFlags) {
          if (state.flags[flag]) return false
        }
      }
      
      return true
    })
  }

  /**
   * Start a new game with a specific scenario
   * @param {Object} scenarioData - The scenario JSON data
   * @param {string} saveSlotId - Optional save slot ID for progression tracking
   */
  async startWithScenario(scenarioData, saveSlotId = null) {
    this.stateManager.reset()
    this.eventSystem.clearHistory()
    
    // Initialize progression system
    const slotId = saveSlotId || `save_${Date.now()}`
    this.stateManager.setSaveSlotId(slotId)
    try {
      await this.stateManager.resetProgression(slotId)
      debugLog.game('Progression system initialized', { saveSlotId: slotId })
    } catch (error) {
      debugLog.error('Failed to initialize progression', error.message)
    }
    
    // Store current scenario reference
    this.currentScenario = scenarioData
    
    // Load the scenario into content router
    this.contentRouter.loadScenario(scenarioData)
    
    // Get the starting scene ID
    const startSceneId = scenarioData.startScene || scenarioData.scenes?.[0]?.id
    
    if (!startSceneId) {
      debugLog.error('No start scene found in scenario')
      return null
    }
    
    // Get the starting scene
    const startScene = await this.contentRouter.getSceneContent(startSceneId, this._getContext())
    
    if (startScene) {
      // Generate hybrid choices with scene context
      const { available, locked, sceneContext } = this.contentRouter.generateHybridChoices(
        this._getContext(),
        startScene.choices,
        startScene.description || ''
      )
      startScene.choices = available
      startScene.lockedChoices = locked
      startScene.sceneContext = sceneContext
      
      // Filter choices based on conditions
      startScene.choices = this.filterChoicesByConditions(startScene.choices)
      
      this.currentScene = startScene
      this.stateManager.setCurrentScene(startScene.id)
      this.stateManager.setCurrentLocation(startScene.location || 'main_hall')
      
      // Handle multi-NPC scenes
      if (startScene.npcs && startScene.npcs.length > 0) {
        this.stateManager.setCurrentNpc(startScene.npcs[0].id)
      } else if (startScene.npc) {
        this.stateManager.setCurrentNpc(startScene.npc)
      } else {
        this.stateManager.setCurrentNpc(null)
      }
      
      this.toneEngine.updateStateTone()
      this._emit('sceneChange', startScene)
    }

    this.isRunning = true
    debugLog.game('Game started with scenario', { 
      scenario: scenarioData.name, 
      scene: startScene?.id 
    })
    return startScene
  }

  /**
   * Start a new game with default sample scenario
   */
  async startNewGame() {
    return this.startWithScenario(sampleScenario)
  }

  /**
   * Start a new game with pure AI generation (no JSON scenarios)
   * @param {string} saveSlotId - Optional save slot ID for progression tracking
   */
  async startAIOnlyGame(saveSlotId = null) {
    this.stateManager.reset()
    this.eventSystem.clearHistory()
    
    // Initialize progression system
    const slotId = saveSlotId || `save_${Date.now()}`
    this.stateManager.setSaveSlotId(slotId)
    try {
      await this.stateManager.resetProgression(slotId)
      debugLog.game('Progression system initialized', { saveSlotId: slotId })
    } catch (error) {
      debugLog.error('Failed to initialize progression', error.message)
    }
    
    // Set content router to AI-only mode
    this.contentRouter.setMode('ai-only')
    
    // No scenario loaded
    this.currentScenario = null
    
    debugLog.game('Starting AI-only game')
    
    // Generate opening scene via AI
    const openingPrompt = this.contentRouter.promptBuilder.buildOpeningPrompt(this._getContext())
    
    const openingScene = await this.contentRouter.generateFromActionStreaming(
      openingPrompt,
      this._getContext(),
      (delta, fullContent) => this._emit('streamChunk', { delta, fullContent })
    )
    
    if (openingScene) {
      // Generate hybrid choices with scene context
      const { available, locked, sceneContext } = this.contentRouter.generateHybridChoices(
        this._getContext(),
        openingScene.choices,
        openingScene.description || ''
      )
      openingScene.choices = available
      openingScene.lockedChoices = locked
      openingScene.sceneContext = sceneContext
      
      openingScene.choices = this.filterChoicesByConditions(openingScene.choices)
      this.currentScene = openingScene
      this.stateManager.setCurrentScene(openingScene.id)
      this.stateManager.setCurrentLocation(openingScene.location || 'main_hall')
      
      if (openingScene.npc) {
        this.stateManager.setCurrentNpc(openingScene.npc)
      }
      
      this.toneEngine.updateStateTone()
      this._emit('sceneChange', openingScene)
    }
    
    this.isRunning = true
    debugLog.game('AI-only game started', { sceneId: openingScene?.id })
    return openingScene
  }

  /**
   * Start a game with a scenario from localStorage by ID
   * @param {string} scenarioId - The scenario ID
   */
  async startScenarioById(scenarioId) {
    const scenario = this.getScenarioById(scenarioId)
    if (!scenario) {
      debugLog.error('Scenario not found', { scenarioId })
      return null
    }
    return this.startWithScenario(scenario)
  }

  /**
   * Continue from saved state
   * @param {Object} savedState - The saved game state
   */
  async continueGame(savedState) {
    this.stateManager.deserialize(JSON.stringify(savedState))
    
    // Initialize progression system if we have a save slot ID
    const saveSlotId = savedState.saveSlotId || savedState.slotId
    if (saveSlotId) {
      this.stateManager.setSaveSlotId(saveSlotId)
      try {
        await this.stateManager.initializeProgression(saveSlotId)
        debugLog.game('Progression loaded', { saveSlotId })
      } catch (error) {
        debugLog.error('Failed to load progression', error.message)
      }
    }
    
    // Try to load the scenario that was being played
    const scenarioId = savedState.currentScenarioId
    if (scenarioId) {
      const scenario = this.getScenarioById(scenarioId)
      if (scenario) {
        this.currentScenario = scenario
        this.contentRouter.loadScenario(scenario)
      }
    }
    
    // Fallback to sample scenario if no scenario was stored
    if (!this.currentScenario) {
      this.contentRouter.loadScenario(sampleScenario)
    }
    
    // Restore current scene
    const sceneId = savedState.currentScene
    if (sceneId) {
      const scene = await this.contentRouter.getSceneContent(sceneId, this._getContext())
      if (scene) {
        // Generate hybrid choices with scene context
        const { available, locked, sceneContext } = this.contentRouter.generateHybridChoices(
          this._getContext(),
          scene.choices,
          scene.description || ''
        )
        scene.choices = available
        scene.lockedChoices = locked
        scene.sceneContext = sceneContext
        
        // Filter choices based on conditions
        scene.choices = this.filterChoicesByConditions(scene.choices)
        this.currentScene = scene
        this._emit('sceneChange', scene)
      }
    }

    this.isRunning = true
    debugLog.game('Game continued', { chapter: savedState.chapter, turn: savedState.turn })
    return this.currentScene
  }

  /**
   * Process a player choice
   * @param {string} choiceId - The ID of the chosen option
   * @returns {Promise<Object>} - Result with new scene, roll results, etc.
   */
  async processChoice(choiceId) {
    if (!this.isRunning || !this.currentScene) {
      return { error: 'Game not running' }
    }

    const choice = this.currentScene.choices?.find(c => c.id === choiceId)
    if (!choice) {
      return { error: 'Invalid choice' }
    }

    debugLog.game(`Choice selected: ${choice.text}`, { choiceId })

    const result = {
      choice,
      roll: null,
      event: null,
      statChanges: {},
      affinityChanges: {},
      newScene: null,
    }

    // Handle roll if required
    if (choice.rollRequired) {
      const rollResult = this.diceSystem.roll({
        dc: choice.rollRequired.dc,
        statModifier: choice.rollRequired.stat,
      })
      result.roll = rollResult
      this._emit('diceRoll', rollResult)
      debugLog.roll(rollResult)

      // Apply automatic roll effects
      this._applyRollEffects(rollResult, result)

      // Determine next scene based on roll
      if (rollResult.success) {
        result.nextSceneId = choice.rollRequired.successNext || choice.next
      } else {
        result.nextSceneId = choice.rollRequired.failureNext || choice.next
      }
    } else {
      result.nextSceneId = choice.next
    }

    // Apply stat changes from choice (in addition to roll effects)
    if (choice.statChanges) {
      for (const [stat, delta] of Object.entries(choice.statChanges)) {
        const newValue = this.stateManager.modifyStat(stat, delta)
        result.statChanges[stat] = result.statChanges[stat] || { delta: 0, newValue }
        result.statChanges[stat].delta += delta
        result.statChanges[stat].newValue = newValue
      }
    }

    // Apply affinity changes from choice (in addition to roll effects)
    if (choice.affinityChanges) {
      for (const [npc, delta] of Object.entries(choice.affinityChanges)) {
        const newValue = this.stateManager.modifyAffinity(npc, delta)
        result.affinityChanges[npc] = result.affinityChanges[npc] || { delta: 0, newValue }
        result.affinityChanges[npc].delta += delta
        result.affinityChanges[npc].newValue = newValue
      }
    }

    // Set flags from choice
    if (choice.flags) {
      for (const [flag, value] of Object.entries(choice.flags)) {
        this.stateManager.setFlag(flag, value)
      }
    }

    // Check for random event
    const event = this.eventSystem.checkForEvent()
    if (event) {
      result.event = event
      const eventChanges = this.eventSystem.applyEventEffects(event)
      result.eventChanges = eventChanges
      this._emit('eventTrigger', event)
      debugLog.event(event)
    }

    // Increment turn
    this.stateManager.incrementTurn()

    // Update tone
    this.toneEngine.updateStateTone()

    // Add to history with rich context for AI
    this.stateManager.addHistoryEntry({
      turn: this.stateManager.getState().turn,
      scene: this.currentScene.id,
      description: this.currentScene.description?.substring(0, 300),
      choice: choice.text,
      choiceType: choice.type || 'unknown',
      outcome: result.roll ? (result.roll.success ? 'success' : 'failure') : 'resolved',
      rolls: result.roll ? [result.roll] : [],
      statChanges: result.statChanges,
      affinityChanges: result.affinityChanges,
      // Rich context for progression tracking
      npc: this.currentScene.npc || this.stateManager.getState().currentNpc,
      location: this.currentScene.location || this.stateManager.getState().currentLocation,
      bodyPart: this.currentScene.bodyPart || null,
      sceneType: this._inferSceneType(this.currentScene),
    })

    // Process progression tracking
    const progressionResults = await this._processProgression(
      this.currentScene,
      choice,
      result.roll
    )
    if (progressionResults) {
      result.progression = progressionResults
    }

    // Handle END scene
    if (result.nextSceneId === 'END') {
      debugLog.game('Scenario ended')
      // Could trigger chapter summary, return to menu, etc.
      result.isEnd = true
      return result
    }

    // Get next scene
    if (result.nextSceneId) {
      const nextScene = await this.contentRouter.getSceneContent(result.nextSceneId, this._getContext())
      if (nextScene) {
        // Generate hybrid choices with scene context
        const { available, locked, sceneContext } = this.contentRouter.generateHybridChoices(
          this._getContext(),
          nextScene.choices,
          nextScene.description || ''
        )
        nextScene.choices = available
        nextScene.lockedChoices = locked
        nextScene.sceneContext = sceneContext
        
        // Filter choices based on conditions
        nextScene.choices = this.filterChoicesByConditions(nextScene.choices)
        
        this.currentScene = nextScene
        this.stateManager.setCurrentScene(nextScene.id)
        this.stateManager.setCurrentLocation(nextScene.location || this.stateManager.getState().currentLocation)
        
        // Handle multi-NPC scenes
        if (nextScene.npcs && nextScene.npcs.length > 0) {
          this.stateManager.setCurrentNpc(nextScene.npcs[0].id)
        } else if (nextScene.npc) {
          this.stateManager.setCurrentNpc(nextScene.npc)
        } else {
          this.stateManager.setCurrentNpc(null)
        }
        
        result.newScene = nextScene
        this._emit('sceneChange', nextScene)
      } else if (this.currentScenario?.scenes) {
        // Scene not found - check if AI fallback is allowed
        const currentSceneData = this.currentScenario.scenes.find(s => s.id === this.currentScene.id)
        if (currentSceneData?.allowAIFallback !== false) {
          // Generate AI continuation
          const nextScene = await this._generateWithStreaming(choice.text)
          if (nextScene) {
            // Generate hybrid choices with scene context
            const { available: hybridAvail, locked: hybridLocked, sceneContext } = this.contentRouter.generateHybridChoices(
              this._getContext(),
              nextScene.choices,
              nextScene.description || ''
            )
            nextScene.choices = hybridAvail
            nextScene.lockedChoices = hybridLocked
            nextScene.sceneContext = sceneContext
            
            nextScene.choices = this.filterChoicesByConditions(nextScene.choices)
            this.currentScene = nextScene
            this.stateManager.setCurrentScene(nextScene.id)
            if (nextScene.location) {
              this.stateManager.setCurrentLocation(nextScene.location)
            }
            if (nextScene.npc) {
              this.stateManager.setCurrentNpc(nextScene.npc)
            }
            result.newScene = nextScene
            this._emit('sceneChange', nextScene)
          }
        }
      }
    } else {
      // No next scene specified - generate AI continuation with streaming
      const nextScene = await this._generateWithStreaming(choice.text)
      if (nextScene) {
        // Generate hybrid choices with scene context
        const { available: hybridChoices, locked: hybridLocked, sceneContext } = this.contentRouter.generateHybridChoices(
          this._getContext(),
          nextScene.choices,
          nextScene.description || ''
        )
        nextScene.choices = hybridChoices
        nextScene.lockedChoices = hybridLocked
        nextScene.sceneContext = sceneContext
        
        nextScene.choices = this.filterChoicesByConditions(nextScene.choices)
        this.currentScene = nextScene
        this.stateManager.setCurrentScene(nextScene.id)
        if (nextScene.location) {
          this.stateManager.setCurrentLocation(nextScene.location)
        }
        if (nextScene.npc) {
          this.stateManager.setCurrentNpc(nextScene.npc)
        }
        result.newScene = nextScene
        this._emit('sceneChange', nextScene)
      }
    }

    return result
  }

  /**
   * Apply automatic effects from a dice roll
   * @param {Object} rollResult - The dice roll result
   * @param {Object} result - The choice result to update
   */
  _applyRollEffects(rollResult, result) {
    if (!rollResult.autoEffects) return

    const { statChanges, affinityChange } = rollResult.autoEffects
    const currentNpc = this.stateManager.getState().currentNpc

    // Apply automatic stat changes
    if (statChanges) {
      for (const [stat, delta] of Object.entries(statChanges)) {
        if (delta !== 0) {
          const newValue = this.stateManager.modifyStat(stat, delta)
          result.statChanges[stat] = { delta, newValue, fromRoll: true }
        }
      }
    }

    // Apply automatic affinity change to current NPC
    if (affinityChange !== 0 && currentNpc) {
      const newValue = this.stateManager.modifyAffinity(currentNpc, affinityChange)
      result.affinityChanges[currentNpc] = { delta: affinityChange, newValue, fromRoll: true }
    }

    // Set flag for critical failure (for narrative purposes)
    if (rollResult.critical === 'failure') {
      this.stateManager.setFlag('criticalFailure', true)
      this.stateManager.setFlag('lastCriticalFailureTurn', this.stateManager.getState().turn)
    } else {
      this.stateManager.setFlag('criticalFailure', false)
    }

    // Set flag for critical success
    if (rollResult.critical === 'success') {
      this.stateManager.setFlag('criticalSuccess', true)
      this.stateManager.setFlag('lastCriticalSuccessTurn', this.stateManager.getState().turn)
    } else {
      this.stateManager.setFlag('criticalSuccess', false)
    }
  }

  /**
   * Process a custom player action with streaming
   * @param {string} actionText - Free-form action text
   * @returns {Promise<Object>} - Result with new scene
   */
  async processCustomAction(actionText) {
    if (!this.isRunning) {
      return { error: 'Game not running' }
    }

    debugLog.game(`Custom action: ${actionText.substring(0, 50)}...`)

    // Increment turn
    this.stateManager.incrementTurn()

    // Add to history with rich context for AI
    this.stateManager.addHistoryEntry({
      turn: this.stateManager.getState().turn,
      scene: this.currentScene?.id,
      description: this.currentScene?.description?.substring(0, 300),
      choice: actionText,
      choiceType: 'custom',
      outcome: 'custom',
      rolls: [],
      statChanges: {},
      affinityChanges: {},
      // Rich context for progression tracking
      npc: this.currentScene?.npc || this.stateManager.getState().currentNpc,
      location: this.currentScene?.location || this.stateManager.getState().currentLocation,
      bodyPart: this.currentScene?.bodyPart || null,
      sceneType: this._inferSceneType(this.currentScene),
    })

    // Generate AI response with streaming
    const nextScene = await this._generateWithStreaming(actionText)
    
    // Process progression tracking for current scene before moving to next
    const progressionResults = await this._processProgression(
      this.currentScene,
      { text: actionText, type: 'custom' },
      null
    )
    
    if (nextScene) {
      // Generate hybrid choices with scene context
      const { available, locked, sceneContext } = this.contentRouter.generateHybridChoices(
        this._getContext(),
        nextScene.choices,
        nextScene.description || ''
      )
      nextScene.choices = available
      nextScene.lockedChoices = locked
      nextScene.sceneContext = sceneContext
      
      nextScene.choices = this.filterChoicesByConditions(nextScene.choices)
      this.currentScene = nextScene
      this.stateManager.setCurrentScene(nextScene.id)
      
      // Update location and NPC from AI response
      if (nextScene.location) {
        this.stateManager.setCurrentLocation(nextScene.location)
      }
      if (nextScene.npc) {
        this.stateManager.setCurrentNpc(nextScene.npc)
      }
      
      // Apply any stat/affinity changes from AI response
      if (nextScene.statChanges) {
        for (const [stat, delta] of Object.entries(nextScene.statChanges)) {
          this.stateManager.modifyStat(stat, delta)
        }
      }
      if (nextScene.affinityChanges) {
        for (const [npc, delta] of Object.entries(nextScene.affinityChanges)) {
          this.stateManager.modifyAffinity(npc, delta)
        }
      }

      this.toneEngine.updateStateTone()
      this._emit('sceneChange', nextScene)
    }

    return { newScene: nextScene, progression: progressionResults }
  }

  /**
   * Generate content with streaming support
   * @param {string} actionText - The action or prompt
   * @returns {Promise<Object>} - The generated scene
   */
  async _generateWithStreaming(actionText) {
    debugLog.api('Generating content', { action: actionText.substring(0, 50) })
    
    try {
      const result = await this.contentRouter.generateFromActionStreaming(
        actionText,
        this._getContext(),
        (delta, fullContent) => {
          this._emit('streamChunk', { delta, fullContent })
        }
      )
      debugLog.api('Content generated', { sceneId: result?.id })
      return result
    } catch (error) {
      debugLog.error('Content generation failed', error.message)
      throw error
    }
  }

  /**
   * Get current scene
   */
  getCurrentScene() {
    return this.currentScene
  }

  /**
   * Get available choices (already filtered)
   */
  getAvailableChoices() {
    return this.currentScene?.choices || []
  }

  /**
   * Check if a choice requires a roll
   */
  isRollRequired(choiceId) {
    const choice = this.currentScene?.choices?.find(c => c.id === choiceId)
    return choice?.rollRequired || null
  }

  /**
   * Get current game state
   */
  getState() {
    return this.stateManager.getState()
  }

  /**
   * Get current tone styles
   */
  getToneStyles() {
    return this.toneEngine.getToneStyles()
  }

  // Event subscription methods

  onSceneChange(callback) {
    this.listeners.sceneChange.push(callback)
    return () => {
      this.listeners.sceneChange = this.listeners.sceneChange.filter(cb => cb !== callback)
    }
  }

  onDiceRoll(callback) {
    this.listeners.diceRoll.push(callback)
    return () => {
      this.listeners.diceRoll = this.listeners.diceRoll.filter(cb => cb !== callback)
    }
  }

  onEventTrigger(callback) {
    this.listeners.eventTrigger.push(callback)
    return () => {
      this.listeners.eventTrigger = this.listeners.eventTrigger.filter(cb => cb !== callback)
    }
  }

  onStateChange(callback) {
    this.listeners.stateChange.push(callback)
    return () => {
      this.listeners.stateChange = this.listeners.stateChange.filter(cb => cb !== callback)
    }
  }

  onStreamChunk(callback) {
    this.listeners.streamChunk.push(callback)
    return () => {
      this.listeners.streamChunk = this.listeners.streamChunk.filter(cb => cb !== callback)
    }
  }

  onProgressionUpdate(callback) {
    this.listeners.progressionUpdate.push(callback)
    return () => {
      this.listeners.progressionUpdate = this.listeners.progressionUpdate.filter(cb => cb !== callback)
    }
  }

  onMilestoneCompleted(callback) {
    this.listeners.milestoneCompleted.push(callback)
    return () => {
      this.listeners.milestoneCompleted = this.listeners.milestoneCompleted.filter(cb => cb !== callback)
    }
  }

  onStageAdvanced(callback) {
    this.listeners.stageAdvanced.push(callback)
    return () => {
      this.listeners.stageAdvanced = this.listeners.stageAdvanced.filter(cb => cb !== callback)
    }
  }

  // Private methods

  _emit(event, data) {
    const callbacks = this.listeners[event] || []
    for (const callback of callbacks) {
      try {
        callback(data)
      } catch (e) {
        console.error(`Error in ${event} listener:`, e)
      }
    }
  }

  _getContext() {
    const state = this.stateManager.getState()
    const progressionContext = this.stateManager.getProgressionContext()
    
    return {
      stats: state.stats,
      affinities: state.affinities,
      currentNpc: state.currentNpc,
      currentLocation: state.currentLocation,
      activeTone: state.activeTone,
      history: state.history,
      flags: state.flags,
      // Progression data for AI context
      progression: progressionContext,
    }
  }

  /**
   * Process progression tracking after a scene
   * @param {Object} scene - The completed scene
   * @param {Object} choice - The player's choice
   * @param {Object} rollResult - Dice roll result if any
   * @returns {Promise<Object>} Progression update results
   */
  async _processProgression(scene, choice, rollResult) {
    if (!this.stateManager.getSaveSlotId()) {
      debugLog.game('Progression tracking skipped - no save slot')
      return null
    }

    try {
      const state = this.stateManager.getState()
      
      // Process turn through progression system
      const results = await progressionSystem.processTurn(
        scene,
        choice,
        rollResult,
        state
      )

      if (!results) return null

      // Emit progression update event
      this._emit('progressionUpdate', results)

      // Emit individual milestone events
      for (const milestone of results.milestonesCompleted || []) {
        debugLog.game('Milestone completed', milestone)
        this._emit('milestoneCompleted', milestone)
      }

      // Emit stage advancement event
      if (results.stageAdvanced) {
        debugLog.game('Stage advanced', results.stageAdvanced)
        this._emit('stageAdvanced', results.stageAdvanced)
      }

      // Log fetish level ups
      for (const levelUp of results.fetishLevelUps || []) {
        debugLog.game('Fetish level up', levelUp)
      }

      // Check for first session milestone on turn 1
      if (state.turn === 1) {
        await progressionSystem.recordFirstSession(state.turn)
      }

      // Check for first punishment if this was a failed defiance
      if (choice?.type === 'defy' && rollResult && !rollResult.success) {
        await progressionSystem.recordFirstPunishment(state.turn)
      }

      // Check for group scene milestone
      const npcCount = scene.npcs?.length || (scene.npc ? 1 : 0)
      if (npcCount >= 3) {
        await progressionSystem.recordGroupScene(state.turn, npcCount)
      }

      return results
    } catch (error) {
      debugLog.error('Progression tracking failed', error.message)
      return null
    }
  }

  /**
   * Infer the scene type from scene content for progression tracking
   * @param {Object} scene - The current scene
   * @returns {string} - The inferred scene type
   */
  _inferSceneType(scene) {
    if (!scene) return 'unknown'
    
    const desc = (scene.description || '').toLowerCase()
    const bodyPart = scene.bodyPart?.toLowerCase() || ''
    
    // Check for specific scene types based on content
    if (bodyPart === 'feet' || desc.includes('foot') || desc.includes('feet') || desc.includes('sole') || desc.includes('toes')) {
      return 'foot_worship'
    }
    if (bodyPart === 'armpit' || desc.includes('armpit') || desc.includes('sweat')) {
      return 'sweat_worship'
    }
    if (desc.includes('tickl')) {
      return 'tickling'
    }
    if (desc.includes('edge') || desc.includes('denial') || desc.includes('stroke') || desc.includes('teas')) {
      return 'edging'
    }
    if (desc.includes('orgasm') || desc.includes('cum') || desc.includes('release')) {
      return 'post_orgasm'
    }
    if (desc.includes('punish') || desc.includes('spank') || desc.includes('slap')) {
      return 'punishment'
    }
    if (desc.includes('kneel') || desc.includes('bow') || desc.includes('arrive') || desc.includes('enter') || desc.includes('approach')) {
      return 'introduction'
    }
    if (desc.includes('move') || desc.includes('lead') || desc.includes('follow') || desc.includes('take you')) {
      return 'transition'
    }
    
    return 'general'
  }
}

export default GameEngine
