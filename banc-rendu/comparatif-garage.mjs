// Compose N sprites déjà générés dans le cadre garage, côte à côte. ZÉRO appel d'API :
// tout est lu sur le disque. C'est la seule façon honnête de rentabiliser 107 images déjà
// payées — les regarder au lieu d'en générer d'autres.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const ici = path.dirname(new URL(import.meta.url).pathname)
const gem = path.join(ici, 'sorties', 'gemini')

// Chaque entrée : [fichier, étiquette, détourer ou non]. Les directions qui rendent une SCÈNE
// complète (fond, sol, horizon) ne se détourent pas — elles se posent telles quelles.
const COLONNES = JSON.parse(process.argv[2] ?? '[]')
const sortie = process.argv[3] ?? path.join(ici, 'sorties', 'comparatif-garage.png')
if (!COLONNES.length) { console.error('usage : node comparatif-garage.mjs \'[["fichier","label",0|1]…]\' [sortie]'); process.exit(1) }

const FICHE = { marque: 'Honda', modele: 'CBR 1000 RR · 83', o1: 'CBR 83', o2: '',
                km: '11 240', roul: '7', tour: '1:38<small>.42</small>',
                etat: '<b>Prête</b> · pneus neufs, chaîne graissée' }

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--allow-file-access-from-files'],
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
page.on('pageerror', e => console.log('  pageerror:', e.message))

const vues = []
for (const [fichier, label, detourer] of COLONNES) {
  if (!fs.existsSync(path.join(gem, fichier))) { console.log(`  ${fichier} absent, ignoré`); continue }
  const q = new URLSearchParams({ img: `./sorties/gemini/${fichier}`, ...FICHE })
  if (!detourer) q.set('brut', '1')
  await page.goto(`file://${ici}/garage.html?${q}`)
  await page.waitForFunction('window.__pret === true')
  await page.evaluate(() => document.fonts.ready)
  const buf = await page.screenshot()
  vues.push({ label, b64: buf.toString('base64') })
  console.log(`  ${label.padEnd(24)} ${detourer ? 'détouré' : 'tel quel'}`)
}

// Assemblage : une page qui aligne les captures avec leur étiquette.
const planche = await nav.newPage({
  viewport: { width: Math.max(600, vues.length * 406 + 40), height: 1000 }, deviceScaleFactor: 1 })
await planche.setContent(`<!doctype html><meta charset="utf-8">
<style>
  body { background:#04060F; margin:0; padding:20px; display:flex; gap:16px;
         font:12px/1.4 ui-monospace,Menlo,monospace; color:#8FA3CE }
  figure { margin:0; width:390px }
  figcaption { padding:9px 2px 0; letter-spacing:.09em; text-transform:uppercase; font-size:11px }
  b { color:#3DE0FF; font-weight:600 }
  img { width:390px; display:block; border:1px solid rgba(120,150,255,.20) }
</style>
${vues.map(v => `<figure><img src="data:image/png;base64,${v.b64}">
  <figcaption><b>${v.label}</b></figcaption></figure>`).join('')}`)
await planche.screenshot({ path: sortie, fullPage: true })
await nav.close()
console.log('planche →', sortie)
