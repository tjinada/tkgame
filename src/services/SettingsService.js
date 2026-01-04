const STORAGE_KEY = 'fd-settings'

const defaultSettings = {
  // API Settings
  apiKey: '',
  baseUrl: 'https://nano-gpt.com/api/v1',
  model: 'chatgpt-4o-latest',
  
  // Content Settings
  contentMode: 'hybrid', // 'json-only', 'ai-only', 'hybrid'
  contextMode: 'last-n-turns', // 'full-chapter', 'last-n-turns', 'token-budget'
  contextLimit: 6, // Number of turns of history to send to AI
  aiHistoryTurns: 6, // Alias for contextLimit, more descriptive
  streamResponses: true,
  
  // ===================
  // AI BEHAVIOR SETTINGS
  // ===================
  
  // -- Basic Style --
  aiHumiliationLevel: 'moderate', // 'none', 'mild', 'moderate', 'heavy', 'extreme'
  aiSwearingLevel: 'moderate', // 'none', 'mild', 'moderate', 'heavy'
  aiResponseLength: 'medium', // 'short', 'medium', 'long'
  aiConversationalStyle: 'balanced', // 'narrative', 'balanced', 'conversational'
  aiIntensity: 'moderate', // 'gentle', 'moderate', 'intense', 'brutal'
  aiFetishFocus: [], // array of: 'tickling', 'feet', 'sweat', 'edging', 'pot', 'bondage', 'verbal'
  
  // -- Narrative Style --
  aiPov: 'sandy-first', // 'sandy-first', 'narrator-third'
  aiTense: 'present', // 'present', 'past'
  aiProseStyle: 'balanced', // 'poetic', 'balanced', 'direct'
  aiDetailLevel: 'moderate', // 'minimal', 'moderate', 'vivid'
  
  // -- Scene Pacing --
  aiPacing: 'moderate', // 'slow-burn', 'moderate', 'rapid'
  aiEscalation: 'gradual', // 'gradual', 'sudden'
  
  // -- Player Treatment --
  aiMercyFrequency: 'rare', // 'never', 'rare', 'occasional'
  aiPlayerNames: 'worm, slave, maggot, pathetic toy', // comma-separated
  aiResistanceSuccess: 'difficult', // 'hopeless', 'difficult', 'possible'
  aiPlayerVoice: 'reactive', // 'silent', 'reactive', 'vocal'
  
  // -- NPC Behavior --
  aiNpcMood: 'sadistic', // 'sadistic', 'playful', 'cold', 'random'
  aiCollaboration: 'solo', // 'solo', 'pairs', 'group-friendly'
  aiAffectionStyle: 'none', // 'none', 'twisted', 'possessive'
  aiMockeryStyle: 'cruel', // 'cruel', 'teasing', 'dismissive'
  
  // -- Content Balance (sliders 0-100) --
  aiPainVsPleasure: 70, // 0 = all pleasure, 100 = all pain
  aiPhysicalVsPsychological: 50, // 0 = all psychological, 100 = all physical
  aiActionVsDialogue: 50, // 0 = all dialogue, 100 = all action
  
  // -- Sensory Focus --
  aiSensoryFocus: ['touch', 'sound'], // 'touch', 'smell', 'taste', 'sound', 'sight'
  
  // -- Tickle Specifics --
  aiTickleTools: ['fingers', 'nails'], // 'fingers', 'feathers', 'brushes', 'electric', 'nails', 'tongue'
  aiTickleSpots: ['feet', 'ribs', 'armpits'], // 'feet', 'ribs', 'armpits', 'neck', 'thighs', 'stomach', 'sides', 'knees'
  
  // -- Foot Specifics --
  aiFootCondition: ['sweaty', 'barefoot'], // 'sweaty', 'clean', 'dirty', 'smelly'
  aiFootwear: ['heels', 'barefoot'], // 'heels', 'boots', 'flats', 'barefoot', 'stockings', 'socks'
  
  // -- Bondage --
  aiBondageLevel: 'light', // 'none', 'light', 'heavy', 'inescapable'
  
  // -- Choice Generation --
  choiceBalance: 50, // 0 = all engine, 100 = all AI (slider)
  engineChoiceMax: 4, // max engine-generated choices (1-6)
  aiChoiceMax: 4, // max AI-generated choices (1-6)
  totalChoiceMax: 6, // total max choices shown (3-8)
  
  // -- Game Mechanics --
  aiChoiceCount: 4, // 3, 4, 5 (legacy, now calculated from balance)
  aiRollDifficulty: 'normal', // 'easy', 'normal', 'hard', 'brutal'
  aiStatChangeRate: 'normal', // 'slow', 'normal', 'fast'
  aiEventFrequency: 'normal', // 'rare', 'normal', 'frequent'
  
  // -- Immersion --
  aiInnerThoughts: 'occasional', // 'none', 'occasional', 'frequent'
  aiEnvironmentalDetail: 'moderate', // 'minimal', 'moderate', 'rich'
  aiSoundDescriptions: true,
  aiTimeAwareness: false,
  
  // -- Advanced --
  aiCreativity: 0.8, // 0.1 to 1.0 (temperature)
  aiContinuity: 'moderate', // 'loose', 'moderate', 'strict'
  aiNpcConsistency: 'strict', // 'strict', 'flexible'
  aiSurpriseEvents: true,
  
  // -- Context System --
  enableRichContext: true, // Include progression/events in AI prompts
  
  // ===================
  // VISUAL SETTINGS
  // ===================
  enableBackgrounds: true,
  enablePortraits: true,
  enableDiceAnimation: true,
  enableEffects: true,
  
  // Slideshow Settings
  enableSlideshow: true,
  slideshowInterval: 10000,
  slideshowTransition: 'crossfade',
  slideshowTransitionDuration: 1500,
  slideshowShuffle: false,
  
  // Debug Settings
  debugOverlay: false,
  logApiCalls: true,
  logDiceRolls: true,
}

