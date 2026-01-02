import { getDB } from '../config/db.js'
import { ObjectId } from 'mongodb'

const COLLECTION = 'chat_history'

export async function addMessage(data) {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  const doc = {
    saveSlotId: data.saveSlotId,
    chapter: data.chapter,
    turn: data.turn,
    role: data.role, // 'user', 'assistant', 'system'
    content: data.content,
    scene: data.scene || null,
    npc: data.npc || null,
    statSnapshot: data.statSnapshot || null,
    timestamp: new Date(),
  }

  const result = await collection.insertOne(doc)
  return { id: result.insertedId.toString() }
}

export async function getHistory(saveSlotId, options = {}) {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  const { mode = 'last-n-turns', chapter, limit = 50 } = options
  
  let query = { saveSlotId }
  
  if (mode === 'full-chapter' && chapter !== undefined) {
    query.chapter = chapter
  }
  
  const messages = await collection
    .find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray()

  // Return in chronological order
  return messages.reverse()
}

export async function getHistoryForContext(saveSlotId, options = {}) {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  const { 
    mode = 'last-n-turns', 
    chapter, 
    limit = 10, 
    tokenBudget = 4000 
  } = options
  
  let query = { saveSlotId }
  
  if (mode === 'full-chapter' && chapter !== undefined) {
    query.chapter = chapter
  }
  
  let messages
  
  switch (mode) {
    case 'full-chapter':
      messages = await collection
        .find(query)
        .sort({ timestamp: 1 })
        .toArray()
      break
      
    case 'last-n-turns':
      messages = await collection
        .find(query)
        .sort({ timestamp: -1 })
        .limit(limit * 2) // Get more to account for user+assistant pairs
        .toArray()
      messages = messages.reverse()
      break
      
    case 'token-budget':
      // Rough estimate: 4 chars per token
      messages = await collection
        .find(query)
        .sort({ timestamp: -1 })
        .toArray()
      
      let totalTokens = 0
      const filtered = []
      for (const msg of messages) {
        const msgTokens = Math.ceil(msg.content.length / 4)
        if (totalTokens + msgTokens > tokenBudget) break
        filtered.unshift(msg)
        totalTokens += msgTokens
      }
      messages = filtered
      break
      
    case 'smart-summary':
      // Get all messages
      const allMessages = await collection
        .find(query)
        .sort({ timestamp: 1 })
        .toArray()
      
      // Keep last 5 turns verbatim, summarize the rest
      const recentCount = 10 // ~5 turns = 10 messages (user + assistant)
      if (allMessages.length <= recentCount) {
        messages = allMessages
      } else {
        const older = allMessages.slice(0, -recentCount)
        const recent = allMessages.slice(-recentCount)
        
        // Create a summary placeholder for older messages
        const summary = {
          role: 'system',
          content: `[Previous context: ${older.length} messages from earlier in the conversation. Key events have shaped the current state.]`,
          isSummary: true,
        }
        
        messages = [summary, ...recent]
      }
      break
      
    default:
      messages = await collection
        .find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray()
      messages = messages.reverse()
  }
  
  return messages
}

export async function deleteHistory(saveSlotId, chapter = null) {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  const query = { saveSlotId }
  if (chapter !== null) {
    query.chapter = chapter
  }
  
  const result = await collection.deleteMany(query)
  return { deletedCount: result.deletedCount }
}

export async function clearAllHistory() {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  const result = await collection.deleteMany({})
  return { deletedCount: result.deletedCount }
}

export default {
  addMessage,
  getHistory,
  getHistoryForContext,
  deleteHistory,
  clearAllHistory,
}
