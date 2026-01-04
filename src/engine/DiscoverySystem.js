/**
 * DiscoverySystem.js
 * Manages NPC knowledge tracking, discovery events, and learning mechanics
 */

import discoveryRules from '../data/discoveryRules.json';

export class DiscoverySystem {
  constructor(stateManager, gameRules = null) {
    this.stateManager = stateManager;
    this.gameRules = gameRules || this._getDefaultRules();
    this.listeners = [];
    
    // Initialize NPC knowledge state if not present
    this._ensureKnowledgeState();
  }

  _getDefaultRules() {
    return {
      discovery: {
        speed: 'normal',
        sharingMode: 'gossip',
        startingKnowledge: 0,
        probingEnabled: true,
        exploitationEnabled: true
      }
    };
  }

  _ensureKnowledgeState() {
    const state = this.stateManager.getState();
    if (!state.npcKnowledge) {
      this.stateManager.state.npcKnowledge = {};
    }
  }

  /**
   * Initialize knowledge tracking for NPCs in the game
   * @param {Array} npcIds - Array of NPC IDs to track
   * @param {number} startingKnowledge - Starting knowledge percentage (0-100)
   */
  initializeForGame(npcIds, startingKnowledge = 0) {
    const knowledge = {};
    
    for (const npcId of npcIds) {
      knowledge[npcId] = {
        activities: {},
        bodyParts: {},
        overallScore: startingKnowledge,
        lastUpdated: Date.now()
      };
    }
    
    this.stateManager.state.npcKnowledge = knowledge;
    this._notifyListeners('initialized', { npcIds, startingKnowledge });
  }

  /**
   * Get knowledge level for an NPC about a specific activity/bodyPart combo
   * @param {string} npcId 
   * @param {string} activityId 
   * @param {string} bodyPartId 
   * @returns {Object} Knowledge level info
   */
  getKnowledge(npcId, activityId, bodyPartId = null) {
    const npcKnowledge = this.stateManager.state.npcKnowledge?.[npcId];
    if (!npcKnowledge) {
      return this._createEmptyKnowledge();
    }

    const key = bodyPartId ? `${activityId}_${bodyPartId}` : activityId;
    const confidence = npcKnowledge.activities[key]?.confidence || 0;
    
    return {
      confidence,
      level: this._getKnowledgeLevel(confidence),
      observations: npcKnowledge.activities[key]?.observations || [],
      lastTested: npcKnowledge.activities[key]?.lastTested || null
    };
  }

  /**
   * Get overall knowledge score for an NPC
   * @param {string} npcId 
   * @returns {Object} Overall knowledge info
   */
  getOverallKnowledge(npcId) {
    const npcKnowledge = this.stateManager.state.npcKnowledge?.[npcId];
    if (!npcKnowledge) {
      return { score: 0, state: 'unaware' };
    }

    const score = this._calculateOverallScore(npcKnowledge);
    const state = this._getOverallState(score);
    
    return { score, state, ...discoveryRules.overallKnowledgeStates[state] };
  }

  /**
   * Get all knowledge for an NPC (for UI display)
   * @param {string} npcId 
   * @returns {Object} All knowledge info
   */
  getAllKnowledgeForNpc(npcId) {
    const npcKnowledge = this.stateManager.state.npcKnowledge?.[npcId];
    if (!npcKnowledge) {
      return {
        overall: { score: 0, state: 'unaware' },
        suspicious: [],
        confirmed: [],
        mastered: []
      };
    }

    const suspicious = [];
    const confirmed = [];
    const mastered = [];

    for (const [key, data] of Object.entries(npcKnowledge.activities)) {
      const level = this._getKnowledgeLevel(data.confidence);
      const [activityId, bodyPartId] = key.split('_');
      
      const entry = {
        activityId,
        bodyPartId: bodyPartId || null,
        confidence: data.confidence,
        level: level.id,
        observations: data.observations
      };

      if (level.id === 'suspicious') suspicious.push(entry);
      else if (level.id === 'confirmed') confirmed.push(entry);
      else if (level.id === 'mastered') mastered.push(entry);
    }

    return {
      overall: this.getOverallKnowledge(npcId),
      suspicious,
      confirmed,
      mastered
    };
  }

