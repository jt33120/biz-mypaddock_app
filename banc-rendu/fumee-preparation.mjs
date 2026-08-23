// AVANT D'Y ALLER — la liste de préparation d'un roulage à venir.
//
//   « Je mets le prochain roulage où je vais aller et j'ai une liste de tâches
//     à faire : checker huile, si accident réparer, payer etc. » (Julian)
//
// Ce que cet essai protège, dans l'ordre :
//
//   ⚠ LA LISTE EST DÉRIVÉE, PAS INVENTÉE. La version paresseuse serait une liste
//     embarquée — « vérifier l'huile, la pression, la chaîne » — la même pour
//     tout le monde, cochée sans être lue dès la deuxième fois parce qu'elle ne
//     sait rien de cette moto-là. Chaque ligne doit venir d'une donnée SAISIE.
//   ⚠ AUCUN COMPTEUR DE PROGRESSION. Ni « 3 sur 7 », ni barre, ni pastille : une
//     liste qui affiche sa progression devient une chose à finir, et une chose à
//     finir se bâcle (FR-50).
//   ⚠ ELLE N'APPARAÎT PAS SUR UNE JOURNÉE PASSÉE. « Ce qui reste à faire » sur
//     un roulage déjà vécu serait un reproche.
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

// ── ① AVANT TOUT ROULAGE À VENIR : rien.
await page.click('text=Saisir mon premier roulage')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Nogaro')
await page.click('text=Continuer')
await page.waitForSelector('.molettes', { timeout: 20_000 })
await page.click('text=Retour')
await page.waitForTimeout(500)
await page.click('nav.barre .onglet:has-text("ACCUEIL")')
await page.waitForTimeout(600)
verifier('① aucune liste sur une journée déjà passée',
  !await page.isVisible('.preparation'))

// ── Une machine, une pièce achetée non montée, et un roulage à venir.
await page.click('nav.barre .onglet:has-text("GARAGE")')
await page.click('text=Reprendre la CBR 83')
await page.waitForSelector('.garage-titre', { timeout: 20_000 })
await page.click('text=Reprendre la saison 2026 · Pau-Arnos')
await page.waitForTimeout(1500)
await page.click('button.atelier:has-text("Entretien")')
await page.waitForSelector('.poste-page', { timeout: 20_000 })
await page.click('text=Consigner un geste')
await page.fill('.champ[placeholder="Plaquettes avant"]', 'Plaquettes avant')
await page.click('text=Acheté, pas encore monté')
await page.waitForTimeout(700)
await page.click('.poste-page .lien:has-text("garage")')
await page.click('nav.barre .onglet:has-text("ACCUEIL")')
await page.waitForSelector('.preparation', { timeout: 20_000 })
await page.waitForTimeout(500)

const prep = await texte('.preparation')

// ── ② CHAQUE LIGNE VIENT D'UNE DONNÉE SAISIE, et le dit.
verifier('② la pièce achetée remonte', prep.includes('Plaquettes avant'), prep.slice(0, 140))
verifier('   avec le motif qui la produit', prep.includes('acheté, pas encore monté'))
verifier('   l\'engagement non saisi remonte aussi', prep.includes("L'engagement"))
verifier('   et il dit le FAIT, pas l\'accusation',
  prep.includes('aucune dépense') && !/tu n.as pas pay|impay/i.test(prep), prep)

// ── ③ AUCUN COMPTEUR DE PROGRESSION.
const compteurs = [/\d+\s*(sur|\/)\s*\d+/, /reste\s+\d+/i, /\d+\s*tâches?\s+restantes?/i]
verifier('③ aucun compteur de progression',
  !compteurs.some((r) => r.test(prep)), prep.slice(0, 120))
verifier('   aucune barre de progression',
  await page.$$eval('.preparation progress, .preparation meter', n => n.length) === 0)

// ── ④ UNE LIGNE DÉRIVÉE MÈNE QUELQUE PART. Une liste de rappels dont les lignes
//    ne mènent nulle part se lit une fois et ne se relit jamais.
const cibles = await page.$$eval('.preparation .tache', n => n.length)
verifier('④ les lignes dérivées sont des portes', cibles >= 2, `${cibles} porte(s)`)
await page.click('.preparation .tache:has-text("Plaquettes")')
await page.waitForSelector('.garage', { timeout: 20_000 })
verifier('   « Plaquettes » mène au garage', await page.isVisible('.garage'))

// ── ⑤ CE QU'ON AJOUTE À LA MAIN SE COCHE ; ce qui est dérivé, non.
await page.click('nav.barre .onglet:has-text("ACCUEIL")')
await page.waitForSelector('.preparation', { timeout: 20_000 })
await page.fill('.ajout-tache .champ', 'Passer chercher le bidon')
await page.click('.ajout-tache .bouton')
await page.waitForSelector('.preparation .coche', { timeout: 15_000 })
verifier('⑤ une tâche ajoutée se coche', await page.isVisible('.preparation .coche'))
verifier('   une tâche dérivée ne se coche pas',
  await page.$$eval('.preparation .tache .coche', n => n.length) === 0)

// ── ⑥ Le bloc ne déborde pas — le champ d'ajout l'a déjà fait une fois.
verifier('⑥ le bloc tient dans l\'écran',
  await page.$eval('.preparation', n => n.scrollWidth <= n.clientWidth + 1))

await page.screenshot({ path: process.argv[2] ?? '/tmp/preparation.png', fullPage: true })
verifier('aucune erreur de console', erreurs.length === 0, erreurs.join(' | '))
await nav.close()

if (manques.length) {
  console.error(`\n✗ ${manques.length} vérification(s) en échec :\n  · ${manques.join('\n  · ')}`)
  process.exit(1)
}
console.log('\n✓ la liste est dérivée, elle mène quelque part, et rien ne la compte')
