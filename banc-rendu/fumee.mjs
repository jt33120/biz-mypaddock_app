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

const onglet = (nom) => page.click(`nav.barre .onglet:has-text("${nom}")`)

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
await page.click('text=Enregistrer la session')
await page.waitForSelector('text=Meilleur tour du jour', { timeout: 10_000 })
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
