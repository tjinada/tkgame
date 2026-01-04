/**
 * ScenarioService.js
 * Manages game scenario configurations (save/load game setups)
 */

import scenariosData from '../data/scenarios.json';
import gameRulesData from '../data/gameRules.json';
import { slaveProfileService } from './SlaveProfileService';
import { npcProfileService } from './NpcProfileService';

const STORAGE_KEY = 'fd_scenarios';

class ScenarioService {
  constructor() {
    this.defaultScenarios = scenariosData.scenarios;
    this.customScenarios = this._loadCustomScenarios();
    this.gameRulesDefaults = gameRulesData.defaults;
    this.difficultyPresets = gameRulesData.difficultyPresets;
  }

  /**
   * Get all default scenarios
   * @returns {Array}
   */
  getDefaultScenarios() {
    return this.defaultScenarios;
  }

  /**
   * Get all custom scenarios
   * @returns {Array}
   */
  getCustomScenarios() {
    return this.customScenarios;
  }

  /**
   * Get all scenarios (default + custom)
   * @returns {Object}
   */
  getAllScenarios() {
    return {
      default: this.defaultScenarios,
      custom: this.customScenarios
    };
  }

  /**
   * Get all scenarios as flat array
   * @returns {Array}
   */
  getAllScenariosFlat() {
    return [...this.defaultScenarios, ...this.customScenarios];
  }

  /**
   * Get favorite scenarios
   * @returns {Array}
   */
  getFavoriteScenarios() {
    return this.getAllScenariosFlat().filter(s => s.isFavorite);
  }

  /**
   * Get scenario by ID
   * @param {string} scenarioId 
   * @returns {Object|null}
   */
  getScenario(scenarioId) {
    return this.defaultScenarios.find(s => s.id === scenarioId) ||
           this.customScenarios.find(s => s.id === scenarioId) ||
           null;
  }

  /**
   * Create a new custom scenario
   * @param {Object} scenarioData 
   * @returns {Object} Created scenario
   */
  createScenario(scenarioData) {
    const scenario = {
      ...scenarioData,
      id: scenarioData.id || this._generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false
    };

    this.customScenarios.push(scenario);
    this._saveCustomScenarios();
    
    return scenario;
  }

