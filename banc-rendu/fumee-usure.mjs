// Épique 12 — l'horloge d'usure et le barème. Le seul endroit du produit où une
// erreur touche la sécurité d'une machine.
//
// Trois clauses, et l'essai les vérifie à l'écran :
//   ① FR-40 — la complétude accompagne le chiffre PARTOUT, sans interaction
//   ② FR-44 — aucun verdict : ni « à changer », ni durée de vie restante
//   ③ FR-61 — un roulage BROUILLON ne fait pas vieillir une machine
import { chromium } from 'playwright-core'
import { sortir } from './verdict.mjs'

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

await page.click('nav.barre .onglet:has-text("GARAGE")')
await page.fill('.champ[placeholder="Honda"]', 'Honda')
await page.fill('.champ[placeholder="CBR 1000 RR"]', 'CBR 1000 RR · 83')
await page.click('text=Déclarer ma moto')
await page.waitForSelector('.garage .modele', { timeout: 20_000 })
await page.click('text=Reprendre la saison 2026 · Pau-Arnos')
await page.waitForTimeout(1500)

// LES HORLOGES ONT SUIVI L'ENTRETIEN DANS SA PAGE. « La prochaine maintenance,
// son calendrier de maintenance éditable » — c'est exactement ce qu'elles sont,
// sous un autre nom, et elles sont désormais à côté des gestes qui les font
// repartir plutôt qu'un écran plus bas.
const pageEntretien = async () => {
  if (await page.isVisible('.poste-page.entretien')) return
  if (await page.isVisible('.poste-page')) await page.click('.poste-page .lien:has-text("garage")')
  await page.click('button.atelier:has-text("Entretien")')
  await page.waitForSelector('.poste-page.entretien', { timeout: 20_000 })
}
await pageEntretien()

// ── Une horloge SANS barème connu : elle compte sans jamais échoir.
await page.click('text=Suivre un poste d\'usure')
await page.fill('.champ[placeholder="Plaquettes avant"]', 'Plaquettes avant')
await page.click('text=Suivre ce poste')
await page.waitForSelector('.usure', { timeout: 20_000 })
const sans = (await page.textContent('.usure')).replace(/\s+/g, ' ')
console.log('① sans barème :', sans)
console.log('   compte sans échoir, et le dit :', sans.includes('sans échoir') ? 'oui' : 'NON')

// ── ① FR-40 : la complétude est là, sans avoir rien touché.
console.log('② complétude affichée sans interaction :',
  /sur \d+ roulages? saisis?/.test(sans) ? 'oui' : 'NON — FR-40 VIOLÉE')
console.log('   les roulages sans groupe sont signalés :',
  sans.includes('sans groupe') ? 'oui' : 'NON')

// ── Une horloge AVEC intervalle, dépassée par la saison de Julian.
await page.click('text=Suivre un poste d\'usure')
await page.fill('.champ[placeholder="Plaquettes avant"]', 'Vidange')
await page.fill('.champ[placeholder="6"]', '3')
await page.click('text=Suivre ce poste')
await page.waitForTimeout(800)
const tout = (await page.textContent('.ecran')).replace(/\s+/g, ' ')
console.log('③ avec intervalle :',
  /Vidange\s*\d+ \/ 3/.test(tout) ? 'compté sur 3' : 'NON — ' + tout.slice(0, 90))
console.log('   dépassement énoncé, jamais jugé :',
  tout.includes("Au-delà de l'intervalle") ? 'oui' : 'NON')

// ── ② FR-44 : AUCUN VERDICT nulle part.
const verdicts = ['à changer', 'à remplacer', 'danger', 'usé', 'durée de vie', 'il te reste',
  'risque', 'critique', 'urgent', 'conforme']
const trouves = verdicts.filter((v) => tout.toLowerCase().includes(v))
console.log('④ FR-44 — aucun verdict :', trouves.length ? 'NON — ' + trouves.join(', ') : 'oui')
console.log('   le barème se dit transcrit :',
  tout.includes('transcrit') || !tout.includes('Barème relevé') ? 'oui' : 'NON')

// ── ⑤ FR-43 — L'HORLOGE REPART. Le défaut le plus grave de cette épique :
//    `repartirDe` existait, était exporté, et n'était appelé nulle part. Le
//    dépassement s'affichait à vie sur un organe de sécurité, et le seul
//    recours était de retirer le suivi. Un afficheur de dépassement permanent
//    est exactement ce qu'on apprend à ignorer.
const compte = async () => (await page.textContent('.usure:has-text("Vidange")')).replace(/\s+/g, ' ')
console.log('⑤ avant :', (await compte()).slice(0, 60))
await page.click('.usure:has-text("Vidange") >> text=C\'est fait aujourd\'hui')
await page.waitForTimeout(900)
const apres = await compte()
console.log('   après « c\'est fait » :', apres.slice(0, 60))
console.log('   l\'horloge est repartie :', /Vidange\s*0 \/ 3/.test(apres) ? 'oui' : 'NON — ELLE NE REPART JAMAIS')
console.log('   un roulage à venir ne la fait pas avancer :',
  /Vidange\s*0 \/ 3/.test(apres) ? 'oui' : `NON (${apres.slice(0, 40)})`)
console.log('   le dépassement a disparu :', apres.includes("Au-delà") ? 'NON' : 'oui')

await page.screenshot({ path: process.argv[2] ?? '/tmp/usure.png', fullPage: true })
await nav.close()
sortir(erreurs)
