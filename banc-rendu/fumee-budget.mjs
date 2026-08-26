// LE BUDGET PAR POSTE ET L'ÉQUIPEMENT — les deux modules demandés par Julian.
//
// Ce que cet essai protège, dans l'ordre d'importance :
//
//   ① LES DEUX CLAUSES D'ARGENT. Aucune prévision, aucun reste à dépenser,
//     aucune barre qui se remplit. Un budget qui se vide sous les yeux est un
//     compteur à rebours, et un compteur à rebours sur de l'argent produit
//     exactement ce qu'il prétend éviter : on cesse de saisir.
//   ② AUCUNE ÉCHÉANCE SUR L'ÉQUIPEMENT. C'est la clause la plus tentante à
//     enfreindre du produit : un casque a une durée de vie. Le produit consigne
//     une date d'achat — un fait — et n'en dérive JAMAIS un âge ni un verdict.
//   ③ LES DEUX MODULES EXISTENT SANS MACHINE. L'équipement est défini par le
//     fait de ne pas dépendre d'une moto ; l'enfermer derrière la déclaration
//     d'une machine contredit sa définition.
//
// ⚠ ET IL POSE UN PLAFOND, MAINTENANT — c'est ce qui manquait, et sans quoi les
// trois gardes négatifs ci-dessus NE POUVAIENT PAS ROUGIR. Sans plafond posé,
// `plafond` et `repere` restent nuls dans Budget.tsx et TOUTE LA MOITIÉ D'ÉCRAN
// qui en dépend n'est jamais rendue : le paragraphe « Repère du mois · … divisé
// par douze », et avec lui le seul endroit du produit où une projection, une
// comparaison de mois ou une jauge s'écriraient naturellement. La revue l'a
// prouvé en injectant « X % du repère, à ce rythme tu dépasses » et une
// `<div class="jauge">` : l'essai rendait 17 ok, 0 ÉCHEC, sortie 0 — en
// imprimant textuellement « ok aucune prévision ». Un garde qui nomme le défaut
// qu'il laisse passer est pire qu'un garde absent : il rassure.
//
// Les refus sont donc joués DEUX FOIS : une fois sans plafond (l'état de
// démarrage, qui est réel), une fois avec (l'état où la tentation existe).
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

// ⚠ LES DATES SONT RELATIVES, JAMAIS ÉCRITES EN DUR. Un « 2026-10-05 » figé
// rend un essai vert un jour et rouge le lendemain, c'est-à-dire un essai qui
// ment sur ce qu'il éprouve — pire qu'un essai absent.
const jour = (d) => { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10) }

const manques = []
const verifier = (titre, vrai, detail = '') => {
  console.log(`${vrai ? '  ok ' : '  ÉCHEC '} ${titre}${detail ? ' — ' + detail : ''}`)
  if (!vrai) manques.push(titre)
}

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

// ── ⓪ L'ACCUEIL VIDE N'OFFRE QU'UNE SEULE ACTION ───────────────────────────
// Le raccourci de dépense (récit 19.3) vit sur l'accueil — mais PAS ici. Sans
// aucune donnée, FR-14 ne laisse qu'un seul chemin : saisir son premier roulage.
// Un second lien à côté le dilue, et c'est le seul écran du produit où l'on ne
// peut pas se permettre de disperser.
verifier('⓪ l\'accueil vide ne propose pas le raccourci de dépense',
  !(await page.textContent('.ecran')).includes('Noter une dépense'))

await page.click('nav.barre .onglet:has-text("GARAGE")')

// ── ③ AVANT TOUTE MACHINE ──────────────────────────────────────────────────
await page.waitForSelector('text=Aucune moto', { timeout: 20_000 })
verifier('③ le budget existe sans machine', await page.isVisible('.atelier.budget'))
verifier('   l\'équipement aussi', await page.isVisible('.atelier.equipement'))

