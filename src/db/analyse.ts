/**
 * ⚠ CE FICHIER S'APPELLE `analyse` ET SURTOUT PAS `poste` — LA COLLISION EXISTE
 * DÉJÀ, ELLE N'ATTENDAIT QU'UN TROISIÈME SENS. Dans ce dépôt, « poste » désigne
 * DEUX choses sans rapport : `src/ecrans/Poste.tsx` est un POSTE D'ATELIER (une
 * des trois catégories d'intervention, `src/db/atelier.ts`, FR-46), et le `poste`
 * de `src/db/budget.ts` est un POSTE DE DÉPENSE (huit valeurs fermées). Un
 * `src/db/poste.ts` aurait posé le troisième sens du même mot dans le dossier du
 * deuxième. Pour le prochain : l'axe qui montre les trois catégories d'atelier
 * porte ici le mot « Catégorie », JAMAIS « Poste », précisément parce que
 * « Poste » est déjà pris par l'argent — les deux se seraient croisés sur la même
 * rangée de puces, à deux taps l'un de l'autre.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * L'ANALYSE — la table des croisements, et les lectures qui l'alimentent.
 *
 * Le pilote apprend UNE phrase de trois mots : domaine · axe · période. La forme
 * du tracé n'est pas un quatrième choix, elle se DÉDUIT de l'axe — et c'est la
 * table ci-dessous qui la porte, pas l'écran. Une troisième molette « barres ou
 * courbe » aurait laissé tracer une composition en ligne, c'est-à-dire relier
 * huit postes qui n'ont aucun ordre entre eux.
 *
 * ⚠ CE QUE CE FICHIER NE CALCULE JAMAIS, et chaque refus a déjà coûté quelque
 * chose quelque part dans ce dépôt :
 *   · AUCUNE MOYENNE, aucun écart, aucun pourcentage, aucune variation d'une
 *     ligne à la suivante. `bilan.ts` porte la même clause (FR-55) : « le bilan
 *     compte, il ne divise pas ». Il n'y a pas une seule division ici.
 *   · AUCUNE PROJECTION, aucune tendance, aucun lissage. `courbe.ts` la porte
 *     déjà : « une projection sur quatre points est une fiction, et une fiction
 *     qui fixe un objectif que personne n'a choisi ».
 *   · AUCUN PLAFOND dans ce qui sort d'ici. Aucun type de ce fichier n'a de champ
 *     où loger une cible : l'échelle d'une barre est le plus gros de ce qu'on
 *     montre, calculée DANS `Barres`, et rien ici ne peut la contredire.
 *   · AUCUN CHRONO AGRÉGÉ. Il n'existe dans cette table aucun croisement
 *     chrono × mois, × année, × moto ni × poste : « 1'38 à Pau-Arnos » et
 *     « 1'38 à Nogaro » ne se comparent pas, et un chrono par mois n'est pas une
 *     information imprécise, c'est une information FAUSSE (voir `BilanMachine`,
 *     src/db/depot.ts). Le seul axe chronométrique est le CIRCUIT, et il rend la
 *     main à la `Courbe` qui existe déjà, à circuit constant.
 *   · RIEN SUR LES CHUTES. Aucune requête de ce fichier ne touche `chute` ni
 *     `crash_statut`, et c'est une clause de SÉCURITÉ : « 7 roulages sans
 *     chute » fabriquerait une série à ne pas casser, donc une pression à ne pas
 *     déclarer la huitième.
 */

import type { PowerSyncDatabase } from '@powersync/web'
import { estCategorieIntervention, NOM_CATEGORIE } from './atelier'
import {
  grouperParMois, moisDuJour, nomMois, NOM_POSTE, type DepenseDatee, type Poste,
} from './budget'
import { circuitsAvecCourbe, courbeDuCircuit, POINTS_MINIMUM, type Courbe } from './courbe'
import { aplati, formaterEuros, listerMachines } from './depot'
import { A_EU_LIEU, aujourdhui } from './vecu'

/* ─── LES TROIS MOTS ──────────────────────────────────────────────────────── */

/**
 * LE DÉCOUPAGE EST CELUI DU PROPRIÉTAIRE DU PRODUIT, et il vaut mieux que
 * « argent · chrono · roulages » : ce sont des PRÉOCCUPATIONS, pas des mesures.
 * « Ma moto suit-elle », « où part mon argent », « est-ce que j'avance » sont
 * trois questions qu'on se pose séparément — et elles sont ORTHOGONALES à Garage
 * et Roulages, qui sont des OBJETS. Un découpage par mesure aurait rangé les
 * mêmes objets dans un quatrième tiroir, en exigeant du pilote qu'il sache dans
 * quelle unité vit sa question avant de la poser.
 */
export type Domaine = 'maintenance' | 'finance' | 'performance'

/** SELON QUOI on regarde. `roulage` est la journée vécue ; `categorie` est la
 *  catégorie d'ATELIER (voir la collision en tête de fichier). */
export type Axe =
  | 'poste' | 'mois' | 'roulage' | 'moto' | 'annee' | 'circuit' | 'categorie'

/**
 * LA FORME SE DÉDUIT, ELLE NE SE CHOISIT PAS.
 *   · `composition` → `<Barres>` : des parts sans ordre entre elles.
 *   · `suite`       → `<Suite>`  : des pas qu'un ordre relie, par des SEGMENTS
 *                     DROITS, plancher à ZÉRO, axe normal.
 *   · `chrono`      → la `<Courbe>` chrono qui existe déjà, et rien d'autre.
 *
 * ⚠ LA TROISIÈME VALEUR EXISTE POUR RENDRE UNE SEULE CHOSE IMPOSSIBLE : envoyer
 * un temps au tour dans `Suite`. `Suite` a l'axe NORMAL et le plancher à ZÉRO —
 * de l'argent et un décompte se lisent depuis zéro — tandis que `Courbe` a l'axe
 * INVERSÉ et le plancher au minimum mesuré, parce que plus bas veut dire plus
 * rapide. Un chrono passé à `Suite` MONTERAIT à mesure que le pilote progresse,
 * sous une légende disant l'inverse : « un dessin qui contredit sa propre légende
 * est pire qu'un dessin sans légende » (src/ecrans/Courbe.tsx), et ce défaut-là
 * a déjà été payé une fois. Sans cette troisième valeur, la seule façon de mettre
 * le circuit dans la table aurait été de le marquer `suite`.
 */
export type Forme = 'composition' | 'suite' | 'chrono'

/** Ce que la valeur MESURE, et donc comment elle s'écrit. C'est la table qui le
 *  dit : un décompte de gestes passé au formateur d'euros afficherait « 0,03 € »
 *  pour trois interventions, avec l'aplomb d'un montant. */
export type Unite = 'euros' | 'decompte'

/** Ce qu'on compte, au singulier et au pluriel. Sert deux fois — écrire la valeur
 *  (« 3 gestes ») et écrire ce qui manque (« 2 dépenses sans poste ») — donc il
 *  n'existe qu'une fois. */
export type Grain = { un: string; plusieurs: string }

const DEPENSE: Grain = { un: 'dépense', plusieurs: 'dépenses' }
const JOURNEE: Grain = { un: 'journée', plusieurs: 'journées' }
const GESTE: Grain = { un: 'geste', plusieurs: 'gestes' }

/**
 * UNE LIGNE LUE — une barre, ou un pas de la suite. Le même type pour les deux,
 * DÉLIBÉRÉMENT : une suite de moins de trois points se rend en barres, et si les
 * deux formes portaient deux types, cette bascule serait une conversion —
 * c'est-à-dire un endroit où perdre un champ.
 *
 * ⚠ IL N'Y A AUCUN CHAMP OÙ ÉCRIRE UN PLAFOND, UNE CIBLE, UN RANG, UN ÉCART NI
 * UN POURCENTAGE, et c'est la seule garantie durable qu'aucun n'arrivera à
 * l'écran par distraction. C'est la leçon de `LigneMois` (src/db/budget.ts), dont
 * un essai verrouille la liste exacte des champs pour cette raison précise.
 */
