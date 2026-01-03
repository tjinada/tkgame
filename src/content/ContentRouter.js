import { ScenarioLoader } from './ScenarioLoader'
import { NanoGPTClient } from './NanoGPTClient'
import { PromptBuilder } from './PromptBuilder'
import { ChoiceGenerator } from '../engine/ChoiceGenerator'
import { settingsService } from '../services/SettingsService'
import { debugLog } from '../components/admin/tabs/DebugTab'

export class ContentRouter {
  constructor(options = {}) {
    this.scenarioLoader = options.scenarioLoader || new ScenarioLoader()
    this.nanoGPTClient = options.nanoGPTClient || new NanoGPTClient()
    this.promptBuilder = options.promptBuilder || new PromptBuilder({
      contextLimit: settingsService.get('aiHistoryTurns') || settingsService.get('contextLimit') || 6,
    })
    this.choiceGenerator = options.choiceGenerator || new ChoiceGenerator()
    
    // Modes: 'json-only', 'ai-only', 'hybrid'
    this.mode = options.mode || 'hybrid'
    
    // Whether to use the hybrid choice system
    this.useHybridChoices = options.useHybridChoices !== false
  }

  /**
   * Update settings that affect content generation
   */
  refreshSettings() {
    this.promptBuilder.setContextLimit(
      settingsService.get('aiHistoryTurns') || settingsService.get('contextLimit') || 6
    )
  }

  /**
   * Load a scenario for JSON content
   * @param {Object} scenarioData - The scenario JSON
   */
  loadScenario(scenarioData) {
    this.scenarioLoader.loadScenario(scenarioData)
  }

  /**
   * Set the content mode
   * @param {string} mode - 'json-only', 'ai-only', or 'hybrid'
   */
  setMode(mode) {
    this.mode = mode
  }

  /**
   * Get current mode
   * @returns {string}
   */
  getMode() {
    return this.mode
  }

  /**
   * Get scene content by ID
   * @param {string} sceneId - Scene identifier
   * @param {Object} context - Current game context
   * @returns {Promise<Object>}
   */
  async getSceneContent(sceneId, context = {}) {
    // Try JSON first in hybrid or json-only mode
    if (this.mode !== 'ai-only') {
      const jsonScene = this.scenarioLoader.getScene(sceneId)
      if (jsonScene) {
        return this._formatScene(jsonScene, 'json')
      }
    }

    // Fall back to AI in hybrid or ai-only mode
    if (this.mode !== 'json-only') {
      return this._generateScene(sceneId, context)
    }

    return null
  }

  /**
   * Get next scene based on choice
   * @param {string} choiceId - The choice ID or next scene ID
   * @param {Object} context - Current game context
   * @returns {Promise<Object>}
   */
  async getNextScene(choiceId, context = {}) {
    return this.getSceneContent(choiceId, context)
  }

