// LE ROUGE NE DIT QU'UNE CHOSE — récit 21.3, et sa garde vivante.
//
// La règle tient en deux moitiés, et il faut les DEUX : une seule n'attrape
// rien. « Tout bouton destructif est rouge » se satisfait d'un produit
// entièrement rouge ; « aucun bouton non destructif n'est rouge » se satisfait
// d'un produit sans une once de rouge. Elles sont donc vérifiées ensemble, sur
// chaque écran atteint.
//
// ⚠ CET ESSAI LIT LA COULEUR CALCULÉE, PAS LA CLASSE. Un essai unitaire relit
// déjà les sources et confronte libellé et `className` (essais.ts) — il attrape
// la classe oubliée. Il ne peut PAS attraper : une faute de frappe dans le nom
// de classe, une règle CSS supprimée, une spécificité qui la fait perdre contre
// `.bouton`. Ces trois-là ne se voient que dans un navigateur, et les trois
// rendent un bouton qui détruit sans le dire.
//
// ⚠ ET SON PARCOURS N'ATTEIGNAIT AUCUN `.bouton.destructif`. Il ne rencontrait
// que des `.lien.destructif` — les « retirer » au bout d'une ligne — pendant que
// les quatre boutons rouges du produit vivaient derrière une confirmation qu'il
// n'ouvrait jamais. La moitié des formes du destructif n'était donc gardée par
// personne, et c'est la moitié qui détruit VRAIMENT : le lien ne fait qu'ouvrir.
// Le parcours ouvre maintenant les confirmations — et ressort par « Garder »,
// sans jamais confirmer — puis exige d'avoir vu CHAQUE forme au moins une fois.
//
// Il garde aussi, du même parcours, ce que les mêmes écrans DISENT : le mot
// « machine » n'a plus le droit d'apparaître (récit 21.1), et « effacer mon
// compte » ne s'écrit qu'une fois (récit 21.4). Trois règles, un seul parcours :
// ce sont les mêmes écrans, et un deuxième navigateur pour les relire coûterait
// une minute par lancement sans rien ajouter.
import { chromium } from 'playwright-core'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { DIT_LA_DESTRUCTION, libellesQuiDetruisentSansLeDire } from './destructif.mjs'

// ⚠ LE SECOND TÉMOIN, ET IL NE PEUT PAS VENIR DE LA PAGE. Dans un navigateur,
// `onClick` est un gestionnaire React : ni lisible, ni comparable à quoi que ce
// soit. Ce que la source sait — quels gestes appellent une fonction qui détruit
// — arrive donc ici sous forme de LIBELLÉS, calculés par le même module que
// l'essai unitaire. Une deuxième copie de la règle aurait divergé de la
// première ; c'est déjà ce qui a laissé passer le défaut que la revue a trouvé.
const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')
const sources = {}
for (const nom of readdirSync(RACINE, { recursive: true }))
  if (/\.tsx?$/.test(nom)) sources[nom] = readFileSync(join(RACINE, nom), 'utf8')
const LIBELLES_QUI_DETRUISENT = [...libellesQuiDetruisentSansLeDire(sources)]

const nav = await chromium.launch({
  executablePath: process.env.CHROME
    ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erreurs = []
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()) })
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message))

const manques = []
const verifier = (titre, vrai, detail = '') => {
  console.log(`  ${vrai ? 'ok  ' : 'ÉCHEC'}  ${titre}${detail ? ' — ' + detail : ''}`)
  if (!vrai) manques.push(titre)
}

const pret = () => page.waitForFunction(
  () => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })
const onglet = (n) => page.click(`nav.barre .onglet:has-text("${n}")`)

