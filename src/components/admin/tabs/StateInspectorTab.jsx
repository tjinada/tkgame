import { useState, useEffect } from 'react'
import { TabPanel } from '../../ui/Tabs'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { Save, RotateCcw, Activity, Users, Flag, History } from 'lucide-react'

export function StateInspectorTab({ gameState, onStateChange }) {
  const [editedState, setEditedState] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (gameState) {
      setEditedState(JSON.parse(JSON.stringify(gameState)))
      setHasChanges(false)
    }
  }, [gameState])

  if (!gameState) {
    return (
      <TabPanel>
        <div className="p-12 text-center text-text-muted bg-background-tertiary/30 rounded-lg">
          <Activity size={48} className="mx-auto mb-4 opacity-30" />
          <p>No active game state</p>
          <p className="text-sm text-text-muted/60 mt-1">Start a game to inspect and edit state</p>
        </div>
      </TabPanel>
    )
  }

  const handleStatChange = (stat, value) => {
    setEditedState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [stat]: Math.max(0, Math.min(100, parseInt(value) || 0))
      }
    }))
    setHasChanges(true)
  }

  const handleAffinityChange = (npc, value) => {
    setEditedState(prev => ({
      ...prev,
      affinities: {
        ...prev.affinities,
        [npc]: Math.max(-100, Math.min(100, parseInt(value) || 0))
      }
    }))
    setHasChanges(true)
  }

  const handleFlagChange = (flag, value) => {
    setEditedState(prev => ({
      ...prev,
      flags: {
        ...prev.flags,
        [flag]: value
      }
    }))
    setHasChanges(true)
  }

  const handleDeleteFlag = (flag) => {
    setEditedState(prev => {
      const newFlags = { ...prev.flags }
      delete newFlags[flag]
      return { ...prev, flags: newFlags }
    })
    setHasChanges(true)
  }

  const handleAddFlag = () => {
    const name = prompt('Flag name:')
    if (name) {
      const value = prompt('Flag value (true/false or text):')
      handleFlagChange(name, value === 'true' ? true : value === 'false' ? false : value)
    }
  }

  const handleSave = () => {
    if (editedState && onStateChange) {
      onStateChange(editedState)
      setHasChanges(false)
    }
  }

  const handleReset = () => {
    if (confirm('Reset to current game state? Unsaved changes will be lost.')) {
      setEditedState(JSON.parse(JSON.stringify(gameState)))
      setHasChanges(false)
    }
  }

  return (
    <TabPanel>
      <div className="space-y-6">
        
        {/* Stats */}
        <section className="p-4 bg-background-tertiary/50 rounded-lg space-y-4">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Activity size={18} />
            Player Stats
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(editedState?.stats || {}).map(([stat, value]) => (
              <div key={stat} className="space-y-2">
                <Input
                  label={stat.charAt(0).toUpperCase() + stat.slice(1)}
                  type="number"
                  value={value}
                  onChange={(e) => handleStatChange(stat, e.target.value)}
                  min={0}
                  max={100}
                />
                <div className="h-2 bg-background-elevated rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      stat === 'obedience' ? 'bg-stat-obedience' :
                      stat === 'endurance' ? 'bg-stat-endurance' :
                      stat === 'arousal' ? 'bg-stat-arousal' :
                      'bg-stat-sensitivity'
                    }`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Affinities */}
        <section className="p-4 bg-background-tertiary/50 rounded-lg space-y-4">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Users size={18} />
            NPC Affinities
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(editedState?.affinities || {}).map(([npc, value]) => (
              <div key={npc} className="space-y-2">
                <Input
                  label={npc.charAt(0).toUpperCase() + npc.slice(1)}
                  type="number"
                  value={value}
                  onChange={(e) => handleAffinityChange(npc, e.target.value)}
                  min={-100}
                  max={100}
                />
                <div className="h-2 bg-background-elevated rounded-full overflow-hidden relative">
                  {/* Center marker */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-text-muted/30" />
                  {/* Affinity bar */}
                  <div 
                    className={`absolute top-0 bottom-0 transition-all ${
                      value >= 0 ? 'bg-accent-success' : 'bg-accent-danger'
                    }`}
                    style={{ 
                      left: value >= 0 ? '50%' : `${50 + value / 2}%`,
                      width: `${Math.abs(value) / 2}%`
                    }}
                  />
                </div>
                <p className="text-xs text-text-muted text-center">
                  {value >= 50 ? 'Devoted' : 
                   value >= 20 ? 'Pleased' : 
                   value >= 0 ? 'Neutral' : 
                   value >= -29 ? 'Annoyed' : 
                   value >= -50 ? 'Hostile' : 'Enemy'}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Flags */}
        <section className="p-4 bg-background-tertiary/50 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <Flag size={18} />
              Flags
            </h3>
            <Button variant="ghost" size="sm" onClick={handleAddFlag}>
              + Add Flag
            </Button>
          </div>
          
          {Object.keys(editedState?.flags || {}).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(editedState.flags).map(([flag, value]) => (
                <div 
                  key={flag} 
                  className="flex items-center justify-between p-2 bg-background-elevated rounded-lg"
                >
                  <div className="truncate">
                    <span className="text-sm font-mono text-text-primary">{flag}</span>
                    <span className="text-xs text-text-muted ml-2">
                      {typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteFlag(flag)}
                    className="p-1 text-text-muted hover:text-accent-danger transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No flags set</p>
          )}
        </section>

        {/* Game Progress */}
        <section className="p-4 bg-background-tertiary/50 rounded-lg space-y-4">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <History size={18} />
            Progress
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-background-elevated rounded-lg">
              <p className="text-xs text-text-muted">Chapter</p>
              <p className="text-xl font-bold text-text-primary">{editedState?.chapter || 1}</p>
            </div>
            <div className="p-3 bg-background-elevated rounded-lg">
              <p className="text-xs text-text-muted">Turn</p>
              <p className="text-xl font-bold text-text-primary">{editedState?.turn || 0}</p>
            </div>
            <div className="p-3 bg-background-elevated rounded-lg">
              <p className="text-xs text-text-muted">Location</p>
              <p className="text-sm font-medium text-text-primary truncate">
                {editedState?.currentLocation || 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-background-elevated rounded-lg">
              <p className="text-xs text-text-muted">Active Tone</p>
              <p className="text-sm font-medium text-text-primary">{editedState?.activeTone || 'Neutral'}</p>
            </div>
          </div>

          <div className="p-3 bg-background-elevated rounded-lg">
            <p className="text-xs text-text-muted mb-2">History ({editedState?.history?.length || 0} entries)</p>
            <div className="max-h-32 overflow-y-auto text-xs font-mono text-text-muted">
              {editedState?.history?.slice(-5).map((entry, i) => (
                <div key={i} className="py-1 border-b border-background-tertiary last:border-0">
                  T{entry.turn}: {entry.choice?.substring(0, 50)}...
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-background-tertiary">
          <Button variant="ghost" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw size={16} className="mr-2" />
            Discard Changes
          </Button>
          
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-sm text-accent-warning">Unsaved changes</span>
            )}
            <Button 
              variant="primary" 
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <Save size={16} className="mr-2" />
              Apply Changes
            </Button>
          </div>
        </div>

      </div>
    </TabPanel>
  )
}

export default StateInspectorTab
