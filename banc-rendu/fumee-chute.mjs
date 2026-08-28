// LE DOSSIER DE CRASH — statut explicite, récit, photo et réparation liée.
//
// Un statut inconnu ne devient jamais « aucun crash » par défaut. Une chute
// reste un fait auto-déclaré, jamais un score : le banc vérifie le dossier d'une
// journée et refuse toujours les séries ou jugements saisonniers.
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
const onglet = n => page.click(`nav.barre .onglet:has-text("${n}")`)

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

// Une moto réelle permet de vérifier que la réparation entre dans le carnet ET
// dans le budget par une seule dépense.
await onglet('GARAGE')
await page.waitForSelector('.garage.vide')
await page.fill('.champ[placeholder="Honda"]', 'Yamaha')
await page.fill('.champ[placeholder="CBR 1000 RR"]', 'R6')
await page.fill('.champ[placeholder="2010"]', '2019')
await page.click('text=Déclarer ma moto')
await page.waitForSelector('.garage .modele', { timeout: 20_000 })

// Une journée avec un chrono, puis son bilan.
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
await page.waitForSelector('text=Meilleur tour du jour', { timeout: 20_000 })
await page.waitForSelector('.dossier-crash', { timeout: 20_000 })

// ── TRI-ÉTAT : INCONNU N'EST PAS « AUCUN » ───────────────────────────────
verifier('① un roulage neuf reste à renseigner',
  (await texte('.dossier-crash')).includes('À renseigner'), await texte('.dossier-crash'))
verifier('   aucune question ni jugement',
  !/as-tu|avez-vous|gravité|responsab|évitable/i.test(await texte('.dossier-crash')))

await page.click('.dossier-crash .lien:has-text("Déclarer aucun crash")')
await page.waitForFunction(() => document.querySelector('.dossier-crash')?.textContent.includes('Aucun crash'))
await page.reload({ waitUntil: 'networkidle' }); await pret()
await onglet('ROULAGES')
await page.click('.glissable:has-text("Nogaro")')
await page.waitForFunction(() => document.querySelector('.dossier-crash')?.textContent.includes('Aucun crash'))
verifier('② « aucun crash » est une déclaration persistée',
  (await texte('.dossier-crash')).includes('Aucun crash'), await texte('.dossier-crash'))

// Documenter un crash corrige cette déclaration et ouvre un récit facultatif.
await page.click('.dossier-crash .lien:has-text("Documenter un crash")')
await page.waitForSelector('.chute', { timeout: 15_000 })
await page.click('.chute .lien:has-text("Fermer la saisie")')
verifier('③ un crash vide reste documenté',
  (await texte('.dossier-crash')).includes('Crash documenté'), await texte('.dossier-crash'))

const RECIT = "j'ai voulu poser le genou côté faible, l'avant s'est dérobé — pas d'ego, on recommence"
await page.click('.chute .lien:has-text("Modifier le crash")')
await page.fill('.chute input[placeholder="Virage 3, épingle…"]', 'Virage 3')
await page.fill('.chute textarea', RECIT)
await page.click('.chute .bouton:has-text("Enregistrer le crash")')
await page.waitForSelector('.chute:has-text("Virage 3")', { timeout: 15_000 })
verifier('   le récit reste mot pour mot',
  (await page.textContent('.chute .texte.faible')).trim() === RECIT)

// Photo liée à la chute. La VIDÉO du crash a son propre banc depuis le récit
// 23.10 — `fumee-video.mjs` — parce que son versement reprenable, son quota et
// sa compression n'ont rien de commun avec un cliché.
for (const largeur of [375, 390, 430]) {
  await page.setViewportSize({ width: largeur, height: 844 })
  const cible = await page.locator('button.ajout-photo-crash').boundingBox()
  verifier(`   ajout photo · cible tactile à ${largeur}px`,
    !!cible && cible.width >= 44 && cible.height >= 44,
    cible ? `${Math.round(cible.width)}×${Math.round(cible.height)}` : 'absente')
}
await page.setViewportSize({ width: 390, height: 844 })
const ajoutPhoto = page.locator('button.ajout-photo-crash')
await ajoutPhoto.focus()
verifier('   ajout photo est focusable au clavier',
  await ajoutPhoto.evaluate((n) => document.activeElement === n))
const choixPhoto = page.waitForEvent('filechooser')
await ajoutPhoto.press('Enter')
await (await choixPhoto).setFiles('banc-rendu/.fixtures/grande.jpg')
await page.waitForSelector('.case-photo-crash img', { timeout: 30_000 })
verifier('④ une photo est attachée au dossier', await page.isVisible('.case-photo-crash img'))
for (const largeur of [375, 390, 430]) {
  await page.setViewportSize({ width: largeur, height: 844 })
  const cible = await page.locator('.case-photo-crash > .lien.destructif').boundingBox()
  verifier(`   retrait photo · cible tactile à ${largeur}px`,
    !!cible && cible.width >= 44 && cible.height >= 44,
    cible ? `${Math.round(cible.width)}×${Math.round(cible.height)}` : 'absente')
}
await page.setViewportSize({ width: 390, height: 844 })
const retraitPhoto = page.locator('.case-photo-crash > .lien.destructif')
await retraitPhoto.focus()
await retraitPhoto.press('Enter')
await page.waitForSelector('.confirmation-photo-crash')
const promesseSuppression = await texte('.confirmation-photo-crash')
verifier('   la suppression annonce exactement le retrait repris en ligne',
  promesseSuppression.includes('disparaît du carnet maintenant')
    && promesseSuppression.includes('dès le retour du réseau')
    && !promesseSuppression.includes('définitivement'),
  promesseSuppression)
