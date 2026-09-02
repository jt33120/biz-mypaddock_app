// L'ANALYSE — le cinquième onglet, ses trois rangées de puces, et sa porte.
//
// ⚠ ELLE EXISTE POUR VOIR CE QU'AUCUN ESSAI UNITAIRE NE PEUT VOIR. Un essai
// unitaire lit du texte : il ne peut pas constater qu'un onglet manque, qu'une
// puce ne mène nulle part, ou qu'un raccourci ouvre un écran neutre au lieu de
// la question qu'il annonçait. Le lot précédent l'a payé — une colonne posée en
// base, lue par un écran, exigée par une fabrique, ÉCRITE PAR PERSONNE : tout
// compilait, 186 essais passaient, et le bloc ne s'affichait sur aucun écran.
//
// Ce banc protège donc, dans l'ordre d'importance :
//
//   ① UX-DR9, LES DEUX MOITIÉS. L'onglet ANALYSE est ABSENT au démarrage, et il
//     APPARAÎT une fois la porte franchie — une dépense suffit. La moitié qu'on
//     oublie de vérifier est toujours la première : un onglet qu'on rend à plat
//     passe tous les essais du monde, et la règle n'est plus qu'un commentaire.
//   ② LES DEUX PREMIÈRES RANGÉES SE RECOMPOSENT VRAIMENT. Un pilote qui n'a
//     qu'une dépense ne doit voir AUCUNE puce morte, aucun gris, aucun
//     « bientôt » — et c'est le seul écran du produit dont le contenu décide de
//     ses propres commandes. On les tape donc TOUTES, une par une, et chacune
//     doit rendre de la matière : c'est la seule définition non contournable de
//     « puce vivante ».
//   ③ LE TITRE SUIT LA PUCE, AU MOT PRÈS. La phrase de lecture est la légende du
//     tracé ; un dessin qui contredit sa légende est pire qu'un dessin sans
//     légende, parce qu'on croit le dessin.
//   ④ LES PORTES PRÉ-RÉGLÉES ARRIVENT SUR DES MOLETTES DÉJÀ TOURNÉES. Un lien qui
//     annonce « ce que chaque moto t'a coûté » et qui ouvre le premier
//     croisement venu ne se distingue pas d'un lien cassé : rien ne plante, donc
//     rien ne le signale. C'est exactement le défaut qu'un banc voit et qu'un
//     essai unitaire ne voit pas.
//   ⑤ LES LIGNES ROUGES DU PRODUIT, LÀ OÙ ELLES SE LISENT : aucun mot de
//     jugement, aucun pourcentage, aucune couleur qui range (`--alerte` ne sert
//     QU'À CE QUI DÉTRUIT), et RIEN SUR LES CHUTES — une série « X roulages sans
//     chute » créerait une pression à ne pas déclarer.
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
const ranger = (t) => (t ?? '').replace(/\s+/g, ' ').trim()
const onglet = (n) => page.click(`nav.barre .onglet:has-text("${n}")`)
const onglets = () => page.$$eval('nav.barre .onglet', (n) => n.map((x) => x.textContent.trim()))

/**
 * ⚠ LA SAISON EST CELLE DU PRODUIT, PAS CELLE DE L'HORLOGE. Les cinq roulages
 * que ce banc verse viennent de « Reprendre la saison 2026 · Pau-Arnos »
 * (`importerSaison`, src/ecrans/Garage.tsx) : leurs dates sont écrites dans le
 * produit, en 2026. La période retenue par l'analyse est la saison la plus
 * récente SAISIE — donc 2026, quel que soit le jour où ce banc tourne. Écrire
 * ici `new Date().getFullYear()` rendrait l'essai rouge le 1er janvier sur un
 * produit parfaitement juste, ce qui est pire qu'un essai absent.
 */
const SAISON = 2026

/**
 * LA TABLE DES CROISEMENTS, RECOPIÉE — et c'est le seul endroit du banc où un mot
 * du produit est réécrit à la main.
 *
 * ⚠ C'EST VOULU, ET C'EST TOUT L'INTÉRÊT. Importer `CROISEMENTS` depuis
 * `src/db/analyse.ts` vérifierait que le produit s'égale lui-même : un mot changé
 * des deux côtés en même temps passerait, et une phrase de lecture qui dérive est
 * précisément ce qu'on vient regarder. La copie est donc la mesure indépendante ;
 * elle vieillit, et le jour où elle vieillit, elle rougit — c'est son travail.
 *
 * Les accords viennent de `saisonDite` / `saisonAccorde` / `quandDit` : sujet
 * pluriel pour « toutes tes saisons », singulier pour une saison nommée.
 */