export type LigneAnalyse = {
  /** LA CLÉ DE RANG, jamais affichée : `2026-04`, un identifiant de machine ou de
   *  roulage, un nom de circuit aplati. Elle sert à ordonner, à combler et à
   *  CLÉER une liste rendue.
   *
   *  ⚠ `cle` EST UNIQUE, `nom` NE L'EST PAS — deux journées au même circuit
   *  portent le même circuit. Ce qui se rend en liste se clé donc sur `cle`. */
  cle: string
  /** Ce qui est nommé, en clair. La ligne ne se lit jamais sans lui. */
  nom: string
  /** La grandeur qui fait la longueur ou la hauteur. Des centimes, ou un
   *  décompte — `Croisement.unite` tranche, et elle seule. */
  valeur: number
  /** La grandeur DÉJÀ ÉCRITE : « 128,40 € », « 3 gestes ». Le tracé n'a rien à
   *  formater, donc rien à formater de travers — il ne peut pas savoir si `3`
   *  est un décompte ou trois centimes, et un tracé qui devine son unité l'écrit
   *  fausse une fois sur deux. */
  libelle: string
  /** Le nombre de faits derrière la valeur. Pour un décompte il vaut `valeur` ;
   *  pour de l'argent c'est le nombre de dépenses additionnées. C'est lui qui
   *  fait la phrase de complétude — « 2 dépenses sans poste ». */
  n: number
  /** `true` pour ce que le produit ne sait pas ranger : « Sans poste », « Sans
   *  mois », « Sans moto ». Rendu en teinte atténuée par `Barres`, jamais absent
   *  et jamais rangé d'office dans « autre » — les ranger ferait croire qu'un
   *  choix a été fait. C'est la SEULE variation de teinte autorisée : toutes les
   *  barres portent `--miami`, et `--alerte` ne sert qu'à ce qui détruit. */
  incertain?: boolean
}

/**
 * UNE LIGNE DE LA TABLE DES CROISEMENTS — la source UNIQUE de la forme, du mot de
 * la puce, de la phrase de lecture et de la note. Ni l'écran ni les essais ne
 * redéclarent ces mots : un mot recopié est un mot qui diverge, et ce dépôt a
 * déjà payé exactement ça avec un prédicat SQL écrit quatre fois et demie
 * (src/db/vecu.ts).
 */
export type Croisement = {
  domaine: Domaine
  axe: Axe
  /** LE MOT DE LA PUCE — UN SEUL. La préposition vit dans la phrase de lecture,
   *  pas sur la puce : « par poste » et « selon le mois » sur cinq puces
   *  débordent la ligne à 375 px, et une rangée qui passe à la ligne cesse d'être
   *  une rangée. */
  mot: string
  /** LA LECTURE À VOIX HAUTE du croisement, période comprise. Elle prend les
   *  années parce que la période s'écrit différemment selon la phrase — « ta
   *  saison 2026 » en sujet, « en 2026 » en complément. La laisser composer par
   *  l'écran aurait produit deux formulations du même choix, à deux lignes
   *  d'écart. */
  phrase: (annees: readonly number[]) => string
  forme: Forme
  unite: Unite
  grain: Grain
  /** Ce que le tracé montre, en une phrase — et ce qu'il ne montre pas quand il
   *  y a quelque chose à dire. Elle n'est pas décorative : `Barres` et `Suite` la
   *  rendent comme description, et sans elle un lecteur d'écran n'entend qu'une
   *  suite de nombres. Un croisement qui ment sur ses trous est pire qu'un
   *  croisement incomplet — c'est la clause de l'emport. */
  note: string
}

/* ─── LA PÉRIODE ──────────────────────────────────────────────────────────── */

/**
 * TOUTES LES SAISONS — et c'est le TABLEAU VIDE, pas la liste des années.
 *
 * Une lecture qui reçoit `[2025, 2026]` ne peut pas savoir si le pilote a demandé
 * « toutes » (il n'en a que deux) ou coché les deux à la main : la distinction
 * compte, parce que l'axe ANNÉE n'existe que sous « toutes ». Le vide est la
 * seule valeur qui ne se confonde avec aucune année, et l'écran la porte telle
 * quelle plutôt que de la traduire : une période qui change de forme en chemin
 * est une période que deux endroits comprennent différemment.
 *
 * ⚠ LA RANGÉE DES PÉRIODES N'APPARAÎT QU'À PARTIR DE DEUX ANNÉES SAISIES,
 * exactement comme `Saison.tsx` (`annees.length > 1`, sur `anneesSaisies` de
 * src/db/bilan.ts). En 2026, avec une seule saison au carnet, elle coûte zéro
 * pixel — et une molette à un seul cran est un bouton qui invite au doigt et ne
 * fait rien.
 */
export const TOUTES_ANNEES: readonly number[] = []

/** « ta saison 2026 » · « toutes tes saisons ». Sujet de phrase. */
const saisonDite = (annees: readonly number[]): string =>
  annees.length === 0 ? 'toutes tes saisons'
    : annees.length === 1 ? `ta saison ${annees[0]}`
      : `tes saisons ${annees.join(', ')}`

/**
 * LE VERBE S'ACCORDE AVEC LE SUJET, ET IL FAUT UNE FONCTION POUR ÇA.
 *
 * ⚠ « Ce que toutes tes saisons A COÛTÉ » — vu à l'écran, invisible à la
 * relecture, parce que la phrase est correcte au singulier et que c'est le
 * singulier qu'on lit en écrivant le code. Or `saisonDite` rend un sujet
 * SINGULIER pour une année et PLURIEL pour zéro (« toutes tes saisons ») comme
 * pour plusieurs. Le verbe était figé à côté d'un sujet qui, lui, varie.
 *
 * Le mettre ici plutôt que dans chaque phrase est ce qui garantit qu'on ne le
 * réoubliera pas à la cinquième : les quatre phrases d'argent partagent
 * exactement le même couple sujet-verbe. */
const saisonAccorde = (annees: readonly number[]): string =>
  annees.length === 1 ? 'a' : 'ont'

/** « en 2026 » · « , toutes saisons confondues ». Complément de phrase, avec sa
 *  propre ponctuation d'attaque — c'est ce qui évite « roulées , en 2026 ». */
const quandDit = (annees: readonly number[]): string =>
  annees.length === 0 ? ', toutes saisons confondues' : ` en ${annees.join(', ')}`

/**
 * LE FILTRE D'ANNÉES, EN SQL — et il rend DEUX formes de la même clause pour que
 * personne n'ait à la recomposer à la main.
 *
 * ⚠ LE TYPE DU PARAMÈTRE N'EST PAS UN DÉTAIL, ET SE TROMPER REND SILENCIEUSEMENT
 * ZÉRO LIGNE. `depense.saison_annee` est une colonne INTEGER : elle applique son
 * affinité et accepte un nombre. `substr(date_jour, 1, 4)` est une EXPRESSION,
 * elle n'a aucune affinité, et SQLite ne convertit rien — `'2026' = 2026` y est
 * FAUX, pour toutes les lignes, sans erreur ni avertissement. `bilanSaison`
 * (src/db/bilan.ts) fait déjà exactement ça, en une ligne facile à rater :
 * `const a = String(annee)`. D'où les deux formes ci-dessous et le paramètre qui
 * dit laquelle.
 */
type Bornes = {
  /** ` AND saison_annee IN (?, ?)` — quand une autre condition précède. */
  et: string
  /** ` WHERE saison_annee IN (?, ?)` — quand c'est la seule condition. */
  seule: string
  params: (string | number)[]
}

const bornes = (
  colonne: string, annees: readonly number[], typeSql: 'entier' | 'texte',
): Bornes => {
  if (!annees.length) return { et: '', seule: '', params: [] }
  const trous = annees.map(() => '?').join(', ')
  return {
    et: ` AND ${colonne} IN (${trous})`,
    seule: ` WHERE ${colonne} IN (${trous})`,
    params: typeSql === 'texte' ? annees.map(String) : [...annees],
  }
}

/* ─── LA TABLE DES CROISEMENTS ────────────────────────────────────────────── */

/** La même phrase pour les trois lectures d'atelier, écrite une fois. Trois
 *  copies auraient été trois occasions de n'en corriger que deux. */
