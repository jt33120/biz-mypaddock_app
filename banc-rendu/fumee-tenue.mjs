// LA TENUE DU JOUR — moto, casque et combinaison sur une journée de roulage.
//
// « on peut lier à la journée de roule 1) la moto quand il y en a plusieurs,
//   2) le casque 3) la combi » — Julian, 1er septembre 2026.
//
// Ce banc tient ce qu'aucun essai unitaire ne peut tenir : que le pilote puisse
// RÉELLEMENT dire ce qu'est une pièce, que le lien se pose et se REPRENNE au
// doigt, qu'il survive à un rechargement, et que le bloc ne fabrique nulle part
// un compteur de complétude — « 2 sur 3 » sur une tenue serait exactement le
// palier que ce produit refuse partout ailleurs.
//
// ⚠ IL EXISTE PARCE QUE LE LOT A FAILLI ÊTRE INERTE. La colonne `genre` a été
// posée, lue par la tenue, exigée par la fabrique de portraits — et ÉCRITE PAR
// PERSONNE. Tout compilait, 186 essais passaient, et le bloc ne se serait
// affiché sur aucun écran. C'est un banc, pas un essai unitaire, qui pouvait
// voir ça : il faut ouvrir l'écran pour constater qu'un geste n'existe pas.
import { chromium } from 'playwright-core'

