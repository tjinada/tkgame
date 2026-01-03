import { progressionService } from '../services/ProgressionService.js'

/**
 * Stage definitions (mirrored from backend for client-side logic)
 */
const STAGES = {
  initiation: {
    order: 1,
    maxIntensity: 3,
    minDay: 1,
    description: 'Fresh meat - learning the basics'
  },
  training: {
    order: 2,
    maxIntensity: 5,
    minDay: 7,
    description: 'Established slave - regular sessions'
  },
  advanced: {
    order: 3,
    maxIntensity: 8,
    minDay: 21,
    description: 'Experienced - intense scenes unlocked'
  },
  veteran: {
    order: 4,
    maxIntensity: 10,
    minDay: 45,
    description: 'Seasoned veteran - nothing off limits'
  }
}

/**
 * Fetish keywords for detection from scene descriptions
 */
const FETISH_KEYWORDS = {
  tickling: ['tickl', 'feather', 'squirm', 'giggle', 'laugh', 'writhe'],
  footWorship: ['foot', 'feet', 'boot', 'sole', 'toe', 'heel', 'lick', 'worship'],
  sweatWorship: ['sweat', 'armpit', 'musk', 'scent', 'smell', 'salty', 'post-workout'],
  edging: ['edge', 'denial', 'orgasm', 'tease', 'stroke', 'brink', 'almost'],
  postOrgasmTorture: ['oversensitive', 'post-orgasm', 'after', 'torture', 'milk', 'sensitive'],
  bondage: ['bound', 'tied', 'restrain', 'rope', 'chain', 'cuff', 'helpless', 'immobile'],
  humiliation: ['pathetic', 'worthless', 'worm', 'maggot', 'disgust', 'shame', 'humiliat'],
  trampling: ['trample', 'step', 'stomp', 'crush', 'stand on'],
  smothering: ['smother', 'suffocate', 'face', 'breath', 'sit on'],
  groupScenes: ['all of them', 'together', 'gang', 'surround', 'circle'],
  pissPlay: ['piss', 'urine', 'golden', 'wet']
}

/**
 * Body part to fetish mapping
 */
const BODYPART_FETISH_MAP = {
  feet: 'footWorship',
  armpit: 'sweatWorship',
  hands: null, // Could be tickling or other
  face_closeup: 'smothering',
  torso: null,
  back: null,
  legs: 'trampling',
  full_body: null
}

/**
 * ProgressionSystem - Handles all progression tracking logic
 */
export class ProgressionSystem {
  constructor() {
    this.saveSlotId = null
    this.progression = null
    this.definitions = null
    this.initialized = false
  }

  /**
   * Initialize the progression system
   * @param {string} saveSlotId
   * @returns {Promise<Object>} Current progression state
   */
  async initialize(saveSlotId) {
    this.saveSlotId = saveSlotId
    
    // Load definitions if not cached
    if (!this.definitions) {
      try {
        this.definitions = await progressionService.getDefinitions()
      } catch (error) {
        console.warn('Could not load definitions from server, using defaults')
        this.definitions = {
          stages: STAGES,
          milestones: {},
          fetishTypes: Object.keys(FETISH_KEYWORDS)
        }
      }
    }
    
    // Load or create progression
    this.progression = await progressionService.getProgression(saveSlotId)
    this.initialized = true
    
    return this.progression
  }

  /**
   * Reset progression for new game
   * @param {string} saveSlotId
   * @returns {Promise<Object>}
   */
  async reset(saveSlotId) {
    this.saveSlotId = saveSlotId
    this.progression = await progressionService.createProgression(saveSlotId)
    this.initialized = true
    return this.progression
  }

  /**
   * Get current progression state
   * @returns {Object|null}
   */
  getProgression() {
    return this.progression
  }

  /**
   * Get current stage info
   * @returns {Object}
   */
  getCurrentStage() {
    if (!this.progression) return STAGES.initiation
    return STAGES[this.progression.stage] || STAGES.initiation
  }

  /**
   * Get maximum allowed intensity for current stage
   * @returns {number}
   */
  getMaxIntensity() {
    return this.progression?.maxIntensity || 3
  }

  /**
   * Check if an intensity level is allowed
   * @param {number} intensity
   * @returns {boolean}
   */
  isIntensityAllowed(intensity) {
    return intensity <= this.getMaxIntensity()
  }

  /**
   * Get experience level for a fetish
   * @param {string} fetish
   * @returns {number} 0-5
   */
  getFetishLevel(fetish) {
    return this.progression?.experiences?.[fetish]?.level || 0
  }

  /**
   * Check if a fetish has been experienced
   * @param {string} fetish
   * @returns {boolean}
   */
  hasExperienced(fetish) {
    return this.getFetishLevel(fetish) > 0
  }

