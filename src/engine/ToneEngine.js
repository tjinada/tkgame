import configData from '../data/config.json'

const TONE_RULES = configData.toneRules

export class ToneEngine {
  constructor(stateManager) {
    this.stateManager = stateManager
  }

  /**
   * Compute active tones based on current game state
   * @returns {string[]} - Array of active tone names, sorted by priority
   */
  computeActiveTones() {
    if (!this.stateManager) return ['Neutral']

    const state = this.stateManager.getState()
    const activeTones = []

    for (const rule of TONE_RULES) {
      if (this._checkTriggers(rule.triggers, state)) {
        activeTones.push({
          axis: rule.axis,
          priority: rule.priority,
        })
      }
    }

    // Sort by priority (higher = more dominant)
    activeTones.sort((a, b) => b.priority - a.priority)

    return activeTones.map(t => t.axis)
  }

  /**
   * Get the primary (highest priority) active tone
   * @returns {string}
   */
  getPrimaryTone() {
    const tones = this.computeActiveTones()
    return tones[0] || 'Neutral'
  }

  /**
   * Get CSS-style properties for the current tone
   * @returns {Object}
   */
  getToneStyles() {
    const tone = this.getPrimaryTone()

    const styles = {
      Soft: {
        color: '#c4b5fd',
        fontStyle: 'normal',
        textShadow: '0 0 10px rgba(196, 181, 253, 0.2)',
      },
      Neutral: {
        color: '#f8fafc',
        fontStyle: 'normal',
        textShadow: 'none',
      },
      Aggressive: {
        color: '#fca5a5',
        fontStyle: 'normal',
        textShadow: '0 0 10px rgba(252, 165, 165, 0.2)',
      },
      Swearing: {
        color: '#f472b6',
        fontStyle: 'normal',
        textShadow: '0 0 10px rgba(244, 114, 182, 0.3)',
      },
      Humiliating: {
        color: '#ef4444',
        fontStyle: 'italic',
        textShadow: '0 0 15px rgba(239, 68, 68, 0.3)',
      },
    }

    return styles[tone] || styles.Neutral
  }

  /**
   * Get tone-specific modifiers for AI prompts
   * @returns {Object}
   */
  getToneModifiers() {
    const tone = this.getPrimaryTone()

    const modifiers = {
      Soft: {
        intensity: 'gentle',
        language: 'teasing, encouraging',
        examples: ['Good boy...', 'That\'s it...', 'You\'re learning...'],
      },
      Neutral: {
        intensity: 'moderate',
        language: 'commanding, direct',
        examples: ['On your knees.', 'Do as I say.', 'Now.'],
      },
      Aggressive: {
        intensity: 'harsh',
        language: 'sharp, threatening',
        examples: ['Move it!', 'Did I stutter?', 'You\'ll regret that.'],
      },
      Swearing: {
        intensity: 'extreme',
        language: 'profane, crude, degrading',
        examples: ['explicit language permitted'],
      },
      Humiliating: {
        intensity: 'maximum',
        language: 'degrading, personal, cruel',
        examples: ['Pathetic.', 'Look at yourself.', 'Worthless.'],
      },
    }

    return modifiers[tone] || modifiers.Neutral
  }

  /**
   * Update the state manager with current tone
   */
  updateStateTone() {
    if (this.stateManager) {
      const tone = this.getPrimaryTone()
      this.stateManager.setActiveTone(tone)
    }
  }

  /**
   * Check if trigger conditions are met
   * @param {string[]} triggers - Array of trigger strings
   * @param {Object} state - Current game state
   * @returns {boolean}
   */
  _checkTriggers(triggers, state) {
    for (const trigger of triggers) {
      if (trigger === 'default') return true

      // Parse trigger conditions
      if (trigger.includes('sandyAffinity > ')) {
        const threshold = parseInt(trigger.split('> ')[1])
        if (state.affinities.sandy > threshold) return true
      }

      if (trigger.includes('endurance < ')) {
        const threshold = parseInt(trigger.split('< ')[1])
        if (state.stats.endurance < threshold) return true
      }

      if (trigger.includes('arousal > ')) {
        const threshold = parseInt(trigger.split('> ')[1])
        if (state.stats.arousal > threshold) return true
      }

      if (trigger.includes('obedience < ')) {
        const threshold = parseInt(trigger.split('< ')[1])
        if (state.stats.obedience < threshold) return true
      }

      if (trigger === 'defiance' && state.flags.recentDefiance) return true
      if (trigger === 'perfectSubmit' && state.flags.perfectSubmit) return true
      if (trigger === 'mercyEvent' && state.flags.mercyEvent) return true
      if (trigger === 'groupScene' && state.flags.groupScene) return true
      if (trigger === 'bullyingEvent' && state.flags.bullyingEvent) return true
      if (trigger === 'hesitation' && state.flags.hesitation) return true
      if (trigger === 'collapse' && state.stats.endurance <= 0) return true

      // Count hostile NPCs
      if (trigger.includes('hostileCount >= ')) {
        const threshold = parseInt(trigger.split('>= ')[1])
        const hostileCount = Object.values(state.affinities).filter(a => a < -30).length
        if (hostileCount >= threshold) return true
      }

      if (trigger === 'enemyNpcs') {
        const enemyCount = Object.values(state.affinities).filter(a => a < -50).length
        if (enemyCount > 0) return true
      }
    }

    return false
  }
}

export default ToneEngine
