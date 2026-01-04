/**
 * SlaveProfileService.js
 * Manages slave profiles (presets and custom)
 */

import slavePresets from '../data/slavePresets.json';
import slaveProfiles from '../data/slaveProfiles.json';

const STORAGE_KEY = 'fd_slave_profiles';

class SlaveProfileService {
  constructor() {
    this.presets = slavePresets.presets;
    this.traitDefinitions = slavePresets.traitDefinitions;
    this.customProfiles = this._loadCustomProfiles();
  }

  /**
   * Get all available presets
   * @returns {Array}
   */
  getPresets() {
    return this.presets;
  }

  /**
   * Get a specific preset by ID
   * @param {string} presetId 
   * @returns {Object|null}
   */
  getPreset(presetId) {
    return this.presets.find(p => p.id === presetId) || null;
  }

  /**
   * Get all custom profiles
   * @returns {Array}
   */
  getCustomProfiles() {
    return this.customProfiles;
  }

  /**
   * Get a specific custom profile by ID
   * @param {string} profileId 
   * @returns {Object|null}
   */
  getCustomProfile(profileId) {
    return this.customProfiles.find(p => p.id === profileId) || null;
  }

  /**
   * Get any profile (preset or custom) by ID
   * @param {string} profileId 
   * @param {string} profileType - 'preset' or 'custom'
   * @returns {Object|null}
   */
  getProfile(profileId, profileType = 'preset') {
    if (profileType === 'preset') {
      return this.getPreset(profileId);
    }
    return this.getCustomProfile(profileId);
  }

  /**
   * Get all profiles (presets + custom)
   * @returns {Object}
   */
  getAllProfiles() {
    return {
      presets: this.presets,
      custom: this.customProfiles
    };
  }

  /**
   * Create a new custom profile
   * @param {Object} profileData 
   * @returns {Object} Created profile
   */
  createProfile(profileData) {
    const profile = {
      ...profileData,
      id: profileData.id || this._generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCustom: true
    };

    this.customProfiles.push(profile);
    this._saveCustomProfiles();
    
    return profile;
  }

