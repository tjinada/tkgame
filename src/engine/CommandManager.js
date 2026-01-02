import { saveSystem } from './SaveSystem'

export class CommandManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine
    this.isPaused = false
    this.isAdminMode = false
  }

  /**
   * Execute a game command
   * @param {string} command - Command name
   * @param {Object} params - Optional parameters
   * @returns {Promise<Object>} - Command result
   */
  async executeCommand(command, params = {}) {
    const commands = {
      'start': () => this.startNewGame(),
      'continue': () => this.continueGame(),
      'save': () => this.saveGame(params.slotId, params.name),
      'load': () => this.loadGame(params.slotId),
      'quicksave': () => this.quickSave(),
      'quickload': () => this.quickLoad(),
      'pause': () => this.pauseGame(),
      'resume': () => this.resumeGame(),
      'admin': () => this.enterAdminMode(),
      'exitadmin': () => this.exitAdminMode(),
      'delete': () => this.deleteSave(params.slotId),
    }

    const handler = commands[command.toLowerCase()]
    if (!handler) {
      console.error(`Unknown command: ${command}`)
      return { success: false, error: 'Unknown command' }
    }

    return handler()
  }

  /**
   * Start a new game
   */
  async startNewGame() {
    if (this.gameEngine) {
      await this.gameEngine.startNewGame()
    }
    this.isPaused = false
    this.isAdminMode = false
    return { success: true, action: 'started' }
  }

  /**
   * Continue from last save
   */
  async continueGame() {
    // Try auto-save first
    let state = await saveSystem.load('auto')
    
    // If no auto-save, try most recent manual save
    if (!state) {
      const saves = await saveSystem.listSaves()
      if (saves.length > 0) {
        state = await saveSystem.load(saves[0].id)
      }
    }

    if (state && this.gameEngine) {
      await this.gameEngine.continueGame(state)
      this.isPaused = false
      return { success: true, action: 'continued' }
    }

    // No save found - start a new game instead
    console.log('No save found, starting new game')
    return this.startNewGame()
  }

  /**
   * Save game to a slot
   */
  async saveGame(slotId = '1', name = null) {
    if (!this.gameEngine) {
      return { success: false, error: 'No game engine' }
    }

    const state = this.gameEngine.getState()
    const slot = await saveSystem.save(slotId, state, name)
    return { success: true, action: 'saved', slot }
  }

  /**
   * Load game from a slot
   */
  async loadGame(slotId) {
    const state = await saveSystem.load(slotId)
    if (!state) {
      return { success: false, error: 'Save not found' }
    }

    if (this.gameEngine) {
      await this.gameEngine.continueGame(state)
      this.isPaused = false
    }
    return { success: true, action: 'loaded' }
  }

  /**
   * Quick save
   */
  async quickSave() {
    if (!this.gameEngine) {
      return { success: false, error: 'No game engine' }
    }

    const state = this.gameEngine.getState()
    await saveSystem.quickSave(state)
    return { success: true, action: 'quicksaved' }
  }

  /**
   * Quick load
   */
  async quickLoad() {
    const state = await saveSystem.quickLoad()
    if (!state) {
      return { success: false, error: 'No quick save found' }
    }

    if (this.gameEngine) {
      await this.gameEngine.continueGame(state)
    }
    return { success: true, action: 'quickloaded' }
  }

  /**
   * Pause game
   */
  pauseGame() {
    this.isPaused = true
    return { success: true, action: 'paused' }
  }

  /**
   * Resume game
   */
  resumeGame() {
    this.isPaused = false
    this.isAdminMode = false
    return { success: true, action: 'resumed' }
  }

  /**
   * Enter admin mode
   */
  enterAdminMode() {
    this.isAdminMode = true
    this.isPaused = true
    return { success: true, action: 'admin' }
  }

  /**
   * Exit admin mode
   */
  exitAdminMode() {
    this.isAdminMode = false
    this.isPaused = false
    return { success: true, action: 'exitadmin' }
  }

  /**
   * Delete a save
   */
  async deleteSave(slotId) {
    await saveSystem.delete(slotId)
    return { success: true, action: 'deleted' }
  }

  /**
   * Get list of saves
   */
  async getSaves() {
    return await saveSystem.listSaves()
  }

  /**
   * Check if game is paused
   */
  getIsPaused() {
    return this.isPaused
  }

  /**
   * Check if in admin mode
   */
  getIsAdminMode() {
    return this.isAdminMode
  }
}

export default CommandManager
