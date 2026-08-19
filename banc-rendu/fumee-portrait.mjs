// Récit 3bis.3 — le portrait de jeu. La seule fonction du produit qui coûte de
// l'argent, donc la seule dont l'essai doit prouver qu'elle NE DÉPENSE PAS.
//
// Quatre clauses :
//   ① la photo réelle et le sprite coexistent — retirer l'un fait apparaître l'autre
//   ② sans compte, aucune requête ne part : l'application ne peut pas dépenser seule
//   ③ le refus est ÉNONCÉ, et la photo reste intacte
//   ④ un candidat n'est rien tant qu'il n'est pas gardé
import { chromium } from 'playwright-core'

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))

// TOUT appel à la fabrique est noté. C'est la mesure qui compte : un appel
// parti, c'est 0,16 € — et un essai qui en déclenche est un essai qui coûte.
const appels = []
page.on('request', r => { if (r.url().includes('/functions/v1/sprite')) appels.push(r.url()) })

const pret = () => page.waitForFunction(() => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })
const onglet = (n) => page.click(`nav.barre .onglet:has-text("${n}")`)
const PHOTO = '/private/tmp/claude-501/-Users-juliantalou-Documents-PRO-03-PROJECTS-MyPaddock3/40a4a422-990d-4b2a-ae97-416403e70311/scratchpad/grande.jpg'

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

await onglet('GARAGE')
await page.click('text=Reprendre la CBR 83')
await page.waitForSelector('.garage .sprite', { timeout: 20_000 })
console.log('① au départ, la forme de jeu tient la scène :', await page.isVisible('.garage .sprite'))
console.log('   la photo n\'est pas encore là :', await page.isVisible('.photo-machine') ? 'NON' : 'oui')

// ── La photo réelle, versée hors ligne comme toute photo du produit.
await page.context().setOffline(true)
await page.setInputFiles('.garage input[type=file]', PHOTO)
await page.waitForFunction(() => document.body.textContent.includes('Changer sa photo'), null, { timeout: 60_000 })
console.log('② photo versée hors ligne · le sprite garde la scène :',
  await page.isVisible('.garage .sprite') ? 'oui' : 'NON')

// ── ① Retirer la forme de jeu : la photo REPREND SA PLACE. C'est le quatrième
//    critère du récit, et il n'est vrai que parce que la photo existe à part.
await page.click('text=Retirer sa forme de jeu')
await page.waitForSelector('.photo-machine', { timeout: 20_000 })
console.log('③ forme retirée → la photo réelle reprend la scène :', await page.isVisible('.photo-machine'))
console.log('   rien n\'a été détruit, la machine est intacte :',
  (await page.textContent('.garage .modele')).trim())

// ── ② et ③ : la fabrique, sans compte.
await page.context().setOffline(false)
await page.click('text=Lui donner sa forme de jeu')
await page.waitForSelector('.mot-erreur', { timeout: 30_000 })
console.log('④ refus énoncé :', (await page.textContent('.mot-erreur')).replace(/\s+/g, ' '))
console.log('   requêtes parties vers la fabrique :', appels.length,
  appels.length === 0 ? '— aucune dépense possible sans compte' : '← DES EUROS ONT PU PARTIR')
console.log('   la photo est toujours là :', await page.isVisible('.photo-machine'))

await page.screenshot({ path: process.argv[2] ?? '/tmp/portrait.png', fullPage: true })
console.log('erreurs :', erreurs.length ? erreurs : 'aucune')
await nav.close()
process.exit(appels.length || erreurs.length ? 1 : 0)
