// LE COFFRE SUIVI SUR LA DURÉE — un iPhone d'avant Safari 26, du bout en bout.
//
// ⚠ CET ESSAI EXISTE PARCE QUE LES QUATRE ESSAIS UNITAIRES DU COFFRE RESTAIENT
// VERTS EN REMPLAÇANT TOUT INDEXEDDB PAR UNE `Map` EN MÉMOIRE DE MODULE. La
// revue l'a démontré. Ils tiennent « mêmes octets dans la même page » ; ils ne
// tiennent pas « la photo est encore là demain matin ». Or l'invariant du
// produit est que les photos de la journée sont ce qu'on ne peut PAS se
// permettre de perdre — et la seule façon de l'éprouver, c'est de tuer la page
// et de revenir.
//
// ⚠ ET IL SUIT L'OCTET JUSQU'AU BOUT : verser → recharger → relire → effacer le
// compte → plus rien nulle part. C'est ce cycle complet, et lui seul, qui aurait
// attrapé le bloquant : l'effacement de compte ne balayait que l'OPFS,
// c'est-à-dire exactement pas le magasin où va tout ce que ce lot fait écrire.
// L'écran annonçait « 0 fichier » pendant que toutes les photos étaient encore
// sur l'appareil — un écran qui ment sur un droit.
//
// LE SAFARI D'AVANT LA 26 SE FABRIQUE, IL NE S'ESPÈRE PAS. `addInitScript`
// retire `createWritable` du prototype AVANT que le module ne se charge, parce
// que le coffre choisit son magasin UNE FOIS par session : le retirer après coup
// n'éprouverait que le choix déjà fait.
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

await page.addInitScript(() => {
  // Exactement l'état d'un iPhone sous iOS 18 : l'objet existe, la méthode non.
  Reflect.deleteProperty(FileSystemFileHandle.prototype, 'createWritable')
})

/* ─── LE COMPTE, SANS SERVEUR ──────────────────────────────────────────────
   L'effacement du compte est la dernière étape du cycle, et il exige une
   identité. On ne joint pas Supabase depuis le banc : on lui répond à sa place,
   comme le fait déjà `fumee-confirmation`. La session est FABRIQUÉE ICI mais
   RANGÉE PAR LA VRAIE BIBLIOTHÈQUE — c'est elle qui écrit son propre format de
   stockage, donc rien dans cet essai ne peut diverger de ce que fait le produit.

   Ce qui est éprouvé après ce point reste le VRAI chemin du produit :
   `effacerAuServeur` puis `effacerLeTelephone`, sans doublure. */
const PILOTE = '00000000-0000-4000-8000-000000000001'
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
const EXPIRE = Math.floor(Date.now() / 1000) + 31_536_000
const FAUX_JETON = [
  b64({ alg: 'HS256', typ: 'JWT' }),
  b64({ sub: PILOTE, aud: 'authenticated', role: 'authenticated', exp: EXPIRE }),
  'signature-d-essai',
].join('.')

await page.route('**/auth/v1/signup*', r => r.fulfill({
  status: 200, contentType: 'application/json',
  body: JSON.stringify({
    access_token: FAUX_JETON, refresh_token: 'renouvellement-d-essai',
    // Un an : sans ça la bibliothèque tenterait un renouvellement réseau au
    // milieu de l'essai, et on lirait un échec de harnais comme un défaut.
    expires_in: 31_536_000, token_type: 'bearer',
    user: { id: PILOTE, email: 'julian@exemple.fr', aud: 'authenticated', role: 'authenticated' },
  }),
}))
await page.route('**/auth/v1/logout*', r => r.fulfill({ status: 204, body: '' }))
// La fonction d'effacement serveur répond OUI. C'est la SEULE façon d'atteindre
// l'étape locale : le produit refuse de toucher au téléphone tant que le serveur
// n'a pas confirmé, et c'est justement l'ordre qu'on ne veut pas contourner.
await page.route('**/functions/v1/effacer*', r => r.fulfill({
  status: 200, contentType: 'application/json',
  body: JSON.stringify({ efface: true, objets: 0 }),
}))

const pret = () => page.waitForFunction(
  () => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })
const onglet = async (n) => {
  const bas = `nav.barre .onglet:has-text("${n}")`
  if (await page.isVisible(bas)) return page.click(bas)
  // La SONDE s'atteint depuis le compte : c'est un instrument, pas un lieu.
  await page.click('nav.barre .onglet:has-text("COMPTE")')
  await page.waitForSelector('section.compte', { timeout: 10_000 })
  return page.click('.compte .lien:has-text("Instruments et sonde")')
}

// FR-36 : la fin d'une saisie ouvre LE RÉCAPITULATIF, pas le bilan.
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

