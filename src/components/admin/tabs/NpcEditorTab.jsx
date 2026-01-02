import { useState, useEffect } from 'react'
import { TabPanel } from '../../ui/Tabs'
import { Input, Textarea } from '../../ui/Input'
import { Select } from '../../ui/Select'
import { Button } from '../../ui/Button'
import { Save, RotateCcw, User } from 'lucide-react'
import npcsDataDefault from '../../../data/npcs.json'

const NPCS_KEY = 'fd-npcs-custom'

export function NpcEditorTab() {
  const [npcs, setNpcs] = useState([])
  const [selectedNpcId, setSelectedNpcId] = useState(null)
  const [editedNpc, setEditedNpc] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    // Load custom NPCs or defaults
    try {
      const stored = localStorage.getItem(NPCS_KEY)
      if (stored) {
        setNpcs(JSON.parse(stored))
      } else {
        setNpcs(npcsDataDefault.npcs)
      }
    } catch {
      setNpcs(npcsDataDefault.npcs)
    }
  }, [])

  useEffect(() => {
    if (selectedNpcId) {
      const npc = npcs.find(n => n.id === selectedNpcId)
      setEditedNpc(npc ? { ...npc } : null)
      setHasChanges(false)
    }
  }, [selectedNpcId, npcs])

  const saveNpcs = (newNpcs) => {
    setNpcs(newNpcs)
    localStorage.setItem(NPCS_KEY, JSON.stringify(newNpcs))
  }

  const handleChange = (field, value) => {
    setEditedNpc(prev => ({
      ...prev,
      [field]: value
    }))
    setHasChanges(true)
  }

  const handleArrayChange = (field, value) => {
    // Convert comma-separated string to array
    const arr = value.split(',').map(s => s.trim()).filter(Boolean)
    handleChange(field, arr)
  }

  const handleSave = () => {
    if (!editedNpc) return

    const updated = npcs.map(n => n.id === editedNpc.id ? editedNpc : n)
    saveNpcs(updated)
    setHasChanges(false)
  }

  const handleResetNpc = () => {
    const defaultNpc = npcsDataDefault.npcs.find(n => n.id === selectedNpcId)
    if (defaultNpc && confirm(`Reset ${defaultNpc.name} to defaults?`)) {
      const updated = npcs.map(n => n.id === selectedNpcId ? { ...defaultNpc } : n)
      saveNpcs(updated)
    }
  }

  const handleResetAll = () => {
    if (confirm('Reset ALL NPCs to defaults? This cannot be undone.')) {
      saveNpcs(npcsDataDefault.npcs)
      setSelectedNpcId(null)
      setEditedNpc(null)
    }
  }

  const npcOptions = npcs.map(npc => ({
    value: npc.id,
    label: `${npc.name} - ${npc.title}`,
  }))

  return (
    <TabPanel>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select
              value={selectedNpcId || ''}
              onChange={(e) => setSelectedNpcId(e.target.value)}
              options={npcOptions}
              placeholder="Select NPC to edit..."
              className="w-72"
            />
          </div>
          <Button variant="danger" onClick={handleResetAll}>
            <RotateCcw size={16} className="mr-2" />
            Reset All NPCs
          </Button>
        </div>

        {/* Editor */}
        {editedNpc ? (
          <div className="space-y-6">
            {/* Basic Info */}
            <section className="p-4 bg-background-tertiary/50 rounded-lg space-y-4">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <User size={18} />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="ID"
                  value={editedNpc.id}
                  disabled
                  hint="Cannot be changed"
                />
                <Input
                  label="Name"
                  value={editedNpc.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>

              <Input
                label="Title"
                value={editedNpc.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., The Tickle Queen"
              />

              <Textarea
                label="Description"
                value={editedNpc.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
              />
            </section>

            {/* Stats */}
            <section className="p-4 bg-background-tertiary/50 rounded-lg space-y-4">
              <h3 className="font-semibold text-text-primary">Stats & Affinities</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Starting Affinity"
                  type="number"
                  value={editedNpc.startingAffinity}
                  onChange={(e) => handleChange('startingAffinity', parseInt(e.target.value) || 0)}
                  min={-50}
                  max={100}
                />
              </div>
            </section>

            {/* Specialties & Abilities */}
            <section className="p-4 bg-background-tertiary/50 rounded-lg space-y-4">
              <h3 className="font-semibold text-text-primary">Abilities</h3>
              
              <Input
                label="Specialties (comma-separated)"
                value={editedNpc.specialties?.join(', ') || ''}
                onChange={(e) => handleArrayChange('specialties', e.target.value)}
                placeholder="tickling, feathers, fingers"
              />

              <Input
                label="Target Areas (comma-separated)"
                value={editedNpc.targetAreas?.join(', ') || ''}
                onChange={(e) => handleArrayChange('targetAreas', e.target.value)}
                placeholder="feet, ribs, armpits"
              />

              <Input
                label="Perks (comma-separated)"
                value={editedNpc.perks?.join(', ') || ''}
                onChange={(e) => handleArrayChange('perks', e.target.value)}
                placeholder="Sadistic Monopoly"
              />

              <Input
                label="Weaknesses (comma-separated)"
                value={editedNpc.weaknesses?.join(', ') || ''}
                onChange={(e) => handleArrayChange('weaknesses', e.target.value)}
                placeholder="Hates being tickled back"
              />
            </section>

            {/* Behavior */}
            <section className="p-4 bg-background-tertiary/50 rounded-lg space-y-4">
              <h3 className="font-semibold text-text-primary">Behavior</h3>
              
              <Textarea
                label="Devoted Behavior"
                value={editedNpc.devotedBehavior || ''}
                onChange={(e) => handleChange('devotedBehavior', e.target.value)}
                rows={3}
                hint="How they act when affinity is 50+"
              />
            </section>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-background-tertiary">
              <Button variant="ghost" onClick={handleResetNpc}>
                <RotateCcw size={16} className="mr-2" />
                Reset This NPC
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
          <div className="p-12 text-center text-text-muted bg-background-tertiary/30 rounded-lg">
            <User size={48} className="mx-auto mb-4 opacity-30" />
            <p>Select an NPC to edit their properties</p>
          </div>
        )}

      </div>
    </TabPanel>
  )
}

export default NpcEditorTab
