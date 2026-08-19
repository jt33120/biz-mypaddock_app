// Produit deux choses d'un coup : la planche comparative en PNG, et un fichier de données
// (une image par couple photo × approche) pour construire une page consultable au téléphone.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const ici = path.dirname(new URL(import.meta.url).pathname)
const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--allow-file-access-from-files'],
})
const page = await nav.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 })
page.on('pageerror', e => console.log('  pageerror:', e.message))
await page.goto(`file://${ici}/comparatif.html`)
await page.waitForFunction('window.__pret === true', null, { timeout: 300_000 })

fs.mkdirSync(path.join(ici, 'sorties'), { recursive: true })
await page.screenshot({ path: path.join(ici, 'sorties', 'comparatif.png'), fullPage: true })
const images = await page.evaluate('window.__images')
await nav.close()

fs.writeFileSync(path.join(ici, 'sorties', 'comparatif.json'), JSON.stringify(images))
const ko = images.filter(i => i.echec)
console.log(`${images.filter(i => i.dataUrl).length} rendus · ${ko.length} échec(s)`)
console.log('planche  →', path.join(ici, 'sorties', 'comparatif.png'))
console.log('données  →', path.join(ici, 'sorties', 'comparatif.json'))