// ── ① LE BUDGET ────────────────────────────────────────────────────────────
await page.click('.atelier-tete:has-text("Budget ·")')
const POSTES = [['Engagement', '230'], ['Pneus', '389,90'], ['Essence', '96,40']]
for (const [poste, montant] of POSTES) {
  await page.click(`.ligne-atelier.poste:has-text("${poste}")`)
  await page.fill('.champ[placeholder="montant en €"]', montant)
  await page.click('.bouton.secondaire:has-text("Ajouter à")')
  await page.waitForTimeout(400)
}
const tete = (await page.textContent('.atelier.budget .atelier-tete')).replace(/\s+/g, ' ')
verifier('① le total additionne les trois postes', tete.includes('716,30'), tete)

const budget = (await page.textContent('.atelier.budget')).replace(/\s+/g, ' ')
// Aucun mot d'avenir, aucun reste : ces cinq formes sont les manières usuelles
// de faire d'un total un compteur à rebours.
const interdits = ['prévision', 'prévisionnel', 'il te reste', 'reste à dépenser', 'dépassement']
verifier('   aucune prévision, aucun reste à dépenser',
  !interdits.some((m) => budget.toLowerCase().includes(m)),
  interdits.filter((m) => budget.toLowerCase().includes(m)).join(', '))
verifier('   aucune barre de progression',
  await page.$$eval('.atelier.budget progress, .atelier.budget meter', n => n.length) === 0)

// Un poste jamais utilisé n'affiche NI zéro NI tiret : il n'a rien à dire.
const assurance = (await page.textContent('.ligne-atelier.poste:has-text("Assurance")')).replace(/\s+/g, ' ')
verifier('   un poste vide ne s\'affiche ni à zéro ni en tiret',
  !/0[ ,]|—/.test(assurance), assurance)

// ── ①bis LE MOIS EXISTE, ET IL RESTE UN CONSTAT — récit 19.2 ──────────────
// « Le coût est de 2180 mais le budget est de 500/mois » : le produit ne savait
// pas compter au mois, parce que la dépense ne portait aucune date. Les trois
// dépenses ci-dessus sont saisies au jour d'aujourd'hui — elles doivent donc se
// retrouver dans le mois courant, et pour le montant exact.
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const moisCourant = `${MOIS[new Date().getMonth()]} ${new Date().getFullYear()}`
verifier('①bis le mois existe', budget.includes('Par mois') && budget.includes(moisCourant),
  moisCourant)
verifier('   le mois porte le total des trois postes',
  new RegExp(`${moisCourant}[^€]*716,30`).test(budget), budget.slice(budget.indexOf('Par mois'), budget.indexOf('Par mois') + 160))
// ⚠ LA FENÊTRE EST BORNÉE EN CARACTÈRES, PLUS EN « AVANT LE PREMIER € ». Le
// récit 19.4 a mis le montant AVANT la composition — nom, montant, barre,
// composition — et `[^€]*` ne pouvait plus franchir le montant. L'assertion
// serait devenue rouge sur un écran juste ; la borne dit ce qu'elle veut
// vraiment : la composition est ATTACHÉE à ce mois-là, pas au suivant.
verifier('   le mois dit de quoi il était fait',
  new RegExp(`${moisCourant}[\\s\\S]{0,40}engagement`).test(budget),
  budget.slice(budget.indexOf(moisCourant), budget.indexOf(moisCourant) + 90))

// ⚠ LES TROIS REFUS DU MOIS, et ils comptent autant que son existence. Un total
// mensuel est l'endroit du produit où la comparaison, le pourcentage et le
// « à ce rythme » s'invitent le plus naturellement — et un mois cher est un mois
// où l'on a roulé, pas une faute.
const projections = [/\d\s?%/, /à ce rythme/i, /projection/i, /prévisionnel/i,
  /par rapport/i, /reste à/i, /tendance/i, /moyenne/i]
verifier('   aucune comparaison de mois, aucune projection',
  !projections.some((r) => r.test(budget)),
  projections.filter((r) => r.test(budget)).map(String).join(' '))
