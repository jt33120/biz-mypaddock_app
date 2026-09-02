/**
 * COMBIEN D'ÉCRANS FAIT CHAQUE SURFACE — un instrument, pas un essai.
 *
 * « Il y a beaucoup trop de scrolles. À peu de choses près tout doit tenir en
 * une vue iPhone » — Julian, 1er septembre 2026.
 *
 * ⚠ IL NE ROUGIT PAS, ET C'EST DÉLIBÉRÉ. Il n'est pas dans `BOUT_EN_BOUT` :
 * poser un seuil de hauteur aujourd'hui figerait une cible qui n'a pas encore
 * été discutée, et un essai qui rougit sur une page qu'on est en train de
 * retravailler ne protège rien — il empêche seulement de travailler. Il MESURE,
 * il classe, et c'est la mesure qui décide par où commencer.
 *
 * ⚠ ET IL MESURE UN ÉTAT PLEIN, PAS UN ÉCRAN VIDE. Une page vide tient toujours
 * en une vue ; c'est la page d'un pilote qui a une saison derrière lui qui
 * défile. Le décor vient donc du chemin d'écriture normal du produit —
 * « Reprendre la saison 2026 », une moto, une dépense, une pièce d'équipement —
 * et jamais d'une écriture directe en base : une mesure prise sur un état que le
 * produit ne sait pas fabriquer mesure autre chose que le produit.
 *
 * L'iPhone de référence est le PLUS PETIT des trois que le produit vise :
 * 375 × 812 (SE / 13 mini). Ce qui tient là tient partout ailleurs.
 */
import { chromium } from 'playwright-core'

const LARGEUR = 375
const HAUTEUR = 812

