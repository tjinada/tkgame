import npcsData from '../data/npcs.json'
import configData from '../data/config.json'
import { settingsService } from '../services/SettingsService'

export class PromptBuilder {
  constructor(options = {}) {
    this.contextMode = options.contextMode || 'full-chapter'
    this.contextLimit = options.contextLimit || 10
    this.npcs = npcsData.npcs
    this.toneRules = configData.toneRules
  }

  /**
   * Build AI behavior instructions based on settings
   * @returns {string}
   */
  _buildBehaviorInstructions() {
    const settings = settingsService.getAll()
    const instructions = []

    // Humiliation level
    const humiliationMap = {
      none: 'Do NOT include any humiliation or degradation.',
      mild: 'Include light teasing and mild embarrassment only.',
      moderate: 'Include moderate verbal degradation and humiliation.',
      heavy: 'Emphasize heavy humiliation, degradation, and psychological dominance.',
      extreme: 'Maximize humiliation - constant degradation, personal insults, emphasize worthlessness.',
    }
    if (humiliationMap[settings.aiHumiliationLevel]) {
      instructions.push(`HUMILIATION: ${humiliationMap[settings.aiHumiliationLevel]}`)
    }

    // Swearing level
    const swearingMap = {
      none: 'Do NOT use any profanity or swear words.',
      mild: 'Use minimal profanity - occasional "damn" or "hell" only.',
      moderate: 'Use moderate profanity naturally in dialogue.',
      heavy: 'Use heavy profanity freely - crude, vulgar language throughout.',
    }
    if (swearingMap[settings.aiSwearingLevel]) {
      instructions.push(`PROFANITY: ${swearingMap[settings.aiSwearingLevel]}`)
    }

    // Response length
    const lengthMap = {
      short: 'Keep responses SHORT: 100-200 words maximum.',
      medium: 'Keep responses MEDIUM length: 200-400 words.',
      long: 'Write LONG detailed responses: 400-600 words.',
    }
    if (lengthMap[settings.aiResponseLength]) {
      instructions.push(`LENGTH: ${lengthMap[settings.aiResponseLength]}`)
    }

    // Conversational style
    const styleMap = {
      narrative: 'Focus on DESCRIPTIVE NARRATIVE - rich descriptions, actions, atmosphere. Minimal dialogue.',
      balanced: 'Balance narrative description with character dialogue.',
      conversational: 'Focus on DIALOGUE - lots of spoken lines, character interactions, verbal exchanges.',
    }
    if (styleMap[settings.aiConversationalStyle]) {
      instructions.push(`STYLE: ${styleMap[settings.aiConversationalStyle]}`)
    }

    // Intensity
    const intensityMap = {
      gentle: 'Keep scenes GENTLE - soft domination, more teasing than torment.',
      moderate: 'MODERATE intensity - balance of control and cruelty.',
      intense: 'INTENSE scenes - strong domination, serious torment, no holding back.',
      brutal: 'BRUTAL intensity - merciless, relentless, maximum cruelty and dominance.',
    }
    if (intensityMap[settings.aiIntensity]) {
      instructions.push(`INTENSITY: ${intensityMap[settings.aiIntensity]}`)
    }

    // Fetish focus
    const fetishFocus = settings.aiFetishFocus || []
    if (fetishFocus.length > 0) {
      const fetishLabels = {
        tickling: 'tickling/tickle torture',
        feet: 'foot worship/foot domination',
        sweat: 'sweat worship/scent play',
        edging: 'edging/orgasm denial',
        pot: 'post-orgasm torture',
        bondage: 'bondage/restraints',
        verbal: 'verbal humiliation/degradation',
      }
      const focused = fetishFocus.map(f => fetishLabels[f] || f).join(', ')
      instructions.push(`FETISH FOCUS: Emphasize these fetishes when appropriate: ${focused}`)
    }

    return instructions.length > 0 
      ? '\n=== BEHAVIOR SETTINGS ===\n' + instructions.join('\n') + '\n'
      : ''
  }

