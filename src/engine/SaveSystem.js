const SAVE_PREFIX = 'fd-save-'
const SAVE_INDEX_KEY = 'fd-save-index'
const MAX_SLOTS = 5

export class SaveSystem {
  constructor() {
    this.autoSaveInterval = null
  }

  /**
   * Save game state to a slot
   * @param {string} slotId - Slot identifier (1-5 or 'auto')
   * @param {Object} state - Game state to save
   * @param {string} name - Optional save name
   * @returns {SaveSlot}
   */
  save(slotId, state, name = null) {
    const saveData = {
      id: slotId,
      name: name || `Save ${slotId}`,
      timestamp: Date.now(),
      chapter: state.chapter,
      turn: state.turn,
      preview: this._generatePreview(state),
      state: state,
    }

    localStorage.setItem(`${SAVE_PREFIX}${slotId}`, JSON.stringify(saveData))
    this._updateIndex(slotId, saveData)
    
    console.log(`Game saved to slot: ${slotId}`)
    return this._toSlotInfo(saveData)
  }

  /**
   * Load game state from a slot
   * @param {string} slotId - Slot identifier
   * @returns {Object|null} - Game state or null if not found
   */
  load(slotId) {
    const raw = localStorage.getItem(`${SAVE_PREFIX}${slotId}`)
    if (!raw) return null

    try {
      const saveData = JSON.parse(raw)
      console.log(`Game loaded from slot: ${slotId}`)
      return saveData.state
    } catch (e) {
      console.error('Failed to load save:', e)
      return null
    }
  }

  /**
   * Delete a save slot
   * @param {string} slotId - Slot identifier
   */
  delete(slotId) {
    localStorage.removeItem(`${SAVE_PREFIX}${slotId}`)
    this._removeFromIndex(slotId)
    console.log(`Save deleted: ${slotId}`)
  }

  /**
   * List all save slots
   * @returns {SaveSlot[]}
   */
  listSaves() {
    const index = this._getIndex()
    const saves = []

    for (const slotId of Object.keys(index)) {
      const raw = localStorage.getItem(`${SAVE_PREFIX}${slotId}`)
      if (raw) {
        try {
          const saveData = JSON.parse(raw)
          saves.push(this._toSlotInfo(saveData))
        } catch (e) {
          // Skip corrupted saves
        }
      }
    }

    return saves.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get metadata for a specific save
   * @param {string} slotId - Slot identifier
   * @returns {SaveSlot|null}
   */
  getSaveMetadata(slotId) {
    const raw = localStorage.getItem(`${SAVE_PREFIX}${slotId}`)
    if (!raw) return null

    try {
      const saveData = JSON.parse(raw)
      return this._toSlotInfo(saveData)
    } catch (e) {
      return null
    }
  }

  /**
   * Check if a slot has a save
   * @param {string} slotId - Slot identifier
   * @returns {boolean}
   */
  hasSave(slotId) {
    return localStorage.getItem(`${SAVE_PREFIX}${slotId}`) !== null
  }

  /**
   * Get available slot IDs
   * @returns {string[]}
   */
  getAvailableSlots() {
    const slots = []
    for (let i = 1; i <= MAX_SLOTS; i++) {
      slots.push(String(i))
    }
    return slots
  }

  /**
   * Enable auto-save at interval
   * @param {number} intervalMs - Interval in milliseconds
   * @param {Function} getState - Function to get current state
   */
  enableAutoSave(intervalMs, getState) {
    this.disableAutoSave()
    
    this.autoSaveInterval = setInterval(() => {
      const state = getState()
      if (state && state.turn > 0) {
        this.save('auto', state, 'Auto Save')
      }
    }, intervalMs)
    
    console.log(`Auto-save enabled: ${intervalMs}ms`)
  }

  /**
   * Disable auto-save
   */
  disableAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
      console.log('Auto-save disabled')
    }
  }

  /**
   * Quick save to slot 1
   * @param {Object} state - Game state
   */
  quickSave(state) {
    return this.save('quick', state, 'Quick Save')
  }

  /**
   * Quick load from slot 1
   * @returns {Object|null}
   */
  quickLoad() {
    return this.load('quick')
  }

  /**
   * Clear all saves
   */
  clearAllSaves() {
    const index = this._getIndex()
    for (const slotId of Object.keys(index)) {
      localStorage.removeItem(`${SAVE_PREFIX}${slotId}`)
    }
    localStorage.removeItem(SAVE_INDEX_KEY)
    console.log('All saves cleared')
  }

  // Private methods

  _getIndex() {
    const raw = localStorage.getItem(SAVE_INDEX_KEY)
    if (!raw) return {}
    try {
      return JSON.parse(raw)
    } catch (e) {
      return {}
    }
  }

  _updateIndex(slotId, saveData) {
    const index = this._getIndex()
    index[slotId] = {
      timestamp: saveData.timestamp,
      name: saveData.name,
    }
    localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(index))
  }

  _removeFromIndex(slotId) {
    const index = this._getIndex()
    delete index[slotId]
    localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(index))
  }

  _generatePreview(state) {
    const location = state.currentLocation?.replace(/_/g, ' ') || 'Unknown'
    const npc = state.currentNpc || 'None'
    return `Chapter ${state.chapter}, Turn ${state.turn} - ${location}`
  }

  _toSlotInfo(saveData) {
    return {
      id: saveData.id,
      name: saveData.name,
      timestamp: new Date(saveData.timestamp),
      chapter: saveData.chapter,
      turn: saveData.turn,
      preview: saveData.preview,
    }
  }
}

export const saveSystem = new SaveSystem()

export default SaveSystem
