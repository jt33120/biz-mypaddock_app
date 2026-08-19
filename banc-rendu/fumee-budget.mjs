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
await page.click('nav.barre .onglet:has-text("GARAGE")')

// ── ③ AVANT TOUTE MACHINE ──────────────────────────────────────────────────
await page.waitForSelector('text=Aucune machine', { timeout: 20_000 })
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

// La cible est la LIGNE ENTIÈRE, pas le « + » : saisie gantée, 52 px minimum.
const haut = await page.$eval('.ligne-atelier.poste', n => n.getBoundingClientRect().height)
verifier('   la ligne d\'un poste est une cible gantée', haut >= 52, `${Math.round(haut)} px`)

// ── ② L'ÉQUIPEMENT ─────────────────────────────────────────────────────────
await page.click('.atelier-tete:has-text("Équipement")')
await page.click('text=Déclarer une pièce')
await page.fill('.champ[placeholder="Combinaison cuir"]', 'Casque Shoei X-SPR Pro')
await page.fill('.champ[type=month]', '2019-05')
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
