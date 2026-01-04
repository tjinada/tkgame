/**
 * NpcProfileService.js
 * Manages NPC profiles (default and custom)
 */

import npcProfiles from '../data/npcProfiles.json';

const STORAGE_KEY = 'fd_npc_profiles';

class NpcProfileService {
  constructor() {
    this.defaultNpcs = npcProfiles.npcs;
    this.customNpcs = this._loadCustomNpcs();
  }

  /**
   * Get all default NPCs
   * @returns {Array}
   */
  getDefaultNpcs() {
    return this.defaultNpcs;
  }

  /**
   * Get a specific default NPC by ID
   * @param {string} npcId 
   * @returns {Object|null}
   */
  getDefaultNpc(npcId) {
    return this.defaultNpcs.find(n => n.id === npcId) || null;
  }

  /**
   * Get all custom NPCs
   * @returns {Array}
   */
  getCustomNpcs() {
    return this.customNpcs;
  }

  /**
   * Get a specific custom NPC by ID
   * @param {string} npcId 
   * @returns {Object|null}
   */
  getCustomNpc(npcId) {
    return this.customNpcs.find(n => n.id === npcId) || null;
  }

  /**
   * Get any NPC (default or custom) by ID
   * @param {string} npcId 
   * @returns {Object|null}
   */
  getNpc(npcId) {
    return this.getDefaultNpc(npcId) || this.getCustomNpc(npcId);
  }

  /**
   * Get all NPCs (default + custom)
   * @returns {Object}
   */
  getAllNpcs() {
    return {
      default: this.defaultNpcs,
      custom: this.customNpcs
    };
  }

  /**
   * Get all NPCs as a flat array
   * @returns {Array}
   */
  getAllNpcsFlat() {
    return [...this.defaultNpcs, ...this.customNpcs];
  }

  /**
   * Get required NPCs (e.g., Sandy)
   * @returns {Array}
   */
  getRequiredNpcs() {
    return this.defaultNpcs.filter(n => n.isRequired);
  }

  /**
   * Get NPCs by specialty
   * @param {string} specialty 
   * @returns {Array}
   */
  getNpcsBySpecialty(specialty) {
    return this.getAllNpcsFlat().filter(n => 
      n.specialties?.includes(specialty)
    );
  }

  /**
   * Create a new custom NPC
   * @param {Object} npcData 
   * @returns {Object} Created NPC
   */
  createNpc(npcData) {
    const npc = {
      ...npcData,
      id: npcData.id || this._generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
      isRequired: false
    };

    this.customNpcs.push(npc);
    this._saveCustomNpcs();
    
    return npc;
  }

