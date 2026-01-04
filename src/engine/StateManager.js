import configData from '../data/config.json'
import npcsData from '../data/npcs.json'
import { progressionSystem } from './ProgressionSystem.js'
import discoveryRules from '../data/discoveryRules.json'

const AFFINITY_TIERS = configData.affinityTiers

function getInitialState() {
  const stats = {}
  for (const [key, config] of Object.entries(configData.stats)) {
    stats[key] = config.start
  }

  const affinities = {}
  for (const npc of npcsData.npcs) {
    affinities[npc.id] = npc.startingAffinity
  }

  return {
    stats,
    affinities,
    chapter: 1,
    turn: 0,
    currentScene: null,
    currentNpc: null,
    currentLocation: 'main_hall',
    history: [],
    flags: {},
    perks: [],
    scars: ['Fresh Meat'],
    activeTone: 'Neutral',
    // Progression reference (actual data in MongoDB)
    progressionInitialized: false,
    saveSlotId: null,
    
    // Custom game setup
    gameConfig: null,           // Full game configuration from setup wizard
    slaveProfile: null,         // Resolved slave profile with vulnerabilities
    activeNpcIds: [],           // NPCs active in this game
    npcKnowledge: {},           // NPC knowledge tracking { npcId: { activities: {}, overallScore } }
    gameRules: null,            // Discovery speed, sharing mode, etc.
  }
}

export class StateManager {
  constructor(initialState = null) {
    this.state = initialState || getInitialState()
    this.listeners = []
    
    // Ensure state has all required properties
    this._ensureValidState()
  }

  /**
   * Ensure state has all required properties with defaults
   */
  _ensureValidState() {
    const defaults = getInitialState()
    
    // Ensure stats exist
    if (!this.state.stats) {
      this.state.stats = defaults.stats
    } else {
      // Ensure all stat keys exist
      for (const [key, value] of Object.entries(defaults.stats)) {
        if (this.state.stats[key] === undefined) {
          this.state.stats[key] = value
        }
      }
    }
    
    // Ensure affinities exist
    if (!this.state.affinities) {
      this.state.affinities = defaults.affinities
    } else {
      // Ensure all affinity keys exist
      for (const [key, value] of Object.entries(defaults.affinities)) {
        if (this.state.affinities[key] === undefined) {
          this.state.affinities[key] = value
        }
      }
    }
    
    // Ensure other properties exist
    if (!this.state.flags) this.state.flags = {}
    if (!this.state.history) this.state.history = []
    if (!this.state.perks) this.state.perks = []
    if (!this.state.scars) this.state.scars = ['Fresh Meat']
    if (!this.state.activeTone) this.state.activeTone = 'Neutral'
    if (this.state.chapter === undefined) this.state.chapter = 1
    if (this.state.turn === undefined) this.state.turn = 0
    if (!this.state.currentLocation) this.state.currentLocation = 'main_hall'
    if (this.state.progressionInitialized === undefined) this.state.progressionInitialized = false
  }

  // Progression System Integration
  
  /**
   * Initialize progression system for a save slot
   * @param {string} saveSlotId
   * @returns {Promise<Object>}
   */
  async initializeProgression(saveSlotId) {
    this.state.saveSlotId = saveSlotId
    const progression = await progressionSystem.initialize(saveSlotId)
    this.state.progressionInitialized = true
    this._notifyListeners()
    return progression
  }

  /**
   * Reset progression for new game
   * @param {string} saveSlotId
   * @returns {Promise<Object>}
   */
  async resetProgression(saveSlotId) {
    this.state.saveSlotId = saveSlotId
    const progression = await progressionSystem.reset(saveSlotId)
    this.state.progressionInitialized = true
    this._notifyListeners()
    return progression
  }

  /**
   * Get current progression state
   * @returns {Object|null}
   */
  getProgression() {
    return progressionSystem.getProgression()
  }

  /**
   * Get progression context for AI prompts
   * @returns {Object}
   */
  getProgressionContext() {
    return progressionSystem.buildContextForPrompt()
  }

