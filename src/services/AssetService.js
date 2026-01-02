import { get, set, del, keys, clear } from 'idb-keyval'

const ASSET_PREFIX = 'fd-asset-'
const MANIFEST_KEY = 'fd-asset-manifest'

export class AssetService {
  constructor() {
    this.urlCache = new Map()
  }

  /**
   * Upload an asset for an NPC
   * @param {string} category - 'portrait' or 'bodypart'
   * @param {string} npcId - NPC identifier
   * @param {string} assetType - e.g., 'neutral', 'feet'
   * @param {File} file - The image file
   * @returns {Promise<AssetRecord>}
   */
  async uploadAsset(category, npcId, assetType, file) {
    const assetId = `${ASSET_PREFIX}${category}-${npcId}-${assetType}`
    
    const arrayBuffer = await file.arrayBuffer()
    const record = {
      id: assetId,
      category,
      npcId,
      assetType,
      filename: file.name,
      mimeType: file.type,
      data: arrayBuffer,
      uploadedAt: new Date().toISOString(),
    }

    await set(assetId, record)
    await this._updateManifest(category, npcId, assetType, assetId)
    
    // Clear cached URL if exists
    this.urlCache.delete(assetId)
    
    console.log(`Uploaded asset: ${assetId}`)
    return record
  }

  /**
   * Upload a scene background
   * @param {string} location - Location name
   * @param {File} file - The image file
   * @returns {Promise<AssetRecord>}
   */
  async uploadBackground(location, file) {
    const assetId = `${ASSET_PREFIX}background-${location}`
    
    const arrayBuffer = await file.arrayBuffer()
    const record = {
      id: assetId,
      category: 'background',
      location,
      filename: file.name,
      mimeType: file.type,
      data: arrayBuffer,
      uploadedAt: new Date().toISOString(),
    }

    await set(assetId, record)
    
    // Update manifest
    const manifest = await this.getManifest()
    manifest.backgrounds[location] = { uploaded: true, assetId }
    manifest.lastUpdated = new Date().toISOString()
    await set(MANIFEST_KEY, manifest)
    
    this.urlCache.delete(assetId)
    
    console.log(`Uploaded background: ${assetId}`)
    return record
  }

  /**
   * Upload a slideshow background
   * @param {string} name - Unique name for the background
   * @param {File} file - The image file
   * @returns {Promise<AssetRecord>}
   */
  async uploadSlideshowBackground(name, file) {
    const assetId = `${ASSET_PREFIX}slideshow-${name}-${Date.now()}`
    
    const arrayBuffer = await file.arrayBuffer()
    const record = {
      id: assetId,
      category: 'slideshow',
      name,
      filename: file.name,
      mimeType: file.type,
      data: arrayBuffer,
      uploadedAt: new Date().toISOString(),
    }

    await set(assetId, record)
    
    // Update manifest
    const manifest = await this.getManifest()
    if (!manifest.slideshow.backgrounds.includes(assetId)) {
      manifest.slideshow.backgrounds.push(assetId)
    }
    manifest.lastUpdated = new Date().toISOString()
    await set(MANIFEST_KEY, manifest)
    
    console.log(`Uploaded slideshow background: ${assetId}`)
    return record
  }

  /**
   * Get an asset by category, npcId, and type
   * @param {string} category - 'portrait' or 'bodypart'
   * @param {string} npcId - NPC identifier
   * @param {string} assetType - e.g., 'neutral', 'feet'
   * @returns {Promise<Blob|null>}
   */
  async getAsset(category, npcId, assetType) {
    const assetId = `${ASSET_PREFIX}${category}-${npcId}-${assetType}`
    const record = await get(assetId)
    
    if (!record) return null
    
    return new Blob([record.data], { type: record.mimeType })
  }

  /**
   * Get a background by location
   * @param {string} location - Location name
   * @returns {Promise<Blob|null>}
   */
  async getBackground(location) {
    const assetId = `${ASSET_PREFIX}background-${location}`
    const record = await get(assetId)
    
    if (!record) return null
    
    return new Blob([record.data], { type: record.mimeType })
  }

