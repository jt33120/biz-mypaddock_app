import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { localNightPortraits } from './scripts/local-night-plugin.js'

export default defineConfig(({ mode, command }) => {
  // Le nom vient d'UNE SEULE source, y compris pour le manifeste (récit 0.3).
  const env = loadEnv(mode, process.cwd(), '')
  const name = env.VITE_APP_NAME || 'MyPaddock'
  const { tokens: designTokens } = JSON.parse(readFileSync(new URL('./design/tokens.json', import.meta.url), 'utf8')) as { tokens: Record<string, string> }

  /**
   * ⚠ LE BANC SERT LES EN-TÊTES DE PRODUCTION, ET C'EST UNE LEÇON PAYÉE.
   *
   * `vite preview` n'envoie AUCUN en-tête. Les vingt-six essais de bout en bout
   * tournaient donc sans politique de sécurité de contenu, alors que Vercel en
   * applique une stricte. Toute une famille de défauts était invisible par
   * construction — et l'un d'eux a cassé la vitrine en production : `fetch()`
   * sur une URI `data:` est régi par `connect-src`, qui ne l'autorise pas. Le
   * récapitulatif partageable rendait « L'image n'a pas pu être composée » sur
   * toute machine ayant un portrait, c'est-à-dire le cas normal.
   *
   * Les en-têtes sont LUS DANS `vercel.json`, jamais recopiés : deux copies
   * d'une politique de sécurité divergent, et c'est la copie du banc qui
   * finirait par être la plus permissive.
   */
  const enTetes = (() => {
    const vercel = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'))
    const pourTout = vercel.headers?.find((h: { source: string }) => h.source === '/(.*)')
    const dict: Record<string, string> = {}
    for (const { key, value } of (pourTout?.headers ?? []) as { key: string; value: string }[])
      dict[key] = value
    // HSTS n'a aucun sens en clair sur localhost, et Chrome le refuse : c'est le
    // seul en-tête qu'on écarte, et il n'a aucun effet sur le rendu.
    delete dict['Strict-Transport-Security']
    return dict
  })()

  // Vite's React refresh preamble needs a nonce in development. Production
  // and preview retain the deployed CSP verbatim.
  const devNonce = command === 'serve' ? randomBytes(24).toString('base64') : undefined
  const devHeaders = { ...enTetes }
  if (devNonce && devHeaders['Content-Security-Policy'])
    devHeaders['Content-Security-Policy'] = devHeaders['Content-Security-Policy'].replace('script-src ', `script-src 'nonce-${devNonce}' `)

  return {
    html: devNonce ? { cspNonce: devNonce } : undefined,
    // Le banc et le serveur de développement voient donc la MÊME politique que
    // le produit en ligne.
    server: { headers: devHeaders, host: '127.0.0.1', fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.local/**'] } },
    preview: { headers: enTetes },
    // Horodatage de build affiché à l'écran : sans lui, une PWA iOS installée
    // qui sert encore l'ancienne version se débogue comme un fantôme.
    define: { __BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')) },
    // Le SDK PowerSync embarque ses propres workers et son WASM : les
    // pré-empaqueter casserait leur résolution.
    optimizeDeps: { exclude: ['@powersync/web', '@journeyapps/wa-sqlite'] },
    worker: { format: 'es' },
    plugins: [
      react(),
      localNightPortraits(),
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
        transformIndexHtml: (html) => html.replace(/<title>.*?<\/title>/, `<title>${name}</title>`).replaceAll('__PRODUCT_NAME__', name),
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
          globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,wasm}'],
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
          background_color: designTokens.nuit,
          theme_color: designTokens.nuit,
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