  /**
   * Get list of unexperienced fetishes
   * @returns {string[]}
   */
  getUnexperiencedFetishes() {
    if (!this.progression?.experiences) return Object.keys(FETISH_KEYWORDS)
    
    return Object.keys(FETISH_KEYWORDS).filter(
      fetish => !this.hasExperienced(fetish)
    )
  }

  /**
   * Detect fetishes from scene content
   * @param {Object} scene - Scene data with description, bodyPart, etc.
   * @returns {string[]} Detected fetish types
   */
  detectFetishesFromScene(scene) {
    const detected = new Set()
    
    // Check body part mapping
    if (scene.bodyPart && BODYPART_FETISH_MAP[scene.bodyPart]) {
      detected.add(BODYPART_FETISH_MAP[scene.bodyPart])
    }
    
    // Check description keywords
    const text = (scene.description || '').toLowerCase()
    
    for (const [fetish, keywords] of Object.entries(FETISH_KEYWORDS)) {
      if (keywords.some(kw => text.includes(kw))) {
        detected.add(fetish)
      }
    }
    
    // Check for group scene indicators
    if (scene.npcs && scene.npcs.length >= 3) {
      detected.add('groupScenes')
    }
    
    return [...detected]
  }

  /**
   * Calculate intensity of a scene
   * @param {Object} scene - Scene data
   * @param {Object} choice - Player's choice
   * @param {Object} state - Current game state
   * @returns {number} 1-10 intensity
   */
  calculateSceneIntensity(scene, choice, state) {
    let intensity = 2 // Base intensity
    
    // Increase for defiant choices
    if (['defy', 'resist', 'negotiate'].includes(choice?.type)) {
      intensity += 1
    }
    
    // Increase for hostile NPCs
    const npcAffinity = state?.affinities?.[scene.npc] || 0
    if (npcAffinity <= -30) intensity += 2
    else if (npcAffinity <= -10) intensity += 1
    
    // Increase for devoted NPCs (more intense attention)
    if (npcAffinity >= 50) intensity += 1
    
    // Increase for body part focus
    if (scene.bodyPart) intensity += 1
    
    // Increase for multiple fetishes
    const detectedFetishes = this.detectFetishesFromScene(scene)
    if (detectedFetishes.length >= 2) intensity += 1
    if (detectedFetishes.length >= 4) intensity += 2
    
    // Increase for group scenes
    if (scene.npcs && scene.npcs.length >= 2) {
      intensity += scene.npcs.length - 1
    }
    
    // Clamp to 1-10
    return Math.max(1, Math.min(10, intensity))
  }

  /**
   * Process a completed turn - update all progression tracking
   * @param {Object} scene - Scene that was completed
   * @param {Object} choice - Player's choice
   * @param {Object} diceResult - Dice roll result if any
   * @param {Object} state - Current game state
   * @returns {Promise<Object>} Progression update results
   */
  async processTurn(scene, choice, diceResult, state) {
    if (!this.saveSlotId || !this.initialized) {
      console.warn('ProgressionSystem not initialized')
      return null
    }
    
    const results = {
      fetishLevelUps: [],
      milestonesCompleted: [],
      stageAdvanced: null,
      streaks: null
    }
    
    const turn = state.turn
    
    // 1. Record NPC encounter
    if (scene.npc) {
      await progressionService.recordNpcEncounter(this.saveSlotId, scene.npc, turn)
    }
    
    // 2. Detect and record fetish exposures
    const detectedFetishes = this.detectFetishesFromScene(scene)
    if (detectedFetishes.length > 0) {
      const intensity = this.calculateSceneIntensity(scene, choice, state)
      const { results: fetishResults } = await progressionService.recordFetishExposures(
        this.saveSlotId,
        detectedFetishes,
        turn,
        intensity
      )
      
      // Track level ups
      results.fetishLevelUps = fetishResults.filter(r => r.leveledUp)
    }
    
    // 3. Update streaks
    if (choice?.type) {
      const success = diceResult ? diceResult.success : true
      const { streaks } = await progressionService.updateStreaks(
        this.saveSlotId,
        choice.type,
        success
      )
      results.streaks = streaks
    }
    
    // 4. Check milestones
    const { completedMilestones } = await progressionService.checkMilestones(
      this.saveSlotId,
      {
        stats: state.stats,
        affinities: state.affinities,
        turn
      }
    )
    results.milestonesCompleted = completedMilestones
    
    // 5. Check for stage unlock from milestones
    for (const milestone of completedMilestones) {
      if (milestone.stageUnlocked) {
        const advanceResult = await progressionService.advanceStage(this.saveSlotId)
        if (advanceResult.success) {
          results.stageAdvanced = advanceResult
        }
      }
    }
    
    // 6. Refresh local progression state
    this.progression = await progressionService.getProgression(this.saveSlotId)
    
    return results
  }

