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
verifier('   le mois dit de quoi il était fait',
  new RegExp(`${moisCourant}[^€]*engagement`).test(budget))

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

await page.screenshot({ path: process.argv[2] ?? '/tmp/budget.png', fullPage: true })
verifier('④ aucune erreur de console', erreurs.length === 0, erreurs.join(' | '))
await nav.close()

if (manques.length) {
  console.error(`\n✗ ${manques.length} vérification(s) en échec :\n  · ${manques.join('\n  · ')}`)
  process.exit(1)
}
console.log('\n✓ le budget compte sans prévoir, l\'équipement date sans juger')
