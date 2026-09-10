// LA VIDÉO DU CRASH — récit 23.10, la pièce que le lot 23 avait reportée.
//
// Ce banc tient les clauses qu'aucun essai unitaire ne peut tenir : que le
// pilote VOIT sa place avant d'agir, que la vidéo se regarde réellement dans le
// dossier, que son retrait demande deux temps comme celui d'une photo, et que
// tout cela reste atteignable au doigt sur les trois largeurs de téléphone.
//
// ⚠ CE QU'IL NE PROUVE PAS, ET QUE RIEN ICI NE PEUT PROUVER : le MOV/HEVC d'un
// iPhone réel, hors ligne puis au retour du réseau. C'est le spike de l'histoire
// 23.10 et il se fait sur l'appareil, pas sur un banc de bureau. La fixture est
// fabriquée par le navigateur du banc, donc dans le format que CE navigateur
// sait produire — la faire passer pour une vidéo d'iPhone serait exactement le
// genre de banc qui rassure à tort.
import { chromium } from 'playwright-core'
import { videoDEssai } from './video-essai.mjs'

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

const FIXTURE = await videoDEssai()

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

// Le décor minimal : une moto, une journée, un crash documenté.
await onglet('GARAGE')
await page.waitForSelector('.garage.vide')
await page.fill('.champ[placeholder="Honda"]', 'Yamaha')
await page.fill('.champ[placeholder="CBR 1000 RR"]', 'R6')
await page.fill('.champ[placeholder="2010"]', '2019')
await page.click('text=Déclarer ma moto')
await page.waitForSelector('.garage .modele', { timeout: 20_000 })

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
await page.waitForSelector('.dossier-crash', { timeout: 20_000 })
await page.click('.dossier-crash .lien:has-text("Documenter un crash")')
await page.waitForSelector('.chute', { timeout: 15_000 })
await page.click('.chute .lien:has-text("Fermer la saisie")')

// ── ① LA PLACE SE DIT AVANT LE GESTE ──────────────────────────────────────
// « Explicite » ne veut pas dire « appliqué » mais « connu avant d'agir ». Un
// pilote qui découvre la limite en la heurtant a déjà attendu sa compression
// pour rien — et la compression prend le temps du clip.
//
// ⚠ ON ATTEND CETTE LIGNE, ON NE LA CONSTATE PAS. Juste après l'écriture d'une
// session, les lectures de la base passent derrière un travail lourd et mettent
// plusieurs secondes à rendre. Un banc qui affirme à l'instant du clic mesure sa
// propre impatience et accuse le produit d'un défaut qui n'existe pas — c'est
// exactement ce que celui-ci a fait à sa première écriture.
await page.waitForFunction(
  () => document.querySelector('.dossier-crash')?.textContent.includes('secondes au plus'),
  null, { timeout: 60_000 })
const dossier = await texte('.dossier-crash')
verifier('① le quota vidéo est annoncé avant tout versement',
  /Vidéo\s*:/.test(dossier) && /Mo/.test(dossier),
  dossier.match(/Vidéo\s*:[^.]*\./)?.[0] ?? 'absent')
verifier('   un carnet vide ne facture aucune place',
  /aucune pour l’instant/.test(dossier), dossier.match(/Vidéo\s*:[^.]*\./)?.[0] ?? '')
verifier('   la durée maximale est dite, pas découverte',
  /secondes au plus/.test(dossier))

// ── ② LA CIBLE TACTILE, AUX TROIS LARGEURS ────────────────────────────────
for (const largeur of [375, 390, 430]) {
  await page.setViewportSize({ width: largeur, height: 844 })
  const cible = await page.locator('button.ajout-video-crash').boundingBox()
  verifier(`② ajout vidéo · cible tactile à ${largeur}px`,
    !!cible && cible.width >= 44 && cible.height >= 44,
    cible ? `${Math.round(cible.width)}×${Math.round(cible.height)}` : 'absente')
}
await page.setViewportSize({ width: 390, height: 844 })

const ajout = page.locator('button.ajout-video-crash')
await ajout.focus()
verifier('   ajout vidéo est focusable au clavier',
  await ajout.evaluate((n) => document.activeElement === n))

// ── ③ LA VIDÉO S'ATTACHE ET SE REGARDE ────────────────────────────────────
const choix = page.waitForEvent('filechooser')
await ajout.press('Enter')
await (await choix).setFiles(FIXTURE)
// La compression rejoue le clip en temps réel : l'attente est le comportement
// nominal, pas un blocage. Le banc lui laisse donc de la marge.
await page.waitForSelector('.case-video-crash video', { timeout: 90_000 })
verifier('③ une vidéo est attachée au dossier de crash',
  await page.isVisible('.case-video-crash video'))