const lecture = (annees) => {
  const dite = annees.length ? `ta saison ${annees[0]}` : 'toutes tes saisons'
  const accorde = annees.length === 1 ? 'a' : 'ont'
  const quand = annees.length ? ` en ${annees.join(', ')}` : ', toutes saisons confondues'
  return {
    'MAINTENANCE|Moto': `Les gestes d'atelier que tu as consignés${quand}, moto par moto.`,
    'MAINTENANCE|Catégorie': `Les gestes d'atelier que tu as consignés${quand}, par nature.`,
    'MAINTENANCE|Mois': `Les gestes d'atelier que tu as consignés${quand}, mois après mois.`,
    'FINANCE|Poste': `Ce que ${dite} ${accorde} coûté, poste par poste.`,
    'FINANCE|Mois': `Ce que ${dite} ${accorde} coûté, mois après mois.`,
    'FINANCE|Journée': `Ce que ${dite} ${accorde} coûté, journée par journée.`,
    'FINANCE|Moto': `Ce que ${dite} ${accorde} coûté, moto par moto.`,
    'FINANCE|Année': 'Ce que chacune de tes saisons a coûté.',
    'PERFORMANCE|Circuit': 'Ton meilleur tour, circuit par circuit, roulage après roulage.',
    'PERFORMANCE|Mois': `Les journées que tu as roulées${quand}, mois après mois.`,
    'PERFORMANCE|Moto': `Les journées que tu as roulées${quand}, moto par moto.`,
  }
}

const puces = (groupe) =>
  page.locator(`.analyse-choix .puces[aria-label="${groupe}"] .puce`)

const titreLu = async () => {
  // Le titre est le PREMIER `.sous-titre` de l'écran, quelle que soit la forme :
  // `Barres` et `Suite` le posent en tête de leur bloc, et l'écran le pose
  // lui-même au-dessus du lot de courbes. Le cadre du choix n'en contient aucun.
  const n = page.locator('.analyse-ecran .sous-titre').first()
  return await n.count() ? ranger(await n.textContent()) : ''
}

const attendreTitre = async (attendu) => {
  try {
    await page.waitForFunction((t) => {
      const n = document.querySelector('.analyse-ecran .sous-titre')
      return !!n && n.textContent.replace(/\s+/g, ' ').trim() === t
    }, attendu, { timeout: 15_000 })
    return true
  } catch { return false }
}

/**
 * DE LA MATIÈRE, C'EST-À-DIRE DES BARRES OU UN TRACÉ — jamais un cadre vide.
 *
 * ⚠ ELLE ATTEND, ELLE NE CONSTATE PAS. Le croisement du chrono va chercher ses
 * courbes dans un second temps (`courbesDesCircuits`) : lire le DOM juste après
 * le tap rendrait zéro sur un écran qui se remplit une milliseconde plus tard,
 * et le banc accuserait le produit d'un défaut qui n'existe pas.
 */
const attendreLeTrace = async () => {
  try {
    await page.waitForFunction(() => {
      const e = document.querySelector('.analyse-ecran')
      if (!e) return false
      return e.querySelectorAll('.barre-argent-ligne').length
        + e.querySelectorAll('.courbe svg.trace').length > 0
    }, null, { timeout: 15_000 })
    return true
  } catch { return false }
}

await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await pret()

/* ═══════════════════════════════════════════════════════════════════════════
   ① UX-DR9 — L'ONGLET N'EST PAS LÀ, ET C'EST LA MOITIÉ DE LA VALEUR DE L'ÉCRAN
   ═══════════════════════════════════════════════════════════════════════════
   ANALYSE est le premier onglet du produit qui applique vraiment la règle : les
   quatre autres sont rendus à plat. Vérifier son ABSENCE au premier lancement
   est donc la seule façon de savoir que la règle est tenue et pas commentée. */