  /**
   * Check if intensity is allowed by current stage
   * @param {number} intensity
   * @returns {boolean}
   */
  isIntensityAllowed(intensity) {
    return progressionSystem.isIntensityAllowed(intensity)
  }

  /**
   * Get maximum allowed intensity
   * @returns {number}
   */
  getMaxIntensity() {
    return progressionSystem.getMaxIntensity()
  }

  /**
   * Get current stage
   * @returns {Object}
   */
  getCurrentStage() {
    return progressionSystem.getCurrentStage()
  }

  /**
   * Get save slot ID
   * @returns {string|null}
   */
  getSaveSlotId() {
    return this.state.saveSlotId
  }

  /**
   * Set save slot ID
   * @param {string} saveSlotId
   */
  setSaveSlotId(saveSlotId) {
    this.state.saveSlotId = saveSlotId
    this._notifyListeners()
  }

  // Stats
  getStat(statName) {
    return this.state.stats?.[statName] ?? 0
  }

  modifyStat(statName, delta) {
    const config = configData.stats[statName]
    if (!config) return 0

    if (!this.state.stats) {
      this.state.stats = {}
    }

    const current = this.state.stats[statName] ?? config.start
    const newValue = Math.max(config.min, Math.min(config.max, current + delta))
    
    this.state.stats[statName] = newValue
    this._notifyListeners()
    
    return newValue
  }

  getStatConfig(statName) {
    return configData.stats[statName] || null
  }

  getAllStats() {
    return { ...this.state.stats }
  }

  // Affinities
  getAffinity(npcId) {
    return this.state.affinities?.[npcId] ?? 0
  }

  modifyAffinity(npcId, delta) {
    if (!this.state.affinities) {
      this.state.affinities = {}
    }
    
    const current = this.state.affinities[npcId] ?? 0
    const newValue = Math.max(-50, Math.min(100, current + delta))
    
    this.state.affinities[npcId] = newValue
    this._notifyListeners()
    
    return newValue
  }

  getAffinityTier(npcId) {
    const affinity = this.getAffinity(npcId)
    
    for (const tier of AFFINITY_TIERS) {
      if (affinity >= tier.min && affinity <= tier.max) {
        return tier
      }
    }
    
    return AFFINITY_TIERS.find(t => t.tier === 'Neutral') || { tier: 'Neutral', effect: '' }
  }

  getAllAffinities() {
    return { ...this.state.affinities }
  }

  // History
  addHistoryEntry(entry) {
    if (!this.state.history) {
      this.state.history = []
    }
    
    this.state.history.push({
      ...entry,
      timestamp: Date.now(),
    })
    this._notifyListeners()
  }

  getHistory(limit = null) {
    if (!this.state.history) return []
    
    if (limit) {
      return this.state.history.slice(-limit)
    }
    return [...this.state.history]
  }

  // Flags
  getFlag(flagName) {
    return this.state.flags?.[flagName] ?? null
  }

  setFlag(flagName, value) {
    if (!this.state.flags) {
      this.state.flags = {}
    }
    
    this.state.flags[flagName] = value
    this._notifyListeners()
  }

  // Scene/Location
  setCurrentScene(sceneId) {
    this.state.currentScene = sceneId
    this._notifyListeners()
  }

  setCurrentNpc(npcId) {
    this.state.currentNpc = npcId
    this._notifyListeners()
  }

  setCurrentLocation(location) {
    this.state.currentLocation = location
    this._notifyListeners()
  }

  // Turn management
  incrementTurn() {
    this.state.turn = (this.state.turn || 0) + 1
    this._notifyListeners()
  }

  // Tone
  setActiveTone(tone) {
    this.state.activeTone = tone
    this._notifyListeners()
  }

  // Serialization
  serialize() {
    return JSON.stringify(this.state)
  }

  deserialize(data) {
    try {
      this.state = JSON.parse(data)
      this._ensureValidState()
      this._notifyListeners()
      return true
    } catch (e) {
      console.error('Failed to deserialize state:', e)
      return false
    }
  }

