import choiceTemplates from '../data/choiceTemplates.json'
import stateGatedChoices from '../data/stateGatedChoices.json'
import npcChoices from '../data/npcChoices.json'
import locationChoices from '../data/locationChoices.json'
import configData from '../data/config.json'
import { settingsService } from '../services/SettingsService'

/**
 * ChoiceGenerator - Assembles context-aware choices from multiple sources
 * 
 * Sources:
 * 1. Scene context templates (opening, demand, torment, etc.)
 * 2. Core archetypes (SUBMIT, RESIST, ENDURE, etc.)
 * 3. State-gated special choices (based on stats/flags)
 * 4. NPC-specific choices (based on current NPC)
 * 5. Location-based choices
 * 6. AI wild cards (added externally)
 */
export class ChoiceGenerator {
  constructor() {
    this.archetypes = choiceTemplates.archetypes
    this.sceneContexts = choiceTemplates.sceneContexts
    this.config = choiceTemplates.config
    this.stateGated = stateGatedChoices.choices
    this.lockHints = stateGatedChoices.lockHints
    this.npcPools = npcChoices
    this.locationPools = locationChoices
    this.affinityTiers = configData.affinityTiers
  }

  /**
   * Detect scene context from narrative and state
   * @param {Object} context - Game context
   * @param {string} description - Scene description
   * @returns {string} - Scene context type
   */
  detectSceneContext(context, description = '') {
    const { stats, currentNpc, history } = context
    const descLower = description.toLowerCase()
    
    // Check for explicit context hints in description
    if (descLower.includes('arrive') || descLower.includes('enter') || 
        descLower.includes('first time') || descLower.includes('welcome') ||
        descLower.includes('emerge') || descLower.includes('greet')) {
      // Check if it's actually the start of the game
      if (!history || history.length <= 1) {
        return 'opening'
      }
    }
    
    // Check for torment/intense scenes
    if (descLower.includes('tickl') || descLower.includes('torment') ||
        descLower.includes('torture') || descLower.includes('punish') ||
        descLower.includes('scream') || descLower.includes('writhe')) {
      return 'torment'
    }
    
    // Check for edging scenes
    if (descLower.includes('edge') || descLower.includes('deny') ||
        descLower.includes('arousal') || descLower.includes('release') ||
        descLower.includes('orgasm') || descLower.includes('stroke')) {
      return 'edging'
    }
    
    // Check for worship scenes
    if (descLower.includes('worship') || descLower.includes('lick') ||
        descLower.includes('kiss') || (descLower.includes('feet') && descLower.includes('tongue')) ||
        descLower.includes('sweat') || descLower.includes('sole')) {
      return 'worship'
    }
    
    // Check for group scenes
    const npcMentions = ['sandy', 'araph', 'nancy', 'aish', 'gaya', 'melissa']
      .filter(npc => descLower.includes(npc)).length
    if (npcMentions >= 2) {
      return 'group'
    }
    
    // Check for teasing
    if (descLower.includes('tease') || descLower.includes('smirk') ||
        descLower.includes('toy with') || descLower.includes('play with')) {
      return 'tease'
    }
    
    // Check for commands/demands
    if (descLower.includes('command') || descLower.includes('order') ||
        descLower.includes('demand') || descLower.includes('do it') ||
        descLower.includes('now') || descLower.includes('kneel')) {
      return 'demand'
    }
    
    // Check for aftermath/recovery
    if (descLower.includes('finish') || descLower.includes('done') ||
        descLower.includes('recover') || descLower.includes('rest') ||
        descLower.includes('breath') || descLower.includes('afterward')) {
      return 'aftermath'
    }
    
    // Check for transitions
    if (descLower.includes('follow') || descLower.includes('lead') ||
        descLower.includes('walk') || descLower.includes('corridor') ||
        descLower.includes('move to')) {
      return 'transition'
    }
    
    // Default based on state
    if (stats.arousal > 70) return 'edging'
    if (stats.endurance < 30) return 'torment'
    
    return this.config.defaultSceneContext || 'demand'
  }

  /**
   * Get choice generation settings
   * @returns {Object} - Settings for choice generation
   */
  _getChoiceSettings() {
    const settings = settingsService.getAll()
    return {
      choiceBalance: settings.choiceBalance ?? 50,
      engineChoiceMax: settings.engineChoiceMax ?? 4,
      aiChoiceMax: settings.aiChoiceMax ?? 4,
      totalChoiceMax: settings.totalChoiceMax ?? 6,
    }
  }

