/**
 * ScenarioList.jsx
 * Quick start scenario selection for main menu
 */

import { useState, useMemo } from 'react';
import { Play, Edit3, Trash2, Star, StarOff, Plus, Download, Upload, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { scenarioService } from '../../services/ScenarioService';
import { slaveProfileService } from '../../services/SlaveProfileService';
import { npcProfileService } from '../../services/NpcProfileService';

export function ScenarioList({ onSelectScenario, onCreateNew }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { default: defaultScenarios, custom: customScenarios } = useMemo(
    () => scenarioService.getAllScenarios(),
    []
  );

  const allTags = useMemo(() => scenarioService.getAllTags(), []);

  // Filter scenarios
  const filteredScenarios = useMemo(() => {
    let scenarios = [...defaultScenarios, ...customScenarios];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      scenarios = scenarios.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
      );
    }
    
    if (selectedTag) {
      scenarios = scenarios.filter(s => s.tags?.includes(selectedTag));
    }
    
    // Sort: favorites first, then by name
    return scenarios.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [defaultScenarios, customScenarios, searchQuery, selectedTag]);

  // Handle favorite toggle
  const handleToggleFavorite = (e, scenarioId) => {
    e.stopPropagation();
    scenarioService.toggleFavorite(scenarioId);
    // Force re-render
    window.location.reload(); // Simple approach - in production use state management
  };

  // Handle delete
  const handleDelete = (e, scenarioId) => {
    e.stopPropagation();
    if (confirmDelete === scenarioId) {
      scenarioService.deleteScenario(scenarioId);
      setConfirmDelete(null);
      window.location.reload();
    } else {
      setConfirmDelete(scenarioId);
    }
  };

  // Handle play
  const handlePlay = (scenario) => {
    try {
      const gameConfig = scenarioService.buildGameConfig(scenario.id);
      onSelectScenario(gameConfig);
    } catch (error) {
      console.error('Failed to load scenario:', error);
      alert(`Failed to load scenario: ${error.message}`);
    }
  };

  // Get scenario preview info
  const getPreviewInfo = (scenario) => {
    const slaveName = (() => {
      const profile = slaveProfileService.getProfile(
        scenario.slave?.profileId,
        scenario.slave?.profileType || 'preset'
      );
      return profile?.name || 'Unknown';
    })();

    const npcCount = scenario.npcs?.length || 0;
    const difficulty = scenario.rules?.difficulty || 'balanced';

    return { slaveName, npcCount, difficulty };
  };

  // Render scenario card
  const renderScenarioCard = (scenario) => {
    const { slaveName, npcCount, difficulty } = getPreviewInfo(scenario);
    const isConfirmingDelete = confirmDelete === scenario.id;

    return (
      <div
        key={scenario.id}
        className={`
          relative p-4 bg-white/5 border rounded-lg hover:bg-white/10 transition-all cursor-pointer
          ${scenario.isFavorite ? 'border-amber-500/50' : 'border-white/10 hover:border-white/30'}
        `}
        onClick={() => handlePlay(scenario)}
      >
        {/* Favorite star */}
        <button
          onClick={(e) => handleToggleFavorite(e, scenario.id)}
          className="absolute top-2 right-2 p-1 text-amber-500 hover:text-amber-400"
        >
          {scenario.isFavorite ? (
            <Star className="w-4 h-4 fill-current" />
          ) : (
            <StarOff className="w-4 h-4" />
          )}
        </button>

        {/* Content */}
        <div className="pr-8">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-white">{scenario.name}</h4>
            {scenario.isDefault && (
              <span className="px-1.5 py-0.5 text-xs bg-accent-primary/20 text-accent-primary rounded">
                Default
              </span>
            )}
          </div>
          
          <p className="text-sm text-text-secondary line-clamp-2 mb-3">
            {scenario.description}
          </p>

          {/* Quick info */}
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span>🎭 {slaveName}</span>
            <span>👑 {npcCount} Mistresses</span>
            <span className={`
              px-1.5 py-0.5 rounded capitalize
              ${difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                difficulty === 'balanced' ? 'bg-blue-500/20 text-blue-400' :
                difficulty === 'hard' ? 'bg-orange-500/20 text-orange-400' :
                'bg-red-500/20 text-red-400'}
            `}>
              {difficulty}
            </span>
          </div>

          {/* Tags */}
          {scenario.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {scenario.tags.slice(0, 3).map(tag => (
                <span 
                  key={tag}
                  className="px-1.5 py-0.5 text-xs bg-white/10 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              handlePlay(scenario);
            }}
          >
            <Play className="w-4 h-4 mr-1" />
            Play
          </Button>
          
          {!scenario.isDefault && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Open edit modal
                }}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                variant={isConfirmingDelete ? 'danger' : 'ghost'}
                size="sm"
                onClick={(e) => handleDelete(e, scenario.id)}
              >
                <Trash2 className="w-4 h-4" />
                {isConfirmingDelete && <span className="ml-1">Confirm</span>}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scenarios..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:border-accent-primary focus:outline-none"
          />
        </div>
        
        <Button variant="primary" onClick={onCreateNew}>
          <Plus className="w-4 h-4 mr-1" />
          New Game
        </Button>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag(null)}
            className={`
              px-3 py-1 text-sm rounded-full transition-colors
              ${selectedTag === null 
                ? 'bg-accent-primary text-white' 
                : 'bg-white/10 text-text-secondary hover:bg-white/20'}
            `}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`
                px-3 py-1 text-sm rounded-full transition-colors capitalize
                ${selectedTag === tag 
                  ? 'bg-accent-primary text-white' 
                  : 'bg-white/10 text-text-secondary hover:bg-white/20'}
              `}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Scenario grid */}
      {filteredScenarios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScenarios.map(scenario => renderScenarioCard(scenario))}
        </div>
      ) : (
        <div className="text-center py-12 text-text-muted">
          <p>No scenarios found</p>
          <Button variant="ghost" className="mt-2" onClick={onCreateNew}>
            Create your first scenario
          </Button>
        </div>
      )}
    </div>
  );
}

export default ScenarioList;
