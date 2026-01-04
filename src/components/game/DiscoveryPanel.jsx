/**
 * DiscoveryPanel.jsx
 * Dashboard panel showing NPC knowledge status
 */

import { useState, useMemo } from 'react';
import { Eye, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { DiscoveryIndicator } from './DiscoveryIndicator';
import { npcProfileService } from '../../services/NpcProfileService';
import discoveryRules from '../../data/discoveryRules.json';

export function DiscoveryPanel({ npcKnowledge, npcIds, compact = false }) {
  const [expanded, setExpanded] = useState(false);

  // Get overall danger level across all NPCs
  const overallDanger = useMemo(() => {
    if (!npcKnowledge || !npcIds?.length) return 'unaware';
    
    let maxScore = 0;
    for (const npcId of npcIds) {
      const score = npcKnowledge[npcId]?.overallScore || 0;
      if (score > maxScore) maxScore = score;
    }
    
    for (const [state, config] of Object.entries(discoveryRules.overallKnowledgeStates)) {
      if (maxScore >= config.minScore && maxScore <= config.maxScore) {
        return state;
      }
    }
    return 'unaware';
  }, [npcKnowledge, npcIds]);

  const dangerConfig = discoveryRules.overallKnowledgeStates[overallDanger];

  // Count discoveries by level
  const discoveryCounts = useMemo(() => {
    const counts = { suspicious: 0, confirmed: 0, mastered: 0 };
    
    if (!npcKnowledge) return counts;
    
    for (const npcId of npcIds || []) {
      const knowledge = npcKnowledge[npcId]?.activities || {};
      for (const data of Object.values(knowledge)) {
        if (data.confidence >= 80) counts.mastered++;
        else if (data.confidence >= 50) counts.confirmed++;
        else if (data.confidence >= 25) counts.suspicious++;
      }
    }
    
    return counts;
  }, [npcKnowledge, npcIds]);

  if (!npcIds?.length) {
    return null;
  }

  // Compact view for dashboard
  if (compact) {
    return (
      <div className="p-2 bg-white/5 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" style={{ color: dangerConfig?.color }} />
            <span className="text-sm font-medium text-white">Discovery</span>
          </div>
          <span 
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={{ 
              backgroundColor: `${dangerConfig?.color}20`,
              color: dangerConfig?.color
            }}
          >
            {dangerConfig?.label}
          </span>
        </div>
        
        {/* Quick counts */}
        <div className="flex items-center gap-3 text-xs">
          {discoveryCounts.mastered > 0 && (
            <span className="text-red-400">★ {discoveryCounts.mastered}</span>
          )}
          {discoveryCounts.confirmed > 0 && (
            <span className="text-orange-400">✓ {discoveryCounts.confirmed}</span>
          )}
          {discoveryCounts.suspicious > 0 && (
            <span className="text-amber-400">🔍 {discoveryCounts.suspicious}</span>
          )}
          {discoveryCounts.mastered + discoveryCounts.confirmed + discoveryCounts.suspicious === 0 && (
            <span className="text-text-muted">No discoveries yet</span>
          )}
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className="bg-white/5 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${dangerConfig?.color}20` }}
          >
            <Eye className="w-4 h-4" style={{ color: dangerConfig?.color }} />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-white">Discovery Status</h3>
            <p className="text-xs text-text-secondary">
              {dangerConfig?.label} - What they know about you
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Warning indicator */}
          {(overallDanger === 'dangerous' || overallDanger === 'devastating') && (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
          
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="p-3 pt-0 space-y-3">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-text-muted pb-2 border-b border-white/10">
            <span className="flex items-center gap-1">
              <span className="text-amber-400">🔍</span> Suspicious
            </span>
            <span className="flex items-center gap-1">
              <span className="text-red-400">✓</span> Confirmed
            </span>
            <span className="flex items-center gap-1">
              <span className="text-red-600">★</span> Mastered
            </span>
          </div>

          {/* Per-NPC breakdown */}
          <div className="space-y-2">
            {npcIds.map(npcId => {
              const npc = npcProfileService.getNpc(npcId);
              if (!npc) return null;
              
              return (
                <DiscoveryIndicator
                  key={npcId}
                  npc={npc}
                  knowledge={npcKnowledge?.[npcId]}
                />
              );
            })}
          </div>

          {/* Tip */}
          <p className="text-xs text-text-muted italic pt-2 border-t border-white/10">
            💡 Mistresses learn your weaknesses through your reactions. High vulnerability + strong reaction = faster discovery.
          </p>
        </div>
      )}
    </div>
  );
}

export default DiscoveryPanel;
