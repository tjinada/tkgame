/**
 * SetupReview.jsx
 * Step 4: Review game setup and optionally save as scenario
 */

import { useMemo } from 'react';
import { User, Users, Settings, Save, Crown, Sparkles, AlertTriangle } from 'lucide-react';
import { slaveProfileService } from '../../services/SlaveProfileService';
import { npcProfileService } from '../../services/NpcProfileService';
import { scenarioService } from '../../services/ScenarioService';

export function SetupReview({ 
  setupData, 
  saveAsScenario, 
  onSaveAsScenarioChange, 
  scenarioName, 
  onScenarioNameChange 
}) {
  // Resolve slave profile
  const slaveProfile = useMemo(() => {
    const base = slaveProfileService.getProfile(
      setupData.slave.profileId,
      setupData.slave.profileType || 'preset'
    );
    if (!base) return null;
    return slaveProfileService.applyOverrides(base, setupData.slave.overrides || {});
  }, [setupData.slave]);

  // Resolve NPC profiles
  const npcProfiles = useMemo(() => {
    return setupData.npcs
      .map(ref => npcProfileService.getNpc(ref.profileId))
      .filter(Boolean);
  }, [setupData.npcs]);

  // Get difficulty preset info
  const difficultyInfo = useMemo(() => {
    const presets = scenarioService.getDifficultyPresets();
    return presets[setupData.rules?.difficulty?.preset] || { name: 'Custom', description: 'Custom settings' };
  }, [setupData.rules]);

  // Check for potential issues
  const warnings = useMemo(() => {
    const warns = [];
    
    if (npcProfiles.length === 1) {
      warns.push('Only one Mistress selected - consider adding more variety');
    }
    
    if (setupData.rules?.discovery?.sharingMode === 'hivemind' && 
        setupData.rules?.discovery?.speed === 'fast') {
      warns.push('Hivemind + Fast discovery is very challenging');
    }
    
    if (setupData.rules?.discovery?.startingKnowledge > 25) {
      warns.push('Mistresses start with significant knowledge of your weaknesses');
    }
    
    return warns;
  }, [npcProfiles, setupData.rules]);

  // Render stat bar
  const renderStatBar = (label, value, color) => (
    <div className="flex items-center gap-2">
      <span className="w-20 text-xs text-text-secondary">{label}</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-xs text-right">{value}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-amber-500 font-medium mb-2">
            <AlertTriangle className="w-5 h-5" />
            Heads Up
          </div>
          <ul className="space-y-1">
            {warnings.map((warn, i) => (
              <li key={i} className="text-sm text-amber-200/80">• {warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Slave Summary */}
      <div className="p-4 bg-white/5 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-accent-primary" />
          <h3 className="text-lg font-semibold text-white">Your Character</h3>
        </div>

        {slaveProfile ? (
          <div className="flex gap-4">
            {/* Portrait placeholder */}
            <div className="w-24 h-32 bg-white/10 rounded flex items-center justify-center flex-shrink-0">
              <User className="w-10 h-10 text-text-muted" />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-semibold text-white">{slaveProfile.name}</h4>
                <p className="text-sm text-text-secondary">{slaveProfile.description}</p>
              </div>

              {/* Stats */}
              <div className="space-y-1">
                {renderStatBar('Obedience', slaveProfile.baseStats?.obedience || 20, 'bg-red-500')}
                {renderStatBar('Endurance', slaveProfile.baseStats?.endurance || 50, 'bg-amber-500')}
                {renderStatBar('Arousal', slaveProfile.baseStats?.arousal || 0, 'bg-pink-500')}
                {renderStatBar('Sensitivity', slaveProfile.baseStats?.sensitivity || 30, 'bg-blue-500')}
              </div>

              {/* Traits */}
              <div className="flex flex-wrap gap-1">
                {slaveProfile.traits?.map(trait => (
                  <span key={trait} className="px-2 py-0.5 text-xs bg-white/10 rounded">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-text-secondary">No slave profile selected</p>
        )}
      </div>

      {/* Mistresses Summary */}
      <div className="p-4 bg-white/5 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-accent-primary" />
          <h3 className="text-lg font-semibold text-white">
            Mistresses ({npcProfiles.length})
          </h3>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {npcProfiles.map(npc => (
            <div 
              key={npc.id}
              className="text-center p-2 bg-white/5 rounded-lg"
            >
              <div className="w-12 h-12 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-2">
                {npc.isRequired ? (
                  <Crown className="w-6 h-6 text-amber-500" />
                ) : (
                  <User className="w-6 h-6 text-text-muted" />
                )}
              </div>
              <h4 className="text-sm font-medium text-white truncate">{npc.name}</h4>
              <p className="text-xs text-text-secondary truncate">{npc.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rules Summary */}
      <div className="p-4 bg-white/5 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-accent-primary" />
          <h3 className="text-lg font-semibold text-white">Game Rules</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-text-muted">Difficulty</span>
            <p className="text-white font-medium">{difficultyInfo.name}</p>
          </div>
          <div>
            <span className="text-xs text-text-muted">Discovery Speed</span>
            <p className="text-white font-medium capitalize">
              {setupData.rules?.discovery?.speed || 'Normal'}
            </p>
          </div>
          <div>
            <span className="text-xs text-text-muted">Knowledge Sharing</span>
            <p className="text-white font-medium capitalize">
              {setupData.rules?.discovery?.sharingMode || 'Gossip'}
            </p>
          </div>
          <div>
            <span className="text-xs text-text-muted">Starting Knowledge</span>
            <p className="text-white font-medium">
              {setupData.rules?.discovery?.startingKnowledge || 0}%
            </p>
          </div>
          <div>
            <span className="text-xs text-text-muted">Reaction Masking</span>
            <p className="text-white font-medium">
              {setupData.rules?.slave?.allowMasking ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <div>
            <span className="text-xs text-text-muted">Content Mode</span>
            <p className="text-white font-medium capitalize">
              {setupData.rules?.content?.mode || 'AI'}
            </p>
          </div>
        </div>
      </div>

      {/* Flavor Text */}
      <div className="p-4 bg-accent-primary/10 border border-accent-primary/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white italic">
              "You stand at the entrance of Sandy's domain. {npcProfiles.length > 1 
                ? `${npcProfiles.length} Mistresses await` 
                : 'The Head Mistress awaits'} inside, each with her own methods of breaking you down. 
              Your vulnerabilities are {setupData.rules?.discovery?.startingKnowledge > 0 
                ? 'partially known' 
                : 'yet to be discovered'}. 
              There is no escape, only surrender."
            </p>
          </div>
        </div>
      </div>

      {/* Save as Scenario Option */}
      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={saveAsScenario}
            onChange={(e) => onSaveAsScenarioChange(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-white/30 bg-white/5 text-accent-primary focus:ring-accent-primary"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4 text-text-secondary" />
              <span className="font-medium text-white">Save as Scenario</span>
            </div>
            <p className="text-sm text-text-secondary mt-0.5">
              Save this setup for quick replay later
            </p>
          </div>
        </label>

        {saveAsScenario && (
          <div className="mt-4 pl-7">
            <label className="block text-sm text-text-secondary mb-1">
              Scenario Name
            </label>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => onScenarioNameChange(e.target.value)}
              placeholder="My Custom Scenario"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-text-muted focus:border-accent-primary focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default SetupReview;
