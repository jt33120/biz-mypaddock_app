// Le parcours d'un INCONNU qui n'a pas la CBR de Julian.
//
// Deux défauts trouvés par une passe adverse, et les deux étaient définitifs :
//   · le seul bouton du garage vide créait la Honda de Julian EN DUR — personne
//     d'autre ne pouvait entrer sa moto ;
//   · le roulage partait avec `machineId: null` en dur, donc les trois chiffres
//     de la machine restaient à zéro POUR TOUJOURS, quel que soit le nombre de
//     roulages saisis. L'axe machine existait dans le schéma et nulle part dans
//     les données.
import { chromium } from 'playwright-core'

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))
const pret = () => page.waitForFunction(() => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })

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

// ── ① Un inconnu déclare SA moto, pas celle de quelqu'un d'autre.
await page.click('nav.barre .onglet:has-text("GARAGE")')
await page.waitForSelector('.garage.vide')
await page.fill('.champ[placeholder="Honda"]', 'Yamaha')
await page.fill('.champ[placeholder="CBR 1000 RR"]', 'R6')
await page.fill('.champ[placeholder="2012"]', '2019')
await page.click('text=Déclarer ma machine')
await page.waitForSelector('.garage .modele', { timeout: 20_000 })
console.log('① machine déclarée :', (await page.textContent('.garage-titre')).replace(/\s+/g, ' '))
console.log('   sans photo, la scène existe quand même :',
  await page.isVisible('.silhouette') ? 'silhouette' : 'NON')

// ── ② Un roulage, et il doit se rattacher tout seul : une seule machine au
//    garage, la question « laquelle ? » n'a pas de réponse possible.
await page.click('nav.barre .onglet:has-text("ACCUEIL")')
await page.click('text=Saisir mon premier roulage')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Nogaro')
console.log('② une seule machine — aucun choix demandé :',
  await page.isVisible('.puce:has-text("R6")') ? 'NON, on demande quand même' : 'oui')
await page.click('text=Continuer')
await page.waitForSelector('.molettes', { timeout: 10_000 })
await enregistrerSession()

// ── ③ LE DÉFAUT DÉFINITIF : les chiffres de la machine.
await page.click('nav.barre .onglet:has-text("GARAGE")')
await page.waitForSelector('.garage .chiffres', { timeout: 20_000 })
const chiffres = (await page.textContent('.garage .chiffres')).replace(/\s+/g, ' ')
console.log('③ chiffres de la machine :', chiffres)
console.log('   le roulage s\'y est rattaché :', /roulages\s*1/.test(chiffres) ? 'oui' : 'NON — AXE MACHINE VIDE')
console.log('   le meilleur tour remonte :', /\d'\d\d"\d/.test(chiffres) ? 'oui' : 'NON')

await page.screenshot({ path: process.argv[2] ?? '/tmp/machine.png', fullPage: true })
console.log('erreurs :', erreurs.length ? erreurs : 'aucune')
await nav.close()
process.exit(erreurs.length ? 1 : 0)
