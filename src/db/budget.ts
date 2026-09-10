import type { PowerSyncDatabase } from '@powersync/web'
import { nouvelId } from './ids'
import { marquerSaisie } from './mesures'
import type { GenreDeTenue } from './equipement'
import { anneeSaison, type Cible } from './depot'

/**
 * LE BUDGET PAR POSTE, ET L'ÉQUIPEMENT — retours de Julian du 19 août 2026.
 *
 * Les deux vivent ici parce qu'ils répondent à la même question : qu'est-ce qui
 * coûte, dans une saison, qui n'est pas la moto ?
 *
 * ⚠ CE FICHIER NE FABRIQUE AUCUNE PRÉVISION. Il additionne ce qui a été saisi,
 * poste par poste, et il s'arrête là. Le bilan de saison porte déjà la même
 * clause et pour la même raison : une prévision est une promesse que la donnée
 * ne tient pas, et le budget déclaré du pilote (`budget_saison`) est le seul
 * chiffre du produit qui ait le droit de parler d'avenir — parce que c'est LUI
 * qui l'a posé.
 */

/* ─── LES POSTES ───────────────────────────────────────────────────────────
   Une liste FERMÉE, et c'est délibéré. Un champ libre produirait « essence »,
   « Essence », « carburant » et « gasoil » dans la même saison, donc quatre
   totaux là où il en faut un. Les huit postes couvrent ce que Julian a nommé —
   « course entretien maintenance essence assurance, louage remorque » — et
   `autre` recueille le reste sans rien perdre.

   ⚠ « entretien » ET « pneus » SONT SÉPARÉS À DESSEIN. Les pneus sont le plus
   gros poste d'une saison de piste et le plus variable ; noyés dans l'entretien,
   ils rendraient les deux illisibles. */
export type Poste =
  | 'engagement' | 'entretien' | 'pneus' | 'essence'
  | 'assurance' | 'transport' | 'equipement' | 'autre'

export const POSTES: Poste[] = [
  'engagement', 'entretien', 'pneus', 'essence',
  'assurance', 'transport', 'equipement', 'autre',
]

export const NOM_POSTE: Record<Poste, string> = {
  engagement: 'Engagement',
  entretien: 'Entretien',
  pneus: 'Pneus',
  essence: 'Essence',
  assurance: 'Assurance',
  transport: 'Transport',
  equipement: 'Équipement',
  autre: 'Autre',
}

/** Ce que chaque poste recouvre, en un exemple. Sert de repère à la saisie —
 *  « transport » ne dit rien tout seul, « remorque, péage, hôtel » se reconnaît
 *  immédiatement. */
export const EXEMPLE_POSTE: Record<Poste, string> = {
  engagement: "l'inscription au roulage",
  entretien: 'vidange, plaquettes, filtres',
  pneus: 'train, chauffe, montage',
  essence: 'la moto et le trajet',
  assurance: 'année, ou journée piste',
  transport: 'remorque, péage, hôtel',
  equipement: 'combinaison, gants, tente',
  autre: 'ce qui ne rentre nulle part',
}

export type LignePoste = { poste: Poste | null; total: number; n: number }

/**
 * LE BUDGET D'UNE SAISON, poste par poste. Toutes cibles confondues — c'est le
 * budget DU PILOTE, pas celui d'une machine (AD-17 sépare les deux, et c'est
 * exactement ce qu'il faut ici : la question posée est « ma saison m'a coûté
 * combien, et en quoi »).
 *
 * Les dépenses SANS poste remontent avec `poste: null` plutôt que d'être
 * rangées d'office dans « autre ». Les compter comme « autre » ferait croire
 * qu'un choix a été fait ; elles sont simplement antérieures au poste, et
 * l'écran le dit.
 */
