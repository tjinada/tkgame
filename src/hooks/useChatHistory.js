import { useState, useCallback } from 'react'
import { chatHistoryService } from '../services/ChatHistoryService.js'

export function useChatHistory(saveSlotId) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadHistory = useCallback(async (options = {}) => {
    if (!saveSlotId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await chatHistoryService.getHistory(saveSlotId, options)
      setHistory(data)
    } catch (err) {
      setError(err.message)
      console.error('Failed to load chat history:', err)
    } finally {
      setLoading(false)
    }
  }, [saveSlotId])

  const addMessage = useCallback(async (role, content, context = {}) => {
    if (!saveSlotId) return
    
    try {
      await chatHistoryService.addMessage({
        saveSlotId,
        role,
        content,
        ...context,
      })
      
      // Optionally refresh history
      // await loadHistory()
    } catch (err) {
      console.error('Failed to add message:', err)
      throw err
    }
  }, [saveSlotId])

  const addUserMessage = useCallback(async (content, context = {}) => {
    return addMessage('user', content, context)
  }, [addMessage])

  const addAssistantMessage = useCallback(async (content, context = {}) => {
    return addMessage('assistant', content, context)
  }, [addMessage])

  const getContextMessages = useCallback(async (options = {}) => {
    if (!saveSlotId) return { messages: [], count: 0 }
    
    try {
      return await chatHistoryService.getContextMessages(saveSlotId, options)
    } catch (err) {
      console.error('Failed to get context messages:', err)
      return { messages: [], count: 0 }
    }
  }, [saveSlotId])

  const clearHistory = useCallback(async (chapter = null) => {
    if (!saveSlotId) return
    
    try {
      await chatHistoryService.deleteHistory(saveSlotId, chapter)
      setHistory([])
    } catch (err) {
      console.error('Failed to clear history:', err)
      throw err
    }
  }, [saveSlotId])

  return {
    history,
    loading,
    error,
    loadHistory,
    addMessage,
    addUserMessage,
    addAssistantMessage,
    getContextMessages,
    clearHistory,
  }
}

export default useChatHistory
