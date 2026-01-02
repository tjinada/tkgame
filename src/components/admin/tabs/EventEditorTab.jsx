import { useState, useEffect } from 'react'
import { TabPanel } from '../../ui/Tabs'
import { Input, Textarea } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { Save, RotateCcw, Zap, Plus, Trash2 } from 'lucide-react'
import eventsDataDefault from '../../../data/events.json'

const EVENTS_KEY = 'fd-events-custom'

export function EventEditorTab() {
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [editedEvent, setEditedEvent] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(EVENTS_KEY)
      if (stored) {
        setEvents(JSON.parse(stored))
      } else {
        setEvents(eventsDataDefault.events)
      }
    } catch {
      setEvents(eventsDataDefault.events)
    }
  }, [])

  useEffect(() => {
    if (selectedEventId) {
      const event = events.find(e => e.id === selectedEventId)
      setEditedEvent(event ? { ...event, effects: { ...event.effects } } : null)
      setHasChanges(false)
    }
  }, [selectedEventId, events])

  const saveEvents = (newEvents) => {
    setEvents(newEvents)
    localStorage.setItem(EVENTS_KEY, JSON.stringify(newEvents))
  }

  const handleChange = (field, value) => {
    setEditedEvent(prev => ({
      ...prev,
      [field]: value
    }))
    setHasChanges(true)
  }

  const handleEffectChange = (effectType, key, value) => {
    setEditedEvent(prev => ({
      ...prev,
      effects: {
        ...prev.effects,
        [effectType]: {
          ...(prev.effects?.[effectType] || {}),
          [key]: value
        }
      }
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    if (!editedEvent) return

    const updated = events.map(e => e.id === editedEvent.id ? editedEvent : e)
    saveEvents(updated)
    setHasChanges(false)
  }

  const handleResetEvent = () => {
    const defaultEvent = eventsDataDefault.events.find(e => e.id === selectedEventId)
    if (defaultEvent && confirm(`Reset event #${defaultEvent.id} to defaults?`)) {
      const updated = events.map(e => e.id === selectedEventId ? { ...defaultEvent } : e)
      saveEvents(updated)
    }
  }

  const handleResetAll = () => {
    if (confirm('Reset ALL events to defaults? This cannot be undone.')) {
      saveEvents(eventsDataDefault.events)
      setSelectedEventId(null)
      setEditedEvent(null)
    }
  }

  return (
    <TabPanel>
      <div className="flex gap-6 h-full">
        
        {/* Event List */}
        <div className="w-80 flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">Events (d20)</h3>
            <Button variant="ghost" size="sm" onClick={handleResetAll}>
              <RotateCcw size={14} />
            </Button>
          </div>
          
          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2">
            {events.map(event => (
              <button
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg transition-colors
                  ${selectedEventId === event.id 
                    ? 'bg-accent-primary/20 border border-accent-primary' 
                    : 'bg-background-tertiary/50 hover:bg-background-tertiary border border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center bg-background-elevated rounded text-xs font-mono">
                    {event.id}
                  </span>
                  <span className="text-sm text-text-primary truncate">{event.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 min-w-0">
          {editedEvent ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <section className="p-4 bg-background-tertiary/50 rounded-lg space-y-4">
                <h3 className="font-semibold text-text-primary flex items-center gap-2">
                  <Zap size={18} />
                  Event #{editedEvent.id}
                </h3>
                
                <Input
                  label="Name"
                  value={editedEvent.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />

                <Input
                  label="Trigger Bias"
                  value={editedEvent.triggerBias}
                  onChange={(e) => handleChange('triggerBias', e.target.value)}
                  hint="Condition that makes this event more likely"
                />

                <Textarea
                  label="Description"
                  value={editedEvent.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                />
              </section>

              {/* Effects */}
              <section className="p-4 bg-background-tertiary/50 rounded-lg space-y-4">
                <h3 className="font-semibold text-text-primary">Effects</h3>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-text-secondary">Stat Changes</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {['obedience', 'endurance', 'arousal', 'sensitivity'].map(stat => (
                      <Input
                        key={stat}
                        label={stat.charAt(0).toUpperCase() + stat.slice(1)}
                        type="number"
                        value={editedEvent.effects?.statChanges?.[stat] || 0}
                        onChange={(e) => handleEffectChange('statChanges', stat, parseInt(e.target.value) || 0)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-text-secondary">Affinity Changes</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {['sandy', 'araph', 'nancy', 'aish', 'gaya', 'melissa'].map(npc => (
                      <Input
                        key={npc}
                        label={npc.charAt(0).toUpperCase() + npc.slice(1)}
                        type="number"
                        value={editedEvent.effects?.affinityChanges?.[npc] || 0}
                        onChange={(e) => handleEffectChange('affinityChanges', npc, parseInt(e.target.value) || 0)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-text-secondary">Flags (JSON)</h4>
                  <Textarea
                    value={JSON.stringify(editedEvent.effects?.flags || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const flags = JSON.parse(e.target.value)
                        setEditedEvent(prev => ({
                          ...prev,
                          effects: { ...prev.effects, flags }
                        }))
                        setHasChanges(true)
                      } catch {}
                    }}
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
              </section>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-background-tertiary">
                <Button variant="ghost" onClick={handleResetEvent}>
                  <RotateCcw size={16} className="mr-2" />
                  Reset Event
                </Button>
                
                <Button 
                  variant="primary" 
                  onClick={handleSave}
                  disabled={!hasChanges}
                >
                  <Save size={16} className="mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-text-muted bg-background-tertiary/30 rounded-lg h-full flex flex-col items-center justify-center">
              <Zap size={48} className="mb-4 opacity-30" />
              <p>Select an event to edit</p>
              <p className="text-sm text-text-muted/60 mt-1">Events are triggered by d20 rolls during gameplay</p>
            </div>
          )}
        </div>

      </div>
    </TabPanel>
  )
}

export default EventEditorTab