export const parPoste = async (
  db: PowerSyncDatabase, annee: number,
): Promise<LignePoste[]> => {
  const l = await db.getAll<{ poste: Poste | null; total: number; n: number }>(
    `SELECT poste, sum(montant_centimes) AS total, count(*) AS n
       FROM depense WHERE saison_annee = ?
      GROUP BY poste ORDER BY total DESC`, [annee])
  return l.map((x) => ({ poste: x.poste, total: x.total ?? 0, n: x.n }))
}

/** Une dépense avec son poste. La CIBLE reste obligatoire et exclusive (AD-7) :
 *  le poste ne la remplace pas, il la complète. */
export const depenserSur = async (
  db: PowerSyncDatabase,
  d: {
    poste: Poste; cible: Cible; centimes: number; libelle: string; date: string
    roulageId?: string | null; machineId?: string | null
  },
) => {
  const id = nouvelId()
  // ⚠ LE JOUR PART AVEC LA LIGNE (récit 19.2). Le même défaut que `creerDepense`
  // vivait ici : la date arrivait, servait à calculer l'année, et disparaissait.
  await db.execute(
    `INSERT INTO depense
       (id, cible, roulage_id, machine_id, saison_annee, montant_centimes, libelle, poste, date_jour)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, d.cible, d.roulageId ?? null, d.machineId ?? null, anneeSaison(d.date),
      d.centimes, d.libelle.trim() || null, d.poste, d.date])
  await marquerSaisie(db)
  return id
}

export const oublierDepense = (db: PowerSyncDatabase, id: string) =>
  db.execute(`DELETE FROM depense WHERE id = ?`, [id])

/* ─── LE MOIS — récit 19.2 ─────────────────────────────────────────────────
   « Budget c'est pas correct : le coût est de 2180 mais le budget est de
   500/mois. » — Julian, 25 août 2026. Et sa réponse à la question fermée :
   LES DEUX. « Un plafond annuel ET un repère mensuel ». La saison porte le
   PLAFOND, le mois porte un REPÈRE.

   ⚠ LE MOIS SE DÉRIVE, IL NE SE STOCKE PAS. `depense` porte un JOUR — un fait,
   saisi — et le mois n'est qu'une lecture de ce jour. C'est la règle du produit
   (« un fait dérivé ne se stocke pas »), et ce n'est pas de l'élégance : une
   colonne `mois` rangée à côté de `date_jour` serait une seconde vérité, et
   celle qu'on oublie de corriger le jour où l'on corrige une date est toujours
   la copie.

   ⚠ CE QUE CE BLOC N'A PAS LE DROIT DE FAIRE, et la tentation est ici :
     · aucun mois ne se compare au précédent — pas d'écart, pas de « + 40 % » ;
     · aucun mois n'est cher ni bon marché — pas de couleur, pas de classement
       par excès ;
     · aucun « à ce rythme », aucune projection sur les mois qui restent : les
       douze mois d'une saison de piste ne se ressemblent pas, et une droite
       tracée sur avril dit n'importe quoi de janvier.
   Ces trois refus sont tenus par des essais NÉGATIFS (banc-rendu/unite), pas
   par ce commentaire : la forme même de `LigneMois` ne porte aucun champ où
   loger une comparaison. */

/** `2026-07-12` → `2026-07`. Une date qu'on ne reconnaît pas rend `null` et
 *  tombe dans « sans mois » : mieux vaut une dépense qui dit qu'elle n'a pas de
 *  mois qu'une dépense rangée dans un mois inventé.
 *
 *  ⚠ LA FORME NE SUFFIT PAS, IL FAUT LA VALEUR. La première version ne testait
 *  que l'allure : `2026-13-45` la passait, `slice(0, 7)` en tirait le mois
 *  « 2026-13 », et `nomMois` — qui ne connaît que douze noms — rendait « 2026 »
 *  tout court à l'écran. Une ligne de budget intitulée « 2026 » au milieu des
 *  mois se lit comme un total d'année : le mauvais chiffre au bon endroit, ce
 *  qui est pire qu'une absence. Le calendrier tranche donc, pas le gabarit. */
export const moisDuJour = (jour: string | null | undefined): string | null => {
  if (!jour || !/^\d{4}-\d{2}-\d{2}$/.test(jour)) return null
  const [a, m, j] = jour.split('-').map(Number)
  // On reconstruit la date et on exige qu'elle rende les trois mêmes nombres :
  // `Date.UTC` REPORTE silencieusement ce qui déborde — le 30 février devient le
  // 2 mars, le mois 13 devient janvier suivant — et c'est ce report qui trahit
  // les jours qui n'existent pas. UTC et pas local : un fuseau à l'ouest de
  // Greenwich ferait basculer le 1er du mois la veille au soir.
  const d = new Date(Date.UTC(a, m - 1, j))
  if (d.getUTCFullYear() !== a || d.getUTCMonth() !== m - 1 || d.getUTCDate() !== j) return null
  return jour.slice(0, 7)
}

/**
 * ⚠ LE JOUR D'UNE DÉPENSE NE SORT PAS DE L'ANNÉE QUE LE BUDGET MONTRE.
 *
 * `saison_annee` se dérive du jour à la saisie et ne bouge plus (AD-18), et les
 * La lecture du budget — `parPoste` — filtre sur une seule
 * année : celle que le garage affiche, l'année en cours. Un jour corrigé vers
 * décembre dernier fabriquait donc une ligne parfaitement écrite, parfaitement
 * envoyée, et VISIBLE NULLE PART — pendant que le raccourci de l'accueil
 * annonçait « le détail vit au garage, dans le budget ».
 *
 * La borne est ici, en fonction pure, plutôt que dans un `min`/`max` de champ :
 * `min` et `max` colorent le sélecteur du navigateur et n'empêchent RIEN — une
 * valeur tapée à la main hors bornes ressort telle quelle dans `value`.
 */
export const jourDansLAnnee = (jour: string, annee: number): boolean =>
  moisDuJour(jour) != null && jour.slice(0, 4) === String(annee)

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

/** `2026-04` → « avril 2026 ». Aucune bibliothèque : douze chaînes suffisent, et
 *  rien ne se charge depuis un CDN au paddock (NFR-4). Un mois qu'on ne
 *  reconnaît pas rend l'année seule plutôt qu'un « undefined 2026 ». */
export const nomMois = (aaaaMm: string): string => {
  const [a, m] = aaaaMm.split('-')
  const nom = MOIS[Number(m) - 1]
  return nom ? `${nom} ${a}` : a
}

/** Une dépense telle que le mois la regarde : un jour, un poste, un montant.
 *  Trois colonnes, et pas la ligne entière — c'est ce qui rend le calcul
 *  éprouvable sans base de données. */
export type DepenseDatee = {
  date_jour: string | null
  poste: Poste | null
  montant_centimes: number
}

/** UN MOIS DE LA SAISON. `mois` à `null` = les dépenses d'avant la colonne, qui
 *  n'auront jamais de mois — elles ne se rangent nulle part de force.
 *
 *  ⚠ QUATRE CHAMPS, ET PAS UN DE PLUS. Il n'y a ici NI écart au mois précédent,
 *  NI part du plafond, NI reste à dépenser : ces trois chiffres n'ont pas de
 *  place où être écrits, donc pas de chemin pour arriver à l'écran par
 *  distraction. Un essai unitaire vérifie la liste exacte des champs. */
export type LigneMois = {
  mois: string | null
  total: number
  n: number
  /** Ce qui a été payé ce mois-là, poste par poste. Un constat de composition,
   *  jamais une répartition « recommandée » — il n'existe aucune répartition
   *  attendue à laquelle celle-ci pourrait être comparée. */
  postes: { poste: Poste | null; total: number }[]
}

/**
 * GROUPER PAR MOIS — pure, donc éprouvable à ses bords : le 1er, le 31, et deux
 * jours qui se suivent de part et d'autre du 31 décembre.
 *
 * Les mois vides N'EXISTENT PAS dans le résultat, et c'est la même règle que
 * pour les postes : un mois sans dépense n'est pas un mois à zéro, c'est un mois
 * dont on n'a rien à dire. Rendre douze lignes dont neuf à zéro fabriquerait une
 * grille de cases à remplir, donc un compteur de complétude.
 */
export const grouperParMois = (lignes: DepenseDatee[]): LigneMois[] => {
  // La clé vide porte les sans-mois : aucun mois valide ne vaut la chaîne vide,
  // et `null` comme clé de Map se compare mal.
  const paquets = new Map<string, { mois: string | null; total: number; n: number; postes: Map<string, number> }>()
  for (const l of lignes) {
    const mois = moisDuJour(l.date_jour)
    const cle = mois ?? ''
    let p = paquets.get(cle)
    if (!p) { p = { mois, total: 0, n: 0, postes: new Map() }; paquets.set(cle, p) }
    p.total += l.montant_centimes
    p.n += 1
    const cp = l.poste ?? ''
    p.postes.set(cp, (p.postes.get(cp) ?? 0) + l.montant_centimes)
  }

  return [...paquets.values()]
    .map((p) => ({
      mois: p.mois,
      total: p.total,
      n: p.n,
      postes: [...p.postes.entries()]
        .map(([poste, total]) => ({ poste: (poste || null) as Poste | null, total }))
        // Le plus gros d'abord — c'est une composition, pas un palmarès : rien
        // n'est « trop », rien n'est « bien », le rang ne dit que la taille.
        .sort((a, b) => b.total - a.total || (a.poste ?? 'zz').localeCompare(b.poste ?? 'zz')),
    }))
    // Dans l'ORDRE DU CALENDRIER, et les sans-mois à la fin. Trier par montant
    // ferait du mois le plus cher une tête de liste, donc un verdict.
    .sort((a, b) => (a.mois === null ? 1 : b.mois === null ? -1 : a.mois < b.mois ? -1 : 1))
}

/**
 * LE REPÈRE MENSUEL — la décision de Julian du 25 août, moitié « mois ».
 *
 * Le plafond se SAISIT : c'est le seul chiffre du produit qui ait le droit de
 * parler d'avenir, et il ne l'a que parce que le pilote l'a posé lui-même. Le
 * repère du mois, lui, se DÉRIVE — le plafond divisé par douze.
 *
 * ⚠ POURQUOI DÉRIVÉ PLUTÔT QUE SAISI, puisqu'un second champ était possible :
 *   ① un fait dérivé ne se stocke pas, et deux montants saisis séparément
 *     finissent par se contredire — 6000 à l'année et 400 au mois, et personne
 *     ne sait plus lequel des deux ment ;
 *   ② un second champ à remplir rouvre exactement la confusion que 19.1 vient
 *     de fermer : « lequel des deux suis-je en train de taper ? » ;
 *   ③ aucune migration, donc aucun risque sur l'ordre d'envoi.
 * Ce qu'on y perd : un repère inégal — plus l'été, rien l'hiver. C'est un
 * REPÈRE, pas un budget mensuel ; s'il devait devenir inégal, il devrait alors
 * se saisir, et c'est une décision de Julian, pas une initiative.
 *
 * ⚠ DOUZE REPÈRES NE REFONT PAS LE PLAFOND — 500 € donnent 41,67 € et douze
 * fois 41,67 € font 500,04 €. Ce chiffre ne s'additionne donc JAMAIS : il se lit
 * un mois à la fois, et rien dans le produit n'en fait un total.
 */
export const repereMensuel = (plafondCentimes: number | null): number | null =>
  plafondCentimes != null && plafondCentimes > 0 ? Math.round(plafondCentimes / 12) : null

/** Ce que la jauge de budget a le droit de montrer.
 *  `part` : la longueur de la barre, en pourcentage, jamais au-delà de 100.
 *  `repere` : où tombe le plafond sur cette barre — `null` tant qu'il n'est pas
 *  dépassé, puisque la barre s'arrête alors au plafond. */
export type Jauge = { part: number; repere: number | null }

/**
 * LA JAUGE — ce qu'elle corrige, et ce qu'elle refuse.
 *
 * ⚠ CE QU'ELLE CORRIGE : `Math.min(100, consommé / plafond)` rendait 501 € et
 * 2180 € STRICTEMENT IDENTIQUES sur un plafond de 500 € — une barre pleine dans
 * les deux cas. C'est le chiffre de Julian (2180 sur 500) et l'écran ne pouvait
 * pas le dire. La barre se reborne donc sur le plus grand des deux, et le
 * plafond devient un REPÈRE posé dessus : au bout à 501 €, au quart à 2180 €.
 *
 * ⚠ CE QU'ELLE REFUSE, ET C'EST UNE RÈGLE ÉCRITE : elle ne change pas de
 * couleur, ni près du plafond ni au-delà (systeme.css). « Dépasser son budget
 * n'est pas une faute » — et depuis le 24 août le rouge est réservé au geste qui
 * détruit, donc il n'a rien à faire ici. Elle ne rend AUCUN verdict, aucun
 * « dépassé », aucun reste à dépenser : elle rend deux longueurs.
 */
export const jaugeBudget = (consommeCentimes: number, plafondCentimes: number): Jauge => {
  // Sans plafond il n'y a rien à borner. La jauge n'est pas censée s'afficher
  // dans ce cas (FR-24), mais une division par zéro rendrait `Infinity` et une
  // barre de largeur « Infinity% » — l'absence se rend, elle ne se calcule pas.
  if (!(plafondCentimes > 0) || !(consommeCentimes > 0)) return { part: 0, repere: null }
  const haut = Math.max(consommeCentimes, plafondCentimes)
  const cent = (c: number) => Math.round((c / haut) * 1000) / 10
  return {
    part: cent(consommeCentimes),
    repere: consommeCentimes > plafondCentimes ? cent(plafondCentimes) : null,
  }
}

/* ─── L'ÉQUIPEMENT ─────────────────────────────────────────────────────── */

export type CategorieEquipement = 'protection' | 'paddock' | 'transport' | 'outillage' | 'autre'

export const CATEGORIES_EQUIPEMENT: CategorieEquipement[] =
  ['protection', 'paddock', 'transport', 'outillage', 'autre']

export const NOM_EQUIPEMENT: Record<CategorieEquipement, string> = {
  protection: 'Protection',
  paddock: 'Paddock',
  transport: 'Transport',
  outillage: 'Outillage',
  autre: 'Autre',
}

export const EXEMPLE_EQUIPEMENT: Record<CategorieEquipement, string> = {
  protection: 'casque, combinaison, dorsale, gants, bottes',
  paddock: 'tente, chaise, table, glacière',
  transport: 'remorque, sangles, rampe',
  outillage: 'caisse à outils, béquilles, compresseur',
  autre: 'le reste',
}

export type Equipement = {
  id: string
  nom: string
  categorie: CategorieEquipement
  /** Un MOIS, `AAAA-MM`. Jamais une échéance, jamais un âge « restant ». */
  achete_le: string | null
  cout_centimes: number | null
  note: string | null
  /** Le portrait pixel — « la combinaison c'est comme un skin, et le casque
   *  aussi ». Nullable : un équipement sans portrait est un état valide. */
  sprite: string | null
  /** La photo réelle, indépendante du sprite. C'est elle qui reprend la place
   *  quand un portrait est refusé ou retiré. */
  photo_chemin: string | null
}

/** Rangé par catégorie puis par achat le plus récent. Aucun tri par « âge » ni
 *  par « à remplacer » : ces classements n'existent pas, et c'est le sujet. */
export const listerEquipement = (db: PowerSyncDatabase) =>
  db.getAll<Equipement>(
    `SELECT id, nom, categorie, achete_le, cout_centimes, note, sprite, photo_chemin
       FROM equipement ORDER BY categorie, coalesce(achete_le, '0000') DESC, id DESC`)

/** Le sprite se pose et se retire sans toucher au reste : c'est une
 *  reconstruction, pas une donnée d'identité — le pilote doit pouvoir le
 *  refuser. Exactement la même règle que pour la machine. */
export const poserSpriteEquipement = (
  db: PowerSyncDatabase, id: string, sprite: string | null,
) => db.execute(`UPDATE equipement SET sprite = ? WHERE id = ?`, [sprite, id])

export const declarerEquipement = async (
  db: PowerSyncDatabase,
  e: {
    nom: string; categorie: CategorieEquipement
    acheteLe?: string | null; centimes?: number | null; note?: string | null
    /** ⚠ LE GENRE SE POSE MAINTENANT DÈS LA DÉCLARATION — 3 septembre 2026,
     *  rapporté depuis le téléphone : « le choix casque combinaison doit être
     *  saisi quand on ajoute l'équipement ». Il ne s'y posait pas, et il fallait
     *  donc déclarer la pièce, la retrouver dans la liste, puis taper une puce
     *  sous elle. Deux gestes séparés par une lecture, pour un fait qu'on
     *  connaît au moment où l'on tape le nom.
     *
     *  Il reste FACULTATIF et il reste CORRIGEABLE : `poserGenreEquipement` ne
     *  disparaît pas, la puce sous la pièce non plus. Poser à la déclaration ne
     *  ferme rien — ça évite seulement d'y revenir. */
    genre?: GenreDeTenue | null
  },
) => {
  const id = nouvelId()
  await db.execute(
    `INSERT INTO equipement (id, nom, categorie, achete_le, cout_centimes, note, genre)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, e.nom.trim(), e.categorie, e.acheteLe || null, e.centimes ?? null,
      e.note?.trim() || null,
      // Le genre n'a de sens que sous la protection — la même frontière qu'à la
      // correction. Une glacière déclarée « casque » serait proposée comme tenue.
      e.categorie === 'protection' ? (e.genre ?? null) : null])
  await marquerSaisie(db)
  return id
}

