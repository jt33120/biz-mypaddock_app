// Porte de rendu — pilotage CDP. Remplace --virtual-time-budget, qui expirait pendant
// le décodage hors-fil d'une photo de 18 Mpx et gelait la page sans erreur.
import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ici = path.dirname(new URL(import.meta.url).pathname)
const dossier = path.join(ici, 'photos')

// HEIC : Safari le décode, Chrome non. On normalise SANS redimensionner — réduire ici
// supprimerait le cas à 18,3 Mpx, celui qui fait mourir l'onglet.
for (const f of fs.readdirSync(dossier).filter(f => /\.heic$/i.test(f))) {
  const jpg = path.join(dossier, f.replace(/\.heic$/i, '.jpg'))
  if (!fs.existsSync(jpg)) {
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '92',
      path.join(dossier, f), '--out', jpg], { stdio: 'ignore' })
    console.log('heic → jpeg :', path.basename(jpg))
  }
}

const noms = fs.readdirSync(dossier)
  .filter(f => /\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith('.')).sort()
fs.writeFileSync(path.join(dossier, 'manifest.json'), JSON.stringify(noms, null, 1))
console.log(`${noms.length} photo(s) au jeu d'essai`)

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--allow-file-access-from-files'],
})
const page = await nav.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2 })
page.on('console', m => { if (m.type() === 'error') console.log('  console:', m.text()) })
page.on('pageerror', e => console.log('  pageerror:', e.message))

await page.goto(`file://${ici}/index.html`)
try {
  await page.waitForFunction('window.__pret !== undefined', null, { timeout: 180_000 })
} catch {
  console.log('  ⚠ la page n’a jamais signalé sa fin — planche partielle')
}
const res = await page.evaluate('window.__pret ?? []')
fs.mkdirSync(path.join(ici, 'sorties'), { recursive: true })
await page.screenshot({ path: path.join(ici, 'sorties', 'planche.png'), fullPage: true })
await nav.close()

for (const r of res)
  console.log(`  ${r.nom.padEnd(18)} ${r.echec ? 'ÉCHEC ' + r.echec : Math.round(r.ms) + ' ms'}`)
console.log('planche →', path.join(ici, 'sorties', 'planche.png'))