  // Load state directly (without JSON parsing)
  loadState(state) {
    this.state = state
    this._ensureValidState()
    this._notifyListeners()
  }

  // Full state access
  getState() {
    return { ...this.state }
  }

  // Reset
  reset() {
    this.state = getInitialState()
    this._notifyListeners()
  }

  // ========== Custom Game Setup ==========

  /**
   * Initialize game from a game config (from setup wizard)
   * @param {Object} gameConfig - Full game configuration
   */
  initializeFromGameConfig(gameConfig) {
    this.state.gameConfig = gameConfig
    this.state.slaveProfile = gameConfig.slave
    this.state.activeNpcIds = gameConfig.npcs.map(n => n.id)
    this.state.gameRules = gameConfig.rules
    
    // Set starting stats from slave profile
    if (gameConfig.slave?.baseStats) {
      this.state.stats = { ...gameConfig.slave.baseStats }
    }
    
    // Initialize affinities for active NPCs only
    this.state.affinities = {}
    for (const npc of gameConfig.npcs) {
      this.state.affinities[npc.id] = npc.startingAffinity ?? 0
    }
    
    // Initialize NPC knowledge
    this._initializeNpcKnowledge(gameConfig.rules?.discovery?.startingKnowledge || 0)
    
    this._notifyListeners()
  }

  /**
   * Initialize NPC knowledge tracking
   * @param {number} startingKnowledge - Initial knowledge percentage (0-100)
   */
  _initializeNpcKnowledge(startingKnowledge = 0) {
    this.state.npcKnowledge = {}
    
    for (const npcId of this.state.activeNpcIds || []) {
      this.state.npcKnowledge[npcId] = {
        activities: {},
        overallScore: startingKnowledge
      }
    }
  }

  /**
   * Get slave vulnerability for activity + body part
   * @param {string} activityId
   * @param {string} bodyPartId
   * @returns {number} 0-100 vulnerability score
   */
  getVulnerability(activityId, bodyPartId) {
    const matrix = this.state.slaveProfile?.vulnerabilityMatrix
    if (!matrix) return 50 // Default
    return matrix[activityId]?.[bodyPartId] ?? 50
  }

  /**
   * Get full vulnerability matrix
   * @returns {Object}
   */
  getVulnerabilityMatrix() {
    return this.state.slaveProfile?.vulnerabilityMatrix || {}
  }

  /**
   * Get slave traits
   * @returns {string[]}
   */
  getSlaveTraits() {
    return this.state.slaveProfile?.traits || []
  }

  /**
   * Check if slave has a specific trait
   * @param {string} traitId
   * @returns {boolean}
   */
  hasTrait(traitId) {
    return this.getSlaveTraits().includes(traitId)
  }

  /**
   * Get active NPC IDs
   * @returns {string[]}
   */
  getActiveNpcIds() {
    return [...(this.state.activeNpcIds || [])]
  }

  /**
   * Check if NPC is active in this game
   * @param {string} npcId
   * @returns {boolean}
   */
  isNpcActive(npcId) {
    return this.state.activeNpcIds?.includes(npcId) ?? false
  }

  /**
   * Get game rules
   * @returns {Object}
   */
  getGameRules() {
    return this.state.gameRules || {}
  }

  /**
   * Get discovery speed multiplier
   * @returns {number}
   */
  getDiscoverySpeedMultiplier() {
    const speed = this.state.gameRules?.discovery?.speed || 'normal'
    return discoveryRules.discoverySpeed[speed]?.multiplier ?? 1.0
  }

  /**
   * Get knowledge sharing mode
   * @returns {string}
   */
  getSharingMode() {
    return this.state.gameRules?.discovery?.sharingMode || 'gossip'
  }

  // ========== NPC Knowledge ==========

