import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

export default defineConfig(({ mode }) => {
  // Le nom vient d'UNE SEULE source, y compris pour le manifeste (récit 0.3).
  const env = loadEnv(mode, process.cwd(), '')
  const name = env.VITE_APP_NAME || 'MyPaddock'

  return {
    // Horodatage de build affiché à l'écran : sans lui, une PWA iOS installée
    // qui sert encore l'ancienne version se débogue comme un fantôme.
    define: { __BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')) },
    // Le SDK PowerSync embarque ses propres workers et son WASM : les
    // pré-empaqueter casserait leur résolution.
    optimizeDeps: { exclude: ['@powersync/web', '@journeyapps/wa-sqlite'] },
    worker: { format: 'es' },
    plugins: [
      react(),
      // Le banc d'essai de rendu est servi sous /banc, émis depuis sa SOURCE UNIQUE
      // (banc-rendu/). Pas de copie dans public/ : une copie versionnée finit toujours
      // par diverger de l'original, et c'est l'original qu'on débogue.
      {
        name: 'banc-embarque',
        generateBundle() {
          for (const f of ['index.html', 'banc.js', 'pipeline.js'])
            this.emitFile({
              type: 'asset', fileName: `banc/${f}`,
              source: readFileSync(new URL(`./banc-rendu/${f}`, import.meta.url), 'utf8'),
            })
        },
      },
      // Le <title> vient de la MEME source que le manifeste, avec repli.
      // Pas de %VITE_APP_NAME% dans l'HTML : une variable absente en CI
      // laisserait le marqueur brut dans la page.
      {
        name: 'titre-depuis-la-constante',
        transformIndexHtml: (html) => html.replace(/<title>.*?<\/title>/, `<title>${name}</title>`),
      },
      VitePWA({
        registerType: 'autoUpdate',
        // Rien ne se charge depuis un CDN au paddock : tout est précaché.
        // `wasm` est OBLIGATOIRE ici — sans lui, la première ouverture hors
        // réseau après installation échoue au chargement du moteur SQLite, et
        // on conclurait à tort que PowerSync ne tient pas hors ligne.
        // La limite Workbox par défaut est de 2 Mio ; wa-sqlite-async.wasm
        // pèse 2,18 Mo et serait silencieusement écarté.
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2,wasm}'],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        },
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
