// Récit 3bis.3 puis 21.2 — le portrait de jeu. La seule fonction du produit qui
// coûte de l'argent, donc la seule dont l'essai doit prouver qu'elle NE DÉPENSE
// PAS.
//
// Cinq clauses :
//   ① la photo réelle et le portrait coexistent — l'un tient la scène, l'autre
//     est là quand même
//   ② « Retirer le portrait pixel » n'existe plus, et un seul bouton fait tout
//   ③ ce bouton ANNONCE CE QU'IL CONSOMME avant d'appeler, et ouvrir l'annonce
//     ne coûte rien
//   ④ sans compte, aucune requête ne part : l'application ne peut pas dépenser
//     seule
//   ⑤ le refus est ÉNONCÉ, et rien n'est perdu — ni la photo, ni le portrait
//
// ⚠ LA CLAUSE ① SE PROUVAIT AUTREFOIS EN RETIRANT LE PORTRAIT : on l'effaçait,
// la photo reprenait la scène, la coexistence était démontrée. Ce bouton est
// tombé au récit 21.2 (« aucun intérêt de le retirer »), et la démonstration
// avec lui. Elle se refait autrement, sans rien détruire : quand le portrait
// tient la scène, le bouton de la photo dit « Remplacer » — donc elle est là —
// et le bouton du portrait s'affiche — or il ne s'affiche QUE s'il y a une photo
// à repixéliser. Deux témoins pour un fait, et aucun geste destructif.
import { chromium } from 'playwright-core'
import { sortir } from './verdict.mjs'
import { photoDEssai } from './photo-essai.mjs'

const nav = await chromium.launch({
  executablePath: process.env.CHROME
    ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))

// TOUT appel à la fabrique est noté. C'est la mesure qui compte : un appel
// parti, c'est 0,16 € — et un essai qui en déclenche est un essai qui coûte.
const appels = []
page.on('request', r => { if (r.url().includes('/functions/v1/sprite')) appels.push(r.url()) })

const manques = []
const verifier = (titre, vrai, detail = '') => {
  console.log(`  ${vrai ? 'ok  ' : 'ÉCHEC'}  ${titre}${detail ? ' — ' + detail : ''}`)
  if (!vrai) manques.push(titre)
}

const pret = () => page.waitForFunction(() => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })
const onglet = (n) => page.click(`nav.barre .onglet:has-text("${n}")`)
const PHOTO = await photoDEssai()

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

await onglet('GARAGE')
await page.click('text=Reprendre la CBR 83')
await page.waitForSelector('.garage .sprite', { timeout: 20_000 })
console.log('① au départ, le portrait pixel tient la scène :', await page.isVisible('.garage .sprite'))
console.log('   la photo n\'est pas encore là :', await page.isVisible('.photo-machine') ? 'NON' : 'oui')
// Sans photo, rien ne propose de fabriquer : la fabrique part d'elle.
verifier('sans photo, aucun bouton ne propose de dépenser',
  !await page.isVisible('text=Refaire le portrait pixel')
  && !await page.isVisible('text=En faire un portrait pixel'))

// ── La photo réelle, versée hors ligne comme toute photo du produit.
await page.context().setOffline(true)
await page.setInputFiles('.garage input[type=file]', PHOTO)
// Les libellés ont été réécrits sur retour de Julian : « ajouter sa photo —
// laquelle, la pixélise ? mais si elle existe déjà, ce bouton devrait
// disparaître ? ». Deux objets distincts — la photo et le portrait pixel —
// portaient un seul mot.
await page.waitForFunction(
  () => document.body.textContent.includes('Remplacer la photo de la moto'), null, { timeout: 60_000 })
console.log('② photo versée hors ligne · le sprite garde la scène :',
  await page.isVisible('.garage .sprite') ? 'oui' : 'NON')
verifier('la photo existe pendant que le portrait tient la scène',
  await page.isVisible('.garage .sprite')
  && await page.isVisible('text=Remplacer la photo de la moto'))

// ── ② « Retirer le portrait pixel » est TOMBÉ, et il ne doit pas revenir par
//    inadvertance : « aucun intérêt de le retirer », récit 21.2.
verifier('« Retirer le portrait pixel » n\'existe plus',
  !await page.isVisible('text=Retirer le portrait pixel'))
