// LA FICHE D'UN CIRCUIT — et l'ordre de ses blocs, qui est la vraie décision.
//
// Elle s'ouvre sur CE QUE LE PILOTE Y A FAIT, pas sur les caractéristiques du
// circuit. Le référentiel descend par la synchronisation et il est vide tant que
// la récolte n'a pas tourné : une fiche qui s'ouvrirait sur « longueur : —,
// virages : — » serait un écran mort qu'on n'ouvre plus, et il le resterait le
// jour où les données arrivent.
//
// Cet essai tourne SANS COMPTE, donc sans référentiel — c'est-à-dire dans l'état
// exact du premier jour, celui qui doit rester utile.
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

// Deux journées au même circuit, avec deux chronos : de quoi mesurer un écart.
await page.click('nav.barre .onglet:has-text("GARAGE")')
await page.click('text=Reprendre la CBR 83')
await page.waitForSelector('.garage-titre', { timeout: 15_000 })
await page.click('text=Reprendre la saison 2026 · Pau-Arnos')
await page.waitForTimeout(1500)

await page.click('nav.barre .onglet:has-text("ROULAGES")')
await page.waitForSelector('.pile > .bloc', { timeout: 20_000 })
// Le plus ancien est en bas : c'est celui qui porte le premier chrono.
await page.click('.pile > .bloc >> nth=1')
await page.waitForSelector('text=Meilleur tour du jour', { timeout: 20_000 })

verifier('① la fiche s\'ouvre depuis la journée',
  await page.isVisible('text=Ce que tu sais de ce circuit'))
await page.click('text=Ce que tu sais de ce circuit')
await page.waitForSelector('.circuit-page', { timeout: 20_000 })

const fiche = await texte('.circuit-page')
verifier('② elle nomme le circuit', fiche.includes('Pau-Arnos'), fiche.slice(0, 80))

// ── L'ORDRE : ce qui est à lui vient AVANT ce qui vient du référentiel.
const chiffres = await texte('.circuit-page .chiffres')
verifier('③ elle s\'ouvre sur ce que TU y as fait', /journées/.test(chiffres), chiffres)
verifier('   les journées sont comptées', /journées\s*[1-9]/.test(chiffres), chiffres)
verifier('   le meilleur tour est là', /\d'\d\d"\d/.test(chiffres), chiffres)

// L'écart depuis la première fois est un FAIT, avec son signe. Jamais une cible.
verifier('④ l\'écart depuis la première porte son signe', /[−+]\d+"\d/.test(chiffres), chiffres)
const cibles = ['objectif', 'il te reste', 'à battre', 'vise ', 'cible']
verifier('   et aucun objectif nulle part',
  !cibles.some((m) => fiche.toLowerCase().includes(m)),
  cibles.filter((m) => fiche.toLowerCase().includes(m)).join(', '))

// ── Sans compte, le référentiel n'est pas descendu : la fiche le DIT.
verifier('⑤ le référentiel absent est dit, pas laissé vide',
  fiche.includes('ne connaît pas encore ce circuit'), fiche.slice(-160))
verifier('   et elle reste utile quand même',
  /journées\s*[1-9]/.test(chiffres))

await page.screenshot({ path: process.argv[2] ?? '/tmp/circuit-fiche.png', fullPage: true })

// Retour : la fiche n'est pas un cul-de-sac.
await page.click('.circuit-page .lien:has-text("retour")')
await page.waitForSelector('text=Meilleur tour du jour', { timeout: 20_000 })
verifier('⑥ le retour ramène à la journée', true)

verifier('aucune erreur de console', erreurs.length === 0, erreurs.join(' | '))
await nav.close()

if (manques.length) {
  console.error(`\n✗ ${manques.length} vérification(s) en échec :\n  · ${manques.join('\n  · ')}`)
  process.exit(1)
}
console.log('\n✓ la fiche est utile avant que le référentiel existe')
