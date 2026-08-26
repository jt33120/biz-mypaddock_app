// LE ROULAGE À VENIR — épique 17, récits 17.1 et 17.2.
//
// Cet essai suit LE GESTE RÉEL DE JULIAN, dans son ordre : « je veux saisir ma
// journée du 12 septembre à Pau-Arnos, sans organisateur, et qu'un tap dessus
// ouvre ce qui la prépare ».
//
// ⚠ CE N'EST PAS UNE FONCTIONNALITÉ QUI MANQUAIT, C'EST UN CHEMIN QUI MENTAIT.
// Les quatre morceaux existaient : la date future s'accepte, l'accueil sait dire
// « Prochain roulage · dans N jours », « Avant d'y aller » se dérive, le
// chargement est livré. Et pourtant :
//
//   · après validation, l'application enchaînait sur « Meilleur tour de la
//     session » — elle demandait le chrono d'une journée qui n'a pas eu lieu ;
//   · le tap sur le bloc de l'accueil ouvrait le BILAN : « Meilleur tour du
//     jour — », « Sessions 0 », le bloc des chutes, et « Saisir une session »
//     en bouton primaire pleine largeur ;
//   · l'accueil comptait « 6 roulages » pour 5 vécus, et le bilan de saison
//     annonçait la journée « sans chrono » — un trou qui n'en est pas un.
//
// ⚠ ET IL VÉRIFIE AUSSI CE QUI NE DOIT PAS SE FERMER. « On change ce qui est
// PROPOSÉ EN PREMIER, on ne ferme aucune porte » : le chemin vers la saisie
// d'une session existe encore sur l'écran de la journée, et la journée à venir
// reste dans la liste des roulages, où elle se corrige et se retire.
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

// ⚠ LES DATES SONT RELATIVES, JAMAIS ÉCRITES. Un « 2026-09-12 » en dur fait un
// essai qui passe au vert le 11 septembre et rouge le 13 — c'est-à-dire un
// essai qui ment sur ce qu'il éprouve, ce qui est pire qu'un essai absent.
const jour = (d) => { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10) }

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

// ── LA SAISON DE JULIAN : quatre journées vécues, avec leurs chronos.
await onglet('GARAGE')
await page.click('text=Reprendre la CBR 83')
await page.waitForSelector('.garage-titre', { timeout: 20_000 })
await page.click('text=Reprendre la saison 2026 · Pau-Arnos')
await page.waitForTimeout(1500)

// Ce que le garage compte AVANT la journée annoncée. La saison de démonstration
// sème elle-même un roulage futur : on part donc du nombre observé, et c'est ce
// nombre qui ne doit pas bouger.
// ⚠ LE CHIFFRE SE LIT DANS LE DOM, PAS DANS LE TEXTE APLATI. L'étiquette et sa
// valeur sont deux nœuds collés — « roulages4 » une fois les espaces réduits —
// et une expression régulière sur ce texte-là rend `NaN` sans que rien ne
// paraisse faux. Un essai qui compare `NaN` à `NaN` est un essai muet.
const compterRoulages = () => page.$$eval('.garage .chiffres > div', (l) => {
  const d = l.find((x) => x.querySelector('.et')?.textContent.trim() === 'roulages')
  return d ? Number(d.querySelector('.va').textContent.trim()) : NaN
})
await page.waitForSelector('.garage .chiffres', { timeout: 20_000 })
const roulagesAvant = await compterRoulages()
verifier('le garage compte quelque chose avant', Number.isFinite(roulagesAvant),
  `${roulagesAvant} roulage(s)`)

// ── ① SAISIR UNE JOURNÉE À VENIR NE DEMANDE PAS DE CHRONO.
await onglet('ACCUEIL')
await page.click('text=Saisir un roulage')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Pau-Arnos')
await page.fill('input[type=date]', jour(18))
await page.click('text=Continuer')
// ⚠ ON ATTEND L'UN **OU** L'AUTRE, JAMAIS SEULEMENT CE QU'ON ESPÈRE. Un
// `waitForSelector('.journee-page')` seul fait mourir l'essai sur un Timeout de
// Playwright quand le défaut est présent : il échoue bien, mais en cachant les
// vingt vérifications suivantes derrière une trace de pile. Un banc doit dire CE
// QUI ne va pas, pas seulement tomber — la même clause que `fumee-preparation`.
await page.waitForFunction(
  () => !!document.querySelector('.journee-page') || !!document.querySelector('.molettes'),
  null, { timeout: 30_000 })
const prepare = await page.isVisible('.journee-page')

verifier('① la validation n\'ouvre PAS les molettes du chrono',
  prepare && !await page.isVisible('.molettes'),
  prepare ? '' : 'elle a ouvert « Meilleur tour de la session »')

