export class DiceSystem {
  constructor(stateManager) {
    this.stateManager = stateManager
  }

  /**
   * Roll a d20 with optional modifiers
   * @param {Object} options - Roll options
   * @param {number} options.dc - Difficulty class (optional)
   * @param {string} options.statModifier - Stat name to add as modifier (optional)
   * @param {string} options.affinityModifier - NPC id to add affinity modifier (optional)
   * @param {boolean} options.hidden - Whether this is a hidden roll (optional)
   * @returns {RollResult}
   */
  roll(options = {}) {
    const { dc = null, statModifier = null, affinityModifier = null, hidden = false } = options

    // Roll base d20
    const base = Math.floor(Math.random() * 20) + 1

    // Calculate modifiers
    const modifiers = []

    if (statModifier && this.stateManager) {
      const statValue = this.stateManager.getStat(statModifier)
      const mod = Math.floor(statValue / 10)
      if (mod !== 0) {
        modifiers.push({
          source: statModifier,
          value: mod,
        })
      }
    }

    if (affinityModifier && this.stateManager) {
      const affinityValue = this.stateManager.getAffinity(affinityModifier)
      const mod = Math.floor(affinityValue / 10)
      if (mod !== 0) {
        modifiers.push({
          source: `${affinityModifier} affinity`,
          value: mod,
        })
      }
    }

    // Calculate total
    const totalModifier = modifiers.reduce((sum, m) => sum + m.value, 0)
    const total = base + totalModifier

    // Determine success/failure if DC provided
    let success = null
    if (dc !== null) {
      success = total >= dc
    }

    // Check for criticals (based on base roll, not total)
    let critical = null
    if (base === 20) {
      critical = 'success'
    } else if (base === 1) {
      critical = 'failure'
    }

    return {
      base,
      modifiers,
      total,
      dc,
      success,
      critical,
      hidden,
    }
  }

  /**
   * Calculate modifier for a stat
   * @param {string} statName - The stat name
   * @returns {number} The modifier value
   */
  calculateModifier(statName) {
    if (!this.stateManager) return 0
    const statValue = this.stateManager.getStat(statName)
    return Math.floor(statValue / 10)
  }

  /**
   * Check if a roll is a critical success
   * @param {RollResult} result - The roll result
   * @returns {boolean}
   */
  isCriticalSuccess(result) {
    return result.critical === 'success'
  }

  /**
   * Check if a roll is a critical failure
   * @param {RollResult} result - The roll result
   * @returns {boolean}
   */
  isCriticalFailure(result) {
    return result.critical === 'failure'
  }

  /**
   * Format roll result for display
   * @param {RollResult} result - The roll result
   * @returns {string}
   */
  formatResult(result) {
    let str = `d20: ${result.base}`
    
    for (const mod of result.modifiers) {
      const sign = mod.value >= 0 ? '+' : ''
      str += ` ${sign}${mod.value} (${mod.source})`
    }
    
    str += ` = ${result.total}`
    
    if (result.dc !== null) {
      str += ` vs DC ${result.dc}`
      str += result.success ? ' [SUCCESS]' : ' [FAILURE]'
    }
    
    if (result.critical) {
      str += ` [CRITICAL ${result.critical.toUpperCase()}!]`
    }
    
    return str
  }
}

export default DiceSystem
