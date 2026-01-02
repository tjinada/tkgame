import express from 'express'
import { getDB } from '../config/db.js'

const router = express.Router()

// Get all NPCs
router.get('/npcs', async (req, res) => {
  try {
    const db = getDB()
    const npcs = await db.collection('npcs').find({}).toArray()
    res.json(npcs)
  } catch (error) {
    console.error('Get NPCs error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get single NPC
router.get('/npcs/:id', async (req, res) => {
  try {
    const db = getDB()
    const npc = await db.collection('npcs').findOne({ id: req.params.id })
    
    if (!npc) {
      return res.status(404).json({ error: 'NPC not found' })
    }
    
    res.json(npc)
  } catch (error) {
    console.error('Get NPC error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update NPC
router.put('/npcs/:id', async (req, res) => {
  try {
    const db = getDB()
    const result = await db.collection('npcs').updateOne(
      { id: req.params.id },
      { $set: { ...req.body, updatedAt: new Date() } }
    )
    res.json({ updated: result.modifiedCount > 0 })
  } catch (error) {
    console.error('Update NPC error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get all events
router.get('/events', async (req, res) => {
  try {
    const db = getDB()
    const events = await db.collection('events').find({}).sort({ id: 1 }).toArray()
    res.json(events)
  } catch (error) {
    console.error('Get events error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get single event
router.get('/events/:id', async (req, res) => {
  try {
    const db = getDB()
    const event = await db.collection('events').findOne({ id: parseInt(req.params.id) })
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }
    
    res.json(event)
  } catch (error) {
    console.error('Get event error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update event
router.put('/events/:id', async (req, res) => {
  try {
    const db = getDB()
    const result = await db.collection('events').updateOne(
      { id: parseInt(req.params.id) },
      { $set: { ...req.body, updatedAt: new Date() } }
    )
    res.json({ updated: result.modifiedCount > 0 })
  } catch (error) {
    console.error('Update event error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get all settings
router.get('/settings', async (req, res) => {
  try {
    const db = getDB()
    const settings = await db.collection('settings').find({}).toArray()
    
    // Convert array to object
    const settingsObj = {}
    for (const s of settings) {
      settingsObj[s.key] = s.value
    }
    
    res.json(settingsObj)
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get single setting
router.get('/settings/:key', async (req, res) => {
  try {
    const db = getDB()
    const setting = await db.collection('settings').findOne({ key: req.params.key })
    res.json(setting ? { value: setting.value } : { value: null })
  } catch (error) {
    console.error('Get setting error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update settings (single or multiple)
router.put('/settings', async (req, res) => {
  try {
    const db = getDB()
    const collection = db.collection('settings')
    
    // Support both single { key, value } and multiple { key1: value1, key2: value2 }
    const updates = req.body.key 
      ? [{ key: req.body.key, value: req.body.value }]
      : Object.entries(req.body).map(([key, value]) => ({ key, value }))
    
    for (const { key, value } of updates) {
      await collection.updateOne(
        { key },
        { $set: { key, value, updatedAt: new Date() } },
        { upsert: true }
      )
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete setting
router.delete('/settings/:key', async (req, res) => {
  try {
    const db = getDB()
    const result = await db.collection('settings').deleteOne({ key: req.params.key })
    res.json({ deleted: result.deletedCount > 0 })
  } catch (error) {
    console.error('Delete setting error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
