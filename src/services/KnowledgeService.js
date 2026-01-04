import { apiClient } from './ApiClient'

const KnowledgeService = {
  // ═══════════════════════════════════════════════════════════════════
  // MAIN KNOWLEDGE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════
  
  async getKnowledge(saveSlotId) {
    return apiClient.get(`/api/knowledge/${saveSlotId}`)
  },

  async resetKnowledge(saveSlotId) {
    return apiClient.post(`/api/knowledge/${saveSlotId}/reset`)
  },

  async deleteKnowledge(saveSlotId) {
    return apiClient.delete(`/api/knowledge/${saveSlotId}`)
  },

  async getKnowledgeGraph(saveSlotId) {
    return apiClient.get(`/api/knowledge/${saveSlotId}/graph`)
  },

  // ═══════════════════════════════════════════════════════════════════
  // TJ KNOWLEDGE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════

  async getTJKnownNpcs(saveSlotId) {
    return apiClient.get(`/api/knowledge/${saveSlotId}/tj/npcs`)
  },

  async getTJKnowledgeOfNpc(saveSlotId, npcId) {
    return apiClient.get(`/api/knowledge/${saveSlotId}/tj/npcs/${npcId}`)
  },

  async updateTJNpcKnowledge(saveSlotId, npcId, updates) {
    return apiClient.patch(`/api/knowledge/${saveSlotId}/tj/npcs/${npcId}`, updates)
  },

  async makeTJAwareOfNpc(saveSlotId, npcId, turn) {
    return apiClient.post(`/api/knowledge/${saveSlotId}/tj/npcs/${npcId}/aware`, { turn })
  },

  async getTJDiscoveredLocations(saveSlotId) {
    return apiClient.get(`/api/knowledge/${saveSlotId}/tj/locations`)
  },

  async updateTJLocationKnowledge(saveSlotId, locationId, turn) {
    return apiClient.patch(`/api/knowledge/${saveSlotId}/tj/locations/${locationId}`, { turn })
  },

  async addTJWorldFact(saveSlotId, fact) {
    return apiClient.post(`/api/knowledge/${saveSlotId}/tj/facts`, { fact })
  },

  // ═══════════════════════════════════════════════════════════════════
  // NPC KNOWLEDGE OF TJ OPERATIONS
  // ═══════════════════════════════════════════════════════════════════

  async getNpcKnowledgeOfTJ(saveSlotId, npcId) {
    return apiClient.get(`/api/knowledge/${saveSlotId}/npc/${npcId}/tj`)
  },

  async addNpcDirectExperience(saveSlotId, npcId, experience) {
    return apiClient.post(`/api/knowledge/${saveSlotId}/npc/${npcId}/experience`, experience)
  },

  // ═══════════════════════════════════════════════════════════════════
  // GOSSIP OPERATIONS
  // ═══════════════════════════════════════════════════════════════════

  async processGossip(saveSlotId, presentNpcs, turn, tjWitnessed = true) {
    return apiClient.post(`/api/knowledge/${saveSlotId}/gossip/process`, {
      presentNpcs,
      turn,
      tjWitnessed
    })
  },

  async getRecentGossip(saveSlotId, limit = 5) {
    return apiClient.get(`/api/knowledge/${saveSlotId}/gossip/recent?limit=${limit}`)
  },

  async getWitnessedGossip(saveSlotId) {
    return apiClient.get(`/api/knowledge/${saveSlotId}/gossip/witnessed`)
  },

  // ═══════════════════════════════════════════════════════════════════
  // NPC-TO-NPC KNOWLEDGE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════

  async updateNpcToNpcKnowledge(saveSlotId, observerNpc, subjectNpc, updates) {
    return apiClient.patch(`/api/knowledge/${saveSlotId}/npc/${observerNpc}/knows/${subjectNpc}`, updates)
  }
}

export default KnowledgeService
