// node banc-rendu/essai.mjs variantes/ma-variante.js
// → banc-rendu/sorties/ma-variante.png, à ouvrir et à JUGER À L'ŒIL.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const ici = path.dirname(new URL(import.meta.url).pathname)
const cible = process.argv[2]
if (!cible) { console.error('usage : node banc-rendu/essai.mjs variantes/<nom>.js'); process.exit(1) }
if (!fs.existsSync(path.join(ici, cible))) { console.error('introuvable :', cible); process.exit(1) }

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--allow-file-access-from-files'],
})
const page = await nav.newPage({ viewport: { width: 1080, height: 900 }, deviceScaleFactor: 2 })
page.on('pageerror', e => console.log('  pageerror:', e.message))
page.on('console', m => { if (m.type() === 'error') console.log('  console:', m.text()) })
await page.goto(`file://${ici}/essai.html?v=${encodeURIComponent(cible)}`)
try { await page.waitForFunction('window.__pret !== undefined', null, { timeout: 180_000 }) }
catch { console.log('  ⚠ la page n’a jamais signalé sa fin — planche partielle') }

const res = await page.evaluate('window.__pret ?? []')
fs.mkdirSync(path.join(ici, 'sorties'), { recursive: true })
const sortie = path.join(ici, 'sorties', path.basename(cible, '.js') + '.png')
await page.screenshot({ path: sortie, fullPage: true })
await nav.close()

for (const r of res)
  console.log(`  ${r.nom.padEnd(18)} ${r.echec ? 'ÉCHEC ' + r.echec
    : `masque ${r.msMasque.toFixed(1)} ms · total ${Math.round(r.ms)} ms · teinte ${r.teinte}°`}`)
console.log('planche →', sortie)
