// Récit 6.1 — les deux sources, dans l'ordre, et la clause FR-13 sur les libellés.
import { chromium } from 'playwright-core'
const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))
const onglet = n => page.click(`nav.barre .onglet:has-text("${n}")`)
const ecran = async () => (await page.textContent('.ecran')).replace(/\s+/g, ' ').trim()

const jour = (d) => { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10) }

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

console.log('① aucune source :', (await ecran()).slice(0, 110))

// Un roulage PASSÉ — il y a trois jours.
const creer = async (circuit, date) => {
  await page.click('text=Saisir')
  await page.fill('.champ[placeholder="Pau-Arnos"]', circuit)
  await page.fill('input[type=date]', date)
  await page.click('text=Continuer')
  await enregistrerSession()
  await onglet('ACCUEIL')
}
await creer('Pau-Arnos', jour(-3))
const passe = await ecran()
console.log('② dernier roulage :', passe.slice(0, 150))
console.log('   dit « il y a 3 jours » :', passe.includes('il y a 3 jours') ? 'oui' : 'NON')

// Un roulage À VENIR — dans douze jours. Il doit PRENDRE LE DESSUS.
await creer('Lédenon', jour(12))
const futur = await ecran()
console.log('③ à venir :', futur.slice(0, 170))
console.log('   la source à venir gagne :', futur.includes('Prochain roulage') && futur.includes('Lédenon') ? 'oui' : 'NON')
console.log('   dit « dans 12 jours » :', futur.includes('dans 12 jours') ? 'oui' : 'NON')
console.log('   « jamais roulé ici » sur un circuit neuf :', futur.includes('Jamais roulé ici') ? 'oui' : 'NON')

// FR-13 : aucun impératif, aucune exclamation, aucun mot de rareté.
const interdits = [/\bplus que\b/i, /\bencore\b/i, /\breste\b/i, /!/, /\bpense[sz]?\b/i, /\bn'oublie/i, /\bvite\b/i, /\bdépêche/i]
const fautes = interdits.filter(r => r.test(futur)).map(String)
console.log('④ FR-13 — libellés :', fautes.length ? 'FAUTES ' + fautes.join(' ') : 'aucun impératif, aucune échéance')

await page.screenshot({ path: process.argv[2] ?? '/tmp/acc.png', fullPage: true })
console.log('erreurs :', erreurs.length ? erreurs : 'aucune')
await nav.close()