  /**
   * Update an existing custom NPC
   * @param {string} npcId 
   * @param {Object} updates 
   * @returns {Object|null} Updated NPC
   */
  updateNpc(npcId, updates) {
    const index = this.customNpcs.findIndex(n => n.id === npcId);
    if (index === -1) {
      return null;
    }

    this.customNpcs[index] = {
      ...this.customNpcs[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this._saveCustomNpcs();
    return this.customNpcs[index];
  }

  /**
   * Delete a custom NPC
   * @param {string} npcId 
   * @returns {boolean}
   */
  deleteNpc(npcId) {
    const index = this.customNpcs.findIndex(n => n.id === npcId);
    if (index === -1) {
      return false;
    }

    this.customNpcs.splice(index, 1);
    this._saveCustomNpcs();
    return true;
  }

  /**
   * Clone an NPC as a new custom NPC
   * @param {string} sourceId 
   * @param {string} newName 
   * @returns {Object} New NPC
   */
  cloneNpc(sourceId, newName) {
    const source = this.getNpc(sourceId);
    if (!source) {
      throw new Error(`NPC not found: ${sourceId}`);
    }

    const cloned = {
      ...JSON.parse(JSON.stringify(source)),
      id: this._generateId(),
      name: newName || `${source.name} (Copy)`,
      isDefault: false,
      isRequired: false
    };

    return this.createNpc(cloned);
  }

  /**
   * Initialize discovery knowledge for an NPC
   * @param {string} npcId 
   * @param {number} startingKnowledge 
   * @returns {Object} Knowledge state
   */
  initializeKnowledge(npcId, startingKnowledge = 0) {
    return {
      npcId,
      activities: {},
      bodyParts: {},
      overallScore: startingKnowledge,
      lastUpdated: Date.now()
    };
  }

  /**
   * Get NPC behavior for affinity tier
   * @param {string} npcId 
   * @param {string} tier 
   * @returns {string}
   */
  getBehaviorForTier(npcId, tier) {
    const npc = this.getNpc(npcId);
    if (!npc?.behaviorByTier) {
      return '';
    }
    return npc.behaviorByTier[tier] || npc.behaviorByTier.neutral || '';
  }

  /**
   * Get random catchphrase for NPC
   * @param {string} npcId 
   * @returns {string}
   */
  getRandomCatchphrase(npcId) {
    const npc = this.getNpc(npcId);
    if (!npc?.catchphrases?.length) {
      return '';
    }
    return npc.catchphrases[Math.floor(Math.random() * npc.catchphrases.length)];
  }

  /**
   * Get NPC's preferred activity for targeting
   * @param {string} npcId 
   * @returns {Object|null} { activity, weight }
   */
  getPreferredActivity(npcId) {
    const npc = this.getNpc(npcId);
    if (!npc?.preferredActivities?.length) {
      return null;
    }

    // Weighted random selection
    const totalWeight = npc.preferredActivities.reduce((sum, a) => sum + a.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const pref of npc.preferredActivities) {
      random -= pref.weight;
      if (random <= 0) {
        return pref;
      }
    }
    
    return npc.preferredActivities[0];
  }

  /**
   * Get NPC's preferred body part target
   * @param {string} npcId 
   * @returns {string|null}
   */
  getPreferredBodyPart(npcId) {
    const npc = this.getNpc(npcId);
    if (!npc?.targetAreas?.length) {
      return null;
    }
    return npc.targetAreas[Math.floor(Math.random() * npc.targetAreas.length)];
  }

  /**
   * Check if NPC weakness is discovered
   * @param {string} npcId 
   * @param {string} weaknessId 
   * @returns {boolean}
   */
  isWeaknessDiscovered(npcId, weaknessId) {
    const npc = this.getNpc(npcId);
    const weakness = npc?.weaknesses?.find(w => w.id === weaknessId);
    return weakness?.discovered || false;
  }

  /**
   * Mark NPC weakness as discovered
   * @param {string} npcId 
   * @param {string} weaknessId 
   */
  discoverWeakness(npcId, weaknessId) {
    const npc = this.getNpc(npcId);
    if (!npc) return;

    const weakness = npc.weaknesses?.find(w => w.id === weaknessId);
    if (weakness) {
      weakness.discovered = true;
      
      // If custom NPC, save changes
      if (!npc.isDefault) {
        this._saveCustomNpcs();
      }
    }
  }

  /**
   * Validate an NPC structure
   * @param {Object} npc 
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validateNpc(npc) {
    const errors = [];

    if (!npc.name || npc.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!npc.title || npc.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!npc.description || npc.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (npc.startingAffinity === undefined || npc.startingAffinity < -50 || npc.startingAffinity > 100) {
      errors.push('Starting affinity must be between -50 and 100');
    }

    if (!npc.specialties || npc.specialties.length === 0) {
      errors.push('At least one specialty is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a blank NPC template
   * @returns {Object}
   */
  createBlankNpc() {
    return {
      id: null,
      name: '',
      title: '',
      description: '',
      portrait: null,
      startingAffinity: 0,
      role: 'specialist',
      isRequired: false,
      specialties: [],
      preferredActivities: [],
      targetAreas: [],
      perks: [],
      weaknesses: [],
      behaviorByTier: {
        devoted: '',
        pleased: '',
        neutral: '',
        annoyed: '',
        hostile: ''
      },
      personalityTraits: [],
      speakingStyle: '',
      catchphrases: []
    };
  }

  /**
   * Export NPC as JSON
   * @param {string} npcId 
   * @returns {string}
   */
  exportNpc(npcId) {
    const npc = this.getNpc(npcId);
    if (!npc) {
      throw new Error(`NPC not found: ${npcId}`);
    }
    return JSON.stringify(npc, null, 2);
  }

  /**
   * Import NPC from JSON
   * @param {string} jsonString 
   * @returns {Object}
   */
  importNpc(jsonString) {
    const npc = JSON.parse(jsonString);
    const validation = this.validateNpc(npc);
    
    if (!validation.valid) {
      throw new Error(`Invalid NPC: ${validation.errors.join(', ')}`);
    }

    npc.id = this._generateId();
    npc.name = npc.name + ' (Imported)';
    
    return this.createNpc(npc);
  }

  /**
   * Generate context for AI prompts about an NPC
   * @param {string} npcId 
   * @param {string} affinityTier 
   * @returns {string}
   */
  generateAIContext(npcId, affinityTier = 'neutral') {
    const npc = this.getNpc(npcId);
    if (!npc) return '';

    const behavior = this.getBehaviorForTier(npcId, affinityTier);
    
    return `
${npc.name} (${npc.title}): ${npc.description}
Personality: ${npc.personalityTraits?.join(', ') || 'Unknown'}
Speaking style: ${npc.speakingStyle || 'Standard'}
Current behavior (${affinityTier}): ${behavior}
Specialties: ${npc.specialties?.join(', ') || 'None'}
Sample phrases: "${npc.catchphrases?.slice(0, 3).join('", "') || ''}"
    `.trim();
  }

  // Private methods

  _loadCustomNpcs() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load custom NPCs:', e);
      return [];
    }
  }

  _saveCustomNpcs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.customNpcs));
    } catch (e) {
      console.error('Failed to save custom NPCs:', e);
    }
  }

  _generateId() {
    return `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const npcProfileService = new NpcProfileService();
export default npcProfileService;