  /**
   * Calculate how many engine vs AI choices based on balance
   * @returns {Object} - { engineCount, aiCount }
   */
  calculateChoiceCounts() {
    const { choiceBalance, engineChoiceMax, aiChoiceMax, totalChoiceMax } = this._getChoiceSettings()
    
    // choiceBalance: 0 = all engine, 100 = all AI
    const aiRatio = choiceBalance / 100
    const engineRatio = 1 - aiRatio
    
    let aiCount = Math.round(totalChoiceMax * aiRatio)
    let engineCount = Math.round(totalChoiceMax * engineRatio)
    
    // Apply maximums
    aiCount = Math.min(aiCount, aiChoiceMax)
    engineCount = Math.min(engineCount, engineChoiceMax)
    
    // Ensure at least some choices when not at extremes
    if (choiceBalance > 0 && choiceBalance < 100) {
      aiCount = Math.max(aiCount, 1)
      engineCount = Math.max(engineCount, 1)
    }
    
    // Handle extremes
    if (choiceBalance === 0) {
      aiCount = 0
      engineCount = Math.min(engineChoiceMax, totalChoiceMax)
    } else if (choiceBalance === 100) {
      engineCount = 0
      aiCount = Math.min(aiChoiceMax, totalChoiceMax)
    }
    
    return { engineCount, aiCount, totalMax: totalChoiceMax }
  }

  /**
   * Generate choices for the current game state
   * @param {Object} context - Current game context
   * @param {string} sceneDescription - Description to detect context from
   * @returns {Object} - { available: [], locked: [], sceneContext: string }
   */
  generate(context, sceneDescription = '') {
    const { stats, affinities, currentNpc, currentLocation, flags } = context
    const { engineCount, aiCount, totalMax } = this.calculateChoiceCounts()
    
    // Detect scene context
    const sceneContext = this.detectSceneContext(context, sceneDescription)
    const contextConfig = this.sceneContexts[sceneContext] || this.sceneContexts.demand
    
    // If balance is 100% AI, return minimal engine choices
    if (engineCount === 0) {
      return {
        available: [],
        locked: [],
        sceneContext,
        engineCount: 0,
        aiCount,
      }
    }
    
    const choices = []
    const lockedChoices = []
    
    // 1. Add scene context-specific choices first
    if (contextConfig.choices && contextConfig.choices.length > 0) {
      for (const choice of contextConfig.choices) {
        if (choices.length >= engineCount) break
        choices.push({
          ...choice,
          type: choice.archetype.toLowerCase(),
          isContextSpecific: true,
          sceneContext,
        })
      }
    }
    
    // 2. Fill remaining with core archetypes (filtered by context)
    if (choices.length < engineCount) {
      const coreChoices = this._selectCoreArchetypes(context, contextConfig, engineCount - choices.length)
      choices.push(...coreChoices)
    }
    
    // 3. Check state-gated choices
    const { available: gatedAvailable, locked: gatedLocked } = this._getStateGatedChoices(context, contextConfig)
    
    // Add available state-gated choices (up to limit)
    for (const choice of gatedAvailable) {
      if (choices.length >= engineCount) break
      // Don't add if we already have this archetype
      if (!choices.some(c => c.archetype === choice.archetype)) {
        choices.push(choice)
      }
    }
    
    lockedChoices.push(...gatedLocked)
    
    // 4. Add NPC-specific choice (1 max, if not opening/transition)
    if (currentNpc && this.npcPools[currentNpc] && 
        !['opening', 'transition'].includes(sceneContext) &&
        choices.length < engineCount) {
      const npcChoice = this._selectNpcChoice(currentNpc, context, choices)
      if (npcChoice) {
        choices.push(npcChoice)
      }
    }
    
    // 5. Add location choice if relevant (1 max)
    if (currentLocation && this.locationPools[currentLocation] && 
        choices.length < engineCount) {
      const locationChoice = this._selectLocationChoice(currentLocation, context, choices)
      if (locationChoice) {
        choices.push(locationChoice)
      }
    }
    
    // 6. Apply affinity text variants
    const withVariants = choices.map(choice => 
      this._applyAffinityVariant(choice, currentNpc, affinities)
    )
    
    // 7. Add consequence hints
    const withHints = withVariants.map(choice => 
      this._addConsequenceHint(choice)
    )
    
    // 8. Cap at engine count
    const capped = withHints.slice(0, engineCount)
    
    // 9. Assign IDs
    const final = capped.map((choice, index) => ({
      ...choice,
      id: choice.id || `engine-${index + 1}`,
    }))
    
    // 10. Process locked choices (limit to 2 most relevant)
    const processedLocked = lockedChoices
      .slice(0, 2)
      .map((choice, index) => ({
        ...choice,
        id: choice.id || `locked-${index + 1}`,
        isLocked: true,
        lockReason: this._getLockReason(choice, context),
      }))
    
    return {
      available: final,
      locked: processedLocked,
      sceneContext,
      engineCount,
      aiCount,
    }
  }

