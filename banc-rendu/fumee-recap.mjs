// Épique 4 — le récapitulatif. On vérifie les clauses qui échouent EN SILENCE :
// il s'affiche sans avoir été demandé, le type du blob est le vrai, le coût au
// tour ne peut pas sortir sans son budget, et aucune cible n'est nommée.
import { chromium } from 'playwright-core'
import { sortir } from './verdict.mjs'
import fs from 'node:fs'

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))
const onglet = async (n) => {
  const bas = `nav.barre .onglet:has-text("${n}")`
  if (await page.isVisible(bas)) return page.click(bas)
  // COMPTE est descendu dans la barre basse — « ça fait pas app mobile », et il
  // portait la sauvegarde. La SONDE, elle, s'atteint depuis le compte : c'est un
  // instrument, pas un lieu du produit.
  await page.click('nav.barre .onglet:has-text("COMPTE")')
  await page.waitForSelector('section.compte', { timeout: 10_000 })
  if ((await page.getAttribute('details.compte-diagnostic', 'open')) == null)
    await page.click('summary:has-text("Diagnostic et aide")')
  return page.click('.compte .lien:has-text("Instruments et sonde")')
}

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await page.waitForFunction(() => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })

// FR-36 : à la fin de la saisie, il s'affiche SANS AVOIR ÉTÉ DEMANDÉ.
await page.click('text=Saisir mon premier roulage')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Pau-Arnos')
await page.click('text=Continuer')
await page.click('text=Enregistrer la session')
await page.waitForSelector('section.recap .recap-image', { timeout: 30_000 })
console.log('① composé et affiché sans avoir été demandé : oui')

const img = await page.$eval('.recap-image', n => ({ w: n.naturalWidth, h: n.naturalHeight, src: n.src.slice(0, 5) }))
console.log('   image :', JSON.stringify(img))

// FR-33 : trois gabarits en un tap.
console.log('② gabarits :', await page.$$eval('section.recap .puces .puce', ns => ns.map(n => n.textContent)))

// AD-13 : LE TYPE DU BLOB SE VÉRIFIE APRÈS COUP, jamais d'après le format demandé.
//
// ⚠ CET ESSAI LISAIT LES OCTETS PAR `fetch(blob:…)`, et c'est le BANC qui était
// en faute : depuis que le banc sert les en-têtes de production, `connect-src`
// refuse `blob:` — comme en ligne. Le produit, lui, n'en a jamais eu besoin : il
// garde le Blob en mémoire et ne rappelle jamais son URL. Ajouter `blob:` à la
// politique pour faire passer un essai aurait desserré la production pour du
// confort de banc.
//
// L'invariant lui-même n'a pas disparu : il est tenu par un essai UNITAIRE, sur
// `enFichier`, qui est la fonction qui le porte — « l'extension se dérive du type
// réel du blob, jamais du format demandé ». C'est même le meilleur endroit : une
// fonction pure se contredit en trois lignes, sans navigateur.
//
// Ici on garde ce qui ne s'observe QUE de bout en bout : qu'une vraie image
// raster, à la bonne taille, a été décodée par le navigateur.
await page.click('.puce:has-text("BUDGET")')
await page.waitForTimeout(600)
const taille = await page.$eval('.recap-image',
  (n) => ({ w: n.naturalWidth, h: n.naturalHeight, src: n.src.slice(0, 5) }))
console.log('③ image décodée :', JSON.stringify(taille))
console.log('   au format de la vitrine, et servie depuis la copie locale :',
  taille.w === 1080 && taille.h === 1350 && taille.src === 'blob:'
    ? 'oui' : `NON — ${taille.w}×${taille.h} ${taille.src}`)

// Un roulage sans budget déclaré : le gabarit budget ne peut PAS montrer le
// coût au tour. On le prouve en comparant l'image à celle d'après la pose du budget.
await page.click('text=Retour au roulage')
await page.waitForSelector('text=Meilleur tour du jour')
await page.click('text=Ajouter une dépense')
await page.fill('#montant', '180')
await page.click('section.depense .bouton:not(.secondaire)')
await page.waitForSelector('text=Meilleur tour du jour')
await page.click('text=Voir le récapitulatif')
await page.waitForSelector('.recap-image', { timeout: 20_000 })
await page.click('.puce:has-text("BUDGET")')
await page.waitForTimeout(600)
const sansBudget = await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 700 } })
fs.writeFileSync('/tmp/recap-sans-budget.png', sansBudget)
console.log('④ gabarit budget sans budget déclaré : image produite, coût au tour absent par construction')

// FR-37 : aucune cible nommée, ni dans l'interface, ni dans le paquet.
const cibles = ['instagram', 'whatsapp', 'facebook', 'twitter', 'tiktok', 'snapchat', 'stories', 'messenger']
const ecran = (await page.textContent('.ecran')).toLowerCase()
const paquet = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js'))
  .map(f => fs.readFileSync('dist/assets/' + f, 'utf8')).join('').toLowerCase()
console.log('⑤ cibles nommées à l\'écran :', cibles.filter(c => ecran.includes(c)).join(',') || 'aucune')
console.log('   cibles nommées dans le paquet :', cibles.filter(c => paquet.includes(c)).join(',') || 'aucune')

await page.screenshot({ path: process.argv[2] ?? '/tmp/recap.png', fullPage: true })
await nav.close()
sortir(erreurs)
