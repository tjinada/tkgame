import { eventLogger } from '../engine/EventLogger.js'
import { progressionSystem } from '../engine/ProgressionSystem.js'
import knowledgeSystem from '../engine/KnowledgeSystem.js'

/**
 * ContextBuilder - Assembles rich context from progression and events for AI prompts
 * 
 * This module pulls data from:
 * - Progression System: stage, fetish levels, NPC familiarity, milestones
 * - Event System: recent events, unresolved consequences, behavioral patterns
 * 
 * And formats it into structured context blocks for the AI.
 */

// Stage descriptions for context
const STAGE_DESCRIPTIONS = {
  initiation: 'New slave, still learning the rules. Max intensity: 3/10. Focus on introduction and basic submission.',
  training: 'Progressing through training. Max intensity: 5/10. Can handle moderate torment.',
  advanced: 'Experienced slave. Max intensity: 8/10. Ready for serious domination.',
  veteran: 'Seasoned veteran. Max intensity: 10/10. No limits, full brutality permitted.'
}

// Fetish level descriptions
const FETISH_LEVEL_LABELS = {
  0: 'Unexplored',
  1: 'Introduced',
  2: 'Familiar',
  3: 'Trained',
  4: 'Expert',
  5: 'Mastered'
}

// NPC familiarity descriptions
const FAMILIARITY_LABELS = {
  stranger: 'First meeting',
  acquaintance: 'Has met a few times',
  familiar: 'Knows well',
  intimate: 'Deeply familiar'
}

class ContextBuilder {
  constructor() {
    this.cachedContext = null
    this.cacheTimestamp = null
    this.cacheTTL = 5000 // 5 second cache
  }

  /**
   * Build comprehensive context for AI prompts
   * @param {Object} gameState - Current game state from StateManager
   * @param {Object} options - Options for context building
   * @returns {Promise<Object>} Structured context object
   */
  async buildContext(gameState, options = {}) {
    const {
      includeProgression = true,
      includeEvents = true,
      includeConsequences = true,
      includeKnowledge = true,
      recentEventLimit = 5,
      consequenceLimit = 10
    } = options

    const context = {
      progression: null,
      events: null,
      consequences: null,
      patterns: null,
      knowledge: null,
      formatted: ''
    }

    // Gather progression data
    if (includeProgression) {
      context.progression = await this._gatherProgressionContext(gameState)
    }

    // Gather event data
    if (includeEvents) {
      context.events = await this._gatherEventContext(recentEventLimit)
    }

    // Gather consequence data
    if (includeConsequences) {
      context.consequences = await this._gatherConsequenceContext(gameState.turn, consequenceLimit)
    }

    // Gather knowledge data
    if (includeKnowledge) {
      context.knowledge = this._gatherKnowledgeContext(gameState)
    }

    // Analyze behavioral patterns
    context.patterns = this._analyzePatterns(context.events)

    // Build formatted string for AI prompt
    context.formatted = this._formatContextForAI(context, gameState)

    return context
  }

  /**
   * Gather progression context
   */
  async _gatherProgressionContext(gameState) {
    try {
      const progression = await progressionSystem.getProgression()
      if (!progression) return null

      return {
        stage: progression.stage,
        stageDescription: STAGE_DESCRIPTIONS[progression.stage] || STAGE_DESCRIPTIONS.initiation,
        maxIntensity: progression.maxIntensity,
        dayNumber: progression.dayNumber,
        
        // Top fetish experiences
        fetishLevels: this._formatFetishLevels(progression.fetishExperience),
        
        // NPC familiarity
        npcFamiliarity: this._formatNpcFamiliarity(progression.npcFamiliarity),
        
        // Recent milestones
        recentMilestones: progression.milestonesCompleted
          .slice(-3)
          .map(m => m.id),
        
        // Streaks
        streaks: progression.streaks
      }
    } catch (error) {
      console.error('Failed to gather progression context:', error)
      return null
    }
  }

  /**
   * Format fetish levels for context
   */
  _formatFetishLevels(fetishExperience) {
    if (!fetishExperience) return {}
    
    const formatted = {}
    for (const [fetish, data] of Object.entries(fetishExperience)) {
      if (data.level > 0) {
        formatted[fetish] = {
          level: data.level,
          label: FETISH_LEVEL_LABELS[data.level] || 'Unknown',
          encounters: data.encounters
        }
      }
    }
    return formatted
  }

  /**
   * Format NPC familiarity for context
   */
  _formatNpcFamiliarity(npcFamiliarity) {
    if (!npcFamiliarity) return {}
    
    const formatted = {}
    for (const [npc, data] of Object.entries(npcFamiliarity)) {
      formatted[npc] = {
        tier: data.familiarityTier,
        label: FAMILIARITY_LABELS[data.familiarityTier] || 'Unknown',
        encounters: data.encounters,
        lastSeen: data.lastEncounterTurn
      }
    }
    return formatted
  }

