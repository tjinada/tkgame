const SETTINGS_KEY = 'fd-settings'

const defaultSettings = {
  // API Settings
  apiKey: '',
  baseUrl: 'https://nano-gpt.com/api/v1',
  model: 'chatgpt-4o-latest',
  
  // Content Settings
  contentMode: 'hybrid', // 'json-only', 'ai-only', 'hybrid'
  contextMode: 'last-n-turns', // 'full-chapter', 'last-n-turns', 'token-budget'
  contextLimit: 10,
  streamResponses: true,
  
  // Visual Settings
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
    this.settings = this._load()
    this.listeners = []
  }

  /**
   * Get all settings
   */
  getAll() {
    return { ...this.settings }
  }

  /**
   * Get a specific setting
   */
  get(key) {
    return this.settings[key]
  }

  /**
   * Set a specific setting
   */
  set(key, value) {
    this.settings[key] = value
    this._save()
    this._notify()
  }

  /**
   * Update multiple settings at once
   */
  update(updates) {
    this.settings = { ...this.settings, ...updates }
    this._save()
    this._notify()
  }

  /**
   * Reset to defaults
   */
  reset() {
    this.settings = { ...defaultSettings }
    this._save()
    this._notify()
  }

  /**
   * Reset a specific category
   */
  resetCategory(category) {
    const categoryKeys = {
      api: ['apiKey', 'baseUrl', 'model'],
      content: ['contentMode', 'contextMode', 'contextLimit', 'streamResponses'],
      visual: ['enableBackgrounds', 'enablePortraits', 'enableDiceAnimation', 'enableEffects'],
      slideshow: ['enableSlideshow', 'slideshowInterval', 'slideshowTransition', 'slideshowTransitionDuration', 'slideshowShuffle'],
      debug: ['debugOverlay', 'logApiCalls', 'logDiceRolls'],
    }

    const keys = categoryKeys[category] || []
    for (const key of keys) {
      this.settings[key] = defaultSettings[key]
    }
    this._save()
    this._notify()
  }

  /**
   * Subscribe to changes
   */
  subscribe(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
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
      const imported = JSON.parse(json)
      this.settings = { ...defaultSettings, ...imported }
      this._save()
      this._notify()
      return true
    } catch (e) {
      console.error('Failed to import settings:', e)
      return false
    }
  }

  _load() {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) }
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
    return { ...defaultSettings }
  }

  _save() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings))
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }

  _notify() {
    for (const callback of this.listeners) {
      try {
        callback(this.settings)
      } catch (e) {
        console.error('Error in settings listener:', e)
      }
    }
  }
}

export const settingsService = new SettingsService()
export default settingsService
