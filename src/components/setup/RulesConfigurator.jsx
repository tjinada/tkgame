/**
 * RulesConfigurator.jsx
 * Step 3: Configure game rules and difficulty
 */

import { useState, useMemo } from 'react';
import { Settings, Zap, Eye, EyeOff, Brain, Share2, Shield, Gauge } from 'lucide-react';
import { scenarioService } from '../../services/ScenarioService';
import discoveryRules from '../../data/discoveryRules.json';

export function RulesConfigurator({ rules, onChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const difficultyPresets = useMemo(() => scenarioService.getDifficultyPresets(), []);

  // Update a nested rule value
  const updateRule = (path, value) => {
    const newRules = JSON.parse(JSON.stringify(rules));
    const parts = path.split('.');
    let current = newRules;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
    onChange(newRules);
  };

  // Apply difficulty preset
  const handleDifficultyChange = (presetId) => {
    const preset = difficultyPresets[presetId];
    if (!preset) return;
    
    // Merge preset settings with current rules
    const newRules = scenarioService.getRulesForDifficulty(presetId);
    newRules.difficulty = { ...newRules.difficulty, preset: presetId };
    onChange(newRules);
  };

  // Render toggle switch
  const renderToggle = (label, description, value, onChange, icon = null) => (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-white">{label}</span>
        </div>
        <p className="text-sm text-text-secondary mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`
          relative w-12 h-6 rounded-full transition-colors flex-shrink-0
          ${value ? 'bg-accent-primary' : 'bg-white/20'}
        `}
      >
        <div className={`
          absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
          ${value ? 'left-7' : 'left-1'}
        `} />
      </button>
    </div>
  );

  // Render select dropdown
  const renderSelect = (label, description, value, options, onChange, icon = null) => (
    <div className="py-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="font-medium text-white">{label}</span>
      </div>
      <p className="text-sm text-text-secondary mb-2">{description}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:border-accent-primary focus:outline-none"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-background-primary">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  // Render slider
  const renderSlider = (label, description, value, min, max, onChange, icon = null) => (
    <div className="py-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-white">{label}</span>
        </div>
        <span className="text-sm text-accent-primary font-medium">{value}%</span>
      </div>
      <p className="text-sm text-text-secondary mb-2">{description}</p>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-primary"
      />
      <div className="flex justify-between text-xs text-text-muted mt-1">
        <span>{min}%</span>
        <span>{max}%</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Difficulty Preset */}
      <div className="p-4 bg-white/5 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="w-5 h-5 text-accent-primary" />
          <h3 className="text-lg font-semibold text-white">Difficulty</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(difficultyPresets).map(([id, preset]) => (
            <button
              key={id}
              onClick={() => handleDifficultyChange(id)}
              className={`
                p-4 rounded-lg border text-left transition-all
                ${rules.difficulty?.preset === id 
                  ? 'border-accent-primary bg-accent-primary/10' 
                  : 'border-white/10 hover:border-white/30 bg-white/5'
                }
              `}
            >
              <h4 className="font-semibold text-white">{preset.name}</h4>
              <p className="text-xs text-text-secondary mt-1">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Discovery Settings */}
      <div className="p-4 bg-white/5 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-accent-primary" />
          <h3 className="text-lg font-semibold text-white">Discovery System</h3>
        </div>
        
        <div className="space-y-1 divide-y divide-white/5">
          {renderSelect(
            'Discovery Speed',
            'How quickly Mistresses learn your weaknesses',
            rules.discovery?.speed || 'normal',
            Object.entries(discoveryRules.discoverySpeed).map(([id, config]) => ({
              value: id,
              label: `${config.name} - ${config.description}`
            })),
            (v) => updateRule('discovery.speed', v),
            <Zap className="w-4 h-4 text-text-muted" />
          )}

          {renderSelect(
            'Knowledge Sharing',
            'How Mistresses share information about you',
            rules.discovery?.sharingMode || 'gossip',
            Object.entries(discoveryRules.sharingModes).map(([id, config]) => ({
              value: id,
              label: `${config.name} - ${config.description}`
            })),
            (v) => updateRule('discovery.sharingMode', v),
            <Share2 className="w-4 h-4 text-text-muted" />
          )}

          {renderSlider(
            'Starting Knowledge',
            'How much Mistresses already know about you at game start',
            rules.discovery?.startingKnowledge || 0,
            0, 50,
            (v) => updateRule('discovery.startingKnowledge', v),
            <Brain className="w-4 h-4 text-text-muted" />
          )}
        </div>
      </div>

      {/* Slave Options */}
      <div className="p-4 bg-white/5 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-accent-primary" />
          <h3 className="text-lg font-semibold text-white">Slave Options</h3>
        </div>
        
        <div className="space-y-1 divide-y divide-white/5">
          {renderToggle(
            'Allow Reaction Masking',
            'Attempt to hide your reactions from Mistresses (costs endurance)',
            rules.slave?.allowMasking || false,
            (v) => updateRule('slave.allowMasking', v),
            <EyeOff className="w-4 h-4 text-text-muted" />
          )}

          {rules.slave?.allowMasking && (
            <div className="pl-6 py-2 space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-sm text-text-secondary w-24">Masking DC:</span>
                <input
                  type="number"
                  min="10"
                  max="25"
                  value={rules.slave?.maskingDC || 15}
                  onChange={(e) => updateRule('slave.maskingDC', parseInt(e.target.value))}
                  className="w-20 px-2 py-1 bg-white/5 border border-white/10 rounded text-center"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-text-secondary w-24">Endurance Cost:</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={rules.slave?.maskingCost || 5}
                  onChange={(e) => updateRule('slave.maskingCost', parseInt(e.target.value))}
                  className="w-20 px-2 py-1 bg-white/5 border border-white/10 rounded text-center"
                />
              </div>
            </div>
          )}

          {renderToggle(
            'Allow Counter-Discovery',
            'Learn about Mistress weaknesses through observation',
            rules.slave?.allowCounterDiscovery ?? true,
            (v) => updateRule('slave.allowCounterDiscovery', v)
          )}

          {renderToggle(
            'Show Vulnerability Hints',
            'Display hints about which activities affect you most (easier)',
            rules.slave?.showVulnerabilityHints || false,
            (v) => updateRule('slave.showVulnerabilityHints', v)
          )}
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full p-3 bg-white/5 rounded-lg text-sm text-text-secondary hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
      >
        <Settings className="w-4 h-4" />
        {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
      </button>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Advanced Settings</h3>
          
          <div className="space-y-4">
            {/* Content Mode */}
            {renderSelect(
              'Content Mode',
              'How game content is generated',
              rules.content?.mode || 'ai',
              [
                { value: 'json-only', label: 'JSON Only - Pre-written scenarios only' },
                { value: 'ai', label: 'AI Generated - Dynamic content via AI' },
                { value: 'hybrid', label: 'Hybrid - JSON when available, AI fallback' }
              ],
              (v) => updateRule('content.mode', v)
            )}

            {/* AI Model */}
            {(rules.content?.mode === 'ai' || rules.content?.mode === 'hybrid') && (
              renderSelect(
                'AI Model',
                'Which AI model to use for content generation',
                rules.content?.model || 'chatgpt-4o-latest',
                [
                  { value: 'chatgpt-4o-latest', label: 'GPT-4o (Recommended)' },
                  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Faster)' }
                ],
                (v) => updateRule('content.model', v)
              )
            )}

            {/* Stat Change Scale */}
            <div className="py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-white">Stat Change Intensity</span>
                <span className="text-sm text-accent-primary font-medium">
                  {((rules.difficulty?.statChangeScale || 1) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-sm text-text-secondary mb-2">
                Multiplier for all stat changes from activities
              </p>
              <input
                type="range"
                min="50"
                max="200"
                value={(rules.difficulty?.statChangeScale || 1) * 100}
                onChange={(e) => updateRule('difficulty.statChangeScale', parseInt(e.target.value) / 100)}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-primary"
              />
            </div>

            {/* Vulnerability Scale */}
            <div className="py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-white">Vulnerability Impact</span>
                <span className="text-sm text-accent-primary font-medium">
                  {((rules.difficulty?.vulnerabilityScale || 1) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-sm text-text-secondary mb-2">
                How much vulnerabilities affect damage taken
              </p>
              <input
                type="range"
                min="50"
                max="200"
                value={(rules.difficulty?.vulnerabilityScale || 1) * 100}
                onChange={(e) => updateRule('difficulty.vulnerabilityScale', parseInt(e.target.value) / 100)}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-primary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RulesConfigurator;
