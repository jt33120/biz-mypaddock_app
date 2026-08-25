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

// On pose le budget : le coût au tour doit apparaître AVEC le consommé.
await page.fill('#budget', '2000')
await page.click('text=Poser le budget')
// On attend la JAUGE : elle n'existe que dans la branche « budget déclaré ».
// Attendre le texte « au tour » matchait la note qui explique son absence.
await page.waitForSelector('.jauge', { timeout: 10_000 })
const avec = await texte('.bloc:has-text("Ce que la journée a coûté")')
console.log('③ avec budget :', avec)
console.log('   consommé dans le MÊME bloc :', avec.includes('consommé') ? 'oui' : 'NON — FR-21 VIOLÉE')

await page.screenshot({ path: process.argv[2] ?? '/tmp/cout.png', fullPage: true })
await nav.close()
sortir(erreurs)
