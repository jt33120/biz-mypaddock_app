// LE CHANTIER D'HIVER — retour de Julian du 16 septembre 2026.
//
//   « Un statut sur les motos : ready, en réparation et hivernation. La mienne
//     passe en hivernation, avec une liste d'actions ordonnées, et une liste de
//     choses à acheter avec le prix pour estimer le coût. »
//
// Ce que cet essai protège, sur le paquet construit :
//   ① le statut se déclare, et le panneau dit ce qu'il va faire AVANT ;
//   ② l'hivernage ouvre un chantier, visible sous la carte ;
//   ③ les étapes gardent leur ordre, montent et descendent ;
//   ④ cocher une étape la CONSIGNE au carnet de SA catégorie (FR-46) ;
//   ⑤ l'estimation = prix × quantité, et « acheté » écrit une dépense réelle ;
//   ⑥ le pont marchand : liens https, jamais affiliés, jamais cliqués ici ;
//   ⑦ « prête » clôt le chantier et nomme ce qui n'a pas été coché.
import { chromium } from 'playwright-core'

const nav = await chromium.launch({
  executablePath: process.env.CHROME
    ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))
const pret = () => page.waitForFunction(
  () => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })

const manques = []
const verifier = (titre, vrai, detail = '') => {
  console.log(`${vrai ? '  ok ' : '  ÉCHEC '} ${titre}${detail ? ' — ' + detail : ''}`)
  if (!vrai) manques.push(titre)
}
const texte = async (sel) => ((await page.textContent(sel)) ?? '').replace(/\s+/g, ' ')
const partis = []
page.on('request', (r) => { if (/dafy-moto\.com|amazon\.fr/.test(r.url())) partis.push(r.url()) })
const capture = process.argv[2] ?? '/tmp/fumee-chantier.png'

// Le banc sert sur 4173 ; `BANC_URL` n'existe que pour un poste où ce port est déjà pris.
await page.goto(process.env.BANC_URL ?? 'http://localhost:4173', { waitUntil: 'networkidle' })
await pret()
await page.click('nav.barre .onglet:has-text("GARAGE")')
await page.click('text=Reprendre la CBR 83')
await page.waitForSelector('.garage .sprite', { timeout: 20_000 })

// ── ① Le badge dit « Prête », et aucun chantier n'existe.
verifier('① une moto déclarée naît prête', /Prête/.test(await texte('.statut-moto')))
verifier('① aucun chantier sous la carte tant qu\'elle est prête',
  (await page.$('.chantier-raccourci')) === null)

await page.click('.statut-moto')
await page.click('.statut-puce:has-text("Hivernage")')
const annonce = await texte('.statut-panneau .note')
verifier('① le panneau annonce le chantier avant de l\'ouvrir', /Hivernage \d{4}–\d{4}/.test(annonce), annonce)
await page.click('.statut-panneau .bouton:has-text("Passer en hivernage")')

// ── ② Le chantier apparaît, la scène givre.
await page.waitForSelector('.chantier-raccourci', { timeout: 20_000 })
verifier('② le badge dit Hivernage', /Hivernage/.test(await texte('.statut-moto')))
verifier('② la scène porte le statut', await page.$eval('.garage-showroom', (n) => n.dataset.statut) === 'hivernage')
await page.screenshot({ path: capture.replace(/\.png$/, '-garage.png'), fullPage: true })

await page.click('.chantier-raccourci')
await page.waitForSelector('.chantier-page', { timeout: 20_000 })
await page.click('text=/Partir des \\d+ étapes courantes/')
await page.waitForFunction(() => document.querySelectorAll('.chantier-etape').length >= 5, null, { timeout: 20_000 })
const noms = async () => page.$$eval('.chantier-etape .chantier-etape-nom .texte', (ns) => ns.map((n) => n.textContent))
const avant = await noms()
verifier('③ les étapes courantes arrivent dans l\'ordre', avant[0] === 'Nettoyage' && avant.length >= 5, avant.join(' › '))

// ③ La prochaine est dépliée ; on descend « Nettoyage » d'un rang.
await page.click('.chantier-etape[data-prochaine="1"] button[aria-label^="Descendre"]')
await page.waitForFunction(() => document.querySelector('.chantier-etape .texte')?.textContent !== 'Nettoyage')
const apres = await noms()
verifier('③ descendre échange deux rangs, et deux seulement',
  apres[0] === avant[1] && apres[1] === avant[0] && apres.slice(2).join() === avant.slice(2).join(), apres.join(' › '))

