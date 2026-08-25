// NFR-6 / FR-27 — « le dernier filet quand tous les autres cèdent ».
//
// Trois clauses, et les trois ne se vérifient que de bout en bout :
//   ① il se compose HORS LIGNE et SANS COMPTE — sinon il n'est d'aucun secours
//     le jour où le serveur est justement le problème
//   ② il se lit SANS MYPADDOCK — le fichier porte ses propres unités
//   ③ il DIT CE QU'IL NE CONTIENT PAS — un filet qui tait ses trous n'en est pas un
import { chromium } from 'playwright-core'
import { sortir } from './verdict.mjs'
import { photoDEssai } from './photo-essai.mjs'

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))

// Tout ce qui sort du téléphone pendant la composition est noté : l'emport doit
// être muet côté réseau, et c'est la seule façon de le prouver.
let sorties = []
page.on('request', r => {
  const u = r.url()
  if (!u.startsWith('http://localhost') && !u.startsWith('blob:') && !u.startsWith('data:')) sorties.push(u)
})

const pret = () => page.waitForFunction(() => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })
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
/** Le contenu réel du fichier, relu depuis son blob — pas ce que l'écran en dit.
 *
 * ⚠ IL ÉTAIT RELU PAR `fetch(blob:…)`, ET C'ÉTAIT LE BANC QUI FAUTAIT. Depuis
 * que le banc sert les en-têtes de production, `connect-src` refuse `blob:` —
 * exactement comme en ligne. Le produit, lui, n'en a jamais eu besoin : il tient
 * ses Blob en mémoire et ne rappelle jamais leur URL. Desserrer la politique
 * pour faire passer un essai aurait rendu la production plus permissive au
 * bénéfice du seul banc, ce qui est l'inverse du marché.
 *
 * On attrape donc le Blob À SA CRÉATION, avant qu'il ne devienne une URL. C'est
 * un instrument d'essai posé sur le navigateur, pas une trappe dans le produit :
 * le code de l'application n'en sait rien et n'en dépend pas. */
await page.addInitScript(() => {
  const vrai = URL.createObjectURL.bind(URL)
  window.__blobs = new Map()
  URL.createObjectURL = (o) => { const u = vrai(o); window.__blobs.set(u, o); return u }
})
const lireFichier = () => page.evaluate(async () => {
  const a = document.querySelector('.compte a[download]')
  const b = window.__blobs.get(a.href)
  if (!b) throw new Error('blob introuvable : URL.createObjectURL n\'a pas été observé')
  return { nom: a.getAttribute('download'), texte: await b.text() }
})

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

// ── Une saison, saisie HORS LIGNE de bout en bout, avec une photo.
await page.context().setOffline(true)
await page.click('text=Saisir mon premier roulage')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Pau-Arnos')
await page.click('text=Continuer')
await enregistrerSession()
await page.setInputFiles('input[type=file]', await photoDEssai())
await page.waitForSelector('.vignette', { timeout: 60_000 })

// ── ① Sans compte, hors ligne : l'emport est là.
await onglet('COMPTE')
await page.waitForSelector('text=emporter ta saison', { timeout: 10_000 })
console.log('① atteignable sans compte, hors ligne :', await page.isVisible('text=emporter ta saison'))
console.log('   annoncé avant le geste :', (await page.textContent('.compte:has-text("emporter") .libelle:nth-of-type(2)')
  .catch(() => '')) || (await page.$$eval('.compte .libelle', ns => ns.map(n => n.textContent))).join(' | '))

sorties = []
await page.click('button.bouton:has-text("Emporter")')
await page.waitForSelector('.compte a[download]', { timeout: 30_000 })
const sans = await lireFichier()
console.log('② fichier :', sans.nom, `· ${(sans.texte.length / 1024).toFixed(0)} Ko`)
console.log('   aucune sortie réseau pendant la composition :',
  sorties.length ? 'NON — ' + sorties.join(', ') : 'oui')
// Composer et partager sont deux gestes. `share()` échoue dans ce navigateur ;
// l'écran ne doit pas pour autant annoncer que le fichier n'a pas été composé
// alors qu'il est juste en dessous. Le défaut ne se voyait que sur la capture.
const contradiction = async () => (await page.isVisible('.compte .mot-erreur'))
  ? 'NON — un échec est annoncé à côté du fichier prêt' : 'oui'
console.log('   échec de partage ≠ échec de composition :', await contradiction())

// ── ② Il se lit sans MyPaddock.
const o = JSON.parse(sans.texte)
console.log('   JSON valide :', typeof o === 'object' ? 'oui' : 'NON')
console.log('   unités portées :', Object.keys(o.a_lire_ainsi ?? {}).join(', ') || 'NON — aucune unité portée, illisible dans cinq ans')
console.log('   roulage emporté :', o.roulage?.[0]?.circuit_nom, '· tours :', o.tour?.length)
console.log('   référentiel exclu :', o.circuit === undefined && o.conseil === undefined ? 'oui' : 'NON')

// ── ③ Il dit ce qu'il ne contient pas.
console.log('③ sans les photos — ne_contient_pas :', JSON.stringify(o.ne_contient_pas))
console.log('   photos réellement absentes du fichier :', o.photos_jointes === undefined ? 'oui, cohérent' : 'NON')

await page.click('button.lien:has-text("avec les photos")')
await page.waitForFunction(() => {
  const a = document.querySelector('.compte a[download]')
  return a && a.href && document.body.textContent.includes('le fichier est prêt')
}, null, { timeout: 60_000 })
await page.waitForTimeout(1500)
const avec = await lireFichier()
const p = JSON.parse(avec.texte)
const jointes = Object.entries(p.photos_jointes ?? {})
console.log('   avec les photos :', jointes.length, 'jointe(s) ·',
  jointes[0]?.[1]?.slice(0, 22) ?? '—')
console.log('   plus lourd que sans :', avec.texte.length > sans.texte.length ? 'oui' : 'NON')
console.log('   poids annoncé tenu :', await page.textContent('.compte .lien:has-text("avec les photos")'),
  '→ livré', `${(avec.texte.length / 1024).toFixed(0)} Ko`)
console.log('   écran cohérent :', await contradiction())
console.log('   ne_contient_pas :', JSON.stringify(p.ne_contient_pas))

// ── L'EFFACEMENT est le jumeau de l'emport, et il n'est PAS sur le chemin de
//    quelqu'un qui n'a pas de compte : c'est le geste le plus destructeur du
//    produit, il n'a rien à faire devant quelqu'un qui n'a rien à effacer.
console.log('④ sans compte — bloc d\'effacement :',
  await page.isVisible('text=effacer mon compte') ? 'NON — VISIBLE À TORT' : 'absent, correct')

await page.screenshot({ path: process.argv[2] ?? '/tmp/emport.png', fullPage: true })
await nav.close()
sortir(erreurs)