const CONSIGNES = "Ce qui attend au garage n'est pas ici : seulement les gestes consignés."

/**
 * LA TABLE. Son ORDRE est celui des puces : les domaines dans l'ordre de la
 * rangée du haut, et à l'intérieur de chaque domaine, les axes dans l'ordre de la
 * rangée du milieu. L'écran n'a donc aucun ordre à décider, donc aucun ordre à
 * faire diverger de celui-ci.
 *
 * ⚠ CHAQUE LIGNE A ÉTÉ VÉRIFIÉE CONTRE CE QUE LES DONNÉES PORTENT RÉELLEMENT. Un
 * croisement dont la colonne n'existe pas ne se voit pas à la compilation :
 * SQLite le dirait au premier tap, au paddock, hors ligne.
 */
export const CROISEMENTS: readonly Croisement[] = [
  /* ─ MAINTENANCE ─ les trois lectures ne comptent QUE `etat = 'faite'`, et ce
     n'est pas une commodité. FR-46 interdit que les trois catégories
     d'intervention cohabitent, parce qu'un point de sécurité posé à côté d'une
     bricole HÉRITE DE SON CARACTÈRE REPOUSSABLE. Ce qui rend le croisement
     × catégorie tenable, c'est qu'il ne montre QUE DU FAIT : rien n'y attend,
     donc rien n'y peut être repoussé. Ce qui est VISÉ garde son seul chemin —
     `cequiAttend` (src/db/atelier.ts), qui le rend catégorie par catégorie. */
  {
    domaine: 'maintenance', axe: 'moto', mot: 'Moto',
    phrase: (a) => `Les gestes d'atelier que tu as consignés${quandDit(a)}, moto par moto.`,
    forme: 'composition', unite: 'decompte', grain: GESTE,
    note: `Une barre par machine, longue du nombre de gestes consignés dessus. ${CONSIGNES}`,
  },
  {
    domaine: 'maintenance', axe: 'categorie', mot: 'Catégorie',
    phrase: (a) => `Les gestes d'atelier que tu as consignés${quandDit(a)}, par nature.`,
    forme: 'composition', unite: 'decompte', grain: GESTE,
    note: 'Entretien, amélioration, bricoles : la composition de ce que tu as '
      + `fait. ${CONSIGNES}`,
  },
  {
    domaine: 'maintenance', axe: 'mois', mot: 'Mois',
    phrase: (a) =>
      `Les gestes d'atelier que tu as consignés${quandDit(a)}, mois après mois.`,
    forme: 'suite', unite: 'decompte', grain: GESTE,
    note: `Un pas par mois, du premier au dernier geste consigné. ${CONSIGNES}`,
  },

  /* ─ FINANCE ─ `depense` est la seule des trois sources d'argent qui porte un
     poste ; voir `argentNonCompte`, plus bas, qui le chiffre et le dit. */
  {
    domaine: 'finance', axe: 'poste', mot: 'Poste',
    phrase: (a) => `Ce que ${saisonDite(a)} ${saisonAccorde(a)} coûté, poste par poste.`,
    forme: 'composition', unite: 'euros', grain: DEPENSE,
    note: 'La composition de ta dépense. La barre la plus longue est le plus gros poste, '
      + "jamais un dépassement — il n'y a aucun plafond dans ce tracé.",
  },
  {
    domaine: 'finance', axe: 'mois', mot: 'Mois',
    phrase: (a) => `Ce que ${saisonDite(a)} ${saisonAccorde(a)} coûté, mois après mois.`,
    forme: 'suite', unite: 'euros', grain: DEPENSE,
    note: 'Un pas par mois, de la première à la dernière dépense saisie ; un mois sans '
      + 'dépense vaut zéro, et rien ne se compare au mois précédent.',
  },
  {
    domaine: 'finance', axe: 'roulage', mot: 'Journée',
    phrase: (a) => `Ce que ${saisonDite(a)} ${saisonAccorde(a)} coûté, journée par journée.`,
    forme: 'suite', unite: 'euros', grain: DEPENSE,
    note: "Un pas par journée vécue, dans l'ordre du calendrier. Une journée sans dépense "
      + "saisie vaut zéro : c'est une journée, pas un trou.",
  },
  {
    domaine: 'finance', axe: 'moto', mot: 'Moto',
    phrase: (a) => `Ce que ${saisonDite(a)} ${saisonAccorde(a)} coûté, moto par moto.`,
    forme: 'composition', unite: 'euros', grain: DEPENSE,
    note: 'Seulement ce qui désigne une machine : les dépenses rattachées à la moto et les '
      + "gestes d'atelier. L'engagement d'une journée ou une assurance de saison ne se "
      + 'rangent sous aucune moto.',
  },
  {
    domaine: 'finance', axe: 'annee', mot: 'Année',
    phrase: () => 'Ce que chacune de tes saisons a coûté.',
    forme: 'composition', unite: 'euros', grain: DEPENSE,
    note: "Une barre par saison, dans l'ordre du calendrier et jamais par montant : une "
      + "saison n'est ni chère ni bon marché.",
  },

  /* ─ PERFORMANCE ─ */
  {
    domaine: 'performance', axe: 'circuit', mot: 'Circuit',
    phrase: () => 'Ton meilleur tour, circuit par circuit, roulage après roulage.',
    // ⚠ `decompte` ET SURTOUT PAS UN CHRONO : les lignes de ce croisement disent
    // combien de journées chronométrées chaque circuit porte, jamais un temps. Le
    // temps vit dans `Courbe`, que `courbesDesCircuits` va chercher telle quelle.
    forme: 'chrono', unite: 'decompte', grain: JOURNEE,
    note: 'Un tracé par circuit, et jamais un tracé de tous. Ta progression se lit sur toute '
      + "son histoire : le choix de saison ne s'applique pas ici.",
  },
  {
    domaine: 'performance', axe: 'mois', mot: 'Mois',
    phrase: (a) => `Les journées que tu as roulées${quandDit(a)}, mois après mois.`,
    forme: 'suite', unite: 'decompte', grain: JOURNEE,
    note: 'Un pas par mois, du premier au dernier roulage vécu ; un mois sans roulage vaut '
      + 'zéro. Une journée annoncée pour plus tard ne compte pas encore.',
  },
  {
    domaine: 'performance', axe: 'moto', mot: 'Moto',
    phrase: (a) => `Les journées que tu as roulées${quandDit(a)}, moto par moto.`,
    forme: 'composition', unite: 'decompte', grain: JOURNEE,
    note: 'Une barre par machine, longue du nombre de journées roulées dessus. Une journée '
      + 'annoncée pour plus tard ne compte pas encore.',
  },
]

/** Le mot de la rangée du haut. EN CAPITALES comme les onglets de la barre du
 *  bas (`ACCUEIL`, `GARAGE`, `ROULAGES`) : c'est la seule rangée de boutons de
 *  navigation déjà écrite dans le produit, et deux conventions de casse à trois
 *  centimètres d'écart se lisent comme deux natures de bouton.
 *
 *  ⚠ IL VIT ICI ET PAS DANS L'ÉCRAN, parce que la table est indexée par
 *  CROISEMENT : un même domaine y apparaît jusqu'à cinq fois, donc cinq
 *  occasions d'écrire le mot différemment. Un `Record` par domaine n'en offre
 *  qu'une. */
export const NOM_DOMAINE: Record<Domaine, string> = {
  maintenance: 'MAINTENANCE',
  finance: 'FINANCE',
  performance: 'PERFORMANCE',
}

export const croisementDe = (domaine: Domaine, axe: Axe): Croisement | undefined =>
  CROISEMENTS.find((c) => c.domaine === domaine && c.axe === axe)

/* ─── LES DÉCISIONS PURES ─────────────────────────────────────────────────── */

