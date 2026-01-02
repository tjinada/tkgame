import { apiClient } from '../services/ApiClient.js'

export class SaveSystem {
  constructor() {
    this.autoSaveInterval = null
  }

  /**
   * Save game state to a slot
   * @param {string} slotId - Slot identifier (1-5 or 'auto')
   * @param {Object} state - Game state to save
   * @param {string} name - Optional save name
   * @returns {Promise<SaveSlot>}
   */
  async save(slotId, state, name = null) {
    const saveData = {
      slotId,
      name: name || `Save ${slotId}`,
      stats: state.stats,
      affinities: state.affinities,
      chapter: state.chapter,
      turn: state.turn,
      currentScene: state.currentScene,
      currentNpc: state.currentNpc,
      currentLocation: state.currentLocation,
      flags: state.flags || {},
      perks: state.perks || [],
      scars: state.scars || [],
      history: state.history || [],
      activeTone: state.activeTone,
    }

    const result = await apiClient.post('/api/saves', saveData)
    console.log(`Game saved to slot: ${slotId}`)
    
    return {
      id: slotId,
      name: saveData.name,
      timestamp: new Date(result.timestamp),
      chapter: state.chapter,
      turn: state.turn,
      preview: this._generatePreview(state),
    }
  }

  /**
   * Load game state from a slot
   * @param {string} slotId - Slot identifier
   * @returns {Promise<Object|null>} - Game state or null if not found
   */
  async load(slotId) {
    try {
      const saveData = await apiClient.get(`/api/saves/${slotId}`)
      
      if (!saveData) return null
      
      console.log(`Game loaded from slot: ${slotId}`)
      
      // Return the state object matching the expected format
      return {
        stats: saveData.stats,
        affinities: saveData.affinities,
        chapter: saveData.chapter,
        turn: saveData.turn,
        currentScene: saveData.currentScene,
        currentNpc: saveData.currentNpc,
        currentLocation: saveData.currentLocation,
        flags: saveData.flags || {},
        perks: saveData.perks || [],
        scars: saveData.scars || [],
        history: saveData.history || [],
        activeTone: saveData.activeTone,
      }
    } catch (error) {
      // Handle 404 and other errors gracefully
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log(`No save found in slot: ${slotId}`)
        return null
      }
      console.error('Failed to load save:', error)
      return null
    }
  }

  /**
   * Delete a save slot
   * @param {string} slotId - Slot identifier
   */
  async delete(slotId) {
    try {
      await apiClient.delete(`/api/saves/${slotId}`)
      console.log(`Save deleted: ${slotId}`)
    } catch (error) {
      if (!error.message.includes('404')) {
        console.error('Failed to delete save:', error)
      }
    }
  }

  /**
   * List all save slots
   * @returns {Promise<SaveSlot[]>}
   */
  async listSaves() {
    try {
      const saves = await apiClient.get('/api/saves')
      
      return saves.map(s => ({
        id: s.slotId,
        name: s.name,
        timestamp: new Date(s.updatedAt),
        chapter: s.chapter,
        turn: s.turn,
        preview: s.preview,
      }))
    } catch (error) {
      console.error('Failed to list saves:', error)
      return []
    }
  }

  /**
   * Get metadata for a specific save
   * @param {string} slotId - Slot identifier
   * @returns {Promise<SaveSlot|null>}
   */
  async getSaveMetadata(slotId) {
    try {
      const saves = await this.listSaves()
      return saves.find(s => s.id === slotId) || null
    } catch (error) {
      console.error('Failed to get save metadata:', error)
      return null
    }
  }

  /**
   * Check if a slot has a save
   * @param {string} slotId - Slot identifier
   * @returns {Promise<boolean>}
   */
  async hasSave(slotId) {
    const metadata = await this.getSaveMetadata(slotId)
    return metadata !== null
  }

  /**
   * Get available slot IDs
   * @returns {string[]}
   */
  getAvailableSlots() {
    return ['1', '2', '3', '4', '5']
  }

  /**
   * Enable auto-save at interval
   * @param {number} intervalMs - Interval in milliseconds
   * @param {Function} getState - Function to get current state
   */
  enableAutoSave(intervalMs, getState) {
    this.disableAutoSave()
    
    this.autoSaveInterval = setInterval(async () => {
      const state = getState()
      if (state && state.turn > 0) {
        try {
          await this.save('auto', state, 'Auto Save')
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
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
   * Quick save to quick slot
   * @param {Object} state - Game state
   */
  async quickSave(state) {
    return this.save('quick', state, 'Quick Save')
  }

  /**
   * Quick load from quick slot
   * @returns {Promise<Object|null>}
   */
  async quickLoad() {
    return this.load('quick')
  }

  /**
   * Clear all saves
   */
  async clearAllSaves() {
    try {
      await apiClient.delete('/api/saves')
      console.log('All saves cleared')
    } catch (error) {
      console.error('Failed to clear saves:', error)
    }
  }

  _generatePreview(state) {
    const location = state.currentLocation?.replace(/_/g, ' ') || 'Unknown'
    return `Chapter ${state.chapter || 1}, Turn ${state.turn || 0} - ${location}`
  }
}

export const saveSystem = new SaveSystem()

export default SaveSystem
