import { getDB } from '../config/db.js'
import { ObjectId } from 'mongodb'

const COLLECTION = 'events'

/**
 * Event Model - Handles semantic event logging and consequence tracking
 */

/**
 * Create a new event
 */
export async function createEvent(saveSlotId, eventData) {
  const db = getDB()
  
  const event = {
    saveSlotId,
    turn: eventData.turn,
    chapter: eventData.chapter,
    timestamp: new Date(),
    
    // Core event data
    type: eventData.type,
    npc: eventData.npc || null,
    location: eventData.location || null,
    
    // What happened
    description: eventData.description || '',
    choiceText: eventData.choiceText || '',
    outcome: eventData.outcome || '',
    
    // Mechanical data
    diceRoll: eventData.diceRoll || null,
    statChanges: eventData.statChanges || {},
    affinityChanges: eventData.affinityChanges || {},
    
    // Fetishes and intensity
    fetishesInvolved: eventData.fetishesInvolved || [],
    intensity: eventData.intensity || 0,
    
    // AI-provided flags
    narrativeFlags: eventData.narrativeFlags || {},
    
    // Consequences
    consequences: (eventData.consequences || []).map(c => ({
      id: new ObjectId().toString(),
      type: c.type,
      description: c.description,
      targetNpc: c.targetNpc || null,
      expiresAfterTurns: c.expiresAfterTurns || null,
      expiresAtTurn: c.expiresAfterTurns ? eventData.turn + c.expiresAfterTurns : null,
      resolved: false,
      resolvedAt: null
    }))
  }
  
  const result = await db.collection(COLLECTION).insertOne(event)
  return { ...event, _id: result.insertedId }
}

/**
 * Get events with filters
 */
export async function getEvents(saveSlotId, options = {}) {
  const db = getDB()
  
  const query = { saveSlotId }
  
  // Filter by NPC
  if (options.npc) {
    query.npc = options.npc
  }
  
  // Filter by event type
  if (options.type) {
    query.type = Array.isArray(options.type) ? { $in: options.type } : options.type
  }
  
  // Filter by chapter
  if (options.chapter !== undefined) {
    query.chapter = options.chapter
  }
  
  // Filter by turn range
  if (options.fromTurn !== undefined || options.toTurn !== undefined) {
    query.turn = {}
    if (options.fromTurn !== undefined) query.turn.$gte = options.fromTurn
    if (options.toTurn !== undefined) query.turn.$lte = options.toTurn
  }
  
  // Filter by fetish
  if (options.fetish) {
    query.fetishesInvolved = options.fetish
  }
  
  // Filter events with unresolved consequences
  if (options.hasUnresolvedConsequences) {
    query['consequences'] = {
      $elemMatch: { resolved: false }
    }
  }
  
  const limit = options.limit || 100
  const skip = options.skip || 0
  const sort = options.sort || { turn: -1 }
  
  const events = await db.collection(COLLECTION)
    .find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .toArray()
  
  return events
}

/**
 * Get recent events
 */
export async function getRecentEvents(saveSlotId, limit = 10) {
  return getEvents(saveSlotId, { limit, sort: { turn: -1 } })
}

/**
 * Get events by NPC
 */
export async function getEventsByNpc(saveSlotId, npcId, limit = 20) {
  return getEvents(saveSlotId, { npc: npcId, limit, sort: { turn: -1 } })
}

/**
 * Get events by type
 */
export async function getEventsByType(saveSlotId, type, limit = 20) {
  return getEvents(saveSlotId, { type, limit, sort: { turn: -1 } })
}

/**
 * Get all unresolved consequences
 */
export async function getUnresolvedConsequences(saveSlotId, currentTurn = null) {
  const db = getDB()
  
  const query = {
    saveSlotId,
    'consequences': {
      $elemMatch: { resolved: false }
    }
  }
  
  const events = await db.collection(COLLECTION)
    .find(query)
    .sort({ turn: -1 })
    .toArray()
  
  // Extract and flatten unresolved consequences
  const consequences = []
  for (const event of events) {
    for (const c of event.consequences) {
      if (!c.resolved) {
        // Check if expired
        const isExpired = currentTurn && c.expiresAtTurn && currentTurn > c.expiresAtTurn
        if (!isExpired) {
          consequences.push({
            ...c,
            eventId: event._id.toString(),
            eventTurn: event.turn,
            eventType: event.type,
            eventNpc: event.npc,
            eventDescription: event.description
          })
        }
      }
    }
  }
  
  return consequences
}