// ⚠ IL ATTEND LA PHOTO RELUE, PAS LA COLONNE. Le bouton ne s'affiche plus sur
//    `machine.photo_chemin` — qui se synchronise, et vaut donc vrai sur un
//    appareil où le fichier n'est pas — mais sur la photo réellement lue ici.
//    Cette lecture est asynchrone : la supposer faite à l'instant où la colonne
//    apparaît ferait un essai qui passe ou rate selon la vitesse du disque.
const refaire = page.locator(
  '.garage-titre .actions-titre .lien:has-text("Refaire le portrait pixel")')
await refaire.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => { /* dit plus bas */ })
verifier('un seul bouton fait tout, et il est en tête d\'écran', await refaire.isVisible())

// ── ③ IL ANNONCE AVANT D'APPELER. C'est la clause centrale du récit : un bouton
//    nommé « Refaire », posé en haut d'écran, transforme un tap accidentel en
//    dépense. Ouvrir l'annonce ne doit rien coûter.
await page.context().setOffline(false)
await page.click('text=Refaire le portrait pixel')
await page.waitForSelector('text=ce que ça consomme', { timeout: 20_000 })
const annonce = (await page.textContent('.garage-titre .bloc')).replace(/\s+/g, ' ').trim()
console.log('③ annonce :', annonce)
verifier('l\'annonce dit le prix', /0,16\s*€/.test(annonce), annonce)
// ⚠ CETTE ASSERTION ÉPINGLAIT LA MAUVAISE PHRASE, et c'est ce qui a laissé le
//    défaut vivre : elle exigeait « en a 3 inclus » d'un essai qui tourne SANS
//    COMPTE. Elle validait donc, à l'endroit exact où le produit promettait un
//    crédit à quelqu'un qui ne peut pas s'en servir — puis le geste suivant lui
//    répondait « le portrait demande un compte ». Une garde qui exige la phrase
//    fausse est pire qu'une garde absente.
//    Ce qui est vérifié ici est donc l'état RÉEL de cet essai : pas de compte.
verifier('sans compte, l\'annonce dit D\'ABORD ce qui bloque',
  /demande un compte/.test(annonce), annonce)
verifier('sans compte, elle n\'annonce AUCUN crédit inclus',
  !/\binclus\b/i.test(annonce), annonce)
verifier('l\'annonce dit que le portrait actuel ne bouge pas', /garde sa place/.test(annonce))
verifier('OUVRIR L\'ANNONCE N\'A RIEN DÉPENSÉ', appels.length === 0, appels.join(', '))
// ⚠ LE COMPTEUR D'APPELS NE SUFFIT PAS À PROUVER ÇA, et c'est un piège du
// harnais : sans compte, `genererPortrait` refuse AVANT le `fetch`, donc un
// bouton qui fabriquerait directement laisserait lui aussi le compteur à zéro.
// L'essai passerait sans rien éprouver. Le témoin qui discrimine est le message
// de refus : s'il apparaît, une fabrication a été TENTÉE — donc le bouton a
// appelé au lieu de demander, et sur un appareil avec compte il aurait payé.
verifier('taper « Refaire » demande, il ne fabrique pas',
  !await page.isVisible('.mot-erreur'))

// Et se raviser ne dépense rien non plus.
await page.click('text=Ne rien lancer')
await page.waitForSelector('text=Refaire le portrait pixel', { timeout: 20_000 })
verifier('se raviser n\'a rien dépensé', appels.length === 0, appels.join(', '))

// ── ④ et ⑤ : la fabrique, sans compte.
await page.click('text=Refaire le portrait pixel')
await page.click('text=Lancer la fabrication')
await page.waitForSelector('.mot-erreur', { timeout: 30_000 })
console.log('④ refus énoncé :', (await page.textContent('.mot-erreur')).replace(/\s+/g, ' '))
verifier('aucune requête n\'est partie vers la fabrique', appels.length === 0,
  appels.length ? '← DES EUROS ONT PU PARTIR : ' + appels.join(', ') : '')
verifier('le portrait précédent est intact', await page.isVisible('.garage .sprite'))
verifier('la photo est toujours là', await page.isVisible('text=Remplacer la photo de la moto'))

await page.screenshot({ path: process.argv[2] ?? '/tmp/portrait.png', fullPage: true })
await nav.close()
// ⚠ UN APPEL D'IMAGE NON PRÉVU EST UNE ERREUR AU MÊME TITRE : c'est ce qui a
// vidé les crédits Gemini une fois. Il rejoint donc les erreurs plutôt que de
// vivre dans un `process.exit` à lui, où la garde des assertions ne le voyait pas.
sortir([
  ...erreurs,
  ...(appels.length ? [`appels image non prévus : ${appels.join(', ')}`] : []),
  ...manques.map((m) => `vérification en échec : ${m}`),
])