  /**
   * Generate scene from custom action (non-streaming)
   * @param {string} actionText - Player's custom action
   * @param {Object} context - Current game context
   * @returns {Promise<Object>}
   */
  async generateFromAction(actionText, context = {}) {
    if (this.mode === 'json-only') {
      return {
        id: `custom-${Date.now()}`,
        description: 'Custom actions require AI mode to be enabled.',
        choices: [],
        source: 'error',
      }
    }

    const systemPrompt = this.promptBuilder.buildSystemPrompt(context)
    const userMessage = this.promptBuilder.buildUserMessage(actionText, context)

    // Log the full prompt for debugging
    debugLog.prompt(systemPrompt, userMessage, {
      ...context,
      turn: context.history?.length || 0,
    })

    const response = await this.nanoGPTClient.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ])

    if (response.error) {
      return {
        id: `error-${Date.now()}`,
        description: 'Failed to generate content. Please try again.',
        choices: [],
        source: 'error',
      }
    }

    return this._parseAIResponse(response.content)
  }

  /**
   * Generate scene from custom action with streaming
   * @param {string} actionText - Player's custom action
   * @param {Object} context - Current game context
   * @param {Function} onChunk - Callback for streaming chunks (delta, fullContent)
   * @returns {Promise<Object>}
   */
  async generateFromActionStreaming(actionText, context = {}, onChunk) {
    if (this.mode === 'json-only') {
      return {
        id: `custom-${Date.now()}`,
        description: 'Custom actions require AI mode to be enabled.',
        choices: [],
        source: 'error',
      }
    }

    const systemPrompt = this.promptBuilder.buildSystemPrompt(context)
    const userMessage = this.promptBuilder.buildUserMessage(actionText, context)

    // Log the full prompt for debugging
    debugLog.prompt(systemPrompt, userMessage, {
      ...context,
      turn: context.history?.length || 0,
    })

    const response = await this.nanoGPTClient.streamChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      onChunk
    )

    if (response.error) {
      return {
        id: `error-${Date.now()}`,
        description: 'Failed to generate content. Please try again.',
        choices: [],
        source: 'error',
      }
    }

    return this._parseAIResponse(response.content)
  }

  /**
   * Generate AI content for a scene
   * @param {string} sceneId - Scene identifier for context
   * @param {Object} context - Current game context
   * @returns {Promise<Object>}
   */
  async _generateScene(sceneId, context) {
    const prompt = `Continue the scene. Scene ID: ${sceneId}`
    return this.generateFromAction(prompt, context)
  }

  /**
   * Format JSON scene to standard structure
   * @param {Object} scene - Raw scene data
   * @param {string} source - Content source
   * @returns {Object}
   */
  _formatScene(scene, source = 'json') {
    return {
      id: scene.id,
      location: scene.location || null,
      npc: scene.npc || null,
      npcEmotion: scene.npcEmotion || 'neutral',
      bodyPart: scene.bodyPart || null,
      description: scene.description || '',
      choices: scene.choices || [],
      rollRequired: scene.rollRequired || null,
      eventTrigger: scene.eventRoll || false,
      statChanges: scene.statChanges || {},
      affinityChanges: scene.affinityChanges || {},
      source,
    }
  }

  /**
   * Parse AI response into scene structure
   * @param {string} content - Raw AI response
   * @returns {Object}
   */
  _parseAIResponse(content) {
    const parsed = this.promptBuilder.parseAIResponse(content)
    return {
      ...parsed,
      source: 'ai',
    }
  }

  /**
   * Generate hybrid choices by combining engine-generated and AI choices
   * @param {Object} context - Current game context
   * @param {Array} aiChoices - Choices from AI response (optional)
   * @param {string} sceneDescription - Scene description for context detection
   * @returns {Object} - { available: [], locked: [], sceneContext: string }
   */
  generateHybridChoices(context, aiChoices = [], sceneDescription = '') {
    const settings = settingsService.getAll()
    const choiceBalance = settings.choiceBalance ?? 50
    
    // If balance is 100% AI, skip engine generation entirely
    if (choiceBalance === 100) {
      return {
        available: (aiChoices || []).map((choice, index) => ({
          ...choice,
          id: choice.id || `ai-${index + 1}`,
          isAIGenerated: true,
          archetype: this.choiceGenerator._inferArchetype(choice),
        })),
        locked: [],
        sceneContext: this.choiceGenerator.detectSceneContext(context, sceneDescription),
      }
    }
    
    // Generate engine choices with scene context awareness
    const { available: engineChoices, locked, sceneContext, engineCount, aiCount } = 
      this.choiceGenerator.generate(context, sceneDescription)

    // If balance is 0% AI, return only engine choices
    if (choiceBalance === 0 || aiCount === 0) {
      return {
        available: engineChoices,
        locked,
        sceneContext,
      }
    }

    // Merge with AI wild cards
    const merged = this.choiceGenerator.mergeWithAIChoices(engineChoices, aiChoices, aiCount)

    return {
      available: merged,
      locked,
      sceneContext,
    }
  }

  /**
   * Enable or disable hybrid choice system
   * @param {boolean} enabled
   */
  setHybridChoices(enabled) {
    this.useHybridChoices = enabled
  }
}

export default ContentRouter