/**
 * DEUX POINTS NE FONT PAS UNE LIGNE — et c'est LA TABLE qui le décide, pas
 * l'écran, pas le tracé.
 *
 * C'est la généralisation littérale de `POINTS_MINIMUM` (src/db/courbe.ts) :
 * « rendre une courbe de deux points serait pire que n'en rendre aucune : deux
 * points font toujours une droite, donc toujours une progression ou toujours une
 * chute, et le pilote y lirait un mouvement qui n'existe pas ». La différence
 * avec la courbe est ce qui se passe ensuite : la courbe n'affiche RIEN sous le
 * seuil, parce qu'un chrono isolé ne dit rien ; ici, deux mois de dépenses disent
 * quelque chose de parfaitement vrai — simplement pas un mouvement. Ils se
 * rendent donc en BARRES, qui n'affirment aucun sens de lecture entre elles.
 *
 * ⚠ ON COMPTE LES POINTS QUI IRONT VRAIMENT SUR L'AXE, comblages compris et
 * orphelines exclues. Compter les lignes brutes ferait passer pour une suite de
 * trois points un tracé de deux mois plus une ligne « Sans mois » — c'est-à-dire
 * exactement la droite que ce seuil existe pour refuser.
 *
 * `chrono` ne bascule jamais : `courbeDuCircuit` tient déjà son propre seuil, et
 * un temps au tour n'a rien à faire dans une barre mesurée depuis zéro.
 */
export const formeRendue = (forme: Forme, points: number): Forme =>
  forme === 'suite' && points < POINTS_MINIMUM ? 'composition' : forme

/** Cent ans de mois. Une borne dure sur une marche qui ne devrait jamais boucler
 *  — les clés viennent de `moisDuJour`, donc du calendrier — mais une base
 *  restaurée d'une sauvegarde tordue ne doit pas figer l'application au paddock,
 *  hors ligne, sans rien à toucher.
 *
 *  ⚠ ELLE NE S'APPELLE PAS « PLAFOND », et c'est la même précaution qu'en tête de
 *  fichier pour « poste » : dans ce dépôt, un plafond est le budget que le pilote
 *  s'est fixé (`jaugeBudget`, src/db/budget.ts). Une constante « plafond » dans
 *  un fichier de tracé se lirait comme une cible sur un axe, c'est-à-dire la
 *  seule chose que ce lot refuse. C'est une garde de boucle, rien d'autre. */
const MOIS_AU_PLUS = 1200

/** `2026-12` → `2027-01`. Douze chaînes suffisaient à nommer les mois
 *  (`nomMois`) ; une addition suffit à les enchaîner. Aucune bibliothèque, et
 *  surtout aucun `Date` : passer par un instant réintroduirait le fuseau, qui
 *  fait déjà reculer les jours d'une journée à Paris (src/db/vecu.ts). */