  /**
   * Gather recent events context
   */
  async _gatherEventContext(limit) {
    try {
      const events = await eventLogger.getRecentEvents(limit)
      if (!events || events.length === 0) return null

      return events.map(e => ({
        turn: e.turn,
        type: e.type,
        npc: e.npc,
        description: e.description,
        fetishes: e.fetishesInvolved,
        narrativeFlags: e.narrativeFlags
      }))
    } catch (error) {
      console.error('Failed to gather event context:', error)
      return null
    }
  }

  /**
   * Gather unresolved consequences
   */
  async _gatherConsequenceContext(currentTurn, limit) {
    try {
      const consequences = await eventLogger.getUnresolvedConsequences(currentTurn)
      if (!consequences || consequences.length === 0) return null

      // Sort by relevance (most recent first, then by expiration)
      const sorted = consequences
        .sort((a, b) => {
          // Prioritize consequences that expire soon
          if (a.expiresAtTurn && b.expiresAtTurn) {
            return a.expiresAtTurn - b.expiresAtTurn
          }
          return b.eventTurn - a.eventTurn
        })
        .slice(0, limit)

      return sorted.map(c => ({
        type: c.type,
        description: c.description,
        targetNpc: c.targetNpc,
        fromEvent: c.eventDescription,
        turnsRemaining: c.expiresAtTurn ? c.expiresAtTurn - currentTurn : null
      }))
    } catch (error) {
      console.error('Failed to gather consequence context:', error)
      return null
    }
  }

  /**
   * Analyze patterns from events
   */
  _analyzePatterns(events) {
    if (!events || events.length < 3) return null

    const patterns = {
      recentBehavior: null,
      npcInteractions: {},
      fetishTrends: {}
    }

    // Analyze submission vs defiance ratio
    const submissions = events.filter(e => e.type === 'submission').length
    const defiances = events.filter(e => 
      e.type === 'defiance' || e.type === 'defiance_failed'
    ).length
    
    if (submissions > defiances * 2) {
      patterns.recentBehavior = 'obedient'
    } else if (defiances > submissions) {
      patterns.recentBehavior = 'rebellious'
    } else {
      patterns.recentBehavior = 'mixed'
    }

    // Count NPC interactions
    for (const event of events) {
      if (event.npc) {
        patterns.npcInteractions[event.npc] = 
          (patterns.npcInteractions[event.npc] || 0) + 1
      }
    }

    // Count fetish occurrences
    for (const event of events) {
      for (const fetish of event.fetishes || []) {
        patterns.fetishTrends[fetish] = 
          (patterns.fetishTrends[fetish] || 0) + 1
      }
    }

    return patterns
  }

  /**
   * Gather knowledge context from the knowledge system
   */
  _gatherKnowledgeContext(gameState) {
    try {
      // Get TJ's known NPCs
      const knownNpcs = knowledgeSystem.getTJKnownNpcs()
      
      // Get discovered locations
      const discoveredLocations = knowledgeSystem.getTJDiscoveredLocations()
      
      // Get what current NPC knows about TJ (if there is one)
      let currentNpcKnowledge = null
      if (gameState.currentNpc) {
        currentNpcKnowledge = knowledgeSystem.getNpcKnowledgeOfTJ(gameState.currentNpc)
      }
      
      // Get recent witnessed gossip
      const witnessedGossip = knowledgeSystem.getWitnessedGossip()
      
      return {
        tjKnownNpcs: knownNpcs,
        discoveredLocations,
        currentNpcKnowledge,
        witnessedGossip: witnessedGossip.slice(-3)
      }
    } catch (error) {
      console.error('Failed to gather knowledge context:', error)
      return null
    }
  }

