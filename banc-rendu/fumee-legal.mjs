// QO-11 et §7 — les textes qui doivent exister avant le premier inconnu.
//
// Trois clauses, et la première est celle qui manque le plus souvent :
//   ① ils sont ATTEIGNABLES SANS COMPTE — un inconnu venu d'une publicité doit
//     pouvoir lire ce qu'on fait de ses données AVANT de donner son adresse
//   ② l'inscription DIT ce qu'elle engage et renvoie au texte
//   ③ le texte est VRAI : il nomme ce que le code envoie vraiment, et il ne
//     prétend pas à une adresse de contact qui n'existe pas
import { chromium } from 'playwright-core'
import { sortir } from './verdict.mjs'

const nav = await chromium.launch({
  executablePath: process.env.CHROME
    ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))
const pret = () => page.waitForFunction(() => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

// ── ① Sans compte, depuis l'accueil, en un tap.
console.log('① lien « à propos » sur l\'accueil, sans compte :',
  await page.isVisible('.tete .lien:has-text("à propos")'))
await page.click('.tete .lien:has-text("à propos")')
await page.waitForSelector('section.legal', { timeout: 10_000 })
const t = (await page.textContent('section.legal')).replace(/\s+/g, ' ')
console.log('   longueur du texte :', t.length, 'signes')

// ── ③ Le texte est VRAI. On vérifie ce qu'il nomme, pas sa présence.
const dit = (m) => t.toLowerCase().includes(m.toLowerCase())
console.log('③ nomme les sous-traitants réels :',
  ['Supabase', 'PowerSync', 'Vercel', 'Google'].filter(dit).join(' · '))
console.log('   nomme la région des données :', dit('eu-west-3') ? 'oui' : 'NON')
console.log('   nomme la base légale :', dit('base légale') ? 'oui' : 'NON')
console.log('   nomme les trois mesures :', dit('délai entre un roulage') ? 'oui' : 'NON')
console.log('   dit que l\'appel à Google est conditionnel :',
  dit('si tu la demandes') || dit('que si tu') ? 'oui' : 'NON')
console.log('   nomme les droits comme des BOUTONS :',
  dit('Emporter') && dit('Effacer mon compte') ? 'oui' : 'NON')
console.log('   ne prétend PAS ne rien collecter :',
  /aucune donnée personnelle n.est collectée/i.test(t) ? 'NON — TEXTE FAUX' : 'oui')
console.log('   dit honnêtement qu\'aucune adresse n\'est publiée :',
  dit('Aucune adresse de contact') ? 'oui' : 'une adresse est publiée')

// ── ② L'inscription contracte sur quelque chose.
await page.click('text=Retour')
await page.click('nav.barre .onglet:has-text("ACCUEIL")')
await page.click('nav.barre .onglet:has-text("COMPTE")')
await page.waitForSelector('section.compte', { timeout: 10_000 })
const c = (await page.textContent('section.compte')).replace(/\s+/g, ' ')
console.log('② l\'inscription énonce ce qu\'elle engage :',
  c.includes('vers un serveur en Europe') ? 'oui' : 'NON')
console.log('   et renvoie au texte :', await page.isVisible('.compte .lien:has-text("tes droits")'))
console.log('   sans case à cocher :', await page.isVisible('input[type=checkbox]') ? 'NON' : 'oui')

await page.screenshot({ path: process.argv[2] ?? '/tmp/legal.png', fullPage: true })
await nav.close()
sortir(erreurs)
