import { useState, useRef } from 'react'
import { TabPanel } from '../../ui/Tabs'
import { Button } from '../../ui/Button'
import { Textarea } from '../../ui/Input'
import { Upload, Download, FileJson, Trash2, Check, AlertCircle, Eye, Copy, Play } from 'lucide-react'

const SCENARIOS_KEY = 'fd-scenarios'

export function JsonManagerTab({ gameState, onStartScenario, onClose }) {
  const [scenarios, setScenarios] = useState(() => {
    try {
      const stored = localStorage.getItem(SCENARIOS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [jsonEditor, setJsonEditor] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const inputRef = useRef(null)

  const saveScenarios = (newScenarios) => {
    setScenarios(newScenarios)
    localStorage.setItem(SCENARIOS_KEY, JSON.stringify(newScenarios))
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      
      // Validate basic structure
      if (!parsed.id || !parsed.name || !parsed.scenes) {
        throw new Error('Invalid scenario format. Required: id, name, scenes')
      }

      // Check for duplicate
      const existing = scenarios.find(s => s.id === parsed.id)
      if (existing) {
        if (!confirm(`Scenario "${parsed.name}" already exists. Replace it?`)) {
          return
        }
        const updated = scenarios.map(s => s.id === parsed.id ? parsed : s)
        saveScenarios(updated)
      } else {
        saveScenarios([...scenarios, parsed])
      }

      setSuccess(`Loaded "${parsed.name}" (${parsed.scenes.length} scenes)`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Failed to load: ${err.message}`)
      setTimeout(() => setError(null), 5000)
    }

    e.target.value = ''
  }

  const handleExportScenario = (scenario) => {
    const json = JSON.stringify(scenario, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${scenario.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportGameState = () => {
    if (!gameState) {
      setError('No game state available')
      return
    }
    const json = JSON.stringify(gameState, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gamestate_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setSuccess('Game state exported')
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleDeleteScenario = (id) => {
    if (confirm('Delete this scenario?')) {
      saveScenarios(scenarios.filter(s => s.id !== id))
      if (selectedScenario?.id === id) {
        setSelectedScenario(null)
        setJsonEditor('')
      }
    }
  }

  const handleSelectScenario = (scenario) => {
    setSelectedScenario(scenario)
    setJsonEditor(JSON.stringify(scenario, null, 2))
  }

  const handleSaveEdits = () => {
    try {
      const parsed = JSON.parse(jsonEditor)
      if (!parsed.id || !parsed.name || !parsed.scenes) {
        throw new Error('Invalid scenario format')
      }

      const updated = scenarios.map(s => s.id === selectedScenario.id ? parsed : s)
      saveScenarios(updated)
      setSelectedScenario(parsed)
      setSuccess('Scenario saved')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Invalid JSON: ${err.message}`)
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonEditor)
    setSuccess('Copied to clipboard')
    setTimeout(() => setSuccess(null), 2000)
  }

  const handleStartScenario = (scenario) => {
    if (onStartScenario) {
      onStartScenario(scenario)
      if (onClose) {
        onClose()
      }
    }
  }

  return (
    <TabPanel>
      <div className="space-y-6">
        
        {/* Status Messages */}
        {error && (
          <div className="p-3 bg-accent-danger/20 border border-accent-danger/50 rounded-lg flex items-center gap-2 text-accent-danger">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-accent-success/20 border border-accent-success/50 rounded-lg flex items-center gap-2 text-accent-success">
            <Check size={18} />
            {success}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => inputRef.current?.click()}>
            <Upload size={16} className="mr-2" />
            Load Scenario JSON
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <Button variant="secondary" onClick={handleExportGameState} disabled={!gameState}>
            <Download size={16} className="mr-2" />
            Export Game State
          </Button>
        </div>

        {/* Scenarios List */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-text-primary">Loaded Scenarios</h3>
          
          {scenarios.length === 0 ? (
            <div className="p-8 text-center text-text-muted bg-background-tertiary/50 rounded-lg">
              <FileJson size={48} className="mx-auto mb-3 opacity-30" />
              <p>No scenarios loaded</p>
              <p className="text-sm text-text-muted/60 mt-1">Upload a JSON file to get started</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {scenarios.map(scenario => (
                <div 
                  key={scenario.id}
                  className={`
                    p-4 rounded-lg border transition-colors cursor-pointer
                    ${selectedScenario?.id === scenario.id 
                      ? 'bg-accent-primary/10 border-accent-primary' 
                      : 'bg-background-tertiary/50 border-background-elevated hover:border-text-muted'
                    }
                  `}
                  onClick={() => handleSelectScenario(scenario)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-text-primary">{scenario.name}</h4>
                      <p className="text-sm text-text-muted">
                        ID: {scenario.id} • {scenario.scenes?.length || 0} scenes
                        {scenario.chapter && ` • Chapter ${scenario.chapter}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartScenario(scenario)
                        }}
                        title="Start this scenario"
                      >
                        <Play size={14} className="mr-1" />
                        Play
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExportScenario(scenario)
                        }}
                        title="Export scenario"
                      >
                        <Download size={14} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteScenario(scenario.id)
                        }}
                        title="Delete scenario"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* JSON Editor */}
        {selectedScenario && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">
                Edit: {selectedScenario.name}
              </h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCopyJson}>
                  <Copy size={14} className="mr-1" /> Copy
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveEdits}>
                  <Check size={14} className="mr-1" /> Save Changes
                </Button>
              </div>
            </div>
            
            <Textarea
              value={jsonEditor}
              onChange={(e) => setJsonEditor(e.target.value)}
              rows={20}
              className="font-mono text-sm"
              placeholder="Scenario JSON..."
            />
          </section>
        )}

      </div>
    </TabPanel>
  )
}

export default JsonManagerTab
