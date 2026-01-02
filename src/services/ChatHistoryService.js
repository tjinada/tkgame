import { apiClient } from './ApiClient.js'

class ChatHistoryService {
  /**
   * Add a message to chat history
   * @param {Object} data - Message data
   * @returns {Promise<{id: string}>}
   */
  async addMessage(data) {
    const { saveSlotId, chapter, turn, role, content, scene, npc, statSnapshot } = data
    
    return await apiClient.post('/api/chat', {
      saveSlotId,
      chapter,
      turn,
      role,
      content,
      scene,
      npc,
      statSnapshot,
    })
  }

  /**
   * Get chat history for a save slot
   * @param {string} saveSlotId - Save slot ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async getHistory(saveSlotId, options = {}) {
    const { mode, chapter, limit } = options
    const params = new URLSearchParams()
    
    if (mode) params.append('mode', mode)
    if (chapter !== undefined) params.append('chapter', chapter)
    if (limit) params.append('limit', limit)
    
    const query = params.toString() ? `?${params}` : ''
    return await apiClient.get(`/api/chat/${saveSlotId}${query}`)
  }

  /**
   * Get chat history formatted for AI context
   * @param {string} saveSlotId - Save slot ID
   * @param {Object} options - Context options
   * @returns {Promise<{messages: Array, count: number}>}
   */
  async getContextMessages(saveSlotId, options = {}) {
    const { mode = 'last-n-turns', chapter, limit = 10, tokenBudget } = options
    const params = new URLSearchParams()
    
    params.append('mode', mode)
    if (chapter !== undefined) params.append('chapter', chapter)
    if (limit) params.append('limit', limit)
    if (tokenBudget) params.append('tokenBudget', tokenBudget)
    
    return await apiClient.get(`/api/chat/${saveSlotId}/context?${params}`)
  }

  /**
   * Delete chat history for a save slot
   * @param {string} saveSlotId - Save slot ID
   * @param {number|null} chapter - Optional chapter to delete
   * @returns {Promise<{deletedCount: number}>}
   */
  async deleteHistory(saveSlotId, chapter = null) {
    const query = chapter !== null ? `?chapter=${chapter}` : ''
    return await apiClient.delete(`/api/chat/${saveSlotId}${query}`)
  }

  /**
   * Clear all chat history (admin)
   * @returns {Promise<{deletedCount: number}>}
   */
  async clearAllHistory() {
    return await apiClient.delete('/api/chat')
  }

  /**
   * Add user message to history
   */
  async addUserMessage(saveSlotId, content, context = {}) {
    return this.addMessage({
      saveSlotId,
      role: 'user',
      content,
      ...context,
    })
  }

  /**
   * Add assistant message to history
   */
  async addAssistantMessage(saveSlotId, content, context = {}) {
    return this.addMessage({
      saveSlotId,
      role: 'assistant',
      content,
      ...context,
    })
  }

  /**
   * Add system message to history
   */
  async addSystemMessage(saveSlotId, content, context = {}) {
    return this.addMessage({
      saveSlotId,
      role: 'system',
      content,
      ...context,
    })
  }
}

export const chatHistoryService = new ChatHistoryService()
export default ChatHistoryService