  /**
   * Process a reaction and potentially trigger discovery
   * @param {string} npcId - The NPC who caused the reaction
   * @param {string} activityId - The activity performed
   * @param {string} bodyPartId - The body part targeted
   * @param {Object} reactionData - Data about the slave's reaction
   * @returns {Object|null} Discovery event if triggered
   */
  processReaction(npcId, activityId, bodyPartId, reactionData) {
    const { statChanges, rollResult, vulnerability } = reactionData;
    
    // Calculate total reaction intensity
    const totalChange = Object.values(statChanges || {}).reduce((sum, val) => sum + Math.abs(val), 0);
    
    // Check for discovery triggers
    const triggers = this._checkTriggers(totalChange, rollResult, vulnerability);
    
    if (triggers.length === 0) {
      return null;
    }

    // Calculate confidence gain
    let confidenceGain = 0;
    let triggerName = '';
    
    for (const trigger of triggers) {
      const triggerData = discoveryRules.discoveryTriggers[trigger];
      if (triggerData && triggerData.confidenceGain > confidenceGain) {
        confidenceGain = triggerData.confidenceGain;
        triggerName = trigger;
      }
    }

    // Apply discovery speed modifier
    const speedMultiplier = discoveryRules.discoverySpeed[this.gameRules.discovery.speed]?.multiplier || 1.0;
    confidenceGain = Math.round(confidenceGain * speedMultiplier);

    if (confidenceGain <= 0) {
      return null;
    }

    // Update knowledge
    const key = bodyPartId ? `${activityId}_${bodyPartId}` : activityId;
    const previousKnowledge = this.getKnowledge(npcId, activityId, bodyPartId);
    const newConfidence = Math.min(100, previousKnowledge.confidence + confidenceGain);
    
    this._updateKnowledge(npcId, key, {
      confidence: newConfidence,
      lastTested: Date.now(),
      observations: [
        ...previousKnowledge.observations,
        {
          turn: this.stateManager.state.turn,
          trigger: triggerName,
          reaction: totalChange,
          timestamp: Date.now()
        }
      ].slice(-10) // Keep last 10 observations
    });

    const newLevel = this._getKnowledgeLevel(newConfidence);
    const previousLevel = this._getKnowledgeLevel(previousKnowledge.confidence);

    // Create discovery event if level changed
    const levelChanged = previousLevel.id !== newLevel.id;
    
    const event = {
      type: 'discovery',
      npcId,
      activityId,
      bodyPartId,
      trigger: triggerName,
      confidenceGain,
      previousConfidence: previousKnowledge.confidence,
      newConfidence,
      previousLevel: previousLevel.id,
      newLevel: newLevel.id,
      levelChanged,
      narrative: this._generateDiscoveryNarrative(npcId, activityId, bodyPartId, triggerName, newLevel)
    };

    this._notifyListeners('discovery', event);
    
    return event;
  }

  /**
   * Check if NPC should probe for weaknesses
   * @param {string} npcId 
   * @returns {Object|null} Probing action if triggered
   */
  checkProbing(npcId) {
    if (!this.gameRules.discovery.probingEnabled) {
      return null;
    }

    const probeChance = discoveryRules.probingBehavior.probeChance;
    if (Math.random() > probeChance) {
      return null;
    }

    // NPC is probing - pick something they don't know well yet
    const knowledge = this.getAllKnowledgeForNpc(npcId);
    
    return {
      type: 'probing',
      npcId,
      discoveryBonus: discoveryRules.probingBehavior.probeBonus,
      narrative: this._getRandomItem(discoveryRules.probingBehavior.probingNarrative)
    };
  }

  /**
   * Check if NPC should exploit known weakness
   * @param {string} npcId 
   * @returns {Object|null} Exploitation target if triggered
   */
  checkExploitation(npcId) {
    if (!this.gameRules.discovery.exploitationEnabled) {
      return null;
    }

    const knowledge = this.getAllKnowledgeForNpc(npcId);
    
    // Check for mastered weaknesses first
    if (knowledge.mastered.length > 0) {
      if (Math.random() < discoveryRules.exploitationBehavior.masteredTargetChance) {
        const target = this._getRandomItem(knowledge.mastered);
        return {
          type: 'exploitation',
          level: 'mastered',
          npcId,
          activityId: target.activityId,
          bodyPartId: target.bodyPartId,
          effectivenessBonus: discoveryRules.knowledgeLevels.mastered.behaviorModifier,
          narrative: this._getRandomItem(discoveryRules.exploitationBehavior.exploitNarrative)
        };
      }
    }

    // Check for confirmed weaknesses
    if (knowledge.confirmed.length > 0) {
      if (Math.random() < discoveryRules.exploitationBehavior.confirmedTargetChance) {
        const target = this._getRandomItem(knowledge.confirmed);
        return {
          type: 'exploitation',
          level: 'confirmed',
          npcId,
          activityId: target.activityId,
          bodyPartId: target.bodyPartId,
          effectivenessBonus: discoveryRules.knowledgeLevels.confirmed.behaviorModifier,
          narrative: this._getRandomItem(discoveryRules.exploitationBehavior.exploitNarrative)
        };
      }
    }

    return null;
  }