verifier('   elle porte une source lisible, pas une case vide',
  !!(await page.getAttribute('.case-video-crash video', 'src')))

// Le débordement horizontal est le défaut le plus banal d'un média dans une
// colonne étroite, et le plus visible : la page entière se met à glisser.
for (const largeur of [375, 390, 430]) {
  await page.setViewportSize({ width: largeur, height: 844 })
  const deborde = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
  verifier(`   aucun débordement horizontal à ${largeur}px`, !deborde)
}
await page.setViewportSize({ width: 390, height: 844 })

await page.waitForFunction(
  () => !document.querySelector('.dossier-crash')?.textContent.includes('aucune pour l’instant'),
  null, { timeout: 60_000 })
const apresAjout = await texte('.dossier-crash')
verifier('   la place consommée est recomptée après le versement',
  /Vidéo\s*:\s*\d/.test(apresAjout), apresAjout.match(/Vidéo\s*:[^.]*\./)?.[0] ?? 'absent')

// ── ④ LA VIDÉO SURVIT À UN RECHARGEMENT ───────────────────────────────────
// Une pièce qui disparaît au rechargement n'est pas durable : c'est la clause
// même qui a fait reporter cette fonctionnalité hors du lot 23.
await page.reload({ waitUntil: 'networkidle' }); await pret()
await onglet('ROULAGES')
await page.click('.glissable:has-text("Nogaro")')
await page.waitForSelector('.case-video-crash video', { timeout: 30_000 })
verifier('④ la vidéo est toujours là après un rechargement',
  await page.isVisible('.case-video-crash video'))

// ── ⑤ LE RETRAIT DEMANDE DEUX TEMPS ───────────────────────────────────────
// Une vidéo de crash ne se retape ni ne se refilme. Elle entre donc dans le
// groupe des gestes rouges à confirmation, comme la photo de crash.
for (const largeur of [375, 390, 430]) {
  await page.setViewportSize({ width: largeur, height: 844 })
  const cible = await page.locator('.case-video-crash > .lien.destructif').boundingBox()
  verifier(`⑤ retrait vidéo · cible tactile à ${largeur}px`,
    !!cible && cible.width >= 44 && cible.height >= 44,
    cible ? `${Math.round(cible.width)}×${Math.round(cible.height)}` : 'absente')
}
await page.setViewportSize({ width: 390, height: 844 })

await page.click('.case-video-crash > .lien.destructif')
await page.waitForSelector('.confirmation-photo-crash', { timeout: 15_000 })
const confirmation = await texte('.case-video-crash')
verifier('   la confirmation dit ce qui part, et où',
  /copies locale et distante/.test(confirmation), confirmation.slice(0, 120))

// Le sortant referme sans rien détruire — c'est la moitié de la garde.
await page.click('.confirmation-photo-crash .lien:has-text("Garder la vidéo")')
await page.waitForSelector('.confirmation-photo-crash', { state: 'detached', timeout: 15_000 })
verifier('   « Garder la vidéo » referme sans rien détruire',
  await page.isVisible('.case-video-crash video'))

await page.click('.case-video-crash > .lien.destructif')
await page.click('.confirmation-photo-crash .lien.destructif:has-text("Retirer la vidéo")')
await page.waitForSelector('.case-video-crash', { state: 'detached', timeout: 30_000 })
verifier('   le retrait confirmé fait disparaître la vidéo',
  !(await page.isVisible('.case-video-crash')))
const apresRetrait = await texte('.dossier-crash')
verifier('   le retrait est annoncé en toutes lettres (UX-DR8)',
  /Retrait enregistré|Vidéo retirée/.test(apresRetrait),
  apresRetrait.match(/(Retrait enregistré|Vidéo retirée)[^.]*\./)?.[0] ?? 'muet')

// ── ⑥ AUCUN SCORE, AUCUN JUGEMENT ─────────────────────────────────────────
// La clause la plus importante du schéma entier vaut aussi pour la vidéo :
// le produit est né d'une chute et n'a pas le droit d'en faire un score.
verifier('⑥ la vidéo n’introduit ni gravité, ni série, ni jugement',
  !/gravité|responsab|évitable|sans crash depuis|série/i.test(await texte('.dossier-crash')))

verifier('   aucune erreur de console', erreurs.length === 0, erreurs.join(' | '))

await nav.close()
if (manques.length) {
  console.error(`\n${manques.length} manque(s) : ${manques.join(', ')}`)
  process.exit(1)
}
console.log('\nfumée vidéo : verte')