const moisSuivant = (aaaaMm: string): string => {
  const [a, m] = aaaaMm.split('-').map(Number)
  return m >= 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, '0')}`
}

/**
 * COMBLER LES MOIS — et UNIQUEMENT ENTRE DEUX MOIS VÉCUS.
 *
 * ⚠ POURQUOI ÇA NE VIT PAS DANS `grouperParMois`, ET POURQUOI ÇA DOIT EXISTER
 * QUAND MÊME. `grouperParMois` (src/db/budget.ts) refuse les mois vides, et il a
 * raison : « rendre douze lignes dont neuf à zéro fabriquerait une grille de
 * cases à remplir, donc un compteur de complétude ». Cette règle vaut pour une
 * LISTE, où l'ordre des lignes ne mesure rien. Elle se retourne sur une SUITE, où
 * l'axe des abscisses EST le temps : avril, juin et septembre tracés côte à côte
 * à intervalle égal font un dessin où mai, juillet et août n'ont jamais existé,
 * et la pente entre deux pas ment sur la durée qui les sépare.
 *
 * La règle est donc : on comble ENTRE le premier et le dernier mois qui portent
 * quelque chose. Jamais avant, jamais après, jamais jusqu'à décembre. Un zéro
 * inséré ici est une MESURE — ce mois-là, dans une période où le pilote saisissait
 * bel et bien, il n'y a rien eu — et pas une case à remplir. Un zéro ajouté APRÈS
 * le dernier mois serait une prédiction (« il ne se passera rien en novembre »),
 * et le produit n'en fait aucune.
 *
 * ⚠ LA LIGNE « SANS MOIS » SORT ICI, ET ELLE N'EST PAS PERDUE. Une dépense sans
 * date n'a aucune place sur un axe du temps — la poser au bout inventerait un
 * treizième mois — et c'est `cequiManque` qui l'énonce, lu sur les lignes BRUTES
 * avant ce comblage (voir `materiauDe`).
 */
export const comblerLesMois = (
  lignes: readonly LigneAnalyse[], libelleZero: string,
): LigneAnalyse[] => {
  const vrais = lignes.filter((l) => /^\d{4}-\d{2}$/.test(l.cle))
    .sort((a, b) => (a.cle < b.cle ? -1 : a.cle > b.cle ? 1 : 0))
  if (vrais.length < 2) return vrais

  const sortie: LigneAnalyse[] = [vrais[0]]
  let garde = 0
  for (let i = 1; i < vrais.length; i++) {
    let curseur = moisSuivant(vrais[i - 1].cle)
    while (curseur < vrais[i].cle && garde++ < MOIS_AU_PLUS) {
      sortie.push({
        cle: curseur, nom: nomMois(curseur), valeur: 0, libelle: libelleZero, n: 0,
      })
      curseur = moisSuivant(curseur)
    }
    sortie.push(vrais[i])
  }
  return sortie
}

/**
 * CE QUI MANQUE — la complétude, AVANT le tracé et dans la même respiration.
 *
 * C'est FR-55 appliqué tel quel : « le bilan ÉNONCE SA COMPLÉTUDE plutôt que de
 * présenter des moyennes fausses ». Il n'y a ici aucune moyenne à fausser, mais
 * il y a mieux à cacher : une dépense sans poste ne s'écrit nulle part sur un
 * tracé par poste, et huit barres qui totalisent 1 840 € sur une saison qui en a
 * coûté 2 180 se lisent comme un total.
 *
 * Rend UNE phrase, ou rien. Jamais « 0 sans poste » : un zéro énoncé est un
 * compteur de complétude, exactement ce que le produit refuse.
 */
export const cequiManque = (
  c: Croisement, lignes: readonly LigneAnalyse[],
): string | null => {
  const flous = lignes.filter((l) => l.incertain && l.n > 0)
  if (!flous.length) return null
  return flous
    .map((l) => `${l.n} ${l.n > 1 ? c.grain.plusieurs : c.grain.un} ${l.nom.toLowerCase()}`)
    .join(' · ') + '.'
}

/* ─── LES LECTURES ────────────────────────────────────────────────────────── */

const euros = (
  cle: string, nom: string, centimes: number, n: number, incertain = false,
): LigneAnalyse => ({
  cle, nom, valeur: centimes, libelle: formaterEuros(centimes), n, incertain,
})

const decompte = (
  cle: string, nom: string, n: number, grain: Grain, incertain = false,
): LigneAnalyse => ({
  cle, nom, valeur: n, libelle: `${n} ${n > 1 ? grain.plusieurs : grain.un}`, n, incertain,
})

/** L'ordre d'une COMPOSITION : le plus gros d'abord, l'incertain à la fin. C'est
 *  le mot pour mot de `grouperParMois` — « le plus gros d'abord : c'est une
 *  composition, pas un palmarès ; rien n'est trop, rien n'est bien, le rang ne
 *  dit que la taille ». Rien ici ne colore ni ne récompense ce premier rang. */
const parTaille = (a: LigneAnalyse, b: LigneAnalyse) =>
  Number(!!a.incertain) - Number(!!b.incertain)
  || b.valeur - a.valeur || a.nom.localeCompare(b.nom)

/** L'ordre du CALENDRIER, les sans-mois à la fin. */
const parCalendrier = (a: LigneAnalyse, b: LigneAnalyse) =>
  Number(!a.cle) - Number(!b.cle) || (a.cle < b.cle ? -1 : a.cle > b.cle ? 1 : 0)

/**
 * COMPTER LES MOIS — et pas en détournant `grouperParMois`.
 *
 * La tentation était de lui passer des `montant_centimes: 1` pour récupérer un
 * compte dans `total`. Refusé : un montant inventé pour obtenir un décompte reste
 * un montant, et il ressort en euros au premier endroit qui lit ce champ sans
 * relire ce commentaire. Ce qui se réutilise vraiment est la partie difficile —
 * `moisDuJour`, qui refuse le 30 février et le mois 13 par le CALENDRIER plutôt
 * que par le gabarit — et elle est appelée ici telle quelle.
 */
const compterParMois = (
  jours: readonly (string | null)[], grain: Grain,
): LigneAnalyse[] => {
  const paquets = new Map<string, number>()
  for (const j of jours) {
    const cle = moisDuJour(j) ?? ''
    paquets.set(cle, (paquets.get(cle) ?? 0) + 1)
  }
  return [...paquets.entries()]
    .map(([cle, n]) => decompte(cle, cle ? nomMois(cle) : 'Sans mois', n, grain, !cle))
    .sort(parCalendrier)
}

/** Le nom d'affichage d'une machine. Le garage titre ses machines par leur
 *  `modele` seul (`Garage.tsx`, `Depense.tsx`) : « CBR 1000 RR · 83 » se
 *  reconnaît, « Honda » désignerait les trois. La marque ne sert que de repli
 *  pour une saisie sans modèle. */
const nomMachine = (m: { modele: string; marque: string }) =>
  m.modele.trim() || m.marque.trim() || 'Sans nom'

export type JourneeVecue = {
  id: string
  date: string
  circuit: string
  machine_id: string | null
}

/**
 * LES JOURNÉES VÉCUES — LA SEULE LECTURE DE `roulage` DE TOUT CE FICHIER, et
 * c'est délibéré.
 *
 * ⚠ ELLE COMPTE EXACTEMENT COMME `bilanSaison`, ET C'EST UNE OBLIGATION. Le bilan
 * de saison annonce « 11 roulages » à un écran de distance ; une analyse qui en
 * annoncerait 12, parce qu'elle a laissé passer une journée annoncée pour
 * septembre, ferait douter des deux. Le prédicat n'est pas recopié — il est
 * APPELÉ (`A_EU_LIEU`), et un essai unitaire refuse toute lecture de `roulage`
 * qui ne se prononcerait pas sur le temps (récit 17.1, src/db/vecu.ts).
 *
 * Les trois croisements qui comptent des journées — l'argent par journée, les
 * journées par mois, les journées par moto — partent tous de cette liste-ci
 * plutôt que d'une requête chacun. « Deux comptes de journées qui divergent de 1
 * à trois centimètres d'écart » est un défaut déjà payé dans ce dépôt, et la
 * seule manière de ne pas le rejouer est qu'il n'existe qu'un seul compte.
 */
export const journeesVecues = (
  db: PowerSyncDatabase, annees: readonly number[], jour = aujourdhui(),
): Promise<JourneeVecue[]> => {
  const b = bornes('substr(r.date_jour, 1, 4)', annees, 'texte')
  return db.getAll<JourneeVecue>(
    `SELECT r.id AS id, r.date_jour AS date, r.circuit_nom AS circuit,
            r.machine_id AS machine_id
       FROM roulage r
      WHERE ${A_EU_LIEU('r')}${b.et}
      ORDER BY r.date_jour ASC, r.id ASC`,
    [jour, ...b.params])
}

/**
 * L'ARGENT PAR POSTE. Toutes cibles confondues — c'est le budget DU PILOTE, pas
 * celui d'une machine (AD-17 sépare les deux).
 *
 * Le filtre porte sur `saison_annee` et non sur le jour, comme les deux lectures
 * de `budget.ts` : cette colonne se dérive du jour À LA SAISIE et ne bouge plus
 * (AD-18), et `jourDansLAnnee` garde déjà la porte pour qu'un jour corrigé ne
 * sorte pas de l'année de sa ligne.
 */
export const argentParPoste = async (
  db: PowerSyncDatabase, annees: readonly number[],
): Promise<LigneAnalyse[]> => {
  const b = bornes('saison_annee', annees, 'entier')
  const l = await db.getAll<{ poste: Poste | null; total: number | null; n: number }>(
    `SELECT poste, sum(montant_centimes) AS total, count(*) AS n
       FROM depense${b.seule} GROUP BY poste`, b.params)
  return l
    .map((x) => euros(x.poste ?? '', x.poste ? NOM_POSTE[x.poste] : 'Sans poste',
      x.total ?? 0, x.n, !x.poste))
    .sort(parTaille)
}

/** L'argent par mois. Le groupement vient de `grouperParMois` TEL QUEL — c'est la
 *  fonction pure que le banc fait déjà rougir, et un essai y verrouille la liste
 *  exacte de ses quatre champs. On ne la réécrit pas, on l'appelle ; et l'ordre
 *  du calendrier est déjà le sien, sans-mois compris, donc on ne le retrie pas
 *  non plus (un ordre écrit deux fois est un ordre qui diverge). */
export const argentParMois = async (
  db: PowerSyncDatabase, annees: readonly number[],
): Promise<LigneAnalyse[]> => {
  const b = bornes('saison_annee', annees, 'entier')
  const l = await db.getAll<DepenseDatee>(
    `SELECT date_jour, poste, montant_centimes FROM depense${b.seule}`, b.params)
  return grouperParMois(l).map((m) => euros(
    m.mois ?? '', m.mois ? nomMois(m.mois) : 'Sans mois', m.total, m.n, m.mois === null))
}

/**
 * L'ARGENT PAR JOURNÉE — un pas par journée VÉCUE, et zéro quand rien n'a été
 * saisi dessus.
 *
 * ⚠ LA JOINTURE EXTERNE SE FAIT ICI, EN MÉMOIRE, ET PAS EN SQL. Un `LEFT JOIN`
 * aurait marché, mais il aurait fallu une SECONDE requête sur `roulage` — donc un
 * second endroit où la définition de « journée vécue » peut dériver de celle de
 * `bilanSaison`. Partir de `journeesVecues` rend cette dérive impossible : il n'y
 * a qu'une liste de journées dans ce fichier, et les dépenses viennent s'y poser.
 *
 * Une journée à zéro N'EST PAS UN TROU : le pilote y était, il n'a rien saisi
 * dessus, et c'est un fait. Elle reste donc pleine, et jamais `incertain`.
 */
export const argentParJournee = async (
  db: PowerSyncDatabase, annees: readonly number[], jour = aujourdhui(),
): Promise<LigneAnalyse[]> => {
  const journees = await journeesVecues(db, annees, jour)
  if (!journees.length) return []
  const sommes = await db.getAll<{ roulage_id: string; total: number | null; n: number }>(
    `SELECT roulage_id, sum(montant_centimes) AS total, count(*) AS n
       FROM depense WHERE roulage_id IS NOT NULL GROUP BY roulage_id`)
  const par = new Map<string, { total: number | null; n: number }>(
    sommes.map((s) => [s.roulage_id, s]))
  return journees.map((j) => {
    const s = par.get(j.id)
    // Le nom porte le jour et le mois : deux journées au même circuit dans la
    // même saison porteraient sinon exactement le même nom, côte à côte, et le
    // pilote ne saurait pas laquelle est laquelle.
    const nom = `${j.circuit} · ${j.date.slice(8, 10)}/${j.date.slice(5, 7)}`
    return euros(j.id, nom, s?.total ?? 0, s?.n ?? 0)
  })
}

/**
 * L'ARGENT PAR MOTO — LES DEUX SOURCES, ET UNE SEULE FOIS CHACUNE.
 *
 * ⚠ LA CLAUSE `depense_id IS NULL` EST OBLIGATOIRE, et elle vient de `coutMachine`
 * (src/db/depot.ts), où un essai la lit dans le texte de la fonction. L'argent
 * d'un geste d'atelier entre par deux portes : une dépense de cible `machine`
 * (FR-26), ou le montant porté par l'intervention elle-même quand aucune dépense
 * n'a été saisie (FR-43 — « consigner le geste ne dépend jamais d'avoir consigné
 * l'argent »). Les additionner sans condition compterait DEUX FOIS une pièce dont
 * on a fait les deux, et la moto la mieux tenue serait la plus chère, deux fois.
 *
 * ⚠ ET RIEN N'ARRIVE ICI PAR LES ROULAGES (AD-17). Une machine coûte ce qui la
 * DÉSIGNE ; l'engagement d'une journée est une dépense du pilote, et le ranger
 * sous la moto qui a roulé ce jour-là serait une jointure implicite. La note du
 * croisement le dit à l'écran, parce que la somme des barres ne fait alors pas la
 * saison — et un tracé qui ne dit pas ce qu'il laisse dehors se lit comme un total.
 */
export const argentParMoto = async (
  db: PowerSyncDatabase, annees: readonly number[],
): Promise<LigneAnalyse[]> => {
  const machines = await listerMachines(db)
  if (!machines.length) return []

  const bd = bornes('saison_annee', annees, 'entier')
  const depenses = await db.getAll<{ machine_id: string; total: number | null; n: number }>(
    `SELECT machine_id, sum(montant_centimes) AS total, count(*) AS n
       FROM depense
      WHERE cible = 'machine' AND machine_id IS NOT NULL${bd.et}
      GROUP BY machine_id`, bd.params)

  const bi = bornes('substr(date_jour, 1, 4)', annees, 'texte')
  const ateliers = await db.getAll<{ machine_id: string; total: number | null; n: number }>(
    `SELECT machine_id, sum(cout_centimes) AS total, count(*) AS n
       FROM intervention
      WHERE etat = 'faite' AND depense_id IS NULL AND cout_centimes IS NOT NULL${bi.et}
      GROUP BY machine_id`, bi.params)

  const somme = new Map<string, { total: number; n: number }>()
  for (const l of [...depenses, ...ateliers]) {
    const v = somme.get(l.machine_id) ?? { total: 0, n: 0 }
    somme.set(l.machine_id, { total: v.total + (l.total ?? 0), n: v.n + l.n })
  }

  return machines
    .map((m) => ({ m, s: somme.get(m.id) ?? { total: 0, n: 0 } }))
    // Une machine sans un centime sur la période ne fait pas une barre à zéro :
    // un écran ne montre jamais ce qu'il n'a pas, et une barre vide se lit comme
    // une case à remplir.
    .filter((x) => x.s.total > 0)
    .map((x) => euros(x.m.id, nomMachine(x.m), x.s.total, x.s.n))
    .sort(parTaille)
}

/**
 * L'ARGENT PAR ANNÉE — DANS L'ORDRE DU CALENDRIER, JAMAIS PAR MONTANT.
 *
 * ⚠ TRIER LES SAISONS PAR MONTANT FABRIQUERAIT UN CLASSEMENT DES SAISONS, et le
 * produit le refuse : une saison n'est ni chère ni bon marché, et « 2025 en tête »
 * se lirait comme un verdict sur une année de la vie du pilote. C'est le refus de
 * `grouperParMois` — « trier par montant ferait du mois le plus cher une tête de
 * liste, donc un verdict » — appliqué à l'échelle au-dessus.
 *
 * ⚠ CET AXE EST LA PÉRIODE ELLE-MÊME, donc il n'existe que sous « toutes ».
 * Demander « l'année 2026, par année » rendrait UNE barre nommée 2026 : un total
 * déguisé en composition, c'est-à-dire le seul chiffre qu'une composition ne doit
 * jamais montrer. Il rend donc `[]`, et la puce disparaît d'elle-même.
 */
export const argentParAnnee = async (
  db: PowerSyncDatabase, annees: readonly number[],
): Promise<LigneAnalyse[]> => {
  if (annees.length) return []
  const l = await db.getAll<{ annee: number | null; total: number | null; n: number }>(
    `SELECT saison_annee AS annee, sum(montant_centimes) AS total, count(*) AS n
       FROM depense GROUP BY saison_annee ORDER BY saison_annee ASC`)
  return l
    .map((x) => euros(x.annee == null ? '' : String(x.annee),
      x.annee == null ? 'Sans saison' : String(x.annee), x.total ?? 0, x.n, x.annee == null))
    .sort((a, b) => Number(!a.cle) - Number(!b.cle) || a.cle.localeCompare(b.cle))
}

/** Les journées vécues, mois après mois. */
export const journeesParMois = async (
  db: PowerSyncDatabase, annees: readonly number[], jour = aujourdhui(),
): Promise<LigneAnalyse[]> =>
  compterParMois((await journeesVecues(db, annees, jour)).map((j) => j.date), JOURNEE)

/** Les journées vécues, moto par moto. Une journée saisie sans machine remonte en
 *  « Sans moto » plutôt que d'être rangée sous la première venue : `machine_id`
 *  est nullable au schéma, et une journée se saisit très bien avant que la moto
 *  n'entre au garage. */
export const journeesParMoto = async (
  db: PowerSyncDatabase, annees: readonly number[], jour = aujourdhui(),
): Promise<LigneAnalyse[]> => {
  const journees = await journeesVecues(db, annees, jour)
  if (!journees.length) return []
  const nom = new Map<string, string>(
    (await listerMachines(db)).map((m) => [m.id, nomMachine(m)]))
  const par = new Map<string, number>()
  for (const j of journees) {
    // Une machine retirée du garage laisse ses roulages derrière elle : son
    // identifiant ne résout plus, et la journée n'en devient pas moins vécue.
    const cle = j.machine_id && nom.has(j.machine_id) ? j.machine_id : ''
    par.set(cle, (par.get(cle) ?? 0) + 1)
  }
  return [...par.entries()]
    .map(([cle, n]) => decompte(cle, nom.get(cle) ?? 'Sans moto', n, JOURNEE, !cle))
    .sort(parTaille)
}

/**
 * LES GESTES D'ATELIER CONSIGNÉS — `etat = 'faite'` PARTOUT, ET C'EST FR-46.
 *
 * Un croisement qui mélangerait le fait et le visé poserait, sur la même rangée,
 * un point de sécurité qui attend et une bricole qui attend : « l'élément de
 * sécurité HÉRITE DU CARACTÈRE REPOUSSABLE du cosmétique » (src/db/atelier.ts).
 * Ne compter que le FAIT rend le rapprochement inoffensif — rien ne peut y être
 * repoussé, puisque plus rien n'y attend. Ce qui attend garde son seul chemin :
 * `cequiAttend`, catégorie par catégorie, et il n'a rien à faire ici.
 */
const gestesConsignes = (
  db: PowerSyncDatabase, annees: readonly number[],
): Promise<{ machine_id: string; categorie: string; date_jour: string | null }[]> => {
  const b = bornes('substr(date_jour, 1, 4)', annees, 'texte')
  return db.getAll<{ machine_id: string; categorie: string; date_jour: string | null }>(
    `SELECT machine_id, categorie, date_jour FROM intervention
      WHERE etat = 'faite'${b.et}`, b.params)
}

export const gestesParMoto = async (
  db: PowerSyncDatabase, annees: readonly number[],
): Promise<LigneAnalyse[]> => {
  const gestes = await gestesConsignes(db, annees)
  if (!gestes.length) return []
  const nom = new Map<string, string>(
    (await listerMachines(db)).map((m) => [m.id, nomMachine(m)]))
  const par = new Map<string, number>()
  for (const g of gestes) {
    const cle = nom.has(g.machine_id) ? g.machine_id : ''
    par.set(cle, (par.get(cle) ?? 0) + 1)
  }
  return [...par.entries()]
    .map(([cle, n]) => decompte(cle, nom.get(cle) ?? 'Sans moto', n, GESTE, !cle))
    .sort(parTaille)
}

export const gestesParCategorie = async (
  db: PowerSyncDatabase, annees: readonly number[],
): Promise<LigneAnalyse[]> => {
  const gestes = await gestesConsignes(db, annees)
  const par = new Map<string, number>()
  for (const g of gestes) par.set(g.categorie, (par.get(g.categorie) ?? 0) + 1)
  return [...par.entries()]
    // ⚠ LA GARDE EST CELLE D'`atelier.ts`, ET ELLE SERT VRAIMENT ICI : une valeur
    // restaurée d'une vieille sauvegarde n'est pas forcément une des trois. On ne
    // la range pas de force dans « entretien » — elle porte son code brut et se
    // marque incertaine, comme « Sans poste ». Le type TypeScript protège les
    // appelants compilés ; il ne protège pas une ligne venue d'une base.
    // ⚠ ET LE CODE BRUT SE PORTE ENTRE PARENTHÈSES, DERRIÈRE UN MOT. La phrase
    // de complétude s'écrit « n grain nom en minuscules » : un nom qui serait le
    // code seul y rendrait « 1 geste vidange_speciale. », c'est-à-dire une
    // phrase qui ne se lit pas. Le mot porte le sens, la parenthèse porte la
    // preuve — et le pilote peut retrouver la ligne dans sa sauvegarde.
    .map(([code, n]) => estCategorieIntervention(code)
      ? decompte(code, NOM_CATEGORIE[code], n, GESTE)
      : decompte(code, `Hors catégorie (${code})`, n, GESTE, true))
    .sort(parTaille)
}

export const gestesParMois = async (
  db: PowerSyncDatabase, annees: readonly number[],
): Promise<LigneAnalyse[]> =>
  compterParMois((await gestesConsignes(db, annees)).map((g) => g.date_jour), GESTE)

/**
 * LES COURBES DE CHRONO, prêtes à passer à `<Courbe>` — ce croisement ne calcule
 * aucun temps, il va chercher celles qui existent.
 *
 * ⚠ LE RAPPROCHEMENT EST À PLAT, ET TROIS DÉFAUTS RÉELS ONT DÉJÀ ÉTÉ PAYÉS
 * LÀ-DESSUS. `circuit_nom` est du TEXTE LIBRE — il n'existe aucun identifiant de
 * circuit côté client — et « Pau-Arnos » tapé un soir puis « pau arnos » le
 * suivant faisaient deux circuits, chacun sous le seuil de trois points, donc
 * AUCUNE courbe. `circuitsAvecCourbe` et `courbeDuCircuit` (src/db/courbe.ts)
 * portent déjà ce regroupement, par `aplati` ; on les appelle plutôt que de le
 * refaire, et le tracé ne devine donc aucun nom de circuit.
 *
 * ⚠ LA PÉRIODE NE S'APPLIQUE PAS ICI, et la note du croisement le dit à l'écran.
 * Une progression coupée à la saison n'est plus une progression : le premier
 * point de 2026 ne dit rien sans les cinq de 2025 qui le précèdent. `Courbe` n'a
 * d'ailleurs aucun paramètre d'année, et ce lot ne la modifie pas d'une ligne.
 */
export const courbesDesCircuits = async (db: PowerSyncDatabase): Promise<Courbe[]> => {
  const circuits = await circuitsAvecCourbe(db)
  const sortie: Courbe[] = []
  for (const c of circuits) {
    const courbe = await courbeDuCircuit(db, c.circuit)
    if (courbe) sortie.push(courbe)
  }
  return sortie
}

/** Les circuits qui ont une courbe, en lignes — le décompte de journées
 *  chronométrées, JAMAIS un temps. Sert à savoir si le croisement a de la matière
 *  sans avoir à charger les courbes entières, et `aplati` n'y fait qu'une clé de
 *  rendu stable. */
export const circuitsChronometres = async (
  db: PowerSyncDatabase,
): Promise<LigneAnalyse[]> =>
  (await circuitsAvecCourbe(db)).map((c) => ({
    cle: aplati(c.circuit),
    nom: c.circuit,
    valeur: c.n,
    libelle: `${c.n} ${c.n > 1 ? 'journées chronométrées' : 'journée chronométrée'}`,
    n: c.n,
  }))

/**
 * L'ARGENT QUI N'EST PAS DANS CE TRACÉ, ET IL FAUT LE DIRE — chiffré.
 *
 * TROIS SOURCES D'ARGENT DANS CE PRODUIT, UNE SEULE PORTE UN POSTE. `depense`
 * porte `poste` (huit valeurs) ; `intervention.cout_centimes` (l'atelier, FR-43)
 * et `equipement.cout_centimes` n'en portent AUCUN — et ce n'est pas un oubli de
 * ce lot, c'est vrai depuis que l'écran de budget existe. « Par poste » n'a donc
 * jamais montré tout l'argent d'une saison.
 *
 * ⚠ ON NE CHANGE PAS LE MODÈLE POUR ÇA ICI. Poser un poste sur deux tables
 * demanderait une migration, un chemin de saisie de plus et une reprise des
 * lignes existantes — trois choses qu'un tracé n'a pas le droit d'exiger. Ce qui
 * est du ressort de ce lot, c'est de ne pas laisser croire au total : « un emport
 * qui ment sur ses trous est pire qu'un emport incomplet ».
 *
 * ⚠ LA CLAUSE `depense_id IS NULL` REVIENT ICI, POUR LA RAISON INVERSE. Une
 * intervention rattachée à une dépense est DÉJÀ dans le tracé, via cette dépense
 * et avec son poste. L'annoncer « non comptée » gonflerait le trou d'un argent
 * parfaitement compté, et une phrase qui exagère ses trous se fait ignorer aussi
 * vite qu'une phrase qui les cache.
 *
 * ⚠ ET L'ÉQUIPEMENT SANS DATE D'ACHAT FAIT SA PROPRE CLAUSE. `achete_le` est
 * nullable — c'est un MOIS, et souvent on ne s'en souvient pas : le ranger dans
 * la saison choisie l'attribuerait à une année au hasard, l'omettre le ferait
 * disparaître. Il se dit donc à part, comme « Sans mois » se dit à part. Sous
 * « toutes les saisons » il n'y a rien à mettre à part : tout est dedans, daté ou
 * non, et la clause ne s'écrit pas.
 */
export const argentNonCompte = async (
  db: PowerSyncDatabase, annees: readonly number[],
): Promise<string | null> => {
  const bi = bornes('substr(date_jour, 1, 4)', annees, 'texte')
  const atelier = await db.get<{ total: number | null }>(
    `SELECT sum(cout_centimes) AS total FROM intervention
      WHERE etat = 'faite' AND depense_id IS NULL${bi.et}`, bi.params)

  const be = bornes('substr(achete_le, 1, 4)', annees, 'texte')
  const equipe = await db.get<{ total: number | null }>(
    `SELECT sum(cout_centimes) AS total FROM equipement
      WHERE achete_le IS NOT NULL${be.et}`, be.params)

  const orphelin = annees.length
    ? await db.get<{ total: number | null }>(
      `SELECT sum(cout_centimes) AS total FROM equipement WHERE achete_le IS NULL`)
    : { total: 0 }

  const morceaux: string[] = []
  const a = atelier.total ?? 0
  const e = equipe.total ?? 0
  const o = orphelin.total ?? 0
  if (a > 0) morceaux.push(`${formaterEuros(a)} d'atelier`)
  if (e > 0) morceaux.push(`${formaterEuros(e)} d'équipement`)
  if (o > 0) morceaux.push(`${formaterEuros(o)} d'équipement sans date d'achat`)
  if (!morceaux.length) return null
  // La phrase se construit en LISTE plutôt qu'en accord : « 145,90 € d'atelier ne
  // porte » et « 145,90 € d'atelier et 320 € d'équipement ne portent » auraient
  // demandé deux formulations, donc un endroit où l'une des deux vieillit seule.
  return `Hors de ce tracé : ${morceaux.join(', ')} — cet argent ne porte aucun poste.`
}