/* ⚠ ON ATTEND LA BARRE AVANT DE LA LIRE, et ce garde a été ajouté APRÈS coup —
   2 septembre 2026. `$$eval` sur une barre pas encore rendue ne lève rien : il
   rend un tableau VIDE. La première assertion rougissait donc avec un détail
   vide (« attendu … lu “” »), ce qui est déjà mauvais — mais la seconde, elle,
   PASSAIT : `[].includes('ANALYSE')` est faux, donc « ANALYSE n'est nulle part »
   se vérifiait sur un écran où il n'y avait rien du tout.
   Un garde qui se satisfait du néant ne garde rien, et c'est précisément le
   défaut que cet essai existe pour attraper chez le produit. Il l'avait
   lui-même. La longueur est donc vérifiée AVANT le contenu : tant qu'on n'a pas
   lu quatre onglets, on n'a rien lu. */
await page.waitForFunction(
  () => document.querySelectorAll('nav.barre .onglet').length >= 4, null, { timeout: 20_000 })
const barreNeuve = await onglets()
/* ⚠ « Accueil » ET « Compte » S'ÉCRIVENT EN MINUSCULES ICI, ET C'EST JUSTE —
   2 septembre 2026. Ces deux onglets ne portent plus de mot mais un GLYPHE, dont
   le nom accessible vit dans le `<title>` du SVG : c'est ce titre que rend
   `textContent`, et c'est lui que lit un lecteur d'écran. Les trois autres
   portent toujours leur mot en capitales, parce qu'ils sont la matière du carnet
   et qu'on les cherche par leur nom.
   La casse différente n'est donc pas une négligence : elle dit exactement ce que
   l'écran montre — trois mots affichés, deux noms qui ne s'affichent pas. */
verifier('① au premier lancement, quatre onglets et pas cinq',
  barreNeuve.join(' · ') === 'Accueil · GARAGE · ROULAGES · Compte', barreNeuve.join(' · '))
verifier('   ANALYSE n\'est nulle part',
  barreNeuve.length === 4 && !barreNeuve.includes('ANALYSE'), barreNeuve.join(' · '))

/* ── ① bis LA PORTE SE FRANCHIT AVEC UNE DÉPENSE, ET RIEN D'AUTRE ──────────
   « Au moins une dépense, ou trois journées vécues, ou un geste consigné »
   (`aDeQuoiAnalyser`). La dépense est la moins chère des trois, et c'est le
   chemin qu'un pilote emprunte avant même son premier roulage. */
await page.click('.action-depense')
await page.waitForSelector('section.depense', { timeout: 20_000 })
await page.click('section.depense .puce:has-text("ESSENCE")')
await page.fill('#montant', '96,40')
await page.fill('#libelle', 'Plein aller-retour')
await page.click('section.depense .bouton:not(.secondaire)')
await page.waitForSelector('nav.barre .onglet:has-text("ANALYSE")', { timeout: 20_000 })
const barreOuverte = await onglets()
verifier('   une dépense notée, et le cinquième onglet arrive',
  barreOuverte.join(' · ') === 'Accueil · GARAGE · ROULAGES · ANALYSE · Compte',
  barreOuverte.join(' · '))

/* ═══════════════════════════════════════════════════════════════════════════
   ② L'ÉCRAN DU PILOTE QUI N'A QU'UNE DÉPENSE
   ═══════════════════════════════════════════════════════════════════════════
   C'est le cas qui décide si ce lieu vaut quelque chose avant la dixième
   journée. Il n'a ni moto, ni roulage, ni geste : les deux rangées du haut
   doivent s'être TUES ou RÉDUITES, jamais grisées.

   ⚠ ET LA PÉRIODE VAUT LA SAISON, PAS « TOUTES ». Une dépense porte sa saison,
   donc une année existe déjà — la rangée se tait parce qu'UNE saison n'est pas
   un choix, pas parce qu'il n'y en aurait aucune. Les deux se ressemblent à
   l'écran (aucune puce) et disent le contraire dans la phrase : « ta saison 2026
   a coûté » et non « toutes tes saisons ont coûté ». Masqué n'est pas absent, et
   c'est ce banc qui l'a établi — il attendait le pluriel, il a lu le singulier,
   et c'est l'attente qui avait tort. */
await onglet('ANALYSE')
await page.waitForSelector('.analyse-ecran', { timeout: 20_000 })
verifier('② l\'écran se monte sur la seule dépense', await page.isVisible('.analyse-ecran'))
verifier('   la rangée des domaines s\'est tue — un domaine n\'est pas un choix',
  await puces('Domaine').count() === 0,
  (await puces('Domaine').allTextContents()).join(' · '))
verifier('   la rangée des périodes aussi — une seule saison n\'est pas un choix',
  await puces('Période').count() === 0)
