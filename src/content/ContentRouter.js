import { ScenarioLoader } from './ScenarioLoader'
import { NanoGPTClient } from './NanoGPTClient'
import { PromptBuilder } from './PromptBuilder'

export class ContentRouter {
  constructor(options = {}) {
    this.scenarioLoader = options.scenarioLoader || new ScenarioLoader()
    this.nanoGPTClient = options.nanoGPTClient || new NanoGPTClient()
    this.promptBuilder = options.promptBuilder || new PromptBuilder()
    
    // Modes: 'json-only', 'ai-only', 'hybrid'
    this.mode = options.mode || 'hybrid'
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
}

export default ContentRouter
