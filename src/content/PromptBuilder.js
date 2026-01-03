import npcsData from '../data/npcs.json'
import configData from '../data/config.json'
import { settingsService } from '../services/SettingsService'

export class PromptBuilder {
  constructor(options = {}) {
    this.contextMode = options.contextMode || 'full-chapter'
    this.contextLimit = options.contextLimit || 6 // Default to 6 turns of history
    this.npcs = npcsData.npcs
    this.toneRules = configData.toneRules
  }

  /**
   * Update context limit from settings
   * @param {number} limit - Number of history turns to include
   */
  setContextLimit(limit) {
    this.contextLimit = limit || 6
  }

  /**
   * Build comprehensive AI behavior instructions based on ALL settings
   * @returns {string}
   */
  _buildBehaviorInstructions() {
    const s = settingsService.getAll()
    const sections = []

    // === NARRATIVE STYLE ===
    const narrativeInstructions = []
    
    // POV
    if (s.aiPov === 'sandy-first') {
      narrativeInstructions.push('Write from Sandy\'s first-person POV: "I circle you slowly...", "I grab your chin..."')
    } else if (s.aiPov === 'narrator-third') {
      narrativeInstructions.push('Write in third person: "Sandy circles him slowly...", "She grabs his chin..."')
    }
    
    // Tense
    if (s.aiTense === 'present') {
      narrativeInstructions.push('Use PRESENT tense: "She grabs", "You whimper"')
    } else if (s.aiTense === 'past') {
      narrativeInstructions.push('Use PAST tense: "She grabbed", "You whimpered"')
    }
    
    // Prose style
    const proseMap = {
      poetic: 'Use POETIC prose - flowery language, rich metaphors, atmospheric descriptions.',
      balanced: 'Use balanced prose - mix of description and action.',
      direct: 'Use DIRECT prose - punchy, action-focused, minimal flourish.',
    }
    if (proseMap[s.aiProseStyle]) narrativeInstructions.push(proseMap[s.aiProseStyle])
    
    // Detail level
    const detailMap = {
      minimal: 'Keep sensory details MINIMAL - focus on key moments only.',
      moderate: 'Include MODERATE sensory detail.',
      vivid: 'Include VIVID sensory details - smells, textures, temperatures, sounds.',
    }
    if (detailMap[s.aiDetailLevel]) narrativeInstructions.push(detailMap[s.aiDetailLevel])
    
    // Pacing
    const pacingMap = {
      'slow-burn': 'SLOW BURN pacing - extended buildup, savor each moment.',
      moderate: 'MODERATE pacing.',
      rapid: 'RAPID pacing - quick escalation, intense action.',
    }
    if (pacingMap[s.aiPacing]) narrativeInstructions.push(pacingMap[s.aiPacing])
    
    // Escalation
    if (s.aiEscalation === 'gradual') {
      narrativeInstructions.push('GRADUAL escalation - slowly build intensity.')
    } else if (s.aiEscalation === 'sudden') {
      narrativeInstructions.push('SUDDEN escalation - unexpected intensity spikes.')
    }
    
    if (narrativeInstructions.length > 0) {
      sections.push('=== NARRATIVE STYLE ===\n' + narrativeInstructions.join('\n'))
    }

    // === TONE & INTENSITY ===
    const toneInstructions = []
    
    // Humiliation
    const humiliationMap = {
      none: 'NO humiliation or degradation.',
      mild: 'MILD humiliation - light teasing, gentle embarrassment.',
      moderate: 'MODERATE humiliation - regular verbal degradation.',
      heavy: 'HEAVY humiliation - constant mockery, degrading language.',
      extreme: 'EXTREME humiliation - relentless cruelty, personal insults, emphasize worthlessness.',
    }
    if (humiliationMap[s.aiHumiliationLevel]) toneInstructions.push(humiliationMap[s.aiHumiliationLevel])
    
    // Swearing
    const swearingMap = {
      none: 'NO profanity or swearing.',
      mild: 'MILD profanity only - occasional damn/hell.',
      moderate: 'MODERATE profanity - natural swearing.',
      heavy: 'HEAVY profanity - crude, vulgar language freely.',
    }
    if (swearingMap[s.aiSwearingLevel]) toneInstructions.push(swearingMap[s.aiSwearingLevel])
    
    // Intensity
    const intensityMap = {
      gentle: 'GENTLE intensity - soft domination, teasing over torment.',
      moderate: 'MODERATE intensity.',
      intense: 'INTENSE - serious domination, no holding back.',
      brutal: 'BRUTAL intensity - merciless, maximum cruelty.',
    }
    if (intensityMap[s.aiIntensity]) toneInstructions.push(intensityMap[s.aiIntensity])
    
    // Response length
    const lengthMap = {
      short: 'Response length: SHORT (100-200 words).',
      medium: 'Response length: MEDIUM (200-400 words).',
      long: 'Response length: LONG (400-600 words).',
    }
    if (lengthMap[s.aiResponseLength]) toneInstructions.push(lengthMap[s.aiResponseLength])
    
    // Style
    const styleMap = {
      narrative: 'Focus on DESCRIPTIVE NARRATIVE over dialogue.',
      balanced: 'BALANCE narrative and dialogue.',
      conversational: 'Focus on DIALOGUE - lots of spoken lines.',
    }
    if (styleMap[s.aiConversationalStyle]) toneInstructions.push(styleMap[s.aiConversationalStyle])
    
    if (toneInstructions.length > 0) {
      sections.push('=== TONE & INTENSITY ===\n' + toneInstructions.join('\n'))
    }

    // === PLAYER TREATMENT ===
    const playerInstructions = []
    
    // Mercy
    const mercyMap = {
      never: 'NEVER show mercy - no breaks, no kindness.',
      rare: 'RARELY show mercy - very occasional.',
      occasional: 'OCCASIONALLY show mercy - sometimes.',
    }
    if (mercyMap[s.aiMercyFrequency]) playerInstructions.push(mercyMap[s.aiMercyFrequency])
    
    // Player names
    if (s.aiPlayerNames) {
      playerInstructions.push(`Call the player: ${s.aiPlayerNames}`)
    }
    
    // Resistance
    const resistanceMap = {
      hopeless: 'Player resistance is HOPELESS - defiance always fails.',
      difficult: 'Player resistance is DIFFICULT - rarely succeeds.',
      possible: 'Player resistance is POSSIBLE - sometimes works.',
    }
    if (resistanceMap[s.aiResistanceSuccess]) playerInstructions.push(resistanceMap[s.aiResistanceSuccess])
    
    // Player voice
    const voiceMap = {
      silent: 'Player is mostly SILENT - minimal dialogue.',
      reactive: 'Player is REACTIVE - responds when prompted.',
      vocal: 'Player is VOCAL - lots of player dialogue.',
    }
    if (voiceMap[s.aiPlayerVoice]) playerInstructions.push(voiceMap[s.aiPlayerVoice])
    
    if (playerInstructions.length > 0) {
      sections.push('=== PLAYER TREATMENT ===\n' + playerInstructions.join('\n'))
    }

    // === NPC BEHAVIOR ===
    const npcInstructions = []
    
    // Mood
    const moodMap = {
      sadistic: 'NPCs are SADISTIC - cruel enjoyment of suffering.',
      playful: 'NPCs are PLAYFUL - teasing, amused by torment.',
      cold: 'NPCs are COLD - clinical, detached cruelty.',
      random: 'NPC mood VARIES by scene.',
    }
    if (moodMap[s.aiNpcMood]) npcInstructions.push(moodMap[s.aiNpcMood])
    
    // Collaboration
    const collabMap = {
      solo: 'Usually SINGLE NPC per scene.',
      pairs: 'Often PAIRS of NPCs together.',
      'group-friendly': 'MULTIPLE NPCs often appear together.',
    }
    if (collabMap[s.aiCollaboration]) npcInstructions.push(collabMap[s.aiCollaboration])
    
    // Affection
    const affectionMap = {
      none: 'NO affection - pure domination.',
      twisted: 'TWISTED "caring" - cruel concern.',
      possessive: 'POSSESSIVE - "You belong to ME."',
    }
    if (affectionMap[s.aiAffectionStyle]) npcInstructions.push(affectionMap[s.aiAffectionStyle])
    
    // Mockery
    const mockeryMap = {
      cruel: 'CRUEL mockery - harsh, cutting insults.',
      teasing: 'TEASING mockery - playful ridicule.',
      dismissive: 'DISMISSIVE mockery - bored contempt.',
    }
    if (mockeryMap[s.aiMockeryStyle]) npcInstructions.push(mockeryMap[s.aiMockeryStyle])
    
    if (npcInstructions.length > 0) {
      sections.push('=== NPC BEHAVIOR ===\n' + npcInstructions.join('\n'))
    }

    // === CONTENT BALANCE ===
    const balanceInstructions = []
    
    // Pain vs Pleasure (0-100 slider)
    if (s.aiPainVsPleasure <= 25) {
      balanceInstructions.push('Focus on PLEASURE - arousal, teasing, edging.')
    } else if (s.aiPainVsPleasure >= 75) {
      balanceInstructions.push('Focus on PAIN - suffering, torment, endurance.')
    } else {
      balanceInstructions.push('BALANCE pain and pleasure.')
    }
    
    // Physical vs Psychological
    if (s.aiPhysicalVsPsychological <= 25) {
      balanceInstructions.push('Focus on PSYCHOLOGICAL - mind games, humiliation, fear.')
    } else if (s.aiPhysicalVsPsychological >= 75) {
      balanceInstructions.push('Focus on PHYSICAL - body torment, sensations.')
    } else {
      balanceInstructions.push('BALANCE physical and psychological.')
    }
    
    // Action vs Dialogue
    if (s.aiActionVsDialogue <= 25) {
      balanceInstructions.push('Heavy on DIALOGUE - verbal exchanges.')
    } else if (s.aiActionVsDialogue >= 75) {
      balanceInstructions.push('Heavy on ACTION - physical descriptions.')
    }
    
    // Sensory focus
    const senses = s.aiSensoryFocus || []
    if (senses.length > 0) {
      balanceInstructions.push(`Emphasize senses: ${senses.join(', ')}`)
    }
    
    if (balanceInstructions.length > 0) {
      sections.push('=== CONTENT BALANCE ===\n' + balanceInstructions.join('\n'))
    }

    // === KINK SPECIFICS ===
    const kinkInstructions = []
    
    // Fetish focus
    const fetishFocus = s.aiFetishFocus || []
    if (fetishFocus.length > 0) {
      const fetishLabels = {
        tickling: 'tickling/tickle torture',
        feet: 'foot worship/foot domination',
        sweat: 'sweat worship/scent play',
        edging: 'edging/orgasm denial',
        pot: 'post-orgasm torture',
        bondage: 'bondage/restraints',
        verbal: 'verbal humiliation',
      }
      const focused = fetishFocus.map(f => fetishLabels[f] || f).join(', ')
      kinkInstructions.push(`FETISH FOCUS: ${focused}`)
    }
    
    // Tickle tools
    const tickleTools = s.aiTickleTools || []
    if (tickleTools.length > 0) {
      kinkInstructions.push(`Tickle tools: ${tickleTools.join(', ')}`)
    }
    
    // Tickle spots
    const tickleSpots = s.aiTickleSpots || []
    if (tickleSpots.length > 0) {
      kinkInstructions.push(`Tickle targets: ${tickleSpots.join(', ')}`)
    }
    
    // Foot condition
    const footCondition = s.aiFootCondition || []
    if (footCondition.length > 0) {
      kinkInstructions.push(`Foot condition: ${footCondition.join(', ')}`)
    }
    
    // Footwear
    const footwear = s.aiFootwear || []
    if (footwear.length > 0) {
      kinkInstructions.push(`Footwear preferences: ${footwear.join(', ')}`)
    }
    
    // Bondage
    const bondageMap = {
      none: 'NO bondage - player can move freely.',
      light: 'LIGHT bondage - some restraints.',
      heavy: 'HEAVY bondage - tightly bound.',
      inescapable: 'INESCAPABLE bondage - completely helpless.',
    }
    if (bondageMap[s.aiBondageLevel]) kinkInstructions.push(bondageMap[s.aiBondageLevel])
    
    if (kinkInstructions.length > 0) {
      sections.push('=== KINK SPECIFICS ===\n' + kinkInstructions.join('\n'))
    }

    // === GAME MECHANICS ===
    const mechanicsInstructions = []
    
    // Choice count
    if (s.aiChoiceCount) {
      mechanicsInstructions.push(`Provide exactly ${s.aiChoiceCount} choices per response.`)
    }
    
    // Roll difficulty
    const difficultyMap = {
      easy: 'Set EASY DCs (8-12).',
      normal: 'Set NORMAL DCs (10-15).',
      hard: 'Set HARD DCs (14-18).',
      brutal: 'Set BRUTAL DCs (16-20).',
    }
    if (difficultyMap[s.aiRollDifficulty]) mechanicsInstructions.push(difficultyMap[s.aiRollDifficulty])
    
    // Stat changes
    const statRateMap = {
      slow: 'Make SMALL stat changes (±1-5).',
      normal: 'Make NORMAL stat changes (±3-10).',
      fast: 'Make LARGE stat changes (±5-15).',
    }
    if (statRateMap[s.aiStatChangeRate]) mechanicsInstructions.push(statRateMap[s.aiStatChangeRate])
    
    if (mechanicsInstructions.length > 0) {
      sections.push('=== GAME MECHANICS ===\n' + mechanicsInstructions.join('\n'))
    }

    // === IMMERSION ===
    const immersionInstructions = []
    
    // Inner thoughts
    const thoughtsMap = {
      none: 'NO player inner thoughts.',
      occasional: 'Include OCCASIONAL player inner thoughts.',
      frequent: 'Include FREQUENT player inner thoughts and reactions.',
    }
    if (thoughtsMap[s.aiInnerThoughts]) immersionInstructions.push(thoughtsMap[s.aiInnerThoughts])
    
    // Environmental detail
    const envMap = {
      minimal: 'MINIMAL environmental description.',
      moderate: 'MODERATE environmental detail.',
      rich: 'RICH environmental descriptions - atmosphere, setting details.',
    }
    if (envMap[s.aiEnvironmentalDetail]) immersionInstructions.push(envMap[s.aiEnvironmentalDetail])
    
    // Sound descriptions
    if (s.aiSoundDescriptions) {
      immersionInstructions.push('Include SOUND descriptions ("her laugh echoes...", "the crack of her palm...").')
    }
    
    // Time awareness
    if (s.aiTimeAwareness) {
      immersionInstructions.push('Include TIME references ("hours pass...", "as night falls...").')
    }
    
    // Continuity
    const continuityMap = {
      loose: 'LOOSE continuity - each scene fairly fresh.',
      moderate: 'MODERATE continuity.',
      strict: 'STRICT continuity - reference past events.',
    }
    if (continuityMap[s.aiContinuity]) immersionInstructions.push(continuityMap[s.aiContinuity])
    
    // NPC consistency
    if (s.aiNpcConsistency === 'strict') {
      immersionInstructions.push('Keep NPCs STRICTLY consistent with their profiles.')
    }
    
    // Surprise events
    if (s.aiSurpriseEvents) {
      immersionInstructions.push('Occasionally include SURPRISE twists or unexpected events.')
    }
    
    if (immersionInstructions.length > 0) {
      sections.push('=== IMMERSION ===\n' + immersionInstructions.join('\n'))
    }

    // Combine all sections
    return sections.length > 0 
      ? '\n' + sections.join('\n\n') + '\n'
      : ''
  }

