/**
 * SlaveSelector.jsx
 * Step 1: Choose and customize slave profile
 */

import { useState, useMemo } from 'react';
import { User, Edit3, RotateCcw, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { slaveProfileService } from '../../services/SlaveProfileService';
import { VulnerabilityMatrixModal } from './VulnerabilityMatrixModal';

export function SlaveSelector({ selectedSlave, onChange }) {
  const [expandedPreset, setExpandedPreset] = useState(selectedSlave?.profileId || null);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [quickEditMode, setQuickEditMode] = useState(false);

  const { presets, custom } = useMemo(() => slaveProfileService.getAllProfiles(), []);
  const traitDefinitions = useMemo(() => slaveProfileService.getTraitDefinitions(), []);

  // Get the currently selected profile (with overrides applied)
  const currentProfile = useMemo(() => {
    const base = slaveProfileService.getProfile(selectedSlave.profileId, selectedSlave.profileType);
    if (!base) return null;
    return slaveProfileService.applyOverrides(base, selectedSlave.overrides || {});
  }, [selectedSlave]);

  // Handle preset selection
  const handleSelectPreset = (presetId, profileType = 'preset') => {
    setExpandedPreset(presetId);
    onChange({
      profileId: presetId,
      profileType,
      overrides: {}
    });
    setQuickEditMode(false);
  };

  // Handle quick edit changes
  const handleQuickEdit = (field, value) => {
    const newOverrides = { ...selectedSlave.overrides };
    
    if (field.startsWith('stat.')) {
      const statName = field.replace('stat.', '');
      newOverrides.baseStats = {
        ...(newOverrides.baseStats || {}),
        [statName]: value
      };
    } else if (field === 'name') {
      newOverrides.name = value;
    } else if (field === 'traits') {
      newOverrides.traits = value;
    }

    onChange({
      ...selectedSlave,
      overrides: newOverrides
    });
  };

  // Handle vulnerability matrix changes
  const handleMatrixChange = (matrix) => {
    onChange({
      ...selectedSlave,
      overrides: {
        ...selectedSlave.overrides,
        vulnerabilityMatrix: matrix
      }
    });
  };

  // Reset overrides
  const handleResetOverrides = () => {
    onChange({
      ...selectedSlave,
      overrides: {}
    });
    setQuickEditMode(false);
  };

  // Get vulnerability level color
  const getVulnColor = (value) => {
    if (value >= 80) return 'text-red-500';
    if (value >= 60) return 'text-orange-500';
    if (value >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Render stat bar
  const renderStatBar = (statName, value, editable = false) => {
    const colors = {
      obedience: 'bg-red-500',
      endurance: 'bg-amber-500',
      arousal: 'bg-pink-500',
      sensitivity: 'bg-blue-500'
    };

    return (
      <div className="flex items-center gap-2">
        <span className="w-24 text-sm text-text-secondary capitalize">{statName}:</span>
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colors[statName] || 'bg-accent-primary'} transition-all`}
            style={{ width: `${value}%` }}
          />
        </div>
        {editable ? (
          <input
            type="number"
            min="0"
            max="100"
            value={value}
            onChange={(e) => handleQuickEdit(`stat.${statName}`, parseInt(e.target.value) || 0)}
            className="w-14 px-2 py-1 text-sm bg-white/5 border border-white/10 rounded text-center"
          />
        ) : (
          <span className="w-10 text-sm text-right">{value}</span>
        )}
      </div>
    );
  };

  // Render preset card
  const renderPresetCard = (preset, type = 'preset') => {
    const isSelected = selectedSlave.profileId === preset.id && selectedSlave.profileType === type;
    const isExpanded = expandedPreset === preset.id;

    return (
      <div
        key={preset.id}
        className={`
          border rounded-lg overflow-hidden transition-all cursor-pointer
          ${isSelected 
            ? 'border-accent-primary bg-accent-primary/10' 
            : 'border-white/10 hover:border-white/30 bg-white/5'
          }
        `}
      >
        {/* Card Header */}
        <div 
          className="p-4 flex items-start gap-4"
          onClick={() => handleSelectPreset(preset.id, type)}
        >
          {/* Portrait placeholder */}
          <div className="w-16 h-20 bg-white/10 rounded flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-text-muted" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">{preset.name}</h3>
              {type === 'custom' && (
                <span className="px-2 py-0.5 text-xs bg-accent-secondary/20 text-accent-secondary rounded">
                  Custom
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">
              {preset.description}
            </p>
            
            {/* Traits */}
            <div className="flex flex-wrap gap-1 mt-2">
              {preset.traits?.slice(0, 3).map(trait => (
                <span 
                  key={trait}
                  className="px-2 py-0.5 text-xs bg-white/10 rounded"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>

          {/* Expand toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedPreset(isExpanded ? null : preset.id);
            }}
            className="p-1 text-text-secondary hover:text-white"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && isSelected && (
          <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-4">
            {/* Quick Edit Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Quick Edit Mode</span>
              <Button
                variant={quickEditMode ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setQuickEditMode(!quickEditMode)}
              >
                <Edit3 className="w-4 h-4 mr-1" />
                {quickEditMode ? 'Editing' : 'Edit'}
              </Button>
            </div>

            {/* Name (if editing) */}
            {quickEditMode && (
              <div>
                <label className="block text-sm text-text-secondary mb-1">Name</label>
                <input
                  type="text"
                  value={currentProfile?.name || ''}
                  onChange={(e) => handleQuickEdit('name', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
                  placeholder="Enter name..."
                />
              </div>
            )}

            {/* Stats */}
            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-2">Starting Stats</h4>
              <div className="space-y-2">
                {renderStatBar('obedience', currentProfile?.baseStats?.obedience || 20, quickEditMode)}
                {renderStatBar('endurance', currentProfile?.baseStats?.endurance || 50, quickEditMode)}
                {renderStatBar('arousal', currentProfile?.baseStats?.arousal || 0, quickEditMode)}
                {renderStatBar('sensitivity', currentProfile?.baseStats?.sensitivity || 30, quickEditMode)}
              </div>
            </div>

            {/* Top Vulnerabilities Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-text-secondary">Top Vulnerabilities</h4>
                <Button variant="ghost" size="sm" onClick={() => setShowMatrixModal(true)}>
                  View Full Matrix →
                </Button>
              </div>
              <div className="space-y-1">
                {getTopVulnerabilities(currentProfile?.vulnerabilityMatrix, 4).map((vuln, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                      {vuln.activity} ({vuln.bodyPart})
                    </span>
                    <span className={getVulnColor(vuln.value)}>{vuln.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Traits (if editing) */}
            {quickEditMode && (
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-2">Traits</h4>
                <div className="flex flex-wrap gap-2">
                  {traitDefinitions.map(trait => {
                    const isActive = currentProfile?.traits?.includes(trait.id);
                    return (
                      <button
                        key={trait.id}
                        onClick={() => {
                          const currentTraits = currentProfile?.traits || [];
                          const newTraits = isActive
                            ? currentTraits.filter(t => t !== trait.id)
                            : [...currentTraits, trait.id];
                          handleQuickEdit('traits', newTraits);
                        }}
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
            )}

            {/* Secret Weakness */}
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
              <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-1">
                <Sparkles className="w-4 h-4" />
                Secret Weakness
              </div>
              <p className="text-sm text-text-secondary italic">
                {preset.secretWeakness || 'Unknown...'}
              </p>
            </div>

            {/* Reset Button */}
            {Object.keys(selectedSlave.overrides || {}).length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleResetOverrides} className="w-full">
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset to Preset Defaults
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Presets Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Preset Profiles</h3>
        <div className="grid gap-4">
          {presets.map(preset => renderPresetCard(preset, 'preset'))}
        </div>
      </div>

      {/* Custom Profiles Section */}
      {custom.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Custom Profiles</h3>
          <div className="grid gap-4">
            {custom.map(profile => renderPresetCard(profile, 'custom'))}
          </div>
        </div>
      )}

      {/* Helper text */}
      <p className="text-sm text-text-muted text-center">
        💡 Changes here create a temporary copy. Create permanent custom profiles in the Admin Panel.
      </p>

      {/* Vulnerability Matrix Modal */}
      {showMatrixModal && currentProfile && (
        <VulnerabilityMatrixModal
          isOpen={showMatrixModal}
          onClose={() => setShowMatrixModal(false)}
          matrix={currentProfile.vulnerabilityMatrix}
          onChange={quickEditMode ? handleMatrixChange : undefined}
          readOnly={!quickEditMode}
        />
      )}
    </div>
  );
}

// Helper function to get top vulnerabilities
function getTopVulnerabilities(matrix, count = 5) {
  if (!matrix) return [];
  
  const all = [];
  for (const [activityId, bodyParts] of Object.entries(matrix)) {
    for (const [bodyPartId, value] of Object.entries(bodyParts)) {
      all.push({
        activity: activityId,
        bodyPart: bodyPartId,
        value
      });
    }
  }
  
  return all.sort((a, b) => b.value - a.value).slice(0, count);
}

export default SlaveSelector;