/**
 * Get consequences for a specific NPC
 */
export async function getConsequencesForNpc(saveSlotId, npcId, currentTurn = null) {
  const all = await getUnresolvedConsequences(saveSlotId, currentTurn)
  return all.filter(c => c.targetNpc === npcId || c.eventNpc === npcId)
}

/**
 * Resolve a consequence
 */
export async function resolveConsequence(eventId, consequenceId) {
  const db = getDB()
  
  const result = await db.collection(COLLECTION).updateOne(
    { 
      _id: new ObjectId(eventId),
      'consequences.id': consequenceId
    },
    {
      $set: {
        'consequences.$.resolved': true,
        'consequences.$.resolvedAt': new Date()
      }
    }
  )
  
  return result.modifiedCount > 0
}

/**
 * Resolve all expired consequences
 */
export async function resolveExpiredConsequences(saveSlotId, currentTurn) {
  const db = getDB()
  
  const result = await db.collection(COLLECTION).updateMany(
    {
      saveSlotId,
      'consequences': {
        $elemMatch: {
          resolved: false,
          expiresAtTurn: { $lte: currentTurn }
        }
      }
    },
    {
      $set: {
        'consequences.$[elem].resolved': true,
        'consequences.$[elem].resolvedAt': new Date()
      }
    },
    {
      arrayFilters: [
        { 'elem.resolved': false, 'elem.expiresAtTurn': { $lte: currentTurn } }
      ]
    }
  )
  
  return result.modifiedCount
}

/**
 * Get event summary for context building
 */
export async function getEventSummary(saveSlotId, options = {}) {
  const db = getDB()
  
  const recentLimit = options.recentLimit || 5
  
  // Get recent events
  const recentEvents = await getRecentEvents(saveSlotId, recentLimit)
  
  // Get event counts by type
  const typeCounts = await db.collection(COLLECTION).aggregate([
    { $match: { saveSlotId } },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]).toArray()
  
  // Get event counts by NPC
  const npcCounts = await db.collection(COLLECTION).aggregate([
    { $match: { saveSlotId, npc: { $ne: null } } },
    { $group: { _id: '$npc', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]).toArray()
  
  // Get unresolved consequences
  const unresolvedConsequences = await getUnresolvedConsequences(saveSlotId)
  
  return {
    recentEvents,
    typeCounts: Object.fromEntries(typeCounts.map(t => [t._id, t.count])),
    npcCounts: Object.fromEntries(npcCounts.map(n => [n._id, n.count])),
    unresolvedConsequences,
    totalEvents: await db.collection(COLLECTION).countDocuments({ saveSlotId })
  }
}

/**
 * Get a single event by ID
 */
export async function getEventById(eventId) {
  const db = getDB()
  return db.collection(COLLECTION).findOne({ _id: new ObjectId(eventId) })
}

/**
 * Delete all events for a save slot
 */
export async function deleteEventsBySaveSlot(saveSlotId) {
  const db = getDB()
  const result = await db.collection(COLLECTION).deleteMany({ saveSlotId })
  return result.deletedCount
}

/**
 * Create indexes for efficient queries
 */
export async function createIndexes() {
  const db = getDB()
  await db.collection(COLLECTION).createIndex({ saveSlotId: 1, turn: -1 })
  await db.collection(COLLECTION).createIndex({ saveSlotId: 1, npc: 1 })
  await db.collection(COLLECTION).createIndex({ saveSlotId: 1, type: 1 })
  await db.collection(COLLECTION).createIndex({ saveSlotId: 1, 'consequences.resolved': 1 })
}

export default {
  createEvent,
  getEvents,
  getRecentEvents,
  getEventsByNpc,
  getEventsByType,
  getUnresolvedConsequences,
  getConsequencesForNpc,
  resolveConsequence,
  resolveExpiredConsequences,
  getEventSummary,
  getEventById,
  deleteEventsBySaveSlot,
  createIndexes
}
