/**
 * useDiscovery.js
 * Hook for managing the discovery system
 */

import { useState, useCallback, useMemo } from 'react';
import { DiscoverySystem } from '../engine/DiscoverySystem';

export function useDiscovery(stateManager) {
  const [discoverySystem] = useState(() => new DiscoverySystem(stateManager));
  const [events, setEvents] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // Initialize for a new game
  const initialize = useCallback((npcIds, startingKnowledge = 0) => {
    discoverySystem.initializeForGame(npcIds, startingKnowledge);
    refresh();
  }, [discoverySystem, refresh]);

  // Get knowledge for specific activity/body part
  const getKnowledge = useCallback((npcId, activityId, bodyPartId) => {
    return discoverySystem.getKnowledge(npcId, activityId, bodyPartId);
  }, [discoverySystem, refreshKey]);

  // Get overall knowledge for an NPC
  const getOverallKnowledge = useCallback((npcId) => {
    return discoverySystem.getOverallKnowledge(npcId);
  }, [discoverySystem, refreshKey]);

  // Get all knowledge for an NPC (categorized)
  const getAllKnowledgeForNpc = useCallback((npcId) => {
    return discoverySystem.getAllKnowledgeForNpc(npcId);
  }, [discoverySystem, refreshKey]);

  // Process a reaction (main discovery trigger)
  const processReaction = useCallback((npcId, activityId, bodyPartId, reactionData) => {
    const event = discoverySystem.processReaction(npcId, activityId, bodyPartId, reactionData);
    if (event) {
      setEvents(prev => [...prev, { ...event, timestamp: Date.now(), type: 'discovery' }]);
    }
    refresh();
    return event;
  }, [discoverySystem, refresh]);

  // Check if NPC should probe
  const checkProbing = useCallback((npcId) => {
    return discoverySystem.checkProbing(npcId);
  }, [discoverySystem]);

  // Check if NPC should exploit known weakness
  const checkExploitation = useCallback((npcId) => {
    return discoverySystem.checkExploitation(npcId);
  }, [discoverySystem, refreshKey]);

  // Share knowledge between NPCs
  const shareKnowledge = useCallback((sourceNpcId, targetNpcId) => {
    const result = discoverySystem.shareKnowledge(sourceNpcId, targetNpcId);
    if (result && result.shared > 0) {
      setEvents(prev => [...prev, {
        type: 'gossip',
        sourceNpcId,
        targetNpcId,
        sharedCount: result.shared,
        timestamp: Date.now()
      }]);
    }
    refresh();
    return result;
  }, [discoverySystem, refresh]);

  // Process end-of-turn gossip
  const processTurnGossip = useCallback((npcIds) => {
    const gossipEvents = discoverySystem.processTurnGossip(npcIds);
    if (gossipEvents.length > 0) {
      setEvents(prev => [
        ...prev,
        ...gossipEvents.map(e => ({ ...e, type: 'gossip', timestamp: Date.now() }))
      ]);
    }
    refresh();
    return gossipEvents;
  }, [discoverySystem, refresh]);

  // Get and clear pending events
  const consumeEvents = useCallback(() => {
    const pending = [...events];
    setEvents([]);
    return pending;
  }, [events]);

  // Get latest event without clearing
  const peekLatestEvent = useCallback(() => {
    return events[events.length - 1] || null;
  }, [events]);

  // Clear specific event
  const dismissEvent = useCallback((timestamp) => {
    setEvents(prev => prev.filter(e => e.timestamp !== timestamp));
  }, []);

  // Get full knowledge state for UI
  const getFullKnowledgeState = useCallback(() => {
    return stateManager?.state?.npcKnowledge || {};
  }, [stateManager, refreshKey]);

  return {
    // Initialization
    initialize,
    
    // Queries
    getKnowledge,
    getOverallKnowledge,
    getAllKnowledgeForNpc,
    getFullKnowledgeState,
    
    // Actions
    processReaction,
    checkProbing,
    checkExploitation,
    shareKnowledge,
    processTurnGossip,
    
    // Events
    events,
    consumeEvents,
    peekLatestEvent,
    dismissEvent,
    
    // Utilities
    refresh
  };
}

export default useDiscovery;
