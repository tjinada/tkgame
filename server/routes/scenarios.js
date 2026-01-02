import express from 'express'
import { getDB } from '../config/db.js'
import { ObjectId } from 'mongodb'

const router = express.Router()
const COLLECTION = 'scenarios'

// Get all scenarios (metadata only)
router.get('/', async (req, res) => {
  try {
    const db = getDB()
    const scenarios = await db.collection(COLLECTION)
      .find({})
      .project({
        scenarioId: 1,
        name: 1,
        chapter: 1,
        sceneCount: { $size: '$scenes' },
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .toArray()
    
    res.json(scenarios)
  } catch (error) {
    console.error('Get scenarios error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get single scenario (full)
router.get('/:id', async (req, res) => {
  try {
    const db = getDB()
    const scenario = await db.collection(COLLECTION).findOne({ 
      scenarioId: req.params.id 
    })
    
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' })
    }
    
    res.json(scenario)
  } catch (error) {
    console.error('Get scenario error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create or update scenario
router.post('/', async (req, res) => {
  try {
    const db = getDB()
    const { id, name, chapter, scenes } = req.body
    
    if (!id || !name || !scenes) {
      return res.status(400).json({ 
        error: 'Missing required fields: id, name, scenes' 
      })
    }
    
    const doc = {
      scenarioId: id,
      name,
      chapter: chapter || 1,
      scenes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const result = await db.collection(COLLECTION).updateOne(
      { scenarioId: id },
      { $set: doc },
      { upsert: true }
    )
    
    res.json({ 
      scenarioId: id, 
      created: result.upsertedCount > 0,
      updated: result.modifiedCount > 0,
    })
  } catch (error) {
    console.error('Create scenario error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete scenario
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB()
    const result = await db.collection(COLLECTION).deleteOne({ 
      scenarioId: req.params.id 
    })
    
    res.json({ deleted: result.deletedCount > 0 })
  } catch (error) {
    console.error('Delete scenario error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get scene from scenario
router.get('/:scenarioId/scene/:sceneId', async (req, res) => {
  try {
    const db = getDB()
    const scenario = await db.collection(COLLECTION).findOne({ 
      scenarioId: req.params.scenarioId 
    })
    
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' })
    }
    
    const scene = scenario.scenes.find(s => s.id === req.params.sceneId)
    
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' })
    }
    
    res.json(scene)
  } catch (error) {
    console.error('Get scene error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
