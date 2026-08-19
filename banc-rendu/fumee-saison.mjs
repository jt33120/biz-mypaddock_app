// Épique 15 — le bilan de saison, FR-52, FR-55, FR-56.
//
// La clause qui compte est FR-55 : le bilan ÉNONCE SA COMPLÉTUDE plutôt que de
// présenter des moyennes fausses. L'essai vérifie donc surtout une ABSENCE —
// aucune moyenne nulle part — et un ORDRE : la complétude avant les chiffres.
import { chromium } from 'playwright-core'

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))
const pret = () => page.waitForFunction(() => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

// La saison de Julian : quatre roulages chronométrés, plus un à venir SANS
// chrono — c'est exactement le trou que la complétude doit énoncer.
await page.click('nav.barre .onglet:has-text("GARAGE")')
await page.fill('.champ[placeholder="Honda"]', 'Honda')
await page.fill('.champ[placeholder="CBR 1000 RR"]', 'CBR 1000 RR · 83')
await page.click('text=Déclarer ma machine')
await page.waitForSelector('.garage .modele', { timeout: 20_000 })
await page.click('text=Reprendre la saison 2026 · Pau-Arnos')
await page.waitForTimeout(1500)

await page.click('nav.barre .onglet:has-text("ROULAGES")')
await page.waitForSelector('.saison', { timeout: 20_000 })
const t = (await page.textContent('.saison')).replace(/\s+/g, ' ')
console.log('① bilan :', t.slice(0, 200))

// ── ① FR-55 : la complétude est ÉNONCÉE, et elle précède les chiffres.
console.log('   la complétude est dite :', /\d+ roulages? saisis?/.test(t) ? 'oui' : 'NON')
console.log('   les trous sont nommés :', /sans chrono|sans groupe/.test(t) ? 'oui' : 'NON')
const iComplet = t.search(/roulages? saisis?/)
const iChiffres = t.indexOf('circuits')
console.log('   elle vient AVANT les chiffres :', iComplet >= 0 && iComplet < iChiffres ? 'oui' : 'NON')

// ── ② FR-52 : la saison est bornée par ce qui est SAISI, pas par un calendrier.
console.log('② bornes dérivées :', /Du \d{4}-\d{2}-\d{2} au \d{4}-\d{2}-\d{2}/.test(t) ? 'oui' : 'NON')
console.log('   et le dit :', t.includes('pas un calendrier') ? 'oui' : 'NON')

// ── ③ AUCUNE MOYENNE. C'est une absence, donc elle se vérifie par la négative.
const moyennes = ['moyen', 'moyenne', 'par roulage', '/ roulage', 'en moyenne', 'ratio']
const trouves = moyennes.filter((m) => t.toLowerCase().includes(m))
console.log('③ aucune moyenne :', trouves.length ? trouves : 'oui')

// ── ④ FR-56 : un REPORT, jamais une prévision.
await page.click('text=Ajouter une dépense').catch(() => {})
console.log('④ report proposé :', await page.isVisible('text=/Le reprendre pour/') ? 'oui (une dépense existe)' : 'pas encore de dépense saisie')
console.log('   le mot « prévision » est écarté :',
  t.includes("pas une prévision") || !t.includes('report') ? 'oui' : 'NON')

await page.screenshot({ path: process.argv[2] ?? '/tmp/saison.png', fullPage: true })
console.log('erreurs :', erreurs.length ? erreurs : 'aucune')
await nav.close()
process.exit(erreurs.length ? 1 : 0)