/* ─── CE QUE L'ÉCRAN APPELLE ──────────────────────────────────────────────── */

/**
 * UN TRACÉ, PRÊT À RENDRE. Tout est déjà tranché : la forme finale, les lignes
 * comblées ou non, ce qui manque, l'argent qui n'y est pas.
 *
 * ⚠ L'ORDRE DES DÉCISIONS VIT DANS `lire` ET PAS DANS L'ÉCRAN, PARCE QU'IL EST
 * PIÉGEUX : la complétude se lit sur les lignes BRUTES (« 2 dépenses sans mois »),
 * et le comblage retire justement cette ligne-là. Composé à l'écran dans l'autre
 * sens, il ne resterait rien à énoncer, et le trou disparaîtrait en silence —
 * c'est-à-dire la seule façon de rater ce qui manque.
 *
 * ⚠ `forme` ET `lignes` SONT UN SEUL COUPLE, comme le coût au tour et son budget
 * (`CoutRoulage`, src/db/depot.ts). `forme` est la forme FINALE, décidée sur les
 * lignes qui sont dans `lignes` — pas sur les brutes. Reposer `formeRendue` sur
 * `lignes.length` rend donc exactement la même chose : c'est idempotent, et
 * c'est voulu, pour qu'un écran qui se méfie ne puisse pas se tromper en
 * vérifiant.
 */