// Et AUCUNE jauge dans ce module : une barre qui se remplit vers un plafond du
// mois ferait du repère un compteur à rebours — exactement ce que les deux
// clauses d'argent refusent. La seule jauge du produit est celle de l'année, et
// elle vit sur le bilan d'une journée.
verifier('   aucune barre qui se remplit vers un plafond du mois',
  await page.$$eval('.atelier.budget .jauge', (n) => n.length) === 0)

// La cible est la LIGNE ENTIÈRE, pas le « + » : saisie gantée, 52 px minimum.
const haut = await page.$eval('.ligne-atelier.poste', n => n.getBoundingClientRect().height)
verifier('   la ligne d\'un poste est une cible gantée', haut >= 52, `${Math.round(haut)} px`)

// ── ② L'ÉQUIPEMENT ─────────────────────────────────────────────────────────
await page.click('.atelier-tete:has-text("Équipement")')
await page.click('text=Déclarer une pièce')
await page.fill('.champ[placeholder="Combinaison cuir"]', 'Casque Shoei X-SPR Pro')
// ⚠ SÉLECTEUR SCOPÉ AU BLOC. Le garage vide affiche maintenant DEUX formulaires
// à la fois — la déclaration d'une machine et celle d'un équipement — et les
// deux portent un champ `type=month` depuis que la moto a un mois d'achat. Sans
// le préfixe, `fill` visait le premier, c'est-à-dire l'autre formulaire, et
// l'essai constatait l'absence d'une date qu'il n'avait jamais saisie.
await page.fill('.atelier.equipement .champ[type=month]', '2019-05')
await page.fill(`.champ[placeholder="ce que ça a coûté, si tu l'as"]`, '780')
await page.click('.bouton.secondaire:has-text("Déclarer")')
await page.waitForSelector('text=Casque Shoei X-SPR Pro', { timeout: 15_000 })

const equip = (await page.textContent('.atelier.equipement')).replace(/\s+/g, ' ')
verifier('② la date d\'achat s\'énonce telle quelle', equip.includes('acheté en mai 2019'), equip.slice(0, 140))
// Un casque de 2019 : c'est ICI qu'un âge ou un verdict apparaîtrait s'il devait
// apparaître. Aucun de ces mots ne doit exister nulle part dans le module.
// ⚠ FRONTIÈRES DE MOT OBLIGATOIRES. La première version cherchait « ans » en
// sous-chaîne et le trouvait dans « sans appartenir à une moto » : l'essai
// tombait sur son propre sous-titre. Un garde-fou qui crie au loup sur du texte
// légitime finit désactivé, et c'est alors la vraie règle qui n'est plus tenue.
const verdicts = ['ans', 'âge', 'à remplacer', 'périmé', 'expiré', 'fin de vie', 'obsolète']
const trouves = verdicts.filter((m) =>
  new RegExp(`(^|[^\\p{L}])${m}($|[^\\p{L}])`, 'iu').test(equip))
verifier('   aucun âge, aucun verdict, aucune échéance', trouves.length === 0, trouves.join(', '))

// La ligne tient dans la largeur : nom sur sa ligne, faits en dessous.
const large = await page.$eval('.materiel',
  n => n.scrollWidth <= n.clientWidth + 1)
verifier('   la ligne ne déborde pas de l\'écran', large)

/* ═══════════════════════════════════════════════════════════════════════════
   ④ LE JOUR D'UNE DÉPENSE EST CELUI DU PAIEMENT, PAS CELUI DE LA JOURNÉE VISÉE
   ═══════════════════════════════════════════════════════════════════════════
   Le défaut, constaté à l'écran avant d'être écrit ici : journée annoncée dans
   quarante jours, engagement payé AUJOURD'HUI, et le garage affichait
   « Par mois · <le mois de la journée> · 230 € ». L'argent était sorti ce
   mois-ci. Ce n'est pas un bord : depuis l'épique 17 la journée à venir est de
   premier rang, et « L'engagement » de sa préparation est LE chemin par lequel
   cette dépense-là se saisit.

   Une liste « Par mois » qui contient un mois À VENIR ne se lit pas comme un
   constat, elle se lit comme une prévision — ce que les deux clauses d'argent
   refusent ligne à ligne. La journée reste la CIBLE de la dépense ; elle ne lui
   donne plus le jour. */
