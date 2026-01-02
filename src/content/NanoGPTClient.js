import { env } from '../config/env'

export class NanoGPTClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || env.nanoGPT.apiKey
    this.baseUrl = config.baseUrl || env.nanoGPT.baseUrl
    this.model = config.model || env.nanoGPT.model
    this.errorCallbacks = []
  }

  /**
   * Send a chat completion request (non-streaming)
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>}
   */
  async chat(messages, options = {}) {
    const {
      model = this.model,
      maxTokens = 1500,
      temperature = 0.85,
    } = options

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('NanoGPT API error:', response.status, errorData)
        this._emitError(new Error(`API error: ${response.status}`))
        return { error: true, status: response.status, content: null }
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''

      return {
        error: false,
        content,
        usage: data.usage,
        model: data.model,
      }
    } catch (error) {
      console.error('NanoGPT request failed:', error)
      this._emitError(error)
      return { error: true, content: null }
    }
  }

  /**
   * Send a streaming chat completion request
   * @param {Array} messages - Array of message objects
   * @param {Function} onChunk - Callback for each text chunk
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>}
   */
  async streamChat(messages, onChunk, options = {}) {
    const {
      model = this.model,
      maxTokens = 1500,
      temperature = 0.85,
    } = options

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
          stream: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('NanoGPT API error:', response.status, errorData)
        this._emitError(new Error(`API error: ${response.status}`))
        return { error: true, status: response.status, content: null }
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        
        // Process complete lines
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          
          // Handle [DONE] marker
          if (trimmed === '[DONE]' || trimmed === 'data: [DONE]') {
            break
          }
          
          // Extract data from SSE format
          let jsonStr = trimmed
          if (trimmed.startsWith('data: ')) {
            jsonStr = trimmed.slice(6)
          }
          
          if (jsonStr === '[DONE]') break
          
          try {
            const json = JSON.parse(jsonStr)
            const delta = json.choices?.[0]?.delta?.content || ''
            if (delta) {
              fullContent += delta
              onChunk(delta, fullContent)
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }

      return {
        error: false,
        content: fullContent,
      }
    } catch (error) {
      console.error('NanoGPT streaming failed:', error)
      this._emitError(error)
      return { error: true, content: null }
    }
  }

  /**
   * Set the model to use
   * @param {string} modelId
   */
  setModel(modelId) {
    this.model = modelId
  }

  /**
   * Get current model
   * @returns {string}
   */
  getModel() {
    return this.model
  }

  /**
   * Check if API is configured
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(this.apiKey && this.baseUrl && this.model)
  }

  /**
   * Register error callback
   * @param {Function} callback
   */
  onError(callback) {
    this.errorCallbacks.push(callback)
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback)
    }
  }

  _emitError(error) {
    for (const callback of this.errorCallbacks) {
      try {
        callback(error)
      } catch (e) {
        console.error('Error in error callback:', e)
      }
    }
  }
}

export const nanoGPTClient = new NanoGPTClient()

export default NanoGPTClient