export type Trace = {
  croisement: Croisement
  /** La forme FINALE — `formeRendue` a déjà tranché sur le nombre de pas. */
  forme: Forme
  /** Ce qui va sur le tracé, et rien d'autre : comblé pour une suite de mois,
   *  brut pour une composition. Pour un `chrono`, les circuits qui ont une
   *  courbe — jamais un temps. */
  lignes: readonly LigneAnalyse[]
  /** Ce que le tracé n'a pas pu placer, ou rien. */
  manque: string | null
  /** L'argent qui ne porte aucun poste, ou rien. Renseigné pour les croisements
   *  d'argent qui ne lisent QUE `depense` — l'axe MOTO, lui, additionne déjà
   *  l'atelier, et sa note dit ce qu'il laisse dehors. */
  nonCompte: string | null
}

const lignesDe = (
  db: PowerSyncDatabase, c: Croisement, annees: readonly number[], jour: string,
): Promise<LigneAnalyse[]> => {
  if (c.domaine === 'finance') {
    if (c.axe === 'poste') return argentParPoste(db, annees)
    if (c.axe === 'mois') return argentParMois(db, annees)
    if (c.axe === 'roulage') return argentParJournee(db, annees, jour)
    if (c.axe === 'moto') return argentParMoto(db, annees)
    return argentParAnnee(db, annees)
  }
  if (c.domaine === 'performance') {
    if (c.axe === 'circuit') return circuitsChronometres(db)
    if (c.axe === 'mois') return journeesParMois(db, annees, jour)
    return journeesParMoto(db, annees, jour)
  }
  if (c.axe === 'moto') return gestesParMoto(db, annees)
  if (c.axe === 'categorie') return gestesParCategorie(db, annees)
  return gestesParMois(db, annees)
}

