import eventsData from '../data/events.json'

export class EventSystem {
  constructor(stateManager) {
    this.stateManager = stateManager
    this.events = eventsData.events
    this.eventHistory = []
  }

  /**
   * Check if a random event should trigger
   * @returns {Event|null}
   */
  checkForEvent() {
    // 20% chance of event per turn
    if (Math.random() > 0.2) {
      return null
    }

    // Roll d20 for event
    const roll = Math.floor(Math.random() * 20) + 1
    const event = this.events.find(e => e.id === roll)
    
    if (!event) return null

    // Check if event's trigger bias is met
    if (!this._checkTriggerBias(event)) {
      return null
    }

    this.eventHistory.push({
      event,
      turn: this.stateManager?.getState().turn || 0,
      timestamp: Date.now(),
    })

    console.log(`Event triggered: ${event.name}`)
    return event
  }

  /**
   * Force a specific event to trigger
   * @param {number} eventId - Event ID (1-20)
   * @returns {Event|null}
   */
  forceEvent(eventId) {
    const event = this.events.find(e => e.id === eventId)
    if (!event) {
      console.error(`Event not found: ${eventId}`)
      return null
    }

    this.eventHistory.push({
      event,
      turn: this.stateManager?.getState().turn || 0,
      timestamp: Date.now(),
      forced: true,
    })

    return event
  }

  /**
   * Apply event effects to game state
   * @param {Event} event - The event to apply
   * @returns {Object} - Summary of changes
   */
  applyEventEffects(event) {
    if (!event?.effects || !this.stateManager) {
      return { statChanges: {}, affinityChanges: {}, flags: {} }
    }

    const changes = {
      statChanges: {},
      affinityChanges: {},
      flags: {},
    }

    // Apply stat changes
    if (event.effects.statChanges) {
      for (const [stat, delta] of Object.entries(event.effects.statChanges)) {
        const newValue = this.stateManager.modifyStat(stat, delta)
        changes.statChanges[stat] = { delta, newValue }
      }
    }

    // Apply affinity changes
    if (event.effects.affinityChanges) {
      for (const [npc, delta] of Object.entries(event.effects.affinityChanges)) {
        const newValue = this.stateManager.modifyAffinity(npc, delta)
        changes.affinityChanges[npc] = { delta, newValue }
      }
    }

    // Apply flags
    if (event.effects.flags) {
      for (const [flag, value] of Object.entries(event.effects.flags)) {
        this.stateManager.setFlag(flag, value)
        changes.flags[flag] = value
      }
    }

    return changes
  }

  /**
   * Get an event by ID
   * @param {number} eventId - Event ID
   * @returns {Event|null}
   */
  getEventById(eventId) {
    return this.events.find(e => e.id === eventId) || null
  }

  /**
   * Get event history
   * @param {number} limit - Max entries to return
   * @returns {Array}
   */
  getEventHistory(limit = 10) {
    return this.eventHistory.slice(-limit)
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = []
  }

  /**
   * Check if event's trigger bias conditions are met
   * @param {Event} event - The event to check
   * @returns {boolean}
   */
  _checkTriggerBias(event) {
    if (!this.stateManager) return true

    const state = this.stateManager.getState()
    const bias = event.triggerBias?.toLowerCase() || ''

    // Check various trigger conditions
    if (bias.includes('high arousal') && state.stats.arousal < 60) return false
    if (bias.includes('low endurance') && state.stats.endurance > 40) return false
    if (bias.includes('low obedience') && state.stats.obedience > 40) return false
    if (bias.includes('high sandy affinity') && state.affinities.sandy < 40) return false

    // NPC-specific triggers
    if (bias.includes('araph scene') && state.currentNpc !== 'araph') return false
    if (bias.includes('gaya scene') && state.currentNpc !== 'gaya') return false
    if (bias.includes('melissa scene') && state.currentNpc !== 'melissa') return false
    if (bias.includes('aish lead') && state.currentNpc !== 'aish') return false

    // Count hostile NPCs for pack events
    if (bias.includes('hostile') || bias.includes('annoyed')) {
      const hostileCount = Object.values(state.affinities).filter(a => a < -10).length
      if (bias.includes('3+') && hostileCount < 3) return false
      if (bias.includes('two') && hostileCount < 2) return false
    }

    return true
  }
}

export default EventSystem
