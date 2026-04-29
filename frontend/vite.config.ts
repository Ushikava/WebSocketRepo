import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/videos': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/avatars': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/banners': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