/** Les croisements d'argent dont le tracé ne voit QUE la table `depense` — donc
 *  ceux qui doivent dire l'atelier et l'équipement. L'axe MOTO en est exclu : il
 *  additionne déjà les interventions, et répéter la phrase là-bas annoncerait
 *  comme manquant un argent qui est dans la barre. */
const SOUS_COMPTE: readonly Axe[] = ['poste', 'mois', 'roulage', 'annee']

/**
 * LIRE UN CROISEMENT — la composition des décisions, en un seul endroit.
 *
 * ⚠ ET LE TROU CONNU DE CETTE CHAÎNE, ÉCRIT ICI POUR QU'IL SE VOIE. `Barres`
 * écrit chaque valeur avec `formaterEuros`. Les croisements dont l'unité est
 * `decompte` et la forme `composition` — les gestes par moto, par catégorie, les
 * journées par moto, et tout mois qui retombe en barres sous trois pas — y
 * afficheraient donc « 0,03 € » pour trois gestes. Le champ `libelle` de chaque
 * ligne porte déjà la valeur JUSTE (« 3 gestes ») ; il ne manque qu'un `Barres`
 * qui la préfère à son formateur quand elle est fournie. Rien ici ne peut le
 * faire, et surtout pas multiplier un décompte par cent pour « tomber juste » en
 * euros : ce serait un écran qui ment, ce qui est pire qu'un écran incomplet.
 */
export const lire = async (
  db: PowerSyncDatabase, c: Croisement, annees: readonly number[], jour = aujourdhui(),
): Promise<Trace> => {
  const brutes = await lignesDe(db, c, annees, jour)

  // Le chrono ne se comble pas, ne se dégrade pas et ne se complète pas : ses
  // lignes ne sont pas un tracé, ce sont les circuits qui en ont un.
  if (c.forme === 'chrono') {
    return { croisement: c, forme: 'chrono', lignes: brutes, manque: null, nonCompte: null }
  }

  const manque = cequiManque(c, brutes)
  const libelleZero = c.unite === 'euros' ? formaterEuros(0) : `0 ${c.grain.un}`
  // Les pas qui iront VRAIMENT sur l'axe — comblés, sans les orphelines — car
  // c'est leur nombre qui décide de la forme, pas celui des lignes brutes.
  const places = c.forme === 'suite' && c.axe === 'mois'
    ? comblerLesMois(brutes, libelleZero)
    : brutes
  const forme = formeRendue(c.forme, places.length)
  // Retombée en barres : on reprend les BRUTES. Une composition n'a pas d'axe du
  // temps, donc pas de trou à combler — et les zéros du comblage y deviendraient
  // des cases à remplir. La ligne « Sans mois », elle, reprend sa place en
  // retrait, comme « Sans poste ».
  const lignes = forme === 'suite' ? places : brutes
  const nonCompte = c.domaine === 'finance' && SOUS_COMPTE.includes(c.axe)
    ? await argentNonCompte(db, annees)
    : null
  return { croisement: c, forme, lignes, manque, nonCompte }
}

/**
 * TOUT CE QU'IL Y A À MONTRER, ET RIEN D'AUTRE — les deux premières rangées de
 * puces se déduisent de ce que ça rend.
 *
 * ⚠ UN CROISEMENT EXISTE SI SA LECTURE REND QUELQUE CHOSE, ET C'EST LA SEULE
 * DÉFINITION. La tentation était d'écrire une sonde plus légère — « compte les
 * dépenses, compte les gestes, compte les roulages » — pour éviter onze lectures.
 * Refusé : cette sonde serait une SECONDE définition de « il y a de la matière »,
 * et elle divergerait au premier filtre oublié. Une puce s'afficherait alors sur
 * un écran vide, ce qui est exactement ce qu'un écran vide signale dans ce
 * produit : l'abandon (FR-14). Onze lectures SQLite locales sur quelques
 * centaines de lignes ne se sentent pas ; une puce morte, si.
 *
 * ⚠ UN TRACÉ FAIT UNIQUEMENT D'INCERTAIN N'EST PAS DE LA MATIÈRE. Une puce
 * « Mois » qui n'ouvre que sur une barre « Sans mois » promet un découpage que la
 * donnée ne porte pas ; ce qui est sans date se dit dans la phrase de complétude
 * des AUTRES croisements, pas dans un tracé à soi.
 *
 * ⚠ L'AXE ANNÉE DEMANDE DEUX SAISONS, la même règle que la rangée des périodes et
 * que `Saison.tsx`. Une composition d'une seule barre n'est pas une composition,
 * c'est un total avec une année écrite dessus.
 */
export const tracesDisponibles = async (
  db: PowerSyncDatabase, annees: readonly number[], jour = aujourdhui(),
): Promise<Trace[]> => {
  const sortie: Trace[] = []
  for (const c of CROISEMENTS) {
    const t = await lire(db, c, annees, jour)
    if (!t.lignes.some((l) => !l.incertain)) continue
    if (c.axe === 'annee' && t.lignes.length < 2) continue
    sortie.push(t)
  }
  return sortie
}

/** Les domaines qui ont de quoi montrer, DANS L'ORDRE DE LA TABLE — donc dans
 *  l'ordre de la rangée du haut. Le filtre retire, il ne réordonne pas : trier
 *  les domaines par ce qu'ils contiennent ferait bouger la première puce d'une
 *  ouverture à l'autre, et le pilote réapprendrait la rangée à chaque fois. */
export const domainesDe = (traces: readonly Trace[]): Domaine[] =>
  [...new Set(traces.map((t) => t.croisement.domaine))]

/** Les tracés d'un domaine, dans l'ordre de la table — donc l'ordre de la rangée
 *  du milieu, recalculée à chaque tap de celle du haut. */
export const tracesDuDomaine = (traces: readonly Trace[], domaine: Domaine): Trace[] =>
  traces.filter((t) => t.croisement.domaine === domaine)