  /**
   * Update an existing custom profile
   * @param {string} profileId 
   * @param {Object} updates 
   * @returns {Object|null} Updated profile
   */
  updateProfile(profileId, updates) {
    const index = this.customProfiles.findIndex(p => p.id === profileId);
    if (index === -1) {
      return null;
    }

    this.customProfiles[index] = {
      ...this.customProfiles[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this._saveCustomProfiles();
    return this.customProfiles[index];
  }

  /**
   * Delete a custom profile
   * @param {string} profileId 
   * @returns {boolean}
   */
  deleteProfile(profileId) {
    const index = this.customProfiles.findIndex(p => p.id === profileId);
    if (index === -1) {
      return false;
    }

    this.customProfiles.splice(index, 1);
    this._saveCustomProfiles();
    return true;
  }

  /**
   * Clone a profile (preset or custom) as a new custom profile
   * @param {string} sourceId 
   * @param {string} sourceType 
   * @param {string} newName 
   * @returns {Object} New profile
   */
  cloneProfile(sourceId, sourceType, newName) {
    const source = this.getProfile(sourceId, sourceType);
    if (!source) {
      throw new Error(`Profile not found: ${sourceId}`);
    }

    const cloned = {
      ...JSON.parse(JSON.stringify(source)),
      id: this._generateId(),
      name: newName || `${source.name} (Copy)`,
      isDefault: false
    };

    return this.createProfile(cloned);
  }

  /**
   * Apply overrides to a profile (for game setup)
   * @param {Object} baseProfile 
   * @param {Object} overrides 
   * @returns {Object} Merged profile
   */
  applyOverrides(baseProfile, overrides = {}) {
    const merged = JSON.parse(JSON.stringify(baseProfile));

    // Apply base stat overrides
    if (overrides.baseStats) {
      merged.baseStats = { ...merged.baseStats, ...overrides.baseStats };
    }

    // Apply name override
    if (overrides.name) {
      merged.name = overrides.name;
    }

    // Apply trait overrides
    if (overrides.traits) {
      merged.traits = overrides.traits;
    }

    // Apply vulnerability matrix overrides (deep merge)
    if (overrides.vulnerabilityMatrix) {
      for (const [activityId, bodyParts] of Object.entries(overrides.vulnerabilityMatrix)) {
        if (!merged.vulnerabilityMatrix[activityId]) {
          merged.vulnerabilityMatrix[activityId] = {};
        }
        merged.vulnerabilityMatrix[activityId] = {
          ...merged.vulnerabilityMatrix[activityId],
          ...bodyParts
        };
      }
    }

    return merged;
  }

  /**
   * Get trait definitions
   * @returns {Array}
   */
  getTraitDefinitions() {
    return this.traitDefinitions;
  }

  /**
   * Get trait by ID
   * @param {string} traitId 
   * @returns {Object|null}
   */
  getTrait(traitId) {
    return this.traitDefinitions.find(t => t.id === traitId) || null;
  }

  /**
   * Validate a profile structure
   * @param {Object} profile 
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validateProfile(profile) {
    const errors = [];

    if (!profile.name || profile.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!profile.baseStats) {
      errors.push('Base stats are required');
    } else {
      const requiredStats = ['obedience', 'endurance', 'arousal', 'sensitivity'];
      for (const stat of requiredStats) {
        if (profile.baseStats[stat] === undefined) {
          errors.push(`Missing stat: ${stat}`);
        } else if (profile.baseStats[stat] < 0 || profile.baseStats[stat] > 100) {
          errors.push(`${stat} must be between 0 and 100`);
        }
      }
    }

    if (!profile.vulnerabilityMatrix || Object.keys(profile.vulnerabilityMatrix).length === 0) {
      errors.push('Vulnerability matrix is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a blank profile template
   * @returns {Object}
   */
  createBlankProfile() {
    return {
      id: null,
      name: '',
      description: '',
      portrait: null,
      baseStats: {
        obedience: 20,
        endurance: 50,
        arousal: 0,
        sensitivity: 30
      },
      traits: [],
      vulnerabilityMatrix: {
        tickling: { feet: 50, armpits: 50, ribs: 50, neck: 50, stomach: 50, innerThighs: 50, back: 50, chest: 50 },
        footWorship: { feet: 50 },
        sweatWorship: { armpits: 50, feet: 50, back: 50, chest: 50 },
        edging: { groin: 50, fullBody: 50 },
        postOrgasmTorture: { groin: 50, fullBody: 50 },
        humiliation: { any: 50 },
        bondage: { fullBody: 50 }
      },
      secretWeakness: '',
      flavorText: ''
    };
  }

  /**
   * Export profile as JSON
   * @param {string} profileId 
   * @param {string} profileType 
   * @returns {string}
   */
  exportProfile(profileId, profileType) {
    const profile = this.getProfile(profileId, profileType);
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }
    return JSON.stringify(profile, null, 2);
  }

  /**
   * Import profile from JSON
   * @param {string} jsonString 
   * @returns {Object}
   */
  importProfile(jsonString) {
    const profile = JSON.parse(jsonString);
    const validation = this.validateProfile(profile);
    
    if (!validation.valid) {
      throw new Error(`Invalid profile: ${validation.errors.join(', ')}`);
    }

    profile.id = this._generateId();
    profile.name = profile.name + ' (Imported)';
    
    return this.createProfile(profile);
  }

  // Private methods

  _loadCustomProfiles() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load custom profiles:', e);
      return [];
    }
  }

  _saveCustomProfiles() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.customProfiles));
    } catch (e) {
      console.error('Failed to save custom profiles:', e);
    }
  }

  _generateId() {
    return `slave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const slaveProfileService = new SlaveProfileService();
export default slaveProfileService;