  /**
   * Get NPC's knowledge about a specific weakness
   * @param {string} npcId
   * @param {string} activityId
   * @param {string} bodyPartId
   * @returns {Object} { confidence: number, level: string }
   */
  getNpcKnowledge(npcId, activityId, bodyPartId) {
    const key = `${activityId}_${bodyPartId}`
    const knowledge = this.state.npcKnowledge?.[npcId]?.activities?.[key]
    
    if (!knowledge) {
      return { confidence: 0, level: 'unaware' }
    }
    
    // Determine level from confidence
    let level = 'unaware'
    for (const [levelId, config] of Object.entries(discoveryRules.knowledgeLevels)) {
      if (knowledge.confidence >= config.minConfidence && knowledge.confidence <= config.maxConfidence) {
        level = levelId
        break
      }
    }
    
    return { confidence: knowledge.confidence, level }
  }

  /**
   * Update NPC's knowledge about a weakness
   * @param {string} npcId
   * @param {string} activityId
   * @param {string} bodyPartId
   * @param {number} confidence - New confidence value (0-100)
   */
  updateNpcKnowledge(npcId, activityId, bodyPartId, confidence) {
    if (!this.state.npcKnowledge) {
      this.state.npcKnowledge = {}
    }
    if (!this.state.npcKnowledge[npcId]) {
      this.state.npcKnowledge[npcId] = { activities: {}, overallScore: 0 }
    }
    
    const key = `${activityId}_${bodyPartId}`
    const prev = this.state.npcKnowledge[npcId].activities[key]?.confidence || 0
    
    this.state.npcKnowledge[npcId].activities[key] = {
      confidence: Math.max(0, Math.min(100, confidence)),
      lastTested: Date.now(),
      observations: (this.state.npcKnowledge[npcId].activities[key]?.observations || [])
    }
    
    // Recalculate overall score
    this._recalculateNpcOverallScore(npcId)
    
    this._notifyListeners()
    
    return { previous: prev, current: confidence }
  }

  /**
   * Add observation to NPC knowledge
   * @param {string} npcId
   * @param {string} activityId
   * @param {string} bodyPartId
   * @param {string} observation
   */
  addNpcObservation(npcId, activityId, bodyPartId, observation) {
    const key = `${activityId}_${bodyPartId}`
    if (!this.state.npcKnowledge?.[npcId]?.activities?.[key]) return
    
    const obs = this.state.npcKnowledge[npcId].activities[key].observations || []
    obs.push({ text: observation, timestamp: Date.now() })
    
    // Keep only last 5 observations
    if (obs.length > 5) {
      obs.shift()
    }
    
    this.state.npcKnowledge[npcId].activities[key].observations = obs
    this._notifyListeners()
  }

  /**
   * Recalculate NPC's overall knowledge score
   * @param {string} npcId
   */
  _recalculateNpcOverallScore(npcId) {
    const knowledge = this.state.npcKnowledge?.[npcId]
    if (!knowledge) return
    
    const activities = Object.values(knowledge.activities || {})
    if (activities.length === 0) {
      knowledge.overallScore = 0
      return
    }
    
    const totalConfidence = activities.reduce((sum, a) => sum + (a.confidence || 0), 0)
    knowledge.overallScore = Math.round(totalConfidence / activities.length)
  }

  /**
   * Get NPC's overall knowledge state
   * @param {string} npcId
   * @returns {Object} { score: number, state: string }
   */
  getNpcOverallKnowledge(npcId) {
    const score = this.state.npcKnowledge?.[npcId]?.overallScore || 0
    
    let state = 'unaware'
    for (const [stateId, config] of Object.entries(discoveryRules.overallKnowledgeStates)) {
      if (score >= config.minScore && score <= config.maxScore) {
        state = stateId
        break
      }
    }
    
    return { score, state }
  }

  /**
   * Get full NPC knowledge object for UI
   * @returns {Object}
   */
  getAllNpcKnowledge() {
    return this.state.npcKnowledge || {}
  }

  // Event listeners
  onStateChange(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }

  _notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.getState())
    }
  }
}

export default StateManager