const ciblesConfirmation = await page.$$eval('.confirmation-photo-crash button', (boutons) =>
  boutons.map((b) => ({ largeur: b.getBoundingClientRect().width, hauteur: b.getBoundingClientRect().height })))
verifier('   confirmation photo garde des cibles de 44px',
  ciblesConfirmation.length === 2
    && ciblesConfirmation.every((c) => c.largeur >= 44 && c.hauteur >= 44),
  JSON.stringify(ciblesConfirmation))
await page.locator('.confirmation-photo-crash .lien:has-text("Garder la photo")').press('Enter')

// La réparation crée une intervention et UNE dépense qui est aussi celle que le
// budget additionne. Aucun montant jumeau n'est fabriqué à côté.
await page.click('.chute .lien:has-text("Ajouter une réparation")')
await page.fill('.formulaire-reparation-crash input[inputmode="decimal"]', '123,45')
await page.fill('.formulaire-reparation-crash input[placeholder="Levier, carénage…"]', 'Levier droit')
verifier('   la catégorie Atelier est un choix explicite',
  await page.locator('.categories-reparation-crash .puce').count() === 3
    && await page.isDisabled('.formulaire-reparation-crash .bouton:has-text("Enregistrer la réparation")'))
await page.click('.categories-reparation-crash .puce:has-text("BRICOLE")')
await page.click('.formulaire-reparation-crash .bouton:has-text("Enregistrer la réparation")')
await page.waitForFunction(() => document.querySelector('.chute')?.textContent.includes('123,45'))
await page.waitForFunction(() =>
  [...document.querySelectorAll('.bloc')].some((n) =>
    n.textContent?.includes('Ce que la journée a coûté') && n.textContent.includes('123,45 €')),
null, { timeout: 20_000 })
const coutJournee = await texte('.bloc:has-text("Ce que la journée a coûté")')
verifier('   la journée reçoit aussi la réparation une seule fois',
  coutJournee.includes('123,45 €') && !coutJournee.includes('246,90 €'), coutJournee)
await onglet('GARAGE')
await page.waitForSelector('.atelier.budget .atelier-tete', { timeout: 20_000 })
await page.waitForFunction(() =>
  document.querySelector('.atelier.budget .atelier-tete')?.textContent.includes('123,45 €'),
null, { timeout: 20_000 })
const budget = await texte('.atelier.budget .atelier-tete')
verifier('⑤ le budget reçoit la dépense une seule fois',
  budget.includes('123,45 €') && !budget.includes('246,90 €'), budget)
await page.click('button.atelier:has-text("Bricoles")')
await page.waitForSelector('.poste-page:has-text("Levier droit")', { timeout: 20_000 })
const atelier = await texte('.poste-page')
verifier('   la réparation liée existe aussi dans l’Atelier',
  atelier.includes('Levier droit') && (atelier.match(/123,45/g) ?? []).length >= 1,
  atelier.slice(0, 180))

// Le statut, les liens et le marqueur survivent à un vrai rechargement.
await page.reload({ waitUntil: 'networkidle' }); await pret()
await onglet('ROULAGES')
await page.waitForSelector('.glissable:has-text("Nogaro")', { timeout: 20_000 })
const carte = await texte('.ligne-glissante:has-text("Nogaro")')
verifier('⑥ la carte montre l’icône custom et le mot Crash',
  carte.includes('Crash') && await page.isVisible('.ligne-glissante:has-text("Nogaro") .marqueur-crash svg'), carte)
const nomAccessibleCarte = await page.locator('.ligne-glissante:has-text("Nogaro") .glissable')
  .getAttribute('aria-label')
verifier('   le nom accessible conserve circuit, date, chrono et crash',
  !!nomAccessibleCarte && nomAccessibleCarte.includes('Nogaro')
    && /\d{4}-\d{2}-\d{2}/.test(nomAccessibleCarte)
    && nomAccessibleCarte.includes('chrono') && nomAccessibleCarte.includes('Crash documenté'),
  nomAccessibleCarte ?? 'absent')
await page.click('.glissable:has-text("Nogaro")')
await page.waitForSelector('.chute:has-text("Virage 3")', { timeout: 20_000 })
verifier('   récit, réparation et photo sont relus',
  (await texte('.chute')).includes('Levier droit')
    && (await texte('.chute')).includes('123,45')
    && await page.isVisible('.case-photo-crash img'))

// Plusieurs chutes restent possibles ; la carte affiche le pluriel sans créer
// une statistique de saison.
await page.click('.dossier-crash .lien:has-text("Documenter un autre crash")')
await page.waitForFunction(() => document.querySelectorAll('.chute').length === 2)
await page.click('.chute:last-of-type .lien:has-text("Fermer la saisie")')
await onglet('ROULAGES')
await page.waitForSelector('.ligne-glissante:has-text("Nogaro") .marqueur-crash')
verifier('⑦ plusieurs crashs restent visibles',
  (await texte('.ligne-glissante:has-text("Nogaro")')).includes('2 crashs'))
const saison = await texte('.saison')
verifier('   aucun score ou série de crash dans le bilan de saison',
  !/\d+\s*crashs?\s*(cette|par|en)|sans crash|depuis .*dernier crash/i.test(saison),
  saison.slice(0, 120))

await page.screenshot({ path: process.argv[2] ?? '/tmp/chute.png', fullPage: true })
verifier('aucune erreur de console', erreurs.length === 0, erreurs.join(' | '))
await nav.close()

if (manques.length) {
  console.error(`\n✗ ${manques.length} vérification(s) en échec :\n  · ${manques.join('\n  · ')}`)
  process.exit(1)
}
console.log('\n✓ le dossier de crash est explicite, lié et sans score')
