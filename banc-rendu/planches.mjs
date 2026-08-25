// UNE PLANCHE DE TOUS LES ÉCRANS, à regarder — pas à vérifier.
//
// ⚠ CE FICHIER EXISTE PARCE QUE LES ASSERTIONS NE VOIENT PAS TOUT. Sur ce
// produit, quatre défauts n'ont été trouvés QUE par la capture : une courbe à
// l'envers dont la légende disait le contraire, un message d'échec de partage à
// côté du fichier prêt, un formulaire poussé hors de l'écran par six
// propositions, un refus rendu en corps de texte au lieu d'un ton d'erreur.
// Aucun de ces défauts n'aurait pu échouer un `expect` : tout était présent,
// tout était juste, et l'écran mentait quand même.
//
// Le banc affirme. Ceci montre.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'
import { CHROME } from './photo-essai.mjs'

const SORTIE = process.argv[2] ?? '/tmp/planches'
fs.mkdirSync(SORTIE, { recursive: true })

const nav = await chromium.launch({ executablePath: CHROME })
// Le format du téléphone où le produit vit, pas celui d'un écran de bureau.
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()) })
page.on('pageerror', (e) => erreurs.push(e.message))

const pret = () => page.waitForFunction(
  () => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })
const onglet = (n) => page.click(`nav.barre .onglet:has-text("${n}")`)
let n = 0
const prendre = async (nom) => {
  await page.waitForTimeout(400)   // les blocs arrivent de requêtes distinctes
  const p = String(++n).padStart(2, '0')
  await page.screenshot({ path: path.join(SORTIE, `${p}-${nom}.png`), fullPage: true })
  // ⚠ ET LE BAS DE L'ÉCRAN, EN VRAIE TAILLE. Une capture `fullPage` peint la
  // barre basse à sa place de départ : elle ne dit RIEN de ce qui se trouve
  // dessous une fois qu'on a fait défiler. C'est pourtant là qu'une dernière
  // ligne se cache — et une phrase à moitié masquée par la barre ne fait
  // échouer aucune assertion.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(250)
  await page.screenshot({ path: path.join(SORTIE, `${p}-${nom}-bas.png`) })
  await page.evaluate(() => window.scrollTo(0, 0))
  console.log(`  ${p}-${nom}`)
}

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()
await prendre('accueil-vide')

// La saison d'essai : le raccourci du garage, celui qui remplit l'application
// comme une vraie saison la remplirait.
await onglet('GARAGE')
await prendre('garage-vide')
// La machine d'abord : le raccourci de saison n'apparaît qu'une fois qu'il y a
// une moto à qui rattacher les journées.
await page.fill('.champ[placeholder="Honda"]', 'Honda')
await page.fill('.champ[placeholder="CBR 1000 RR"]', 'CBR 1000 RR · 83')
await page.click('text=Déclarer ma moto')
await page.waitForSelector('.garage .modele', { timeout: 20_000 })
await prendre('garage-declaree')
await page.click('text=Reprendre la saison 2026 · Pau-Arnos')
await page.waitForTimeout(1500)
await prendre('garage')

await onglet('ACCUEIL')
await prendre('accueil')
await onglet('ROULAGES')
await prendre('roulages')

// Une journée, et ce qu'elle ouvre.
const journee = await page.$('.bloc button, .journee, li button')
if (journee) { await journee.click(); await prendre('journee') }

await onglet('COMPTE')
await prendre('compte')

console.log(erreurs.length ? `\n⚠ ${erreurs.length} erreur(s) console :\n  ${erreurs.join('\n  ')}`
  : '\naucune erreur de console')
await nav.close()
