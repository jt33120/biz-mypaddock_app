// Épique 5 de bout en bout, dans l'ordre où un pilote le vit :
// un roulage, un chrono, une dépense, puis le coût — et la clause FR-24 vérifiée
// dans les DEUX sens : sans budget le coût au tour est ABSENT, avec budget il est là.
import { chromium } from 'playwright-core'
import { sortir } from './verdict.mjs'

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))

const onglet = n => page.click(`nav.barre .onglet:has-text("${n}")`)
const texte = async s => (await page.textContent(s)).replace(/\s+/g, ' ').trim()

// FR-36 : depuis l'épique 4, la fin d'une saisie ouvre LE RÉCAPITULATIF, pas le
// bilan — il se compose tout seul et s'affiche sans avoir été demandé. Les
// essais passent donc par lui pour atteindre le roulage.
const enregistrerSession = async () => {
  await page.click('text=Enregistrer la session')
  // Playwright ne mélange pas un sélecteur CSS et un `text=` dans une liste :
  // on attend l'un OU l'autre par une condition, pas par un sélecteur composé.
  await page.waitForFunction(() =>
    !!document.querySelector('section.recap .recap-image')
    || document.body.textContent.includes('Meilleur tour du jour'), null, { timeout: 40_000 })
  if (await page.isVisible('section.recap')) {
    await page.click('text=Retour au roulage')
    await page.waitForSelector('text=Meilleur tour du jour', { timeout: 20_000 })
  }
  // Le bilan se recompose (coût, photos, gestes) : on attend qu'il soit STABLE
  // avant de rendre la main, sinon le clic suivant vise un nœud détaché.
  await page.waitForSelector('.bloc:has-text("Photos et gestes")', { timeout: 20_000 })
  // Le bloc coût et la bande photo arrivent de requêtes distinctes et changent
  // la hauteur de la page : sans ce répit, le clic suivant vise une cible qui
  // bouge encore. C'est une contrainte d'ESSAI, pas un défaut du produit.
  await page.waitForTimeout(500)
}

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await page.waitForFunction(() => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })

// Un roulage avec deux sessions, donc deux tours.
await page.click('text=Saisir mon premier roulage')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Pau-Arnos')
await page.click('text=Continuer')
await enregistrerSession()
await page.click('text=Saisir une session')
await enregistrerSession()

console.log('① sans dépense :', await texte('.bloc:last-of-type'))

// Une dépense de journée.
await page.click('text=Ajouter une dépense')
await page.waitForSelector('section.depense')
await page.fill('#montant', '180,50')
await page.fill('#libelle', 'Engagement')
console.log('   cibles proposées :', await page.$$eval('section.depense .puces .puce', ns => ns.map(n => n.textContent)))
await page.click('section.depense .bouton:not(.secondaire)')
await page.waitForSelector('text=Meilleur tour du jour')

const sansBudget = await texte('.ecran')
console.log('② coût affiché :', /180,5\d? €/.test(sansBudget) ? 'oui' : 'NON')
console.log('   coût AU TOUR caché sans budget :', sansBudget.includes('Au tour') ? 'NON — CLAUSE VIOLÉE' : 'oui')
console.log('   ni zéro ni tiret :', /Au tour[^€]*(0 €|—)/.test(sansBudget) ? 'NON' : 'oui')
console.log('   champ budget proposé :', await page.isVisible('#budget'))

/* ─── RÉCIT 19.1 — LE CHAMP DIT SA PÉRIODE À CÔTÉ DE LA VALEUR ─────────────
   Le défaut que Julian a payé : « le coût est de 2180 mais le budget est de
   500/mois ». Il a saisi un montant MENSUEL dans un champ ANNUEL, et rien à
   l'écran ne l'a contredit — le mot « saison » vivait dans une étiquette
   au-dessus et le placeholder disait « 0 ». */
console.log('   l\'unité du champ porte la période :',
  (await texte('.somme .unite')).includes('par an') ? 'oui' : 'NON')
