// Épique 13 — la checklist de chargement et la conformité organisateur.
//
// FR-50 : « le système NE CERTIFIE PAS l'admission, il rapporte ce qu'un
// organisateur a publié ». L'essai vérifie l'absence de ce qui certifierait —
// un compteur de conformité, un « validé », une barre qui se remplit — autant
// que la présence de ce qui rapporte.
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

// ── ① Elle ne se compose pas toute seule : c'est un geste.
console.log('① avant composition :', await page.isVisible('text=Préparer le chargement'))
await page.click('text=Préparer le chargement')
await page.waitForSelector('.checklist', { timeout: 20_000 })
const l = await page.$$eval('.checklist .coche', ns => ns.map(n => n.textContent))
console.log('   lignes composées :', l.length, '·', l.slice(0, 4).join(' · '))

// ── ② On coche, et ça tient au rechargement — c'est une TRACE.
await page.click('.checklist .coche:has-text("Casque")')
await page.click('.checklist .coche:has-text("Gants")')
await page.waitForTimeout(500)
console.log('② décompte :', (await page.textContent('.checklist .atelier-tete')).replace(/\s+/g, ' '))

await page.reload({ waitUntil: 'networkidle' })
await pret()
await page.click('nav.barre .onglet:has-text("ROULAGES")')
await page.click('.bloc:has-text("Pau-Arnos")')
await page.waitForSelector('.checklist', { timeout: 20_000 })
console.log('   la trace survit au rechargement :',
  (await page.textContent('.checklist .atelier-tete')).includes('2 chargés') ? 'oui' : 'NON')

// ── ③ FR-50 : rien ne certifie. Aucun compteur de progression, aucun verdict.
await page.click('.checklist .atelier-tete')
await page.waitForTimeout(400)
const t = (await page.textContent('.checklist')).replace(/\s+/g, ' ')
const certifiants = ['conforme', 'validé', 'admis', 'autorisé', 'complet', 'terminé', '/ 11', 'sur 11', '%']
const trouves = certifiants.filter((c) => t.toLowerCase().includes(c.toLowerCase()))
console.log('③ FR-50 — rien ne certifie :', trouves.length ? 'NON — ' + trouves.join(', ') : 'oui')
console.log('   aucune barre de progression :',
  await page.isVisible('.checklist .jauge') ? 'NON' : 'oui')

// ── ④ Le chargement embarqué ne contient AUCUNE règle : ce qui vient d'un
//    organisateur porte sa source, ou n'existe pas.
//
//    ⚠ CE QU'ON VÉRIFIE EST LA LIGNE, PAS LA SECTION. La section existe
//    désormais même vide, et c'est délibéré : la faire disparaître laisserait
//    lire « l'organisateur n'exige rien » là où la vérité est « le produit ne
//    sait rien ». Ce qui reste interdit, c'est une LIGNE sans source.
const conformes = await page.$$eval('.checklist .conformite .coche', n => n.length)
console.log('④ aucune ligne de conformité sans référentiel :', conformes === 0 ? 'oui' : 'NON')
// ⚠ ET C'EST LA BONNE ABSENCE QUI EST DITE — récit 17.4. Deux phrases
//   existent, et ce parcours-ci relève de la SECONDE : le pilote du banc n'a
//   pas de compte, donc son `circuit_id` reste nul pour toujours — le
//   rattachement au référentiel se fait côté serveur (migration 20260825000003)
//   et rien de lui n'y monte. Lui dire « aucune règle publiée n'est connue »
//   présenterait une absence de savoir comme un savoir de l'absence : la
//   question n'a même pas été posée pour sa journée.
//   L'essai attend donc la phrase du NON-RATTACHEMENT, et refuse l'autre : se
//   contenter de « l'une des deux » laisserait la distinction retomber sans un
//   mot, et c'est exactement le défaut qu'elle corrige.
const ditQuIlNAPasPuLire = t.includes('rattachée à aucun circuit')
const ditQuIlNeSaitRien = t.includes('Aucune règle publiée n’est connue')
console.log('   et l\'absence est DITE, pas tue :',
  ditQuIlNAPasPuLire || ditQuIlNeSaitRien ? 'oui' : 'NON')
console.log('   et c\'est la BONNE des deux — sans compte, il n\'a pas pu lire :',
  ditQuIlNAPasPuLire && !ditQuIlNeSaitRien ? 'oui' : 'NON')

await page.screenshot({ path: process.argv[2] ?? '/tmp/checklist.png', fullPage: true })
await nav.close()
sortir(erreurs)
