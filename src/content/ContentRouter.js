import { ScenarioLoader } from './ScenarioLoader'
import { NanoGPTClient } from './NanoGPTClient'
import { PromptBuilder } from './PromptBuilder'

export class ContentRouter {
  constructor(options = {}) {
    this.mode = options.mode || 'hybrid' // 'json-only', 'ai-only', 'hybrid'
    this.scenarioLoader = options.scenarioLoader || new ScenarioLoader()
    this.nanoGPTClient = options.nanoGPTClient || new NanoGPTClient()
    this.promptBuilder = options.promptBuilder || new PromptBuilder()
  }

  /**
   * Get content for a scene
   * @param {string} sceneId - The scene ID to load
   * @param {Object} context - Current game context
   * @returns {Promise<SceneContent>}
   */
  async getSceneContent(sceneId, context) {
    // Try JSON first in hybrid mode
    if (this.mode === 'json-only' || this.mode === 'hybrid') {
      const jsonScene = this.scenarioLoader.getScene(sceneId)
      if (jsonScene) {
        return this._formatJsonScene(jsonScene)
      }
    }

    // Fall back to AI if allowed
    if (this.mode === 'ai-only' || this.mode === 'hybrid') {
      return this._generateFromAI(`Load scene: ${sceneId}`, context)
    }

    // No content available
    console.error(`No content found for scene: ${sceneId}`)
    return this._getErrorContent('Scene not found')
  }

  /**
   * Get the next scene based on a choice
   * @param {string} choiceId - The choice that was made
   * @param {Object} currentScene - The current scene
   * @param {Object} context - Current game context
   * @returns {Promise<SceneContent>}
   */
  async getNextScene(choiceId, currentScene, context) {
    // Find the choice in the current scene
    const choice = currentScene.choices?.find(c => c.id === choiceId)
    
    if (choice?.next) {
      // Choice specifies a next scene
      return this.getSceneContent(choice.next, context)
    }

    // Generate continuation via AI
    if (this.mode === 'ai-only' || this.mode === 'hybrid') {
      const choiceText = choice?.text || choiceId
      return this._generateFromAI(choiceText, context)
    }

    return this._getErrorContent('No next scene available')
  }

  /**
   * Generate content from a freeform action
   * @param {string} actionText - The player's action
   * @param {Object} context - Current game context
   * @returns {Promise<SceneContent>}
   */
  async generateFromAction(actionText, context) {
    if (this.mode === 'json-only') {
      return this._getErrorContent('AI generation disabled in JSON-only mode')
    }

    return this._generateFromAI(actionText, context)
  }

  /**
   * Set the content mode
   * @param {string} mode - 'json-only', 'ai-only', or 'hybrid'
   */
  setMode(mode) {
    if (['json-only', 'ai-only', 'hybrid'].includes(mode)) {
      this.mode = mode
      console.log(`Content mode set to: ${mode}`)
    } else {
      console.error(`Invalid content mode: ${mode}`)
    }
  }

  /**
   * Get current mode
   * @returns {string}
   */
  getMode() {
    return this.mode
  }

  /**
   * Load a scenario into the router
   * @param {Object} scenarioData - The scenario JSON
   * @returns {ValidationResult}
   */
  loadScenario(scenarioData) {
    return this.scenarioLoader.loadScenario(scenarioData)
  }

  /**
   * Check if AI is available
   * @returns {boolean}
   */
  isAIAvailable() {
    return this.nanoGPTClient.isConfigured()
  }

  /**
   * Format a JSON scene into SceneContent
   * @param {Object} scene - The raw scene data
   * @returns {SceneContent}
   */
  _formatJsonScene(scene) {
    return {
      id: scene.id,
      location: scene.location || null,
      npc: scene.npc || null,
      npcEmotion: scene.npcEmotion || 'neutral',
      bodyPart: scene.bodyPart || null,
      description: scene.description,
      choices: scene.choices || [],
      statChanges: scene.statChanges || {},
      affinityChanges: scene.affinityChanges || {},
      rollRequired: scene.rollRequired || null,
      eventTrigger: scene.eventRoll || false,
      source: 'json',
    }
  }

  /**
   * Generate content via AI
   * @param {string} action - The action to respond to
   * @param {Object} context - Current game context
   * @returns {Promise<SceneContent>}
   */
  async _generateFromAI(action, context) {
    const systemPrompt = this.promptBuilder.buildSystemPrompt(context)
    const userMessage = this.promptBuilder.buildUserMessage(action, context)

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ]

    const response = await this.nanoGPTClient.chat(messages)

    if (response.error) {
      console.error('AI generation failed:', response.error)
      return this._getErrorContent(response.error)
    }

    return this.promptBuilder.parseAIResponse(response.content)
  }

  /**
   * Get error content placeholder
   * @param {string} message - Error message
   * @returns {SceneContent}
   */
  _getErrorContent(message) {
    return {
      id: `error-${Date.now()}`,
      description: `[Error: ${message}]`,
      npcEmotion: 'neutral',
      choices: [
        { id: 'retry', text: 'Try again', type: 'custom' }
      ],
      statChanges: {},
      affinityChanges: {},
      source: 'error',
    }
  }
}

export default ContentRouter
