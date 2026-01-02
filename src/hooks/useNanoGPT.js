import { useState, useCallback, useRef } from 'react'
import { NanoGPTClient } from '../content/NanoGPTClient'

export function useNanoGPT() {
  const clientRef = useRef(new NanoGPTClient())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [streamingContent, setStreamingContent] = useState('')

  /**
   * Send a chat message and get a response
   */
  const chat = useCallback(async (messages, options = {}) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await clientRef.current.chat(messages, options)
      
      if (response.error) {
        setError(response.error)
        return null
      }

      return response.content
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Send a streaming chat message
   */
  const streamChat = useCallback(async (messages, options = {}) => {
    setIsLoading(true)
    setError(null)
    setStreamingContent('')

    let fullContent = ''

    await clientRef.current.streamChat(messages, (chunk) => {
      if (chunk.error) {
        setError(chunk.error)
        setIsLoading(false)
        return
      }

      if (chunk.done) {
        setIsLoading(false)
        return
      }

      fullContent += chunk.content
      setStreamingContent(fullContent)
    }, options)

    return fullContent
  }, [])

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Clear streaming content
   */
  const clearStreaming = useCallback(() => {
    setStreamingContent('')
  }, [])

  return {
    chat,
    streamChat,
    isLoading,
    error,
    streamingContent,
    clearError,
    clearStreaming,
    isConfigured: clientRef.current.isConfigured(),
    model: clientRef.current.getModel(),
  }
}

export default useNanoGPT