await page.click('nav.barre .onglet:has-text("ACCUEIL")')
await page.waitForSelector('text=/Saisir (mon premier roulage|un roulage)/', { timeout: 20_000 })
await page.click('text=/Saisir (mon premier roulage|un roulage)/')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Pau-Arnos')
const dansQuaranteJours = jour(40)
await page.fill('input[type=date]', dansQuaranteJours)
await page.click('text=Continuer')
await page.waitForSelector('.journee-page', { timeout: 30_000 })

// Le chemin réel de l'engagement : la ligne de préparation, pas le garage.
await page.click('.preparation .tache:has-text("L\'engagement")')
await page.waitForSelector('section.depense', { timeout: 20_000 })
const saisie = (await page.textContent('section.depense')).replace(/\s+/g, ' ')
verifier('④ la journée visée est dite comme CIBLE, pas comme jour',
  saisie.includes(dansQuaranteJours) && /pas le jour où tu l'as payée/.test(saisie),
  saisie.slice(0, 200))
// ⚠ LE CŒUR DU RÉCIT : le champ jour arrive rempli à AUJOURD'HUI, jamais à la
// date de la journée. C'est là que le défaut se voyait, avant même d'écrire.
const jourPropose = await page.inputValue('section.depense input[type=date]')
verifier('   le champ jour propose aujourd\'hui, pas la date de la journée',
  jourPropose === jour(0), `proposé ${jourPropose}, journée le ${dansQuaranteJours}`)
await page.fill('#montant', '230')
await page.fill('#libelle', 'Engagement')
await page.click('section.depense .bouton:not(.secondaire)')
await page.waitForSelector('.journee-page', { timeout: 30_000 })

// Et au garage : le mois COURANT porte les 230 €, le mois de la journée
// n'existe pas — un mois à venir dans une liste de dépenses est une prévision.
// Le nom du mois se lit DANS LA CHAÎNE, pas dans un `new Date` : `new
// Date('2026-10-01')` rend minuit UTC, et `getMonth()` est local — à l'ouest
// de Greenwich le 1er d'un mois bascule sur le mois précédent, et l'essai
// chercherait alors un mois que le produit n'a aucune raison d'afficher.
const moisFutur = `${MOIS[Number(dansQuaranteJours.slice(5, 7)) - 1]} ${dansQuaranteJours.slice(0, 4)}`
await page.click('nav.barre .onglet:has-text("GARAGE")')
await page.waitForSelector('.atelier.budget', { timeout: 20_000 })
await page.click('.atelier-tete:has-text("Budget ·")')
await page.waitForSelector('.atelier.budget .ligne-atelier', { timeout: 20_000 })
const apresEngagement = (await page.textContent('.atelier.budget')).replace(/\s+/g, ' ')
verifier('   l\'engagement tombe dans le mois du PAIEMENT',
  new RegExp(`${moisCourant}[^€]*946,30`).test(apresEngagement),
  apresEngagement.slice(apresEngagement.indexOf('Par mois'), apresEngagement.indexOf('Par mois') + 200))
verifier('   et AUCUN mois à venir n\'apparaît dans le budget',
  !apresEngagement.includes(moisFutur), `mois de la journée cherché : ${moisFutur}`)

/* ═══════════════════════════════════════════════════════════════════════════
   ⑤ LE PLAFOND EST POSÉ — et c'est ce qui rend les trois refus éprouvables
   ═══════════════════════════════════════════════════════════════════════════
   Le plafond ne se pose qu'au bilan d'une journée qui a coûté quelque chose
   (FR-24, App.tsx) : il faut donc une journée vécue et une dépense dessus. On
   passe par le chemin réel — celui de fumee-cout — plutôt que d'écrire dans la
   base : un essai qui éprouve autre chose que ce qui part n'éprouve rien. */