/**
 * DIRE QU'UNE PIÈCE EST UN CASQUE, OU UNE COMBINAISON.
 *
 * ⚠ CE CHEMIN EST UNE MISE À JOUR AVANT D'ÊTRE UNE SAISIE, et c'est le cas
 * NOMINAL : les pièces à qualifier existent déjà dans le carnet. Un genre qui ne
 * se poserait qu'à la déclaration aurait laissé inerte tout le dispositif de
 * tenue pour quiconque avait saisi son équipement avant lui — c'est-à-dire pour
 * tout le monde.
 *
 * `null` est un appel PLEIN : le même geste retire ce qu'il a posé. Une pièce
 * mal qualifiée doit pouvoir cesser de l'être sans qu'on la supprime — et la
 * supprimer coûterait la dépense qu'elle porte.
 */
export const poserGenreEquipement = async (
  db: PowerSyncDatabase, id: string, genre: GenreDeTenue | null,
) => {
  await db.execute(`UPDATE equipement SET genre = ? WHERE id = ?`, [genre, id])
  await marquerSaisie(db)
}

export const oublierEquipement = (db: PowerSyncDatabase, id: string) =>
  db.execute(`DELETE FROM equipement WHERE id = ?`, [id])

/** Ce que l'équipement a coûté, toutes catégories. C'est le seul total que ce
 *  fichier calcule sur l'équipement : ni « valeur du parc », ni amortissement,
 *  ni « à renouveler » — trois chiffres qui n'auraient aucune source. */
export const coutEquipement = async (db: PowerSyncDatabase) => {
  const r = await db.get<{ total: number | null }>(
    `SELECT sum(cout_centimes) AS total FROM equipement`)
  return r.total ?? 0
}