const axesSeuls = (await puces('Selon quoi').allTextContents()).map(ranger)
verifier('   la rangée du milieu ne propose que ce qui existe',
  axesSeuls.includes('Poste') && axesSeuls.includes('Mois')
  && !axesSeuls.includes('Journée') && !axesSeuls.includes('Année'),
  axesSeuls.join(' · '))
verifier('   aucune puce éteinte, aucun « bientôt »',
  await page.locator('.analyse-choix .puce[disabled], .analyse-choix .puce[aria-disabled="true"]')
    .count() === 0)

/**
 * LE PARCOURS COMPLET DES DEUX PREMIÈRES RANGÉES.
 *
 * On tape CHAQUE puce et on exige deux choses d'elle : que le titre devienne
 * exactement la phrase que la table promet pour ce croisement, et qu'il y ait
 * quelque chose de dessiné dessous. Une puce qui ouvre sur du vide est le défaut
 * que ce banc existe pour attraper — et c'est aussi celui qu'aucune assertion de
 * texte ne peut voir, puisqu'un écran vide n'a pas de texte à démentir.
 *
 * `domaineSiSeul` sert quand la rangée du haut s'est tue : elle ne dit alors plus
 * son nom, mais le domaine est connu par ailleurs.
 */
const parcourir = async (annees, domaineSiSeul) => {
  const TABLE = lecture(annees)
  const noms = (await puces('Domaine').allTextContents()).map(ranger)
  const liste = noms.length ? noms : [domaineSiSeul]
  for (let i = 0; i < liste.length; i++) {
    const dom = liste[i]
    if (noms.length) {
      await puces('Domaine').nth(i).click()
      await page.waitForFunction((n) => {
        const b = document.querySelectorAll(
          '.analyse-choix .puces[aria-label="Domaine"] .puce')[n]
        return !!b && b.getAttribute('data-actif') === '1'
      }, i, { timeout: 15_000 })
    }
    const axes = (await puces('Selon quoi').allTextContents()).map(ranger)
    if (!axes.length) {
      // Un domaine à une seule lecture ne montre pas de rangée : une puce unique,
      // toujours active, est un bouton qui appelle le doigt et ne fait rien.
      const attendus = Object.entries(TABLE)
        .filter(([c]) => c.startsWith(`${dom}|`)).map(([, p]) => p)
      const t = await titreLu()
      verifier(`   ${dom} · rangée muette, et le titre dit quand même quoi`,
        attendus.includes(t), t)
      verifier(`   ${dom} · et il y a de la matière dessous`, await attendreLeTrace())
      continue
    }
    for (let j = 0; j < axes.length; j++) {
      const mot = axes[j]
      const attendu = TABLE[`${dom}|${mot}`]
      await puces('Selon quoi').nth(j).click()
      verifier(`   ${dom} · ${mot} — le titre suit la puce`,
        !!attendu && await attendreTitre(attendu),
        attendu ? `attendu « ${attendu} », lu « ${await titreLu()} »` : `puce inconnue : ${mot}`)
      verifier(`   ${dom} · ${mot} — aucune puce morte, il y a un tracé`,
        await attendreLeTrace())
    }
  }
}
await parcourir([SAISON], 'FINANCE')

/* ═══════════════════════════════════════════════════════════════════════════
   ③ LE DÉCOR COMPLET — une moto, une saison, un geste, une facture de pneus
   ═══════════════════════════════════════════════════════════════════════════
   Il faut les trois domaines à l'écran pour que les deux questions suivantes
   veuillent dire quelque chose : que les rangées se RECOMPOSENT (et pas
   seulement qu'elles existent), et qu'une porte pré-réglée tombe ailleurs que
   sur le premier croisement de la table. */
await onglet('GARAGE')
await page.waitForSelector('.garage.vide', { timeout: 20_000 })
await page.fill('.champ[placeholder="Honda"]', 'Yamaha')
await page.fill('.champ[placeholder="CBR 1000 RR"]', 'R6')
await page.fill('.champ[placeholder="2010"]', '2019')
await page.click('text=Déclarer ma moto')
await page.waitForSelector('.garage .modele', { timeout: 20_000 })

