import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'

// Routes
import assetsRouter from './routes/assets.js'
import savesRouter from './routes/saves.js'
import configRouter from './routes/config.js'
import scenariosRouter from './routes/scenarios.js'
import chatRouter from './routes/chat.js'
import progressionRouter from './routes/progression.js'
import eventsRouter from './routes/events.js'
import knowledgeRouter from './routes/knowledge.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Routes
app.use('/api/assets', assetsRouter)
app.use('/api/saves', savesRouter)
app.use('/api/config', configRouter)
app.use('/api/scenarios', scenariosRouter)
app.use('/api/chat', chatRouter)
app.use('/api/progression', progressionRouter)
app.use('/api/events', eventsRouter)
app.use('/api/knowledge', knowledgeRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message 
  })
})

// Start server
async function start() {
  try {
    await connectDB()
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
