// L'ATELIER — épique 8, devenu TROIS PAGES sur retour de Julian.
//
//   « Je verrais plutôt un bouton vers une page à part entière car il y a
//     beaucoup de choses… ajouter des photos et des factures, pour constituer
//     une preuve. »
//
// Ce que cet essai protège :
//
//   ⚠ FR-46, LA CLAUSE DE SÉCURITÉ. « Les trois catégories d'intervention ne
//     cohabitent jamais dans une même liste » : si « plaquettes en fin de vie »
//     s'affiche à côté de « sticker décollé », l'élément de sécurité hérite du
//     caractère repoussable du cosmétique. Le passage en page la RENFORCE — une
//     page ne rend qu'une catégorie — mais une clause de sécurité se vérifie,
//     elle ne se déduit pas d'une architecture.
//   · FR-43 : consigner le geste ne dépend jamais d'avoir consigné l'argent.
//   · FR-45 / FR-47 : la pièce achetée non montée et la bricole photographiée.
//   · FR-48 : aucune échéance, aucun compte à rebours, nulle part.
//   · LA PREUVE : photos et factures comptées SÉPARÉMENT, parce qu'elles ne
//     prouvent pas la même chose.
import { chromium } from 'playwright-core'
import { photoDEssai } from './photo-essai.mjs'
const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))
const pret = () => page.waitForFunction(
  () => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })
const PHOTO = await photoDEssai()

const manques = []
const verifier = (titre, vrai, detail = '') => {
  console.log(`${vrai ? '  ok ' : '  ÉCHEC '} ${titre}${detail ? ' — ' + detail : ''}`)
  if (!vrai) manques.push(titre)
}
const texte = async (sel) => (await page.textContent(sel)).replace(/\s+/g, ' ')
const ouvrirPoste = async (nom) => {
  await page.click(`button.atelier:has-text("${nom}")`)
  await page.waitForSelector('.poste-page', { timeout: 20_000 })
}
const retourGarage = async () => {
  await page.click('.poste-page .lien:has-text("garage")')
  await page.waitForSelector('.garage-titre .modele', { timeout: 20_000 })
}

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()
await page.click('nav.barre .onglet:has-text("GARAGE")')
await page.click('text=Reprendre la CBR 83')
await page.waitForSelector('.garage .sprite', { timeout: 20_000 })

// ── ① Trois sommaires séparés, présents dès le départ.
const blocs = await page.$$eval('button.atelier', ns => ns.map(n => n.className))
verifier('① trois sommaires d\'atelier, séparés', blocs.length === 3,
  blocs.map(c => c.split(' ').filter(x => !['bloc','rang','atelier','atelier-tete'].includes(x)).join('')).join(' · '))
for (const largeur of [375, 390, 430]) {
  await page.setViewportSize({ width: largeur, height: 844 })
  const disposition = await page.evaluate(() => {
    const boutons = [...document.querySelectorAll('.atelier-raccourcis .atelier-raccourci')]
    const hauts = boutons.map((b) => Math.round(b.getBoundingClientRect().top))
    return {
      memeLigne: hauts.length === 3 && hauts.every((y) => Math.abs(y - hauts[0]) <= 1),
      deborde: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      hauts,
    }
  })
  verifier(`   ${largeur}px · trois raccourcis sur la même ligne`,
    disposition.memeLigne, disposition.hauts.join(' · '))
  verifier(`   ${largeur}px · aucun débordement horizontal`, !disposition.deborde)
}
await page.setViewportSize({ width: 390, height: 844 })

// ── ② FR-43 : consigné au moment du geste, SANS montant.
await ouvrirPoste('Entretien')
verifier('   la page nomme son poste', (await texte('.poste-page .modele')).includes('Entretien'))
await page.click('text=Consigner un geste')
await page.fill('.champ[placeholder="Plaquettes avant"]', 'Plaquettes avant')
await page.click('.bouton:has-text("C\'est fait aujourd\'hui")')
await page.waitForSelector('.geste-atelier', { timeout: 15_000 })
verifier('② consigné sans montant', (await texte('.geste-atelier')).includes('Plaquettes avant'))
verifier('   ni zéro ni tiret sur le montant absent',
  !/0 €|—\s*€/.test(await texte('.poste-page')))

// ── ③ FR-45 : la pièce achetée et non montée, un état de première classe.
await page.click('text=Consigner un geste')
await page.fill('.champ[placeholder="Plaquettes avant"]', 'Chaîne et couronne')
await page.fill('.champ[placeholder="montant, si tu l\'as"]', '145,90')
await page.click('text=Acheté, pas encore monté')
await page.waitForFunction(
  () => document.body.textContent.includes('Chaîne et couronne'), null, { timeout: 15_000 })
const entretien = await texte('.poste-page')
verifier('③ la pièce achetée attend, datée « en attente »', entretien.includes('en attente'))
verifier('   FR-48 — aucune échéance, aucun compte à rebours',
  !/jours? restants?|échéance|en retard|urgent/i.test(entretien))

// ── ⑧ LA PREUVE : une photo et une facture, comptées séparément.
//    L'ordre des deux champs de fichier suit celui des boutons : photo, facture.
await page.setInputFiles('.geste-atelier input[type=file] >> nth=0', PHOTO)
await page.waitForSelector('.piece img', { timeout: 60_000 })
await page.setInputFiles('.geste-atelier input[type=file] >> nth=1', PHOTO)
await page.waitForSelector('.piece figcaption', { timeout: 60_000 })
await page.waitForTimeout(400)
const preuve = await texte('.geste-atelier')
verifier('⑧ photo et facture comptées séparément',
  /1 photo · 1 facture/.test(preuve), preuve.slice(0, 120))
