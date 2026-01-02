import { useState, useEffect, useRef } from 'react'
import { TabPanel } from '../../ui/Tabs'
import { Button } from '../../ui/Button'
import { Trash2, Download, Dice1, Zap, MessageSquare, AlertCircle } from 'lucide-react'

const LOGS_KEY = 'fd-debug-logs'
const MAX_LOGS = 500

// Global log store
class LogStore {
  constructor() {
    this.logs = this._load()
    this.listeners = []
  }

  log(type, message, data = null) {
    const entry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
    }
    
    this.logs.unshift(entry)
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(0, MAX_LOGS)
    }
    
    this._save()
    this._notify()
    
    // Also console log
    console.log(`[${type.toUpperCase()}]`, message, data || '')
  }

  clear() {
    this.logs = []
    this._save()
    this._notify()
  }

  getByType(type) {
    return this.logs.filter(l => l.type === type)
  }

  subscribe(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }

  _load() {
    try {
      const stored = localStorage.getItem(LOGS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  _save() {
    try {
      localStorage.setItem(LOGS_KEY, JSON.stringify(this.logs))
    } catch {}
  }

  _notify() {
    for (const cb of this.listeners) {
      try { cb(this.logs) } catch {}
    }
  }
}

export const logStore = new LogStore()

// Helper functions for different log types
export const debugLog = {
  roll: (result) => logStore.log('roll', `Roll: ${result.total} (${result.success ? 'Success' : 'Fail'})`, result),
  event: (event) => logStore.log('event', `Event: ${event.name}`, event),
  api: (action, data) => logStore.log('api', `API: ${action}`, data),
  error: (message, error) => logStore.log('error', message, error),
  game: (action, data) => logStore.log('game', action, data),
}

export function DebugTab() {
  const [logs, setLogs] = useState(logStore.logs)
  const [filter, setFilter] = useState('all')
  const logsEndRef = useRef(null)

  useEffect(() => {
    const unsubscribe = logStore.subscribe(setLogs)
    return unsubscribe
  }, [])

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(l => l.type === filter)

  const handleClear = () => {
    if (confirm('Clear all logs?')) {
      logStore.clear()
    }
  }

  const handleExport = () => {
    const text = logs.map(l => 
      `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}${l.data ? '\n  ' + JSON.stringify(l.data) : ''}`
    ).join('\n\n')
    
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug_logs_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'roll': return <Dice1 size={14} className="text-accent-primary" />
      case 'event': return <Zap size={14} className="text-accent-warning" />
      case 'api': return <MessageSquare size={14} className="text-accent-secondary" />
      case 'error': return <AlertCircle size={14} className="text-accent-danger" />
      default: return null
    }
  }

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'roll': return 'bg-accent-primary/20 text-accent-primary'
      case 'event': return 'bg-accent-warning/20 text-accent-warning'
      case 'api': return 'bg-accent-secondary/20 text-accent-secondary'
      case 'error': return 'bg-accent-danger/20 text-accent-danger'
      case 'game': return 'bg-accent-success/20 text-accent-success'
      default: return 'bg-text-muted/20 text-text-muted'
    }
  }

  return (
    <TabPanel className="flex flex-col h-full p-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 border-b border-background-tertiary">
        <div className="flex gap-2">
          {['all', 'roll', 'event', 'api', 'game', 'error'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`
                px-3 py-1.5 text-sm rounded-lg transition-colors
                ${filter === type 
                  ? 'bg-accent-primary text-white' 
                  : 'bg-background-tertiary text-text-muted hover:text-text-primary'
                }
              `}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleExport}>
            <Download size={14} className="mr-1" /> Export
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <Trash2 size={14} className="mr-1" /> Clear
          </Button>
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-text-muted py-8">
            No logs yet
          </div>
        ) : (
          filteredLogs.map(log => (
            <div 
              key={log.id}
              className="p-3 bg-background-tertiary/50 rounded-lg border border-background-elevated"
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 mt-0.5">
                  {getTypeIcon(log.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 text-xs rounded ${getTypeBadgeColor(log.type)}`}>
                      {log.type}
                    </span>
                    <span className="text-xs text-text-muted">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-text-primary break-words">{log.message}</p>
                  {log.data && (
                    <pre className="mt-2 p-2 bg-background-elevated rounded text-xs text-text-muted overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-background-tertiary text-xs text-text-muted">
        <span>Total: {logs.length}</span>
        <span>Rolls: {logs.filter(l => l.type === 'roll').length}</span>
        <span>Events: {logs.filter(l => l.type === 'event').length}</span>
        <span>API: {logs.filter(l => l.type === 'api').length}</span>
        <span>Errors: {logs.filter(l => l.type === 'error').length}</span>
      </div>
    </TabPanel>
  )
}

export default DebugTab