// ── ④ Cocher la prochaine étape.
const prochaine = apres[0]
await page.click('.chantier-etape[data-prochaine="1"] .chantier-fait')
await page.waitForSelector('.chantier-etape[data-faite="1"]', { timeout: 20_000 })
verifier('④ l\'étape cochée se dit faite, et une autre devient la prochaine',
  (await page.$$('.chantier-etape[data-prochaine="1"]')).length === 1)
const chiffres = await texte('.chantier-page .chiffres')
verifier('④ les comptes disent 1 faite, sans « sur »', /faites\s*1/.test(chiffres) && !/\bsur\b|\d+\s*\/\s*\d+/.test(chiffres), chiffres)

// ── ⑤ Un achat : 2 × 41,67 € pour la moto.
await page.click('text=Ajouter un achat')
await page.fill('.chantier-formulaire input[placeholder="Plaquettes avant"]', 'Plaquettes avant Brembo')
await page.fill('.chantier-formulaire input[placeholder="41,67"]', '41,67')
await page.fill('.chantier-formulaire input[inputmode="numeric"]', '2')
const liens = await page.$$eval('.chantier-marchands a', (as) => as.map((a) => ({ href: a.href, rel: a.rel, cible: a.target })))
verifier('⑥ deux recherches marchandes, en https, dans un nouvel onglet',
  liens.length === 2 && liens.every((l) => l.href.startsWith('https://') && /noopener/.test(l.rel) && l.cible === '_blank'),
  liens.map((l) => l.href).join(' | '))
verifier('⑥ aucune affiliation dans les liens', liens.every((l) => !/[?&](tag|aff|ref)=/i.test(l.href)))
verifier('⑥ la recherche porte la moto', liens.every((l) => /CBR/.test(decodeURIComponent(l.href))))
await page.click('.chantier-formulaire .bouton:has-text("Ajouter à la liste")')
await page.waitForSelector('.chantier-achat', { timeout: 20_000 })
verifier('⑤ l\'estimation vaut prix × quantité', /≈\s*83,34\s*€/.test(await texte('.chantier-sommes')), await texte('.chantier-sommes'))
await page.screenshot({ path: capture, fullPage: true })

await page.click('.chantier-achat .bouton:has-text("Acheté")')
await page.click('.chantier-payer .bouton:has-text("Payé")')
await page.waitForSelector('text=Déjà acheté · 1', { timeout: 20_000 })
const sommes = await texte('.chantier-sommes')
verifier('⑤ acheté : l\'estimé retombe, la dépense réelle apparaît', /acheté\s*83,34\s*€/.test(sommes) && /estimé\s*—/.test(sommes), sommes)

// ── ④ bis : le geste est au carnet d'entretien.
await page.click('.chantier-page .lien:has-text("garage")')
await page.waitForSelector('.garage-titre .modele', { timeout: 20_000 })
await page.click('button.atelier:has-text("Entretien")')
await page.waitForSelector('.poste-page', { timeout: 20_000 })
// Le carnet se lit APRÈS l'ouverture de la page : on attend la ligne, sans dormir.
const auCarnet = await page.waitForFunction((nom) => document.querySelector('.poste-page')?.textContent?.includes(nom),
  prochaine, { timeout: 10_000 }).then(() => true, () => false)
verifier('④ l\'étape cochée est au carnet d\'entretien', auCarnet, prochaine)
await page.click('.poste-page .lien:has-text("garage")')
await page.waitForSelector('.garage-titre .modele', { timeout: 20_000 })

// ── ⑦ Prête : le panneau nomme les étapes non cochées, puis clôt.
await page.click('.statut-moto')
await page.click('.statut-puce:has-text("Prête")')
const cloture = await texte('.statut-panneau .note')
verifier('⑦ le panneau nomme ce qui n\'a pas été coché', /se clôt/.test(cloture) && /pas été cochée/.test(cloture), cloture)
await page.click('.statut-panneau .bouton:has-text("La déclarer prête")')
await page.waitForFunction(() => /Prête/.test(document.querySelector('.statut-moto')?.textContent ?? ''))
verifier('⑦ le chantier quitte le garage', (await page.$('.chantier-raccourci')) === null)

verifier('⑥ aucune requête vers un marchand pendant l\'essai', partis.length === 0, partis.join(' | '))
verifier('aucune erreur de console', erreurs.length === 0, erreurs.join(' | '))
await nav.close()
if (manques.length) {
  console.error(`\n✗ ${manques.length} vérification(s) en échec :\n  · ${manques.join('\n  · ')}`)
  process.exit(1)
}
console.log('\n✓ le chantier se tient')