  /**
   * Select core archetype choices based on context
   * @private
   */
  _selectCoreArchetypes(context, contextConfig, maxCount) {
    const choices = []
    const { stats, currentNpc } = context
    const allowedArchetypes = contextConfig.allowedArchetypes || Object.keys(this.archetypes)
    
    // For opening scenes, be very selective
    if (contextConfig === this.sceneContexts.opening) {
      // Don't add generic archetypes for opening - let context-specific and AI handle it
      return []
    }
    
    // Always include SUBMIT if allowed and config says so
    if (this.config.alwaysIncludeSubmit && allowedArchetypes.includes('SUBMIT')) {
      choices.push({
        archetype: 'SUBMIT',
        text: this.archetypes.SUBMIT.affinityVariants?.neutral?.textTemplate || 'Submit',
        label: this.archetypes.SUBMIT.baseLabel,
        type: 'submit',
        effects: { ...this.archetypes.SUBMIT.defaultEffects },
      })
    }
    
    // Include alternatives based on context and state
    if (this.config.alwaysIncludeAlternative && choices.length < maxCount) {
      // Low endurance: suggest ENDURE
      if (stats.endurance < 40 && allowedArchetypes.includes('ENDURE')) {
        choices.push({
          archetype: 'ENDURE',
          text: this.archetypes.ENDURE.textTemplate || 'Endure it silently',
          label: this.archetypes.ENDURE.label || 'Endure',
          type: 'endure',
          effects: { ...this.archetypes.ENDURE.defaultEffects },
        })
      }
      
      // Low obedience: suggest RESIST
      if (stats.obedience < 50 && allowedArchetypes.includes('RESIST') && choices.length < maxCount) {
        choices.push({
          archetype: 'RESIST',
          text: this.archetypes.RESIST.affinityVariants?.neutral?.textTemplate || 'Refuse',
          label: this.archetypes.RESIST.baseLabel,
          type: 'resist',
          effects: { ...this.archetypes.RESIST.defaultEffects },
        })
      }
      
      // High arousal: suggest GROVEL
      if (stats.arousal > 50 && allowedArchetypes.includes('GROVEL') && choices.length < maxCount) {
        choices.push({
          archetype: 'GROVEL',
          text: 'Please... I\'ll do anything...',
          label: 'Beg',
          type: 'grovel',
          effects: { ...this.archetypes.GROVEL.defaultEffects },
          riskOverGrovel: true,
        })
      }
      
      // Add NEGOTIATE if we still need more
      if (allowedArchetypes.includes('NEGOTIATE') && choices.length < maxCount) {
        choices.push({
          archetype: 'NEGOTIATE',
          text: 'Could we perhaps...?',
          label: 'Negotiate',
          type: 'negotiate',
          rollRequired: { dc: this.archetypes.NEGOTIATE.defaultRollDC, stat: 'obedience' },
          effects: { ...this.archetypes.NEGOTIATE.defaultEffects },
        })
      }
    }
    
    return choices.slice(0, maxCount)
  }

  /**
   * Get state-gated choices, separating available from locked
   * @private
   */
  _getStateGatedChoices(context, contextConfig) {
    const available = []
    const locked = []
    const allowedArchetypes = contextConfig?.allowedArchetypes || Object.keys(this.archetypes)
    
    for (const choice of this.stateGated) {
      // Skip if archetype not allowed in this context
      if (!allowedArchetypes.includes(choice.archetype)) continue
      
      const { passes, failedConditions } = this._checkConditions(choice.conditions, context)
      
      if (passes) {
        available.push({
          ...choice,
          type: choice.archetype.toLowerCase(),
          isStateGated: true,
        })
      } else {
        // Only show as locked if it's "close" to being available
        if (this._isCloseToUnlocking(choice.conditions, context, failedConditions)) {
          locked.push({
            ...choice,
            type: choice.archetype.toLowerCase(),
            isStateGated: true,
            failedConditions,
          })
        }
      }
    }
    
    return { available, locked }
  }