await page.click('nav.barre .onglet:has-text("ACCUEIL")')
await page.waitForSelector('text=/Saisir (mon premier roulage|un roulage)/', { timeout: 20_000 })
await page.click('text=/Saisir (mon premier roulage|un roulage)/')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Nogaro')
await page.fill('input[type=date]', jour(0))
await page.click('text=Continuer')
await page.click('text=Enregistrer la session')
await page.waitForFunction(() =>
  !!document.querySelector('section.recap .recap-image')
  || document.body.textContent.includes('Meilleur tour du jour'), null, { timeout: 40_000 })
if (await page.isVisible('section.recap')) {
  await page.click('text=Retour au roulage')
}
await page.waitForSelector('text=Meilleur tour du jour', { timeout: 20_000 })
await page.click('text=Ajouter une dépense')
await page.waitForSelector('section.depense', { timeout: 20_000 })
await page.fill('#montant', '180,50')
await page.click('section.depense .bouton:not(.secondaire)')
await page.waitForSelector('#budget', { timeout: 20_000 })
await page.fill('#budget', '2000')
await page.click('text=Poser le budget')
await page.waitForSelector('.jauge', { timeout: 20_000 })

// ── ⑤bis LE REPÈRE DU MOIS EST ÉCRIT, ET IL RESTE UN REPÈRE ───────────────
// Ce paragraphe n'était rendu par AUCUN essai du dépôt. C'est pourtant le seul
// endroit du budget où une projection s'écrirait naturellement : c'est là qu'on
// tient un plafond et un total de mois côte à côte.
await page.click('nav.barre .onglet:has-text("GARAGE")')
await page.waitForSelector('.atelier.budget', { timeout: 20_000 })
await page.click('.atelier-tete:has-text("Budget ·")')
await page.waitForSelector('.atelier.budget .ligne-atelier', { timeout: 20_000 })
const avecPlafond = (await page.textContent('.atelier.budget')).replace(/\s+/g, ' ')
verifier('⑤ le repère du mois est écrit — 2 000 € posés, divisés par douze',
  /Repère du mois · 166,67 €/.test(avecPlafond) && /divisé par douze/.test(avecPlafond),
  avecPlafond.slice(avecPlafond.indexOf('Repère du mois'), avecPlafond.indexOf('Repère du mois') + 200))
verifier('   il dit lui-même qu\'aucun mois ne s\'y compare',
  /aucun mois ne s'y compare/.test(avecPlafond) && /n'est pas une faute/.test(avecPlafond))
verifier('   et le total suit les quatre saisies',
  avecPlafond.includes('1 126,80'), avecPlafond.slice(0, 120))

// ⚠ LES TROIS REFUS, REJOUÉS SUR LA MOITIÉ D'ÉCRAN QUI N'EXISTAIT PAS. Ce sont
// les mêmes trois qu'au ①bis, mot pour mot — et c'est le point : là-haut ils
// portaient sur un écran sans plafond, où rien de ce qu'ils interdisent n'avait
// de raison d'être rendu. Ici le plafond est posé, le repère est affiché, et
// chaque ligne de mois côtoie un chiffre auquel elle POURRAIT se comparer.
verifier('   aucune prévision, aucun reste à dépenser — plafond posé',
  !interdits.some((m) => avecPlafond.toLowerCase().includes(m)),
  interdits.filter((m) => avecPlafond.toLowerCase().includes(m)).join(', '))
verifier('   aucune comparaison de mois, aucune projection — plafond posé',
  !projections.some((r) => r.test(avecPlafond)),
  projections.filter((r) => r.test(avecPlafond)).map(String).join(' '))
verifier('   aucune barre qui se remplit vers le repère — plafond posé',
  await page.$$eval('.atelier.budget .jauge, .atelier.budget progress, .atelier.budget meter',
    (n) => n.length) === 0)

