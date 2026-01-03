import { useState, useEffect } from 'react'
import { useSettings } from '../../../hooks/useSettings'
import { Button, Input, Select } from '../../ui'
import { RotateCcw, Download, Upload, Sparkles, User, Users, Sliders, Heart, Gamepad2, Eye, Bug, Server, BookOpen, Zap } from 'lucide-react'

// Sub-tab configuration
const SUB_TABS = [
  { id: 'api', label: 'API', icon: Server },
  { id: 'basic', label: 'Basic Style', icon: Sparkles },
  { id: 'narrative', label: 'Narrative', icon: BookOpen },
  { id: 'player', label: 'Player', icon: User },
  { id: 'npc', label: 'NPCs', icon: Users },
  { id: 'balance', label: 'Balance', icon: Sliders },
  { id: 'kinks', label: 'Kinks', icon: Heart },
  { id: 'mechanics', label: 'Mechanics', icon: Gamepad2 },
  { id: 'immersion', label: 'Immersion', icon: Eye },
  { id: 'visual', label: 'Visual', icon: Zap },
  { id: 'debug', label: 'Debug', icon: Bug },
]

// Reusable Checkbox Group component
function CheckboxGroup({ label, hint, options, value = [], onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-2">{label}</label>
      {hint && <p className="text-xs text-text-muted mb-3">{hint}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {options.map(({ value: optValue, label: optLabel }) => (
          <label key={optValue} className="flex items-center gap-2 cursor-pointer p-2 rounded bg-background-secondary/50 hover:bg-background-secondary transition-colors">
            <input
              type="checkbox"
              checked={value.includes(optValue)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange([...value, optValue])
                } else {
                  onChange(value.filter(v => v !== optValue))
                }
              }}
              className="w-4 h-4 rounded border-background-elevated bg-background-tertiary text-accent-primary focus:ring-accent-primary"
            />
            <span className="text-sm text-text-primary">{optLabel}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// Slider component
function Slider({ label, hint, value, onChange, min = 0, max = 100, leftLabel, rightLabel }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-2">{label}</label>
      {hint && <p className="text-xs text-text-muted mb-2">{hint}</p>}
      <div className="flex items-center gap-4">
        {leftLabel && <span className="text-xs text-text-muted w-24">{leftLabel}</span>}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 h-2 bg-background-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
        />
        {rightLabel && <span className="text-xs text-text-muted w-24 text-right">{rightLabel}</span>}
        <span className="text-sm text-text-primary w-12 text-right">{value}%</span>
      </div>
    </div>
  )
}

export function SettingsTab() {
  const { settings, updateSetting, resetCategory, exportSettings, importSettings } = useSettings()
  const [activeSubTab, setActiveSubTab] = useState('api')
  const [importText, setImportText] = useState('')
  const [showImport, setShowImport] = useState(false)

  const handleChange = (key, value) => {
    updateSetting(key, value)
  }

  const handleResetCategory = async (category) => {
    if (confirm(`Reset all ${category} settings to defaults?`)) {
      await resetCategory(category)
    }
  }

  const handleExport = () => {
    const json = exportSettings()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fd-settings.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    if (importSettings(importText)) {
      setShowImport(false)
      setImportText('')
      alert('Settings imported successfully!')
    } else {
      alert('Failed to import settings. Please check the JSON format.')
    }
  }

  const renderSubTab = () => {
    switch (activeSubTab) {
      case 'api':
        return <ApiSettings settings={settings} onChange={handleChange} onReset={() => handleResetCategory('api')} />
      case 'basic':
        return <BasicStyleSettings settings={settings} onChange={handleChange} onReset={() => handleResetCategory('aiBasic')} />
      case 'narrative':
        return <NarrativeSettings settings={settings} onChange={handleChange} onReset={() => handleResetCategory('aiNarrative')} />
      case 'player':
        return <PlayerSettings settings={settings} onChange={handleChange} onReset={() => handleResetCategory('aiPlayer')} />
      case 'npc':
        return <NpcSettings settings={settings} onChange={handleChange} onReset={() => handleResetCategory('aiNpc')} />
      case 'balance':
        return <BalanceSettings settings={settings} onChange={handleChange} onReset={() => handleResetCategory('aiBalance')} />
      case 'kinks':
        return <KinkSettings settings={settings} onChange={handleChange} onReset={() => handleResetCategory('aiKinks')} />
      case 'mechanics':
        return <MechanicsSettings settings={settings} onChange={handleChange} onReset={() => handleResetCategory('aiMechanics')} />
      case 'immersion':
        return <ImmersionSettings settings={settings} onChange={handleChange} onReset={() => handleResetCategory('aiImmersion')} />
      case 'visual':
        return <VisualSettings settings={settings} onChange={handleChange} onReset={() => handleResetCategory('visual')} />
      case 'debug':
        return <DebugSettings settings={settings} onChange={handleChange} onReset={() => handleResetCategory('debug')} />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab navigation */}
      <div className="flex items-center gap-1 p-2 bg-background-tertiary/30 rounded-lg mb-4 overflow-x-auto">
        {SUB_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSubTab(id)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors
              ${activeSubTab === id 
                ? 'bg-accent-primary text-white' 
                : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
              }
            `}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-y-auto">
        {renderSubTab()}
      </div>

      {/* Import/Export */}
      <div className="border-t border-background-tertiary/30 pt-4 mt-4">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download size={14} className="mr-2" /> Export Settings
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowImport(!showImport)}>
            <Upload size={14} className="mr-2" /> Import Settings
          </Button>
        </div>
        
        {showImport && (
          <div className="mt-4 space-y-2">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste settings JSON here..."
              className="w-full h-32 px-3 py-2 bg-background-tertiary border border-background-elevated rounded-lg text-text-primary text-sm font-mono"
            />
            <Button variant="primary" size="sm" onClick={handleImport}>
              Import
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// === SUB-TAB COMPONENTS ===

function SectionHeader({ title, onReset }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <Button variant="ghost" size="sm" onClick={onReset}>
        <RotateCcw size={14} className="mr-1" /> Reset
      </Button>
    </div>
  )
}

function ApiSettings({ settings, onChange, onReset }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="API & Content Settings" onReset={onReset} />
      
      <div className="grid gap-4 p-4 bg-background-tertiary/50 rounded-lg">
        <Input
          label="NanoGPT API Key"
          type="password"
          value={settings.apiKey}
          onChange={(e) => onChange('apiKey', e.target.value)}
          placeholder="Enter your API key"
          hint="Get your key from nano-gpt.com"
        />
        
        <Input
          label="API Base URL"
          value={settings.baseUrl}
          onChange={(e) => onChange('baseUrl', e.target.value)}
          hint="Default: https://nano-gpt.com/api/v1"
        />
        
        <Input
          label="Model"
          value={settings.model}
          onChange={(e) => onChange('model', e.target.value)}
          hint="e.g., chatgpt-4o-latest, gpt-4, claude-3-opus"
        />

        <Select
          label="Content Mode"
          value={settings.contentMode}
          onChange={(e) => onChange('contentMode', e.target.value)}
          options={[
            { value: 'json-only', label: 'JSON Only (pre-written scenarios)' },
            { value: 'ai-only', label: 'AI Only (all generated)' },
            { value: 'hybrid', label: 'Hybrid (JSON + AI fallback)' },
          ]}
        />

        <Select
          label="Context Mode"
          value={settings.contextMode}
          onChange={(e) => onChange('contextMode', e.target.value)}
          options={[
            { value: 'last-n-turns', label: 'Last N Turns' },
            { value: 'full-chapter', label: 'Full Chapter' },
            { value: 'token-budget', label: 'Token Budget' },
          ]}
        />

        <Input
          label="Context Limit"
          type="number"
          value={settings.contextLimit}
          onChange={(e) => onChange('contextLimit', parseInt(e.target.value) || 10)}
          min={1}
          max={50}
        />

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.streamResponses}
            onChange={(e) => onChange('streamResponses', e.target.checked)}
            className="w-4 h-4 rounded border-background-elevated bg-background-tertiary text-accent-primary focus:ring-accent-primary"
          />
          <span className="text-text-primary">Enable streaming responses</span>
        </label>
      </div>
    </div>
  )
}

function BasicStyleSettings({ settings, onChange, onReset }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Basic AI Style" onReset={onReset} />
      
      <div className="grid gap-4 p-4 bg-background-tertiary/50 rounded-lg">
        <Select
          label="Humiliation Level"
          value={settings.aiHumiliationLevel}
          onChange={(e) => onChange('aiHumiliationLevel', e.target.value)}
          options={[
            { value: 'none', label: 'None' },
            { value: 'mild', label: 'Mild - Light teasing' },
            { value: 'moderate', label: 'Moderate - Regular degradation' },
            { value: 'heavy', label: 'Heavy - Constant mockery' },
            { value: 'extreme', label: 'Extreme - Relentless cruelty' },
          ]}
          hint="How much verbal degradation"
        />

        <Select
          label="Swearing Level"
          value={settings.aiSwearingLevel}
          onChange={(e) => onChange('aiSwearingLevel', e.target.value)}
          options={[
            { value: 'none', label: 'None - Clean language' },
            { value: 'mild', label: 'Mild - Occasional damn/hell' },
            { value: 'moderate', label: 'Moderate - Natural profanity' },
            { value: 'heavy', label: 'Heavy - Crude and vulgar' },
          ]}
          hint="Amount of profanity"
        />

        <Select
          label="Response Length"
          value={settings.aiResponseLength}
          onChange={(e) => onChange('aiResponseLength', e.target.value)}
          options={[
            { value: 'short', label: 'Short (100-200 words)' },
            { value: 'medium', label: 'Medium (200-400 words)' },
            { value: 'long', label: 'Long (400-600 words)' },
          ]}
        />

        <Select
          label="Dialogue vs Narrative"
          value={settings.aiConversationalStyle}
          onChange={(e) => onChange('aiConversationalStyle', e.target.value)}
          options={[
            { value: 'narrative', label: 'Narrative - Rich descriptions' },
            { value: 'balanced', label: 'Balanced' },
            { value: 'conversational', label: 'Conversational - Lots of dialogue' },
          ]}
        />

        <Select
          label="Overall Intensity"
          value={settings.aiIntensity}
          onChange={(e) => onChange('aiIntensity', e.target.value)}
          options={[
            { value: 'gentle', label: 'Gentle - Soft domination' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'intense', label: 'Intense - No holding back' },
            { value: 'brutal', label: 'Brutal - Maximum cruelty' },
          ]}
        />

        <CheckboxGroup
          label="Fetish Focus"
          hint="Emphasize these fetishes (leave empty for balanced)"
          options={[
            { value: 'tickling', label: 'Tickling' },
            { value: 'feet', label: 'Feet' },
            { value: 'sweat', label: 'Sweat' },
            { value: 'edging', label: 'Edging' },
            { value: 'pot', label: 'POT' },
            { value: 'bondage', label: 'Bondage' },
            { value: 'verbal', label: 'Verbal' },
          ]}
          value={settings.aiFetishFocus || []}
          onChange={(val) => onChange('aiFetishFocus', val)}
        />
      </div>
    </div>
  )
}

function NarrativeSettings({ settings, onChange, onReset }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Narrative Style" onReset={onReset} />
      
      <div className="grid gap-4 p-4 bg-background-tertiary/50 rounded-lg">
        <Select
          label="Point of View"
          value={settings.aiPov}
          onChange={(e) => onChange('aiPov', e.target.value)}
          options={[
            { value: 'sandy-first', label: 'First Person (Sandy) - "I circle you slowly..."' },
            { value: 'narrator-third', label: 'Third Person - "Sandy circles him slowly..."' },
          ]}
        />

        <Select
          label="Tense"
          value={settings.aiTense}
          onChange={(e) => onChange('aiTense', e.target.value)}
          options={[
            { value: 'present', label: 'Present - "She grabs your hair"' },
            { value: 'past', label: 'Past - "She grabbed your hair"' },
          ]}
        />

        <Select
          label="Prose Style"
          value={settings.aiProseStyle}
          onChange={(e) => onChange('aiProseStyle', e.target.value)}
          options={[
            { value: 'poetic', label: 'Poetic - Flowery, atmospheric' },
            { value: 'balanced', label: 'Balanced' },
            { value: 'direct', label: 'Direct - Punchy, action-focused' },
          ]}
        />

        <Select
          label="Sensory Detail Level"
          value={settings.aiDetailLevel}
          onChange={(e) => onChange('aiDetailLevel', e.target.value)}
          options={[
            { value: 'minimal', label: 'Minimal - Just the essentials' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'vivid', label: 'Vivid - Rich sensory descriptions' },
          ]}
          hint="Smells, textures, sounds, etc."
        />

        <Select
          label="Pacing"
          value={settings.aiPacing}
          onChange={(e) => onChange('aiPacing', e.target.value)}
          options={[
            { value: 'slow-burn', label: 'Slow Burn - Extended buildup' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'rapid', label: 'Rapid - Quick escalation' },
          ]}
        />

        <Select
          label="Escalation Style"
          value={settings.aiEscalation}
          onChange={(e) => onChange('aiEscalation', e.target.value)}
          options={[
            { value: 'gradual', label: 'Gradual - Slowly building intensity' },
            { value: 'sudden', label: 'Sudden - Unexpected spikes' },
          ]}
        />
      </div>
    </div>
  )
}

function PlayerSettings({ settings, onChange, onReset }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Player Treatment" onReset={onReset} />
      
      <div className="grid gap-4 p-4 bg-background-tertiary/50 rounded-lg">
        <Select
          label="Mercy Frequency"
          value={settings.aiMercyFrequency}
          onChange={(e) => onChange('aiMercyFrequency', e.target.value)}
          options={[
            { value: 'never', label: 'Never - Absolutely no mercy' },
            { value: 'rare', label: 'Rare - Very occasional' },
            { value: 'occasional', label: 'Occasional - Sometimes' },
          ]}
          hint="How often NPCs show any mercy"
        />

        <Input
          label="Player Names/Insults"
          value={settings.aiPlayerNames}
          onChange={(e) => onChange('aiPlayerNames', e.target.value)}
          placeholder="worm, slave, maggot, toy"
          hint="Comma-separated names NPCs call you"
        />

        <Select
          label="Resistance Success Rate"
          value={settings.aiResistanceSuccess}
          onChange={(e) => onChange('aiResistanceSuccess', e.target.value)}
          options={[
            { value: 'hopeless', label: 'Hopeless - Defiance never works' },
            { value: 'difficult', label: 'Difficult - Rarely succeeds' },
            { value: 'possible', label: 'Possible - Sometimes works' },
          ]}
        />

        <Select
          label="Player Voice"
          value={settings.aiPlayerVoice}
          onChange={(e) => onChange('aiPlayerVoice', e.target.value)}
          options={[
            { value: 'silent', label: 'Silent - Player rarely speaks' },
            { value: 'reactive', label: 'Reactive - Responds when prompted' },
            { value: 'vocal', label: 'Vocal - Lots of player dialogue' },
          ]}
          hint="How much the player character speaks"
        />
      </div>
    </div>
  )
}

function NpcSettings({ settings, onChange, onReset }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="NPC Behavior" onReset={onReset} />
      
      <div className="grid gap-4 p-4 bg-background-tertiary/50 rounded-lg">
        <Select
          label="Default NPC Mood"
          value={settings.aiNpcMood}
          onChange={(e) => onChange('aiNpcMood', e.target.value)}
          options={[
            { value: 'sadistic', label: 'Sadistic - Cruel enjoyment' },
            { value: 'playful', label: 'Playful - Teasing, amused' },
            { value: 'cold', label: 'Cold - Clinical, detached' },
            { value: 'random', label: 'Random - Varies by scene' },
          ]}
        />

        <Select
          label="NPC Collaboration"
          value={settings.aiCollaboration}
          onChange={(e) => onChange('aiCollaboration', e.target.value)}
          options={[
            { value: 'solo', label: 'Solo - Usually one NPC' },
            { value: 'pairs', label: 'Pairs - Often two NPCs' },
            { value: 'group-friendly', label: 'Group-Friendly - Multiple NPCs common' },
          ]}
          hint="How often multiple NPCs appear together"
        />

        <Select
          label="Affection Style"
          value={settings.aiAffectionStyle}
          onChange={(e) => onChange('aiAffectionStyle', e.target.value)}
          options={[
            { value: 'none', label: 'None - Pure domination' },
            { value: 'twisted', label: 'Twisted - Cruel "caring"' },
            { value: 'possessive', label: 'Possessive - "You\'re MINE"' },
          ]}
          hint="Any caring undertones in domination"
        />

        <Select
          label="Mockery Style"
          value={settings.aiMockeryStyle}
          onChange={(e) => onChange('aiMockeryStyle', e.target.value)}
          options={[
            { value: 'cruel', label: 'Cruel - Harsh insults' },
            { value: 'teasing', label: 'Teasing - Playful mockery' },
            { value: 'dismissive', label: 'Dismissive - Bored contempt' },
          ]}
        />
      </div>
    </div>
  )
}

function BalanceSettings({ settings, onChange, onReset }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Content Balance" onReset={onReset} />
      
      <div className="grid gap-6 p-4 bg-background-tertiary/50 rounded-lg">
        <Slider
          label="Pain vs Pleasure"
          value={settings.aiPainVsPleasure}
          onChange={(val) => onChange('aiPainVsPleasure', val)}
          leftLabel="All Pleasure"
          rightLabel="All Pain"
        />

        <Slider
          label="Physical vs Psychological"
          value={settings.aiPhysicalVsPsychological}
          onChange={(val) => onChange('aiPhysicalVsPsychological', val)}
          leftLabel="Psychological"
          rightLabel="Physical"
        />

        <Slider
          label="Action vs Dialogue"
          value={settings.aiActionVsDialogue}
          onChange={(val) => onChange('aiActionVsDialogue', val)}
          leftLabel="All Dialogue"
          rightLabel="All Action"
        />

        <CheckboxGroup
          label="Sensory Focus"
          hint="Which senses to emphasize in descriptions"
          options={[
            { value: 'touch', label: 'Touch' },
            { value: 'smell', label: 'Smell' },
            { value: 'taste', label: 'Taste' },
            { value: 'sound', label: 'Sound' },
            { value: 'sight', label: 'Sight' },
          ]}
          value={settings.aiSensoryFocus || []}
          onChange={(val) => onChange('aiSensoryFocus', val)}
        />
      </div>
    </div>
  )
}

function KinkSettings({ settings, onChange, onReset }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Kink Details" onReset={onReset} />
      
      <div className="grid gap-6 p-4 bg-background-tertiary/50 rounded-lg">
        <CheckboxGroup
          label="Tickle Tools"
          options={[
            { value: 'fingers', label: 'Fingers' },
            { value: 'nails', label: 'Nails' },
            { value: 'feathers', label: 'Feathers' },
            { value: 'brushes', label: 'Brushes' },
            { value: 'electric', label: 'Electric' },
            { value: 'tongue', label: 'Tongue' },
          ]}
          value={settings.aiTickleTools || []}
          onChange={(val) => onChange('aiTickleTools', val)}
        />

        <CheckboxGroup
          label="Tickle Spots"
          options={[
            { value: 'feet', label: 'Feet' },
            { value: 'ribs', label: 'Ribs' },
            { value: 'armpits', label: 'Armpits' },
            { value: 'neck', label: 'Neck' },
            { value: 'thighs', label: 'Thighs' },
            { value: 'stomach', label: 'Stomach' },
            { value: 'sides', label: 'Sides' },
            { value: 'knees', label: 'Knees' },
          ]}
          value={settings.aiTickleSpots || []}
          onChange={(val) => onChange('aiTickleSpots', val)}
        />

        <CheckboxGroup
          label="Foot Condition"
          options={[
            { value: 'sweaty', label: 'Sweaty' },
            { value: 'clean', label: 'Clean' },
            { value: 'dirty', label: 'Dirty' },
            { value: 'smelly', label: 'Smelly' },
          ]}
          value={settings.aiFootCondition || []}
          onChange={(val) => onChange('aiFootCondition', val)}
        />

        <CheckboxGroup
          label="Footwear"
          options={[
            { value: 'heels', label: 'Heels' },
            { value: 'boots', label: 'Boots' },
            { value: 'flats', label: 'Flats' },
            { value: 'barefoot', label: 'Barefoot' },
            { value: 'stockings', label: 'Stockings' },
            { value: 'socks', label: 'Socks' },
          ]}
          value={settings.aiFootwear || []}
          onChange={(val) => onChange('aiFootwear', val)}
        />

        <Select
          label="Bondage Level"
          value={settings.aiBondageLevel}
          onChange={(e) => onChange('aiBondageLevel', e.target.value)}
          options={[
            { value: 'none', label: 'None - Free movement' },
            { value: 'light', label: 'Light - Some restraints' },
            { value: 'heavy', label: 'Heavy - Tightly bound' },
            { value: 'inescapable', label: 'Inescapable - Completely helpless' },
          ]}
        />
      </div>
    </div>
  )
}

function MechanicsSettings({ settings, onChange, onReset }) {
  // Calculate current counts for display
  const choiceBalance = settings.choiceBalance ?? 50
  const totalChoiceMax = settings.totalChoiceMax ?? 6
  const engineChoiceMax = settings.engineChoiceMax ?? 4
  const aiChoiceMax = settings.aiChoiceMax ?? 4
  
  const aiRatio = choiceBalance / 100
  const engineRatio = 1 - aiRatio
  
  let displayAiCount = Math.round(totalChoiceMax * aiRatio)
  let displayEngineCount = Math.round(totalChoiceMax * engineRatio)
  
  displayAiCount = Math.min(displayAiCount, aiChoiceMax)
  displayEngineCount = Math.min(displayEngineCount, engineChoiceMax)
  
  if (choiceBalance === 0) {
    displayAiCount = 0
    displayEngineCount = Math.min(engineChoiceMax, totalChoiceMax)
  } else if (choiceBalance === 100) {
    displayEngineCount = 0
    displayAiCount = Math.min(aiChoiceMax, totalChoiceMax)
  } else {
    displayAiCount = Math.max(displayAiCount, 1)
    displayEngineCount = Math.max(displayEngineCount, 1)
  }
  
  return (
    <div className="space-y-6">
      <SectionHeader title="Game Mechanics" onReset={onReset} />
      
      {/* Choice Generation Section */}
      <div className="p-4 bg-background-tertiary/50 rounded-lg space-y-6">
        <h4 className="text-sm font-semibold text-text-primary border-b border-background-elevated pb-2">Choice Generation</h4>
        
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Engine vs AI Balance</label>
          <p className="text-xs text-text-muted mb-3">Controls the source of choices. Engine choices are context-aware archetypes, AI choices are dynamically generated.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-text-muted w-20">All Engine</span>
            <input
              type="range"
              min={0}
              max={100}
              value={choiceBalance}
              onChange={(e) => onChange('choiceBalance', parseInt(e.target.value))}
              className="flex-1 h-2 bg-background-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
            />
            <span className="text-xs text-text-muted w-16 text-right">All AI</span>
            <span className="text-sm text-text-primary w-12 text-right">{choiceBalance}%</span>
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs">
            <span className="px-2 py-1 bg-stat-obedience/20 text-stat-obedience rounded">Engine: ~{displayEngineCount}</span>
            <span className="px-2 py-1 bg-accent-primary/20 text-accent-primary rounded">AI: ~{displayAiCount}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Total Max</label>
            <input
              type="number"
              min={3}
              max={8}
              value={totalChoiceMax}
              onChange={(e) => onChange('totalChoiceMax', Math.min(8, Math.max(3, parseInt(e.target.value) || 6)))}
              className="w-full px-3 py-2 bg-background-tertiary border border-background-elevated rounded-lg text-text-primary text-sm"
            />
            <p className="text-xs text-text-muted mt-1">Total choices shown</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Engine Max</label>
            <input
              type="number"
              min={0}
              max={8}
              value={engineChoiceMax}
              onChange={(e) => onChange('engineChoiceMax', Math.min(8, Math.max(0, parseInt(e.target.value) || 4)))}
              className="w-full px-3 py-2 bg-background-tertiary border border-background-elevated rounded-lg text-text-primary text-sm"
            />
            <p className="text-xs text-text-muted mt-1">Max from templates</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">AI Max</label>
            <input
              type="number"
              min={0}
              max={8}
              value={aiChoiceMax}
              onChange={(e) => onChange('aiChoiceMax', Math.min(8, Math.max(0, parseInt(e.target.value) || 4)))}
              className="w-full px-3 py-2 bg-background-tertiary border border-background-elevated rounded-lg text-text-primary text-sm"
            />
            <p className="text-xs text-text-muted mt-1">Max from AI</p>
          </div>
        </div>
      </div>
      
      {/* Other Mechanics */}
      <div className="grid gap-4 p-4 bg-background-tertiary/50 rounded-lg">
        <h4 className="text-sm font-semibold text-text-primary border-b border-background-elevated pb-2">Dice & Stats</h4>
        
        <Select
          label="Roll Difficulty"
          value={settings.aiRollDifficulty}
          onChange={(e) => onChange('aiRollDifficulty', e.target.value)}
          options={[
            { value: 'easy', label: 'Easy - Lower DCs' },
            { value: 'normal', label: 'Normal' },
            { value: 'hard', label: 'Hard - Higher DCs' },
            { value: 'brutal', label: 'Brutal - Very high DCs' },
          ]}
        />

        <Select
          label="Stat Change Rate"
          value={settings.aiStatChangeRate}
          onChange={(e) => onChange('aiStatChangeRate', e.target.value)}
          options={[
            { value: 'slow', label: 'Slow - Small changes' },
            { value: 'normal', label: 'Normal' },
            { value: 'fast', label: 'Fast - Large swings' },
          ]}
        />

        <Select
          label="Random Event Frequency"
          value={settings.aiEventFrequency}
          onChange={(e) => onChange('aiEventFrequency', e.target.value)}
          options={[
            { value: 'rare', label: 'Rare' },
            { value: 'normal', label: 'Normal' },
            { value: 'frequent', label: 'Frequent' },
          ]}
        />
      </div>
    </div>
  )
}

function ImmersionSettings({ settings, onChange, onReset }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Immersion Settings" onReset={onReset} />
      
      <div className="grid gap-4 p-4 bg-background-tertiary/50 rounded-lg">
        <Select
          label="Player Inner Thoughts"
          value={settings.aiInnerThoughts}
          onChange={(e) => onChange('aiInnerThoughts', e.target.value)}
          options={[
            { value: 'none', label: 'None' },
            { value: 'occasional', label: 'Occasional' },
            { value: 'frequent', label: 'Frequent' },
          ]}
          hint="Player's internal monologue"
        />

        <Select
          label="Environmental Detail"
          value={settings.aiEnvironmentalDetail}
          onChange={(e) => onChange('aiEnvironmentalDetail', e.target.value)}
          options={[
            { value: 'minimal', label: 'Minimal' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'rich', label: 'Rich - Detailed settings' },
          ]}
        />

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.aiSoundDescriptions}
            onChange={(e) => onChange('aiSoundDescriptions', e.target.checked)}
            className="w-4 h-4 rounded border-background-elevated bg-background-tertiary text-accent-primary focus:ring-accent-primary"
          />
          <div>
            <span className="text-text-primary">Sound Descriptions</span>
            <p className="text-xs text-text-muted">Include sounds like "her laugh echoes..."</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.aiTimeAwareness}
            onChange={(e) => onChange('aiTimeAwareness', e.target.checked)}
            className="w-4 h-4 rounded border-background-elevated bg-background-tertiary text-accent-primary focus:ring-accent-primary"
          />
          <div>
            <span className="text-text-primary">Time Awareness</span>
            <p className="text-xs text-text-muted">"Hours pass...", "The clock strikes..."</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.aiSurpriseEvents}
            onChange={(e) => onChange('aiSurpriseEvents', e.target.checked)}
            className="w-4 h-4 rounded border-background-elevated bg-background-tertiary text-accent-primary focus:ring-accent-primary"
          />
          <div>
            <span className="text-text-primary">Surprise Events</span>
            <p className="text-xs text-text-muted">Unexpected plot twists</p>
          </div>
        </label>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            AI Creativity (Temperature): {settings.aiCreativity}
          </label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={settings.aiCreativity}
            onChange={(e) => onChange('aiCreativity', parseFloat(e.target.value))}
            className="w-full h-2 bg-background-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>Predictable</span>
            <span>Creative</span>
          </div>
        </div>

        <Select
          label="Story Continuity"
          value={settings.aiContinuity}
          onChange={(e) => onChange('aiContinuity', e.target.value)}
          options={[
            { value: 'loose', label: 'Loose - Fresh each scene' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'strict', label: 'Strict - References past events' },
          ]}
        />

        <Select
          label="NPC Consistency"
          value={settings.aiNpcConsistency}
          onChange={(e) => onChange('aiNpcConsistency', e.target.value)}
          options={[
            { value: 'flexible', label: 'Flexible - NPCs can vary' },
            { value: 'strict', label: 'Strict - True to profiles' },
          ]}
        />
      </div>
    </div>
  )
}

function VisualSettings({ settings, onChange, onReset }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Visual Settings" onReset={onReset} />
      
      <div className="grid gap-4 p-4 bg-background-tertiary/50 rounded-lg">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enableBackgrounds}
            onChange={(e) => onChange('enableBackgrounds', e.target.checked)}
            className="w-4 h-4 rounded border-background-elevated bg-background-tertiary text-accent-primary focus:ring-accent-primary"
          />
          <span className="text-text-primary">Enable scene backgrounds</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enablePortraits}
            onChange={(e) => onChange('enablePortraits', e.target.checked)}
            className="w-4 h-4 rounded border-background-elevated bg-background-tertiary text-accent-primary focus:ring-accent-primary"
          />
          <span className="text-text-primary">Enable NPC portraits</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enableDiceAnimation}
            onChange={(e) => onChange('enableDiceAnimation', e.target.checked)}
            className="w-4 h-4 rounded border-background-elevated bg-background-tertiary text-accent-primary focus:ring-accent-primary"
          />
          <span className="text-text-primary">Enable dice animations</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enableSlideshow}
            onChange={(e) => onChange('enableSlideshow', e.target.checked)}
            className="w-4 h-4 rounded border-background-elevated bg-background-tertiary text-accent-primary focus:ring-accent-primary"
          />
          <span className="text-text-primary">Enable background slideshow</span>
        </label>

        {settings.enableSlideshow && (
          <>
            <Input
              label="Slideshow Interval (ms)"
              type="number"
              value={settings.slideshowInterval}
              onChange={(e) => onChange('slideshowInterval', parseInt(e.target.value) || 10000)}
              min={1000}
              max={60000}
            />

            <Select
              label="Transition Style"
              value={settings.slideshowTransition}
              onChange={(e) => onChange('slideshowTransition', e.target.value)}
              options={[
                { value: 'fade', label: 'Fade' },
                { value: 'crossfade', label: 'Crossfade' },
                { value: 'slide', label: 'Slide' },
              ]}
            />
          </>
        )}
      </div>
    </div>
  )
}

function DebugSettings({ settings, onChange, onReset }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Debug Settings" onReset={onReset} />
      
      <div className="grid gap-4 p-4 bg-background-tertiary/50 rounded-lg">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.debugOverlay}
            onChange={(e) => onChange('debugOverlay', e.target.checked)}
            className="w-4 h-4 rounded border-background-elevated bg-background-tertiary text-accent-primary focus:ring-accent-primary"
          />
          <span className="text-text-primary">Show debug overlay</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.logApiCalls}
            onChange={(e) => onChange('logApiCalls', e.target.checked)}
            className="w-4 h-4 rounded border-background-elevated bg-background-tertiary text-accent-primary focus:ring-accent-primary"
          />
          <span className="text-text-primary">Log API calls</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.logDiceRolls}
            onChange={(e) => onChange('logDiceRolls', e.target.checked)}
            className="w-4 h-4 rounded border-background-elevated bg-background-tertiary text-accent-primary focus:ring-accent-primary"
          />
          <span className="text-text-primary">Log dice rolls</span>
        </label>
      </div>
    </div>
  )
}

export default SettingsTab
