/**
 * ScenarioManagerTab.jsx
 * Admin tab for managing saved scenarios
 */

import { useState, useMemo } from 'react';
import { 
  Plus, Edit3, Trash2, Copy, Star, StarOff, 
  Upload, Download, Play, Search, Filter 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { scenarioService } from '../../services/ScenarioService';
import { slaveProfileService } from '../../services/SlaveProfileService';

export function ScenarioManagerTab({ onPlayScenario }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingScenario, setEditingScenario] = useState(null);

  const { default: defaultScenarios, custom: customScenarios } = useMemo(
    () => scenarioService.getAllScenarios(),
    []
  );

  const allTags = useMemo(() => scenarioService.getAllTags(), []);
  const difficultyPresets = useMemo(() => scenarioService.getDifficultyPresets(), []);

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
    
    return scenarios.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [defaultScenarios, customScenarios, searchQuery, selectedTag]);

  // Toggle favorite
  const handleToggleFavorite = (scenarioId) => {
    scenarioService.toggleFavorite(scenarioId);
    window.location.reload();
  };

  // Delete scenario
  const handleDelete = (scenarioId) => {
    if (confirmDelete === scenarioId) {
      scenarioService.deleteScenario(scenarioId);
      setConfirmDelete(null);
      window.location.reload();
    } else {
      setConfirmDelete(scenarioId);
    }
  };

  // Clone scenario
  const handleClone = (scenario) => {
    const cloned = {
      ...JSON.parse(JSON.stringify(scenario)),
      id: undefined,
      name: `Copy of ${scenario.name}`,
      isDefault: false
    };
    const created = scenarioService.createScenario(cloned);
    setEditingScenario(created);
  };

  // Export scenario
  const handleExport = (scenario) => {
    const json = scenarioService.exportScenario(scenario.id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenario-${scenario.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import scenario
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = scenarioService.importScenario(event.target.result);
        if (imported) {
          window.location.reload();
        }
      } catch (error) {
        alert(`Import failed: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Play scenario
  const handlePlay = (scenario) => {
    if (onPlayScenario) {
      try {
        const config = scenarioService.buildGameConfig(scenario.id);
        onPlayScenario(config);
      } catch (error) {
        alert(`Failed to load scenario: ${error.message}`);
      }
    }
  };

  // Get scenario info
  const getScenarioInfo = (scenario) => {
    const slaveProfile = slaveProfileService.getProfile(
      scenario.slave?.profileId,
      scenario.slave?.profileType || 'preset'
    );
    
    return {
      slaveName: slaveProfile?.name || 'Unknown',
      npcCount: scenario.npcs?.length || 0,
      difficulty: scenario.rules?.difficulty?.preset || 'balanced'
    };
  };

  // Render scenario card
  const renderScenarioCard = (scenario) => {
    const info = getScenarioInfo(scenario);
    const isConfirmingDelete = confirmDelete === scenario.id;

    return (
      <div
        key={scenario.id}
        className="p-4 bg-white/5 border border-white/10 rounded-lg hover:border-white/30 transition-colors"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-white truncate">{scenario.name}</h4>
              {scenario.isDefault && (
                <span className="px-1.5 py-0.5 text-xs bg-accent-primary/20 text-accent-primary rounded">
                  Default
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary line-clamp-2 mt-1">
              {scenario.description}
            </p>
          </div>
          
          <button
            onClick={() => handleToggleFavorite(scenario.id)}
            className="p-1 text-amber-500 hover:text-amber-400"
          >
            {scenario.isFavorite ? (
              <Star className="w-4 h-4 fill-current" />
            ) : (
              <StarOff className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Info */}
        <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
          <span>🎭 {info.slaveName}</span>
          <span>👑 {info.npcCount} Mistresses</span>
          <span className={`
            px-1.5 py-0.5 rounded capitalize
            ${info.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
              info.difficulty === 'balanced' ? 'bg-blue-500/20 text-blue-400' :
              info.difficulty === 'hard' ? 'bg-orange-500/20 text-orange-400' :
              'bg-red-500/20 text-red-400'}
          `}>
            {info.difficulty}
          </span>
        </div>

        {/* Tags */}
        {scenario.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {scenario.tags.map(tag => (
              <span 
                key={tag}
                className="px-1.5 py-0.5 text-xs bg-white/10 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/10">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handlePlay(scenario)}
          >
            <Play className="w-4 h-4 mr-1" />
            Play
          </Button>
          
          {!scenario.isDefault && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingScenario(JSON.parse(JSON.stringify(scenario)))}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                variant={isConfirmingDelete ? 'danger' : 'ghost'}
                size="sm"
                onClick={() => handleDelete(scenario.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleClone(scenario)}
          >
            <Copy className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleExport(scenario)}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Saved Scenarios</h2>
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
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
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
        
        {allTags.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <select
              value={selectedTag || ''}
              onChange={(e) => setSelectedTag(e.target.value || null)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-accent-primary focus:outline-none"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm text-text-secondary">
        <span>Total: {filteredScenarios.length}</span>
        <span>Default: {defaultScenarios.length}</span>
        <span>Custom: {customScenarios.length}</span>
        <span>Favorites: {filteredScenarios.filter(s => s.isFavorite).length}</span>
      </div>

      {/* Scenario grid */}
      {filteredScenarios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScenarios.map(scenario => renderScenarioCard(scenario))}
        </div>
      ) : (
        <p className="text-text-muted text-center py-12">
          No scenarios found matching your criteria.
        </p>
      )}

      {/* Simple edit modal for name/description/tags */}
      {editingScenario && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-background-elevated rounded-lg border border-white/10">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Edit Scenario</h3>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">Name</label>
                <input
                  type="text"
                  value={editingScenario.name}
                  onChange={(e) => setEditingScenario({...editingScenario, name: e.target.value})}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-1">Description</label>
                <textarea
                  value={editingScenario.description || ''}
                  onChange={(e) => setEditingScenario({...editingScenario, description: e.target.value})}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white h-20 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={(editingScenario.tags || []).join(', ')}
                  onChange={(e) => setEditingScenario({
                    ...editingScenario, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
                  placeholder="e.g., tickle, hard, custom"
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-white/10 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditingScenario(null)}>
                Cancel
              </Button>
              <Button 
                variant="primary"
                onClick={() => {
                  scenarioService.updateScenario(editingScenario.id, editingScenario);
                  setEditingScenario(null);
                  window.location.reload();
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScenarioManagerTab;