/* ═══════════════════════════════════════════════════════════════════════════
   ⑥ CE QUE LE RACCOURCI ANNONCE EST VRAI
   ═══════════════════════════════════════════════════════════════════════════
   « Le détail vit au garage, dans le budget. » Le champ jour n'avait ni `min`
   ni `max`, `saison_annee` se dérive du jour, et les deux lectures du budget
   filtrent sur l'année en cours : une facture datée du 30 décembre dernier
   s'écrivait parfaitement et n'apparaissait PLUS NULLE PART. La phrase était
   fausse, et rien ne pouvait le dire.

   L'essai éprouve les deux moitiés : ce qui est refusé est DIT, et ce qui est
   accepté se retrouve vraiment là où le produit a promis qu'il serait. */
await page.click('nav.barre .onglet:has-text("ACCUEIL")')
await page.waitForSelector('.raccourci-depense', { timeout: 20_000 })
await page.click('.raccourci-depense .lien:has-text("Noter une dépense")')
await page.click('.raccourci-depense .puce:has-text("ESSENCE")')
await page.waitForSelector('.raccourci-depense input[type=date]', { timeout: 20_000 })
await page.fill('.raccourci-depense .champ[placeholder="montant en €"]', '42')
const anneeEnCours = new Date().getFullYear()
await page.fill('.raccourci-depense input[type=date]', `${anneeEnCours - 1}-12-30`)
await page.waitForTimeout(300)
const horsAnnee = (await page.textContent('.raccourci-depense')).replace(/\s+/g, ' ')
verifier('⑥ un 30 décembre de l\'an dernier est refusé, et le refus est DIT',
  await page.isDisabled('.raccourci-depense .bouton.secondaire'),
  `champ à ${await page.inputValue('.raccourci-depense input[type=date]')}`)
verifier('   l\'écran dit POURQUOI, sans corriger la date en douce',
  new RegExp(`hors de l'année ${anneeEnCours}`).test(horsAnnee)
  && /aucun écran du produit ne la montrerait/.test(horsAnnee),
  horsAnnee.slice(-220))

// Corrigée dans l'année, elle passe — et la promesse doit alors être tenue.
await page.fill('.raccourci-depense input[type=date]', `${anneeEnCours}-01-15`)
await page.waitForTimeout(300)
await page.click('.raccourci-depense .bouton.secondaire:has-text("Ajouter à")')
await page.waitForSelector('.raccourci-depense .note', { timeout: 20_000 })
const annonce = (await page.textContent('.raccourci-depense')).replace(/\s+/g, ' ')
verifier('   notée, l\'annonce désigne le garage',
  /Noté · 42 € sur essence/.test(annonce) && /Le détail vit au garage/.test(annonce), annonce)

await page.click('nav.barre .onglet:has-text("GARAGE")')
await page.waitForSelector('.atelier.budget', { timeout: 20_000 })
await page.click('.atelier-tete:has-text("Budget ·")')
await page.waitForSelector('.atelier.budget .ligne-atelier', { timeout: 20_000 })
const verifie = (await page.textContent('.atelier.budget')).replace(/\s+/g, ' ')
verifier('   et elle Y EST — l\'annonce était vraie',
  new RegExp(`janvier ${anneeEnCours}[^€]*42 €`).test(verifie),
  verifie.slice(verifie.indexOf('Par mois'), verifie.indexOf('Par mois') + 220))

await page.screenshot({ path: process.argv[2] ?? '/tmp/budget.png', fullPage: true })
verifier('⑦ aucune erreur de console', erreurs.length === 0, erreurs.join(' | '))
await nav.close()

if (manques.length) {
  console.error(`\n✗ ${manques.length} vérification(s) en échec :\n  · ${manques.join('\n  · ')}`)
  process.exit(1)
}
console.log('\n✓ le budget compte sans prévoir, l\'équipement date sans juger')
