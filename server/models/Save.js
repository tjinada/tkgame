import { getDB } from '../config/db.js'
import { ObjectId } from 'mongodb'

const COLLECTION = 'saves'

export async function createSave(saveData) {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  const doc = {
    slotId: saveData.slotId,
    name: saveData.name || `Save ${saveData.slotId}`,
    stats: saveData.stats,
    affinities: saveData.affinities,
    chapter: saveData.chapter,
    turn: saveData.turn,
    currentScene: saveData.currentScene,
    currentNpc: saveData.currentNpc,
    currentLocation: saveData.currentLocation,
    flags: saveData.flags || {},
    perks: saveData.perks || [],
    scars: saveData.scars || [],
    history: saveData.history || [],
    activeTone: saveData.activeTone,
    preview: generatePreview(saveData),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Upsert by slotId
  const result = await collection.updateOne(
    { slotId: saveData.slotId },
    { $set: doc },
    { upsert: true }
  )

  return { slotId: doc.slotId, timestamp: doc.updatedAt }
}

export async function getSave(slotId) {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  return await collection.findOne({ slotId })
}

export async function getAllSaves() {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  const saves = await collection
    .find({})
    .project({
      slotId: 1,
      name: 1,
      chapter: 1,
      turn: 1,
      preview: 1,
      updatedAt: 1,
    })
    .sort({ updatedAt: -1 })
    .toArray()

  return saves
}

export async function deleteSave(slotId) {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  const result = await collection.deleteOne({ slotId })
  return { deleted: result.deletedCount > 0 }
}

export async function deleteAllSaves() {
  const db = getDB()
  const collection = db.collection(COLLECTION)
  
  const result = await collection.deleteMany({})
  return { deletedCount: result.deletedCount }
}

function generatePreview(state) {
  const location = state.currentLocation?.replace(/_/g, ' ') || 'Unknown'
  return `Chapter ${state.chapter || 1}, Turn ${state.turn || 0} - ${location}`
}

export default {
  createSave,
  getSave,
  getAllSaves,
  deleteSave,
  deleteAllSaves,
}
