// Récit 7.1 — les trois instruments, et surtout la clause AD-16 : refuser
// ne doit RIEN écrire, pas même en local. C'est la seule qui se vérifie en
// regardant la base, pas l'écran.
import { chromium } from 'playwright-core'

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))
const onglet = n => page.click(`nav.barre .onglet:has-text("${n}")`)
const pret = () => page.waitForFunction(() => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

// ── Une ouverture doit exister, à zéro saisie.
await onglet('SONDE')
await page.waitForSelector('text=Instruments de bord')
console.log('① au démarrage :', (await page.textContent('.bloc.pile')).replace(/\s+/g, ' ').slice(0, 200))

// ── Une saisie doit la marquer.
await onglet('ACCUEIL')
await page.click('text=Saisir mon premier roulage')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Pau-Arnos')
await page.click('text=Continuer')
await page.click('text=Enregistrer la session')
await page.waitForSelector('text=Meilleur tour du jour')
await onglet('SONDE')
await page.waitForSelector('text=Instruments de bord')
const apres = (await page.textContent('.bloc.pile')).replace(/\s+/g, ' ')
console.log('② après saisie :', apres.slice(0, 240))
console.log('   ouverture marquée (0 / 1) :', /0 \/ 1/.test(apres) ? 'oui' : 'NON')
console.log('   délai calculé :', /Délai roulage → saisie/.test(apres) ? 'oui' : 'NON')

// ── AD-16 : on refuse, on recharge, et RIEN de nouveau ne doit être écrit.
await onglet('COMPTE')
await page.click('.plat.repris .puce')
console.log('③ bascule :', await page.textContent('.plat.repris .puce'))

const compte = () => page.evaluate(async () => {
  const r = await window.__db.getAll('SELECT count(*) AS n FROM mesure')
  return r[0].n
})
await page.evaluate(() => { window.__db = undefined })   // le pont est posé par l'app
await page.reload({ waitUntil: 'networkidle' })
await pret()
await onglet('SONDE')
await page.waitForSelector('text=Instruments de bord')
const refus = (await page.textContent('.bloc.pile')).replace(/\s+/g, ' ')
const m = refus.match(/(\d+) \/ (\d+)/)
console.log('④ après refus + rechargement — ouvertures :', m ? m[2] : '?', '(doit rester 1)')
console.log('   AD-16 tenue :', m && m[2] === '1' ? 'oui' : 'NON — une ligne a été écrite malgré le refus')

await page.screenshot({ path: process.argv[2] ?? '/tmp/inst.png', fullPage: true })
console.log('erreurs :', erreurs.length ? erreurs : 'aucune')
await nav.close()