// Quatre roulages chronométrés à Pau-Arnos et un annoncé : c'est la saison que
// le produit sait verser lui-même, par son chemin d'écriture normal.
await page.click('text=Reprendre la saison 2026 · Pau-Arnos')
// Cinq écritures s'enchaînent derrière ce tap : on laisse la page les poser
// avant de la quitter, puis on ATTEND LE RÉSULTAT plutôt que le délai — un banc
// qui se fie à une durée devient rouge le jour où la machine est chargée.
await page.waitForTimeout(1200)
await onglet('ROULAGES')
/* ⚠ ON DÉPLIE AVANT DE COMPTER — lot 3, 2 septembre 2026. « Passés » ne rend que
   les trois dernières journées : compter les `.glissable` rendus ne compte plus
   les journées ÉCRITES, et cette attente-là veut vérifier que les cinq écritures
   ont abouti, pas combien la liste en montre. On révèle donc le reste, puis on
   compte — le lien porte lui-même le nombre qu'il cache, il n'y a rien de
   silencieux à contourner. */
await page.waitForFunction(
  () => document.querySelectorAll('.glissable').length >= 1, null, { timeout: 30_000 })
const revele = page.locator('.groupe-roulages .lien:has-text("Voir les")')
if (await revele.count()) await revele.first().click()
await page.waitForFunction(
  () => document.querySelectorAll('.glissable').length >= 5, null, { timeout: 30_000 })

// UNE SECONDE SAISON, ET C'EST LA SEULE FAÇON DE FAIRE APPARAÎTRE LA TROISIÈME
// RANGÉE. Elle n'existe qu'à partir de deux années saisies — la règle de
// `Saison.tsx`, reprise mot pour mot par l'analyse : une molette à un seul cran
// est un bouton qui invite au doigt et ne fait rien. La journée est ANCIENNE et
// sans chrono ; elle n'a rien à prouver d'autre que son année.
await onglet('ACCUEIL')
await page.click('text=/Saisir (mon premier roulage|un roulage)/')
await page.fill('.champ[placeholder="Pau-Arnos"]', 'Nogaro')
await page.fill('input[type=date]', '2025-09-13')
await page.click('text=Continuer')
// La journée est écrite avant que l'écran de chrono ne s'ouvre : on repart sans
// la chronométrer, un roulage sans tour reste un roulage vécu.
await page.waitForSelector('.molettes', { timeout: 30_000 })

// UN GESTE D'ATELIER, CHIFFRÉ — il ouvre MAINTENANCE, et son argent désigne une
// machine, donc il ouvre aussi la porte du garage vers FINANCE · MOTO.
await onglet('GARAGE')
await page.click('button.atelier:has-text("Entretien")')
await page.waitForSelector('.poste-page', { timeout: 20_000 })
await page.click('text=Consigner un geste')
await page.fill('.champ[placeholder="Plaquettes avant"]', 'Plaquettes avant')
await page.fill('.champ[placeholder="montant, si tu l\'as"]', '145,90')
await page.click('.bouton:has-text("C\'est fait aujourd\'hui")')
await page.waitForSelector('.geste-atelier', { timeout: 20_000 })
await page.click('.poste-page .lien:has-text("garage")')
await page.waitForSelector('.garage-titre .modele', { timeout: 20_000 })

// Une facture de pneus, SUR LA MOTO : c'est la cible que le poste propose par
// défaut, et c'est elle qui donne sa matière à FINANCE · MOTO.
await page.click('.atelier-tete:has-text("Budget ·")')
await page.click('.ligne-atelier.poste:has-text("Pneus")')
await page.fill('.champ[placeholder="montant en €"]', '389,90')
await page.click('.bouton.secondaire:has-text("Ajouter à")')
// La saisie se REFERME quand l'écriture a abouti : attendre sa disparition, c'est
// attendre la ligne en base. Un délai fixe attendrait autre chose que ce qui
// compte, et se tromperait un jour sur deux.
await page.waitForSelector('.champ[placeholder="montant en €"]',
  { state: 'detached', timeout: 20_000 })

/* ═══════════════════════════════════════════════════════════════════════════
   ④ LES RANGÉES SE SONT RECOMPOSÉES — et chaque puce mène quelque part
   ═══════════════════════════════════════════════════════════════════════════ */
await onglet('ANALYSE')
await page.waitForSelector('.analyse-ecran', { timeout: 20_000 })
const domaines = (await puces('Domaine').allTextContents()).map(ranger)
verifier('④ les trois domaines sont là, dans l\'ordre de la table',
  domaines.join(' · ') === 'MAINTENANCE · FINANCE · PERFORMANCE', domaines.join(' · '))
