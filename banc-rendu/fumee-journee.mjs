// LA JOURNÉE — retirer un roulage, et ne jamais en écrire deux pour un tap.
//
// Cet essai vient d'un bug réel signalé par Julian : « il y a eu un bug et j'ai
// 25 roulages au lieu des 4 ». Deux défauts distincts se cachaient derrière ce
// chiffre, et il faut donc deux assertions.
//
// ① LE BOUTON RESTAIT VIVANT PENDANT L'ÉCRITURE. Rien ne bouge à l'écran
//   pendant qu'OPFS écrit dans son worker, alors on retape — et chaque tap est
//   une journée de plus. L'essai tape trois fois d'affilée, sans respirer, et
//   exige qu'UNE SEULE journée existe ensuite.
//
// ② RIEN NE PERMETTAIT D'EN RETIRER UNE. Une liste fausse qu'on ne peut pas
//   corriger n'est pas une gêne d'affichage : c'est la fin de la saisie.
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
const onglet = n => page.click(`nav.barre .onglet:has-text("${n}")`)

/**
 * ⚠ CET ESSAI SORT EN ÉCHEC, il ne se contente pas de l'imprimer.
 *
 * Le banc a été écrit en lisant ses propres sorties, et ça a marché tant qu'un
 * humain les lisait. Deux défauts de cette session ont pourtant été trouvés en
 * relisant le TEXTE d'un essai qui rendait un code de sortie vert — c'est-à-dire
 * deux fois trop tard. Une vérification qui ne peut pas faire tomber la suite
 * n'est pas une vérification, c'est un commentaire.
 */
const manques = []
const verifier = (titre, vrai, detail = '') => {
  console.log(`${vrai ? '  ok ' : '  ÉCHEC '} ${titre}${detail ? ' — ' + detail : ''}`)
  if (!vrai) manques.push(titre)
}

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

// ── ① TROIS TAPS, UNE SEULE JOURNÉE ────────────────────────────────────────
await page.click('text=Saisir mon premier roulage')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Pau-Arnos')

// `noWaitAfter` et `force` : on ne laisse PAS Playwright attendre la stabilité
// entre les taps — c'est exactement ce que le pilote impatient ne fait pas non
// plus. Trois appuis dans la même poignée de millisecondes.
const bouton = page.locator('.bouton:has-text("Continuer"), .bouton:has-text("enregistrement")')
for (let i = 0; i < 3; i++) {
  await bouton.click({ force: true, noWaitAfter: true, timeout: 2_000 }).catch(() => {})
}
await page.waitForSelector('text=Meilleur tour de la session', { timeout: 30_000 })

await page.click('text=Retour')
await page.waitForTimeout(400)
await onglet('ROULAGES')
await page.waitForSelector('.libelle:has-text("Roulages ·")', { timeout: 20_000 })
const apres3taps = await page.$$eval('.pile > .bloc', n => n.length)
verifier('① trois taps sur « Continuer » n\'écrivent qu\'une journée',
  apres3taps === 1, `${apres3taps} journée(s) écrite(s)`)

// Le libellé dit ce qu'on compte : une journée, pas une session.
verifier('   le compteur nomme la journée',
  (await page.textContent('.libelle:has-text("Roulages ·")')).includes('journée'))

// ── ② RETIRER LA JOURNÉE ───────────────────────────────────────────────────
verifier('② le retrait est offert', await page.isVisible('text=Retirer cette journée'))

// Un tap ne suffit pas : le premier ouvre la question, le second seul efface.
await page.click('text=Retirer cette journée')
verifier('   demande confirmation avant d\'effacer',
  await page.isVisible('text=Retirer définitivement'))
verifier('   laisse revenir en arrière', await page.isVisible('text=Garder'))

