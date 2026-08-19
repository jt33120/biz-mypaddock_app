// L'écran de confirmation, tel qu'un pilote le voit après « Créer mon compte ».
// On n'appelle PAS Supabase : on force l'étape via une inscription refusée serait
// fragile. On vérifie donc le rendu en pilotant l'état par le formulaire réel.
import { chromium } from 'playwright-core'
const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })

// Supabase est injoignable depuis ce test : on coupe le réseau vers lui pour que
// l'inscription échoue proprement et qu'on voie le message d'erreur réel.
await page.route('**/auth/v1/signup*', r => r.fulfill({
  status: 200, contentType: 'application/json',
  body: JSON.stringify({ user: { id: 'x', email: 'julian@exemple.fr' }, session: null }),
}))

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

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await page.waitForFunction(() => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })
await onglet('COMPTE')
await page.fill('#email', 'julian@exemple.fr')
await page.fill('#mdp', 'motdepasse')
await page.click('section.compte .bouton')
await page.waitForSelector('text=Le compte est créé', { timeout: 15_000 })
console.log('écran :', (await page.textContent('section.compte')).replace(/\s+/g, ' ').slice(0, 320))
console.log('bouton principal :', await page.textContent('section.compte > .bouton'))
await page.screenshot({ path: process.argv[2] ?? '/tmp/conf.png', fullPage: true })
console.log('erreurs :', erreurs.length ? erreurs : 'aucune')
await nav.close()