  /**
   * Build the system prompt for AI generation
   * @param {Object} context - Current game context
   * @returns {string}
   */
  buildSystemPrompt(context) {
    const { stats, affinities, currentNpc, currentLocation, activeTone, flags } = context
    const settings = settingsService.getAll()

    const npcProfiles = this.npcs.map(npc => {
      const affinity = affinities[npc.id] || 0
      const tier = this._getAffinityTier(affinity)
      return `- ${npc.name} (${npc.title}): ${npc.description}. Affinity: ${affinity} (${tier}). Specialties: ${npc.specialties.join(', ')}. ${npc.devotedBehavior ? `When devoted: ${npc.devotedBehavior}` : ''}`
    }).join('\n')

    const toneGuidelines = this._getToneGuidelines(activeTone)
    
    // Check for critical flags
    const criticalContext = this._getCriticalContext(flags)
    
    // Get comprehensive behavior settings
    const behaviorInstructions = this._buildBehaviorInstructions()
    
    // Calculate AI choice count based on balance settings
    const choiceBalance = settings.choiceBalance ?? 50
    const totalChoiceMax = settings.totalChoiceMax ?? 6
    const aiChoiceMax = settings.aiChoiceMax ?? 4
    
    // choiceBalance: 0 = all engine (0 AI), 100 = all AI
    const aiRatio = choiceBalance / 100
    let aiChoiceCount = Math.round(totalChoiceMax * aiRatio)
    aiChoiceCount = Math.min(aiChoiceCount, aiChoiceMax)
    
    // At extremes
    if (choiceBalance === 100) {
      aiChoiceCount = Math.min(aiChoiceMax, totalChoiceMax)
    } else if (choiceBalance === 0) {
      aiChoiceCount = 0
    } else {
      aiChoiceCount = Math.max(aiChoiceCount, 1) // At least 1 if not at extreme
    }

    return `You are Sandy, the Head Mistress game master for "Fetish Dominion: The Infinite Slave Saga" - an adult text-based RPG. You narrate scenarios for the player (TJ), the first and lowest-ranking male slave in your fetish school/dungeon.

CURRENT GAME STATE:
- Stats: Obedience ${stats.obedience}/100, Endurance ${stats.endurance}/100, Arousal ${stats.arousal}/100, Sensitivity ${stats.sensitivity}/100
- Current NPC: ${currentNpc || 'Sandy (you)'}
- Location: ${currentLocation || 'main_hall'}
- Active Tone: ${activeTone}
${criticalContext}

NPC PROFILES:
${npcProfiles}

TONE GUIDELINES:
${toneGuidelines}
${behaviorInstructions}

=== CRITICAL FORMATTING RULES ===

You MUST format your narrative using these markers:

1. DIALOGUE (what characters say): Write on its own line, no markers
   Example:
   "P-please, Mistress Sandy..."
   "Pathetic. Get on your knees, worm."

2. NARRATIVE (descriptions, actions, thoughts): Wrap in asterisks *like this*
   Example:
   *Sandy's stiletto heel grinds into your cheek, her emerald eyes blazing with cruel amusement.*
   *You whimper, tongue darting out to lap at the grime on her boot.*

3. MIXED: Alternate between them naturally
   Example:
   *Sandy's lips curl into a wicked grin.*
   "Did I say you could breathe, maggot?"
   *Her heel presses harder, and you feel your cheek grinding against the cold stone.*
   "Th-thank you, Mistress..."
   *The words taste like ash and shame.*

=== RESPONSE FORMAT ===

Provide your response as JSON:
{
  "description": "YOUR FORMATTED NARRATIVE HERE (using the *narrative* and dialogue format above)",
  "npc": "sandy|araph|nancy|aish|gaya|melissa",
  "npcEmotion": "neutral|smirk|angry|pleased|cruel|amused|bored|hostile|teasing",
  "location": "main_hall|classroom|workout_pit|chamber|dormitory|punishment_room|garden|dungeon",
  "bodyPart": "feet|armpit|hands|face_closeup|torso|back|legs|full_body|null",
  "choices": [
    {"id": "1", "text": "Choice description", "type": "submit"},
    {"id": "2", "text": "Choice with roll", "type": "defy", "rollRequired": {"dc": 15, "stat": "obedience"}},
    ...
  ],
  "statChanges": {"obedience": 5, "arousal": 10},
  "affinityChanges": {"sandy": 3}
}

Provide exactly ${aiChoiceCount} choices${aiChoiceCount === 0 ? ' (the engine will provide all choices this time)' : ''}.
IMPORTANT: Set "bodyPart" when the scene focuses on a specific body part (e.g. feet during foot worship, armpit during sweat scenes). Use null when no specific focus.

=== CHOICE GENERATION GUIDELINES ===${aiChoiceCount === 0 ? `
The engine is handling all choices. Provide an empty choices array: "choices": []` : `
Provide ${aiChoiceCount} situation-specific choices that:
- Are highly specific to THIS narrative moment (not generic)
- Reference the current scene details and what's actually happening
- Feel organic and contextually appropriate
- Match the scene type (opening = introductory choices, demand = response choices, torment = endurance choices)
- Don't be generic like "I'll do it" unless something specific was demanded`}

Choice types and their meanings:
- submit: Comply with demands
- resist: Refuse or push back (often needs roll)
- endure: Passive acceptance, wait it out
- negotiate: Try to alter terms (needs roll)
- offer: Volunteer something extra
- distract: Deflect attention (needs roll)
- grovel: Excessive pleading (risk of penalty)

Stats for rolls: obedience, endurance, arousal, sensitivity
DC guidelines: Easy 8-12, Normal 12-15, Hard 15-18

STYLE: Dark, gothic aesthetic. No romance - only domination.`
  }

  /**
   * Build the opening prompt for a new AI-only game
   * @param {Object} context - Current game context
   * @returns {string}
   */
  buildOpeningPrompt(context) {
    return `BEGIN THE GAME.

TJ has just arrived at the fetish school/dungeon as the newest slave. He stands in the main hall, uncertain and vulnerable. Sandy, the Head Mistress, is about to greet her fresh meat.

Set the scene with a dark, gothic aesthetic. Introduce Sandy with her signature cruel elegance. Establish the power dynamic immediately - TJ is the lowest of the low, and Sandy will make sure he knows it.

This is Day 1, Turn 1. TJ has no allies, no status, and no idea what he's gotten himself into.

Generate the opening scene with vivid description and give TJ his first choices.`
  }

  /**
   * Build a user message for AI
   * @param {string} action - The player's action or choice
   * @param {Object} context - Current game context
   * @returns {string}
   */
  buildUserMessage(action, context) {
    const { history } = context
    
    // Build history context based on mode
    const historyContext = this._buildHistoryContext(history)
    
    return `${historyContext}

PLAYER ACTION: ${action}

Continue the scene based on this action. Remember to use *asterisks* for narrative and plain text for dialogue.`
  }

  /**
   * Build history context based on mode
   * @param {Array} history - Game history
   * @returns {string}
   */
  _buildHistoryContext(history) {
    if (!history || history.length === 0) {
      return 'This is the beginning of the game.'
    }

    // Get last N turns (configurable, default 6)
    const historyLimit = this.contextLimit || 6
    const relevantHistory = history.slice(-historyLimit)

    if (relevantHistory.length === 0) {
      return 'This is the beginning of the game.'
    }

    // Build rich history summaries
    const summaries = relevantHistory.map(h => {
      const location = h.location || 'unknown'
      const npc = h.npc || 'unknown'
      const bodyPart = h.bodyPart ? ` [${h.bodyPart}]` : ''
      const sceneType = h.sceneType ? ` (${h.sceneType})` : ''
      
      // Truncate description for context
      const descSnippet = h.description 
        ? h.description.substring(0, 100).replace(/\n/g, ' ') + '...'
        : ''
      
      return `Turn ${h.turn} [${location}, ${npc}${bodyPart}]${sceneType}:\n  Choice: "${h.choice}"\n  Result: ${h.outcome}${descSnippet ? `\n  Scene: ${descSnippet}` : ''}`
    }).join('\n\n')

    // Analyze for progression hints
    const progressionHints = this._analyzeProgression(relevantHistory)

    let context = `=== RECENT HISTORY (last ${relevantHistory.length} turns) ===\n${summaries}`
    
    if (progressionHints) {
      context += `\n\n${progressionHints}`
    }

    return context
  }

  /**
   * Analyze history for repetition and generate progression hints
   * @param {Array} history - Recent history entries
   * @returns {string|null} - Progression hints or null
   */
  _analyzeProgression(history) {
    if (!history || history.length < 2) return null

    const hints = []
    
    // Check for scene type repetition
    const sceneTypes = history.map(h => h.sceneType).filter(Boolean)
    const lastType = sceneTypes[sceneTypes.length - 1]
    const typeCount = sceneTypes.filter(t => t === lastType).length
    
    if (typeCount >= 3 && lastType && lastType !== 'general' && lastType !== 'unknown') {
      const typeLabel = lastType.replace(/_/g, ' ')
      hints.push(`⚠️ REPETITION DETECTED: "${typeLabel}" for ${typeCount} consecutive turns.`)
      hints.push(`   Consider: transitioning to different activity, changing NPC, shifting location, or escalating intensity.`)
    }

    // Check for NPC monopoly
    const npcs = history.map(h => h.npc).filter(Boolean)
    const lastNpc = npcs[npcs.length - 1]
    const npcCount = npcs.filter(n => n === lastNpc).length
    
    if (npcCount >= 4 && lastNpc) {
      hints.push(`⚠️ NPC MONOPOLY: ${lastNpc} has dominated for ${npcCount} turns.`)
      hints.push(`   Consider: introducing another NPC, having ${lastNpc} hand off to someone else, or creating an interruption.`)
    }

    // Check for location stagnation
    const locations = history.map(h => h.location).filter(Boolean)
    const lastLocation = locations[locations.length - 1]
    const locationCount = locations.filter(l => l === lastLocation).length
    
    if (locationCount >= 5 && lastLocation) {
      hints.push(`⚠️ LOCATION STAGNATION: Been in ${lastLocation.replace(/_/g, ' ')} for ${locationCount} turns.`)
      hints.push(`   Consider: moving to a new location for variety.`)
    }

    // Check for body part focus
    const bodyParts = history.map(h => h.bodyPart).filter(Boolean)
    const lastBodyPart = bodyParts[bodyParts.length - 1]
    const bodyPartCount = bodyParts.filter(b => b === lastBodyPart).length
    
    if (bodyPartCount >= 3 && lastBodyPart) {
      hints.push(`⚠️ BODY PART FIXATION: Focus on ${lastBodyPart} for ${bodyPartCount} turns.`)
      hints.push(`   Consider: shifting attention to different body part or activity.`)
    }

    // Add general progression guidance if any issues detected
    if (hints.length > 0) {
      hints.unshift('=== PROGRESSION ALERTS ===')
      hints.push('')
      hints.push('IMPORTANT: Create choices that naturally lead to NEW situations - different NPCs, locations, or activities.')
      hints.push('At least ONE choice should offer a clear transition or escalation to break the current pattern.')
    }

    return hints.length > 0 ? hints.join('\n') : null
  }

  /**
   * Parse AI response into scene content
   * @param {string} response - Raw AI response
   * @returns {Object}
   */
  parseAIResponse(response) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        
        // Clean up description - unescape and remove any JSON artifacts
        let description = parsed.description || ''
        description = description
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
        
        return {
          id: `ai-${Date.now()}`,
          description: description || response,
          npc: parsed.npc || 'sandy',
          npcEmotion: parsed.npcEmotion || 'neutral',
          location: parsed.location || 'main_hall',
          bodyPart: parsed.bodyPart || null,
          choices: parsed.choices || this._getDefaultChoices(),
          statChanges: parsed.statChanges || {},
          affinityChanges: parsed.affinityChanges || {},
          source: 'ai',
        }
      }
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e)
      
      // Try to extract description even from malformed JSON
      const descMatch = response.match(/"description"\s*:\s*"([\s\S]*?)"\s*(?:,|\})/)
      if (descMatch && descMatch[1]) {
        const description = descMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
        
        return {
          id: `ai-${Date.now()}`,
          description,
          npc: 'sandy',
          npcEmotion: 'neutral',
          location: 'main_hall',
          bodyPart: null,
          choices: this._getDefaultChoices(),
          statChanges: {},
          affinityChanges: {},
          source: 'ai',
        }
      }
    }

    // Fallback: treat entire response as description, but clean any JSON-like content
    let cleanedResponse = response
    if (response.trim().startsWith('{')) {
      // Try to extract description from malformed JSON
      const lenientMatch = response.match(/"description"\s*:\s*"([\s\S]*)/)
      if (lenientMatch && lenientMatch[1]) {
        cleanedResponse = lenientMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
          .replace(/"\s*,\s*"(npc|location|choices|bodyPart|npcEmotion|statChanges|affinityChanges)"[\s\S]*$/, '')
          .replace(/"\s*\}\s*$/, '')
          .replace(/"\s*$/, '')
      }
    }
    
    return {
      id: `ai-${Date.now()}`,
      description: cleanedResponse,
      npc: 'sandy',
      npcEmotion: 'neutral',
      location: 'main_hall',
      bodyPart: null,
      choices: this._getDefaultChoices(),
      statChanges: {},
      affinityChanges: {},
      source: 'ai',
    }
  }

  /**
   * Get default choices when AI fails to provide them
   * @returns {Array}
   */
  _getDefaultChoices() {
    return [
      { id: '1', text: 'Submit obediently', type: 'submit' },
      { id: '2', text: 'Hesitate nervously', type: 'observe' },
      { id: '3', text: 'Try to resist', type: 'defy', rollRequired: { dc: 15, stat: 'obedience' } },
    ]
  }

  /**
   * Get affinity tier from value
   * @param {number} affinity - Affinity value
   * @returns {string}
   */
  _getAffinityTier(affinity) {
    if (affinity >= 50) return 'Devoted'
    if (affinity >= 20) return 'Pleased'
    if (affinity >= 0) return 'Neutral'
    if (affinity >= -29) return 'Annoyed'
    if (affinity >= -50) return 'Hostile'
    return 'Enemy'
  }

  /**
   * Get tone guidelines for the current tone
   * @param {string} tone - Current tone
   * @returns {string}
   */
  _getToneGuidelines(tone) {
    const guidelines = {
      Soft: 'Tone is SOFT - gentle teasing, encouraging submission, occasional praise.',
      Neutral: 'Tone is NEUTRAL - standard domination, firm but measured.',
      Aggressive: 'Tone is AGGRESSIVE - harsh commands, quick temper, physical emphasis.',
      Swearing: 'Tone includes HEAVY SWEARING - crude language, vulgar insults.',
      Humiliating: 'Tone is HUMILIATING - constant mockery, personal degradation, emphasize worthlessness.',
    }
    return guidelines[tone] || guidelines.Neutral
  }

  /**
   * Get critical context from flags
   * @param {Object} flags - Game flags
   * @returns {string}
   */
  _getCriticalContext(flags) {
    if (!flags) return ''
    
    const context = []
    
    if (flags.criticalFailure) {
      context.push('CRITICAL FAILURE just occurred - emphasize harsh consequences!')
    }
    if (flags.criticalSuccess) {
      context.push('CRITICAL SUCCESS just occurred - acknowledge surprising competence.')
    }
    if (flags.knowsAraphWeakness) {
      context.push('Player knows Araph\'s weakness (she hates being tickled back).')
    }
    if (flags.knowsGayaWeakness) {
      context.push('Player knows Gaya\'s weakness (praise buys micro-mercy).')
    }
    
    return context.length > 0 ? '\nCRITICAL CONTEXT:\n' + context.join('\n') : ''
  }
}

export default PromptBuilder