// ⚠ ON ATTEND LE CONTENU, PAS L'ÉLÉMENT — même classe de défaut que la course
// de `fumee-coffre`, corrigée hier. `.journee-page` PARAÎT avant que ses deux
// listes aient répondu : la capture qui suivait immédiatement l'apparition du
// sélecteur ne tenait que l'état d'attente de la préparation, à chaque
// exécution, et toutes les vérifications par la négative écrites plus bas
// portaient donc sur une page encore vide. Elles ne pouvaient plus rougir — et
// une garde qu'on croit tenue et qui ne tient pas est pire qu'une garde absente.
//
// La condition n'est pas « l'élément existe » mais « la liste a répondu » :
// `data-etat` porte, dans le DOM, la distinction que l'écran fait entre « je ne
// sais pas encore » et « il n'y a rien » (src/ecrans/Preparation.tsx).
//
// ⚠ ET CE N'EST PAS CETTE ATTENTE QUI GARDE `data-etat`, ÉPROUVÉ : en remettant
// l'affirmation trop tôt — les deux sorties marquées « su » — le banc est resté
// VERT trois fois sur trois, parce que la seconde moitié de la condition, le
// bloc du chargement, laisse à la requête le temps de répondre. Ce qui garde
// cette moitié-là est l'essai unitaire « la préparation ne dit pas “rien” avant
// de savoir ». Ce que l'attente garde, elle, est éprouvé plus bas.
if (prepare) await page.waitForFunction(() => {
  const p = document.querySelector('.journee-page .preparation')
  const c = document.querySelector('.journee-page .checklist, .journee-page .chargement-vide')
  return !!p && p.getAttribute('data-etat') === 'su' && !!c
}, null, { timeout: 30_000 })

const fiche = await texte(prepare ? '.journee-page' : '.ecran')
verifier('   ni « Meilleur tour de la session »',
  !fiche.includes('Meilleur tour de la session'), fiche.slice(0, 120))
verifier('   l\'écran nomme la journée', fiche.includes('Pau-Arnos'), fiche.slice(0, 120))
verifier('   et il dit QUAND, sans échéance',
  /dans \d+ jours/.test(fiche) && !/reste|plus que|encore/i.test(fiche), fiche.slice(0, 160))
// ⚠ CELLE-CI DONNE DES DENTS À L'ATTENTE CI-DESSUS, et c'est sa seule raison
// d'être. « L'engagement » est dérivé d'une requête : sur une journée neuve
// aucune dépense d'engagement n'est saisie, donc la ligne EXISTE toujours — et
// elle n'arrive qu'après la réponse. ÉPROUVÉ : en remettant la capture juste
// après l'apparition du sélecteur, elle rougit trois fois sur trois. Sans elle,
// les quatre vérifications qui lisent `fiche` ne prouvaient plus rien.
verifier('   la préparation a RÉPONDU avant qu\'on lise la page',
  fiche.includes("L'engagement"), fiche.slice(0, 200))

// ── ② IL PORTE CE QUI PRÉPARE — les deux listes, réunies et non mélangées.
verifier('② « Avant d\'y aller » est là', await page.isVisible('.journee-page .preparation'))
verifier('   et le chargement aussi',
  await page.isVisible('text=Préparer le chargement')
  || await page.isVisible('.journee-page .checklist'))
verifier('   son bouton primaire ajoute une chose à faire',
  await page.isVisible('.journee-page .ajout-tache .bouton:not(.secondaire)'))

// ── ③ AUCUN POST-MORTEM CHRONOMÉTRIQUE. C'est une absence : elle se vérifie
//    par la négative. Ce qui est visé, ce sont les mots du BILAN — le meilleur
//    tour, le compte de sessions, la chute réclamée — jamais les gestes du jour.
for (const mot of ['Meilleur tour du jour', 'Sessions', 'Déclarer une chute']) {
  verifier(`③ aucun « ${mot} »`, !fiche.includes(mot))
}
verifier('   aucun compteur de progression',
  !/\d+\s*(sur|\/)\s*\d+/.test(fiche), fiche.slice(0, 160))

// ── ④ RIEN N'EST FERMÉ — ET C'EST LA MOITIÉ QUI MANQUAIT.
//
// « On change ce qui est PROPOSÉ EN PREMIER, on ne ferme aucune porte » : le
// banc ne vérifiait que la première moitié. Sur une journée datée du JOUR MÊME
// c'est cet écran-ci qui s'ouvre — le pilote est au paddock — et il retirait en
// silence six chemins que le bilan portait. Ce sont exactement les gestes du
// jour même : on photographie, on déclare, on chute, on paie.
//
// ⚠ « Voir le récapitulatif » VIENT DE SORTIR DE LA LISTE DES ABSENCES
// CI-DESSUS. Il y figurait, et c'était une erreur de conception recopiée dans
// le banc : un récapitulatif se compose de ce qui existe, et une journée sans
// chrono a ses photos et ses gestes à montrer.
verifier('④ « Saisir une session » reste atteignable',
  await page.isVisible('.journee-page .lien:has-text("Saisir une session")'))
