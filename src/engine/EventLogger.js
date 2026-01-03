import { eventService } from '../services/EventService'

/**
 * EventLogger - Handles semantic event logging from gameplay
 * Called by GameEngine after each turn to log what happened
 */

// Event type classification
const EVENT_TYPES = {
  SUBMISSION: 'submission',
  DEFIANCE: 'defiance',
  DEFIANCE_FAILED: 'defiance_failed',
  PUNISHMENT: 'punishment',
  REWARD: 'reward',
  SCENE_CHANGE: 'scene_change',
  CUSTOM_ACTION: 'custom_action',
  DICE_SUCCESS: 'dice_success',
  DICE_FAILURE: 'dice_failure',
  CRITICAL_SUCCESS: 'critical_success',
  CRITICAL_FAILURE: 'critical_failure'
}

// Keywords for detecting event types from choice text
const SUBMISSION_KEYWORDS = [
  'yes', 'obey', 'submit', 'comply', 'accept', 'serve', 'worship', 
  'lick', 'kiss', 'bow', 'kneel', 'please', 'beg', 'thank'
]

const DEFIANCE_KEYWORDS = [
  'no', 'refuse', 'defy', 'resist', 'reject', 'deny', 'stop',
  'won\'t', 'can\'t', 'never', 'escape', 'fight', 'struggle'
]

// Fetish detection from narrative content
const FETISH_KEYWORDS = {
  tickling: ['tickl', 'feather', 'wiggl', 'squirm', 'giggl', 'laugh'],
  footWorship: ['foot', 'feet', 'sole', 'toe', 'heel', 'arch', 'barefoot'],
  sweatWorship: ['sweat', 'musk', 'scent', 'smell', 'aroma', 'salty', 'workout'],
  edging: ['edge', 'deny', 'denial', 'tease', 'brink', 'almost', 'close'],
  postOrgasmTorture: ['sensitive', 'overstim', 'post-orgasm', 'torture', 'aftershock'],
  bondage: ['bind', 'bound', 'tie', 'tied', 'chain', 'restrain', 'rope', 'cuff'],
  humiliation: ['humiliat', 'embarrass', 'shame', 'pathetic', 'worthless', 'disgrace'],
  trampling: ['trampl', 'step', 'stomp', 'crush', 'walk on'],
  smothering: ['smother', 'suffocate', 'face', 'sit on', 'press'],
  groupScenes: ['group', 'together', 'all of', 'surround', 'gang']
}

// Consequence templates based on event type
const CONSEQUENCE_TEMPLATES = {
  // Defiance consequences
  defiance: [
    { type: 'npc_remembers', description: '{npc} remembers your defiance', expiresAfterTurns: 10 },
    { type: 'affinity_drift', description: '{npc}\'s patience is wearing thin', expiresAfterTurns: 5 }
  ],
  defiance_failed: [
    { type: 'npc_remembers', description: '{npc} savors your failed rebellion', expiresAfterTurns: 15 },
    { type: 'scene_trigger', description: 'Punishment incoming', expiresAfterTurns: 3 }
  ],
  // Critical outcomes
  critical_success: [
    { type: 'npc_remembers', description: '{npc} is impressed by your performance', expiresAfterTurns: 10 }
  ],
  critical_failure: [
    { type: 'npc_remembers', description: '{npc} won\'t forget this failure', expiresAfterTurns: 15 },
    { type: 'stat_modifier', description: 'Lingering shame', expiresAfterTurns: 5 }
  ],
  // Submission streak
  submission_streak: [
    { type: 'npc_remembers', description: '{npc} notices your obedient streak', expiresAfterTurns: 8 }
  ]
}

class EventLogger {
  constructor() {
    this.saveSlotId = null
  }

  /**
   * Initialize with save slot ID
   */
  initialize(saveSlotId) {
    this.saveSlotId = saveSlotId
  }