await page.fill('#budget', '2000')
// LA CONVERSION PENDANT LA FRAPPE, avant même de valider : celui qui pensait
// « par mois » lit immédiatement ce que son chiffre vaut au mois.
const pendant = await texte('.bloc:has-text("Ce que la journée a coûté")')
console.log('   le repère du mois s\'écrit pendant la frappe :',
  /repère de 166,67 € par mois/.test(pendant) ? 'oui' : 'NON', pendant.slice(-120))

// On pose le budget : le coût au tour doit apparaître AVEC le consommé.
await page.click('text=Poser le budget')
// On attend la JAUGE : elle n'existe que dans la branche « budget déclaré ».
// Attendre le texte « au tour » matchait la note qui explique son absence.
await page.waitForSelector('.jauge', { timeout: 10_000 })
const avec = await texte('.bloc:has-text("Ce que la journée a coûté")')
console.log('③ avec budget :', avec)
// FR-21 — le consommé est DANS LE MÊME BLOC, sans interaction pour le révéler.
// ⚠ L'ESSAI CHERCHAIT LE MOT « consommé » ; il cherche maintenant les DEUX
// CHIFFRES ensemble, ce qui est la clause elle-même. Un mot est un synonyme
// près de disparaître, deux montants côte à côte sont la chose à prouver.
console.log('   dépensé ET plafond dans le MÊME bloc :',
  /180,50 €/.test(avec) && /sur 2 000 € posés pour l'année/.test(avec) ? 'oui' : 'NON — FR-21 VIOLÉE')
console.log('   les deux chiffres portent leur période :',
  /sur l'année 2026/.test(avec) && /posés pour l'année/.test(avec) ? 'oui' : 'NON')
console.log('   sous le plafond, la jauge ne porte aucun repère :',
  await page.$$eval('.jauge i', (n) => n.length) === 0 ? 'oui' : 'NON')

/* ─── LE DÉPASSEMENT — le chiffre exact de Julian, 2180 sur un plafond ─────
   Bornée à 100 % par un `Math.min`, la jauge rendait 2 000,01 € et 2 180 €
   STRICTEMENT identiques : une barre pleine, et rien pour dire de combien on
   dépasse. Elle se reborne maintenant sur le consommé, et le plafond devient un
   repère posé dessus.
   ⚠ ET RIEN NE ROUGIT, RIEN NE REPROCHE : « dépasser son budget n'est pas une
   faute » est une règle écrite, et le rouge est réservé au geste qui détruit. */
await page.click('text=Ajouter une dépense')
await page.waitForSelector('section.depense')
await page.fill('#montant', '2000')
await page.fill('#libelle', 'Pneus')
await page.click('section.depense .bouton:not(.secondaire)')
await page.waitForSelector('.jauge', { timeout: 20_000 })
await page.waitForFunction(() => document.querySelectorAll('.jauge i').length > 0,
  null, { timeout: 20_000 }).catch(() => {})
const trop = await texte('.bloc:has-text("Ce que la journée a coûté")')
console.log('④ dépassement :', trop.slice(0, 200))
console.log('   le plafond est marqué sur la jauge :',
  await page.$$eval('.jauge i', (n) => n.length) === 1 ? 'oui' : 'NON')
// Le repère tombe là où le plafond tombe : 2000 sur 2180,50 ≈ 91,7 %. Une barre
// bornée à 100 % l'aurait laissé au bout, indiscernable d'un euro de trop.
const ou = await page.$eval('.jauge i', (n) => n.style.left)
console.log('   il dit DE COMBIEN on dépasse :',
  parseFloat(ou) > 85 && parseFloat(ou) < 95 ? 'oui' : 'NON', ou)
const teintes = await page.$$eval('.jauge, .jauge *',
  (ns) => ns.map((n) => getComputedStyle(n).backgroundColor + ' ' + getComputedStyle(n).color))
console.log('   rien ne rougit au dépassement :',
  teintes.some((t) => /255, 92, 92/.test(t)) ? 'NON — le rouge du destructif' : 'oui')
console.log('   rien ne dit « dépassé » :',
  /dépass|trop|attention|faute/i.test(trop) ? 'NON' : 'oui')

await page.screenshot({ path: process.argv[2] ?? '/tmp/cout.png', fullPage: true })
await nav.close()
sortir(erreurs)
