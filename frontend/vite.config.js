import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      // In dev, proxy /api/* to the backend running on Vercel CLI (port 3000 by default)
      // Override with VITE_API_URL=http://localhost:3000/api in .env if you prefer
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
