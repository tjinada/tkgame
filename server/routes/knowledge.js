import express from 'express'
import * as Knowledge from '../models/Knowledge.js'

const router = express.Router()

// ═══════════════════════════════════════════════════════════════════
// MAIN KNOWLEDGE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

// GET /api/knowledge/:saveSlotId - Get full knowledge state
router.get('/:saveSlotId', async (req, res) => {
  try {
    const knowledge = await Knowledge.getKnowledge(req.params.saveSlotId)
    res.json(knowledge)
  } catch (error) {
    console.error('Failed to get knowledge:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/knowledge/:saveSlotId/reset - Reset for new game
router.post('/:saveSlotId/reset', async (req, res) => {
  try {
    const knowledge = await Knowledge.resetKnowledge(req.params.saveSlotId)
    res.json(knowledge)
  } catch (error) {
    console.error('Failed to reset knowledge:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/knowledge/:saveSlotId - Delete knowledge
router.delete('/:saveSlotId', async (req, res) => {
  try {
    const result = await Knowledge.deleteKnowledge(req.params.saveSlotId)
    res.json(result)
  } catch (error) {
    console.error('Failed to delete knowledge:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/knowledge/:saveSlotId/graph - Get graph data for visualization
router.get('/:saveSlotId/graph', async (req, res) => {
  try {
    const graph = await Knowledge.getKnowledgeGraph(req.params.saveSlotId)
    res.json(graph)
  } catch (error) {
    console.error('Failed to get knowledge graph:', error)
    res.status(500).json({ error: error.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// TJ KNOWLEDGE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

// GET /api/knowledge/:saveSlotId/tj/npcs - All NPCs TJ knows
router.get('/:saveSlotId/tj/npcs', async (req, res) => {
  try {
    const npcs = await Knowledge.getTJKnownNpcs(req.params.saveSlotId)
    res.json(npcs)
  } catch (error) {
    console.error('Failed to get TJ known NPCs:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/knowledge/:saveSlotId/tj/npcs/:npcId - TJ's knowledge of specific NPC
router.get('/:saveSlotId/tj/npcs/:npcId', async (req, res) => {
  try {
    const knowledge = await Knowledge.getTJKnowledgeOfNpc(req.params.saveSlotId, req.params.npcId)
    res.json(knowledge)
  } catch (error) {
    console.error('Failed to get TJ knowledge of NPC:', error)
    res.status(500).json({ error: error.message })
  }
})

// PATCH /api/knowledge/:saveSlotId/tj/npcs/:npcId - Update after encounter
router.patch('/:saveSlotId/tj/npcs/:npcId', async (req, res) => {
  try {
    const result = await Knowledge.updateTJNpcKnowledge(req.params.saveSlotId, req.params.npcId, req.body)
    res.json(result)
  } catch (error) {
    console.error('Failed to update TJ NPC knowledge:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/knowledge/:saveSlotId/tj/npcs/:npcId/aware - Make TJ aware of NPC
router.post('/:saveSlotId/tj/npcs/:npcId/aware', async (req, res) => {
  try {
    const { turn } = req.body
    const result = await Knowledge.makeTJAwareOfNpc(req.params.saveSlotId, req.params.npcId, turn)
    res.json(result)
  } catch (error) {
    console.error('Failed to make TJ aware of NPC:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/knowledge/:saveSlotId/tj/locations - All locations TJ discovered
router.get('/:saveSlotId/tj/locations', async (req, res) => {
  try {
    const locations = await Knowledge.getTJDiscoveredLocations(req.params.saveSlotId)
    res.json(locations)
  } catch (error) {
    console.error('Failed to get TJ discovered locations:', error)
    res.status(500).json({ error: error.message })
  }
})

// PATCH /api/knowledge/:saveSlotId/tj/locations/:locationId - Update location visit
router.patch('/:saveSlotId/tj/locations/:locationId', async (req, res) => {
  try {
    const { turn } = req.body
    const result = await Knowledge.updateTJLocationKnowledge(req.params.saveSlotId, req.params.locationId, turn)
    res.json(result)
  } catch (error) {
    console.error('Failed to update TJ location knowledge:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/knowledge/:saveSlotId/tj/facts - Add world fact
router.post('/:saveSlotId/tj/facts', async (req, res) => {
  try {
    const { fact } = req.body
    const result = await Knowledge.addTJWorldFact(req.params.saveSlotId, fact)
    res.json(result)
  } catch (error) {
    console.error('Failed to add TJ world fact:', error)
    res.status(500).json({ error: error.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// NPC KNOWLEDGE OF TJ ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

// GET /api/knowledge/:saveSlotId/npc/:npcId/tj - What NPC knows about TJ
router.get('/:saveSlotId/npc/:npcId/tj', async (req, res) => {
  try {
    const knowledge = await Knowledge.getNpcKnowledgeOfTJ(req.params.saveSlotId, req.params.npcId)
    res.json(knowledge)
  } catch (error) {
    console.error('Failed to get NPC knowledge of TJ:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/knowledge/:saveSlotId/npc/:npcId/experience - Record direct experience
router.post('/:saveSlotId/npc/:npcId/experience', async (req, res) => {
  try {
    const result = await Knowledge.addNpcDirectExperience(req.params.saveSlotId, req.params.npcId, req.body)
    res.json(result)
  } catch (error) {
    console.error('Failed to add NPC experience:', error)
    res.status(500).json({ error: error.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// GOSSIP ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

// POST /api/knowledge/:saveSlotId/gossip/process - Process gossip when NPCs meet
router.post('/:saveSlotId/gossip/process', async (req, res) => {
  try {
    const { presentNpcs, turn, tjWitnessed } = req.body
    const gossipEvents = await Knowledge.processGossip(req.params.saveSlotId, presentNpcs, turn, tjWitnessed)
    res.json({ gossipEvents })
  } catch (error) {
    console.error('Failed to process gossip:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/knowledge/:saveSlotId/gossip/recent - Get recent gossip
router.get('/:saveSlotId/gossip/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5
    const gossip = await Knowledge.getRecentGossip(req.params.saveSlotId, limit)
    res.json(gossip)
  } catch (error) {
    console.error('Failed to get recent gossip:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/knowledge/:saveSlotId/gossip/witnessed - Get gossip TJ witnessed
router.get('/:saveSlotId/gossip/witnessed', async (req, res) => {
  try {
    const gossip = await Knowledge.getWitnessedGossip(req.params.saveSlotId)
    res.json(gossip)
  } catch (error) {
    console.error('Failed to get witnessed gossip:', error)
    res.status(500).json({ error: error.message })
  }
})

// ═══════════════════════════════════════════════════════════════════
// NPC-TO-NPC KNOWLEDGE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

// PATCH /api/knowledge/:saveSlotId/npc/:observerNpc/knows/:subjectNpc
router.patch('/:saveSlotId/npc/:observerNpc/knows/:subjectNpc', async (req, res) => {
  try {
    const result = await Knowledge.updateNpcToNpcKnowledge(
      req.params.saveSlotId,
      req.params.observerNpc,
      req.params.subjectNpc,
      req.body
    )
    res.json(result)
  } catch (error) {
    console.error('Failed to update NPC-to-NPC knowledge:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
