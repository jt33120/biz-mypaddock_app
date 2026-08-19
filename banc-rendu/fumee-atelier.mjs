// Épique 8 — l'axe machine prend ses écrans.
//
// La clause qui compte est FR-46, et c'est une clause de SÉCURITÉ : les trois
// catégories ne cohabitent JAMAIS dans une même liste. Si « plaquettes en fin de
// vie » s'affiche à côté de « sticker décollé », l'élément de sécurité hérite du
// caractère repoussable du cosmétique. L'essai le vérifie à l'écran, pas dans
// l'intention.
import { chromium } from 'playwright-core'

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))
const pret = () => page.waitForFunction(() => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })
const PHOTO = '/private/tmp/claude-501/-Users-juliantalou-Documents-PRO-03-PROJECTS-MyPaddock3/40a4a422-990d-4b2a-ae97-416403e70311/scratchpad/grande.jpg'

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()
await page.click('nav.barre .onglet:has-text("GARAGE")')
await page.click('text=Reprendre la CBR 83')
await page.waitForSelector('.garage .sprite', { timeout: 20_000 })

// ── ① Trois blocs, séparés, présents dès le départ.
const blocs = await page.$$eval('.atelier', ns => ns.map(n => n.className))
console.log('① blocs d\'atelier :', blocs.length, blocs.map(c => c.split(' ').pop()).join(' · '))

// ── Un ENTRETIEN consigné au moment du geste, sans montant (FR-43).
await page.click('.atelier.entretien .atelier-tete')
await page.click('.atelier.entretien >> text=Consigner un geste')
await page.fill('.atelier.entretien .champ[placeholder="Plaquettes avant"]', 'Plaquettes avant')
await page.click('.atelier.entretien >> text=C\'est fait aujourd\'hui')
await page.waitForSelector('.atelier.entretien .ligne-atelier', { timeout: 10_000 })
console.log('② consigné SANS montant :',
  (await page.textContent('.atelier.entretien .ligne-atelier')).replace(/\s+/g, ' '))
console.log('   ni zéro ni tiret sur le montant :',
  /0 €|—\s*€/.test(await page.textContent('.atelier.entretien')) ? 'NON' : 'oui')

// ── Une PIÈCE ACHETÉE, non montée : un état de première classe (FR-45).
await page.click('.atelier.entretien >> text=Consigner un geste')
await page.fill('.atelier.entretien .champ[placeholder="Plaquettes avant"]', 'Chaîne et couronne')
await page.fill('.atelier.entretien .champ[placeholder="montant, si tu l\'as"]', '145,90')
await page.click('text=Acheté, pas encore monté')
await page.waitForFunction(() => document.body.textContent.includes('Chaîne et couronne'), null, { timeout: 10_000 })
console.log('③ pièce achetée non montée :',
  (await page.textContent('.atelier.entretien')).replace(/\s+/g, ' ').slice(0, 120))
console.log('   aucune échéance, aucun compte à rebours :',
  /jours? restants?|échéance|en retard|urgent/i.test(await page.textContent('.atelier.entretien')) ? 'NON' : 'oui')

// ── ④ Une RÉPARATION NON VITALE née d'une photo, sans rien remplir (FR-47).
await page.click('.atelier.reparation_non_vitale .atelier-tete')
await page.setInputFiles('.atelier.reparation_non_vitale input[type=file]', PHOTO)
await page.waitForSelector('.atelier.reparation_non_vitale .ligne-atelier', { timeout: 60_000 })
console.log('④ née d\'une photo, sans autre saisie :',
  (await page.textContent('.atelier.reparation_non_vitale .ligne-atelier')).replace(/\s+/g, ' '))

// ── ⑤ FR-46 : LA CLAUSE DE SÉCURITÉ, vérifiée bloc par bloc ET globalement.
//    Le composant est un accordéon : une seule catégorie dépliée à la fois,
//    ce qui rend le mélange structurellement impossible plutôt que seulement
//    évité. On vérifie les deux : le contenu de chaque bloc, et le fait qu'un
//    seul soit ouvert.
const contenu = async (cat) => (await page.textContent(`.atelier.${cat}`)).replace(/\s+/g, ' ')

const rep = await contenu('reparation_non_vitale')
console.log('⑤ réparations ouvertes — contiennent « À regarder » :', rep.includes('À regarder'))
console.log('   et PAS « Plaquettes avant » :', rep.includes('Plaquettes avant') ? 'NON — CLAUSE VIOLÉE' : 'oui')

await page.click('.atelier.entretien .atelier-tete')
await page.waitForTimeout(400)
const ent = await contenu('entretien')
console.log('   entretien ouvert — contient « Plaquettes avant » :', ent.includes('Plaquettes avant'))
console.log('   et PAS « À regarder » :', ent.includes('À regarder') ? 'NON — CLAUSE VIOLÉE' : 'oui')

const ouverts = await page.$$eval('.atelier',
  ns => ns.filter(n => n.querySelector('.ligne-atelier') || n.querySelector('.note')).length)
console.log('   listes dépliées simultanément :', ouverts,
  ouverts <= 1 ? '— le mélange est structurellement impossible' : '← DEUX LISTES À LA FOIS')

// ── ⑥ « C'est fait aujourd'hui » sur ce qui attendait.
await page.click('.atelier.entretien button.lien:has-text("aujourd")')
await page.waitForTimeout(700)
const apres = await contenu('entretien')
console.log('⑥ posé d\'un tap :', /Cha\u00eene et couronne.*\d{4}-\d{2}-\d{2}/.test(apres) ? 'daté' : apres.slice(0, 90))
console.log('   la dépense l\'a suivi :', apres.includes('145,90') ? 'oui' : 'NON')
console.log('   plus rien en attente :', apres.includes('en attente') ? 'NON' : 'oui')

// ── ⑦ L'argent consigné à l'atelier compte dans ce que la machine a coûté —
//    et UNE SEULE FOIS. Le garage annonçait « — » alors que 145,90 € venaient
//    d'être saisis : les deux portes de l'argent ne se rejoignaient nulle part.
const chiffres = (await page.textContent('.garage .chiffres')).replace(/\s+/g, ' ')
console.log('⑦ ce qu\'elle a coûté :', chiffres)
console.log('   l\'atelier y entre :', chiffres.includes('145,90') ? 'oui' : 'NON')
console.log('   compté une seule fois :', (chiffres.match(/145,90/g) ?? []).length === 1 ? 'oui' : 'NON')

await page.screenshot({ path: process.argv[2] ?? '/tmp/atelier.png', fullPage: true })
console.log('erreurs :', erreurs.length ? erreurs : 'aucune')
await nav.close()
process.exit(erreurs.length ? 1 : 0)
