// L'ÉCRAN DE CHARGEMENT — récit 20.1, design remis par Julian le 25 août 2026.
//
// Ce que cet essai protège, et aucun des trois points n'est décoratif :
//
//   ⚠ IL EXISTE AVANT REACT. Tout l'intérêt du décor est d'être peint par le
//     document, pas monté par l'application : monté par React, il arriverait
//     APRÈS le paquet et le moteur SQLite, c'est-à-dire quand il n'y a plus rien
//     à attendre. L'essai le cherche donc AVANT que le script ne soit exécuté.
//   ⚠ IL S'EN VA. Un calque plein écran en `position: fixed` qui reste, même
//     transparent, avale tous les taps de l'application. C'est le défaut que
//     coûterait un `transitionend` jamais reçu.
//   ⚠ IL NE COMPTE RIEN. Ni barre, ni pourcentage, ni rond qui tourne, ni le mot
//     « chargement » — contrainte de produit, pas préférence.
import { chromium } from 'playwright-core'
import { sortir } from './verdict.mjs'

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))

// ── ① LE DÉCOR EST DANS LE DOCUMENT, PAS DANS LE PAQUET.
//    On coupe le JavaScript : ce qui reste à l'écran est ce que le document
//    peint tout seul. Si le décor venait de React, il ne resterait rien.
const sansScript = await nav.newPage({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false })
await sansScript.goto('http://localhost:4173', { waitUntil: 'domcontentloaded' })
const nu = await sansScript.evaluate(() => {
  const d = document.getElementById('chargement')
  if (!d) return null
  return {
    moto: !!d.querySelector('.ch-moto img'),
    lisere: !!d.querySelector('.ch-lisere'),
    feux: d.querySelectorAll('[data-om-light="1"]').length,
    bandes: d.querySelectorAll('[data-band="1"]').length,
    etoiles: [...d.querySelectorAll('div')].filter(n => n.style.width === '5px').length,
    titres: [...d.querySelectorAll('svg')].map(n => n.getAttribute('aria-label')),
  }
})
console.log('① sans JavaScript, le décor est là :', nu ? 'oui' : 'NON')
console.log('   ce qu\'il porte :', JSON.stringify(nu))
console.log('   la moto, son liseré, 3 feux, 4 bandes, 9 étoiles :',
  nu && nu.moto && nu.lisere && nu.feux === 3 && nu.bandes === 4 && nu.etoiles === 9 ? 'oui' : 'NON')
console.log('   et le nom, en lettres pixel :',
  nu && nu.titres.join(' ') === 'MY PADDOCK' ? 'oui' : 'NON')
await sansScript.screenshot({ path: process.argv[3] ?? '/tmp/chargement.png' })
await sansScript.close()

// ── ② IL NE COMPTE RIEN, ET NE PRESSE PERSONNE.
const texte = (await page.goto('http://localhost:4173', { waitUntil: 'commit' }), '')
await page.waitForSelector('#chargement', { timeout: 10_000 })
const bavard = await page.evaluate(() => {
  const d = document.getElementById('chargement')
  const t = (d.textContent || '').replace(/\s+/g, ' ').trim()
  return {
    texte: t,
    jauges: d.querySelectorAll('progress, meter, [role="progressbar"]').length,
    ronds: [...d.querySelectorAll('*')].filter(n => {
      const r = getComputedStyle(n).borderRadius
      return r && r !== '0px' && parseFloat(r) > 4
    }).length,
  }
})
console.log('② rien qui compte :', bavard.jauges === 0 && bavard.ronds === 0 ? 'oui' : 'NON',
  JSON.stringify(bavard))
console.log('   aucun texte, pas même le mot « chargement » :',
  bavard.texte === '' ? 'oui' : `NON — « ${bavard.texte} »`)

// ── ③ IL S'EN VA, ET IL LAISSE PASSER LES DOIGTS.
await page.waitForFunction(() => !document.getElementById('chargement'), null, { timeout: 30_000 })
  .catch(() => { /* l'état réel est dit juste après */ })
console.log('③ le décor est retiré du document :',
  await page.evaluate(() => !document.getElementById('chargement')) ? 'oui' : 'NON')
await page.waitForSelector('nav.barre', { timeout: 20_000 })
console.log('   et l\'application est bien dessous :', await page.isVisible('nav.barre') ? 'oui' : 'NON')

// ── ④ LA DURÉE MINIMALE EST RÉELLEMENT TENUE.
//    Sans elle l'écran clignote et n'existe pas : sur un ordinateur tout est
//    prêt en ~80 ms. Julian a demandé qu'on ralentisse volontairement, en
//    connaissant le coût — c'est donc une PROMESSE, et elle se garde.
//    On rouvre et on regarde à 300 ms : le décor doit encore être là.
const page2 = await nav.newPage({ viewport: { width: 390, height: 844 } })
await page2.goto('http://localhost:4173', { waitUntil: 'commit' })
await page2.waitForTimeout(300)
const encoreLa = await page2.evaluate(() => {
  const d = document.getElementById('chargement')
  return { present: !!d, parti: !!d && d.classList.contains('ch-parti') }
})
console.log('④ à 300 ms, le décor est encore là :',
  encoreLa.present && !encoreLa.parti ? 'oui' : `NON — ${JSON.stringify(encoreLa)}`)
await page2.waitForFunction(() => !document.getElementById('chargement'), null, { timeout: 30_000 })
  .catch(() => {})
console.log('   et il finit quand même par partir :',
  await page2.evaluate(() => !document.getElementById('chargement')) ? 'oui' : 'NON')
await page2.close()

await nav.close()
sortir(erreurs)
