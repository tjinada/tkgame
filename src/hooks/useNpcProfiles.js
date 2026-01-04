/**
 * useNpcProfiles.js
 * Hook for managing NPC profiles
 */

import { useState, useCallback, useMemo } from 'react';
import { npcProfileService } from '../services/NpcProfileService';

export function useNpcProfiles() {
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // Get all NPCs
  const { default: defaultNpcs, custom: customNpcs } = useMemo(
    () => npcProfileService.getAllNpcs(),
    [refreshKey]
  );

  const allNpcs = useMemo(
    () => [...defaultNpcs, ...customNpcs],
    [defaultNpcs, customNpcs]
  );

  // Get required NPCs (Sandy)
  const requiredNpcs = useMemo(
    () => npcProfileService.getRequiredNpcs(),
    [refreshKey]
  );

  // Get specific NPC
  const getNpc = useCallback((npcId) => {
    return npcProfileService.getNpc(npcId);
  }, [refreshKey]);

  // Get NPCs by specialty
  const getBySpecialty = useCallback((specialty) => {
    return npcProfileService.getNpcsBySpecialty(specialty);
  }, [refreshKey]);

  // CRUD for custom NPCs
  const createNpc = useCallback((npcData) => {
    const result = npcProfileService.createNpc(npcData);
    refresh();
    return result;
  }, [refresh]);

  const updateNpc = useCallback((npcId, updates) => {
    const result = npcProfileService.updateNpc(npcId, updates);
    refresh();
    return result;
  }, [refresh]);

  const deleteNpc = useCallback((npcId) => {
    npcProfileService.deleteNpc(npcId);
    refresh();
  }, [refresh]);

  // Clone NPC
  const cloneNpc = useCallback((sourceId, newName) => {
    const result = npcProfileService.cloneNpc(sourceId, newName);
    refresh();
    return result;
  }, [refresh]);

  // Behavior helpers
  const getBehaviorForTier = useCallback((npcId, tier) => {
    return npcProfileService.getBehaviorForTier(npcId, tier);
  }, []);

  const getRandomCatchphrase = useCallback((npcId) => {
    return npcProfileService.getRandomCatchphrase(npcId);
  }, []);

  const getPreferredActivity = useCallback((npcId) => {
    return npcProfileService.getPreferredActivity(npcId);
  }, []);

  const getPreferredBodyPart = useCallback((npcId) => {
    return npcProfileService.getPreferredBodyPart(npcId);
  }, []);

  // Weakness discovery tracking
  const isWeaknessDiscovered = useCallback((npcId) => {
    return npcProfileService.isWeaknessDiscovered(npcId);
  }, []);

  const discoverWeakness = useCallback((npcId) => {
    const result = npcProfileService.discoverWeakness(npcId);
    refresh();
    return result;
  }, [refresh]);

  // AI context
  const generateAIContext = useCallback((npcId, affinityTier) => {
    return npcProfileService.generateAIContext(npcId, affinityTier);
  }, []);

  // Validation
  const validateNpc = useCallback((npc) => {
    return npcProfileService.validateNpc(npc);
  }, []);

  // Import/Export
  const exportNpc = useCallback((npcId) => {
    return npcProfileService.exportNpc(npcId);
  }, []);

  const importNpc = useCallback((jsonString) => {
    const result = npcProfileService.importNpc(jsonString);
    refresh();
    return result;
  }, [refresh]);

  return {
    // Data
    defaultNpcs,
    customNpcs,
    allNpcs,
    requiredNpcs,
    
    // Getters
    getNpc,
    getBySpecialty,
    
    // CRUD
    createNpc,
    updateNpc,
    deleteNpc,
    cloneNpc,
    
    // Behavior
    getBehaviorForTier,
    getRandomCatchphrase,
    getPreferredActivity,
    getPreferredBodyPart,
    
    // Weakness
    isWeaknessDiscovered,
    discoverWeakness,
    
    // Utilities
    generateAIContext,
    validateNpc,
    exportNpc,
    importNpc,
    refresh
  };
}

export default useNpcProfiles;
