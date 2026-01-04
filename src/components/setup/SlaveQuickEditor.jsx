/**
 * SlaveQuickEditor.jsx
 * Inline editor for quick slave profile customization
 */

import { useState } from 'react';
import { Sliders, Grid3X3 } from 'lucide-react';
import { Button } from '../ui/Button';
import { VulnerabilityMatrixModal } from './VulnerabilityMatrixModal';

export function SlaveQuickEditor({ profile, overrides, onChange }) {
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  // Get current value (override or base)
  const getValue = (path) => {
    const parts = path.split('.');
    let overrideValue = overrides;
    let baseValue = profile;
    
    for (const part of parts) {
      overrideValue = overrideValue?.[part];
      baseValue = baseValue?.[part];
    }
    
    return overrideValue !== undefined ? overrideValue : baseValue;
  };

  // Set override value
  const setValue = (path, value) => {
    const parts = path.split('.');
    const newOverrides = JSON.parse(JSON.stringify(overrides || {}));
    
    let current = newOverrides;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    
    onChange(newOverrides);
  };

  // Handle stat change
  const handleStatChange = (stat, value) => {
    setValue(`baseStats.${stat}`, Math.max(0, Math.min(100, parseInt(value) || 0)));
  };

  // Handle name change
  const handleNameChange = (name) => {
    setValue('name', name);
  };

  // Handle matrix update from modal
  const handleMatrixUpdate = (newMatrix) => {
    onChange({
      ...overrides,
      vulnerabilityMatrix: newMatrix
    });
  };

  const stats = [
    { id: 'obedience', label: 'Obedience', color: '#ef4444' },
    { id: 'endurance', label: 'Endurance', color: '#f59e0b' },
    { id: 'arousal', label: 'Arousal', color: '#ec4899' },
    { id: 'sensitivity', label: 'Sensitivity', color: '#3b82f6' }
  ];

  // Get top vulnerabilities for preview
  const topVulns = getTopVulnerabilities(
    overrides?.vulnerabilityMatrix || profile.vulnerabilityMatrix,
    4
  );

  return (
    <div className="space-y-6 p-4 rounded-lg bg-background-secondary border border-white/10">
      {/* Name Override */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Character Name
        </label>
        <input
          type="text"
          value={getValue('name') || ''}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder={profile.name}
          className="w-full px-3 py-2 rounded-lg bg-background-primary border border-white/10 
                     text-white placeholder-text-muted focus:border-accent-primary focus:outline-none"
        />
      </div>

      {/* Stats */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          <Sliders className="w-4 h-4 inline mr-2" />
          Starting Stats
        </label>
        <div className="grid grid-cols-2 gap-4">
          {stats.map(stat => {
            const value = getValue(`baseStats.${stat.id}`);
            const baseValue = profile.baseStats[stat.id];
            const isModified = overrides?.baseStats?.[stat.id] !== undefined;
            
            return (
              <div key={stat.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-secondary">{stat.label}</span>
                  <div className="flex items-center gap-2">
                    {isModified && (
                      <span className="text-xs text-text-muted">({baseValue})</span>
                    )}
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={value}
                      onChange={(e) => handleStatChange(stat.id, e.target.value)}
                      className="w-16 px-2 py-1 text-sm text-center rounded bg-background-primary 
                                 border border-white/10 text-white focus:border-accent-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${value}%`,
                      backgroundColor: stat.color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Vulnerabilities Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-text-secondary">
            <Grid3X3 className="w-4 h-4 inline mr-2" />
            Top Vulnerabilities
          </label>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setShowMatrixModal(true)}
          >
            Edit Full Matrix
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {topVulns.map((vuln, i) => (
            <div 
              key={i}
              className="flex items-center justify-between p-2 rounded bg-background-primary"
            >
              <span className="text-sm text-text-secondary truncate">
                {formatActivityName(vuln.activity)} ({formatBodyPart(vuln.bodyPart)})
              </span>
              <VulnerabilityBadge value={vuln.value} />
            </div>
          ))}
        </div>
      </div>

      {/* Traits Display */}
      {profile.traits?.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Traits
          </label>
          <div className="flex flex-wrap gap-2">
            {profile.traits.map(trait => (
              <span 
                key={trait}
                className="px-3 py-1 text-sm rounded-full bg-white/10 text-text-secondary"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Matrix Modal */}
      <VulnerabilityMatrixModal
        isOpen={showMatrixModal}
        onClose={() => setShowMatrixModal(false)}
        matrix={overrides?.vulnerabilityMatrix || profile.vulnerabilityMatrix}
        onChange={handleMatrixUpdate}
      />
    </div>
  );
}

// Helper components
function VulnerabilityBadge({ value }) {
  let color = 'bg-gray-500';
  if (value >= 80) color = 'bg-red-500';
  else if (value >= 60) color = 'bg-orange-500';
  else if (value >= 40) color = 'bg-yellow-500';
  else if (value >= 20) color = 'bg-green-500';
  
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${color} text-white`}>
      {value}
    </span>
  );
}

// Helpers
function getTopVulnerabilities(matrix, count = 5) {
  if (!matrix) return [];
  
  const all = [];
  for (const [activityId, bodyParts] of Object.entries(matrix)) {
    for (const [bodyPartId, value] of Object.entries(bodyParts)) {
      all.push({ activity: activityId, bodyPart: bodyPartId, value });
    }
  }
  
  return all.sort((a, b) => b.value - a.value).slice(0, count);
}

function formatActivityName(id) {
  const names = {
    tickling: 'Tickling',
    footWorship: 'Foot Worship',
    sweatWorship: 'Sweat Worship',
    edging: 'Edging',
    postOrgasmTorture: 'POT',
    humiliation: 'Humiliation',
    bondage: 'Bondage'
  };
  return names[id] || id;
}

function formatBodyPart(id) {
  const names = {
    feet: 'Feet',
    armpits: 'Armpits',
    ribs: 'Ribs',
    neck: 'Neck',
    stomach: 'Stomach',
    innerThighs: 'Thighs',
    back: 'Back',
    chest: 'Chest',
    groin: 'Groin',
    fullBody: 'Full',
    any: 'Any'
  };
  return names[id] || id;
}

export default SlaveQuickEditor;
