// Le sélecteur de circuits — demande de Julian : « quand j'entre un roulage,
// liste déroulante des circuits les plus connus en france ».
//
// Cinq clauses s'y vérifient, et quatre ne se voient QUE de bout en bout :
//   ① la liste existe hors ligne, base locale vide, avant tout compte
//   ② un alias trouve le circuit, mais c'est le NOM qui est écrit
//   ③ un circuit absent de la liste reste saisissable, mot pour mot
//   ④ deux orthographes du même circuit se comparent — la progression survit
//   ⑤ la PWA n'écrit RIEN dans le référentiel (AD-12)
import { chromium } from 'playwright-core'

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))

const pret = () => page.waitForFunction(() => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })
const onglet = async (n) => {
  const bas = `nav.barre .onglet:has-text("${n}")`
  if (await page.isVisible(bas)) return page.click(bas)
  await page.click('nav.barre .onglet:has-text("ACCUEIL")')
  return page.click(`.tete .reglages .lien:has-text("${n.toLowerCase()}")`)
}
const propositions = () => page.$$eval('.circuit .nom', ns => ns.map(n => n.textContent))
const champ = '.champ[placeholder="Pau-Arnos"]'
const taper = async (t) => {
  await page.fill(champ, t)
  // Les propositions arrivent d'une requête : sans ce répit on lit l'état
  // précédent, et l'essai passerait pour la mauvaise raison.
  await page.waitForTimeout(250)
}

// FR-36 : la fin d'une saisie ouvre le récapitulatif, pas le bilan.
const enregistrerSession = async () => {
  await page.click('text=Enregistrer la session')
  await page.waitForFunction(() =>
    !!document.querySelector('section.recap .recap-image')
    || document.body.textContent.includes('Meilleur tour du jour'), null, { timeout: 40_000 })
  if (await page.isVisible('section.recap')) {
    await page.click('text=Retour au roulage')
    await page.waitForSelector('text=Meilleur tour du jour', { timeout: 20_000 })
  }
  await page.waitForSelector('.bloc:has-text("Photos et gestes")', { timeout: 20_000 })
  await page.waitForTimeout(500)
}

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

// ── ① Hors ligne, base vide, aucun compte : la liste est déjà là.
await page.click('text=Saisir mon premier roulage')
await page.waitForSelector(champ)
await page.waitForTimeout(250)
const depart = await propositions()
console.log('① sans réseau ni compte :', depart.join(' · '))
console.log('   Pau-Arnos proposé :', depart.includes('Pau-Arnos') ? 'oui' : 'NON — repli embarqué absent')
console.log('   liste bornée :', depart.length <= 6 ? `oui (${depart.length})` : `NON (${depart.length})`)

// ── ② L'alias cherche, le nom s'écrit.
await taper('val de vienne')
console.log('② « val de vienne » →', (await propositions()).join(' · '))
await taper('ledenon')
console.log('   « ledenon » sans accent →', (await propositions()).join(' · '))
await taper('PAU')
console.log('   « PAU » en capitales →', (await propositions()).join(' · '))

await page.click('.circuit:has-text("Pau-Arnos")')
const ecrit = await page.inputValue(champ)
console.log('   choisi → champ :', ecrit, ecrit === 'Pau-Arnos' ? '(nom, pas alias)' : '← NON')

await page.click('text=Continuer')
await page.waitForSelector('.molettes', { timeout: 10_000 })
await enregistrerSession()

// ── ④ Un second roulage, même circuit, ORTHOGRAPHE LIBRE : la progression
//    doit continuer de se calculer. C'est la clause qui casse en silence.
await onglet('ROULAGES')
await page.click('text=Saisir un roulage')
await taper('pau arnos')
console.log('④ « pau arnos » tapé à la main — propositions :', (await propositions()).join(' · '))
await page.click('text=Continuer')
await page.waitForSelector('.molettes', { timeout: 10_000 })
await enregistrerSession()
const bilan = (await page.textContent('.ecran')).replace(/\s+/g, ' ')
console.log('   titre du bilan :', await page.textContent('h1.titre'))
console.log('   à circuit constant :',
  bilan.includes('À circuit constant') ? 'oui — les deux orthographes se rapprochent'
  : bilan.includes('Premier chrono sur ce circuit') ? 'NON — CLAUSE VIOLÉE, la progression a disparu' : '?')

// ── ③ Un circuit qui n'est dans aucune liste reste saisissable, mot pour mot.
const INEDIT = 'Circuit privé du Val Fleuri'
await onglet('ROULAGES')
await page.click('text=Saisir un roulage')
await taper(INEDIT)
console.log('③ circuit inédit — propositions :', JSON.stringify(await propositions()))
console.log('   bouton actif :', await page.isEnabled('text=Continuer'))
await page.click('text=Continuer')
await page.waitForSelector('.molettes', { timeout: 10_000 })
await enregistrerSession()
console.log('   conservé mot pour mot :', (await page.textContent('h1.titre')) === INEDIT ? 'oui' : 'NON')

// Et il revient en tête des propositions, marqué comme sien.
await onglet('ROULAGES')
await page.click('text=Saisir un roulage')
await page.waitForTimeout(250)
const retour = await propositions()
console.log('   revient en tête :', retour[0] === INEDIT ? 'oui' : `NON — ${retour[0]}`)
console.log('   marqués « déjà roulé » :',
  await page.$$eval('.circuit', ns => ns.filter(n => n.textContent.includes('déjà roulé')).length))
await page.screenshot({ path: process.argv[2] ?? '/tmp/circuit.png', fullPage: true })

// ── ⑤ AD-12 : la PWA n'a rien écrit dans le référentiel.
await page.click('text=Annuler')
await onglet('SONDE')
await page.click('text=Compter ce qui a survécu')
await page.waitForSelector('text=/persisté :/', { timeout: 15_000 })
const compte = await page.textContent('.plat.pile')
const m = compte.match(/(\d+) circuits en référentiel/)
console.log('⑤ référentiel local :', m ? `${m[1]} circuit(s)` : 'illisible',
  m && m[1] === '0' ? '— aucune écriture, AD-12 tenu' : '— À VÉRIFIER')

console.log('erreurs :', erreurs.length ? erreurs : 'aucune')
await nav.close()
