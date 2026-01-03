import express from 'express'
import * as Event from '../models/Event.js'

const router = express.Router()

/**
 * POST /api/events
 * Create a new event
 */
router.post('/', async (req, res) => {
  try {
    const { saveSlotId, ...eventData } = req.body
    
    if (!saveSlotId) {
      return res.status(400).json({ error: 'saveSlotId is required' })
    }
    
    const event = await Event.createEvent(saveSlotId, eventData)
    res.status(201).json(event)
  } catch (error) {
    console.error('Error creating event:', error)
    res.status(500).json({ error: 'Failed to create event' })
  }
})

/**
 * GET /api/events/:saveSlotId
 * Get events with optional filters
 * Query params: npc, type, chapter, fromTurn, toTurn, fetish, limit, skip
 */
router.get('/:saveSlotId', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const { npc, type, chapter, fromTurn, toTurn, fetish, limit, skip, hasUnresolvedConsequences } = req.query
    
    const options = {}
    if (npc) options.npc = npc
    if (type) options.type = type.includes(',') ? type.split(',') : type
    if (chapter) options.chapter = parseInt(chapter)
    if (fromTurn) options.fromTurn = parseInt(fromTurn)
    if (toTurn) options.toTurn = parseInt(toTurn)
    if (fetish) options.fetish = fetish
    if (limit) options.limit = parseInt(limit)
    if (skip) options.skip = parseInt(skip)
    if (hasUnresolvedConsequences === 'true') options.hasUnresolvedConsequences = true
    
    const events = await Event.getEvents(saveSlotId, options)
    res.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({ error: 'Failed to fetch events' })
  }
})

/**
 * GET /api/events/:saveSlotId/recent
 * Get recent events
 * Query params: limit (default 10)
 */
router.get('/:saveSlotId/recent', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const limit = parseInt(req.query.limit) || 10
    
    const events = await Event.getRecentEvents(saveSlotId, limit)
    res.json(events)
  } catch (error) {
    console.error('Error fetching recent events:', error)
    res.status(500).json({ error: 'Failed to fetch recent events' })
  }
})

/**
 * GET /api/events/:saveSlotId/npc/:npcId
 * Get events for a specific NPC
 */
router.get('/:saveSlotId/npc/:npcId', async (req, res) => {
  try {
    const { saveSlotId, npcId } = req.params
    const limit = parseInt(req.query.limit) || 20
    
    const events = await Event.getEventsByNpc(saveSlotId, npcId, limit)
    res.json(events)
  } catch (error) {
    console.error('Error fetching NPC events:', error)
    res.status(500).json({ error: 'Failed to fetch NPC events' })
  }
})

/**
 * GET /api/events/:saveSlotId/type/:type
 * Get events by type
 */
router.get('/:saveSlotId/type/:type', async (req, res) => {
  try {
    const { saveSlotId, type } = req.params
    const limit = parseInt(req.query.limit) || 20
    
    const events = await Event.getEventsByType(saveSlotId, type, limit)
    res.json(events)
  } catch (error) {
    console.error('Error fetching events by type:', error)
    res.status(500).json({ error: 'Failed to fetch events by type' })
  }
})

/**
 * GET /api/events/:saveSlotId/consequences
 * Get all unresolved consequences
 * Query params: currentTurn (for expiration checking), npc (filter by NPC)
 */
router.get('/:saveSlotId/consequences', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const { currentTurn, npc } = req.query
    
    let consequences
    if (npc) {
      consequences = await Event.getConsequencesForNpc(
        saveSlotId, 
        npc, 
        currentTurn ? parseInt(currentTurn) : null
      )
    } else {
      consequences = await Event.getUnresolvedConsequences(
        saveSlotId,
        currentTurn ? parseInt(currentTurn) : null
      )
    }
    
    res.json(consequences)
  } catch (error) {
    console.error('Error fetching consequences:', error)
    res.status(500).json({ error: 'Failed to fetch consequences' })
  }
})

/**
 * GET /api/events/:saveSlotId/summary
 * Get event summary for context building
 */
router.get('/:saveSlotId/summary', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const { recentLimit, npcLimit } = req.query
    
    const options = {}
    if (recentLimit) options.recentLimit = parseInt(recentLimit)
    if (npcLimit) options.npcLimit = parseInt(npcLimit)
    
    const summary = await Event.getEventSummary(saveSlotId, options)
    res.json(summary)
  } catch (error) {
    console.error('Error fetching event summary:', error)
    res.status(500).json({ error: 'Failed to fetch event summary' })
  }
})

/**
 * PATCH /api/events/:eventId/consequences/:consequenceId
 * Resolve a consequence
 */
router.patch('/:eventId/consequences/:consequenceId', async (req, res) => {
  try {
    const { eventId, consequenceId } = req.params
    
    const resolved = await Event.resolveConsequence(eventId, consequenceId)
    
    if (resolved) {
      res.json({ success: true })
    } else {
      res.status(404).json({ error: 'Consequence not found' })
    }
  } catch (error) {
    console.error('Error resolving consequence:', error)
    res.status(500).json({ error: 'Failed to resolve consequence' })
  }
})

/**
 * POST /api/events/:saveSlotId/resolve-expired
 * Resolve all expired consequences
 */
router.post('/:saveSlotId/resolve-expired', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const { currentTurn } = req.body
    
    if (!currentTurn) {
      return res.status(400).json({ error: 'currentTurn is required' })
    }
    
    const count = await Event.resolveExpiredConsequences(saveSlotId, currentTurn)
    res.json({ resolved: count })
  } catch (error) {
    console.error('Error resolving expired consequences:', error)
    res.status(500).json({ error: 'Failed to resolve expired consequences' })
  }
})

/**
 * DELETE /api/events/:saveSlotId
 * Delete all events for a save slot
 */
router.delete('/:saveSlotId', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const count = await Event.deleteEventsBySaveSlot(saveSlotId)
    res.json({ deleted: count })
  } catch (error) {
    console.error('Error deleting events:', error)
    res.status(500).json({ error: 'Failed to delete events' })
  }
})

export default router