  /**
   * Update an existing custom scenario
   * @param {string} scenarioId 
   * @param {Object} updates 
   * @returns {Object|null}
   */
  updateScenario(scenarioId, updates) {
    const index = this.customScenarios.findIndex(s => s.id === scenarioId);
    if (index === -1) {
      return null;
    }

    this.customScenarios[index] = {
      ...this.customScenarios[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this._saveCustomScenarios();
    return this.customScenarios[index];
  }

  /**
   * Delete a custom scenario
   * @param {string} scenarioId 
   * @returns {boolean}
   */
  deleteScenario(scenarioId) {
    const index = this.customScenarios.findIndex(s => s.id === scenarioId);
    if (index === -1) {
      return false;
    }

    this.customScenarios.splice(index, 1);
    this._saveCustomScenarios();
    return true;
  }

  /**
   * Toggle favorite status
   * @param {string} scenarioId 
   * @returns {boolean} New favorite status
   */
  toggleFavorite(scenarioId) {
    // Check custom scenarios first
    const customIndex = this.customScenarios.findIndex(s => s.id === scenarioId);
    if (customIndex !== -1) {
      this.customScenarios[customIndex].isFavorite = !this.customScenarios[customIndex].isFavorite;
      this._saveCustomScenarios();
      return this.customScenarios[customIndex].isFavorite;
    }

    // For default scenarios, store favorite status separately
    const favorites = this._loadFavorites();
    if (favorites.includes(scenarioId)) {
      favorites.splice(favorites.indexOf(scenarioId), 1);
    } else {
      favorites.push(scenarioId);
    }
    this._saveFavorites(favorites);
    
    return favorites.includes(scenarioId);
  }

  /**
   * Build a complete game configuration from a scenario
   * @param {string} scenarioId 
   * @returns {Object} Complete game config
   */
  buildGameConfig(scenarioId) {
    const scenario = this.getScenario(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    return this.buildGameConfigFromData(scenario);
  }

  /**
   * Build game config from scenario data (for custom setups)
   * @param {Object} scenarioData 
   * @returns {Object}
   */
  buildGameConfigFromData(scenarioData) {
    // Resolve slave profile
    const slaveProfile = slaveProfileService.getProfile(
      scenarioData.slave.profileId,
      scenarioData.slave.profileType || 'preset'
    );
    
    if (!slaveProfile) {
      throw new Error(`Slave profile not found: ${scenarioData.slave.profileId}`);
    }

    // Apply any overrides
    const resolvedSlave = slaveProfileService.applyOverrides(
      slaveProfile,
      scenarioData.slave.overrides || {}
    );

    // Resolve NPC profiles
    const resolvedNpcs = [];
    for (const npcRef of scenarioData.npcs) {
      const npc = npcProfileService.getNpc(npcRef.profileId);
      if (!npc) {
        throw new Error(`NPC not found: ${npcRef.profileId}`);
      }
      resolvedNpcs.push({
        ...npc,
        required: npcRef.required || false
      });
    }

    // Resolve rules (merge with defaults)
    const resolvedRules = this._mergeRules(
      this.gameRulesDefaults,
      scenarioData.rules || {}
    );

    // Apply difficulty preset if specified
    if (scenarioData.rules?.difficulty) {
      const preset = this.difficultyPresets[scenarioData.rules.difficulty];
      if (preset) {
        Object.assign(resolvedRules, this._mergeRules(resolvedRules, preset.settings));
      }
    }

    return {
      scenario: {
        id: scenarioData.id,
        name: scenarioData.name,
        description: scenarioData.description
      },
      slave: resolvedSlave,
      npcs: resolvedNpcs,
      npcIds: resolvedNpcs.map(n => n.id),
      rules: resolvedRules
    };
  }

  /**
   * Create a scenario from current game setup
   * @param {Object} gameConfig 
   * @param {string} name 
   * @param {string} description 
   * @returns {Object}
   */
  createFromGameConfig(gameConfig, name, description = '') {
    const scenarioData = {
      name,
      description,
      slave: {
        profileId: gameConfig.slave.id,
        profileType: gameConfig.slave.isCustom ? 'custom' : 'preset',
        overrides: {}
      },
      npcs: gameConfig.npcs.map(npc => ({
        profileId: npc.id,
        required: npc.isRequired || false
      })),
      rules: gameConfig.rules,
      tags: []
    };

    return this.createScenario(scenarioData);
  }

  /**
   * Get default game rules
   * @returns {Object}
   */
  getDefaultRules() {
    return JSON.parse(JSON.stringify(this.gameRulesDefaults));
  }

  /**
   * Get difficulty presets
   * @returns {Object}
   */
  getDifficultyPresets() {
    return this.difficultyPresets;
  }

  /**
   * Get rules for a difficulty preset
   * @param {string} presetId 
   * @returns {Object}
   */
  getRulesForDifficulty(presetId) {
    const preset = this.difficultyPresets[presetId];
    if (!preset) {
      return this.gameRulesDefaults;
    }
    return this._mergeRules(this.gameRulesDefaults, preset.settings);
  }

  /**
   * Validate a scenario structure
   * @param {Object} scenario 
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validateScenario(scenario) {
    const errors = [];

    if (!scenario.name || scenario.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!scenario.slave?.profileId) {
      errors.push('Slave profile is required');
    }

    if (!scenario.npcs || scenario.npcs.length === 0) {
      errors.push('At least one NPC is required');
    }

    // Check that Sandy is included
    const hasSandy = scenario.npcs?.some(n => n.profileId === 'sandy');
    if (!hasSandy) {
      errors.push('Sandy (Head Mistress) is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Export scenario as JSON
   * @param {string} scenarioId 
   * @returns {string}
   */
  exportScenario(scenarioId) {
    const scenario = this.getScenario(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }
    return JSON.stringify(scenario, null, 2);
  }

  /**
   * Import scenario from JSON
   * @param {string} jsonString 
   * @returns {Object}
   */
  importScenario(jsonString) {
    const scenario = JSON.parse(jsonString);
    const validation = this.validateScenario(scenario);
    
    if (!validation.valid) {
      throw new Error(`Invalid scenario: ${validation.errors.join(', ')}`);
    }

    scenario.id = this._generateId();
    scenario.name = scenario.name + ' (Imported)';
    scenario.isDefault = false;
    
    return this.createScenario(scenario);
  }

  /**
   * Get scenarios by tag
   * @param {string} tag 
   * @returns {Array}
   */
  getScenariosByTag(tag) {
    return this.getAllScenariosFlat().filter(s => s.tags?.includes(tag));
  }

  /**
   * Get all unique tags
   * @returns {Array}
   */
  getAllTags() {
    const tags = new Set();
    for (const scenario of this.getAllScenariosFlat()) {
      for (const tag of scenario.tags || []) {
        tags.add(tag);
      }
    }
    return Array.from(tags).sort();
  }

  // Private methods

  _mergeRules(base, override) {
    const merged = JSON.parse(JSON.stringify(base));
    
    for (const [key, value] of Object.entries(override)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        merged[key] = this._mergeRules(merged[key] || {}, value);
      } else {
        merged[key] = value;
      }
    }
    
    return merged;
  }

  _loadCustomScenarios() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load custom scenarios:', e);
      return [];
    }
  }

  _saveCustomScenarios() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.customScenarios));
    } catch (e) {
      console.error('Failed to save custom scenarios:', e);
    }
  }

  _loadFavorites() {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_favorites`);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  _saveFavorites(favorites) {
    try {
      localStorage.setItem(`${STORAGE_KEY}_favorites`, JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  }

  _generateId() {
    return `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const scenarioService = new ScenarioService();
export default scenarioService;
