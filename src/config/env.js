export const env = {
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