  /**
   * Check if conditions are met
   * @private
   */
  _checkConditions(conditions, context) {
    if (!conditions) return { passes: true, failedConditions: [] }
    
    const { stats, affinities, flags, currentNpc, currentLocation } = context
    const failedConditions = []
    
    // Check stat conditions
    if (conditions.stats) {
      for (const [stat, range] of Object.entries(conditions.stats)) {
        const value = stats[stat] || 0
        if (range.min !== undefined && value < range.min) {
          failedConditions.push({ type: 'stat', stat, required: `min ${range.min}`, current: value })
        }
        if (range.max !== undefined && value > range.max) {
          failedConditions.push({ type: 'stat', stat, required: `max ${range.max}`, current: value })
        }
      }
    }
    
    // Check flag conditions
    if (conditions.flags) {
      for (const [flag, value] of Object.entries(conditions.flags)) {
        if (flags[flag] !== value) {
          failedConditions.push({ type: 'flag', flag, required: value, current: flags[flag] })
        }
      }
    }
    
    // Check NPC condition
    if (conditions.currentNpc && conditions.currentNpc !== currentNpc) {
      failedConditions.push({ type: 'npc', required: conditions.currentNpc, current: currentNpc })
    }
    
    // Check location condition
    if (conditions.currentLocation && conditions.currentLocation !== currentLocation) {
      failedConditions.push({ type: 'location', required: conditions.currentLocation, current: currentLocation })
    }
    
    return {
      passes: failedConditions.length === 0,
      failedConditions,
    }
  }

  /**
   * Check if a choice is "close" to being unlocked (for showing locked hints)
   * @private
   */
  _isCloseToUnlocking(conditions, context, failedConditions) {
    if (!conditions || failedConditions.length === 0) return false
    
    // Show if only one condition is failing
    if (failedConditions.length === 1) return true
    
    // Show if it's a flag-only failure (discoverable secrets)
    if (failedConditions.every(c => c.type === 'flag')) return true
    
    // Show if NPC matches but stats don't quite
    const npcFailed = failedConditions.find(c => c.type === 'npc')
    if (!npcFailed && failedConditions.length <= 2) return true
    
    return false
  }

  /**
   * Select a choice from NPC-specific pool
   * @private
   */
  _selectNpcChoice(npcId, context, existingChoices) {
    const pool = this.npcPools[npcId]
    if (!pool || !pool.choices || pool.choices.length === 0) return null
    
    // Get existing archetypes to avoid duplicates
    const existingArchetypes = new Set(existingChoices.map(c => c.archetype))
    
    // Find a choice with a unique archetype
    for (const choice of pool.choices) {
      if (!existingArchetypes.has(choice.archetype)) {
        return {
          ...choice,
          type: choice.archetype.toLowerCase(),
          isNpcSpecific: true,
          npcId,
        }
      }
    }
    
    return null
  }

  /**
   * Select a choice from location pool
   * @private
   */
  _selectLocationChoice(locationId, context, existingChoices) {
    const pool = this.locationPools[locationId]
    if (!pool || !pool.choices || pool.choices.length === 0) return null
    
    const existingArchetypes = new Set(existingChoices.map(c => c.archetype))
    
    for (const choice of pool.choices) {
      if (!existingArchetypes.has(choice.archetype)) {
        return {
          ...choice,
          type: choice.archetype.toLowerCase(),
          isLocationSpecific: true,
          locationId,
        }
      }
    }
    
    return null
  }

  /**
   * Apply affinity-based text variant to a choice
   * @private
   */
  _applyAffinityVariant(choice, currentNpc, affinities) {
    const archetype = this.archetypes[choice.archetype]
    if (!archetype?.affinityVariants) return choice
    
    // Don't override context-specific or NPC-specific text
    if (choice.isContextSpecific || choice.isNpcSpecific || choice.isStateGated) {
      return choice
    }
    
    // Get affinity tier for current NPC
    const affinity = currentNpc ? (affinities[currentNpc] || 0) : 0
    const tier = this._getAffinityTier(affinity)
    
    const variant = archetype.affinityVariants[tier]
    if (!variant) return choice
    
    return {
      ...choice,
      text: variant.textTemplate || choice.text,
      label: variant.label || choice.label,
    }
  }