/**
 * CE QUE LES DEUX MAGASINS CONTIENNENT VRAIMENT, lu à la main et pas par le
 * produit : un essai qui interrogerait l'inventaire du coffre pour vérifier le
 * coffre ne vérifierait que sa cohérence avec lui-même.
 *
 * On n'ouvre PAS la base si elle n'existe pas : `indexedDB.open(nom)` la
 * CRÉERAIT, vide et sans rayon, et le produit trouverait ensuite une base en
 * version 1 dépourvue du magasin qu'il attend. Un harnais qui casse ce qu'il
 * observe ne mesure plus rien.
 */
const magasins = () => page.evaluate(async () => {
  const opfs = []
  try {
    const d = await (await navigator.storage.getDirectory()).getDirectoryHandle('photos')
    // La règle du coffre : un nom qui commence par un point est un témoin
    // d'épreuve, pas un fichier du pilote.
    for await (const [n] of d.entries()) if (!n.startsWith('.')) opfs.push(n)
  } catch { /* pas de dossier : zéro, et c'est une réponse */ }

  const connues = (await indexedDB.databases()).map((b) => b.name)
  if (!connues.includes('mypaddock-coffre')) return { opfs, indexeddb: [] }

  const indexeddb = await new Promise((tenir) => {
    const o = indexedDB.open('mypaddock-coffre', 1)
    o.onerror = () => tenir(['(ouverture refusée)'])
    o.onsuccess = () => {
      const base = o.result
      if (!base.objectStoreNames.contains('fichiers')) { base.close(); return tenir([]) }
      const r = base.transaction('fichiers', 'readonly').objectStore('fichiers').getAllKeys()
      r.onerror = () => { base.close(); tenir(['(lecture refusée)']) }
      r.onsuccess = () => {
        const noms = r.result.map(String).filter((n) => !n.startsWith('.'))
        base.close()
        tenir(noms)
      }
    }
  })
  return { opfs, indexeddb }
})

/** Les lignes de la sonde, valeur ET couleur. La couleur compte : « ce n'est
 *  plus une panne » est une décision qui se voit, et UX-DR8 exige que le mot la
 *  double — les deux se lisent ici. */
const lignesDeSonde = () => page.evaluate(() => {
  const l = {}
  for (const rang of document.querySelectorAll('.bloc .rang')) {
    const cle = rang.querySelector('.libelle')?.textContent?.trim()
    const val = rang.querySelector('.hud-12')
    if (cle && val) l[cle] = { val: val.textContent.trim(), classe: val.className }
  }
  return l
})

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

/* ─── ① VERSER, SUR UN APPAREIL QUI NE SAIT PAS ÉCRIRE DANS L'OPFS ───────── */
await page.click('text=Saisir mon premier roulage')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Pau-Arnos')
await page.click('text=Continuer')
await enregistrerSession()

await page.setInputFiles('input[type=file]', await photoDEssai())
await page.waitForSelector('.case-album img', { timeout: 60_000 })

const verse = await magasins()
console.log('① photo versée sans createWritable :', JSON.stringify(verse))
console.log('   elle est bien allée dans le repli IndexedDB :',
  verse.indexeddb.length === 1 ? 'oui' : 'NON')
console.log('   et l\'OPFS est resté vide, comme sur un iPhone d\'iOS 18 :',
  verse.opfs.length === 0 ? 'oui' : 'NON')
const RANGEE = verse.indexeddb[0]

/* ─── ② RECHARGER — la seule épreuve qui distingue un coffre d'une Map ─────
   Tout ce qui vivait en mémoire de module vient de mourir. Ce qui revient à
   l'écran après ce point ne peut venir que du disque. */
await page.reload({ waitUntil: 'networkidle' })
await pret()
await onglet('ROULAGES')
await page.click('.pile > .bloc')
await page.waitForSelector('.bloc:has-text("Photos et gestes")', { timeout: 30_000 })
await page.waitForSelector('.case-album img', { timeout: 30_000 })

/* ⚠ ON ATTEND LE DÉCODAGE, PAS L'ÉLÉMENT — et c'est ce qui manquait.
   `waitForSelector` rend la main dès que la balise EXISTE. À cet instant la
   lecture du coffre n'est pas finie : `src` est encore vide et `naturalWidth`
   vaut 0. Les deux assertions qui suivent étaient donc justes et mesuraient
   trop tôt : cet essai échouait QUATRE FOIS SUR CINQ, et passait au banc complet
   par chance. Un essai rouge la plupart du temps est pire qu'un essai absent —
   on apprend à ne plus le lire, et le jour où il dit vrai, personne ne regarde.
   La condition est bornée : si elle n'arrive pas, c'est le décodage qui a
   vraiment échoué, et l'état observé est imprimé juste en dessous. */
