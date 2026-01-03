import { getDB } from '../config/db.js'
import { ObjectId } from 'mongodb'

const COLLECTION = 'progression'

// Stage definitions
const STAGES = {
  initiation: {
    order: 1,
    maxIntensity: 3,
    minDay: 1,
    minTurn: 0,
    description: 'Fresh meat - learning the basics'
  },
  training: {
    order: 2,
    maxIntensity: 5,
    minDay: 7,
    minTurn: 50,
    description: 'Established slave - regular sessions'
  },
  advanced: {
    order: 3,
    maxIntensity: 8,
    minDay: 21,
    minTurn: 150,
    description: 'Experienced - intense scenes unlocked'
  },
  veteran: {
    order: 4,
    maxIntensity: 10,
    minDay: 45,
    minTurn: 300,
    description: 'Seasoned veteran - nothing off limits'
  }
}

// Fetish types tracked
const FETISH_TYPES = [
  'tickling',
  'footWorship',
  'sweatWorship',
  'edging',
  'postOrgasmTorture',
  'bondage',
  'humiliation',
  'trampling',
  'smothering',
  'groupScenes',
  'pissPlay'
]

// Milestone definitions
const MILESTONES = {
  first_session: {
    name: 'First Session',
    description: 'Completed first scene with any NPC',
    stageUnlock: null
  },
  first_punishment: {
    name: 'First Punishment',
    description: 'Received first punishment for defiance',
    stageUnlock: null
  },
  met_all_queens: {
    name: 'Met All Queens',
    description: 'Had at least one encounter with each of the five Queens',
    stageUnlock: 'training'
  },
  first_devoted_npc: {
    name: 'First Devoted',
    description: 'Reached Devoted tier with any NPC',
    stageUnlock: 'advanced'
  },
  survived_group_scene: {
    name: 'Group Survival',
    description: 'Survived a scene with 3+ NPCs',
    stageUnlock: 'advanced'
  },
  experienced_all_fetishes: {
    name: 'Full Curriculum',
    description: 'Experienced all fetish types at least once',
    stageUnlock: 'veteran'
  },
  reached_enemy: {
    name: 'Made an Enemy',
    description: 'Dropped to Enemy tier with any NPC',
    stageUnlock: null
  },
  perfect_submission_streak: {
    name: 'Perfect Submission',
    description: 'Submitted 10 times in a row without defiance',
    stageUnlock: null
  },
  successful_defiance_streak: {
    name: 'Bold Defiance',
    description: 'Successfully defied 3 times in a row',
    stageUnlock: null
  }
}

/**
 * Create initial progression for a new save
 */