  /**
   * Main method: Log a turn event
   * Called by GameEngine after processing a turn
   */
  async logTurnEvent(turnData) {
    if (!this.saveSlotId) {
      console.warn('EventLogger not initialized with saveSlotId')
      return null
    }

    const {
      turn,
      chapter,
      choice,
      outcome,
      scene,
      historyEntry,
      progressionResults,
      diceRoll,
      isCustomAction
    } = turnData

    // Determine event type
    const eventType = this._classifyEventType(choice, diceRoll, isCustomAction)

    // Extract fetishes from scene description
    const fetishesInvolved = this._detectFetishes(
      scene?.description || '',
      historyEntry?.description || ''
    )

    // Generate consequences based on event
    const consequences = this._generateConsequences(
      eventType,
      scene?.npc,
      diceRoll,
      progressionResults
    )

    // Build event data
    const eventData = {
      turn,
      chapter,
      type: eventType,
      npc: scene?.npc || null,
      location: scene?.location || null,
      
      description: this._generateDescription(eventType, choice, scene),
      choiceText: choice?.text || (isCustomAction ? turnData.actionText : ''),
      outcome: historyEntry?.outcome || '',
      
      diceRoll: diceRoll ? {
        base: diceRoll.base,
        modifiers: diceRoll.modifiers,
        total: diceRoll.total,
        dc: diceRoll.dc,
        success: diceRoll.success,
        critical: diceRoll.critical
      } : null,
      
      statChanges: historyEntry?.statChanges || {},
      affinityChanges: historyEntry?.affinityChanges || {},
      
      fetishesInvolved,
      intensity: progressionResults?.intensity || 0,
      
      narrativeFlags: this._extractNarrativeFlags(scene, outcome),
      
      consequences
    }

    try {
      const event = await eventService.createEvent(this.saveSlotId, eventData)
      return event
    } catch (error) {
      console.error('Failed to log event:', error)
      return null
    }
  }

  /**
   * Classify the event type based on choice and dice roll
   */
  _classifyEventType(choice, diceRoll, isCustomAction) {
    if (isCustomAction) {
      return EVENT_TYPES.CUSTOM_ACTION
    }

    const choiceText = (choice?.text || '').toLowerCase()
    const choiceType = choice?.type

    // Check for dice roll outcomes first
    if (diceRoll) {
      if (diceRoll.critical === 'success') return EVENT_TYPES.CRITICAL_SUCCESS
      if (diceRoll.critical === 'failure') return EVENT_TYPES.CRITICAL_FAILURE
      if (diceRoll.success) return EVENT_TYPES.DICE_SUCCESS
      return EVENT_TYPES.DICE_FAILURE
    }

    // Check explicit choice type
    if (choiceType === 'submit' || choiceType === 'submission') {
      return EVENT_TYPES.SUBMISSION
    }
    if (choiceType === 'defy' || choiceType === 'defiance') {
      return EVENT_TYPES.DEFIANCE
    }

    // Keyword-based classification
    const hasSubmissionKeyword = SUBMISSION_KEYWORDS.some(kw => choiceText.includes(kw))
    const hasDefianceKeyword = DEFIANCE_KEYWORDS.some(kw => choiceText.includes(kw))

    if (hasDefianceKeyword && !hasSubmissionKeyword) {
      return EVENT_TYPES.DEFIANCE
    }
    if (hasSubmissionKeyword) {
      return EVENT_TYPES.SUBMISSION
    }

    // Default to scene change if no clear classification
    return EVENT_TYPES.SCENE_CHANGE
  }

  /**
   * Detect fetishes from text content
   */
  _detectFetishes(...texts) {
    const combinedText = texts.join(' ').toLowerCase()
    const detected = []

    for (const [fetish, keywords] of Object.entries(FETISH_KEYWORDS)) {
      if (keywords.some(kw => combinedText.includes(kw))) {
        detected.push(fetish)
      }
    }

    return detected
  }

  /**
   * Generate consequences based on event type
   */
  _generateConsequences(eventType, npc, diceRoll, progressionResults) {
    const consequences = []
    const templates = CONSEQUENCE_TEMPLATES[eventType] || []

    for (const template of templates) {
      consequences.push({
        type: template.type,
        description: template.description.replace('{npc}', npc || 'They'),
        targetNpc: npc,
        expiresAfterTurns: template.expiresAfterTurns
      })
    }

    // Add streak-based consequences
    if (progressionResults?.streaks?.submissions >= 3 && eventType === EVENT_TYPES.SUBMISSION) {
      consequences.push({
        type: 'npc_remembers',
        description: `${npc || 'They'} notices your consistent obedience`,
        targetNpc: npc,
        expiresAfterTurns: 10
      })
    }

    if (progressionResults?.streaks?.successfulDefiances >= 2 && eventType === EVENT_TYPES.DEFIANCE) {
      consequences.push({
        type: 'scene_trigger',
        description: 'Your rebellious streak hasn\'t gone unnoticed',
        targetNpc: npc,
        expiresAfterTurns: 5
      })
    }

    return consequences
  }

