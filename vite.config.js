import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@engine': '/src/engine',
      '@content': '/src/content',
      '@hooks': '/src/hooks',
      '@services': '/src/services',
      '@data': '/src/data',
      '@assets': '/src/assets',
    },
  },
})
