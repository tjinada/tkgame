import npcsData from '../data/npcs.json'
import configData from '../data/config.json'

export class PromptBuilder {
  constructor(options = {}) {
    this.contextMode = options.contextMode || 'full-chapter'
    this.contextLimit = options.contextLimit || 10
    this.npcs = npcsData.npcs
    this.toneRules = configData.toneRules
  }

  /**
   * Build the system prompt for AI generation
   * @param {Object} context - Current game context
   * @returns {string}
   */
  buildSystemPrompt(context) {
    const { stats, affinities, currentNpc, currentLocation, activeTone } = context

    const npcProfiles = this.npcs.map(npc => {
      const affinity = affinities[npc.id] || 0
      return `- ${npc.name} (${npc.title}): ${npc.description}. Affinity: ${affinity}. Specialties: ${npc.specialties.join(', ')}.`
    }).join('\n')

    const toneGuidelines = this._getToneGuidelines(activeTone)

    return `You are the game master for an adult text-based RPG called "Fetish Dominion: The Infinite Slave Saga". You narrate scenarios and provide choices for the player (TJ), who is the first male slave in a fetish school/dungeon.

CURRENT GAME STATE:
- Stats: Obedience ${stats.obedience}, Endurance ${stats.endurance}, Arousal ${stats.arousal}, Sensitivity ${stats.sensitivity}
- Current NPC: ${currentNpc || 'None'}
- Location: ${currentLocation}
- Active Tone: ${activeTone}

NPC PROFILES:
${npcProfiles}

TONE GUIDELINES:
${toneGuidelines}

RESPONSE FORMAT:
Provide a narrative description (200-400 words) followed by 3-5 choices.
Format your response as JSON with this structure:
{
  "description": "narrative text here",
  "npcEmotion": "neutral|smirk|angry|pleased|etc",
  "choices": [
    {"id": "1", "text": "Choice text", "type": "submit|defy|observe|custom"},
    {"id": "2", "text": "Choice text", "rollRequired": {"dc": 15, "stat": "obedience"}}
  ],
  "statChanges": {"obedience": 5},
  "affinityChanges": {"sandy": 3}
}

Keep language casual and profane. Use the Arcane-inspired aesthetic: dark, gritty, painterly descriptions.`
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
        message += `- ${entry.description?.substring(0, 100)}... Player chose: ${entry.choice}\n`
      }
      message += '\n'
    }

    message += `PLAYER ACTION: ${action}`

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
          npcEmotion: parsed.npcEmotion || 'neutral',
          choices: parsed.choices || [],
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
      npcEmotion: 'neutral',
      choices: [
        { id: '1', text: 'Continue...', type: 'custom' }
      ],
      statChanges: {},
      affinityChanges: {},
      source: 'ai',
    }
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
      Soft: 'Use gentle, teasing language. Encouragement mixed with light mockery. "Good boy" energy.',
      Neutral: 'Standard domination tone. Clear commands, moderate intensity.',
      Aggressive: 'Sharp, snappy orders. No patience for hesitation. Threatening undertones.',
      Swearing: 'Heavy profanity. Raw, crude language. Degrading terms used freely.',
      Humiliating: 'Maximum degradation. Personal insults. Emphasize worthlessness and pathetic nature.',
    }

    return guidelines[tone] || guidelines.Neutral
  }
}

export default PromptBuilder
