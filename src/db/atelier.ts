import type { PowerSyncDatabase } from '@powersync/web'
import { nouvelId } from './ids'
import { marquerSaisie } from './mesures'

/**
 * L'ATELIER — épique 8, l'axe machine prend ses écrans.
 *
 * LA RÈGLE QUI GOUVERNE TOUT CE FICHIER est FR-46, et c'est une clause de
 * SÉCURITÉ, pas de rangement : « les trois catégories d'intervention ne
 * cohabitent jamais dans une même liste ». Si « plaquettes en fin de vie »
 * s'affiche à côté de « sticker décollé », l'élément de sécurité HÉRITE DU
 * CARACTÈRE REPOUSSABLE du cosmétique, et la liste des choses qui peuvent
 * attendre finit par contenir une chose qui ne peut pas.
 *
 * C'est pourquoi il n'existe ici AUCUNE fonction qui rende les interventions
 * toutes catégories confondues. Pas « par commodité », pas « pour le total » :
 * aucune. Une fonction qui les mélange serait immédiatement utilisée.
 */

export type Categorie = 'entretien' | 'amelioration' | 'reparation_non_vitale'
export type Etat = 'visee' | 'faite'

export type Intervention = {
  id: string
  machine_id: string
  categorie: Categorie
  etat: Etat
  libelle: string
  /** Nulle tant que l'acte est VISÉ — une intervention visée n'a pas de date,
   *  c'est exactement ce qui la définit (FR-45, FR-48). */
  date_jour: string | null
  cout_centimes: number | null
  depense_id: string | null
  photo_id: string | null
}

export const NOM_CATEGORIE: Record<Categorie, string> = {
  entretien: 'Entretien',
  amelioration: 'Amélioration',
  reparation_non_vitale: 'Ça peut attendre',
}

/** Ce que chaque liste dit d'elle-même quand elle est vide. Jamais un vide
 *  neutre : une liste vide d'entretien et une liste vide de réparations ne
 *  veulent pas dire la même chose, et aucune des deux n'est un échec. */
export const VIDE: Record<Categorie, string> = {
  entretien: "Rien de consigné. L'entretien se note au moment du geste, pas avant.",
  amelioration: 'Rien de consigné.',
  reparation_non_vitale: "Rien en attente. Ce qui casse sans être grave se photographie "
    + 'au paddock et atterrit ici.',
}

/* ─── LECTURE — une catégorie à la fois, jamais deux ───────────────────── */

/** ⚠ LA CATÉGORIE EST OBLIGATOIRE, et ce n'est pas négociable (FR-46). Rendre ce
 *  paramètre facultatif suffirait à faire exister la liste mélangée. */
export const interventions = (
  db: PowerSyncDatabase, machineId: string, categorie: Categorie,
) => db.getAll<Intervention>(
  `SELECT id, machine_id, categorie, etat, libelle, date_jour, cout_centimes,
          depense_id, photo_id
     FROM intervention WHERE machine_id = ? AND categorie = ?
    ORDER BY etat DESC, coalesce(date_jour, '9999') DESC, id DESC`,
  [machineId, categorie])

/** Ce qui attend, catégorie par catégorie. Sert à l'accueil temporel (FR-12,
 *  FR-48) — et il compte, il n'ordonne pas : « des plaquettes t'attendent au
 *  garage » est un fait, pas une échéance. Aucun compteur à rebours, jamais. */
export const cequiAttend = async (
  db: PowerSyncDatabase,
): Promise<{ categorie: Categorie; n: number; dernier: string }[]> =>
  db.getAll<{ categorie: Categorie; n: number; dernier: string }>(
    `SELECT categorie, count(*) AS n, max(libelle) AS dernier
       FROM intervention WHERE etat = 'visee'
      GROUP BY categorie ORDER BY categorie`)

/* ─── ÉCRITURE ─────────────────────────────────────────────────────────── */

/** FR-43 — consigner AU MOMENT DU GESTE. Un tap, la date se remplit.
 *
 *  « Consigner le geste ne dépend JAMAIS d'avoir consigné l'argent » : si aucune
 *  dépense ne correspond, l'intervention se saisit seule. D'où `depenseId`
 *  optionnel, et surtout : jamais de champ de montant obligatoire à l'écran. */
