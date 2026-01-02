const SCENARIO_SCHEMA_VERSION = '1.0'

export class ScenarioLoader {
  constructor() {
    this.scenarios = new Map()
    this.sceneIndex = new Map()
  }

  /**
   * Load a scenario from a parsed JSON object
   * @param {Object} data - Parsed scenario data
   * @returns {ValidationResult}
   */
  loadScenario(data) {
    const validation = this.validateScenario(data)
    
    if (!validation.valid) {
      console.error('Scenario validation failed:', validation.errors)
      return validation
    }

    // Store the scenario
    this.scenarios.set(data.id, data)

    // Index all scenes for quick lookup
    for (const scene of data.scenes) {
      this.sceneIndex.set(scene.id, {
        scenarioId: data.id,
        scene,
      })
    }

    console.log(`Loaded scenario: ${data.name} (${data.scenes.length} scenes)`)
    return validation
  }

  /**
   * Load a scenario from a File object
   * @param {File} file - The file to load
   * @returns {Promise<ValidationResult>}
   */
  async loadFromFile(file) {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      return this.loadScenario(data)
    } catch (err) {
      console.error('Failed to load scenario file:', err)
      return { valid: false, errors: [`Failed to parse file: ${err.message}`] }
    }
  }

  /**
   * Load a scenario from a URL
   * @param {string} url - The URL to fetch
   * @returns {Promise<ValidationResult>}
   */
  async loadFromUrl(url) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      return this.loadScenario(data)
    } catch (err) {
      console.error('Failed to load scenario from URL:', err)
      return { valid: false, errors: [`Failed to fetch: ${err.message}`] }
    }
  }

  /**
   * Validate a scenario object against the schema
   * @param {Object} data - The scenario data to validate
   * @returns {ValidationResult}
   */
  validateScenario(data) {
    const errors = []

    // Required top-level fields
    if (!data.id) errors.push('Missing required field: id')
    if (!data.name) errors.push('Missing required field: name')
    if (!Array.isArray(data.scenes)) errors.push('Missing or invalid field: scenes')

    if (errors.length > 0) {
      return { valid: false, errors }
    }

    // Validate each scene
    for (let i = 0; i < data.scenes.length; i++) {
      const scene = data.scenes[i]
      const prefix = `Scene ${i}`

      if (!scene.id) errors.push(`${prefix}: Missing id`)
      if (!scene.description) errors.push(`${prefix}: Missing description`)
      if (!Array.isArray(scene.choices)) errors.push(`${prefix}: Missing or invalid choices`)

      // Validate choices
      if (Array.isArray(scene.choices)) {
        for (let j = 0; j < scene.choices.length; j++) {
          const choice = scene.choices[j]
          if (!choice.id) errors.push(`${prefix}, Choice ${j}: Missing id`)
          if (!choice.text) errors.push(`${prefix}, Choice ${j}: Missing text`)
        }
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Get a scene by ID
   * @param {string} sceneId - The scene ID
   * @returns {SceneNode|null}
   */
  getScene(sceneId) {
    const entry = this.sceneIndex.get(sceneId)
    return entry?.scene || null
  }

  /**
   * Check if a scene exists
   * @param {string} sceneId - The scene ID
   * @returns {boolean}
   */
  hasScene(sceneId) {
    return this.sceneIndex.has(sceneId)
  }

  /**
   * Get all scenes for a specific location
   * @param {string} location - The location name
   * @returns {SceneNode[]}
   */
  getScenesByLocation(location) {
    const scenes = []
    for (const { scene } of this.sceneIndex.values()) {
      if (scene.location === location) {
        scenes.push(scene)
      }
    }
    return scenes
  }

  /**
   * Get all scenes featuring a specific NPC
   * @param {string} npcId - The NPC ID
   * @returns {SceneNode[]}
   */
  getScenesByNpc(npcId) {
    const scenes = []
    for (const { scene } of this.sceneIndex.values()) {
      if (scene.npc === npcId) {
        scenes.push(scene)
      }
    }
    return scenes
  }

  /**
   * Get the starting scene for a scenario
   * @param {string} scenarioId - The scenario ID
   * @returns {SceneNode|null}
   */
  getStartingScene(scenarioId) {
    const scenario = this.scenarios.get(scenarioId)
    if (!scenario || scenario.scenes.length === 0) return null
    
    // Return scene marked as start, or first scene
    return scenario.scenes.find(s => s.isStart) || scenario.scenes[0]
  }

  /**
   * List all loaded scenarios
   * @returns {string[]}
   */
  listLoadedScenarios() {
    return Array.from(this.scenarios.keys())
  }

  /**
   * Get scenario metadata
   * @param {string} scenarioId - The scenario ID
   * @returns {Object|null}
   */
  getScenarioMetadata(scenarioId) {
    const scenario = this.scenarios.get(scenarioId)
    if (!scenario) return null

    return {
      id: scenario.id,
      name: scenario.name,
      chapter: scenario.chapter,
      sceneCount: scenario.scenes.length,
    }
  }

  /**
   * Unload a scenario
   * @param {string} scenarioId - The scenario ID to unload
   */
  unloadScenario(scenarioId) {
    const scenario = this.scenarios.get(scenarioId)
    if (!scenario) return

    // Remove from scene index
    for (const scene of scenario.scenes) {
      this.sceneIndex.delete(scene.id)
    }

    // Remove scenario
    this.scenarios.delete(scenarioId)
    console.log(`Unloaded scenario: ${scenarioId}`)
  }

  /**
   * Clear all loaded scenarios
   */
  clearAll() {
    this.scenarios.clear()
    this.sceneIndex.clear()
  }
}

export default ScenarioLoader
