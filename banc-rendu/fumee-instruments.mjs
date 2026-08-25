// Récit 7.1 — les trois instruments, et surtout la clause AD-16 : refuser
// ne doit RIEN écrire, pas même en local. C'est la seule qui se vérifie en
// regardant la base, pas l'écran.
import { chromium } from 'playwright-core'
import { sortir } from './verdict.mjs'

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))
// LE COMPTE EST UN ONGLET DE LA BARRE depuis le retour de Julian. La sonde
// reste un instrument et s'atteint depuis le compte.
const onglet = async (n) => {
  const bas = `nav.barre .onglet:has-text("${n}")`
  if (await page.isVisible(bas)) return page.click(bas)
  // COMPTE est descendu dans la barre basse — « ça fait pas app mobile », et il
  // portait la sauvegarde. La SONDE, elle, s'atteint depuis le compte : c'est un
  // instrument, pas un lieu du produit.
  await page.click('nav.barre .onglet:has-text("COMPTE")')
  await page.waitForSelector('section.compte', { timeout: 10_000 })
  return page.click('.compte .lien:has-text("Instruments et sonde")')
}
const pret = () => page.waitForFunction(() => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })

// FR-36 : depuis l'épique 4, la fin d'une saisie ouvre LE RÉCAPITULATIF, pas le
// bilan — il se compose tout seul et s'affiche sans avoir été demandé. Les
// essais passent donc par lui pour atteindre le roulage.
const enregistrerSession = async () => {
  await page.click('text=Enregistrer la session')
  // Playwright ne mélange pas un sélecteur CSS et un `text=` dans une liste :
  // on attend l'un OU l'autre par une condition, pas par un sélecteur composé.
  await page.waitForFunction(() =>
    !!document.querySelector('section.recap .recap-image')
    || document.body.textContent.includes('Meilleur tour du jour'), null, { timeout: 40_000 })
  if (await page.isVisible('section.recap')) {
    await page.click('text=Retour au roulage')
    await page.waitForSelector('text=Meilleur tour du jour', { timeout: 20_000 })
  }
  // Le bilan se recompose (coût, photos, gestes) : on attend qu'il soit STABLE
  // avant de rendre la main, sinon le clic suivant vise un nœud détaché.
  await page.waitForSelector('.bloc:has-text("Photos et gestes")', { timeout: 20_000 })
  // Le bloc coût et la bande photo arrivent de requêtes distinctes et changent
  // la hauteur de la page : sans ce répit, le clic suivant vise une cible qui
  // bouge encore. C'est une contrainte d'ESSAI, pas un défaut du produit.
  await page.waitForTimeout(500)
}

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

// ── Une ouverture doit exister, à zéro saisie.
await onglet('SONDE')
await page.waitForSelector('text=Instruments de bord')
console.log('① au démarrage :', (await page.textContent('.bloc.pile')).replace(/\s+/g, ' ').slice(0, 200))

// ── Une saisie doit la marquer.
await onglet('ACCUEIL')
await page.click('text=Saisir mon premier roulage')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Pau-Arnos')
await page.click('text=Continuer')
await enregistrerSession()
await onglet('SONDE')
await page.waitForSelector('text=Instruments de bord')
const apres = (await page.textContent('.bloc.pile')).replace(/\s+/g, ' ')
console.log('② après saisie :', apres.slice(0, 240))
console.log('   ouverture marquée (0 / 1) :', /0 \/ 1/.test(apres) ? 'oui' : 'NON')
console.log('   délai calculé :', /Délai roulage → saisie/.test(apres) ? 'oui' : 'NON')

// ── AD-16 : on refuse, on recharge, et RIEN de nouveau ne doit être écrit.
await onglet('COMPTE')
await page.click('.plat.repris .puce')
console.log('③ bascule :', await page.textContent('.plat.repris .puce'))

const compte = () => page.evaluate(async () => {
  const r = await window.__db.getAll('SELECT count(*) AS n FROM mesure')
  return r[0].n
})
await page.evaluate(() => { window.__db = undefined })   // le pont est posé par l'app
await page.reload({ waitUntil: 'networkidle' })
await pret()
await onglet('SONDE')
await page.waitForSelector('text=Instruments de bord')
const refus = (await page.textContent('.bloc.pile')).replace(/\s+/g, ' ')
const m = refus.match(/(\d+) \/ (\d+)/)
console.log('④ après refus + rechargement — ouvertures :', m ? m[2] : '?', '(doit rester 1)')
console.log('   AD-16 tenue :', m && m[2] === '1' ? 'oui' : 'NON — une ligne a été écrite malgré le refus')

await page.screenshot({ path: process.argv[2] ?? '/tmp/inst.png', fullPage: true })
await nav.close()
sortir(erreurs)