  /**
   * Generate a brief description of the event
   */
  _generateDescription(eventType, choice, scene) {
    const npc = scene?.npc || 'someone'
    const choiceText = choice?.text || 'took action'

    switch (eventType) {
      case EVENT_TYPES.SUBMISSION:
        return `Submitted to ${npc}`
      case EVENT_TYPES.DEFIANCE:
        return `Defied ${npc}`
      case EVENT_TYPES.DEFIANCE_FAILED:
        return `Failed defiance against ${npc}`
      case EVENT_TYPES.CRITICAL_SUCCESS:
        return `Critical success with ${npc}`
      case EVENT_TYPES.CRITICAL_FAILURE:
        return `Critical failure with ${npc}`
      case EVENT_TYPES.DICE_SUCCESS:
        return `Succeeded challenge from ${npc}`
      case EVENT_TYPES.DICE_FAILURE:
        return `Failed challenge from ${npc}`
      case EVENT_TYPES.CUSTOM_ACTION:
        return `Custom action: ${choiceText.substring(0, 50)}`
      default:
        return `Scene with ${npc}`
    }
  }

  /**
   * Extract narrative flags from AI response (if present)
   */
  _extractNarrativeFlags(scene, outcome) {
    const flags = {}
    const text = (scene?.description || '') + ' ' + (outcome?.description || '')
    const textLower = text.toLowerCase()

    // Detect threats
    if (textLower.includes('warn') || textLower.includes('threat') || 
        textLower.includes('punish') || textLower.includes('consequence')) {
      flags.npcThreatened = true
    }

    // Detect promises
    if (textLower.includes('reward') || textLower.includes('promise') ||
        textLower.includes('earn') || textLower.includes('please me')) {
      flags.npcPromisedReward = true
    }

    // Detect mood shifts
    if (textLower.includes('angry') || textLower.includes('furious') || textLower.includes('rage')) {
      flags.moodShift = 'angry'
    } else if (textLower.includes('pleased') || textLower.includes('satisfied') || textLower.includes('happy')) {
      flags.moodShift = 'pleased'
    } else if (textLower.includes('amused') || textLower.includes('laugh')) {
      flags.moodShift = 'amused'
    } else if (textLower.includes('disappointed') || textLower.includes('bored')) {
      flags.moodShift = 'disappointed'
    }

    return flags
  }

  /**
   * Get unresolved consequences for context
   */
  async getUnresolvedConsequences(currentTurn) {
    if (!this.saveSlotId) return []
    
    try {
      return await eventService.getUnresolvedConsequences(this.saveSlotId, { currentTurn })
    } catch (error) {
      console.error('Failed to get consequences:', error)
      return []
    }
  }

  /**
   * Get recent events for context
   */
  async getRecentEvents(limit = 5) {
    if (!this.saveSlotId) return []
    
    try {
      return await eventService.getRecentEvents(this.saveSlotId, limit)
    } catch (error) {
      console.error('Failed to get recent events:', error)
      return []
    }
  }

  /**
   * Get event summary for context building
   */
  async getEventSummary() {
    if (!this.saveSlotId) return null
    
    try {
      return await eventService.getEventSummary(this.saveSlotId)
    } catch (error) {
      console.error('Failed to get event summary:', error)
      return null
    }
  }

  /**
   * Get events for a specific NPC
   */
  async getEventsForNpc(npcId, limit = 10) {
    if (!this.saveSlotId) return []
    
    try {
      return await eventService.getEventsByNpc(this.saveSlotId, npcId, limit)
    } catch (error) {
      console.error('Failed to get NPC events:', error)
      return []
    }
  }

  /**
   * Resolve a consequence
   */
  async resolveConsequence(eventId, consequenceId) {
    try {
      return await eventService.resolveConsequence(eventId, consequenceId)
    } catch (error) {
      console.error('Failed to resolve consequence:', error)
      return false
    }
  }

  /**
   * Resolve expired consequences
   */
  async resolveExpiredConsequences(currentTurn) {
    if (!this.saveSlotId) return 0
    
    try {
      const result = await eventService.resolveExpiredConsequences(this.saveSlotId, currentTurn)
      return result.resolved || 0
    } catch (error) {
      console.error('Failed to resolve expired consequences:', error)
      return 0
    }
  }

  /**
   * Reset for a new save slot
   */
  reset(saveSlotId) {
    this.saveSlotId = saveSlotId
  }
}

export const eventLogger = new EventLogger()
export default eventLogger