verifier('   l\'onglet ouvre sur un écran NEUTRE : le premier domaine vivant',
  await puces('Domaine').nth(0).getAttribute('data-actif') === '1')
await parcourir([SAISON], 'MAINTENANCE')

/* ── ④bis LA TROISIÈME RANGÉE, ET CE QU'ELLE CHANGE AU TITRE ───────────────
   La période est la seule rangée qui ne recompose pas les deux autres mais qui
   RÉÉCRIT la phrase : « en 2026 » devient « toutes saisons confondues », et le
   sujet passe au pluriel. C'est un accord de verbe, donc exactement le genre de
   détail qu'on lit juste en écrivant le code et faux à l'écran — « Ce que toutes
   tes saisons A COÛTÉ » a été vu, précisément comme ça. */
const periodes = (await puces('Période').allTextContents()).map(ranger)
verifier('④bis la rangée des périodes arrive avec la deuxième saison',
  periodes.join(' · ') === '2026 · 2025 · TOUTES', periodes.join(' · '))
verifier('   et elle démarre sur la saison la plus récente',
  await puces('Période').nth(0).getAttribute('data-actif') === '1')

// On repart du croisement neutre : c'est celui dont on connaît les deux phrases.
await puces('Domaine').nth(0).click()
await attendreTitre(lecture([SAISON])['MAINTENANCE|Moto'])
await page.click('.analyse-choix .puces[aria-label="Période"] .puce:has-text("TOUTES")')
verifier('   « TOUTES » réécrit la phrase, verbe accordé',
  await attendreTitre(lecture([])['MAINTENANCE|Moto']), await titreLu())
await puces('Période').nth(0).click()
verifier('   et la saison la ramène telle qu\'elle était',
  await attendreTitre(lecture([SAISON])['MAINTENANCE|Moto']), await titreLu())

/* ═══════════════════════════════════════════════════════════════════════════
   ⑤ LES PORTES PRÉ-RÉGLÉES ARRIVENT SUR LES PUCES DÉJÀ TOURNÉES
   ═══════════════════════════════════════════════════════════════════════════
   Le défaut qu'on cherche ici ne plante pas : un raccourci dont le pré-réglage
   se perd retombe sur le premier croisement vivant, l'écran se rend, rien ne
   rougit. C'est exactement ce qui le rend invisible en essai et visible au doigt
   — et c'est pour ça que la première assertion de chaque porte est que le
   domaine actif N'EST PAS celui qu'un écran neutre aurait montré. */
const arriveeSur = async (domaine, mot, annees) => {
  await page.waitForSelector('.analyse-ecran', { timeout: 20_000 })
  const d = ranger(await page.locator(
    '.analyse-choix .puces[aria-label="Domaine"] .puce[data-actif="1"]').first().textContent())
  const a = ranger(await page.locator(
    '.analyse-choix .puces[aria-label="Selon quoi"] .puce[data-actif="1"]').first().textContent())
  verifier(`⑤ la porte ouvre sur ${domaine} · ${mot}`, d === domaine && a === mot, `${d} · ${a}`)
  verifier('   et le titre est celui de ce croisement-là',
    await attendreTitre(lecture(annees)[`${domaine}|${mot}`]), await titreLu())
  verifier('   et le tracé est dessous', await attendreLeTrace())
}

// LA PORTE DU GARAGE — FINANCE · MOTO. Un écran neutre aurait montré MAINTENANCE.
// ⚠ ET ELLE OUVRE SUR « TOUTES » — d'où le tableau vide. C'est la seule des trois
// portes dont le libellé ne nomme aucune saison : « ce que chaque moto t'a coûté »
// se lit sur la vie de la machine. Les deux autres nomment la leur et ouvrent
// dessus ; celle-ci ouvre sur la période où son garde a été mesuré, sans quoi le
// lien pouvait être offert sur toutes les saisons et retomber sur une saison vide.
await onglet('GARAGE')
await page.waitForSelector('.lien:has-text("Ce que chaque moto t\'a coûté")', { timeout: 20_000 })
await page.click('.lien:has-text("Ce que chaque moto t\'a coûté")')
await arriveeSur('FINANCE', 'Moto', [])

