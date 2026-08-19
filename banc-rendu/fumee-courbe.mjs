// Épique 11 — la courbe de progression, FR-20.
//
// Elle s'allume sur une CONDITION OBSERVABLE — trois roulages chronométrés sur
// le même circuit — jamais sur une date. Et trois choses qu'elle ne fait pas
// comptent autant que ce qu'elle fait : aucune projection, aucune comparaison
// entre circuits, aucune cible.
import { chromium } from 'playwright-core'

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))
const pret = () => page.waitForFunction(() => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

// ── ① Avec UN seul roulage, aucune courbe — et rien ne dit qu'il en manque.
await page.click('text=Saisir mon premier roulage')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Pau-Arnos')
await page.click('text=Continuer')
await page.click('text=Enregistrer la session')
await page.waitForFunction(() =>
  !!document.querySelector('section.recap .recap-image')
  || document.body.textContent.includes('Meilleur tour du jour'), null, { timeout: 40_000 })
if (await page.isVisible('section.recap')) await page.click('text=Retour au roulage')
await page.waitForSelector('text=Meilleur tour du jour', { timeout: 20_000 })
const un = (await page.textContent('.ecran')).replace(/\s+/g, ' ')
console.log('① un roulage — courbe :', await page.isVisible('.courbe') ? 'NON, elle s\'allume trop tôt' : 'absente')
console.log('   rien n\'annonce ce qui manque :',
  /encore \d|il te faut|à partir de trois|plus que/i.test(un) ? 'NON' : 'oui')

// ── ② La saison de Julian : quatre roulages à Pau-Arnos, 2'10 → 1'38.
await page.click('nav.barre .onglet:has-text("GARAGE")')
await page.fill('.champ[placeholder="Honda"]', 'Honda')
await page.fill('.champ[placeholder="CBR 1000 RR"]', 'CBR 1000 RR · 83')
await page.click('text=Déclarer ma machine')
await page.waitForSelector('.garage .modele', { timeout: 20_000 })
await page.click('text=Reprendre la saison 2026 · Pau-Arnos')
await page.waitForTimeout(1500)

await page.click('nav.barre .onglet:has-text("ROULAGES")')
await page.click('.bloc:has-text("Pau-Arnos")')
await page.waitForSelector('.courbe', { timeout: 20_000 })
const c = (await page.textContent('.courbe')).replace(/\s+/g, ' ')
console.log('② courbe allumée :', c)

const svg = await page.$eval('.courbe .trace', n => ({
  points: n.querySelectorAll('rect').length,
  polyline: !!n.querySelector('polyline'),
  crisp: n.querySelector('polyline')?.getAttribute('shape-rendering'),
  records: [...n.querySelectorAll('rect')].filter(r => r.getAttribute('fill').includes('record')).length,
  alt: n.getAttribute('aria-label'),
}))
console.log('   un point par roulage :', svg.points, '· tracé :', svg.polyline, '·', svg.crisp)
console.log('   records violets :', svg.records, '(chaque tour bat le précédent, sauf le premier)')
console.log('   lisible sans voir :', svg.alt.slice(0, 96))

// ── ③ CE QU'ELLE NE FAIT PAS.
// LE SENS DE L'AXE, vérifié sur les COORDONNÉES et non sur la légende. La
// première version plaçait le meilleur tour en haut : le tracé MONTAIT à mesure
// que le pilote progressait, juste au-dessus d'une phrase disant « plus le tracé
// descend, plus le tour est rapide ». Seule la capture le montrait, et un dessin
// qui contredit sa légende est pire qu'un dessin sans légende : on croit le dessin.
const axe = await page.$eval('.courbe .trace', n => {
  const ys = [...n.querySelectorAll('rect')]
    .map(e => ({ x: +e.getAttribute('x'), y: +e.getAttribute('y') }))
    .sort((a, b) => a.x - b.x).map(p => p.y)
  // Les chronos, dans le même ordre, lus sur l'étiquette d'accessibilité.
  const ms = n.getAttribute('aria-label').split(': ')[1].split(', ')
    .map(t => { const m = t.match(/(\d+)'(\d+)"(\d)/); return +m[1]*60000 + +m[2]*1000 + +m[3]*100 })
  const iRapide = ms.indexOf(Math.min(...ms)), iLent = ms.indexOf(Math.max(...ms))
  return { basEstRapide: ys[iRapide] > ys[iLent], yRapide: ys[iRapide], yLent: ys[iLent] }
})
console.log('   axe littéral — le tour le plus RAPIDE est le plus BAS :',
  axe.basEstRapide ? 'oui' : `NON — le tracé contredit sa légende (${JSON.stringify(axe)})`)

console.log('③ aucune projection, aucune cible :',
  /objectif|cible|tendance|à ce rythme|prévu|estimation/i.test(c) ? 'NON — CLAUSE VIOLÉE' : 'oui')
console.log('   le sens de lecture est dit :', c.includes('descend') ? 'oui' : 'NON')

// ── ④ Un autre circuit ne partage jamais l'axe.
await page.click('nav.barre .onglet:has-text("ROULAGES")')
await page.click('text=Saisir un roulage')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Nogaro')
await page.click('text=Continuer')
await page.click('text=Enregistrer la session')
await page.waitForFunction(() =>
  !!document.querySelector('section.recap .recap-image')
  || document.body.textContent.includes('Meilleur tour du jour'), null, { timeout: 40_000 })
if (await page.isVisible('section.recap')) await page.click('text=Retour au roulage')
await page.waitForSelector('text=Meilleur tour du jour', { timeout: 20_000 })
console.log('④ à Nogaro, un roulage — courbe :',
  await page.isVisible('.courbe') ? 'NON — LES CIRCUITS SE MÉLANGENT' : 'absente, correct')

await page.click('nav.barre .onglet:has-text("ROULAGES")')
await page.click('.bloc:has-text("Pau-Arnos")')
await page.waitForSelector('.courbe', { timeout: 20_000 })
console.log('   et Pau-Arnos garde la sienne :', await page.isVisible('.courbe'))
console.log('   toujours', (await page.$$eval('.courbe .trace rect', n => n.length)), 'points — Nogaro n\'y est pas entré')

await page.screenshot({ path: process.argv[2] ?? '/tmp/courbe.png', fullPage: true })
console.log('erreurs :', erreurs.length ? erreurs : 'aucune')
await nav.close()
process.exit(erreurs.length ? 1 : 0)