  /**
   * Format context for AI prompt insertion
   */
  _formatContextForAI(context, gameState) {
    const sections = []

    // === PROGRESSION CONTEXT ===
    if (context.progression) {
      const p = context.progression
      const progressionLines = [
        '=== PLAYER PROGRESSION ===',
        `Stage: ${p.stage.toUpperCase()} (Day ${p.dayNumber})`,
        `${p.stageDescription}`,
        `Maximum Intensity Allowed: ${p.maxIntensity}/10`
      ]

      // Add experienced fetishes
      const expFetishes = Object.entries(p.fetishLevels)
        .filter(([_, data]) => data.level >= 2)
        .map(([fetish, data]) => `${fetish}: ${data.label}`)
      
      if (expFetishes.length > 0) {
        progressionLines.push(`Experienced fetishes: ${expFetishes.join(', ')}`)
      }

      // Add NPC familiarity hints
      const familiarNpcs = Object.entries(p.npcFamiliarity)
        .filter(([_, data]) => data.tier !== 'stranger')
        .map(([npc, data]) => `${npc} (${data.label})`)
      
      if (familiarNpcs.length > 0) {
        progressionLines.push(`NPC relationships: ${familiarNpcs.join(', ')}`)
      }

      // Add streak info
      if (p.streaks) {
        if (p.streaks.submissions >= 3) {
          progressionLines.push(`⚡ Submission streak: ${p.streaks.submissions} consecutive`)
        }
        if (p.streaks.successfulDefiances >= 2) {
          progressionLines.push(`⚡ Defiance streak: ${p.streaks.successfulDefiances} successful`)
        }
      }

      sections.push(progressionLines.join('\n'))
    }

    // === ACTIVE CONSEQUENCES ===
    if (context.consequences && context.consequences.length > 0) {
      const consequenceLines = ['=== ACTIVE CONSEQUENCES ===']
      
      for (const c of context.consequences) {
        let line = `• ${c.description}`
        if (c.turnsRemaining) {
          line += ` (${c.turnsRemaining} turns remaining)`
        }
        consequenceLines.push(line)
      }

      consequenceLines.push('')
      consequenceLines.push('IMPORTANT: Reference these consequences in the narrative when appropriate.')
      
      sections.push(consequenceLines.join('\n'))
    }

    // === RECENT EVENTS SUMMARY ===
    if (context.events && context.events.length > 0) {
      const eventLines = ['=== RECENT EVENTS ===']
      
      for (const e of context.events.slice(0, 3)) {
        let line = `Turn ${e.turn}: ${e.description}`
        if (e.narrativeFlags?.npcThreatened) {
          line += ' [threatened]'
        }
        if (e.narrativeFlags?.npcPromisedReward) {
          line += ' [promised reward]'
        }
        eventLines.push(line)
      }

      sections.push(eventLines.join('\n'))
    }

    // === BEHAVIORAL PATTERNS ===
    if (context.patterns) {
      const patternLines = ['=== BEHAVIORAL ANALYSIS ===']
      
      if (context.patterns.recentBehavior === 'obedient') {
        patternLines.push('Player has been consistently OBEDIENT recently.')
        patternLines.push('→ NPCs may show slight approval or push harder.')
      } else if (context.patterns.recentBehavior === 'rebellious') {
        patternLines.push('Player has been REBELLIOUS recently.')
        patternLines.push('→ NPCs should be more aggressive, expect punishment.')
      }

      // Dominant NPC
      const npcCounts = Object.entries(context.patterns.npcInteractions)
      if (npcCounts.length > 0) {
        const dominant = npcCounts.sort((a, b) => b[1] - a[1])[0]
        if (dominant[1] >= 3) {
          patternLines.push(`Most frequent NPC: ${dominant[0]} (${dominant[1]} recent interactions)`)
        }
      }

      // Trending fetish
      const fetishCounts = Object.entries(context.patterns.fetishTrends)
      if (fetishCounts.length > 0) {
        const trending = fetishCounts.sort((a, b) => b[1] - a[1])[0]
        if (trending[1] >= 2) {
          patternLines.push(`Trending fetish: ${trending[0]}`)
        }
      }

      if (patternLines.length > 1) {
        sections.push(patternLines.join('\n'))
      }
    }

    // === KNOWLEDGE CONTEXT ===
    if (context.knowledge) {
      const k = context.knowledge
      const knowledgeLines = ['=== KNOWLEDGE STATE ===']

      // What TJ knows about NPCs
      if (k.tjKnownNpcs && k.tjKnownNpcs.length > 0) {
        const npcKnowledge = k.tjKnownNpcs.map(n => {
          const tier = this._getKnowledgeTierDescription(n.tier)
          return `${n.npcId} (${tier})`
        }).join(', ')
        knowledgeLines.push(`TJ knows: ${npcKnowledge}`)
      } else {
        knowledgeLines.push('TJ knows no one yet - first encounters should include introductions.')
      }

      // What current NPC knows about TJ
      if (k.currentNpcKnowledge && gameState.currentNpc) {
        const npcK = k.currentNpcKnowledge
        knowledgeLines.push('')
        knowledgeLines.push(`What ${gameState.currentNpc} knows about TJ:`)
        knowledgeLines.push(`  Impression: ${npcK.impression || 'neutral'}`)
        if (npcK.knownTraits && npcK.knownTraits.length > 0) {
          knowledgeLines.push(`  Known traits: ${npcK.knownTraits.join(', ')}`)
        }
        if (npcK.directExperience && npcK.directExperience.length > 0) {
          knowledgeLines.push(`  Direct experiences: ${npcK.directExperience.length}`)
        }
        if (npcK.gossipReceived && npcK.gossipReceived.length > 0) {
          knowledgeLines.push(`  Has heard gossip from: ${npcK.gossipReceived.map(g => g.fromNpc).join(', ')}`)
        }
      }

      // Recent witnessed gossip
      if (k.witnessedGossip && k.witnessedGossip.length > 0) {
        knowledgeLines.push('')
        knowledgeLines.push('Recent gossip TJ witnessed:')
        for (const g of k.witnessedGossip) {
          knowledgeLines.push(`  • ${g.witnessDescription}`)
        }
      }

      if (knowledgeLines.length > 1) {
        sections.push(knowledgeLines.join('\n'))
      }
    }

    return sections.join('\n\n')
  }