// LA PORTE DU BILAN DE SAISON — FINANCE · POSTE.
await onglet('ROULAGES')
await page.waitForSelector('.saison', { timeout: 20_000 })
// Le bilan est replié depuis le lot 3, et la porte vit à l'intérieur.
const teteSaison = page.locator('.saison .atelier-tete')
if (await teteSaison.getAttribute('aria-expanded') === 'false') await teteSaison.click()
await page.click('.saison .lien:has-text("Cet argent, poste par poste")')
await arriveeSur('FINANCE', 'Poste', [SAISON])

// LA PORTE DU BILAN D'UNE JOURNÉE — PERFORMANCE · CIRCUIT, sous la courbe. Elle
// est la seule des trois qui change de DOMAINE ET d'axe d'un coup, et la seule
// qui ouvre sur la forme chrono.
await onglet('ROULAGES')
await page.waitForSelector('.glissable', { timeout: 20_000 })
// La PLUS ANCIENNE des cinq : c'est la seule dont on sache qu'elle est vécue
// quel que soit le jour où ce banc tourne, donc la seule qui ouvre à coup sûr un
// bilan et non un écran de préparation. La courbe qu'elle porte est celle du
// CIRCUIT, pas de la journée : ses quatre points sont là dès la première.
// « Passés » ne montre que les trois dernières journées : la plus ancienne est
// sous le pli, et le lien qui l'ouvre COMPTE ce qu'il révèle (lot 3).
const resteRoulages = page.locator('.groupe-roulages .lien:has-text("Voir les")')
if (await resteRoulages.count()) await resteRoulages.first().click()
await page.click('.glissable:has-text("2026-04-18")')
await page.waitForSelector('.courbe', { timeout: 30_000 })
await page.click('.lien:has-text("Tes chronos, circuit par circuit")')
await arriveeSur('PERFORMANCE', 'Circuit', [SAISON])
// UN CHRONO NE S'AGRÈGE JAMAIS SANS SON CIRCUIT : un tracé PAR circuit, et
// chacun nomme le sien. « 1'38 à Pau-Arnos » et « 1'38 à Nogaro » ne se
// comparent pas — c'est faux, pas imprécis.
const courbes = await page.$$eval('.analyse-ecran .courbe .libelle',
  (n) => n.map((x) => x.textContent.trim()).filter((t) => t.startsWith('À ')))
verifier('   chaque courbe nomme son circuit', courbes.length >= 1
  && courbes.every((t) => /^À .+ · \d+ roulages$/.test(t)), courbes.join(' | '))

/* ═══════════════════════════════════════════════════════════════════════════
   ⑥ CE QUI NE DOIT JAMAIS S'ÉCRIRE SUR CET ÉCRAN
   ═══════════════════════════════════════════════════════════════════════════
   On relit l'écran du chrono ET celui d'une composition : les deux formes ne
   posent pas les mêmes phrases, et la règle vaut pour les deux. */
const relire = async () => ranger(await page.textContent('.analyse-ecran'))
const chrono = await relire()
await puces('Domaine').nth(1).click()
// ⚠ ON ATTEND LE TITRE, PAS « UN TRACÉ ». Les courbes du chrono sont encore
// montées à l'instant du tap : une attente qui se contente de compter des tracés
// serait satisfaite par celles-là, et le banc relirait l'écran d'AVANT en croyant
// lire celui d'après. FINANCE ne connaît pas l'axe du circuit — la dérivation
// retombe donc sur son premier axe vivant, le poste.
await attendreTitre(lecture([SAISON])['FINANCE|Poste'])
const argent = await relire()

// Les mots qui RANGENT, qui JUGENT ou qui PROJETTENT. Frontières de mot
// obligatoires : « reste » se cache dans « il reste », mais aussi dans des
// phrases parfaitement légitimes, et un garde qui crie au loup sur du texte juste
// finit désactivé — c'est alors la vraie règle qui n'est plus tenue.
// ⚠ « PROGRESSION » ET « DÉPASSEMENT » N'EN SONT PAS, ET C'EST VÉRIFIÉ DANS LA
// TABLE, PAS SUPPOSÉ. Le produit les écrit tous les deux, à bon droit : « Ta
// progression se lit sur toute son histoire » (PERFORMANCE · Circuit) et « la
// barre la plus longue est le plus gros poste, jamais un dépassement » (FINANCE ·
// Poste) — cette seconde phrase REFUSE le mot qu'elle contient. Les inscrire ici
// rendrait le banc rouge sur un écran juste, et un garde qui crie au loup sur du
// texte légitime finit désactivé : c'est alors la vraie règle qui n'est plus tenue.
const JUGEMENTS = ['moyenne', 'moyen', 'tendance', 'record', 'objectif', 'objectifs',
  'palier', 'classement', 'score']
