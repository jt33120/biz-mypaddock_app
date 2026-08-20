// LA CHUTE — et surtout TOUT CE QUE LE PRODUIT REFUSE D'EN FAIRE.
//
// MyPaddock est né d'une chute causée par la recherche d'un geste. Cet essai
// existe moins pour vérifier que la saisie marche que pour vérifier qu'aucune
// des mécaniques interdites n'est apparue autour d'elle :
//
//   ① AUCUN COMPTEUR. Ni « 2 chutes cette saison », ni — surtout — « 14
//     roulages sans chute ». La série est la mécanique la plus tentante ici et
//     de très loin la pire : elle crée une pression à ne pas la rompre, donc à
//     NE PAS DÉCLARER. Un carnet qu'on n'ose pas remplir ne vaut rien.
//   ② AUCUN JUGEMENT : pas de gravité, pas de responsabilité, pas d'« évitable ».
//   ③ RIEN NE RÉCLAME : pas de bandeau, pas de question posée à chaque journée.
//   ④ RIEN N'EST OBLIGATOIRE : une chute sans un mot reste une chute consignée.
import { chromium } from 'playwright-core'
const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))
const pret = () => page.waitForFunction(
  () => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })

const manques = []
const verifier = (titre, vrai, detail = '') => {
  console.log(`${vrai ? '  ok ' : '  ÉCHEC '} ${titre}${detail ? ' — ' + detail : ''}`)
  if (!vrai) manques.push(titre)
}
const texte = async (sel) => (await page.textContent(sel)).replace(/\s+/g, ' ')

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

// Une journée avec un chrono, puis son bilan.
await page.click('text=Saisir mon premier roulage')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Pau-Arnos')
await page.click('text=Continuer')
await page.waitForSelector('.molettes', { timeout: 20_000 })
await page.click('text=Enregistrer la session')
await page.waitForFunction(() =>
  !!document.querySelector('section.recap .recap-image')
  || document.body.textContent.includes('Meilleur tour du jour'), null, { timeout: 40_000 })
if (await page.isVisible('section.recap')) await page.click('text=Retour au roulage')
await page.waitForSelector('text=Meilleur tour du jour', { timeout: 20_000 })
await page.waitForTimeout(700)

// ── ③ RIEN NE RÉCLAME ──────────────────────────────────────────────────────
const bilanAvant = await texte('.ecran')
verifier('③ aucune question posée sur la journée',
  !/as-tu chuté|avez-vous chuté|incident \?/i.test(bilanAvant))
verifier('   l\'entrée existe, discrète', await page.isVisible('text=J\'ai chuté ce jour-là'))

// ── ④ UNE CHUTE SANS UN MOT RESTE UNE CHUTE ────────────────────────────────
await page.click('text=J\'ai chuté ce jour-là')
await page.waitForSelector('.chute', { timeout: 15_000 })
await page.click('.chute .lien:has-text("Plus tard")')
await page.waitForTimeout(400)
verifier('④ consignée sans qu\'un champ soit obligatoire',
  (await texte('.chute')).includes('Une chute'), await texte('.chute'))

// Puis le récit, gardé MOT POUR MOT — même règle que le plan si-alors.
const RECIT = "j'ai voulu poser le genou côté faible, l'avant s'est dérobé — pas d'ego, on recommence"
await page.click('.chute .lien:has-text("Écrire ce qui")')
await page.fill('.chute .champ[placeholder="virage 3, l\'épingle…"]', 'Virage 3')
await page.fill('.chute textarea', RECIT)
await page.click('.chute .bouton:has-text("Garder")')
await page.waitForSelector('.chute:has-text("Virage 3")', { timeout: 15_000 })
const garde = await page.textContent('.chute .texte.faible')
verifier('   le récit est gardé mot pour mot', garde.trim() === RECIT, garde)

// ── ① AUCUN COMPTEUR, ② AUCUN JUGEMENT ─────────────────────────────────────
const bilan = await texte('.ecran')
const compteurs = [
  /\d+\s*chutes?\s*(cette|par|en)/i,      // « 2 chutes cette saison »
  /sans chute/i,                           // « 14 roulages sans chute » — LA pire
  /depuis (ta|la) derni[eè]re chute/i,
]
const trouves = compteurs.filter((r) => r.test(bilan))
verifier('① aucun compteur de chutes, aucune série « sans chute »',
  trouves.length === 0, trouves.map(String).join(' | '))

const jugements = ['gravité', 'grave', 'responsab', 'évitable', 'ta faute', 'imprudence']
const juges = jugements.filter((m) => bilan.toLowerCase().includes(m))
verifier('② aucun jugement porté sur la chute', juges.length === 0, juges.join(', '))

// Le bilan de saison est l'autre endroit où un compteur apparaîtrait « juste
// pour la statistique ». On l'y cherche aussi.
await page.click('nav.barre .onglet:has-text("ROULAGES")')
await page.waitForSelector('text=Saison', { timeout: 20_000 })
const saison = await texte('.ecran')
verifier('   ni dans le bilan de saison',
  !compteurs.some((r) => r.test(saison)) && !/chutes?/i.test(saison),
  saison.slice(0, 100))

await page.screenshot({ path: process.argv[2] ?? '/tmp/chute.png', fullPage: true })
verifier('aucune erreur de console', erreurs.length === 0, erreurs.join(' | '))
await nav.close()

if (manques.length) {
  console.error(`\n✗ ${manques.length} vérification(s) en échec :\n  · ${manques.join('\n  · ')}`)
  process.exit(1)
}
console.log('\n✓ la chute se consigne, et rien ne la compte')
