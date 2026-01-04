/**
 * useScenarios.js
 * Hook for managing scenarios
 */

import { useState, useCallback, useMemo } from 'react';
import { scenarioService } from '../services/ScenarioService';

export function useScenarios() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh
  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // Get all scenarios
  const { default: defaultScenarios, custom: customScenarios } = useMemo(
    () => scenarioService.getAllScenarios(),
    [refreshKey]
  );

  const allScenarios = useMemo(
    () => [...defaultScenarios, ...customScenarios],
    [defaultScenarios, customScenarios]
  );

  // Get favorites
  const favorites = useMemo(
    () => scenarioService.getFavoriteScenarios(),
    [refreshKey]
  );

  // Get all tags
  const allTags = useMemo(
    () => scenarioService.getAllTags(),
    [refreshKey]
  );

  // Get difficulty presets
  const difficultyPresets = useMemo(
    () => scenarioService.getDifficultyPresets(),
    []
  );

  // CRUD operations
  const createScenario = useCallback((scenarioData) => {
    const result = scenarioService.createScenario(scenarioData);
    refresh();
    return result;
  }, [refresh]);

  const updateScenario = useCallback((scenarioId, updates) => {
    const result = scenarioService.updateScenario(scenarioId, updates);
    refresh();
    return result;
  }, [refresh]);

  const deleteScenario = useCallback((scenarioId) => {
    scenarioService.deleteScenario(scenarioId);
    refresh();
  }, [refresh]);

  const toggleFavorite = useCallback((scenarioId) => {
    scenarioService.toggleFavorite(scenarioId);
    refresh();
  }, [refresh]);

  // Build game config
  const buildGameConfig = useCallback((scenarioId) => {
    return scenarioService.buildGameConfig(scenarioId);
  }, []);

  const buildGameConfigFromData = useCallback((scenarioData) => {
    return scenarioService.buildGameConfigFromData(scenarioData);
  }, []);

  // Save current game as scenario
  const saveAsScenario = useCallback((gameConfig, name, description) => {
    const result = scenarioService.createFromGameConfig(gameConfig, name, description);
    refresh();
    return result;
  }, [refresh]);

  // Import/Export
  const exportScenario = useCallback((scenarioId) => {
    return scenarioService.exportScenario(scenarioId);
  }, []);

  const importScenario = useCallback((jsonString) => {
    const result = scenarioService.importScenario(jsonString);
    refresh();
    return result;
  }, [refresh]);

  // Filter by tag
  const getByTag = useCallback((tag) => {
    return scenarioService.getScenariosByTag(tag);
  }, [refreshKey]);

  // Get rules for difficulty
  const getRulesForDifficulty = useCallback((presetId) => {
    return scenarioService.getRulesForDifficulty(presetId);
  }, []);

  return {
    // Data
    defaultScenarios,
    customScenarios,
    allScenarios,
    favorites,
    allTags,
    difficultyPresets,
    
    // Actions
    createScenario,
    updateScenario,
    deleteScenario,
    toggleFavorite,
    buildGameConfig,
    buildGameConfigFromData,
    saveAsScenario,
    exportScenario,
    importScenario,
    getByTag,
    getRulesForDifficulty,
    refresh
  };
}

export default useScenarios;