for (const [quoi, ou] of [
  ['les photos', '.journee-page .grille-album, .journee-page label.bouton:has-text("Ajouter des photos")'],
  ['« Déclarer un geste »', '.journee-page .lien:has-text("Déclarer un geste")'],
  ['« J\'ai chuté ce jour-là »', '.journee-page .lien:has-text("chuté ce jour-là")'],
  ['ce que la journée a coûté', '.journee-page .libelle:has-text("Ce que la journée a coûté")'],
  ['« Ajouter une dépense »', '.journee-page :has-text("Ajouter une dépense")'],
  ['« Voir le récapitulatif »', '.journee-page .bouton:has-text("Voir le récapitulatif")'],
  ['l\'interrupteur de visibilité', '.journee-page .lien:has-text("ton chrono de ce jour")'],
]) {
  verifier(`   ${quoi} · la porte est ouverte`, await page.isVisible(ou))
}

// ── ⑤ ELLE EST À L'ACCUEIL, ET LE TAP OUVRE CE QUI LA PRÉPARE.
await onglet('ACCUEIL')
await page.waitForSelector('.bloc:has-text("Prochain roulage")', { timeout: 20_000 })
const accueil = await texte('.ecran')
verifier('⑤ elle prend la tête de l\'accueil',
  accueil.includes('Prochain roulage') && /dans \d+ jours/.test(accueil), accueil.slice(0, 140))

await page.click('.bloc:has-text("Prochain roulage")')
await page.waitForTimeout(900)
verifier('   le tap ouvre la préparation, pas le bilan',
  await page.isVisible('.journee-page') && !await page.isVisible('text=Meilleur tour du jour'))

// ── ⑥ ET LE MÊME TAP DEPUIS LA LISTE DES ROULAGES. Deux chemins vers la même
//    journée ne peuvent pas ouvrir deux écrans différents.
await onglet('ROULAGES')
await page.waitForSelector('.pile > .bloc', { timeout: 20_000 })
const liste = await texte('.ecran')
verifier('⑥ la journée à venir RESTE dans la liste — elle est saisie, elle compte',
  liste.includes(jour(18)), liste.slice(0, 200))
// ⚠ ON VISE LA JOURNÉE QU'ON VIENT DE SAISIR, PAS LE PREMIER BLOC. `nth=0`
// tapait sur le roulage semé par la démonstration — septembre, Pau-Arnos lui
// aussi — et la vérification passait donc quel que soit le résultat : elle
// ouvrait une autre journée à venir, qui ouvre le même écran pour d'autres
// raisons. La date est le seul trait qui sépare les deux, et c'est elle qu'on
// vise ; la vérification lit ensuite l'écart, qui n'appartient qu'à celle-ci.
await page.click(`.pile > .bloc:has-text("${jour(18)}") >> nth=0`)
await page.waitForSelector('.journee-page', { timeout: 20_000 })
const ouverte = await texte('.journee-page')
verifier('   et le tap y ouvre le même écran, sur LA journée tapée',
  /dans 18 jours/.test(ouverte) && ouverte.includes('Pau-Arnos'), ouverte.slice(0, 160))

// ── ⑦ AUCUN COMPTEUR DE JOURNÉES VÉCUES NE L'INCLUT.
await onglet('GARAGE')
await page.waitForSelector('.garage .chiffres', { timeout: 20_000 })
const roulagesApres = await compterRoulages()
verifier('⑦ le garage ne compte pas la journée annoncée',
  Number.isFinite(roulagesApres) && roulagesApres === roulagesAvant,
  `${roulagesAvant} → ${roulagesApres}`)

await onglet('ROULAGES')
await page.waitForSelector('.saison', { timeout: 20_000 })
const saison = await texte('.saison')
verifier('   le bilan de saison non plus',
  !/sans chrono/.test(saison), saison.slice(0, 200))
// Les bornes de la saison sont « du premier au dernier roulage SAISI » — elles
// ne peuvent pas aller chercher une date où le pilote n'est pas encore allé.
const au = saison.match(/au (\d{4}-\d{2}-\d{2})/)?.[1]
verifier('   et sa dernière borne n\'est pas une date à venir',
  !!au && au <= jour(0), `au ${au}`)

await page.screenshot({ path: process.argv[2] ?? '/tmp/a-venir.png', fullPage: true })
verifier('aucune erreur de console', erreurs.length === 0, erreurs.join(' | '))
await nav.close()

if (manques.length) {
  console.error(`\n✗ ${manques.length} vérification(s) en échec :\n  · ${manques.join('\n  · ')}`)
  process.exit(1)
}
console.log('\n✓ une journée annoncée est un projet : elle ne se compte pas, et le tap la prépare')
