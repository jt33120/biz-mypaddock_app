// Récit 6.3 — le conseil déterministe. ET LA PREUVE QUE L'INVITE A DISPARU.
//
// Le plan si-alors est retiré sur retour de Julian : « ça fait un peu gamin,
// personne va prendre le temps de le remplir… là l'effet c'est : c'est quoi
// cette merde ». C'était l'intervention la mieux étayée du dossier (d ≈ 0,65 sur
// 94 essais) et elle est partie quand même — parce que son efficacité tient à ce
// que la phrase soit formulée par la personne, et qu'une invite qui produit du
// rejet ne produit aucune phrase.
//
// L'essai ne vérifie donc plus qu'elle apparaît au bon moment : il vérifie
// qu'elle N'APPARAÎT JAMAIS, à aucun nombre de sessions. Une fonctionnalité
// retirée sans assertion est une fonctionnalité qui revient à la première
// fusion distraite.
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
const invite = async () => await page.isVisible('text=Une phrase, une seule fois')
console.log('② à 3 sessions — invite :', await invite() ? 'NON — présente, retirée à tort' : 'absente')

// Le seuil de l'ancienne invite était QUATRE sessions saisies. On le franchit
// exprès : c'est le seul point où elle serait réapparue.
await onglet('ROULAGES'); await page.click('.bloc')
await page.click('text=Saisir une session')
await enregistrerSession()
await onglet('ACCUEIL')
console.log('③ à 4 sessions — invite :', await invite() ? 'NON — présente, retirée à tort' : 'absente')

// Et rien ne l'a remplacée par un autre champ à remplir : l'accueil ne réclame
// aucune saisie de texte au pilote. Le conseil se lit, il ne se remplit pas.
console.log('④ aucun champ à remplir sur l\'accueil :',
  await page.isVisible('.conseil .champ') ? 'NON — UN CHAMP EST REVENU' : 'oui')

// Le conseil, lui, est TOUJOURS là — c'est la moitié du récit qui reste.
await page.reload({ waitUntil: 'networkidle' }); await pret()
console.log('⑤ conseil toujours présent :', await page.isVisible('.conseil .texte') ? 'oui' : 'NON')

// Aucune notification, jamais — la contre-mesure C1.
const notif = await page.evaluate(() => ({
  demandee: window.__notifDemandee === true,
  permission: typeof Notification !== 'undefined' ? Notification.permission : 'absent',
}))
console.log('⑥ notifications :', JSON.stringify(notif), '(permission jamais demandée)')

await page.screenshot({ path: process.argv[2] ?? '/tmp/cons.png', fullPage: true })
await nav.close()
sortir(erreurs)