  /**
   * Get all slideshow backgrounds
   * @returns {Promise<Array<{id: string, blob: Blob}>>}
   */
  async getSlideshowBackgrounds() {
    const manifest = await this.getManifest()
    const backgrounds = []
    
    for (const assetId of manifest.slideshow.backgrounds) {
      const record = await get(assetId)
      if (record) {
        backgrounds.push({
          id: assetId,
          blob: new Blob([record.data], { type: record.mimeType }),
        })
      }
    }
    
    return backgrounds
  }

  /**
   * Get a URL for an asset (creates object URL, cached)
   * @param {string} assetId - The asset ID
   * @returns {Promise<string|null>}
   */
  async getAssetUrl(assetId) {
    // Check cache first
    if (this.urlCache.has(assetId)) {
      return this.urlCache.get(assetId)
    }
    
    const record = await get(assetId)
    if (!record) return null
    
    const blob = new Blob([record.data], { type: record.mimeType })
    const url = URL.createObjectURL(blob)
    
    this.urlCache.set(assetId, url)
    return url
  }

  /**
   * Get URL for NPC asset
   * @param {string} category - 'portrait' or 'bodypart'
   * @param {string} npcId - NPC identifier
   * @param {string} assetType - e.g., 'neutral', 'feet'
   * @returns {Promise<string|null>}
   */
  async getNpcAssetUrl(category, npcId, assetType) {
    const assetId = `${ASSET_PREFIX}${category}-${npcId}-${assetType}`
    return this.getAssetUrl(assetId)
  }

  /**
   * Get URL for background
   * @param {string} location - Location name
   * @returns {Promise<string|null>}
   */
  async getBackgroundUrl(location) {
    const assetId = `${ASSET_PREFIX}background-${location}`
    return this.getAssetUrl(assetId)
  }

  /**
   * Delete an asset
   * @param {string} assetId - The asset ID
   */
  async deleteAsset(assetId) {
    // Revoke URL if cached
    if (this.urlCache.has(assetId)) {
      URL.revokeObjectURL(this.urlCache.get(assetId))
      this.urlCache.delete(assetId)
    }
    
    await del(assetId)
    console.log(`Deleted asset: ${assetId}`)
  }

  /**
   * Clear all assets for an NPC
   * @param {string} npcId - NPC identifier
   */
  async clearNpcAssets(npcId) {
    const allKeys = await keys()
    const npcKeys = allKeys.filter(k => 
      typeof k === 'string' && k.includes(`-${npcId}-`)
    )
    
    for (const key of npcKeys) {
      await this.deleteAsset(key)
    }
    
    console.log(`Cleared all assets for NPC: ${npcId}`)
  }

  /**
   * Clear all assets
   */
  async clearAllAssets() {
    // Revoke all cached URLs
    for (const url of this.urlCache.values()) {
      URL.revokeObjectURL(url)
    }
    this.urlCache.clear()
    
    await clear()
    console.log('Cleared all assets')
  }

  /**
   * Get the asset manifest
   * @returns {Promise<AssetManifest>}
   */
  async getManifest() {
    const manifest = await get(MANIFEST_KEY)
    if (manifest) return manifest
    
    // Return default manifest structure
    return {
      version: '1.0',
      lastUpdated: null,
      npcs: {},
      backgrounds: {},
      slideshow: { backgrounds: [] },
    }
  }

  /**
   * Get slideshow config
   * @returns {Promise<SlideshowConfig>}
   */
  async getSlideshowConfig() {
    const manifest = await this.getManifest()
    return {
      enabled: manifest.slideshow.backgrounds.length > 0,
      interval: 10000,
      transition: 'crossfade',
      transitionDuration: 1500,
      shuffle: false,
      backgrounds: manifest.slideshow.backgrounds,
    }
  }

  /**
   * Update manifest entry
   */
  async _updateManifest(category, npcId, assetType, assetId) {
    const manifest = await this.getManifest()
    
    if (!manifest.npcs[npcId]) {
      manifest.npcs[npcId] = { portraits: {}, bodyparts: {} }
    }
    
    const categoryKey = category === 'portrait' ? 'portraits' : 'bodyparts'
    manifest.npcs[npcId][categoryKey][assetType] = { uploaded: true, assetId }
    manifest.lastUpdated = new Date().toISOString()
    
    await set(MANIFEST_KEY, manifest)
  }
}

// Singleton instance
export const assetService = new AssetService()

export default AssetService