const EXPRESSIONS = [/il te reste/i, /reste à/i, /à ce rythme/i, /par rapport/i,
  /projection/i, /prévision/i, /\d\s?%/]
for (const [ou, t] of [['chrono', chrono], ['argent', argent]]) {
  const mots = JUGEMENTS.filter((m) =>
    new RegExp(`(^|[^\\p{L}])${m}($|[^\\p{L}])`, 'iu').test(t))
  verifier(`⑥ aucun mot de jugement à l'écran · ${ou}`, mots.length === 0, mots.join(', '))
  const tours = EXPRESSIONS.filter((r) => r.test(t))
  verifier(`   aucune projection, aucun pourcentage · ${ou}`, tours.length === 0,
    tours.map(String).join(' '))
  // LA CLAUSE DE SÉCURITÉ. Aucune lecture de l'analyse ne touche `chute` ni
  // `crash_statut` : une série « X roulages sans chute » créerait une pression à
  // ne pas déclarer, et une chute non déclarée est une chute qu'on ne soigne pas.
  verifier(`   rien sur les chutes · ${ou}`, !/chute|chutes|crash/i.test(t),
    (t.match(/[^.]*chute[^.]*/i) ?? [''])[0])
}

// AUCUNE COULEUR QUI RANGE. `--alerte` ne sert QU'À CE QUI DÉTRUIT — une chute,
// un effacement. Sur un tracé, elle ferait d'un mois cher une faute ; or un mois
// n'est ni cher ni bon marché. La teinte se lit sur un témoin plutôt que d'être
// recopiée : la feuille reste seule à décider ce qu'est le rouge du produit.
const rouges = await page.evaluate(() => {
  const temoin = document.createElement('span')
  temoin.style.color = 'var(--alerte)'
  document.body.appendChild(temoin)
  const alerte = getComputedStyle(temoin).color
  temoin.remove()
  const ecran = document.querySelector('.analyse-ecran')
  if (!ecran) return ['pas d\'écran']
  return [...ecran.querySelectorAll('*')].filter((n) => {
    const s = getComputedStyle(n)
    return [s.color, s.backgroundColor, s.borderTopColor, s.borderLeftColor, s.fill, s.stroke]
      .includes(alerte)
  }).map((n) => n.className || n.tagName)
})
verifier('   aucune couleur d\'alerte sur un tracé', rouges.length === 0, rouges.join(' · '))

/* ═══════════════════════════════════════════════════════════════════════════
   ⑦ LA MAIN GANTÉE, AUX TROIS LARGEURS DU PRODUIT
   ═══════════════════════════════════════════════════════════════════════════
   La rangée du domaine porte trois mots dont MAINTENANCE : à 375 px elle
   enveloppe sur deux lignes, et c'est la seule mise en page qui n'en coupe
   aucun. Ce qui ne doit jamais arriver, c'est qu'elle pousse la page en largeur. */
for (const largeur of [375, 390, 430]) {
  await page.setViewportSize({ width: largeur, height: 844 })
  await page.waitForTimeout(200)
  const deborde = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
  verifier(`⑦ aucun débordement horizontal à ${largeur}px`, !deborde)
  const cibles = await page.$$eval('.analyse-choix .puce',
    (n) => n.map((x) => Math.round(x.getBoundingClientRect().height)))
  verifier(`   les puces restent des cibles gantées à ${largeur}px`,
    cibles.length > 0 && cibles.every((h) => h >= 44),
    `${Math.min(...cibles)} px au plus petit sur ${cibles.length}`)
}
await page.setViewportSize({ width: 390, height: 844 })

await page.screenshot({ path: process.argv[2] ?? '/tmp/analyse.png', fullPage: true })
verifier('⑧ aucune erreur de console', erreurs.length === 0, erreurs.slice(0, 3).join(' | '))

await nav.close()
if (manques.length) {
  console.error(`\n✗ ${manques.length} vérification(s) en échec :\n  · ${manques.join('\n  · ')}`)
  process.exit(1)
}
console.log('\n✓ l\'onglet arrive quand il a de quoi, chaque puce mène quelque part,')
console.log('  et les raccourcis ouvrent la question qu\'ils annoncent')