class SettingsService {
  constructor() {
    this.settings = { ...defaultSettings }
    this.listeners = []
    this.load()
  }

  /**
   * Load settings from localStorage
   */
  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults to handle new settings
        this.settings = { ...defaultSettings, ...parsed }
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
  }

  /**
   * Save settings to localStorage
   */
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings))
      this._notify()
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }

  /**
   * Get a single setting value
   */
  get(key) {
    return this.settings[key] ?? defaultSettings[key]
  }

  /**
   * Set a single setting value
   */
  set(key, value) {
    this.settings[key] = value
    this.save()
  }

  /**
   * Get all settings
   */
  getAll() {
    return { ...this.settings }
  }

  /**
   * Update multiple settings at once
   */
  update(updates) {
    this.settings = { ...this.settings, ...updates }
    this.save()
  }

  /**
   * Reset all settings to defaults
   */
  resetAll() {
    this.settings = { ...defaultSettings }
    this.save()
  }

  /**
   * Reset a category of settings
   */
  async resetCategory(category) {
    const categoryKeys = {
      api: ['apiKey', 'baseUrl', 'model'],
      content: ['contentMode', 'contextMode', 'contextLimit', 'streamResponses'],
      aiBasic: ['aiHumiliationLevel', 'aiSwearingLevel', 'aiResponseLength', 'aiConversationalStyle', 'aiIntensity', 'aiFetishFocus'],
      aiNarrative: ['aiPov', 'aiTense', 'aiProseStyle', 'aiDetailLevel', 'aiPacing', 'aiEscalation'],
      aiPlayer: ['aiMercyFrequency', 'aiPlayerNames', 'aiResistanceSuccess', 'aiPlayerVoice'],
      aiNpc: ['aiNpcMood', 'aiCollaboration', 'aiAffectionStyle', 'aiMockeryStyle'],
      aiBalance: ['aiPainVsPleasure', 'aiPhysicalVsPsychological', 'aiActionVsDialogue', 'aiSensoryFocus'],
      aiKinks: ['aiTickleTools', 'aiTickleSpots', 'aiFootCondition', 'aiFootwear', 'aiBondageLevel'],
      choiceGeneration: ['choiceBalance', 'engineChoiceMax', 'aiChoiceMax', 'totalChoiceMax'],
      aiMechanics: ['aiChoiceCount', 'aiRollDifficulty', 'aiStatChangeRate', 'aiEventFrequency'],
      aiImmersion: ['aiInnerThoughts', 'aiEnvironmentalDetail', 'aiSoundDescriptions', 'aiTimeAwareness'],
      aiAdvanced: ['aiCreativity', 'aiContinuity', 'aiNpcConsistency', 'aiSurpriseEvents'],
      visual: ['enableBackgrounds', 'enablePortraits', 'enableDiceAnimation', 'enableEffects'],
      slideshow: ['enableSlideshow', 'slideshowInterval', 'slideshowTransition', 'slideshowTransitionDuration', 'slideshowShuffle'],
      debug: ['debugOverlay', 'logApiCalls', 'logDiceRolls'],
    }

    const keys = categoryKeys[category]
    if (keys) {
      for (const key of keys) {
        this.settings[key] = defaultSettings[key]
      }
      this.save()
    }
  }

  /**
   * Subscribe to settings changes
   */
  subscribe(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback)
    }
  }

  /**
   * Notify all listeners of changes
   */
  _notify() {
    for (const callback of this.listeners) {
      try {
        callback(this.settings)
      } catch (e) {
        console.error('Settings listener error:', e)
      }
    }
  }

  /**
   * Export settings as JSON
   */
  export() {
    return JSON.stringify(this.settings, null, 2)
  }

  /**
   * Import settings from JSON
   */
  import(json) {
    try {
      const parsed = JSON.parse(json)
      this.settings = { ...defaultSettings, ...parsed }
      this.save()
      return true
    } catch (e) {
      console.error('Failed to import settings:', e)
      return false
    }
  }
}

// Singleton instance
export const settingsService = new SettingsService()

export default settingsService