  /**
   * Get human-readable knowledge tier description
   */
  _getKnowledgeTierDescription(tier) {
    const descriptions = {
      unknown: 'unknown',
      aware: 'heard of',
      met: 'has met',
      familiar: 'knows well',
      intimate: 'deeply familiar'
    }
    return descriptions[tier] || tier
  }

  /**
   * Get a lightweight context summary (for shorter prompts)
   */
  async getContextSummary(gameState) {
    const context = await this.buildContext(gameState, {
      recentEventLimit: 3,
      consequenceLimit: 5
    })

    const summary = []

    if (context.progression) {
      summary.push(`[${context.progression.stage.toUpperCase()} Day ${context.progression.dayNumber}, Max Intensity: ${context.progression.maxIntensity}]`)
    }

    if (context.consequences && context.consequences.length > 0) {
      summary.push(`[${context.consequences.length} active consequence(s)]`)
    }

    if (context.patterns?.recentBehavior) {
      summary.push(`[Recent behavior: ${context.patterns.recentBehavior}]`)
    }

    return summary.join(' ')
  }

  /**
   * Get NPC-specific context for when that NPC appears
   */
  async getNpcContext(npcId, gameState) {
    const context = []

    // Get NPC's recent events with player
    try {
      const npcEvents = await eventLogger.getEventsForNpc(npcId, 5)
      
      if (npcEvents && npcEvents.length > 0) {
        context.push(`=== ${npcId.toUpperCase()}'S MEMORY ===`)
        
        for (const e of npcEvents) {
          let line = `Turn ${e.turn}: ${e.description}`
          context.push(line)
        }

        // Check for unresolved consequences with this NPC
        const consequences = await eventLogger.getUnresolvedConsequences(gameState.turn)
        const npcConsequences = consequences?.filter(c => 
          c.targetNpc === npcId || c.eventNpc === npcId
        ) || []

        if (npcConsequences.length > 0) {
          context.push('')
          context.push(`${npcId} remembers:`)
          for (const c of npcConsequences) {
            context.push(`• ${c.description}`)
          }
        }
      }
    } catch (error) {
      console.error(`Failed to get NPC context for ${npcId}:`, error)
    }

    // Get familiarity from progression
    try {
      const progression = await progressionSystem.getProgression()
      const familiarity = progression?.npcFamiliarity?.[npcId]
      
      if (familiarity) {
        const label = FAMILIARITY_LABELS[familiarity.familiarityTier] || 'Unknown'
        context.push(`Familiarity: ${label} (${familiarity.encounters} encounters)`)
      }
    } catch (error) {
      // Progression not available, skip
    }

    // Get knowledge system data
    try {
      const npcKnowledge = knowledgeSystem.getNpcKnowledgeOfTJ(npcId)
      if (npcKnowledge) {
        context.push('')
        context.push(`=== ${npcId.toUpperCase()}'S KNOWLEDGE OF TJ ===`)
        context.push(`Impression: ${npcKnowledge.impression || 'neutral'}`)
        
        if (npcKnowledge.knownTraits && npcKnowledge.knownTraits.length > 0) {
          context.push(`Believes TJ is: ${npcKnowledge.knownTraits.join(', ')}`)
        }
        
        if (npcKnowledge.gossipReceived && npcKnowledge.gossipReceived.length > 0) {
          context.push('Has heard about TJ from others:')
          for (const g of npcKnowledge.gossipReceived.slice(-3)) {
            context.push(`  • From ${g.fromNpc}: ${g.summary}`)
          }
        }
      }
    } catch (error) {
      // Knowledge not available, skip
    }

    return context.join('\n')
  }

  /**
   * Get knowledge-specific context for an NPC
   */
  getNpcKnowledgeContext(npcId) {
    return knowledgeSystem.buildNpcKnowledgeContext(npcId)
  }

  /**
   * Resolve expired consequences (should be called at turn start)
   */
  async resolveExpiredConsequences(currentTurn) {
    return eventLogger.resolveExpiredConsequences(currentTurn)
  }
}

export const contextBuilder = new ContextBuilder()
export default contextBuilder
