import configData from '../data/config.json'

// Failure severity thresholds
const SEVERITY = {
  NEAR_MISS: { min: 1, max: 3, multiplier: 0.5, name: 'Near Miss' },
  STANDARD: { min: 4, max: 7, multiplier: 1.0, name: 'Standard Failure' },
  BAD: { min: 8, max: 11, multiplier: 1.5, name: 'Bad Failure' },
  CATASTROPHIC: { min: 12, max: Infinity, multiplier: 2.0, name: 'Catastrophic Failure' },
}

// Base automatic penalties on failure
const BASE_FAILURE_PENALTIES = {
  endurance: -5,
  obedience: -3,
}

// Critical failure extra penalties
const CRITICAL_FAILURE_EXTRAS = {
  sensitivity: 10,
  affinityPenalty: -5,
}

// Critical success bonuses
const CRITICAL_SUCCESS_BONUSES = {
  endurance: 5,
  affinityBonus: 3,
}

export class DiceSystem {
  constructor(stateManager) {
    this.stateManager = stateManager
  }

  /**
   * Roll a d20 with optional modifiers
   * @param {Object} options - Roll options
   * @returns {RollResult}
   */
  roll(options = {}) {
    const {
      dc = null,
      statModifier = null,
      affinityModifier = null,
      hidden = false,
    } = options

    // Base d20 roll
    const base = Math.floor(Math.random() * 20) + 1
    const modifiers = []

    // Add stat modifier
    if (statModifier && this.stateManager) {
      const statValue = this.stateManager.getStat(statModifier)
      const mod = Math.floor(statValue / 10)
      if (mod !== 0) {
        modifiers.push({ source: statModifier, value: mod })
      }
    }

    // Add affinity modifier
    if (affinityModifier && this.stateManager) {
      const affValue = this.stateManager.getAffinity(affinityModifier)
      const mod = Math.floor(affValue / 10)
      if (mod !== 0) {
        modifiers.push({ source: `${affinityModifier} affinity`, value: mod })
      }
    }

    // Calculate total
    const total = base + modifiers.reduce((sum, m) => sum + m.value, 0)

    // Determine critical status
    const isCriticalSuccess = base === 20
    const isCriticalFailure = base === 1

    // Determine success/failure (crits override normal calculation)
    let success = null
    let missedBy = 0
    let severity = null

    if (dc !== null) {
      if (isCriticalSuccess) {
        success = true
      } else if (isCriticalFailure) {
        success = false
        missedBy = dc - total
        severity = this._calculateSeverity(missedBy, true)
      } else {
        success = total >= dc
        if (!success) {
          missedBy = dc - total
          severity = this._calculateSeverity(missedBy, false)
        }
      }
    }

    // Calculate automatic penalties/bonuses
    const autoEffects = this._calculateAutoEffects(success, isCriticalSuccess, isCriticalFailure, severity)

    return {
      base,
      modifiers,
      total,
      dc,
      success,
      critical: isCriticalSuccess ? 'success' : (isCriticalFailure ? 'failure' : null),
      hidden,
      // Enhanced failure data
      missedBy,
      severity,
      autoEffects,
    }
  }

  /**
   * Calculate failure severity based on how much the roll missed by
   * @param {number} missedBy - How much the roll missed the DC by
   * @param {boolean} isCritical - Whether this is a critical failure
   * @returns {Object}
   */
  _calculateSeverity(missedBy, isCritical) {
    let severityLevel
    
    if (missedBy <= SEVERITY.NEAR_MISS.max) {
      severityLevel = SEVERITY.NEAR_MISS
    } else if (missedBy <= SEVERITY.STANDARD.max) {
      severityLevel = SEVERITY.STANDARD
    } else if (missedBy <= SEVERITY.BAD.max) {
      severityLevel = SEVERITY.BAD
    } else {
      severityLevel = SEVERITY.CATASTROPHIC
    }

    // Critical failures double the multiplier
    const multiplier = isCritical ? severityLevel.multiplier * 2 : severityLevel.multiplier

    return {
      name: isCritical ? `CRITICAL: ${severityLevel.name}` : severityLevel.name,
      missedBy,
      multiplier,
      isCritical,
    }
  }

  /**
   * Calculate automatic effects based on roll result
   * @param {boolean|null} success
   * @param {boolean} isCriticalSuccess
   * @param {boolean} isCriticalFailure
   * @param {Object|null} severity
   * @returns {Object}
   */
  _calculateAutoEffects(success, isCriticalSuccess, isCriticalFailure, severity) {
    const effects = {
      statChanges: {},
      affinityChange: 0,
      description: '',
    }

    if (isCriticalSuccess) {
      // Critical success bonuses
      effects.statChanges.endurance = CRITICAL_SUCCESS_BONUSES.endurance
      effects.affinityChange = CRITICAL_SUCCESS_BONUSES.affinityBonus
      effects.description = 'Perfect execution! Your confidence soars.'
    } else if (success === false && severity) {
      // Failure penalties scaled by severity
      const multiplier = severity.multiplier

      effects.statChanges.endurance = Math.round(BASE_FAILURE_PENALTIES.endurance * multiplier)
      effects.statChanges.obedience = Math.round(BASE_FAILURE_PENALTIES.obedience * multiplier)

      // Critical failure extras
      if (isCriticalFailure) {
        effects.statChanges.sensitivity = CRITICAL_FAILURE_EXTRAS.sensitivity
        effects.affinityChange = CRITICAL_FAILURE_EXTRAS.affinityPenalty
        effects.description = 'A humiliating disaster. The punishment will be severe.'
      } else if (severity.multiplier >= 2) {
        effects.description = 'A catastrophic failure. You brace for the worst.'
      } else if (severity.multiplier >= 1.5) {
        effects.description = 'A painful failure. Consequences await.'
      } else if (severity.multiplier >= 1) {
        effects.description = 'You failed. Punishment is coming.'
      } else {
        effects.description = 'A narrow miss. Perhaps mercy will follow.'
      }
    }

    return effects
  }

  /**
   * Calculate modifier value from a stat
   * @param {string} statName
   * @returns {number}
   */
  calculateModifier(statName) {
    if (!this.stateManager) return 0
    const statValue = this.stateManager.getStat(statName)
    return Math.floor(statValue / 10)
  }

  /**
   * Check if roll is critical success
   * @param {Object} result
   * @returns {boolean}
   */
  isCriticalSuccess(result) {
    return result.critical === 'success'
  }

  /**
   * Check if roll is critical failure
   * @param {Object} result
   * @returns {boolean}
   */
  isCriticalFailure(result) {
    return result.critical === 'failure'
  }
}

export default DiceSystem