/**
 * L'audit d'un écran, fait DANS la page pour que la couleur soit celle qu'un
 * œil verrait — `getComputedStyle`, pas la feuille de style.
 *
 * ⚠ LES BOUTONS QUI PORTENT DU TEXTE SAISI SONT ÉCARTÉS, et c'est une clause,
 * pas une commodité : une ligne de checklist nommée « retirer les autocollants »
 * ferait échouer une règle qui ne parle pas d'elle. La règle porte sur les
 * libellés DU PRODUIT. Les cases à cocher, les puces, les onglets et les
 * molettes portent des données du pilote — ils sont hors sujet.
 */
const auditer = (nom) => page.evaluate(([ecran, motsQuiDetruisent, libellesDuGeste]) => {
  const rouge = getComputedStyle(document.documentElement)
    .getPropertyValue('--alerte').trim().toLowerCase()
  // #FF5C5C → rgb(255, 92, 92). On compare sur les composantes, jamais sur la
  // chaîne : le navigateur rend `rgb(...)` et la feuille écrit `#...`.
  const composantes = (h) => {
    const n = parseInt(h.replace('#', ''), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const [r0, v0, b0] = composantes(rouge)
  const estLeRouge = (couleur) => {
    const m = couleur.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    return !!m && +m[1] === r0 && +m[2] === v0 && +m[3] === b0
  }

  const PORTE_UNE_DONNEE = ['coche', 'puce', 'onglet', 'molette-item', 'circuit', 'atelier']
  // Le mot et le geste, tous deux venus de `destructif.mjs` : la règle n'est
  // écrite qu'une fois, et cette page ne fait que l'appliquer.
  const DETRUIT = new RegExp(motsQuiDetruisent, 'i')
  const PAR_LE_GESTE = new Set(libellesDuGeste)

  const boutons = []
  for (const b of document.querySelectorAll('button')) {
    if (!b.offsetParent && b.offsetHeight === 0) continue     // masqué : il ne se lit pas
    const classes = [...b.classList]
    if (classes.some((c) => PORTE_UNE_DONNEE.includes(c))) continue
    const s = getComputedStyle(b)
    const texte = (b.innerText || '').replace(/\s+/g, ' ').trim()
    boutons.push({
      ecran,
      texte,
      classe: classes.includes('destructif'),
      // La FORME, pour exiger que le parcours les rencontre toutes les deux :
      // un lien qui ouvre une confirmation et un bouton qui détruit ne portent
      // pas le même dessin, et n'ont donc pas la même façon de le rater.
      forme: classes.includes('bouton') ? 'bouton' : classes.includes('lien') ? 'lien' : 'autre',
      rouge: estLeRouge(s.color) || estLeRouge(s.borderTopColor),
      detruit: DETRUIT.test(texte) || PAR_LE_GESTE.has(texte.toLowerCase()),
      parLeGeste: PAR_LE_GESTE.has(texte.toLowerCase()) && !DETRUIT.test(texte),
    })
  }
  return {
    ecran,
    boutons,
    texte: (document.body.innerText || '').replace(/\s+/g, ' '),
  }
}, [nom, DIT_LA_DESTRUCTION.source, LIBELLES_QUI_DETRUISENT])

const vus = []
const passer = async (nom) => {
  const a = await auditer(nom)
  vus.push(a)
  console.log(`  · ${nom} — ${a.boutons.length} bouton(s) lus`)
}

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

// ── Le parcours. On ouvre tout ce qui porte un geste destructif atteignable
//    sans compte : le garage, l'équipement, un poste d'atelier, la liste des
//    roulages. L'effacement du compte, lui, n'apparaît qu'avec une identité —
//    il est gardé par l'essai unitaire, qui lit la source et n'a pas besoin de
//    session.
await passer('accueil')
await onglet('GARAGE')
await page.waitForSelector('.garage.vide', { timeout: 20_000 })
await passer('garage vide')

await page.fill('.champ[placeholder="Honda"]', 'Yamaha')
await page.fill('.champ[placeholder="CBR 1000 RR"]', 'R6')
await page.click('text=Déclarer ma moto')
await page.waitForSelector('.garage .modele', { timeout: 20_000 })
await passer('garage')

// Une pièce d'équipement : elle porte « retirer », et à côté de lui la
// fabrication d'un portrait, qui coûte de l'argent SANS rien détruire. Les deux
// voisins sont exactement le cas que la règle doit départager.
// L'équipement est un sommaire replié — il faut l'ouvrir avant d'y déclarer
// quoi que ce soit, exactement comme un pilote le fait.
await page.click('.atelier.equipement .atelier-tete')
await page.click('.atelier.equipement .lien:has-text("Déclarer une pièce")')
await page.fill('.champ[placeholder="Combinaison cuir"]', 'Casque Shoei')
await page.click('.atelier.equipement .bouton:has-text("Déclarer")')
await page.waitForSelector('.materiel', { timeout: 20_000 })
await passer('équipement')

await page.click('button.atelier:has-text("Entretien")')
await page.waitForSelector('.poste-page.entretien', { timeout: 20_000 })
await passer("poste d'atelier")
await page.click('.poste-page .lien:has-text("garage")')
await page.waitForSelector('.garage .modele', { timeout: 20_000 })

await page.click('text=Reprendre la saison 2026 · Pau-Arnos')
await page.waitForTimeout(1200)
await onglet('ROULAGES')
await page.waitForSelector('.pile .bloc', { timeout: 20_000 })
await passer('roulages')

// ── LA CONFIRMATION S'OUVRE, ET RIEN NE SE CONFIRME. C'est le seul endroit
//    atteignable sans compte où vit un `.bouton.destructif` derrière deux temps.
//    On en ressort par « Garder » — le sortant du produit, celui qui ne détruit
//    rien — et la journée est encore là ensuite : l'essai le vérifie, sans quoi
//    il pourrait effacer une saison en croyant l'auditer.
await page.click('.lien.destructif:has-text("Retirer cette journée")')
await page.waitForSelector('.bouton.destructif:has-text("Retirer définitivement")', { timeout: 20_000 })
await passer('roulages · confirmation ouverte')
await page.click('.lien:has-text("Garder")')
await page.waitForSelector('.lien.destructif:has-text("Retirer cette journée")', { timeout: 20_000 })
verifier('se raviser n\'a rien retiré',
  (await page.locator('.lien.destructif:has-text("Retirer cette journée")').count()) === 5,
  `${await page.locator('.lien.destructif:has-text("Retirer cette journée")').count()} journée(s) restante(s)`)

await onglet('COMPTE')
await page.waitForSelector('section.compte', { timeout: 20_000 })
await passer('compte')

// ── LA SONDE, et son bouton rouge qui n'a PAS de deux temps : il exécute
//    quatre DELETE au premier tap. Il n'est ni tapé ni approché — on le lit.
//    C'est le second `.bouton.destructif` du parcours, et le seul du produit qui
//    détruise d'un seul geste.
await page.click('summary:has-text("Diagnostic et aide")')
await page.click('.lien:has-text("Instruments et sonde")')
await page.waitForSelector('text=Sonde 0.1 — instrument', { timeout: 20_000 })
await passer('sonde')
await page.click('.bouton:has-text("Retour au compte")')
await page.waitForSelector('section.compte', { timeout: 20_000 })

// ── ① LE ROUGE VA À CE QUI DÉTRUIT, ET SEULEMENT LÀ.
const tous = vus.flatMap((v) => v.boutons)
const muets = tous.filter((b) => b.detruit && !(b.classe && b.rouge))
const criards = tous.filter((b) => !b.detruit && b.rouge)
console.log(`\n① ${tous.length} boutons lus sur ${vus.length} écrans`)
verifier('tout bouton qui détruit porte la classe ET le rouge calculé',
  muets.length === 0, muets.map((b) => `${b.ecran} · « ${b.texte} »`).join(' | '))
verifier('aucun bouton qui ne détruit pas ne porte le rouge',
  criards.length === 0, criards.map((b) => `${b.ecran} · « ${b.texte} »`).join(' | '))
// Un essai qui ne peut pas échouer ne vaut rien : s'il n'a vu AUCUN destructif,
// c'est le parcours qui est cassé, pas la règle qui est tenue.
const rouges = tous.filter((b) => b.classe)
verifier('le parcours a bien rencontré des gestes destructifs',
  rouges.length >= 3, `${rouges.length} vu(s) : ${rouges.map((b) => b.texte).join(', ')}`)

// ⚠ ET CHAQUE FORME AU MOINS UNE FOIS. Le parcours ne croisait que des
// `.lien.destructif` : les quatre `.bouton.destructif` du produit vivaient
// derrière des confirmations qu'il n'ouvrait pas, si bien que la moitié des
// formes du rouge n'était gardée par personne — celle qui détruit pour de vrai.
// Compter les rouges ne suffit pas : dix liens rouges laisseraient encore un
// bouton rouge sans garde.
for (const forme of ['bouton', 'lien']) {
  const vusDeCetteForme = rouges.filter((b) => b.forme === forme)
  verifier(`le parcours a vu au moins un .${forme}.destructif`, vusDeCetteForme.length > 0,
    vusDeCetteForme.map((b) => `${b.ecran} · « ${b.texte} »`).join(' | '))
}

// ⚠ ET LE SECOND TÉMOIN DOIT AVOIR SERVI. S'il ne reconnaît plus aucun libellé,
// la garde retombe sur le seul mot — l'état exact que la revue a condamné — et
// personne ne s'en apercevrait, puisque tout continuerait de passer.
verifier('le second témoin reconnaît des gestes dans les sources',
  LIBELLES_QUI_DETRUISENT.length >= 5,
  `${LIBELLES_QUI_DETRUISENT.length} libellé(s) : ${LIBELLES_QUI_DETRUISENT.join(', ')}`)
const parLeGeste = tous.filter((b) => b.parLeGeste)
console.log(`   dont ${parLeGeste.length} bouton(s) reconnus par leur GESTE seul`
  + (parLeGeste.length ? ` : ${parLeGeste.map((b) => b.texte).join(', ')}` : ''))

// ── ② LE MOT « MACHINE » A QUITTÉ L'ÉCRAN — récit 21.1.
const bavards = vus.filter((v) => /\bmachines?\b/i.test(v.texte))
console.log('\n②')
verifier('aucun écran ne dit « machine »', bavards.length === 0,
  bavards.map((v) => `${v.ecran} · ${(v.texte.match(/.{0,40}\bmachines?\b.{0,40}/i) ?? [''])[0]}`)
    .join(' | '))
// Même garde à l'envers : si « moto » a disparu partout, c'est que le parcours
// ne charge plus le garage et que l'essai ci-dessus passe pour rien.
verifier('le garage parle bien de motos',
  vus.some((v) => /\bmotos?\b/i.test(v.texte)))

// ── ③ « EFFACER MON COMPTE » NE S'ÉCRIT QU'UNE FOIS — récit 21.4.
//    Sans compte le bloc ne se rend pas : on ne peut alors garantir que
//    « au plus une fois ». Le « exactement une fois » est gardé sur la source,
//    dans les essais unitaires.
const compte = vus.find((v) => v.ecran === 'compte')
const fois = (compte.texte.match(/effacer mon compte/gi) ?? []).length
console.log('\n③')
verifier('« effacer mon compte » ne s\'écrit pas deux fois', fois <= 1, `${fois} occurrence(s)`)

await page.screenshot({ path: process.argv[2] ?? '/tmp/destructif.png', fullPage: true })
verifier('aucune erreur de console', erreurs.length === 0, erreurs.join(' | '))
await nav.close()

if (manques.length) {
  console.error(`\n✗ ${manques.length} vérification(s) en échec :\n  · ${manques.join('\n  · ')}`)
  process.exit(1)
}
console.log('\n✓ le rouge ne dit qu\'une chose, et les mots ne se répètent plus')
