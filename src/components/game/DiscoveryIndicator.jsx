/**
 * DiscoveryIndicator.jsx
 * Single NPC knowledge indicator
 */

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, User, Crown } from 'lucide-react';
import discoveryRules from '../../data/discoveryRules.json';
import activitiesData from '../../data/activities.json';
import bodyPartsData from '../../data/bodyParts.json';

export function DiscoveryIndicator({ npc, knowledge }) {
  const [expanded, setExpanded] = useState(false);

  // Index activities and body parts
  const activities = useMemo(() => {
    const index = {};
    for (const a of activitiesData.activities) {
      index[a.id] = a;
    }
    return index;
  }, []);

  const bodyParts = useMemo(() => {
    const index = {};
    for (const bp of bodyPartsData.bodyParts) {
      index[bp.id] = bp;
    }
    return index;
  }, []);

  // Calculate overall knowledge score
  const overallScore = knowledge?.overallScore || 0;

  // Get knowledge state
  const getOverallState = (score) => {
    for (const [state, config] of Object.entries(discoveryRules.overallKnowledgeStates)) {
      if (score >= config.minScore && score <= config.maxScore) {
        return { state, ...config };
      }
    }
    return { state: 'unaware', ...discoveryRules.overallKnowledgeStates.unaware };
  };

  const overallState = getOverallState(overallScore);

  // Get knowledge level for a specific item
  const getKnowledgeLevel = (confidence) => {
    for (const level of Object.values(discoveryRules.knowledgeLevels)) {
      if (confidence >= level.minConfidence && confidence <= level.maxConfidence) {
        return level;
      }
    }
    return discoveryRules.knowledgeLevels.unaware;
  };

  // Categorize knowledge items
  const categorizedKnowledge = useMemo(() => {
    const categories = { suspicious: [], confirmed: [], mastered: [] };
    
    if (!knowledge?.activities) return categories;
    
    for (const [key, data] of Object.entries(knowledge.activities)) {
      const [activityId, bodyPartId] = key.split('_');
      const level = getKnowledgeLevel(data.confidence);
      
      const item = {
        key,
        activityId,
        bodyPartId,
        activityName: activities[activityId]?.name || activityId,
        bodyPartName: bodyParts[bodyPartId]?.name || bodyPartId,
        confidence: data.confidence,
        level
      };
      
      if (level.id === 'suspicious') categories.suspicious.push(item);
      else if (level.id === 'confirmed') categories.confirmed.push(item);
      else if (level.id === 'mastered') categories.mastered.push(item);
    }
    
    return categories;
  }, [knowledge, activities, bodyParts]);

  const hasAnyKnowledge = 
    categorizedKnowledge.suspicious.length > 0 ||
    categorizedKnowledge.confirmed.length > 0 ||
    categorizedKnowledge.mastered.length > 0;

  // Render knowledge item
  const renderKnowledgeItem = (item) => (
    <div 
      key={item.key}
      className="flex items-center justify-between text-xs py-1"
    >
      <span className="text-text-secondary">
        {item.activityName}
        {item.bodyPartId && item.bodyPartId !== 'any' && item.bodyPartId !== 'fullBody' && (
          <span className="text-text-muted"> ({item.bodyPartName})</span>
        )}
      </span>
      <span style={{ color: item.level.color }}>
        {item.level.icon} {item.confidence}%
      </span>
    </div>
  );

  return (
    <div className="bg-white/5 rounded-lg overflow-hidden">
      {/* Header bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-2 flex items-center gap-3 hover:bg-white/5 transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
          {npc.isRequired ? (
            <Crown className="w-4 h-4 text-amber-500" />
          ) : (
            <User className="w-4 h-4 text-text-muted" />
          )}
        </div>

        {/* Name and state */}
        <div className="flex-1 text-left min-w-0">
          <div className="font-medium text-white text-sm truncate">{npc.name}</div>
          <div 
            className="text-xs"
            style={{ color: overallState.color }}
          >
            {overallState.label}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-24 flex-shrink-0">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all"
              style={{ 
                width: `${overallScore}%`,
                backgroundColor: overallState.color
              }}
            />
          </div>
        </div>

        {/* Quick counts */}
        <div className="flex items-center gap-1 text-xs w-20 justify-end">
          {categorizedKnowledge.mastered.length > 0 && (
            <span className="text-red-600">★{categorizedKnowledge.mastered.length}</span>
          )}
          {categorizedKnowledge.confirmed.length > 0 && (
            <span className="text-red-400">✓{categorizedKnowledge.confirmed.length}</span>
          )}
          {categorizedKnowledge.suspicious.length > 0 && (
            <span className="text-amber-400">🔍{categorizedKnowledge.suspicious.length}</span>
          )}
        </div>

        {/* Expand icon */}
        {hasAnyKnowledge && (
          expanded ? (
            <ChevronUp className="w-4 h-4 text-text-secondary flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-secondary flex-shrink-0" />
          )
        )}
      </button>

      {/* Expanded details */}
      {expanded && hasAnyKnowledge && (
        <div className="px-3 pb-3 space-y-2">
          {/* Mastered */}
          {categorizedKnowledge.mastered.length > 0 && (
            <div className="p-2 bg-red-500/10 rounded border border-red-500/20">
              <div className="text-xs font-medium text-red-400 mb-1 flex items-center gap-1">
                <span>★</span> Mastered ({categorizedKnowledge.mastered.length})
              </div>
              {categorizedKnowledge.mastered.map(renderKnowledgeItem)}
            </div>
          )}

          {/* Confirmed */}
          {categorizedKnowledge.confirmed.length > 0 && (
            <div className="p-2 bg-orange-500/10 rounded border border-orange-500/20">
              <div className="text-xs font-medium text-orange-400 mb-1 flex items-center gap-1">
                <span>✓</span> Confirmed ({categorizedKnowledge.confirmed.length})
              </div>
              {categorizedKnowledge.confirmed.map(renderKnowledgeItem)}
            </div>
          )}

          {/* Suspicious */}
          {categorizedKnowledge.suspicious.length > 0 && (
            <div className="p-2 bg-amber-500/10 rounded border border-amber-500/20">
              <div className="text-xs font-medium text-amber-400 mb-1 flex items-center gap-1">
                <span>🔍</span> Suspicious ({categorizedKnowledge.suspicious.length})
              </div>
              {categorizedKnowledge.suspicious.map(renderKnowledgeItem)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DiscoveryIndicator;
