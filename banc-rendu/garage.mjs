// L'écran garage, rendu à la taille d'un iPhone, avec la moto générée dedans.
// C'est l'OUTPUT FINAL : ce que Julian voit en ouvrant l'application, pas une planche
// de diagnostic. node banc-rendu/garage.mjs [motif-de-version]
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const ici = path.dirname(new URL(import.meta.url).pathname)
const dossier = path.join(ici, 'sorties', 'gemini')
const motif = process.argv[2] ?? ''

// Deux machines réelles, deux fiches. Les chiffres sont plausibles et servent à juger la
// place que prend la moto à l'écran, pas à être exacts.
const FICHES = {
  IMG_9144: { marque:'Honda', modele:'CBR 1000 RR · 83', o1:'CBR 83', o2:'',
              km:'11 240', roul:'7', tour:'1:38<small>.42</small>',
              etat:'<b>Prête</b> · pneus neufs, chaîne graissée' },
  IMG_9245: { marque:'Honda', modele:'CBR 1000 RR · 83', o1:'CBR 83', o2:'',
              km:'11 240', roul:'7', tour:'1:38<small>.42</small>',
              etat:'<b>Prête</b> · pneus neufs, chaîne graissée' },
  IMG_9239: { marque:'Honda', modele:'CBR 1000 RR · 83', o1:'CBR 83', o2:'',
              km:'11 240', roul:'7', tour:'1:38<small>.42</small>',
              etat:'<b>Prête</b> · pneus neufs, chaîne graissée' },
  IMG_9243: { marque:'Honda', modele:'CBR 1000 RR · 83', o1:'CBR 83', o2:'',
              km:'11 240', roul:'7', tour:'1:38<small>.42</small>',
              etat:'<b>Prête</b> · pneus neufs, chaîne graissée' },
  // La Tracer 9 est écartée du périmètre par Julian le 19/08 : le garage n'expose qu'une machine.
  cbr83:     { marque:'Honda', modele:'CBR 1000 RR · 83', o1:'CBR 83', o2:'',
              km:'11 240', roul:'7', tour:'1:38<small>.42</small>',
              etat:'<b>Prête</b> · pneus neufs, chaîne graissée' },
  IMG_9139: { marque:'Honda', modele:'CBR 1000 RR · 83', o1:'CBR 83', o2:'',
              km:'11 240', roul:'7', tour:'1:38<small>.42</small>',
              etat:'<b>Prête</b> · pneus neufs, chaîne graissée' },
}

const fichiers = fs.readdirSync(dossier)
  .filter(f => f.endsWith('.png') && f.includes('--') && (!motif || f.includes(motif)))
  .sort()
if (!fichiers.length) { console.error('aucune image générée pour', motif || '(tout)'); process.exit(1) }

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--allow-file-access-from-files'],
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
page.on('pageerror', e => console.log('  pageerror:', e.message))

const dest = path.join(ici, 'sorties', 'garage')
fs.mkdirSync(dest, { recursive: true })

for (const f of fichiers) {
  const [version, photo] = path.parse(f).name.split('--')
  const fiche = FICHES[photo]
  if (!fiche) { console.log(`  ${f} — pas de fiche pour ${photo}, ignoré`); continue }
  const q = new URLSearchParams({ img: `./sorties/gemini/${f}`, ...fiche })
  await page.goto(`file://${ici}/garage.html?${q}`)
  await page.waitForFunction('window.__pret === true')
  await page.evaluate(() => document.fonts.ready)
  const out = path.join(dest, `${version}--${photo}.png`)
  await page.screenshot({ path: out })
  console.log('  écran →', path.relative(path.join(ici, '..'), out))
}
await nav.close()
