import express from 'express'
import {
  addMessage,
  getHistory,
  getHistoryForContext,
  deleteHistory,
  clearAllHistory,
} from '../models/ChatHistory.js'

const router = express.Router()

// Add message to chat history
router.post('/', async (req, res) => {
  try {
    const {
      saveSlotId,
      chapter,
      turn,
      role,
      content,
      scene,
      npc,
      statSnapshot,
    } = req.body
    
    if (!saveSlotId || !role || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields: saveSlotId, role, content' 
      })
    }
    
    const result = await addMessage({
      saveSlotId,
      chapter,
      turn,
      role,
      content,
      scene,
      npc,
      statSnapshot,
    })
    
    res.json(result)
  } catch (error) {
    console.error('Add message error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get chat history for a save slot
router.get('/:saveSlotId', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const { mode, chapter, limit } = req.query
    
    const history = await getHistory(saveSlotId, {
      mode,
      chapter: chapter ? parseInt(chapter) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    })
    
    res.json(history)
  } catch (error) {
    console.error('Get history error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get chat history formatted for AI context
router.get('/:saveSlotId/context', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const { mode, chapter, limit, tokenBudget } = req.query
    
    const history = await getHistoryForContext(saveSlotId, {
      mode: mode || 'last-n-turns',
      chapter: chapter ? parseInt(chapter) : undefined,
      limit: limit ? parseInt(limit) : 10,
      tokenBudget: tokenBudget ? parseInt(tokenBudget) : 4000,
    })
    
    // Format for API consumption
    const messages = history.map(h => ({
      role: h.role,
      content: h.content,
    }))
    
    res.json({ messages, count: messages.length })
  } catch (error) {
    console.error('Get context error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete chat history for a save slot
router.delete('/:saveSlotId', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const { chapter } = req.query
    
    const result = await deleteHistory(
      saveSlotId, 
      chapter ? parseInt(chapter) : null
    )
    
    res.json(result)
  } catch (error) {
    console.error('Delete history error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Clear all chat history (admin)
router.delete('/', async (req, res) => {
  try {
    const result = await clearAllHistory()
    res.json(result)
  } catch (error) {
    console.error('Clear history error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
