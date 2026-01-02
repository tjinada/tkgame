import { StateManager } from './StateManager'
import { DiceSystem } from './DiceSystem'
import { EventSystem } from './EventSystem'
import { ToneEngine } from './ToneEngine'
import { ContentRouter } from '../content/ContentRouter'
import { debugLog } from '../components/admin/tabs/DebugTab'
import sampleScenario from '../data/scenarios/sample.json'

export class GameEngine {
  constructor(options = {}) {
    this.stateManager = options.stateManager || new StateManager()
    this.diceSystem = new DiceSystem(this.stateManager)
    this.eventSystem = new EventSystem(this.stateManager)
    this.toneEngine = new ToneEngine(this.stateManager)
    this.contentRouter = options.contentRouter || new ContentRouter()

    this.currentScene = null
    this.isRunning = false
    this.listeners = {
      sceneChange: [],
      diceRoll: [],
      eventTrigger: [],
      stateChange: [],
      streamChunk: [],
    }

    // Subscribe to state changes
    this.stateManager.onStateChange((state) => {
      this._emit('stateChange', state)
    })
  }

  /**
   * Start a new game
   */
  async startNewGame() {
    this.stateManager.reset()
    this.eventSystem.clearHistory()
    
    // Load the sample scenario
    this.contentRouter.loadScenario(sampleScenario)
    
    // Get the starting scene
    const startScene = await this.contentRouter.getSceneContent('intro-1', this._getContext())
    
    if (startScene) {
      this.currentScene = startScene
      this.stateManager.setCurrentScene(startScene.id)
      this.stateManager.setCurrentLocation(startScene.location || 'main_hall')
      this.stateManager.setCurrentNpc(startScene.npc || null)
      this.toneEngine.updateStateTone()
      this._emit('sceneChange', startScene)
    }

    this.isRunning = true
    debugLog.game('New game started', { scene: startScene?.id })
    return startScene
  }

  /**
   * Continue from saved state
   * @param {Object} savedState - The saved game state
   */
  async continueGame(savedState) {
    this.stateManager.deserialize(JSON.stringify(savedState))
    
    // Load scenario
    this.contentRouter.loadScenario(sampleScenario)
    
    // Restore current scene
    const sceneId = savedState.currentScene
    if (sceneId) {
      const scene = await this.contentRouter.getSceneContent(sceneId, this._getContext())
      if (scene) {
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

    // Add to history
    this.stateManager.addHistoryEntry({
      turn: this.stateManager.getState().turn,
      scene: this.currentScene.id,
      description: this.currentScene.description?.substring(0, 200),
      choice: choice.text,
      outcome: result.roll ? (result.roll.success ? 'success' : 'failure') : 'none',
      rolls: result.roll ? [result.roll] : [],
      statChanges: result.statChanges,
      affinityChanges: result.affinityChanges,
    })

    // Get next scene
    if (result.nextSceneId) {
      const nextScene = await this.contentRouter.getSceneContent(result.nextSceneId, this._getContext())
      if (nextScene) {
        this.currentScene = nextScene
        this.stateManager.setCurrentScene(nextScene.id)
        this.stateManager.setCurrentLocation(nextScene.location || this.stateManager.getState().currentLocation)
        this.stateManager.setCurrentNpc(nextScene.npc || null)
        result.newScene = nextScene
        this._emit('sceneChange', nextScene)
      }
    } else {
      // Generate AI continuation with streaming
      const nextScene = await this._generateWithStreaming(choice.text)
      if (nextScene) {
        this.currentScene = nextScene
        this.stateManager.setCurrentScene(nextScene.id)
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

    // Add to history
    this.stateManager.addHistoryEntry({
      turn: this.stateManager.getState().turn,
      scene: this.currentScene?.id,
      description: this.currentScene?.description?.substring(0, 200),
      choice: actionText,
      outcome: 'custom',
      rolls: [],
      statChanges: {},
      affinityChanges: {},
    })

    // Generate AI response with streaming
    const nextScene = await this._generateWithStreaming(actionText)
    
    if (nextScene) {
      this.currentScene = nextScene
      this.stateManager.setCurrentScene(nextScene.id)
      
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

    return { newScene: nextScene }
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
   * Get available choices
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
    return {
      stats: state.stats,
      affinities: state.affinities,
      currentNpc: state.currentNpc,
      currentLocation: state.currentLocation,
      activeTone: state.activeTone,
      history: state.history,
      flags: state.flags,
    }
  }
}

export default GameEngine
