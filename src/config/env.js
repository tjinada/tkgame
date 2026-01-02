export const env = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  },
  nanoGPT: {
    apiKey: import.meta.env.VITE_NANOGPT_API_KEY || '',
    baseUrl: import.meta.env.VITE_NANOGPT_BASE_URL || 'https://nano-gpt.com/api/v1',
    model: import.meta.env.VITE_NANOGPT_MODEL || 'chatgpt-4o-latest',
  },
  features: {
    debug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
    logging: import.meta.env.VITE_ENABLE_LOGGING !== 'false',
  },
}

export const API_URL = env.api.baseUrl
