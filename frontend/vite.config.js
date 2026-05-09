import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev
export default defineConfig({
  base: './',
  plugins: [
    react(),
    // On place le plugin PWA ici, dans la liste des plugins
    VitePWA({
      registerType: 'autoUpdate',
        devOptions: {
            enabled: true // <--- Ajoute cette ligne pour voir le bouton en développement
        },
      manifest: {
        name: 'Esat-Hub Scolaire',
        short_name: 'EsatHub',
        description: 'Plateforme ESAT',
        theme_color: '#1e3a8a',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    allowedHosts: true,
    historyApiFallback: true, // Aide pour les routes React
    proxy: {
      // Optionnel : si tu veux rediriger tes appels API proprement
    }
  }
})