const nav = await chromium.launch({
  executablePath: process.env.CHROME
    ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({
  viewport: { width: LARGEUR, height: HAUTEUR }, deviceScaleFactor: 2,
})
const pret = () => page.waitForFunction(
  () => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })
const onglet = (n) => page.click(`nav.barre .onglet:has-text("${n}")`)

/**
 * La mesure elle-même. `scrollHeight` du document contre la hauteur visible —
 * et la barre basse est RETIRÉE de la hauteur utile, parce qu'elle recouvre le
 * contenu : compter la place qu'elle occupe comme lisible surestimerait ce qui
 * tient d'une vue, et c'est justement le chiffre qu'on veut honnête.
 *
 * Le détail liste les enfants directs de l'écran, du plus haut au plus bas.
 * C'est lui qui sert : « cette page fait 2,4 écrans » ne dit pas quoi couper.
 */
const mesurer = async (nom) => {
  await page.waitForTimeout(400)
  const m = await page.evaluate(() => {
    const barre = document.querySelector('nav.barre')
    const hBarre = barre ? barre.getBoundingClientRect().height : 0
    const utile = window.innerHeight - hBarre
    const ecran = document.querySelector('.ecran') ?? document.body
    const blocs = [...ecran.children]
      .map((n) => ({
        quoi: (n.className || n.tagName).toString().split(' ').slice(0, 2).join('.') || n.tagName,
        px: Math.round(n.getBoundingClientRect().height),
      }))
      .filter((b) => b.px > 0)
      .sort((a, b) => b.px - a.px)
      .slice(0, 5)
    return {
      total: document.documentElement.scrollHeight,
      utile: Math.round(utile),
      blocs,
    }
  })
  const ecrans = m.total / m.utile
  return { nom, ...m, ecrans }
}

const releves = []
const relever = async (nom) => { releves.push(await mesurer(nom)) }

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

/* ─── LE DÉCOR ─────────────────────────────────────────────────────────────
   Une moto, une saison de cinq roulages, une dépense, une pièce d'équipement.
   C'est le pilote de la fin de sa première saison — celui dont les pages sont
   les plus longues, donc celui qui décide du travail. */
await relever('ACCUEIL · compte neuf')

await onglet('GARAGE')
await page.fill('.champ[placeholder="Honda"]', 'Yamaha')
await page.fill('.champ[placeholder="CBR 1000 RR"]', 'R6')
await page.fill('.champ[placeholder="2010"]', '2019')
await page.click('text=Déclarer ma moto')
await page.waitForSelector('.garage .modele', { timeout: 20_000 })
await page.click('text=Reprendre la saison 2026 · Pau-Arnos')
await page.waitForTimeout(1800)

// Une dépense, pour que le budget et l'onglet ANALYSE existent.
await onglet('ACCUEIL')
await page.click('.action-depense')
await page.waitForSelector('section.depense', { timeout: 20_000 })
await page.click('section.depense .puce:has-text("PNEUS")')
await page.fill('#montant', '389,90')
await page.fill('#libelle', 'Train avant')
await page.click('section.depense .bouton:not(.secondaire)')
await page.waitForSelector('.raccourci-depense', { timeout: 20_000 })
await relever('ACCUEIL · saison en cours')

// Une pièce d'équipement, pour l'inventaire ouvert.
await onglet('GARAGE')
await relever('GARAGE · replié')
await page.click('.atelier-tete:has-text("Budget ·")')
await relever('GARAGE · budget ouvert')
await page.click('.atelier-tete:has-text("Budget ·")')
await page.click('.atelier.equipement .atelier-tete')
await page.click('.atelier.equipement .lien:has-text("Déclarer une pièce")')
await page.fill('.champ[placeholder="Combinaison cuir"]', 'Casque Shoei X-SPR Pro')
await page.click('.bouton.secondaire:has-text("Déclarer")')
await page.waitForTimeout(600)
await relever('GARAGE · équipement ouvert')

await onglet('ROULAGES')
await page.waitForSelector('.glissable', { timeout: 20_000 })
await relever('ROULAGES · liste et bilan de saison')

// La plus ancienne des cinq : la seule dont on sache qu'elle est VÉCUE quel que
// soit le jour où l'instrument tourne, donc la seule qui ouvre un bilan et non un
// écran de préparation. On attend sa courbe, qui est ce que le bilan a de plus
// lent à venir — attendre le cadre arriverait avant le contenu qu'on mesure.
// « Passés » ne montre que les trois dernières : la plus ancienne est sous le
// pli, et il faut le déplier pour l'atteindre. C'est le lot 3 qui l'a mise là.
const reste = page.locator('.groupe-roulages .lien:has-text("Voir les")')
if (await reste.count()) await reste.first().click()
await page.click('.glissable:has-text("2026-04-18")')
await page.waitForSelector('.courbe', { timeout: 30_000 })
await relever("ROULAGES · le bilan d'une journée")
await onglet('ROULAGES')

await onglet('ANALYSE')
await page.waitForSelector('.analyse-ecran', { timeout: 20_000 })
await relever('ANALYSE · à l\'ouverture')

await onglet('COMPTE')
await page.waitForTimeout(600)
await relever('COMPTE')

/* ─── LE RELEVÉ ────────────────────────────────────────────────────────────
   Trié par ce qui coûte le plus, parce que c'est l'ordre dans lequel on
   travaille. Le nombre d'écrans est le chiffre qui compte ; les blocs disent
   par où. */
releves.sort((a, b) => b.ecrans - a.ecrans)
console.log(`\n  ═══ DÉFILEMENT À ${LARGEUR} × ${HAUTEUR} ═══`)
console.log(`  (hauteur utile = fenêtre moins la barre basse, qui recouvre le contenu)\n`)
for (const r of releves) {
  const verdict = r.ecrans <= 1.05 ? 'tient' : `${r.ecrans.toFixed(2)} écrans`
  console.log(`  ${verdict.padEnd(12)} ${r.nom}`)
  console.log(`  ${''.padEnd(12)} ${r.total} px pour ${r.utile} px utiles`)
  for (const b of r.blocs) console.log(`  ${''.padEnd(14)}· ${String(b.px).padStart(4)} px  ${b.quoi}`)
  console.log('')
}
const debordent = releves.filter((r) => r.ecrans > 1.05)
console.log(`  ${debordent.length} surface(s) sur ${releves.length} dépassent une vue.\n`)

await nav.close()
