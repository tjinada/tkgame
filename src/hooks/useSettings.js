import { useState, useEffect, useCallback } from 'react'
import { settingsService } from '../services/SettingsService'

/**
 * Hook for managing settings
 * @returns {Object} Settings state and methods
 */
export function useSettings() {
  const [settings, setSettings] = useState(settingsService.getAll())

  // Subscribe to settings changes
  useEffect(() => {
    const unsubscribe = settingsService.subscribe((newSettings) => {
      setSettings({ ...newSettings })
    })
    return unsubscribe
  }, [])

  // Update a single setting
  const updateSetting = useCallback((key, value) => {
    settingsService.set(key, value)
  }, [])

  // Update multiple settings
  const updateSettings = useCallback((updates) => {
    settingsService.update(updates)
  }, [])

  // Reset a category
  const resetCategory = useCallback(async (category) => {
    await settingsService.resetCategory(category)
  }, [])

  // Reset all settings
  const resetAll = useCallback(() => {
    settingsService.resetAll()
  }, [])

  // Export settings as JSON string
  const exportSettings = useCallback(() => {
    return settingsService.export()
  }, [])

  // Import settings from JSON string
  const importSettings = useCallback((json) => {
    return settingsService.import(json)
  }, [])

  return {
    settings,
    updateSetting,
    updateSettings,
    resetCategory,
    resetAll,
    exportSettings,
    importSettings,
  }
}

export default useSettings
