/**
 * NpcSelector.jsx
 * Step 2: Select Mistresses for the game
 */

import { useState, useMemo } from 'react';
import { User, Lock, Check, Info, Crown, Sparkles } from 'lucide-react';
import { npcProfileService } from '../../services/NpcProfileService';
import activitiesData from '../../data/activities.json';

export function NpcSelector({ selectedNpcs, onChange }) {
  const [hoveredNpc, setHoveredNpc] = useState(null);

  const { default: defaultNpcs, custom: customNpcs } = useMemo(
    () => npcProfileService.getAllNpcs(),
    []
  );

  const activities = useMemo(() => {
    const index = {};
    for (const activity of activitiesData.activities) {
      index[activity.id] = activity;
    }
    return index;
  }, []);

  // Check if NPC is selected
  const isSelected = (npcId) => {
    return selectedNpcs.some(n => n.profileId === npcId);
  };

  // Toggle NPC selection
  const handleToggle = (npcId, isRequired = false) => {
    if (isRequired) return; // Can't unselect required NPCs
    
    if (isSelected(npcId)) {
      onChange(selectedNpcs.filter(n => n.profileId !== npcId));
    } else {
      onChange([...selectedNpcs, { profileId: npcId, required: false }]);
    }
  };

  // Quick select presets
  const handleQuickSelect = (preset) => {
    const sandy = { profileId: 'sandy', required: true };
    
    switch (preset) {
      case 'all':
        onChange([
          sandy,
          { profileId: 'araph' },
          { profileId: 'nancy' },
          { profileId: 'aish' },
          { profileId: 'gaya' },
          { profileId: 'melissa' },
          ...customNpcs.map(n => ({ profileId: n.id }))
        ]);
        break;
      case 'tickle':
        onChange([sandy, { profileId: 'araph' }, { profileId: 'melissa' }]);
        break;
      case 'worship':
        onChange([sandy, { profileId: 'nancy' }, { profileId: 'aish' }]);
        break;
      case 'sexual':
        onChange([sandy, { profileId: 'gaya' }, { profileId: 'melissa' }]);
        break;
      case 'clear':
        onChange([sandy]); // Sandy is always required
        break;
      default:
        break;
    }
  };

  // Calculate activity coverage
  const getCoverage = () => {
    const coverage = {};
    
    for (const npcRef of selectedNpcs) {
      const npc = npcProfileService.getNpc(npcRef.profileId);
      if (!npc) continue;
      
      for (const specialty of npc.specialties || []) {
        if (!coverage[specialty]) {
          coverage[specialty] = 0;
        }
        coverage[specialty]++;
      }
    }
    
    return coverage;
  };

  const coverage = getCoverage();

  // Render NPC card
  const renderNpcCard = (npc, isRequired = false) => {
    const selected = isSelected(npc.id);

    return (
      <div
        key={npc.id}
        className={`
          relative border rounded-lg overflow-hidden transition-all cursor-pointer
          ${selected 
            ? 'border-accent-primary bg-accent-primary/10' 
            : 'border-white/10 hover:border-white/30 bg-white/5'
          }
          ${isRequired ? 'ring-2 ring-amber-500/50' : ''}
        `}
        onClick={() => handleToggle(npc.id, isRequired)}
        onMouseEnter={() => setHoveredNpc(npc.id)}
        onMouseLeave={() => setHoveredNpc(null)}
      >
        {/* Selection indicator */}
        <div className={`
          absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center
          ${selected ? 'bg-accent-primary' : 'bg-white/10'}
        `}>
          {isRequired ? (
            <Lock className="w-3 h-3 text-amber-500" />
          ) : selected ? (
            <Check className="w-4 h-4 text-white" />
          ) : null}
        </div>

        {/* Portrait placeholder */}
        <div className="w-full aspect-[3/4] bg-white/10 flex items-center justify-center">
          {npc.role === 'headMistress' ? (
            <Crown className="w-12 h-12 text-amber-500" />
          ) : (
            <User className="w-12 h-12 text-text-muted" />
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h4 className="font-semibold text-white truncate">{npc.name}</h4>
          <p className="text-xs text-text-secondary truncate">{npc.title}</p>
          
          {/* Specialties */}
          <div className="flex flex-wrap gap-1 mt-2">
            {npc.specialties?.slice(0, 2).map(spec => {
              const activity = activities[spec];
              return (
                <span 
                  key={spec}
                  className="px-1.5 py-0.5 text-xs bg-white/10 rounded truncate"
                  title={activity?.name || spec}
                >
                  {activity?.name || spec}
                </span>
              );
            })}
          </div>
        </div>

        {/* Hover details */}
        {hoveredNpc === npc.id && (
          <div className="absolute inset-0 bg-black/90 p-3 flex flex-col overflow-y-auto">
            <h4 className="font-semibold text-white">{npc.name}</h4>
            <p className="text-xs text-accent-primary">{npc.title}</p>
            <p className="text-xs text-text-secondary mt-2 flex-1">
              {npc.description}
            </p>
            
            {/* Perks preview */}
            {npc.perks?.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-amber-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Perks:
                </div>
                <div className="text-xs text-text-secondary">
                  {npc.perks.map(p => p.name).join(', ')}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Required NPCs Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-amber-500" />
          <h3 className="text-lg font-semibold text-white">Required</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {defaultNpcs.filter(n => n.isRequired).map(npc => renderNpcCard(npc, true))}
        </div>
        <p className="text-xs text-text-muted mt-2">
          Sandy is always required as the Head Mistress
        </p>
      </div>

      {/* Quick Select Buttons */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white/5 rounded-lg">
        <span className="text-sm text-text-secondary">Quick Select:</span>
        <button
          onClick={() => handleQuickSelect('all')}
          className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded transition-colors"
        >
          All Default
        </button>
        <button
          onClick={() => handleQuickSelect('tickle')}
          className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded transition-colors"
        >
          Tickle Focus
        </button>
        <button
          onClick={() => handleQuickSelect('worship')}
          className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded transition-colors"
        >
          Worship Focus
        </button>
        <button
          onClick={() => handleQuickSelect('sexual')}
          className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded transition-colors"
        >
          Edge/POT Focus
        </button>
        <button
          onClick={() => handleQuickSelect('clear')}
          className="px-3 py-1 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Available Mistresses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Available Mistresses</h3>
          <span className="text-sm text-text-secondary">
            Selected: {selectedNpcs.length}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {defaultNpcs.filter(n => !n.isRequired).map(npc => renderNpcCard(npc))}
        </div>
      </div>

      {/* Custom NPCs */}
      {customNpcs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Custom Mistresses</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {customNpcs.map(npc => renderNpcCard(npc))}
          </div>
        </div>
      )}

      {/* Coverage Indicator */}
      <div className="p-4 bg-white/5 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-text-secondary" />
          <h4 className="text-sm font-medium text-white">Activity Coverage</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {['tickling', 'footWorship', 'sweatWorship', 'edging', 'postOrgasmTorture', 'humiliation'].map(activityId => {
            const count = coverage[activityId] || 0;
            const activity = activities[activityId];
            
            return (
              <div 
                key={activityId}
                className={`
                  px-3 py-1.5 rounded text-sm flex items-center gap-2
                  ${count > 0 ? 'bg-accent-primary/20 text-accent-primary' : 'bg-white/5 text-text-muted'}
                `}
              >
                <span>{activity?.name || activityId}</span>
                <span className="font-bold">
                  {'★'.repeat(Math.min(count, 3))}
                  {'☆'.repeat(Math.max(0, 3 - count))}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-text-muted mt-2">
          More stars = more Mistresses specializing in that activity
        </p>
      </div>
    </div>
  );
}

export default NpcSelector;
