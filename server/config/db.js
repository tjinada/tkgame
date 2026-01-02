import { MongoClient, GridFSBucket } from 'mongodb'

let client = null
let db = null
let gridFSBucket = null

export async function connectDB() {
  if (db) return db

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fetish_dominion'
  
  try {
    client = new MongoClient(uri)
    await client.connect()
    
    db = client.db()
    gridFSBucket = new GridFSBucket(db, { bucketName: 'assets' })
    
    console.log('Connected to MongoDB:', db.databaseName)
    return db
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw error
  }
}

export function getDB() {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.')
  }
  return db
}

export function getGridFSBucket() {
  if (!gridFSBucket) {
    throw new Error('GridFS not initialized. Call connectDB() first.')
  }
  return gridFSBucket
}

export async function closeDB() {
  if (client) {
    await client.close()
    client = null
    db = null
    gridFSBucket = null
    console.log('MongoDB connection closed')
  }
}

export default { connectDB, getDB, getGridFSBucket, closeDB }
