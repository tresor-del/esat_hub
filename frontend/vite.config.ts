import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration Vite pour React
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Port du serveur de développement
    proxy: {
      // Proxy pour l'API backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})