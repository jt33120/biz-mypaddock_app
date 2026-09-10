// Épique 9 — l'accueil temporel se branche sur l'atelier.
//
// « C'est ce branchement qui referme le vide saisonnier », pas l'axe machine
// seul. Sans lui, entre novembre et avril, l'accueil n'a qu'un roulage vieux de
// cinq mois à montrer — et un produit qui répète la même chose pendant cinq mois
// est un produit qu'on cesse d'ouvrir.
//
// L'essai descend les sources UNE PAR UNE, en retirant à chaque fois celle qui
// gagnait : c'est la seule façon de vérifier un ordre de priorité.
import { chromium } from 'playwright-core'
import { sortir } from './verdict.mjs'

const nav = await chromium.launch({
  executablePath: process.env.CHROME
    ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
let page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))
const pret = () => page.waitForFunction(() => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })
const accueil = async () => {
  await page.click('nav.barre .onglet:has-text("ACCUEIL")')
  await page.waitForTimeout(700)
  return (await page.textContent('.ecran')).replace(/\s+/g, ' ')
}

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

// Une machine, et un roulage PASSÉ : le creux de novembre, à l'identique.
await page.click('nav.barre .onglet:has-text("GARAGE")')
await page.fill('.champ[placeholder="Honda"]', 'Yamaha')
await page.fill('.champ[placeholder="CBR 1000 RR"]', 'R6')
await page.click('text=Déclarer ma moto')
await page.waitForSelector('.garage .modele', { timeout: 20_000 })
await page.click('text=Reprendre la saison 2026 · Pau-Arnos')
await page.waitForTimeout(1200)

console.log('① avec un roulage à venir :', (await accueil()).slice(0, 110))

// ── LE CREUX. `localStorage.clear()` ne suffit pas : la base vit dans l'OPFS,
//    qui lui survit. Il faut un CONTEXTE NEUF — même origine, stockage vierge.
//    Trouvé en écrivant l'essai : la saison restait là et le roulage à venir
//    gagnait toujours, donc l'essai « passait » sans rien éprouver.
await page.close()
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
page = await ctx.newPage()
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))
await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

// ── ② UNE PIÈCE ACHETÉE, RIEN D'AUTRE À VENIR.
await page.click('nav.barre .onglet:has-text("GARAGE")')
await page.waitForSelector('.garage.vide', { timeout: 20_000 })
await page.fill('.champ[placeholder="Honda"]', 'Yamaha')
await page.fill('.champ[placeholder="CBR 1000 RR"]', 'R6')
await page.click('text=Déclarer ma moto')
// Chaque poste d'atelier est une PAGE depuis le retour de Julian : un accordéon
// tenait trois lignes, il ne tient pas un carnet avec ses factures et son manuel.
await page.waitForSelector('button.atelier.entretien', { timeout: 20_000 })
await page.click('button.atelier:has-text("Entretien")')
await page.waitForSelector('.poste-page.entretien', { timeout: 20_000 })
await page.click('text=Consigner un geste')
await page.fill('.champ[placeholder="Plaquettes avant"]', 'Plaquettes avant')
await page.click('text=Acheté, pas encore monté')
await page.waitForTimeout(600)
await page.click('.poste-page .lien:has-text("garage")')
await page.waitForTimeout(800)
const a2 = await accueil()
console.log('② pièce au garage :', a2.slice(0, 130))
console.log('   la pièce prend la tête :', a2.includes('Au garage') && a2.includes('Plaquettes avant') ? 'oui' : 'NON')

// ── ③ UN ÉVÉNEMENT VISÉ passe DEVANT la pièce : il est daté, donc plus proche
//    dans le temps (FR-11).
await page.click('nav.barre .onglet:has-text("ROULAGES")')
await page.click('text=Viser un événement')
await page.fill('.champ[placeholder="Bol d\'Or"]', "Bol d'Or")
await page.fill('.champ[type=date]', '2027-06-19')
await page.fill('.champ[placeholder="600"]', '600')
await page.click('text=Le viser')
await page.waitForTimeout(800)
const a3 = await accueil()
console.log('③ événement visé :', a3.slice(0, 130))
console.log('   il passe devant la pièce :', a3.includes('Tu vises') && a3.includes("Bol d'Or") ? 'oui' : 'NON')
console.log('   le coût est annoncé comme ESTIMÉ :', a3.includes('estimés') ? 'oui' : 'NON')

// ── ④ FR-13 sur toutes les nouvelles formulations.
/* ⚠ DES MOTIFS, PLUS DES SOUS-CHAÎNES — 2 septembre 2026, et c'est le banc qui
   avait tort. `'reste'` cherché en sous-chaîne attrapait « Les bras RESTEnt
   souples », un conseil de pilotage parfaitement conforme au FR-13. Le conseil
   du jour est choisi de façon DÉTERMINISTE sur la date (`conseilDuJour`, six
   textes embarqués), donc cet essai rougissait un jour sur six, sur un produit
   juste, et une fois sur six seulement — c'est-à-dire assez rarement pour qu'on
   soupçonne le produit avant le harnais. C'est exactement ce que la tête de
   `essais.mjs` refuse : un banc qui échoue pour une raison qui n'est pas le
   sujet est un banc qu'on finit par ne plus croire.

   Ce qu'on interdit n'a jamais été le MOT « reste », c'est la tournure de
   COMPTE À REBOURS — « il te reste », « reste à faire ». Les motifs le disent
   maintenant, et `\b` empêche un verbe conjugué de se faire prendre pour elle.
   Le « ! » reste littéral : un point d'exclamation n'a pas de frontière de mot. */
const interdits = [
  /!/, /\bpense[sz]? à\b/, /\bn'oublie/, /\bil faut\b/, /\btu dois\b/,
  /\bplus que\b/, /\bil (te |vous )?reste\b/, /\breste à\b/,
  /\ben retard\b/, /\burgent/,
]
const fautes = interdits.filter((r) => r.test(a3.toLowerCase())).map(String)
console.log('④ FR-13 — aucun impératif, aucune échéance :',
  fautes.length ? 'NON — ' + fautes.join(', ') : 'oui')

await page.screenshot({ path: process.argv[2] ?? '/tmp/vide.png', fullPage: true })
await nav.close()
sortir(erreurs)
