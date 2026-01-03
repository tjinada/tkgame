import { apiClient } from './ApiClient.js'

class ProgressionService {
  /**
   * Get stage/milestone/fetish definitions
   * @returns {Promise<{stages: Object, milestones: Object, fetishTypes: string[]}>}
   */
  async getDefinitions() {
    return await apiClient.get('/api/progression/definitions')
  }

  /**
   * Get progression for a save slot
   * @param {string} saveSlotId
   * @returns {Promise<Object>}
   */
  async getProgression(saveSlotId) {
    return await apiClient.get(`/api/progression/${saveSlotId}`)
  }

  /**
   * Create/reset progression for a save slot
   * @param {string} saveSlotId
   * @returns {Promise<Object>}
   */
  async createProgression(saveSlotId) {
    return await apiClient.post(`/api/progression/${saveSlotId}`)
  }

  /**
   * Update progression
   * @param {string} saveSlotId
   * @param {Object} updates
   * @returns {Promise<{success: boolean}>}
   */
  async updateProgression(saveSlotId, updates) {
    return await apiClient.patch(`/api/progression/${saveSlotId}`, updates)
  }

  /**
   * Record a fetish exposure
   * @param {string} saveSlotId
   * @param {string} fetish
   * @param {number} turn
   * @param {number} intensity
   * @returns {Promise<{fetish: string, previousLevel: number, newLevel: number, leveledUp: boolean}>}
   */
  async recordFetishExposure(saveSlotId, fetish, turn, intensity = 1) {
    return await apiClient.post(`/api/progression/${saveSlotId}/fetish`, {
      fetish,
      turn,
      intensity
    })
  }

  /**
   * Record multiple fetish exposures
   * @param {string} saveSlotId
   * @param {string[]} fetishes
   * @param {number} turn
   * @param {number} intensity
   * @returns {Promise<{results: Array}>}
   */
  async recordFetishExposures(saveSlotId, fetishes, turn, intensity = 1) {
    return await apiClient.post(`/api/progression/${saveSlotId}/fetishes`, {
      fetishes,
      turn,
      intensity
    })
  }

  /**
   * Record NPC encounter
   * @param {string} saveSlotId
   * @param {string} npcId
   * @param {number} turn
   * @returns {Promise<{success: boolean}>}
   */
  async recordNpcEncounter(saveSlotId, npcId, turn) {
    return await apiClient.post(`/api/progression/${saveSlotId}/npc-encounter`, {
      npcId,
      turn
    })
  }

  /**
   * Complete a milestone manually
   * @param {string} saveSlotId
   * @param {string} milestoneId
   * @param {number} turn
   * @returns {Promise<{success: boolean, milestone: string, stageUnlocked: string|null}>}
   */
  async completeMilestone(saveSlotId, milestoneId, turn) {
    return await apiClient.post(`/api/progression/${saveSlotId}/milestone`, {
      milestoneId,
      turn
    })
  }

  /**
   * Check all milestone conditions against current game state
   * @param {string} saveSlotId
   * @param {Object} gameState - { stats, affinities, turn }
   * @returns {Promise<{completedMilestones: Array}>}
   */
  async checkMilestones(saveSlotId, gameState) {
    return await apiClient.post(`/api/progression/${saveSlotId}/check-milestones`, gameState)
  }

  /**
   * Advance to next stage
   * @param {string} saveSlotId
   * @param {boolean} force - Force advancement regardless of requirements
   * @returns {Promise<{success: boolean, previousStage: string, newStage: string, maxIntensity: number}>}
   */
  async advanceStage(saveSlotId, force = false) {
    return await apiClient.post(`/api/progression/${saveSlotId}/advance-stage`, { force })
  }

  /**
   * Update streak counters
   * @param {string} saveSlotId
   * @param {string} choiceType
   * @param {boolean} success
   * @returns {Promise<{streaks: Object}>}
   */
  async updateStreaks(saveSlotId, choiceType, success = true) {
    return await apiClient.post(`/api/progression/${saveSlotId}/streaks`, {
      choiceType,
      success
    })
  }

  /**
   * Increment day number
   * @param {string} saveSlotId
   * @returns {Promise<{dayNumber: number}>}
   */
  async incrementDay(saveSlotId) {
    return await apiClient.post(`/api/progression/${saveSlotId}/increment-day`)
  }

  /**
   * Set stage transition mode
   * @param {string} saveSlotId
   * @param {'milestone'|'automatic'} mode
   * @returns {Promise<{success: boolean, mode: string}>}
   */
  async setStageTransitionMode(saveSlotId, mode) {
    return await apiClient.post(`/api/progression/${saveSlotId}/transition-mode`, { mode })
  }

  /**
   * Delete progression for a save slot
   * @param {string} saveSlotId
   * @returns {Promise<{deleted: boolean}>}
   */
  async deleteProgression(saveSlotId) {
    return await apiClient.delete(`/api/progression/${saveSlotId}`)
  }
}

export const progressionService = new ProgressionService()
export default ProgressionService
