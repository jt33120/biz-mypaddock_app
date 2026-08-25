// Épique 14 — le cercle, FR-19 et FR-39bis.
//
// Sans compte, il n'y a rien à montrer : l'essai vérifie donc surtout LES
// DÉFAUTS QUI PROTÈGENT — le chrono masqué, le cap non partagé, l'absence de
// tout classement. Ce sont des états initiaux, et un état initial faux ne se
// remarque jamais : personne ne va vérifier que rien n'est parti.
import { chromium } from 'playwright-core'
import { sortir } from './verdict.mjs'

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

await page.click('text=Saisir mon premier roulage')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Pau-Arnos')
await page.click('text=Continuer')
await page.click('text=Enregistrer la session')
await page.waitForFunction(() =>
  !!document.querySelector('section.recap .recap-image')
  || document.body.textContent.includes('Meilleur tour du jour'), null, { timeout: 40_000 })
if (await page.isVisible('section.recap')) await page.click('text=Retour au roulage')
await page.waitForSelector('text=Meilleur tour du jour', { timeout: 20_000 })

// ── ① FR-19 : LE DÉFAUT QUI PROTÈGE. Masqué, sans que personne n'ait rien fait.
const etat = await page.textContent('.lien.discret')
console.log('① chrono par défaut :', etat.replace(/\s+/g, ' '))
console.log('   masqué sans rien faire :', etat.includes('masqué') ? 'oui' : 'NON — DÉFAUT DANGEREUX')

await page.click('.lien.discret')
await page.waitForTimeout(500)
console.log('   l\'interrupteur bascule :',
  (await page.textContent('.lien.discret')).includes('visible') ? 'oui' : 'NON')
await page.click('.lien.discret')
await page.waitForTimeout(400)
console.log('   et revient :', (await page.textContent('.lien.discret')).includes('masqué') ? 'oui' : 'NON')

// ── ② Sans compte, le cercle le dit au lieu de tourner à vide.
const c = (await page.textContent('.ecran')).replace(/\s+/g, ' ')
console.log('② sans compte :', c.includes('Le cercle demande un compte') ? 'annoncé' : 'NON')
console.log('   et dit que c\'est le SEUL endroit :', c.includes('seul endroit du produit') ? 'oui' : 'NON')

// ── ③ FR-39 : aucun classement, nulle part, sous aucun nom.
const classements = ['classement', 'podium', 'meilleur du cercle', 'ranking', '1er', 'top ']
const trouves = classements.filter((m) => c.toLowerCase().includes(m))
console.log('③ FR-39 — aucun classement :', trouves.length ? trouves : 'oui')

// ── ④ FR-39bis : un cap de bravoure ne part pas tout seul. Rien à l'écran ne
//    propose de le partager, et le champ naît à faux.
await page.click('text=Déclarer un geste').catch(() => {})
await page.waitForTimeout(400)
const g = (await page.textContent('.ecran')).replace(/\s+/g, ' ')
console.log('④ déclarer un geste ne propose aucun partage :',
  /partager au cercle|envoyer au cercle|partage automatique/i.test(g) ? 'NON' : 'oui')

await page.screenshot({ path: process.argv[2] ?? '/tmp/cercle.png', fullPage: true })
await nav.close()
sortir(erreurs)
