import { apiClient } from './ApiClient.js'

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
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)
    formData.append('npcId', npcId)
    formData.append('assetType', assetType)

    const result = await apiClient.post('/api/assets/upload', formData)
    
    // Clear cached URL if exists
    const cacheKey = `${category}-${npcId}-${assetType}`
    this.urlCache.delete(cacheKey)
    
    console.log(`Uploaded asset: ${category}/${npcId}/${assetType}`)
    return result
  }

  /**
   * Upload a scene background
   * @param {string} location - Location name
   * @param {File} file - The image file
   * @returns {Promise<AssetRecord>}
   */
  async uploadBackground(location, file) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', 'background')
    formData.append('location', location)

    const result = await apiClient.post('/api/assets/upload', formData)
    
    // Clear cached URL
    this.urlCache.delete(`background-${location}`)
    
    console.log(`Uploaded background: ${location}`)
    return result
  }

  /**
   * Upload a slideshow background
   * @param {string} name - Unique name for the background
   * @param {File} file - The image file
   * @returns {Promise<AssetRecord>}
   */
  async uploadSlideshowBackground(name, file) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', 'slideshow')
    formData.append('assetType', name)

    const result = await apiClient.post('/api/assets/upload', formData)
    
    console.log(`Uploaded slideshow background: ${name}`)
    return result
  }

  /**
   * Get asset as Blob (for backwards compatibility with admin panel)
   * @param {string} category - 'portrait' or 'bodypart'
   * @param {string} npcId - NPC identifier
   * @param {string} assetType - e.g., 'neutral', 'feet'
   * @returns {Promise<Blob|null>}
   */
  async getAsset(category, npcId, assetType) {
    try {
      // Find the asset ID first
      const result = await apiClient.get(`/api/assets/find/${category}/${npcId}/${assetType}`)
      
      if (!result.assetId) return null
      
      // Fetch the actual image as blob
      const response = await fetch(apiClient.getAssetUrl(result.assetId))
      if (!response.ok) return null
      
      return await response.blob()
    } catch (error) {
      console.error('Error getting asset:', error)
      return null
    }
  }

  /**
   * Get background as Blob
   * @param {string} location - Location name
   * @returns {Promise<Blob|null>}
   */
  async getBackground(location) {
    try {
      const result = await apiClient.get(`/api/assets/find/background/${location}`)
      
      if (!result.assetId) return null
      
      const response = await fetch(apiClient.getAssetUrl(result.assetId))
      if (!response.ok) return null
      
      return await response.blob()
    } catch (error) {
      console.error('Error getting background:', error)
      return null
    }
  }

  /**
   * Get asset URL for NPC asset
   * @param {string} category - 'portrait' or 'bodypart'
   * @param {string} npcId - NPC identifier
   * @param {string} assetType - e.g., 'neutral', 'feet'
   * @returns {Promise<string|null>}
   */
  async getNpcAssetUrl(category, npcId, assetType) {
    const cacheKey = `${category}-${npcId}-${assetType}`
    
    // Check cache first
    if (this.urlCache.has(cacheKey)) {
      return this.urlCache.get(cacheKey)
    }
    
    try {
      // Find the asset ID
      const result = await apiClient.get(`/api/assets/find/${category}/${npcId}/${assetType}`)
      
      if (!result.assetId) return null
      
      const url = apiClient.getAssetUrl(result.assetId)
      this.urlCache.set(cacheKey, url)
      return url
    } catch (error) {
      console.error('Error getting NPC asset URL:', error)
      return null
    }
  }

  /**
   * Get URL for background
   * @param {string} location - Location name
   * @returns {Promise<string|null>}
   */
  async getBackgroundUrl(location) {
    const cacheKey = `background-${location}`
    
    if (this.urlCache.has(cacheKey)) {
      return this.urlCache.get(cacheKey)
    }
    
    try {
      const result = await apiClient.get(`/api/assets/find/background/${location}`)
      
      if (!result.assetId) return null
      
      const url = apiClient.getAssetUrl(result.assetId)
      this.urlCache.set(cacheKey, url)
      return url
    } catch (error) {
      console.error('Error getting background URL:', error)
      return null
    }
  }

  /**
   * Get URL for an asset by ID
   * @param {string} assetId - The asset ID
   * @returns {string|null}
   */
  getAssetUrl(assetId) {
    return apiClient.getAssetUrl(assetId)
  }

  /**
   * Get all slideshow backgrounds
   * @returns {Promise<Array<{id: string, url: string, blob: Blob}>>}
   */
  async getSlideshowBackgrounds() {
    try {
      const assets = await apiClient.get('/api/assets/slideshow/list')
      
      // Fetch blobs for each asset
      const results = []
      for (const asset of assets) {
        try {
          const response = await fetch(apiClient.getAssetUrl(asset.id))
          if (response.ok) {
            const blob = await response.blob()
            results.push({
              id: asset.id,
              url: apiClient.getAssetUrl(asset.id),
              blob,
              filename: asset.filename,
            })
          }
        } catch (e) {
          console.error(`Error fetching slideshow asset ${asset.id}:`, e)
        }
      }
      
      return results
    } catch (error) {
      console.error('Error getting slideshow backgrounds:', error)
      return []
    }
  }

  /**
   * Delete an asset by ID
   * @param {string} assetId - The asset ID (MongoDB ObjectId)
   */
  async deleteAsset(assetId) {
    await apiClient.delete(`/api/assets/${assetId}`)
    
    // Clear entire cache since we don't know which key this corresponds to
    this.urlCache.clear()
    
    console.log(`Deleted asset: ${assetId}`)
  }

  /**
   * Delete NPC asset by finding it first
   * @param {string} category - 'portrait' or 'bodypart'
   * @param {string} npcId - NPC identifier
   * @param {string} assetType - e.g., 'neutral', 'feet'
   */
  async deleteNpcAsset(category, npcId, assetType) {
    try {
      const result = await apiClient.get(`/api/assets/find/${category}/${npcId}/${assetType}`)
      if (result.assetId) {
        await this.deleteAsset(result.assetId)
      }
    } catch (error) {
      console.error('Error deleting NPC asset:', error)
    }
  }

  /**
   * Delete background asset
   * @param {string} location - Location name
   */
  async deleteBackgroundAsset(location) {
    try {
      const result = await apiClient.get(`/api/assets/find/background/${location}`)
      if (result.assetId) {
        await this.deleteAsset(result.assetId)
      }
    } catch (error) {
      console.error('Error deleting background asset:', error)
    }
  }

  /**
   * List assets by category
   * @param {string} category - Asset category
   * @param {string} npcId - Optional NPC ID filter
   * @returns {Promise<Array>}
   */
  async listAssets(category, npcId = null) {
    const query = npcId ? `?npcId=${npcId}` : ''
    return await apiClient.get(`/api/assets/list/${category}${query}`)
  }

  /**
   * Clear all assets for an NPC
   * @param {string} npcId - NPC identifier
   */
  async clearNpcAssets(npcId) {
    try {
      // Get all portrait assets for this NPC
      const portraits = await this.listAssets('portrait', npcId)
      for (const asset of portraits) {
        await this.deleteAsset(asset.id)
      }
      
      // Get all bodypart assets for this NPC
      const bodyparts = await this.listAssets('bodypart', npcId)
      for (const asset of bodyparts) {
        await this.deleteAsset(asset.id)
      }
      
      this.urlCache.clear()
      console.log(`Cleared all assets for NPC: ${npcId}`)
    } catch (error) {
      console.error('Error clearing NPC assets:', error)
    }
  }

  /**
   * Clear all assets
   */
  async clearAllAssets() {
    try {
      // Get all assets by category and delete them
      const categories = ['portrait', 'bodypart', 'background', 'slideshow']
      
      for (const category of categories) {
        const assets = await this.listAssets(category)
        for (const asset of assets) {
          await this.deleteAsset(asset.id)
        }
      }
      
      this.urlCache.clear()
      console.log('Cleared all assets')
    } catch (error) {
      console.error('Error clearing all assets:', error)
    }
  }

  /**
   * Get the asset manifest
   * @returns {Promise<AssetManifest>}
   */
  async getManifest() {
    try {
      return await apiClient.get('/api/assets/manifest/all')
    } catch (error) {
      console.error('Error getting manifest:', error)
      return {
        version: '1.0',
        lastUpdated: null,
        npcs: {},
        backgrounds: {},
        slideshow: { backgrounds: [] },
      }
    }
  }

  /**
   * Get slideshow config
   * @returns {Promise<SlideshowConfig>}
   */
  async getSlideshowConfig() {
    const backgrounds = await this.getSlideshowBackgrounds()
    return {
      enabled: backgrounds.length > 0,
      interval: 10000,
      transition: 'crossfade',
      transitionDuration: 1500,
      shuffle: false,
      backgrounds: backgrounds.map(b => b.id),
    }
  }

  /**
   * Clear URL cache
   */
  clearCache() {
    this.urlCache.clear()
  }
}

// Singleton instance
export const assetService = new AssetService()

export default AssetService
