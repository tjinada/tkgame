import express from 'express'
import {
  createProgression,
  getProgression,
  updateProgression,
  recordFetishExposure,
  recordNpcEncounter,
  completeMilestone,
  advanceStage,
  updateStreaks,
  incrementDay,
  setStageTransitionMode,
  deleteProgression,
  getStageDefinitions,
  getMilestoneDefinitions,
  getFetishTypes,
  checkMilestones
} from '../models/Progression.js'

const router = express.Router()

// Get stage/milestone/fetish definitions (static data)
router.get('/definitions', (req, res) => {
  res.json({
    stages: getStageDefinitions(),
    milestones: getMilestoneDefinitions(),
    fetishTypes: getFetishTypes()
  })
})

// Get progression for a save slot
router.get('/:saveSlotId', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const progression = await getProgression(saveSlotId)
    res.json(progression)
  } catch (error) {
    console.error('Get progression error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create/reset progression for a save slot
router.post('/:saveSlotId', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const progression = await createProgression(saveSlotId)
    res.json(progression)
  } catch (error) {
    console.error('Create progression error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update progression
router.patch('/:saveSlotId', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const updates = req.body
    
    const success = await updateProgression(saveSlotId, updates)
    res.json({ success })
  } catch (error) {
    console.error('Update progression error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Record fetish exposure
router.post('/:saveSlotId/fetish', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const { fetish, turn, intensity } = req.body
    
    if (!fetish || turn === undefined) {
      return res.status(400).json({ error: 'Missing fetish or turn' })
    }
    
    const result = await recordFetishExposure(saveSlotId, fetish, turn, intensity)
    res.json(result)
  } catch (error) {
    console.error('Record fetish error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Record multiple fetish exposures at once
router.post('/:saveSlotId/fetishes', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const { fetishes, turn, intensity } = req.body
    
    if (!fetishes || !Array.isArray(fetishes) || turn === undefined) {
      return res.status(400).json({ error: 'Missing fetishes array or turn' })
    }
    
    const results = []
    for (const fetish of fetishes) {
      const result = await recordFetishExposure(saveSlotId, fetish, turn, intensity)
      results.push(result)
    }
    
    res.json({ results })
  } catch (error) {
    console.error('Record fetishes error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Record NPC encounter
router.post('/:saveSlotId/npc-encounter', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const { npcId, turn } = req.body
    
    if (!npcId || turn === undefined) {
      return res.status(400).json({ error: 'Missing npcId or turn' })
    }
    
    await recordNpcEncounter(saveSlotId, npcId, turn)
    res.json({ success: true })
  } catch (error) {
    console.error('Record NPC encounter error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Complete a milestone
router.post('/:saveSlotId/milestone', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const { milestoneId, turn } = req.body
    
    if (!milestoneId || turn === undefined) {
      return res.status(400).json({ error: 'Missing milestoneId or turn' })
    }
    
    const result = await completeMilestone(saveSlotId, milestoneId, turn)
    res.json(result)
  } catch (error) {
    console.error('Complete milestone error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Check all milestone conditions
router.post('/:saveSlotId/check-milestones', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const gameState = req.body
    
    if (!gameState || !gameState.affinities) {
      return res.status(400).json({ error: 'Missing game state' })
    }
    
    const completedMilestones = await checkMilestones(saveSlotId, gameState)
    res.json({ completedMilestones })
  } catch (error) {
    console.error('Check milestones error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Advance to next stage
router.post('/:saveSlotId/advance-stage', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const { force } = req.body
    
    const result = await advanceStage(saveSlotId, force === true)
    res.json(result)
  } catch (error) {
    console.error('Advance stage error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update streaks
router.post('/:saveSlotId/streaks', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const { choiceType, success } = req.body
    
    if (!choiceType) {
      return res.status(400).json({ error: 'Missing choiceType' })
    }
    
    const streaks = await updateStreaks(saveSlotId, choiceType, success !== false)
    res.json({ streaks })
  } catch (error) {
    console.error('Update streaks error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Increment day
router.post('/:saveSlotId/increment-day', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const dayNumber = await incrementDay(saveSlotId)
    res.json({ dayNumber })
  } catch (error) {
    console.error('Increment day error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Set stage transition mode
router.post('/:saveSlotId/transition-mode', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const { mode } = req.body
    
    if (!mode) {
      return res.status(400).json({ error: 'Missing mode' })
    }
    
    const result = await setStageTransitionMode(saveSlotId, mode)
    res.json(result)
  } catch (error) {
    console.error('Set transition mode error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete progression
router.delete('/:saveSlotId', async (req, res) => {
  try {
    const { saveSlotId } = req.params
    const result = await deleteProgression(saveSlotId)
    res.json(result)
  } catch (error) {
    console.error('Delete progression error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