verifier('   la facture se distingue à l\'œil',
  (await texte('.piece figcaption')).includes('facture'))

// ── ⑥ « C'est fait aujourd'hui » sur ce qui attendait.
await page.click('.geste-atelier .bouton:has-text("aujourd")')
await page.waitForTimeout(800)
const apres = await texte('.poste-page')
verifier('⑥ posé d\'un tap, et daté', /Chaîne et couronne.{0,40}\d{4}-\d{2}-\d{2}/.test(apres))
verifier('   la dépense l\'a suivi', apres.includes('145,90'))

// ⚠ CES DEUX VÉRIFICATIONS SE LISENT SUR LE BANDEAU, PAS SUR LA PAGE ENTIÈRE.
// Les mesurer sur tout le texte les rendait fausses par construction : « en
// attente » est aussi l'ÉTIQUETTE d'un compteur, et le montant apparaît deux
// fois légitimement — une fois dans le total, une fois sur la ligne qui l'a
// produit. Un essai qui confond une étiquette avec une valeur crie au loup, et
// un garde-fou qui crie au loup finit désactivé.
const compteur = (nom) => page.$eval(
  `.poste-page .chiffres div:has(.et:text-is("${nom}")) .va`, (n) => n.textContent.trim())
verifier('   le compteur « en attente » est retombé à zéro',
  await compteur('en attente') === '0', await compteur('en attente'))
verifier('   et l\'argent est compté UNE SEULE FOIS',
  (await compteur('dépensé')) === '145,90 €', await compteur('dépensé'))
verifier('   la ligne du carnet ne porte le montant qu\'une fois',
  ((await texte('.geste-atelier')).match(/145,90/g) ?? []).length === 1)

// ── ④ FR-47 : une bricole née d'une photo, sans rien remplir d'autre.
await retourGarage()
await ouvrirPoste('Bricoles')
await page.setInputFiles('.poste-page input[type=file]', PHOTO)
await page.waitForSelector('.geste-atelier', { timeout: 60_000 })
const bricoles = await texte('.poste-page')
verifier('④ née d\'une photo, sans autre saisie', bricoles.includes('À regarder'))

// ── ⑤ FR-46 : LA CLAUSE DE SÉCURITÉ, vérifiée dans les deux sens.
verifier('⑤ la page des bricoles ne contient PAS l\'entretien',
  !bricoles.includes('Plaquettes avant'))
await retourGarage()
await ouvrirPoste('Entretien')
const ent2 = await texte('.poste-page')
verifier('   la page d\'entretien ne contient PAS les bricoles',
  !ent2.includes('À regarder'))
verifier('   une seule page à la fois, par construction',
  await page.$$eval('.poste-page', n => n.length) === 1)

// ── ⑨ LE MANUEL SE TROUVE TOUT SEUL, et le secours manuel reste offert.
//
// Décision de Julian, réaffirmée après mon objection sur le droit d'auteur :
// « c'est fait en backend et automatisé, l'utilisateur ne recherche pas
// lui-même ». Le geste principal est donc le bouton automatique ; la recherche
// à la main et le versement d'un fichier restent en secours, en petit.
const manuel = await texte('.poste-page .bloc:has-text("Le manuel")')
verifier('⑨ le geste principal est automatique', manuel.includes('Trouver le manuel'))
verifier('   chercher soi-même reste possible', manuel.includes('Chercher moi-même'))
verifier('   verser un fichier aussi', manuel.includes('Verser un document'))

const lien = await page.getAttribute('.poste-page a[href*="duckduckgo"]', 'href')
verifier('   la recherche part de la machine déclarée',
  lien.includes('CBR') && lien.includes('2010'), decodeURIComponent(lien ?? '').slice(0, 90))

// ⚠ SANS COMPTE, RIEN NE PART. La recherche vit sur le serveur et coûte de
// l'argent : elle doit refuser AVANT tout appel, et le dire. Cet essai tourne
// sans compte — c'est donc exactement le chemin qu'il éprouve.
const partis = []
page.on('request', (r) => { if (/functions\/v1\/manuel/.test(r.url())) partis.push(r.url()) })
await page.click('.poste-page .bouton:has-text("Trouver le manuel")')
await page.waitForSelector('.poste-page .mot-erreur', { timeout: 20_000 })
verifier('⑩ sans compte, le refus est énoncé',
  (await texte('.poste-page .mot-erreur')).includes('compte'),
  await texte('.poste-page .mot-erreur'))
verifier('   et aucune requête n\'est partie vers la fabrique',
  partis.length === 0, `${partis.length} requête(s)`)

await page.setInputFiles('.poste-page .bloc:has-text("Le manuel") input[type=file]', PHOTO)
await page.waitForSelector('.poste-page .materiel', { timeout: 30_000 })
const garde = await texte('.poste-page .materiel')
verifier('   le document gardé s\'annonce avec son poids',
  /Manuel d'atelier · \d+/.test(garde), garde.slice(0, 120))
verifier('   et il s\'ouvre', (await page.isVisible('.materiel .lien:has-text("ouvrir")')))

await page.screenshot({ path: process.argv[2] ?? '/tmp/atelier.png', fullPage: true })
verifier('aucune erreur de console', erreurs.length === 0, erreurs.join(' | '))
await nav.close()

if (manques.length) {
  console.error(`\n✗ ${manques.length} vérification(s) en échec :\n  · ${manques.join('\n  · ')}`)
  process.exit(1)
}
console.log('\n✓ trois pages, trois carnets, et une preuve qui se compte')