  /**
   * Record first session milestone
   * @param {number} turn
   * @returns {Promise<Object>}
   */
  async recordFirstSession(turn) {
    if (!this.progression?.milestones?.first_session?.completed) {
      return await progressionService.completeMilestone(
        this.saveSlotId,
        'first_session',
        turn
      )
    }
    return { success: false, error: 'Already completed' }
  }

  /**
   * Record first punishment milestone
   * @param {number} turn
   * @returns {Promise<Object>}
   */
  async recordFirstPunishment(turn) {
    if (!this.progression?.milestones?.first_punishment?.completed) {
      return await progressionService.completeMilestone(
        this.saveSlotId,
        'first_punishment',
        turn
      )
    }
    return { success: false, error: 'Already completed' }
  }

  /**
   * Record group scene milestone
   * @param {number} turn
   * @param {number} npcCount
   * @returns {Promise<Object>}
   */
  async recordGroupScene(turn, npcCount) {
    if (npcCount >= 3 && !this.progression?.milestones?.survived_group_scene?.completed) {
      return await progressionService.completeMilestone(
        this.saveSlotId,
        'survived_group_scene',
        turn
      )
    }
    return { success: false, error: 'Not enough NPCs or already completed' }
  }

  /**
   * Advance to next day
   * @returns {Promise<number>} New day number
   */
  async advanceDay() {
    const { dayNumber } = await progressionService.incrementDay(this.saveSlotId)
    
    // Refresh progression
    this.progression = await progressionService.getProgression(this.saveSlotId)
    
    // Check for automatic stage advancement
    if (this.progression.stageTransitionMode === 'automatic') {
      const currentStage = STAGES[this.progression.stage]
      const stageOrder = ['initiation', 'training', 'advanced', 'veteran']
      const currentIndex = stageOrder.indexOf(this.progression.stage)
      
      if (currentIndex < stageOrder.length - 1) {
        const nextStage = STAGES[stageOrder[currentIndex + 1]]
        if (dayNumber >= nextStage.minDay) {
          await progressionService.advanceStage(this.saveSlotId)
          this.progression = await progressionService.getProgression(this.saveSlotId)
        }
      }
    }
    
    return dayNumber
  }

  /**
   * Force advance stage (admin function)
   * @returns {Promise<Object>}
   */
  async forceAdvanceStage() {
    const result = await progressionService.advanceStage(this.saveSlotId, true)
    if (result.success) {
      this.progression = await progressionService.getProgression(this.saveSlotId)
    }
    return result
  }

  /**
   * Set stage transition mode
   * @param {'milestone'|'automatic'} mode
   * @returns {Promise<Object>}
   */
  async setTransitionMode(mode) {
    const result = await progressionService.setStageTransitionMode(this.saveSlotId, mode)
    if (result.success) {
      this.progression.stageTransitionMode = mode
    }
    return result
  }

  /**
   * Build progression context for AI prompts
   * @returns {Object}
   */
  buildContextForPrompt() {
    if (!this.progression) {
      return {
        stage: 'initiation',
        maxIntensity: 3,
        dayNumber: 1,
        experienced: [],
        notExperienced: Object.keys(FETISH_KEYWORDS),
        npcFamiliarity: {}
      }
    }
    
    const experienced = []
    const notExperienced = []
    
    for (const [fetish, data] of Object.entries(this.progression.experiences || {})) {
      if (data.level > 0) {
        experienced.push({
          fetish,
          level: data.level,
          label: this._getFetishLevelLabel(data.level)
        })
      } else {
        notExperienced.push(fetish)
      }
    }
    
    return {
      stage: this.progression.stage,
      stageDescription: STAGES[this.progression.stage]?.description,
      maxIntensity: this.progression.maxIntensity,
      dayNumber: this.progression.dayNumber,
      experienced,
      notExperienced,
      npcFamiliarity: this.progression.npcFamiliarity,
      streaks: this.progression.streaks,
      completedMilestones: Object.entries(this.progression.milestones || {})
        .filter(([_, m]) => m.completed)
        .map(([id, m]) => ({ id, name: m.name }))
    }
  }

  /**
   * Get human-readable label for fetish level
   * @param {number} level
   * @returns {string}
   */
  _getFetishLevelLabel(level) {
    const labels = {
      0: 'unexperienced',
      1: 'introduced',
      2: 'familiar',
      3: 'experienced',
      4: 'seasoned',
      5: 'mastered'
    }
    return labels[level] || 'unknown'
  }

  /**
   * Get stage info
   * @returns {Object}
   */
  getStageInfo() {
    return STAGES
  }
}

// Export singleton instance
export const progressionSystem = new ProgressionSystem()
export default ProgressionSystem