export const consigner = async (
  db: PowerSyncDatabase,
  i: {
    machineId: string; categorie: Categorie; libelle: string; date: string
    centimes?: number | null; depenseId?: string | null; photoId?: string | null
  },
) => {
  const id = nouvelId()
  await db.execute(
    `INSERT INTO intervention
       (id, machine_id, categorie, etat, libelle, date_jour, cout_centimes, depense_id, photo_id)
     VALUES (?, ?, ?, 'faite', ?, ?, ?, ?, ?)`,
    [id, i.machineId, i.categorie, i.libelle.trim(), i.date,
      i.centimes ?? null, i.depenseId ?? null, i.photoId ?? null])
  await marquerSaisie(db)
  return id
}

/** FR-45 et FR-47 — l'acte VISÉ, sous ses deux formes.
 *
 *  Une pièce achetée porte sa dépense, une réparation non vitale porte sa photo,
 *  et ni l'une ni l'autre ne porte de date : elles attendent, c'est leur nature.
 *  Aucune des deux ne déclenche quoi que ce soit — pas de rappel, pas de
 *  compteur, pas de notification (FR-48, contre-mesure C1). */
export const viser = async (
  db: PowerSyncDatabase,
  i: {
    machineId: string; categorie: Categorie; libelle: string
    centimes?: number | null; depenseId?: string | null; photoId?: string | null
  },
) => {
  const id = nouvelId()
  await db.execute(
    `INSERT INTO intervention
       (id, machine_id, categorie, etat, libelle, cout_centimes, depense_id, photo_id)
     VALUES (?, ?, ?, 'visee', ?, ?, ?, ?)`,
    [id, i.machineId, i.categorie, i.libelle.trim(),
      i.centimes ?? null, i.depenseId ?? null, i.photoId ?? null])
  await marquerSaisie(db)
  return id
}

/** « C'est fait aujourd'hui » — l'acte visé devient un acte posé, et il garde
 *  tout ce qu'il portait : sa dépense, sa photo, son libellé. C'est le geste
 *  entier de FR-43 en un seul tap. */
export const cestFait = async (db: PowerSyncDatabase, id: string, jour: string) => {
  await db.execute(
    `UPDATE intervention SET etat = 'faite', date_jour = ? WHERE id = ? AND etat = 'visee'`,
    [jour, id])
  await marquerSaisie(db)
}

/** Ce qu'une machine a consommé en atelier, catégorie par catégorie. Le total
 *  toutes catégories n'existe pas ici — voir la règle en tête de fichier. */
export const coutAtelier = async (
  db: PowerSyncDatabase, machineId: string, categorie: Categorie,
) => {
  const r = await db.get<{ total: number | null }>(
    `SELECT SUM(cout_centimes) AS total FROM intervention
      WHERE machine_id = ? AND categorie = ? AND etat = 'faite'`, [machineId, categorie])
  return r.total ?? 0
}

/* ─── L'ÉVÉNEMENT VISÉ — FR-54 ─────────────────────────────────────────── */

export type Evenement = {
  id: string
  libelle: string
  /** APPROXIMATIVE, et nullable. « Le Bol d'Or, juin » est une réponse
   *  complète — exiger un jour précis transformerait un désir en engagement. */
  date_approx: string | null
  cout_estime_centimes: number | null
}

export const evenements = (db: PowerSyncDatabase) =>
  db.getAll<Evenement>(
    `SELECT id, libelle, date_approx, cout_estime_centimes FROM evenement_vise
      ORDER BY coalesce(date_approx, '9999') ASC, id DESC`)

export const viserEvenement = async (
  db: PowerSyncDatabase, e: { libelle: string; date?: string | null; centimes?: number | null },
) => {
  const id = nouvelId()
  await db.execute(
    `INSERT INTO evenement_vise (id, libelle, date_approx, cout_estime_centimes)
     VALUES (?, ?, ?, ?)`,
    [id, e.libelle.trim(), e.date || null, e.centimes ?? null])
  await marquerSaisie(db)
  return id
}

export const oublierEvenement = async (db: PowerSyncDatabase, id: string) => {
  await db.execute(`DELETE FROM evenement_vise WHERE id = ?`, [id])
}