  /**
   * Share knowledge between NPCs (gossip system)
   * @param {string} sourceNpcId - NPC sharing the info
   * @param {string} targetNpcId - NPC receiving the info
   * @returns {Object|null} Share event if triggered
   */
  shareKnowledge(sourceNpcId, targetNpcId) {
    const sharingMode = discoveryRules.sharingModes[this.gameRules.discovery.sharingMode];
    if (!sharingMode || sharingMode.shareChance === 0) {
      return null;
    }

    if (Math.random() > sharingMode.shareChance) {
      return null;
    }

    const sourceKnowledge = this.getAllKnowledgeForNpc(sourceNpcId);
    const shareable = [...sourceKnowledge.confirmed, ...sourceKnowledge.mastered];
    
    if (shareable.length === 0) {
      return null;
    }

    // Pick something to share
    const toShare = this._getRandomItem(shareable);
    const targetKnowledge = this.getKnowledge(targetNpcId, toShare.activityId, toShare.bodyPartId);
    
    // Calculate how much to share
    const shareAmount = Math.round(toShare.confidence * sharingMode.shareAmount);
    const newConfidence = Math.min(100, Math.max(targetKnowledge.confidence, shareAmount));
    
    if (newConfidence <= targetKnowledge.confidence) {
      return null; // Target already knows more
    }

    // Update target's knowledge
    const key = toShare.bodyPartId ? `${toShare.activityId}_${toShare.bodyPartId}` : toShare.activityId;
    this._updateKnowledge(targetNpcId, key, {
      confidence: newConfidence,
      lastTested: Date.now(),
      observations: [
        ...targetKnowledge.observations,
        {
          turn: this.stateManager.state.turn,
          trigger: 'gossip',
          source: sourceNpcId,
          timestamp: Date.now()
        }
      ]
    });

    const event = {
      type: 'gossip',
      sourceNpcId,
      targetNpcId,
      activityId: toShare.activityId,
      bodyPartId: toShare.bodyPartId,
      sharedConfidence: shareAmount,
      newConfidence,
      narrative: sharingMode.narrative
    };

    this._notifyListeners('gossip', event);
    
    return event;
  }

  /**
   * Process end-of-turn gossip for all NPCs
   * @param {Array} npcIds - Array of active NPC IDs
   * @returns {Array} Array of gossip events
   */
  processTurnGossip(npcIds) {
    const events = [];
    
    for (let i = 0; i < npcIds.length; i++) {
      for (let j = 0; j < npcIds.length; j++) {
        if (i !== j) {
          const event = this.shareKnowledge(npcIds[i], npcIds[j]);
          if (event) {
            events.push(event);
          }
        }
      }
    }
    
    return events;
  }

  // Private helper methods

  _checkTriggers(totalChange, rollResult, vulnerability) {
    const triggers = [];
    const thresholds = discoveryRules.discoveryTriggers;

    if (totalChange > thresholds.veryHighReaction.threshold) {
      triggers.push('veryHighReaction');
    } else if (totalChange > thresholds.highReaction.threshold) {
      triggers.push('highReaction');
    }

    if (rollResult?.critical === 'failure') {
      triggers.push('criticalFail');
    }

    if (rollResult?.success === false && rollResult?.margin > (thresholds.failedEndurance?.threshold || 5)) {
      triggers.push('failedEndurance');
    }

    return triggers;
  }

  _getKnowledgeLevel(confidence) {
    for (const level of Object.values(discoveryRules.knowledgeLevels)) {
      if (confidence >= level.minConfidence && confidence <= level.maxConfidence) {
        return level;
      }
    }
    return discoveryRules.knowledgeLevels.unaware;
  }

  _getOverallState(score) {
    for (const [state, config] of Object.entries(discoveryRules.overallKnowledgeStates)) {
      if (score >= config.minScore && score <= config.maxScore) {
        return state;
      }
    }
    return 'unaware';
  }

  _calculateOverallScore(npcKnowledge) {
    const activities = Object.values(npcKnowledge.activities);
    if (activities.length === 0) return 0;
    
    const totalConfidence = activities.reduce((sum, a) => sum + a.confidence, 0);
    return Math.round(totalConfidence / activities.length);
  }

  _createEmptyKnowledge() {
    return {
      confidence: 0,
      level: discoveryRules.knowledgeLevels.unaware,
      observations: [],
      lastTested: null
    };
  }

  _updateKnowledge(npcId, key, data) {
    if (!this.stateManager.state.npcKnowledge[npcId]) {
      this.stateManager.state.npcKnowledge[npcId] = {
        activities: {},
        bodyParts: {},
        overallScore: 0,
        lastUpdated: Date.now()
      };
    }
    
    this.stateManager.state.npcKnowledge[npcId].activities[key] = data;
    this.stateManager.state.npcKnowledge[npcId].lastUpdated = Date.now();
    this.stateManager.state.npcKnowledge[npcId].overallScore = 
      this._calculateOverallScore(this.stateManager.state.npcKnowledge[npcId]);
  }

  _generateDiscoveryNarrative(npcId, activityId, bodyPartId, trigger, level) {
    const triggerData = discoveryRules.discoveryTriggers[trigger];
    if (triggerData?.narrative) {
      return triggerData.narrative.replace('{npc}', npcId);
    }
    return `${npcId} has learned something about your vulnerabilities.`;
  }

  _getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Event listeners
  onDiscoveryEvent(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  _notifyListeners(eventType, data) {
    for (const listener of this.listeners) {
      listener(eventType, data);
    }
  }

  // Serialization
  serialize() {
    return {
      npcKnowledge: this.stateManager.state.npcKnowledge,
      gameRules: this.gameRules
    };
  }

  deserialize(data) {
    if (data.npcKnowledge) {
      this.stateManager.state.npcKnowledge = data.npcKnowledge;
    }
    if (data.gameRules) {
      this.gameRules = data.gameRules;
    }
  }
}

export default DiscoverySystem;
