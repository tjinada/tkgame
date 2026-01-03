import { useState, useEffect } from 'react'
import { Input } from '../../ui/Input'
import { Select } from '../../ui/Select'
import { Button } from '../../ui/Button'
import { TabPanel } from '../../ui/Tabs'
import { settingsService } from '../../../services/SettingsService'
import { Save, RotateCcw, Eye, EyeOff } from 'lucide-react'

export function SettingsTab() {
  const [settings, setSettings] = useState(settingsService.getAll())
  const [showApiKey, setShowApiKey] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const unsubscribe = settingsService.subscribe(setSettings)
    return unsubscribe
  }, [])

  const handleChange = (key, value) => {
    settingsService.set(key, value)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleResetCategory = (category) => {
    if (confirm(`Reset ${category} settings to defaults?`)) {
      settingsService.resetCategory(category)
    }
  }

  const handleResetAll = () => {
    if (confirm('Reset ALL settings to defaults? This cannot be undone.')) {
      settingsService.reset()
    }
  }

  return (
    <TabPanel>
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* API Settings */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">API Settings</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleResetCategory('api')}
            >
              <RotateCcw size={14} className="mr-1" /> Reset
            </Button>
          </div>
          
          <div className="grid gap-4 p-4 bg-background-tertiary/50 rounded-lg">
            <div className="relative">
              <Input
                label="API Key"
                type={showApiKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={(e) => handleChange('apiKey', e.target.value)}
                placeholder="sk-nano-..."
                hint="Your NanoGPT API key"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-8 text-text-muted hover:text-text-primary"
              >
                {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <Input
              label="Base URL"
              value={settings.baseUrl}
              onChange={(e) => handleChange('baseUrl', e.target.value)}
              placeholder="https://nano-gpt.com/api/v1"
            />
            
            <Input
              label="Model"
              value={settings.model}
              onChange={(e) => handleChange('model', e.target.value)}
              placeholder="chatgpt-4o-latest"
              hint="e.g., chatgpt-4o-latest, gpt-4-turbo, claude-3-5-sonnet"
            />
          </div>
        </section>

        {/* Content Settings */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">Content Settings</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleResetCategory('content')}
            >
              <RotateCcw size={14} className="mr-1" /> Reset
            </Button>
          </div>
          
          <div className="grid gap-4 p-4 bg-background-tertiary/50 rounded-lg">
            <Select
              label="Content Mode"
              value={settings.contentMode}
              onChange={(e) => handleChange('contentMode', e.target.value)}
              options={[
                { value: 'json-only', label: 'JSON Only (pre-written scenarios)' },
                { value: 'ai-only', label: 'AI Only (all generated)' },
                { value: 'hybrid', label: 'Hybrid (JSON + AI fallback)' },
              ]}
              hint="How content is generated"
            />
            
            <Select
              label="Context Mode"
              value={settings.contextMode}
              onChange={(e) => handleChange('contextMode', e.target.value)}
              options={[
                { value: 'last-n-turns', label: 'Last N Turns' },
                { value: 'full-chapter', label: 'Full Chapter' },
                { value: 'token-budget', label: 'Token Budget' },
              ]}
              hint="How much history to include in AI prompts"
            />
            
            <Input
              label="Context Limit"
              type="number"
              value={settings.contextLimit}
              onChange={(e) => handleChange('contextLimit', parseInt(e.target.value) || 10)}
              min={1}
              max={50}
              hint="Number of turns or token budget"
            />
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.streamResponses}
                onChange={(e) => handleChange('streamResponses', e.target.checked)}
                className="w-4 h-4 rounded border-background-elevated bg-background-tertiary text-accent-primary focus:ring-accent-primary"
              />
              <span className="text-text-primary">Enable streaming responses</span>
            </label>
          </div>
        </section>

        {/* AI Behavior Settings */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">AI Behavior</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleResetCategory('aiBehavior')}
            >
              <RotateCcw size={14} className="mr-1" /> Reset
            </Button>
          </div>
          
          <div className="grid gap-4 p-4 bg-background-tertiary/50 rounded-lg">
            <Select
              label="Humiliation Level"
              value={settings.aiHumiliationLevel}
              onChange={(e) => handleChange('aiHumiliationLevel', e.target.value)}
              options={[
                { value: 'none', label: 'None' },
                { value: 'mild', label: 'Mild' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'heavy', label: 'Heavy' },
                { value: 'extreme', label: 'Extreme' },
              ]}
              hint="How much verbal degradation and humiliation"
            />
            
            <Select
              label="Swearing Level"
              value={settings.aiSwearingLevel}
              onChange={(e) => handleChange('aiSwearingLevel', e.target.value)}
              options={[
                { value: 'none', label: 'None' },
                { value: 'mild', label: 'Mild' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'heavy', label: 'Heavy' },
              ]}
              hint="Amount of profanity in dialogue"
            />
            
            <Select
              label="Response Length"
              value={settings.aiResponseLength}
              onChange={(e) => handleChange('aiResponseLength', e.target.value)}
              options={[
                { value: 'short', label: 'Short (100-200 words)' },
                { value: 'medium', label: 'Medium (200-400 words)' },
                { value: 'long', label: 'Long (400-600 words)' },
              ]}
              hint="Length of narrative responses"
            />
            
            <Select
              label="Style"
              value={settings.aiConversationalStyle}
              onChange={(e) => handleChange('aiConversationalStyle', e.target.value)}
              options={[
                { value: 'narrative', label: 'Narrative (more description)' },
                { value: 'balanced', label: 'Balanced' },
                { value: 'conversational', label: 'Conversational (more dialogue)' },
              ]}
              hint="Balance between narration and dialogue"
            />
            
            <Select
              label="Intensity"
              value={settings.aiIntensity}
              onChange={(e) => handleChange('aiIntensity', e.target.value)}
              options={[
                { value: 'gentle', label: 'Gentle' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'intense', label: 'Intense' },
                { value: 'brutal', label: 'Brutal' },
              ]}
              hint="Overall intensity of scenes"
            />
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Fetish Focus
              </label>
              <p className="text-xs text-text-muted mb-3">Select fetishes to emphasize (leave empty for balanced)</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 'tickling', label: 'Tickling' },
                  { value: 'feet', label: 'Feet' },
                  { value: 'sweat', label: 'Sweat' },
                  { value: 'edging', label: 'Edging' },
                  { value: 'pot', label: 'POT' },
                  { value: 'bondage', label: 'Bondage' },
                  { value: 'verbal', label: 'Verbal' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer p-2 rounded bg-background-secondary/50 hover:bg-background-secondary">
                    <input
                      type="checkbox"
                      checked={settings.aiFetishFocus?.includes(value) || false}
                      onChange={(e) => {
                        const current = settings.aiFetishFocus || []
                        if (e.target.checked) {
                          handleChange('aiFetishFocus', [...current, value])
                        } else {
                          handleChange('aiFetishFocus', current.filter(f => f !== value))
                        }
                      }}
                      className="w-4 h-4 rounded border-background-elevated bg-background-tertiary text-accent-primary focus:ring-accent-primary"
                    />
                    <span className="text-sm text-text-primary">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Visual Settings */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">Visual Settings</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleResetCategory('visual')}
            >
              <RotateCcw size={14} className="mr-1" /> Reset
            </Button>
          </div>
          
          <div className="grid gap-3 p-4 bg-background-tertiary/50 rounded-lg">
            {[
              { key: 'enableBackgrounds', label: 'Show scene backgrounds' },
              { key: 'enablePortraits', label: 'Show NPC portraits' },
              { key: 'enableDiceAnimation', label: 'Animate dice rolls' },
              { key: 'enableEffects', label: 'Show visual effects' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(e) => handleChange(key, e.target.checked)}
                  className="w-4 h-4 rounded border-background-elevated bg-background-tertiary text-accent-primary focus:ring-accent-primary"
                />
                <span className="text-text-primary">{label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Slideshow Settings */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">Slideshow Settings</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleResetCategory('slideshow')}
            >
              <RotateCcw size={14} className="mr-1" /> Reset
            </Button>
          </div>
          
          <div className="grid gap-4 p-4 bg-background-tertiary/50 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableSlideshow}
                onChange={(e) => handleChange('enableSlideshow', e.target.checked)}
                className="w-4 h-4 rounded border-background-elevated bg-background-tertiary text-accent-primary focus:ring-accent-primary"
              />
              <span className="text-text-primary">Enable slideshow background</span>
            </label>
            
            <Input
              label="Interval (ms)"
              type="number"
              value={settings.slideshowInterval}
              onChange={(e) => handleChange('slideshowInterval', parseInt(e.target.value) || 10000)}
              min={1000}
              max={60000}
              step={1000}
              hint="Time between slides"
              disabled={!settings.enableSlideshow}
            />
            
            <Select
              label="Transition"
              value={settings.slideshowTransition}
              onChange={(e) => handleChange('slideshowTransition', e.target.value)}
              options={[
                { value: 'fade', label: 'Fade' },
                { value: 'crossfade', label: 'Crossfade' },
                { value: 'slide', label: 'Slide' },
              ]}
              disabled={!settings.enableSlideshow}
            />
            
            <Input
              label="Transition Duration (ms)"
              type="number"
              value={settings.slideshowTransitionDuration}
              onChange={(e) => handleChange('slideshowTransitionDuration', parseInt(e.target.value) || 1500)}
              min={100}
              max={5000}
              step={100}
              disabled={!settings.enableSlideshow}
            />
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.slideshowShuffle}
                onChange={(e) => handleChange('slideshowShuffle', e.target.checked)}
                disabled={!settings.enableSlideshow}
                className="w-4 h-4 rounded border-background-elevated bg-background-tertiary text-accent-primary focus:ring-accent-primary disabled:opacity-50"
              />
              <span className={`${settings.enableSlideshow ? 'text-text-primary' : 'text-text-muted'}`}>
                Shuffle order
              </span>
            </label>
          </div>
        </section>

        {/* Debug Settings */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">Debug Settings</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleResetCategory('debug')}
            >
              <RotateCcw size={14} className="mr-1" /> Reset
            </Button>
          </div>
          
          <div className="grid gap-3 p-4 bg-background-tertiary/50 rounded-lg">
            {[
              { key: 'debugOverlay', label: 'Show debug overlay' },
              { key: 'logApiCalls', label: 'Log API calls' },
              { key: 'logDiceRolls', label: 'Log dice rolls' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(e) => handleChange(key, e.target.checked)}
                  className="w-4 h-4 rounded border-background-elevated bg-background-tertiary text-accent-primary focus:ring-accent-primary"
                />
                <span className="text-text-primary">{label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-background-tertiary">
          <Button variant="danger" onClick={handleResetAll}>
            <RotateCcw size={16} className="mr-2" />
            Reset All Settings
          </Button>
          
          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-sm text-accent-success">Settings auto-saved!</span>
            )}
            <Button variant="primary" onClick={handleSave}>
              <Save size={16} className="mr-2" />
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </TabPanel>
  )
}

export default SettingsTab
