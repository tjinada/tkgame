/**
 * SlaveCreatorTab.jsx
 * Admin tab for creating and editing custom slave profiles
 */

import { useState, useMemo } from 'react';
import { Plus, Edit3, Trash2, Copy, Save, X, User, Upload, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { slaveProfileService } from '../../services/SlaveProfileService';
import { VulnerabilityMatrixModal } from '../setup/VulnerabilityMatrixModal';

export function SlaveCreatorTab() {
  const [editingProfile, setEditingProfile] = useState(null);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { presets, custom } = useMemo(() => slaveProfileService.getAllProfiles(), []);
  const traitDefinitions = useMemo(() => slaveProfileService.getTraitDefinitions(), []);

  // Create new blank profile
  const handleCreateNew = () => {
    const blank = slaveProfileService.createBlankProfile();
    blank.name = 'New Profile';
    setEditingProfile(blank);
  };

  // Clone existing profile
  const handleClone = (sourceId, sourceType) => {
    const cloned = slaveProfileService.cloneProfile(sourceId, sourceType, 'Copy of Profile');
    setEditingProfile(cloned);
  };

  // Save profile
  const handleSave = () => {
    if (!editingProfile) return;

    const validation = slaveProfileService.validateProfile(editingProfile);
    if (!validation.valid) {
      alert(`Validation failed: ${validation.errors.join(', ')}`);
      return;
    }

    if (editingProfile.id && custom.some(p => p.id === editingProfile.id)) {
      slaveProfileService.updateProfile(editingProfile.id, editingProfile);
    } else {
      slaveProfileService.createProfile(editingProfile);
    }

    setEditingProfile(null);
    window.location.reload(); // Simple refresh
  };

  // Delete profile
  const handleDelete = (profileId) => {
    if (confirmDelete === profileId) {
      slaveProfileService.deleteProfile(profileId);
      setConfirmDelete(null);
      window.location.reload();
    } else {
      setConfirmDelete(profileId);
    }
  };

  // Update editing profile field
  const updateField = (path, value) => {
    const newProfile = JSON.parse(JSON.stringify(editingProfile));
    const parts = path.split('.');
    let current = newProfile;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
    setEditingProfile(newProfile);
  };

  // Toggle trait
  const toggleTrait = (traitId) => {
    const currentTraits = editingProfile.traits || [];
    const newTraits = currentTraits.includes(traitId)
      ? currentTraits.filter(t => t !== traitId)
      : [...currentTraits, traitId];
    updateField('traits', newTraits);
  };

  // Export profile
  const handleExport = (profile) => {
    const json = slaveProfileService.exportProfile(profile.id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slave-profile-${profile.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import profile
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = slaveProfileService.importProfile(event.target.result);
        if (imported) {
          window.location.reload();
        }
      } catch (error) {
        alert(`Import failed: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Render stat input
  const renderStatInput = (label, statName, color) => (
    <div className="flex items-center gap-3">
      <span className="w-24 text-sm text-text-secondary">{label}</span>
      <input
        type="range"
        min="0"
        max="100"
        value={editingProfile.baseStats?.[statName] || 0}
        onChange={(e) => updateField(`baseStats.${statName}`, parseInt(e.target.value))}
        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
      <input
        type="number"
        min="0"
        max="100"
        value={editingProfile.baseStats?.[statName] || 0}
        onChange={(e) => updateField(`baseStats.${statName}`, parseInt(e.target.value) || 0)}
        className="w-16 px-2 py-1 bg-white/5 border border-white/10 rounded text-center text-sm"
      />
    </div>
  );

  // Render profile card
  const renderProfileCard = (profile, type = 'custom') => (
    <div
      key={profile.id}
      className="p-4 bg-white/5 border border-white/10 rounded-lg hover:border-white/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-16 bg-white/10 rounded flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-text-muted" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-white truncate">{profile.name}</h4>
            {type === 'preset' && (
              <span className="px-1.5 py-0.5 text-xs bg-accent-primary/20 text-accent-primary rounded">
                Preset
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary line-clamp-2 mt-1">
            {profile.description}
          </p>
          
          <div className="flex flex-wrap gap-1 mt-2">
            {profile.traits?.slice(0, 3).map(trait => (
              <span key={trait} className="px-1.5 py-0.5 text-xs bg-white/10 rounded">
                {trait}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
        {type === 'custom' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingProfile(JSON.parse(JSON.stringify(profile)))}
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button
              variant={confirmDelete === profile.id ? 'danger' : 'ghost'}
              size="sm"
              onClick={() => handleDelete(profile.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleClone(profile.id, type)}
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleExport(profile)}
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Slave Profiles</h2>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button variant="ghost" size="sm" as="span">
              <Upload className="w-4 h-4 mr-1" />
              Import
            </Button>
          </label>
          <Button variant="primary" size="sm" onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-1" />
            New Profile
          </Button>
        </div>
      </div>

      {/* Editor Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background-elevated rounded-lg border border-white/10">
            {/* Editor Header */}
            <div className="sticky top-0 bg-background-elevated p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingProfile.id ? 'Edit Profile' : 'New Profile'}
              </h3>
              <button
                onClick={() => setEditingProfile(null)}
                className="p-2 text-text-secondary hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editor Content */}
            <div className="p-4 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">Name</label>
                <input
                  type="text"
                  value={editingProfile.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
                  placeholder="Profile name..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">Description</label>
                <textarea
                  value={editingProfile.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white h-20 resize-none"
                  placeholder="Brief description..."
                />
              </div>

              {/* Base Stats */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">Base Stats</label>
                <div className="space-y-3">
                  {renderStatInput('Obedience', 'obedience', '#ef4444')}
                  {renderStatInput('Endurance', 'endurance', '#f59e0b')}
                  {renderStatInput('Arousal', 'arousal', '#ec4899')}
                  {renderStatInput('Sensitivity', 'sensitivity', '#3b82f6')}
                </div>
              </div>

              {/* Traits */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Traits</label>
                <div className="flex flex-wrap gap-2">
                  {traitDefinitions.map(trait => {
                    const isActive = editingProfile.traits?.includes(trait.id);
                    return (
                      <button
                        key={trait.id}
                        onClick={() => toggleTrait(trait.id)}
                        className={`
                          px-2 py-1 text-xs rounded border transition-colors
                          ${isActive 
                            ? 'bg-accent-primary/20 border-accent-primary text-accent-primary' 
                            : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/30'
                          }
                        `}
                        title={trait.description}
                      >
                        {trait.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vulnerability Matrix */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-white">Vulnerability Matrix</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMatrixModal(true)}
                  >
                    Edit Matrix →
                  </Button>
                </div>
                <p className="text-sm text-text-muted">
                  Configure how vulnerable this profile is to each activity/body part combination.
                </p>
              </div>

              {/* Secret Weakness */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">Secret Weakness</label>
                <textarea
                  value={editingProfile.secretWeakness || ''}
                  onChange={(e) => updateField('secretWeakness', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white h-16 resize-none"
                  placeholder="A hidden vulnerability that Mistresses might discover..."
                />
              </div>

              {/* Flavor Text */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">Flavor Text</label>
                <textarea
                  value={editingProfile.flavorText || ''}
                  onChange={(e) => updateField('flavorText', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white h-16 resize-none"
                  placeholder="Additional descriptive text..."
                />
              </div>
            </div>

            {/* Editor Footer */}
            <div className="sticky bottom-0 bg-background-elevated p-4 border-t border-white/10 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditingProfile(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" />
                Save Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Vulnerability Matrix Modal */}
      {showMatrixModal && editingProfile && (
        <VulnerabilityMatrixModal
          isOpen={showMatrixModal}
          onClose={() => setShowMatrixModal(false)}
          matrix={editingProfile.vulnerabilityMatrix}
          onChange={(matrix) => updateField('vulnerabilityMatrix', matrix)}
        />
      )}

      {/* Custom Profiles */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Custom Profiles ({custom.length})</h3>
        {custom.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {custom.map(profile => renderProfileCard(profile, 'custom'))}
          </div>
        ) : (
          <p className="text-text-muted text-center py-8">
            No custom profiles yet. Create one or clone a preset.
          </p>
        )}
      </div>

      {/* Preset Profiles */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Preset Profiles ({presets.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presets.map(profile => renderProfileCard(profile, 'preset'))}
        </div>
      </div>
    </div>
  );
}

export default SlaveCreatorTab;
