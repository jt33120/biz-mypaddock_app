import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // Le nom vient d'UNE SEULE source, y compris pour le manifeste (récit 0.3).
  const env = loadEnv(mode, process.cwd(), '')
  const name = env.VITE_APP_NAME || 'MyPaddock'

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        // Rien ne se charge depuis un CDN au paddock : tout est précaché.
        workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
        manifest: {
          name,
          short_name: name,
          description: 'Carnet de roulage moto',
          lang: 'fr',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#070B14',
          theme_color: '#070B14',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
      }),
    ],
  }
})
