import { apiClient } from './ApiClient.js'

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
    this.settings = { ...defaultSettings }
    this.listeners = []
    this.initialized = false
  }

  /**
   * Initialize settings from server
   */
  async init() {
    if (this.initialized) return
    
    try {
      const serverSettings = await apiClient.get('/api/config/settings')
      this.settings = { ...defaultSettings, ...serverSettings }
      this.initialized = true
    } catch (error) {
      console.error('Failed to load settings from server:', error)
      // Fall back to local storage
      this._loadFromLocalStorage()
      this.initialized = true
    }
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
  async set(key, value) {
    this.settings[key] = value
    this._saveToLocalStorage() // Save locally for fast access
    this._notify()
    
    // Sync to server
    try {
      await apiClient.put('/api/config/settings', { key, value })
    } catch (error) {
      console.error('Failed to sync setting to server:', error)
    }
  }

  /**
   * Update multiple settings at once
   */
  async update(updates) {
    this.settings = { ...this.settings, ...updates }
    this._saveToLocalStorage()
    this._notify()
    
    // Sync to server
    try {
      await apiClient.put('/api/config/settings', updates)
    } catch (error) {
      console.error('Failed to sync settings to server:', error)
    }
  }

  /**
   * Reset to defaults
   */
  async reset() {
    this.settings = { ...defaultSettings }
    this._saveToLocalStorage()
    this._notify()
    
    // Sync to server
    try {
      await apiClient.put('/api/config/settings', defaultSettings)
    } catch (error) {
      console.error('Failed to reset settings on server:', error)
    }
  }

  /**
   * Reset a specific category
   */
  async resetCategory(category) {
    const categoryKeys = {
      api: ['apiKey', 'baseUrl', 'model'],
      content: ['contentMode', 'contextMode', 'contextLimit', 'streamResponses'],
      visual: ['enableBackgrounds', 'enablePortraits', 'enableDiceAnimation', 'enableEffects'],
      slideshow: ['enableSlideshow', 'slideshowInterval', 'slideshowTransition', 'slideshowTransitionDuration', 'slideshowShuffle'],
      debug: ['debugOverlay', 'logApiCalls', 'logDiceRolls'],
    }

    const keys = categoryKeys[category] || []
    const updates = {}
    
    for (const key of keys) {
      this.settings[key] = defaultSettings[key]
      updates[key] = defaultSettings[key]
    }
    
    this._saveToLocalStorage()
    this._notify()
    
    // Sync to server
    try {
      await apiClient.put('/api/config/settings', updates)
    } catch (error) {
      console.error('Failed to reset category on server:', error)
    }
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
  async import(json) {
    try {
      const imported = JSON.parse(json)
      this.settings = { ...defaultSettings, ...imported }
      this._saveToLocalStorage()
      this._notify()
      
      // Sync to server
      await apiClient.put('/api/config/settings', this.settings)
      return true
    } catch (e) {
      console.error('Failed to import settings:', e)
      return false
    }
  }

  _loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) {
        this.settings = { ...defaultSettings, ...JSON.parse(stored) }
      }
    } catch (e) {
      console.error('Failed to load settings from localStorage:', e)
    }
  }

  _saveToLocalStorage() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings))
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e)
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
