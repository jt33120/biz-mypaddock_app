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
  executablePath: process.env.CHROME
    ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
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
// Le gabarit de l'année est passé de 2012 à 2010 en même temps que la CBR de
// l'essai, dont l'année était fausse — et invérifiable, puisqu'elle n'apparaissait
// nulle part à l'écran.
await page.fill('.champ[placeholder="2010"]', '2019')
await page.click('text=Déclarer ma moto')
await page.waitForSelector('.garage .modele', { timeout: 20_000 })
const titre = (await page.textContent('.garage-titre')).replace(/\s+/g, ' ')
console.log('① machine déclarée :', titre)
console.log('   l\'année est visible dans le garage :',
  titre.includes('2019') ? 'oui' : 'NON — SAISIE MAIS JAMAIS MONTRÉE')
console.log('   sans photo, la scène existe quand même :',
  await page.isVisible('.silhouette') ? 'silhouette' : 'NON')
// ⚠ ET ELLE DIT SON ABSENCE. Un cadre hachuré et muet ne se distingue pas d'une
// image qui n'a pas chargé — et c'est l'écran que voit TOUT pilote qui vient de
// déclarer sa moto, d'autant plus longtemps que la fabrique de portraits est
// éteinte. Le produit énonce ce qui manque, ici comme sur la fiche de circuit.
const absente = (await page.textContent('.silhouette')).replace(/\s+/g, ' ')
console.log('   l\'absence est DITE, pas laissée vide :',
  absente.trim().length > 20 ? `oui — ${absente.trim()}` : 'NON — cadre muet')
console.log('   la photo et le portrait pixel restent deux objets nommés :',
  /photo/i.test(absente) && /portrait/i.test(absente) ? 'oui' : 'NON')

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
// ⚠ ON ATTEND QUE LES CHIFFRES SOIENT SUS, pas qu'ils soient à l'écran. La
// grille apparaît avec le composant ; ses valeurs arrivent d'une requête. Lire
// entre les deux donnait « roulages 0 » une fois sur deux — un faux échec qui
// cachait un vrai défaut d'affichage, corrigé du même coup : le garage écrivait
// `0` pendant le chargement au lieu de dire qu'il ne savait pas encore.
await page.waitForSelector('.garage .chiffres[data-charge="1"]', { timeout: 20_000 })
const chiffres = (await page.textContent('.garage .chiffres')).replace(/\s+/g, ' ')
console.log('③ chiffres de la machine :', chiffres)

/* ⚠ CES TROIS VÉRIFICATIONS SORTENT EN ÉCHEC, elles ne se contentent plus de
   s'imprimer. L'essai a affiché « NON — AXE MACHINE VIDE » en rendant un code
   de sortie vert : c'est exactement le défaut qu'il existe pour attraper, et il
   est passé.

   Le rattachement se joue sur une COURSE : le formulaire listait les machines
   dans un `useEffect` et posait la sélection au retour, alors que « Continuer »
   était tapable depuis le premier rendu. La fenêtre est invisible sur une
   machine de bureau et large sur un téléphone, où SQLite passe par un worker
   OPFS. L'essai clique donc sans attendre — comme un pilote pressé — et la
   règle a été descendue au niveau de l'écriture, où aucune course ne l'atteint. */
const manques = []
const verifier = (titre, vrai, detail = '') => {
  console.log(`${vrai ? '  ok ' : '  ÉCHEC '} ${titre}${detail ? ' — ' + detail : ''}`)
  if (!vrai) manques.push(titre)
}
verifier('le roulage s\'est rattaché à la seule machine du garage',
  /roulages\s*1/.test(chiffres), chiffres)
verifier('le meilleur tour remonte', /\d'\d\d"\d/.test(chiffres))
verifier('et il nomme son circuit', /Nogaro/.test(chiffres))

await page.screenshot({ path: process.argv[2] ?? '/tmp/machine.png', fullPage: true })
verifier('aucune erreur de console', erreurs.length === 0, erreurs.join(' | '))
await nav.close()

if (manques.length) {
  console.error(`\n✗ ${manques.length} vérification(s) en échec :\n  · ${manques.join('\n  · ')}`)
  process.exit(1)
}
console.log('\n✓ l\'axe machine reçoit ses roulages')
