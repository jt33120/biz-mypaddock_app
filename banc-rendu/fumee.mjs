// Essai de fumée du récit 1.2 — on SAISIT d'abord, on regarde le compte ensuite :
// c'est l'ordre réel d'un pilote, et le seul qui teste l'adoption.
import { chromium } from 'playwright-core'

const base = process.argv[2] ?? 'http://localhost:4173'
const sortie = process.argv[3] ?? '/tmp/compte.png'
const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))
page.on('response', r => { if (r.status() >= 400) erreurs.push(`http ${r.status()} ${r.url()}`) })

// Compte et Sonde ne sont plus des onglets : ce sont des liens en TÊTE DE
// L'ACCUEIL, parce qu'un réglage et un instrument ne sont pas des destinations.
const onglet = async (n) => {
  const bas = `nav.barre .onglet:has-text("${n}")`
  if (await page.isVisible(bas)) return page.click(bas)
  await page.click('nav.barre .onglet:has-text("ACCUEIL")')
  return page.click(`.tete .reglages .lien:has-text("${n.toLowerCase()}")`)
}

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

await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForSelector('nav.barre', { timeout: 30_000 })
await page.waitForFunction(() => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })
console.log('onglets :', await page.$$eval('nav.barre .onglet', ns => ns.map(n => n.textContent)))

// 1. Une machine dans le garage.
await onglet('GARAGE')
await page.click('text=Reprendre la CBR 83')
await page.waitForSelector('.garage .sprite', { timeout: 20_000 })
console.log('garage : sprite affiché')

// 2. Un roulage, puis une session — le chemin complet de l'accueil.
await onglet('ACCUEIL')
await page.click('text=Saisir mon premier roulage')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Pau-Arnos')
await page.click('.puce:has-text("CONFIRMÉ")')
await page.click('text=Continuer')
await page.waitForSelector('.molettes', { timeout: 10_000 })
await enregistrerSession()
console.log('bilan :', (await page.textContent('.ecran')).replace(/\s+/g, ' ').slice(0, 90))

// 3. Le compte, qui doit annoncer exactement ce qui vient d'être saisi.
await onglet('COMPTE')
await page.waitForSelector('section.compte', { timeout: 10_000 })
await page.fill('#email', 'julian@exemple.fr')
await page.fill('#mdp', 'motdepasse')
// Le décompte arrive d'une requête : on l'attend, sinon on mesure une course.
await page.waitForSelector('section.compte .repris', { timeout: 10_000 })
console.log('repris :', (await page.textContent('.repris .detail')).replace(/\s+/g, ' ').trim())
await page.screenshot({ path: sortie, fullPage: true })

console.log('erreurs :', erreurs.length ? erreurs : 'aucune')
await nav.close()
process.exit(erreurs.length ? 1 : 0)
