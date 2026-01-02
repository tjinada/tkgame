import express from 'express'
import {
  createSave,
  getSave,
  getAllSaves,
  deleteSave,
  deleteAllSaves,
} from '../models/Save.js'

const router = express.Router()

// Create or update save
router.post('/', async (req, res) => {
  try {
    const result = await createSave(req.body)
    res.json(result)
  } catch (error) {
    console.error('Save error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get all saves (metadata only)
router.get('/', async (req, res) => {
  try {
    const saves = await getAllSaves()
    res.json(saves)
  } catch (error) {
    console.error('Get saves error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get specific save
router.get('/:slotId', async (req, res) => {
  try {
    const save = await getSave(req.params.slotId)
    
    if (!save) {
      return res.status(404).json({ error: 'Save not found' })
    }
    
    res.json(save)
  } catch (error) {
    console.error('Get save error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete save
router.delete('/:slotId', async (req, res) => {
  try {
    const result = await deleteSave(req.params.slotId)
    res.json(result)
  } catch (error) {
    console.error('Delete save error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete all saves
router.delete('/', async (req, res) => {
  try {
    const result = await deleteAllSaves()
    res.json(result)
  } catch (error) {
    console.error('Delete all saves error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
