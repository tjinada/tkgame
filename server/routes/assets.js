import express from 'express'
import multer from 'multer'
import {
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

// Upload asset (allows multiple images per asset type)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { category, npcId, assetType, location, replaceExisting } = req.body

    if (!category) {
      return res.status(400).json({ error: 'Category is required' })
    }

    // Only replace existing if explicitly requested (for portraits we still want single image)
    if (replaceExisting === 'true') {
      if ((category === 'portrait') && npcId && assetType) {
        const existingId = await findAsset(category, npcId, assetType)
        if (existingId) {
          await deleteAsset(existingId)
        }
      }
    }

    // Note: For bodyparts and backgrounds, we now allow multiple images
    // No automatic deletion - multiple images can coexist

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

// Get slideshow assets - MUST be before /:id
router.get('/slideshow/list', async (req, res) => {
  try {
    const assets = await getSlideshowAssets()
    res.json(assets)
  } catch (error) {
    console.error('Get slideshow error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get asset manifest - MUST be before /:id
router.get('/manifest/all', async (req, res) => {
  try {
    const manifest = await getManifest()
    res.json(manifest)
  } catch (error) {
    console.error('Get manifest error:', error)
    res.status(500).json({ error: error.message })
  }
})

// List assets by category - MUST be before /:id
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

// Find background asset ID (first one) - MUST be before generic /find/:category/:npcId/:assetType
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

// Find ALL background assets for a location - MUST be before generic /findall/:category/:npcId/:assetType
router.get('/findall/background/:location', async (req, res) => {
  try {
    const { location } = req.params
    console.log(`Finding all backgrounds for location: ${location}`)
    const assets = await findAllBackgroundAssets(location)
    console.log(`Found ${assets.length} background assets`)
    res.json({ assets })
  } catch (error) {
    console.error('Find all backgrounds error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Find NPC asset ID (first one)
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

// Find ALL NPC assets for a category/npcId/assetType (for slideshows)
router.get('/findall/:category/:npcId/:assetType', async (req, res) => {
  try {
    const { category, npcId, assetType } = req.params
    const assets = await findAllAssets(category, npcId, assetType)
    res.json({ assets })
  } catch (error) {
    console.error('Find all assets error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get asset by ID - MUST be last (catch-all for IDs)
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

export default router
