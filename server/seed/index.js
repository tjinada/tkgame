import 'dotenv/config'
import { MongoClient } from 'mongodb'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fetish_dominion'

async function seed() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db()
    
    console.log('Connected to MongoDB:', db.databaseName)
    console.log('Starting seed...')
    
    // Load seed data
    const npcsData = JSON.parse(
      readFileSync(join(__dirname, 'npcs.json'), 'utf-8')
    )
    const eventsData = JSON.parse(
      readFileSync(join(__dirname, 'events.json'), 'utf-8')
    )
    
    // Seed NPCs
    console.log('\nSeeding NPCs...')
    const npcsCollection = db.collection('npcs')
    
    // Clear existing NPCs
    await npcsCollection.deleteMany({})
    
    // Insert NPCs
    const npcsResult = await npcsCollection.insertMany(
      npcsData.npcs.map(npc => ({
        ...npc,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    )
    console.log(`  Inserted ${npcsResult.insertedCount} NPCs`)
    
    // Seed Events
    console.log('\nSeeding Events...')
    const eventsCollection = db.collection('events')
    
    // Clear existing events
    await eventsCollection.deleteMany({})
    
    // Insert events
    const eventsResult = await eventsCollection.insertMany(
      eventsData.events.map(event => ({
        ...event,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    )
    console.log(`  Inserted ${eventsResult.insertedCount} events`)
    
    // Seed default settings
    console.log('\nSeeding default settings...')
    const settingsCollection = db.collection('settings')
    
    const defaultSettings = [
      { key: 'contentMode', value: 'hybrid' },
      { key: 'contextMode', value: 'last-n-turns' },
      { key: 'contextLimit', value: 10 },
      { key: 'streamResponses', value: true },
      { key: 'enableBackgrounds', value: true },
      { key: 'enablePortraits', value: true },
      { key: 'enableDiceAnimation', value: true },
      { key: 'enableEffects', value: true },
      { key: 'enableSlideshow', value: true },
      { key: 'slideshowInterval', value: 10000 },
      { key: 'slideshowTransition', value: 'crossfade' },
      { key: 'slideshowTransitionDuration', value: 1500 },
      { key: 'slideshowShuffle', value: false },
      { key: 'debugOverlay', value: false },
      { key: 'logApiCalls', value: true },
      { key: 'logDiceRolls', value: true },
    ]
    
    for (const setting of defaultSettings) {
      await settingsCollection.updateOne(
        { key: setting.key },
        { 
          $setOnInsert: { 
            ...setting, 
            createdAt: new Date(),
            updatedAt: new Date(),
          } 
        },
        { upsert: true }
      )
    }
    console.log(`  Initialized ${defaultSettings.length} settings`)
    
    // Create indexes
    console.log('\nCreating indexes...')
    
    await npcsCollection.createIndex({ id: 1 }, { unique: true })
    await eventsCollection.createIndex({ id: 1 }, { unique: true })
    await settingsCollection.createIndex({ key: 1 }, { unique: true })
    await db.collection('saves').createIndex({ slotId: 1 }, { unique: true })
    await db.collection('chat_history').createIndex({ saveSlotId: 1, timestamp: 1 })
    await db.collection('chat_history').createIndex({ saveSlotId: 1, chapter: 1 })
    await db.collection('scenarios').createIndex({ scenarioId: 1 }, { unique: true })
    
    console.log('  Indexes created')
    
    console.log('\n✓ Seed completed successfully!')
    
  } catch (error) {
    console.error('Seed error:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

seed()