// ⚠ LA PHRASE NOMME CE QUI EST LÀ, ET RIEN D'AUTRE. Elle annonçait toujours
// « ses chronos et ses photos », sur une journée qui n'en avait aucune — et
// surtout elle TAISAIT les dépenses, que la suppression emporte pourtant. Sur
// l'unique geste irréversible du produit, promettre moins qu'on ne détruit est
// la seule faute qui ne se rattrape pas.
const CONFIRME = '.bloc:has-text("Retirer définitivement") .note'
const phrase = (await page.textContent(CONFIRME)).replace(/\s+/g, ' ')
// Cette journée-ci n'a AUCUNE session enregistrée — trois taps sur « Continuer »
// écrivent la journée, pas un chrono. La phrase disait pourtant « ses 0 session,
// ses chronos et ses photos » : trois choses annoncées détruites dont deux
// n'existaient pas, et un « 0 » au milieu d'une phrase.
verifier('   une journée vide le dit, sans énumérer du vide',
  /rien d'autre/.test(phrase) && !/photo/i.test(phrase) && !/0 session/.test(phrase), phrase)

await page.click('text=Garder')
await page.waitForTimeout(200)
const gardee = await page.$$eval('.pile > .bloc', n => n.length)
verifier('   « Garder » ne retire rien', gardee === 1, `${gardee} restante(s)`)

// ── ②bis L'ARGENT DE LA JOURNÉE EST ANNONCÉ ────────────────────────────────
// Un pilote qui retire une journée mal saisie perdait avec elle les 180,50 €
// d'engagement qu'il y avait notés, sans qu'une ligne le lui dise.
// ⚠ CETTE JOURNÉE EST DATÉE D'AUJOURD'HUI ET N'A AUCUNE SESSION — le chrono a
// été abandonné par « Retour ». Depuis le récit 17.2, le tap ouvre donc ce qui
// la PRÉPARE et non son bilan : le matin où l'on charge le camion, l'écran ne
// réclame pas le meilleur tour d'une journée qui n'a pas commencé.
// L'argent s'y saisit par la ligne « L'engagement » d'« Avant d'y aller », qui
// mène au budget. C'est le chemin réel du pilote — et il éprouve au passage la
// promesse de cette liste : chaque ligne dérivée MÈNE quelque part.
await page.click('.pile > .bloc .titre')
await page.waitForSelector('.journee-page .preparation', { timeout: 20_000 })
await page.click('.preparation .tache:has-text("L\'engagement")')
await page.waitForSelector('section.depense', { timeout: 20_000 })
await page.fill('#montant', '180,50')
await page.fill('#libelle', 'Engagement')
await page.click('section.depense .bouton:not(.secondaire)')
await page.waitForSelector('.journee-page', { timeout: 20_000 })
// La journée ne se quitte que par la barre : c'est un lieu, pas une modale.
await onglet('ROULAGES')
await page.waitForSelector('text=Retirer cette journée', { timeout: 20_000 })
await page.click('text=Retirer cette journée')
const avecArgent = (await page.textContent(CONFIRME)).replace(/\s+/g, ' ')
verifier('②bis la dépense de la journée est annoncée avant de la détruire',
  /180,5\d? €/.test(avecArgent), avecArgent)

await page.click('text=Retirer définitivement')
// ⚠ ON COMPTE LES JOURNÉES, PAS LES BLOCS. L'écran des roulages en porte
// d'autres — le report de saison, par exemple, dès qu'une dépense existe — et
// compter les blocs faisait échouer un essai que le produit passait.
await page.waitForFunction(
  () => document.querySelectorAll('.bloc:has(button)').length === 0
     || !document.body.textContent.includes('Retirer cette journée'),
  null, { timeout: 20_000 })
  .then(() => verifier('③ la journée est partie', true))
  .catch(() => verifier('③ la journée est partie', false, 'elle est toujours là'))

// ── ④ ELLE EST PARTIE JUSQU'EN BASE, avec ses descendants ──────────────────
// Une session ou un tour orphelin est refusé côté serveur en 23503, et une
// ligne refusée arrête toute la file d'envoi derrière elle. Le vérifier à
// l'écran ne suffit pas : on compte dans la base.
await page.reload({ waitUntil: 'networkidle' }); await pret()
await onglet('COMPTE')
await page.waitForSelector('section.compte', { timeout: 15_000 })
const restes = (await page.textContent('section.compte')).replace(/\s+/g, ' ')
verifier('④ plus aucune ligne de roulage en attente d\'envoi',
  !/roulage/i.test(restes), restes.slice(0, 120))

await page.screenshot({ path: process.argv[2] ?? '/tmp/journee.png', fullPage: true })
verifier('⑤ aucune erreur de console', erreurs.length === 0, erreurs.join(' | '))
await nav.close()

if (manques.length) {
  console.error(`\n✗ ${manques.length} vérification(s) en échec :\n  · ${manques.join('\n  · ')}`)
  process.exit(1)
}
console.log('\n✓ la journée s\'écrit une fois et se retire')
