// Épique 3 — verser une photo hors ligne, déclarer un geste, et vérifier les
// deux pièges silencieux : le plafond de canevas iOS et le type du blob.
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))
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

// Un roulage, hors ligne dès le départ.
await page.context().setOffline(true)
await page.click('text=Saisir mon premier roulage')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Pau-Arnos')
await page.click('text=Continuer')
await enregistrerSession()
await page.waitForSelector('text=Photos et gestes')
console.log('① bloc photos présent, hors ligne : oui')

// UNE VRAIE PHOTO D'IPHONE : 8064 × 6048 = 48,8 Mpx, soit trois fois le plafond
// de canevas de Safari. C'est le cas NOMINAL, pas le cas limite.
const grande = '/private/tmp/claude-501/-Users-juliantalou-Documents-PRO-03-PROJECTS-MyPaddock3/40a4a422-990d-4b2a-ae97-416403e70311/scratchpad/grande.jpg'
await page.setInputFiles('input[type=file]', grande)
await page.waitForSelector('.vignette', { timeout: 60_000 })
const v = await page.$eval('.vignette', n => ({ src: n.src.slice(0, 5), w: n.naturalWidth, h: n.naturalHeight }))
console.log('② photo de 48,8 Mpx versée hors ligne :', JSON.stringify(v))
console.log('   servie depuis la copie locale (blob:) :', v.src === 'blob:' ? 'oui' : 'NON')
console.log('   réduite sous le plafond canevas :', v.w * v.h < 16_777_216 ? `oui (${(v.w*v.h/1e6).toFixed(1)} Mpx)` : 'NON')

// Le type du blob se vérifie APRÈS COUP, pas d'après le format demandé.
const t = await page.evaluate(async () => {
  const r = await (await navigator.storage.getDirectory()).getDirectoryHandle('photos')
  const noms = []
  for await (const [n] of r.entries()) noms.push(n)
  const f = await (await r.getFileHandle(noms[0])).getFile()
  return { nom: noms[0], type: f.type, ko: Math.round(f.size / 1024) }
})
console.log('③ copie locale dans l\'OPFS :', JSON.stringify(t))
console.log('   extension conforme au type réel :', t.nom.endsWith(t.type.split("/")[1] === 'jpeg' ? 'jpg' : t.type.split("/")[1]) ? 'oui' : 'NON')

// Le geste — déclaratif, et sans photo obligatoire.
await page.click('text=Déclarer un geste')
await page.click('.puce:has-text("GENOU GAUCHE POSÉ")')
await page.waitForSelector('.fait', { timeout: 10_000 })
console.log('④ geste déclaré :', await page.textContent('.fait'))

// Aucun mot de récompense nulle part.
const txt = (await page.textContent('.ecran')).toLowerCase()
const decerne = ['bravo', 'félicitation', 'débloqué', 'trophée', 'badge', 'médaille', 'points', '⭐', '🔥']
  .filter(m => txt.includes(m))
console.log('⑤ énoncer et non décerner :', decerne.length ? 'FAUTE ' + decerne : 'aucun mot de récompense')

await page.screenshot({ path: process.argv[2] ?? '/tmp/ph.png', fullPage: true })
console.log('erreurs :', erreurs.length ? erreurs : 'aucune')
await nav.close()