const nav = await chromium.launch({
  executablePath: process.env.CHROME
    ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
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
const onglet = n => page.click(`nav.barre .onglet:has-text("${n}")`)

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

// ── LE DÉCOR : une moto, un casque, une combinaison ────────────────────────
await onglet('GARAGE')
await page.waitForSelector('.garage.vide')
await page.fill('.champ[placeholder="Honda"]', 'Yamaha')
await page.fill('.champ[placeholder="CBR 1000 RR"]', 'R6')
await page.fill('.champ[placeholder="2010"]', '2019')
await page.click('text=Déclarer ma moto')
await page.waitForSelector('.garage .modele', { timeout: 20_000 })

const declarerPiece = async (nom) => {
  await page.click('text=Déclarer une pièce')
  await page.fill('.champ[placeholder="Combinaison cuir"]', nom)
  await page.click('.bouton.secondaire:has-text("Déclarer")')
  await page.waitForSelector(`text=${nom}`, { timeout: 15_000 })
}
await page.click('.atelier-tete:has-text("Équipement")')
await declarerPiece('Casque Shoei X-SPR Pro')
await declarerPiece('Combinaison Ixon noire')

// ── ① DIRE CE QU'EST UNE PIÈCE, ET POUVOIR SE REPRENDRE ───────────────────
// C'est le geste qui manquait, et sans lui tout le reste est mort.
const ligneCasque = page.locator('.materiel:has-text("Casque Shoei X-SPR Pro")')
verifier('① une pièce de protection propose de dire ce qu\'elle est',
  await ligneCasque.locator('.puce:has-text("Casque")').count() === 1)

for (const largeur of [375, 390, 430]) {
  await page.setViewportSize({ width: largeur, height: 844 })
  const c = await ligneCasque.locator('.puce:has-text("Casque")').boundingBox()
  verifier(`   cible tactile à ${largeur}px`, !!c && c.height >= 44,
    c ? `${Math.round(c.width)}×${Math.round(c.height)}` : 'absente')
}
await page.setViewportSize({ width: 390, height: 844 })

await ligneCasque.locator('.puce:has-text("Casque")').click()
await page.waitForFunction(() => !!document.querySelector(
  '.materiel .puce[data-actif="1"]'), null, { timeout: 15_000 })
verifier('   le genre se pose et se voit',
  await ligneCasque.locator('.puce[data-actif="1"]:has-text("Casque")').count() === 1)

// ⚠ LE MÊME TAP DÉLIE. Une pièce mal qualifiée doit pouvoir cesser de l'être
// sans qu'on la supprime — la supprimer coûterait la dépense qu'elle porte.
await ligneCasque.locator('.puce[data-actif="1"]:has-text("Casque")').click()
await page.waitForFunction(() => !document.querySelector(
  '.materiel .puce[data-actif="1"]'), null, { timeout: 15_000 })
verifier('   taper la puce active REPREND le genre, elle ne le repose pas',
  await ligneCasque.locator('.puce[data-actif="1"]').count() === 0)

await ligneCasque.locator('.puce:has-text("Casque")').click()
await page.waitForSelector('.materiel .puce[data-actif="1"]', { timeout: 15_000 })
const ligneCombi = page.locator('.materiel:has-text("Combinaison Ixon noire")')
await ligneCombi.locator('.puce:has-text("Combinaison")').click()
await page.waitForFunction(() => document.querySelectorAll(
  '.materiel .puce[data-actif="1"]').length === 2, null, { timeout: 15_000 })
verifier('   une glacière ne se voit jamais proposer un genre',
  (await page.locator('.materiel .puces').count()) === 2,
  `${await page.locator('.materiel .puces').count()} pièces qualifiables`)

// ── LA JOURNÉE ────────────────────────────────────────────────────────────
await onglet('ACCUEIL')
await page.click('text=Saisir mon premier roulage')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Nogaro')
await page.click('text=Continuer')
await page.waitForSelector('.molettes', { timeout: 20_000 })
await page.click('text=Enregistrer la session')
await page.waitForFunction(() =>
  !!document.querySelector('section.recap .recap-image')
  || document.body.textContent.includes('Meilleur tour du jour'), null, { timeout: 40_000 })
if (await page.isVisible('section.recap')) await page.click('text=Retour au roulage')
await page.waitForSelector('.tenue', { timeout: 20_000 })

// ── ② LE BLOC EXISTE, ET IL NE COMPTE RIEN ────────────────────────────────
verifier('② la tenue du jour a sa place sur la journée', await page.isVisible('.tenue'))
const tenue0 = await texte('.tenue')
// La clause la plus importante du bloc, et elle vaut pour tout le produit :
// « 2 sur 3 » sur une tenue serait le palier refusé partout ailleurs (FR-31).
verifier('   aucun compteur, aucune complétude, aucun palier',
  !/\d\s*\/\s*3|\d\s+sur\s+3|complet|complète|progress|palier|niveau|score/i.test(tenue0),
  tenue0.slice(0, 160))
verifier('   une absence se dit en toutes lettres, jamais par un trou',
  /rien de déclaré|pas de portrait/i.test(tenue0), tenue0.slice(0, 200))

// ── ③ LIER, ET QUE ÇA TIENNE ──────────────────────────────────────────────
await page.locator('.tenue .puce:has-text("Casque Shoei")').first().click()
await page.waitForFunction(() => !!document.querySelector(
  '.tenue .puce[data-actif="1"]'), null, { timeout: 15_000 })
verifier('③ le casque se pose sur la journée', await page.isVisible('.tenue .puce[data-actif="1"]'))

await page.reload({ waitUntil: 'networkidle' }); await pret()
await onglet('ROULAGES')
await page.click('.glissable:has-text("Nogaro")')
await page.waitForSelector('.tenue', { timeout: 20_000 })
verifier('   et il est toujours là après un rechargement',
  await page.isVisible('.tenue .puce[data-actif="1"]'), await texte('.tenue'))

// ── ④ RIEN N'EST POSÉ D'OFFICE ────────────────────────────────────────────
// Un casque lié tout seul affirmerait un fait que personne n'a saisi. Une seule
// combinaison au garage ne suffit pas à décider qu'on la portait.
const tenue1 = await texte('.tenue')
verifier('④ la combinaison reste non déclarée tant que personne ne l\'a dite',
  await page.locator('.tenue .puce[data-actif="1"]').count() === 1,
  `${await page.locator('.tenue .puce[data-actif="1"]').count()} pièce(s) liée(s)`)
verifier('   et le bloc le DIT au lieu de laisser un vide',
  /rien de déclaré/i.test(tenue1), tenue1.slice(0, 200))

// ── ⑤ AUCUN DÉBORDEMENT, AUX TROIS LARGEURS ───────────────────────────────
for (const largeur of [375, 390, 430]) {
  await page.setViewportSize({ width: largeur, height: 844 })
  const deborde = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
  verifier(`⑤ aucun débordement horizontal à ${largeur}px`, !deborde)
}
await page.setViewportSize({ width: 390, height: 844 })

verifier('   aucune erreur de console', erreurs.length === 0, erreurs.slice(0, 3).join(' | '))

await nav.close()
if (manques.length) {
  console.error(`\n${manques.length} manque(s) : ${manques.join(', ')}`)
  process.exit(1)
}
console.log('\n✓ la tenue se déclare, se reprend, et ne compte rien')
