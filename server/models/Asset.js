import { getDB, getGridFSBucket } from '../config/db.js'
import { ObjectId } from 'mongodb'
import { Readable } from 'stream'

export async function uploadAsset(fileBuffer, metadata) {
  const bucket = getGridFSBucket()
  
  const { filename, contentType, category, npcId, assetType, location } = metadata
  
  const uploadStream = bucket.openUploadStream(filename, {
    contentType,
    metadata: {
      category,      // 'portrait', 'bodypart', 'background', 'slideshow'
      npcId,         // For NPC assets
      assetType,     // 'neutral', 'feet', etc.
      location,      // For scene backgrounds
      uploadedAt: new Date(),
    },
  })

  return new Promise((resolve, reject) => {
    const readStream = Readable.from(fileBuffer)
    
    readStream
      .pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => {
        resolve({
          id: uploadStream.id.toString(),
          filename: uploadStream.filename,
          category,
          npcId,
          assetType,
          location,
        })
      })
  })
}

export async function getAsset(assetId) {
  const bucket = getGridFSBucket()
  const db = getDB()
  
  try {
    const objectId = new ObjectId(assetId)
    
    // Get file metadata
    const file = await db.collection('assets.files').findOne({ _id: objectId })
    if (!file) return null
    
    // Get file data as buffer
    const chunks = []
    const downloadStream = bucket.openDownloadStream(objectId)
    
    return new Promise((resolve, reject) => {
      downloadStream
        .on('data', chunk => chunks.push(chunk))
        .on('error', reject)
        .on('end', () => {
          resolve({
            buffer: Buffer.concat(chunks),
            contentType: file.contentType,
            filename: file.filename,
            metadata: file.metadata,
          })
        })
    })
  } catch (error) {
    console.error('Error getting asset:', error)
    return null
  }
}

export async function listAssets(category, npcId = null) {
  const db = getDB()
  const collection = db.collection('assets.files')
  
  const query = { 'metadata.category': category }
  if (npcId) {
    query['metadata.npcId'] = npcId
  }
  
  const assets = await collection
    .find(query)
    .project({
      _id: 1,
      filename: 1,
      contentType: 1,
      length: 1,
      uploadDate: 1,
      metadata: 1,
    })
    .sort({ uploadDate: -1 })
    .toArray()

  return assets.map(a => ({
    id: a._id.toString(),
    filename: a.filename,
    contentType: a.contentType,
    size: a.length,
    uploadedAt: a.uploadDate,
    category: a.metadata?.category,
    npcId: a.metadata?.npcId,
    assetType: a.metadata?.assetType,
    location: a.metadata?.location,
  }))
}

export async function deleteAsset(assetId) {
  const bucket = getGridFSBucket()
  
  try {
    const objectId = new ObjectId(assetId)
    await bucket.delete(objectId)
    return { deleted: true }
  } catch (error) {
    console.error('Error deleting asset:', error)
    return { deleted: false, error: error.message }
  }
}

export async function findAsset(category, npcId, assetType) {
  const db = getDB()
  const collection = db.collection('assets.files')
  
  const query = {
    'metadata.category': category,
    'metadata.npcId': npcId,
    'metadata.assetType': assetType,
  }
  
  const asset = await collection.findOne(query)
  return asset ? asset._id.toString() : null
}

export async function findAllAssets(category, npcId, assetType) {
  const db = getDB()
  const collection = db.collection('assets.files')
  
  const query = {
    'metadata.category': category,
    'metadata.npcId': npcId,
    'metadata.assetType': assetType,
  }
  
  const assets = await collection
    .find(query)
    .sort({ uploadDate: 1 })
    .toArray()
  
  return assets.map(a => ({
    id: a._id.toString(),
    filename: a.filename,
    uploadedAt: a.uploadDate,
  }))
}

export async function findBackgroundAsset(location) {
  const db = getDB()
  const collection = db.collection('assets.files')
  
  const asset = await collection.findOne({
    'metadata.category': 'background',
    'metadata.location': location,
  })
  
  return asset ? asset._id.toString() : null
}

export async function findAllBackgroundAssets(location) {
  const db = getDB()
  const collection = db.collection('assets.files')
  
  const assets = await collection
    .find({
      'metadata.category': 'background',
      'metadata.location': location,
    })
    .sort({ uploadDate: 1 })
    .toArray()
  
  return assets.map(a => ({
    id: a._id.toString(),
    filename: a.filename,
    uploadedAt: a.uploadDate,
  }))
}

export async function getSlideshowAssets() {
  const db = getDB()
  const collection = db.collection('assets.files')
  
  const assets = await collection
    .find({ 'metadata.category': 'slideshow' })
    .sort({ uploadDate: 1 })
    .toArray()

  return assets.map(a => ({
    id: a._id.toString(),
    filename: a.filename,
    uploadedAt: a.uploadDate,
  }))
}

export async function getManifest() {
  const db = getDB()
  const collection = db.collection('assets.files')
  
  // Build manifest from stored assets
  const assets = await collection.find({}).toArray()
  
  const manifest = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    npcs: {},
    backgrounds: {},
    slideshow: { backgrounds: [] },
  }
  
  for (const asset of assets) {
    const { category, npcId, assetType, location } = asset.metadata || {}
    const assetId = asset._id.toString()
    const filename = asset.filename
    
    if (category === 'portrait' || category === 'bodypart') {
      if (!manifest.npcs[npcId]) {
        manifest.npcs[npcId] = { portraits: {}, bodyparts: {} }
      }
      const key = category === 'portrait' ? 'portraits' : 'bodyparts'
      // Support multiple images per asset type (array format)
      if (!manifest.npcs[npcId][key][assetType]) {
        manifest.npcs[npcId][key][assetType] = []
      }
      manifest.npcs[npcId][key][assetType].push({ assetId, filename })
    } else if (category === 'background') {
      // Support multiple images per location (array format)
      if (!manifest.backgrounds[location]) {
        manifest.backgrounds[location] = []
      }
      manifest.backgrounds[location].push({ assetId, filename })
    } else if (category === 'slideshow') {
      manifest.slideshow.backgrounds.push(assetId)
    }
  }
  
  return manifest
}

export default {
  uploadAsset,
  getAsset,
  listAssets,
  deleteAsset,
  findAsset,
  findAllAssets,
  findBackgroundAsset,
  findAllBackgroundAssets,
  getSlideshowAssets,
  getManifest,
}
