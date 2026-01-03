import ApiClient from './ApiClient'

const BASE_URL = '/api/events'

/**
 * Event Service - API client for event logging and consequence tracking
 */
class EventService {
  /**
   * Create a new event
   */
  async createEvent(saveSlotId, eventData) {
    return ApiClient.post(BASE_URL, {
      saveSlotId,
      ...eventData
    })
  }

  /**
   * Get events with optional filters
   * @param {string} saveSlotId
   * @param {Object} options - { npc, type, chapter, fromTurn, toTurn, fetish, limit, skip, hasUnresolvedConsequences }
   */
  async getEvents(saveSlotId, options = {}) {
    const params = new URLSearchParams()
    
    if (options.npc) params.append('npc', options.npc)
    if (options.type) params.append('type', Array.isArray(options.type) ? options.type.join(',') : options.type)
    if (options.chapter !== undefined) params.append('chapter', options.chapter)
    if (options.fromTurn !== undefined) params.append('fromTurn', options.fromTurn)
    if (options.toTurn !== undefined) params.append('toTurn', options.toTurn)
    if (options.fetish) params.append('fetish', options.fetish)
    if (options.limit) params.append('limit', options.limit)
    if (options.skip) params.append('skip', options.skip)
    if (options.hasUnresolvedConsequences) params.append('hasUnresolvedConsequences', 'true')
    
    const queryString = params.toString()
    const url = `${BASE_URL}/${saveSlotId}${queryString ? `?${queryString}` : ''}`
    
    return ApiClient.get(url)
  }

  /**
   * Get recent events
   */
  async getRecentEvents(saveSlotId, limit = 10) {
    return ApiClient.get(`${BASE_URL}/${saveSlotId}/recent?limit=${limit}`)
  }

  /**
   * Get events for a specific NPC
   */
  async getEventsByNpc(saveSlotId, npcId, limit = 20) {
    return ApiClient.get(`${BASE_URL}/${saveSlotId}/npc/${npcId}?limit=${limit}`)
  }

  /**
   * Get events by type
   */
  async getEventsByType(saveSlotId, type, limit = 20) {
    return ApiClient.get(`${BASE_URL}/${saveSlotId}/type/${type}?limit=${limit}`)
  }

  /**
   * Get unresolved consequences
   * @param {string} saveSlotId
   * @param {Object} options - { currentTurn, npc }
   */
  async getUnresolvedConsequences(saveSlotId, options = {}) {
    const params = new URLSearchParams()
    if (options.currentTurn) params.append('currentTurn', options.currentTurn)
    if (options.npc) params.append('npc', options.npc)
    
    const queryString = params.toString()
    const url = `${BASE_URL}/${saveSlotId}/consequences${queryString ? `?${queryString}` : ''}`
    
    return ApiClient.get(url)
  }

  /**
   * Get event summary for context building
   */
  async getEventSummary(saveSlotId, options = {}) {
    const params = new URLSearchParams()
    if (options.recentLimit) params.append('recentLimit', options.recentLimit)
    if (options.npcLimit) params.append('npcLimit', options.npcLimit)
    
    const queryString = params.toString()
    const url = `${BASE_URL}/${saveSlotId}/summary${queryString ? `?${queryString}` : ''}`
    
    return ApiClient.get(url)
  }

  /**
   * Resolve a consequence
   */
  async resolveConsequence(eventId, consequenceId) {
    return ApiClient.patch(`${BASE_URL}/${eventId}/consequences/${consequenceId}`)
  }

  /**
   * Resolve all expired consequences
   */
  async resolveExpiredConsequences(saveSlotId, currentTurn) {
    return ApiClient.post(`${BASE_URL}/${saveSlotId}/resolve-expired`, { currentTurn })
  }

  /**
   * Delete all events for a save slot
   */
  async deleteEvents(saveSlotId) {
    return ApiClient.delete(`${BASE_URL}/${saveSlotId}`)
  }
}

export const eventService = new EventService()
export default eventService