export async function createProgression(saveSlotId) {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  // Build initial experiences object
  const experiences = {}
  for (const fetish of FETISH_TYPES) {
    experiences[fetish] = {
      level: 0,
      firstExposure: null,
      lastExposure: null,
      totalExposures: 0
    }
  }
  
  // Build initial milestones
  const milestones = {}
  for (const [id, milestone] of Object.entries(MILESTONES)) {
    milestones[id] = {
      ...milestone,
      completed: false,
      completedAt: null,
      turn: null
    }
  }
  
  // Build initial NPC familiarity
  const npcFamiliarity = {
    sandy: { encounters: 0, lastSeen: null },
    araph: { encounters: 0, lastSeen: null },
    nancy: { encounters: 0, lastSeen: null },
    aish: { encounters: 0, lastSeen: null },
    gaya: { encounters: 0, lastSeen: null },
    melissa: { encounters: 0, lastSeen: null }
  }
  
  const doc = {
    saveSlotId,
    
    // Stage system
    stage: 'initiation',
    stageTransitionMode: 'milestone', // 'milestone' or 'automatic'
    dayNumber: 1,
    
    // Intensity management
    maxIntensity: STAGES.initiation.maxIntensity,
    currentIntensity: 1,
    
    // Experience tracking
    experiences,
    
    // NPC tracking
    npcFamiliarity,
    
    // Milestone tracking
    milestones,
    
    // Streak tracking (for milestone detection)
    streaks: {
      submissions: 0,
      defiances: 0,
      successfulDefiances: 0
    },
    
    // Timestamps
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  // Upsert by saveSlotId
  await collection.updateOne(
    { saveSlotId },
    { $set: doc },
    { upsert: true }
  )
  
  return doc
}

/**
 * Get progression for a save slot
 */
export async function getProgression(saveSlotId) {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  const progression = await collection.findOne({ saveSlotId })
  
  if (!progression) {
    // Create new progression if not exists
    return await createProgression(saveSlotId)
  }
  
  return progression
}

/**
 * Update progression after a turn
 */
export async function updateProgression(saveSlotId, updates) {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  const updateDoc = {
    ...updates,
    updatedAt: new Date()
  }
  
  const result = await collection.updateOne(
    { saveSlotId },
    { $set: updateDoc }
  )
  
  return result.modifiedCount > 0
}

/**
 * Record a fetish exposure
 */
export async function recordFetishExposure(saveSlotId, fetish, turn, intensity = 1) {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  const progression = await getProgression(saveSlotId)
  const currentExp = progression.experiences[fetish] || {
    level: 0,
    firstExposure: null,
    lastExposure: null,
    totalExposures: 0
  }
  
  // Calculate new level based on exposures and intensity
  const newTotalExposures = currentExp.totalExposures + 1
  let newLevel = currentExp.level
  
  // Level up logic: more exposures + higher intensity = faster leveling
  // Level 0→1: First exposure
  // Level 1→2: 3 exposures
  // Level 2→3: 6 exposures
  // Level 3→4: 10 exposures
  // Level 4→5: 15 exposures
  const levelThresholds = [1, 3, 6, 10, 15]
  
  for (let i = 0; i < levelThresholds.length; i++) {
    if (newTotalExposures >= levelThresholds[i] && newLevel <= i) {
      newLevel = i + 1
    }
  }
  
  // Cap at level 5
  newLevel = Math.min(5, newLevel)
  
  const updatedExp = {
    level: newLevel,
    firstExposure: currentExp.firstExposure || `turn_${turn}`,
    lastExposure: `turn_${turn}`,
    totalExposures: newTotalExposures
  }
  
  await collection.updateOne(
    { saveSlotId },
    { 
      $set: { 
        [`experiences.${fetish}`]: updatedExp,
        updatedAt: new Date()
      } 
    }
  )
  
  return { fetish, previousLevel: currentExp.level, newLevel, leveldUp: newLevel > currentExp.level }
}

/**
 * Record NPC encounter
 */
export async function recordNpcEncounter(saveSlotId, npcId, turn) {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  await collection.updateOne(
    { saveSlotId },
    {
      $inc: { [`npcFamiliarity.${npcId}.encounters`]: 1 },
      $set: { 
        [`npcFamiliarity.${npcId}.lastSeen`]: `turn_${turn}`,
        updatedAt: new Date()
      }
    }
  )
}

/**
 * Complete a milestone
 */
export async function completeMilestone(saveSlotId, milestoneId, turn) {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  const progression = await getProgression(saveSlotId)
  
  if (!progression.milestones[milestoneId]) {
    return { success: false, error: 'Unknown milestone' }
  }
  
  if (progression.milestones[milestoneId].completed) {
    return { success: false, error: 'Already completed' }
  }
  
  const milestone = MILESTONES[milestoneId]
  
  await collection.updateOne(
    { saveSlotId },
    {
      $set: {
        [`milestones.${milestoneId}.completed`]: true,
        [`milestones.${milestoneId}.completedAt`]: new Date(),
        [`milestones.${milestoneId}.turn`]: turn,
        updatedAt: new Date()
      }
    }
  )
  
  // Check if this unlocks a stage transition
  let stageUnlocked = null
  if (milestone.stageUnlock && progression.stageTransitionMode === 'milestone') {
    const currentStageOrder = STAGES[progression.stage].order
    const unlockStageOrder = STAGES[milestone.stageUnlock].order
    
    if (unlockStageOrder === currentStageOrder + 1) {
      // This milestone unlocks the next stage
      stageUnlocked = milestone.stageUnlock
    }
  }
  
  return { 
    success: true, 
    milestone: milestoneId, 
    stageUnlocked 
  }
}

/**
 * Advance to next stage
 */
export async function advanceStage(saveSlotId, force = false) {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  const progression = await getProgression(saveSlotId)
  const currentStage = STAGES[progression.stage]
  
  // Find next stage
  const stageOrder = ['initiation', 'training', 'advanced', 'veteran']
  const currentIndex = stageOrder.indexOf(progression.stage)
  
  if (currentIndex >= stageOrder.length - 1) {
    return { success: false, error: 'Already at maximum stage' }
  }
  
  const nextStageName = stageOrder[currentIndex + 1]
  const nextStage = STAGES[nextStageName]
  
  // Check requirements unless forced
  if (!force && progression.stageTransitionMode === 'automatic') {
    if (progression.dayNumber < nextStage.minDay) {
      return { 
        success: false, 
        error: `Need day ${nextStage.minDay}, currently day ${progression.dayNumber}` 
      }
    }
  }
  
  await collection.updateOne(
    { saveSlotId },
    {
      $set: {
        stage: nextStageName,
        maxIntensity: nextStage.maxIntensity,
        updatedAt: new Date()
      }
    }
  )
  
  return { 
    success: true, 
    previousStage: progression.stage,
    newStage: nextStageName,
    maxIntensity: nextStage.maxIntensity
  }
}

/**
 * Update streak counters
 */
export async function updateStreaks(saveSlotId, choiceType, success = true) {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  const isSubmission = ['submit', 'grovel', 'offer', 'endure'].includes(choiceType)
  const isDefiance = ['defy', 'resist', 'negotiate', 'distract'].includes(choiceType)
  
  const updates = {}
  
  if (isSubmission) {
    updates['streaks.submissions'] = { $add: ['$streaks.submissions', 1] }
    updates['streaks.defiances'] = 0
    updates['streaks.successfulDefiances'] = 0
  } else if (isDefiance) {
    updates['streaks.submissions'] = 0
    updates['streaks.defiances'] = { $add: ['$streaks.defiances', 1] }
    if (success) {
      updates['streaks.successfulDefiances'] = { $add: ['$streaks.successfulDefiances', 1] }
    } else {
      updates['streaks.successfulDefiances'] = 0
    }
  }
  
  // Use simpler update for MongoDB
  const progression = await getProgression(saveSlotId)
  const newStreaks = { ...progression.streaks }
  
  if (isSubmission) {
    newStreaks.submissions += 1
    newStreaks.defiances = 0
    newStreaks.successfulDefiances = 0
  } else if (isDefiance) {
    newStreaks.submissions = 0
    newStreaks.defiances += 1
    if (success) {
      newStreaks.successfulDefiances += 1
    } else {
      newStreaks.successfulDefiances = 0
    }
  }
  
  await collection.updateOne(
    { saveSlotId },
    { $set: { streaks: newStreaks, updatedAt: new Date() } }
  )
  
  return newStreaks
}

/**
 * Increment day number
 */
export async function incrementDay(saveSlotId) {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  const result = await collection.findOneAndUpdate(
    { saveSlotId },
    { 
      $inc: { dayNumber: 1 },
      $set: { updatedAt: new Date() }
    },
    { returnDocument: 'after' }
  )
  
  return result?.dayNumber || 1
}

/**
 * Set stage transition mode
 */
export async function setStageTransitionMode(saveSlotId, mode) {
  if (!['milestone', 'automatic'].includes(mode)) {
    return { success: false, error: 'Invalid mode' }
  }
  
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  await collection.updateOne(
    { saveSlotId },
    { $set: { stageTransitionMode: mode, updatedAt: new Date() } }
  )
  
  return { success: true, mode }
}

/**
 * Delete progression for a save slot
 */
export async function deleteProgression(saveSlotId) {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  const result = await collection.deleteOne({ saveSlotId })
  return { deleted: result.deletedCount > 0 }
}

/**
 * Get stage definitions (for frontend)
 */
export function getStageDefinitions() {
  return STAGES
}

/**
 * Get milestone definitions (for frontend)
 */
export function getMilestoneDefinitions() {
  return MILESTONES
}

/**
 * Get fetish types (for frontend)
 */
export function getFetishTypes() {
  return FETISH_TYPES
}

/**
 * Check milestone conditions based on current state
 */
export async function checkMilestones(saveSlotId, gameState) {
  const progression = await getProgression(saveSlotId)
  const completedMilestones = []
  
  const { stats, affinities, turn } = gameState
  
  // Check met_all_queens
  if (!progression.milestones.met_all_queens?.completed) {
    const allMet = ['araph', 'nancy', 'aish', 'gaya', 'melissa'].every(
      npc => progression.npcFamiliarity[npc]?.encounters > 0
    )
    if (allMet) {
      const result = await completeMilestone(saveSlotId, 'met_all_queens', turn)
      if (result.success) completedMilestones.push(result)
    }
  }
  
  // Check first_devoted_npc
  if (!progression.milestones.first_devoted_npc?.completed) {
    const hasDevoted = Object.values(affinities).some(aff => aff >= 50)
    if (hasDevoted) {
      const result = await completeMilestone(saveSlotId, 'first_devoted_npc', turn)
      if (result.success) completedMilestones.push(result)
    }
  }
  
  // Check reached_enemy
  if (!progression.milestones.reached_enemy?.completed) {
    const hasEnemy = Object.values(affinities).some(aff => aff <= -50)
    if (hasEnemy) {
      const result = await completeMilestone(saveSlotId, 'reached_enemy', turn)
      if (result.success) completedMilestones.push(result)
    }
  }
  
  // Check experienced_all_fetishes
  if (!progression.milestones.experienced_all_fetishes?.completed) {
    const allExperienced = FETISH_TYPES.every(
      fetish => progression.experiences[fetish]?.level > 0
    )
    if (allExperienced) {
      const result = await completeMilestone(saveSlotId, 'experienced_all_fetishes', turn)
      if (result.success) completedMilestones.push(result)
    }
  }
  
  // Check perfect_submission_streak
  if (!progression.milestones.perfect_submission_streak?.completed) {
    if (progression.streaks.submissions >= 10) {
      const result = await completeMilestone(saveSlotId, 'perfect_submission_streak', turn)
      if (result.success) completedMilestones.push(result)
    }
  }
  
  // Check successful_defiance_streak
  if (!progression.milestones.successful_defiance_streak?.completed) {
    if (progression.streaks.successfulDefiances >= 3) {
      const result = await completeMilestone(saveSlotId, 'successful_defiance_streak', turn)
      if (result.success) completedMilestones.push(result)
    }
  }
  
  return completedMilestones
}

export default {
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
  checkMilestones,
  STAGES,
  MILESTONES,
  FETISH_TYPES
}
