import configData from '../data/config.json'
import npcsData from '../data/npcs.json'

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
