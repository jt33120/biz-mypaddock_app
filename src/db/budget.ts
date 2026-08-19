import type { PowerSyncDatabase } from '@powersync/web'
import { nouvelId } from './ids'
import { marquerSaisie } from './mesures'
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
  await db.execute(
    `INSERT INTO depense
       (id, cible, roulage_id, machine_id, saison_annee, montant_centimes, libelle, poste)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, d.cible, d.roulageId ?? null, d.machineId ?? null, anneeSaison(d.date),
      d.centimes, d.libelle.trim() || null, d.poste])
  await marquerSaisie(db)
  return id
}

export const oublierDepense = (db: PowerSyncDatabase, id: string) =>
  db.execute(`DELETE FROM depense WHERE id = ?`, [id])

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
}

/** Rangé par catégorie puis par achat le plus récent. Aucun tri par « âge » ni
 *  par « à remplacer » : ces classements n'existent pas, et c'est le sujet. */
export const listerEquipement = (db: PowerSyncDatabase) =>
  db.getAll<Equipement>(
    `SELECT id, nom, categorie, achete_le, cout_centimes, note
       FROM equipement ORDER BY categorie, coalesce(achete_le, '0000') DESC, id DESC`)

export const declarerEquipement = async (
  db: PowerSyncDatabase,
  e: {
    nom: string; categorie: CategorieEquipement
    acheteLe?: string | null; centimes?: number | null; note?: string | null
  },
) => {
  const id = nouvelId()
  await db.execute(
    `INSERT INTO equipement (id, nom, categorie, achete_le, cout_centimes, note)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, e.nom.trim(), e.categorie, e.acheteLe || null, e.centimes ?? null,
      e.note?.trim() || null])
  await marquerSaisie(db)
  return id
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
