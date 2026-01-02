import express from 'express'
import multer from 'multer'
import {
  uploadAsset,
  getAsset,
  listAssets,
  deleteAsset,
  findAsset,
  findBackgroundAsset,
  getSlideshowAssets,
  getManifest,
} from '../models/Asset.js'

const router = express.Router()

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'))
    }
  },
})

// Upload asset
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { category, npcId, assetType, location } = req.body

    if (!category) {
      return res.status(400).json({ error: 'Category is required' })
    }

    // For NPC assets, check if one already exists and delete it
    if ((category === 'portrait' || category === 'bodypart') && npcId && assetType) {
      const existingId = await findAsset(category, npcId, assetType)
      if (existingId) {
        await deleteAsset(existingId)
      }
    }

    // For background assets, check if one already exists
    if (category === 'background' && location) {
      const existingId = await findBackgroundAsset(location)
      if (existingId) {
        await deleteAsset(existingId)
      }
    }

    const result = await uploadAsset(req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      category,
      npcId,
      assetType,
      location,
    })

    res.json(result)
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get asset by ID
router.get('/:id', async (req, res) => {
  try {
    const asset = await getAsset(req.params.id)
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    res.set('Content-Type', asset.contentType)
    res.set('Cache-Control', 'public, max-age=86400') // Cache for 24 hours
    res.send(asset.buffer)
  } catch (error) {
    console.error('Get asset error:', error)
    res.status(500).json({ error: error.message })
  }
})

// List assets by category
router.get('/list/:category', async (req, res) => {
  try {
    const { category } = req.params
    const { npcId } = req.query
    
    const assets = await listAssets(category, npcId)
    res.json(assets)
  } catch (error) {
    console.error('List assets error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get slideshow assets
router.get('/slideshow/list', async (req, res) => {
  try {
    const assets = await getSlideshowAssets()
    res.json(assets)
  } catch (error) {
    console.error('Get slideshow error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get asset manifest
router.get('/manifest/all', async (req, res) => {
  try {
    const manifest = await getManifest()
    res.json(manifest)
  } catch (error) {
    console.error('Get manifest error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete asset
router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteAsset(req.params.id)
    res.json(result)
  } catch (error) {
    console.error('Delete asset error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Find NPC asset ID
router.get('/find/:category/:npcId/:assetType', async (req, res) => {
  try {
    const { category, npcId, assetType } = req.params
    const assetId = await findAsset(category, npcId, assetType)
    res.json({ assetId })
  } catch (error) {
    console.error('Find asset error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Find background asset ID
router.get('/find/background/:location', async (req, res) => {
  try {
    const { location } = req.params
    const assetId = await findBackgroundAsset(location)
    res.json({ assetId })
  } catch (error) {
    console.error('Find background error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
