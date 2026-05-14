import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      // 1. Basculer sur l'injection de manifeste personnalisé
      strategies: 'injectManifest',
      srcDir: 'public',       // Indique où chercher votre fichier de base
      filename: 'sw.js',      // Nom de votre fichier Service Worker personnalisé
      registerType: 'autoUpdate',
      
      devOptions: {
        enabled: true,        // Conserve le fonctionnement du Service Worker en dév
        type: 'module'        // Requis pour compiler correctement dev-sw.js
      },
      manifest: {
        name: 'EsatHub',
        short_name: 'EsatHub',
        description: "Plateforme sociale de l'ESAT-TOGO",
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
    historyApiFallback: true,
  }
})