await page.waitForFunction(() => {
  const n = document.querySelector('.case-album img')
  return !!n && n.src.startsWith('blob:') && n.complete && n.naturalWidth > 0
}, null, { timeout: 30_000 }).catch(() => { /* l'état réel est dit plus bas */ })

const revenue = await page.$eval('.case-album img', n => ({
  src: n.src.slice(0, 5), l: n.naturalWidth, h: n.naturalHeight,
}))
console.log('② après rechargement, la photo relue :', JSON.stringify(revenue))
console.log('   servie depuis la copie locale (blob:) :', revenue.src === 'blob:' ? 'oui' : 'NON')
// Une image qui ne décode pas rend 0 × 0 : le `blob:` seul ne prouve pas que
// les octets sont les bons, seulement qu'une URL a été fabriquée.
console.log('   et elle porte de vrais pixels :', revenue.l > 0 && revenue.h > 0 ? 'oui' : 'NON')

const apresRechargement = await magasins()
console.log('   le fichier est le MÊME qu\'avant le rechargement :',
  apresRechargement.indexeddb[0] === RANGEE && !!RANGEE ? 'oui' : 'NON')

/* ─── ③ CE QUE LA SONDE EN DIT ────────────────────────────────────────────
   Elle annonçait « repli IndexedDB » en gris à vie, sans avoir jamais écrit un
   octet dans IndexedDB : elle validait rigoureusement le magasin qu'on
   n'utilise pas, et pas celui par lequel tout passe. */
await onglet('SONDE')
await page.waitForSelector('text=Instruments de bord', { timeout: 20_000 })
const sonde = await lignesDeSonde()
const magasinEnUsage = sonde['magasin en usage'] ?? { val: '(ligne absente)', classe: '' }
const ecrireUnFichier = sonde['③ ÉCRIRE UN FICHIER'] ?? { val: '(ligne absente)', classe: '' }
const ranges = sonde['fichiers rangés'] ?? { val: '(ligne absente)', classe: '' }
console.log('③ sonde · magasin en usage :', magasinEnUsage.val)
console.log('   l\'écriture du repli est ÉPROUVÉE, pas supposée :',
  /IndexedDB — écriture éprouvée/.test(magasinEnUsage.val) ? 'oui' : 'NON')
console.log('   et elle porte le vert de ce qui marche :',
  magasinEnUsage.classe.includes('mieux') ? 'oui' : 'NON — ' + magasinEnUsage.classe)
console.log('   sonde · écrire un fichier :', ecrireUnFichier.val)
// « createWritable absent » n'est plus une panne depuis que le repli existe :
// c'est un choix de magasin qui marche. Le jaune de « ce qui attend » n'a plus
// rien à faire là — la ligne est un renseignement, pas une alarme.
console.log('   l\'absence de createWritable n\'est plus peinte en alerte :',
  !ecrireUnFichier.classe.includes('plus-lent') ? 'oui' : 'NON')
console.log('   sonde · fichiers rangés :', ranges.val)
console.log('   l\'inventaire dit bien IndexedDB :',
  /OPFS 0 · IndexedDB 1/.test(ranges.val) ? 'oui' : 'NON')

/* ─── ④ EFFACER LE COMPTE — le droit, et le compte qu'il annonce ──────────
   C'est ici que le bloquant se voyait : « Il ne reste rien … 0 fichier de
   photo » pendant que la photo de ① était toujours dans IndexedDB. */
await onglet('COMPTE')
await page.fill('#email', 'julian@exemple.fr')
await page.fill('#mdp', 'motdepasse')
await page.click('section.compte .bouton')
await page.waitForSelector('.lien.destructif:has-text("Effacer mon compte")', { timeout: 30_000 })

const avantEffacement = await magasins()
console.log('④ juste avant l\'effacement :', JSON.stringify(avantEffacement))

await page.click('.lien.destructif:has-text("Effacer mon compte")')
await page.click('.bouton.destructif:has-text("Effacer définitivement")')
await page.waitForSelector('text=Il ne reste rien', { timeout: 60_000 })

const annonce = (await page.textContent('section.compte:has-text("Il ne reste rien")'))
  .replace(/\s+/g, ' ')
console.log('   l\'écran dit :', annonce.slice(0, 220))
console.log('   il annonce le fichier qui existait vraiment :',
  /\b1 fichier\b/.test(annonce) ? 'oui' : 'NON — il compte encore le seul OPFS')

const restes = await magasins()
console.log('⑤ ce qui reste sur le téléphone :', JSON.stringify(restes))
console.log('   plus rien dans l\'OPFS :', restes.opfs.length === 0 ? 'oui' : 'NON')
console.log('   plus rien dans IndexedDB :', restes.indexeddb.length === 0 ? 'oui' : 'NON')

await page.screenshot({ path: process.argv[2] ?? '/tmp/coffre.png', fullPage: true })
await nav.close()
sortir(erreurs)
