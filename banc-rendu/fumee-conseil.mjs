// Récit 6.3 — le conseil déterministe, l'invite UNIQUE, et le plan gardé MOT POUR MOT.
import { chromium } from 'playwright-core'
const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))
// Compte et Sonde ne sont plus des onglets : ce sont des liens de tête, parce
// qu'un réglage et un instrument ne sont pas des destinations du produit.
// Compte et Sonde ne sont plus des onglets : ce sont des liens en TÊTE DE
// L'ACCUEIL, parce qu'un réglage et un instrument ne sont pas des destinations.
const onglet = async (n) => {
  const bas = `nav.barre .onglet:has-text("${n}")`
  if (await page.isVisible(bas)) return page.click(bas)
  await page.click('nav.barre .onglet:has-text("ACCUEIL")')
  return page.click(`.tete .reglages .lien:has-text("${n.toLowerCase()}")`)
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

// Le conseil doit être là dès l'ouverture, sans donnée.
const c1 = await page.textContent('.conseil .texte')
console.log('① conseil :', c1.slice(0, 80))

// Déterminisme : deux ouvertures le même jour donnent le même conseil.
await page.reload({ waitUntil: 'networkidle' }); await pret()
console.log('   déterministe :', (await page.textContent('.conseil .texte')) === c1 ? 'oui' : 'NON')

// Un roulage, puis des sessions — l'invite n'apparaît qu'à la quatrième.
await page.click('text=Saisir mon premier roulage')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Pau-Arnos')
await page.click('text=Continuer')
for (let i = 0; i < 3; i++) {
  await enregistrerSession()
  if (i < 2) await page.click('text=Saisir une session')
}
await onglet('ACCUEIL')
console.log('② à 3 sessions — invite :', await page.isVisible('text=Une phrase, une seule fois'))

await onglet('ROULAGES'); await page.click('.bloc')
await page.click('text=Saisir une session')
await enregistrerSession()
await onglet('ACCUEIL')
await page.waitForSelector('text=Une phrase, une seule fois', { timeout: 10_000 })
console.log('③ à 4 sessions — invite : oui')

// Le plan est gardé MOT POUR MOT — ponctuation, majuscules, accents compris.
const PHRASE = "si je me fais rattraper, ALORS je lève et je le laisse passer — pas d'ego"
await page.fill('.conseil .champ', PHRASE)
await page.click('text=Garder cette phrase')
await page.waitForSelector('.plan-pose', { timeout: 10_000 })
const garde = await page.textContent('.plan-pose .texte')
console.log('④ mot pour mot :', garde === PHRASE ? 'oui' : `NON — « ${garde} »`)

// L'invite ne revient pas.
await page.reload({ waitUntil: 'networkidle' }); await pret()
console.log('⑤ invite après plan posé :', await page.isVisible('text=Une phrase, une seule fois'))

// Aucune notification, jamais — la contre-mesure C1.
const notif = await page.evaluate(() => ({
  demandee: window.__notifDemandee === true,
  permission: typeof Notification !== 'undefined' ? Notification.permission : 'absent',
}))
console.log('⑥ notifications :', JSON.stringify(notif), '(permission jamais demandée)')

await page.screenshot({ path: process.argv[2] ?? '/tmp/cons.png', fullPage: true })
console.log('erreurs :', erreurs.length ? erreurs : 'aucune')
await nav.close()