  /**
   * Build the system prompt for AI generation
   * @param {Object} context - Current game context
   * @returns {string}
   */
  buildSystemPrompt(context) {
    const { stats, affinities, currentNpc, currentLocation, activeTone, flags } = context

    const npcProfiles = this.npcs.map(npc => {
      const affinity = affinities[npc.id] || 0
      const tier = this._getAffinityTier(affinity)
      return `- ${npc.name} (${npc.title}): ${npc.description}. Affinity: ${affinity} (${tier}). Specialties: ${npc.specialties.join(', ')}. ${npc.devotedBehavior ? `When devoted: ${npc.devotedBehavior}` : ''}`
    }).join('\n')

    const toneGuidelines = this._getToneGuidelines(activeTone)
    
    // Check for critical flags
    const criticalContext = this._getCriticalContext(flags)
    
    // Get behavior settings
    const behaviorInstructions = this._buildBehaviorInstructions()

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
  "description": "YOUR FORMATTED NARRATIVE HERE (200-400 words, using the *narrative* and dialogue format above)",
  "npc": "sandy|araph|nancy|aish|gaya|melissa",
  "npcEmotion": "neutral|smirk|angry|pleased|cruel|amused|bored|hostile|teasing",
  "location": "main_hall|classroom|workout_pit|chamber|dormitory|punishment_room|garden|dungeon",
  "bodyPart": "feet|armpit|hands|face_closeup|torso|back|legs|full_body|null",
  "choices": [
    {"id": "1", "text": "Choice description", "type": "submit"},
    {"id": "2", "text": "Choice with roll", "type": "defy", "rollRequired": {"dc": 15, "stat": "obedience"}},
    {"id": "3", "text": "Another choice", "type": "observe"}
  ],
  "statChanges": {"obedience": 5, "arousal": 10},
  "affinityChanges": {"sandy": 3}
}

IMPORTANT: Set "bodyPart" when the scene focuses on a specific body part (e.g. feet during foot worship, armpit during sweat scenes). Use null when no specific focus.

Types: submit, defy, observe, beg, custom
Stats for rolls: obedience, endurance, arousal, sensitivity

STYLE: Dark, gothic aesthetic. Casual, profane language. No mercy, no romance - only domination.`
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
    const recentHistory = this._trimHistory(history)

    let message = ''

    if (recentHistory.length > 0) {
      message += 'RECENT HISTORY:\n'
      for (const entry of recentHistory) {
        message += `- Turn ${entry.turn}: ${entry.description?.substring(0, 100)}... Player: "${entry.choice}" (${entry.outcome})\n`
      }
      message += '\n'
    }

    message += `PLAYER ACTION: "${action}"\n\nRespond with the JSON format specified. Remember to use *asterisks* for narrative and plain text for dialogue.`

    return message
  }

  /**
   * Parse AI response into structured content
   * @param {string} response - Raw AI response
   * @returns {SceneContent}
   */
  parseAIResponse(response) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          id: `ai-${Date.now()}`,
          description: parsed.description || response,
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
    }

    // Fallback: treat entire response as description
    return {
      id: `ai-${Date.now()}`,
      description: response,
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
   * Get default choices for fallback
   */
  _getDefaultChoices() {
    return [
      { id: '1', text: 'Submit and obey', type: 'submit' },
      { id: '2', text: 'Hesitate nervously', type: 'observe' },
      { id: '3', text: 'Resist (risky)', type: 'defy', rollRequired: { dc: 15, stat: 'obedience' } },
    ]
  }

  /**
   * Get affinity tier name
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
   * Get critical context from flags
   */
  _getCriticalContext(flags) {
    if (!flags) return ''
    
    let context = ''
    
    if (flags.criticalFailure) {
      context += '\n⚠️ CRITICAL FAILURE JUST OCCURRED - The player just rolled a natural 1. Deliver SEVERE punishment and humiliation. Be merciless.'
    }
    
    if (flags.criticalSuccess) {
      context += '\n✨ CRITICAL SUCCESS JUST OCCURRED - The player just rolled a natural 20. Acknowledge their rare moment of competence, but do not show mercy.'
    }
    
    return context
  }

  /**
   * Set context mode
   * @param {string} mode - Context mode
   */
  setContextMode(mode) {
    this.contextMode = mode
  }

  /**
   * Set context limit
   * @param {number} limit - Max entries to include
   */
  setContextLimit(limit) {
    this.contextLimit = limit
  }

  /**
   * Trim history based on context mode
   * @param {Array} history - Full history
   * @returns {Array}
   */
  _trimHistory(history) {
    if (!history || history.length === 0) return []

    switch (this.contextMode) {
      case 'last-n-turns':
        return history.slice(-this.contextLimit)
      
      case 'full-chapter':
        // For now, just return last 20 entries max
        return history.slice(-20)
      
      case 'token-budget':
        // Simple implementation: estimate ~100 tokens per entry
        const maxEntries = Math.floor(this.contextLimit / 100)
        return history.slice(-maxEntries)
      
      default:
        return history.slice(-10)
    }
  }

  /**
   * Get tone-specific guidelines
   * @param {string} tone - Active tone
   * @returns {string}
   */
  _getToneGuidelines(tone) {
    const guidelines = {
      Soft: 'Use gentle, teasing language. Encouragement mixed with light mockery. "Good boy" energy. Still dominant, but less harsh.',
      Neutral: 'Standard domination tone. Clear commands, moderate intensity. Balance of cruelty and control.',
      Aggressive: 'Sharp, snappy orders. No patience for hesitation. Threatening undertones. Quick to punish.',
      Swearing: 'Heavy profanity. Raw, crude language. Degrading terms used freely. Explicit and vulgar.',
      Humiliating: 'Maximum degradation. Personal insults. Emphasize worthlessness and pathetic nature. Psychological cruelty.',
    }

    return guidelines[tone] || guidelines.Neutral
  }
}

export default PromptBuilder
