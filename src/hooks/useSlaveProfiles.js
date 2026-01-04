/**
 * useSlaveProfiles.js
 * Hook for managing slave profiles
 */

import { useState, useCallback, useMemo } from 'react';
import { slaveProfileService } from '../services/SlaveProfileService';

export function useSlaveProfiles() {
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // Get all profiles
  const { presets, custom } = useMemo(
    () => slaveProfileService.getAllProfiles(),
    [refreshKey]
  );

  // Get trait definitions
  const traitDefinitions = useMemo(
    () => slaveProfileService.getTraitDefinitions(),
    []
  );

  // Get a specific profile
  const getProfile = useCallback((profileId, profileType = 'preset') => {
    return slaveProfileService.getProfile(profileId, profileType);
  }, [refreshKey]);

  // Apply overrides to a profile
  const applyOverrides = useCallback((baseProfile, overrides) => {
    return slaveProfileService.applyOverrides(baseProfile, overrides);
  }, []);

  // CRUD for custom profiles
  const createProfile = useCallback((profileData) => {
    const result = slaveProfileService.createProfile(profileData);
    refresh();
    return result;
  }, [refresh]);

  const updateProfile = useCallback((profileId, updates) => {
    const result = slaveProfileService.updateProfile(profileId, updates);
    refresh();
    return result;
  }, [refresh]);

  const deleteProfile = useCallback((profileId) => {
    slaveProfileService.deleteProfile(profileId);
    refresh();
  }, [refresh]);

  // Clone a profile
  const cloneProfile = useCallback((sourceId, sourceType, newName) => {
    const result = slaveProfileService.cloneProfile(sourceId, sourceType, newName);
    refresh();
    return result;
  }, [refresh]);

  // Create blank profile
  const createBlankProfile = useCallback(() => {
    return slaveProfileService.createBlankProfile();
  }, []);

  // Validation
  const validateProfile = useCallback((profile) => {
    return slaveProfileService.validateProfile(profile);
  }, []);

  // Import/Export
  const exportProfile = useCallback((profileId) => {
    return slaveProfileService.exportProfile(profileId);
  }, []);

  const importProfile = useCallback((jsonString) => {
    const result = slaveProfileService.importProfile(jsonString);
    refresh();
    return result;
  }, [refresh]);

  return {
    // Data
    presets,
    customProfiles: custom,
    traitDefinitions,
    
    // Getters
    getProfile,
    applyOverrides,
    
    // CRUD
    createProfile,
    updateProfile,
    deleteProfile,
    cloneProfile,
    createBlankProfile,
    
    // Utilities
    validateProfile,
    exportProfile,
    importProfile,
    refresh
  };
}

export default useSlaveProfiles;