  /**
   * Get affinity tier from value
   * @private
   */
  _getAffinityTier(affinity) {
    for (const tier of this.affinityTiers) {
      if (affinity >= tier.min && affinity <= tier.max) {
        return tier.tier.toLowerCase()
      }
    }
    return 'neutral'
  }

  /**
   * Add consequence hint to choice
   * @private
   */
  _addConsequenceHint(choice) {
    // Use existing hint if present
    if (choice.consequenceHint) {
      return choice
    }
    
    // Get default hint from archetype
    const archetype = this.archetypes[choice.archetype]
    if (archetype?.consequenceHint) {
      return {
        ...choice,
        consequenceHint: archetype.consequenceHint,
      }
    }
    
    return choice
  }

  /**
   * Get human-readable lock reason
   * @private
   */
  _getLockReason(choice, context) {
    if (!choice.failedConditions || choice.failedConditions.length === 0) {
      return 'Requirements not met'
    }
    
    const reasons = choice.failedConditions.map(condition => {
      switch (condition.type) {
        case 'stat':
          const template = this.lockHints[condition.stat] || `${condition.stat} ${condition.required}`
          return template.replace('{threshold}', condition.required)
        case 'flag':
          return this.lockHints[condition.flag] || `Requires: ${condition.flag}`
        case 'npc':
          return `Requires: ${condition.required} scene`
        case 'location':
          return `Requires: ${condition.required}`
        default:
          return 'Requirements not met'
      }
    })
    
    return reasons[0] // Show first reason only for cleaner UI
  }

  /**
   * Merge engine-generated choices with AI wild cards
   * @param {Array} engineChoices - Choices from generate()
   * @param {Array} aiChoices - Choices from AI
   * @param {number} aiLimit - Max AI choices to include
   * @returns {Array} - Merged choices
   */
  mergeWithAIChoices(engineChoices, aiChoices = [], aiLimit = null) {
    const { aiCount, totalMax } = this.calculateChoiceCounts()
    const limit = aiLimit ?? aiCount
    
    if (!aiChoices || aiChoices.length === 0 || limit === 0) {
      return engineChoices
    }
    
    // Filter AI choices to avoid duplicates
    const engineTexts = new Set(engineChoices.map(c => c.text?.toLowerCase() || ''))
    
    const filteredAI = aiChoices.filter(aiChoice => {
      // Skip if text is too similar
      const aiTextLower = aiChoice.text?.toLowerCase() || ''
      for (const existingText of engineTexts) {
        if (this._textSimilarity(aiTextLower, existingText) > 0.6) {
          return false
        }
      }
      return true
    })
    
    // Mark AI choices
    const markedAI = filteredAI.slice(0, limit).map((choice, index) => ({
      ...choice,
      id: choice.id || `ai-${index + 1}`,
      isAIGenerated: true,
      archetype: this._inferArchetype(choice),
    }))
    
    // Merge and cap at total max
    const merged = [...engineChoices, ...markedAI]
    return merged.slice(0, totalMax)
  }

  /**
   * Simple text similarity check
   * @private
   */
  _textSimilarity(a, b) {
    const wordsA = new Set(a.split(/\s+/))
    const wordsB = new Set(b.split(/\s+/))
    const intersection = [...wordsA].filter(w => wordsB.has(w))
    const union = new Set([...wordsA, ...wordsB])
    return intersection.length / union.size
  }

  /**
   * Infer archetype from AI choice
   * @private
   */
  _inferArchetype(choice) {
    const type = choice.type?.toLowerCase() || ''
    const text = choice.text?.toLowerCase() || ''
    
    if (type === 'submit' || text.includes('yes') || text.includes('obey')) return 'SUBMIT'
    if (type === 'defy' || text.includes('no') || text.includes('refuse')) return 'RESIST'
    if (type === 'beg' || text.includes('please') || text.includes('beg')) return 'GROVEL'
    if (text.includes('offer') || text.includes('volunteer')) return 'OFFER'
    if (text.includes('wait') || text.includes('endure')) return 'ENDURE'
    if (text.includes('distract') || text.includes('point')) return 'DISTRACT'
    
    return 'NEGOTIATE' // Default
  }
}

export default ChoiceGenerator
