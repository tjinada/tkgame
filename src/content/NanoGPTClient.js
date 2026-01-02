import { env } from '../config/env'

export class NanoGPTClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || env.nanoGPT.apiKey
    this.baseUrl = config.baseUrl || env.nanoGPT.baseUrl
    this.model = config.model || env.nanoGPT.model
  }

  /**
   * Send a chat completion request
   * @param {Array} messages - Array of message objects {role, content}
   * @param {Object} options - Optional parameters
   * @returns {Promise<ChatResponse>}
   */
  async chat(messages, options = {}) {
    const {
      model = this.model,
      maxTokens = 1000,
      temperature = 0.8,
      stream = false,
    } = options

    if (!this.apiKey) {
      console.error('NanoGPT: No API key configured')
      return { error: 'No API key configured', content: null }
    }

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
          stream,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('NanoGPT API error:', response.status, errorText)
        return { error: `API error: ${response.status}`, content: null }
      }

      const data = await response.json()
      
      return {
        error: null,
        content: data.choices?.[0]?.message?.content || '',
        usage: data.usage,
        model: data.model,
      }
    } catch (err) {
      console.error('NanoGPT request failed:', err)
      return { error: err.message, content: null }
    }
  }

  /**
   * Send a streaming chat completion request
   * @param {Array} messages - Array of message objects {role, content}
   * @param {Function} onChunk - Callback for each chunk of text
   * @param {Object} options - Optional parameters
   * @returns {Promise<void>}
   */
  async streamChat(messages, onChunk, options = {}) {
    const {
      model = this.model,
      maxTokens = 1000,
      temperature = 0.8,
    } = options

    if (!this.apiKey) {
      console.error('NanoGPT: No API key configured')
      onChunk({ error: 'No API key configured', done: true })
      return
    }

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
          stream: true,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('NanoGPT API error:', response.status, errorText)
        onChunk({ error: `API error: ${response.status}`, done: true })
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          onChunk({ content: '', done: true })
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              onChunk({ content: '', done: true })
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ''
              if (content) {
                onChunk({ content, done: false })
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (err) {
      console.error('NanoGPT stream failed:', err)
      onChunk({ error: err.message, done: true })
    }
  }

  /**
   * Set the model to use
   * @param {string} modelId - The model identifier
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
   * Check if client is configured
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(this.apiKey)
  }
}

export default NanoGPTClient
