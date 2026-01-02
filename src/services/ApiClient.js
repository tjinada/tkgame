const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class ApiClient {
  constructor(baseUrl = API_URL) {
    this.baseUrl = baseUrl
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    const config = {
      ...options,
      headers: {
        ...options.headers,
      },
    }

    // Don't set Content-Type for FormData (browser will set it with boundary)
    if (!(options.body instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json'
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }))
        const errorMessage = error.message || error.error || `HTTP ${response.status}`
        
        // Don't log 404s as errors - they're expected for missing resources
        if (response.status !== 404) {
          console.error(`API Error [${endpoint}]:`, errorMessage)
        }
        
        throw new Error(errorMessage)
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }
      
      // Return blob for binary data (images)
      return await response.blob()
    } catch (error) {
      // Only log non-404 errors
      if (!error.message.includes('not found') && !error.message.includes('404')) {
        console.error(`API Error [${endpoint}]:`, error)
      }
      throw error
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' })
  }

  async post(endpoint, data) {
    const isFormData = data instanceof FormData
    return this.request(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
    })
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  // Asset-specific method that returns URL directly
  getAssetUrl(assetId) {
    if (!assetId) return null
    return `${this.baseUrl}/api/assets/${assetId}`
  }
}

export const apiClient = new ApiClient()
export default ApiClient
