import type { PowerSyncDatabase } from '@powersync/web'
import { nouvelId } from './ids'
import { marquerSaisie } from './mesures'
import { aplati } from './depot'

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

/** La liste canonique sert aussi aux frontières qui reçoivent une valeur issue
 * d'un formulaire. Le type TypeScript protège les appelants compilés ; cette
 * garde protège les anciennes versions de l'application et les valeurs
 * restaurées depuis une sauvegarde. */
export const CATEGORIES_INTERVENTION = [
  'entretien', 'amelioration', 'reparation_non_vitale',
] as const satisfies readonly Categorie[]

export const estCategorieIntervention = (valeur: unknown): valeur is Categorie =>
  typeof valeur === 'string'
  && (CATEGORIES_INTERVENTION as readonly string[]).includes(valeur)

export type Intervention = {
  id: string
  machine_id: string
  chute_id: string | null
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

/**
 * ⚠ « ÇA PEUT ATTENDRE » EST DEVENU « BRICOLES », sur retour de Julian :
 * « c'est quoi l'intérêt ? ah, les maintenances mineures — je choisirais un nom
 * comme Cerise sur le gâteau ou Extra ».
 *
 * Sa question révélait le vrai défaut, qui n'était pas le mot mais la SÉRIE :
 * deux catégories se nommaient par leur NATURE — entretien, amélioration — et la
 * troisième par sa PRIORITÉ. Une liste dont un élément change d'axe ne se lit
 * pas, et c'est exactement ce qui a produit « je n'ai pas compris ».
 *
 * Je n'ai pas retenu ses deux propositions, et pour une raison précise : « Cerise
 * sur le gâteau » et « Extra » désignent un bonus — c'est-à-dire AMÉLIORATION,
 * la catégorie d'à côté. Les adopter aurait donné deux noms pour la même idée et
 * laissé le levier tordu sans nom du tout. « Bricoles » nomme ce qu'il y a
 * dedans : ce qui a cassé sans être grave.
 */
export const NOM_CATEGORIE: Record<Categorie, string> = {
  entretien: 'Entretien',
  amelioration: 'Amélioration',
  reparation_non_vitale: 'Bricoles',
}

/** Une ligne sous chaque titre. Trois catégories dont on doit deviner la
 *  différence sont trois catégories qu'on remplit au hasard — et FR-46 n'est
 *  une clause de sécurité que si le rangement est évident au premier coup d'œil. */
export const SOUS_TITRE: Record<Categorie, string> = {
  entretien: 'ce qui garde la moto en état',
  amelioration: 'ce qui la rend meilleure',
  reparation_non_vitale: "ce qui a cassé sans être grave",
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
          chute_id, depense_id, photo_id
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
    chuteId?: string | null
  },
) => {
  const id = nouvelId()
  await db.execute(
    `INSERT INTO intervention
       (id, machine_id, chute_id, categorie, etat, libelle, date_jour,
        cout_centimes, depense_id, photo_id)
     VALUES (?, ?, ?, ?, 'faite', ?, ?, ?, ?, ?)`,
    [id, i.machineId, i.chuteId ?? null, i.categorie, i.libelle.trim(), i.date,
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
    chuteId?: string | null
  },
) => {
  const id = nouvelId()
  await db.execute(
    `INSERT INTO intervention
       (id, machine_id, chute_id, categorie, etat, libelle,
        cout_centimes, depense_id, photo_id)
     VALUES (?, ?, ?, ?, 'visee', ?, ?, ?, ?)`,
    [id, i.machineId, i.chuteId ?? null, i.categorie, i.libelle.trim(),
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
  await faireRepartirLHorloge(db, id)
  await marquerSaisie(db)
}

/**
 * ⚠ FR-43 EN ENTIER : « un tap sur c'est fait aujourd'hui, la date se remplit,
 * la pièce achetée se rattache, L'HORLOGE DU POSTE REPART ». Le troisième effet
 * manquait, et le défaut était bloquant : `repartirDe` existait, était exporté,
 * et n'était appelé nulle part. Un pilote pouvait changer ses plaquettes
 * autant de fois qu'il voulait, l'écran d'usure affichait « 7 / 6 · au-delà de
 * l'intervalle » pour toujours. Le seul recours offert était de retirer
 * l'horloge, c'est-à-dire de détruire le suivi.
 *
 * Le rapprochement se fait sur le LIBELLÉ, à plat : « Plaquettes avant »
 * consigné à l'atelier fait repartir l'horloge « plaquettes avant ». C'est une
 * heuristique et elle est assumée — l'alternative serait d'obliger le pilote à
 * choisir une horloge dans une liste au moment du geste, c'est-à-dire à faire
 * du rangement au paddock. Un rapprochement raté ne casse rien : l'horloge
 * garde son compte, et l'écran d'usure porte son propre « c'est fait ».
 */
const faireRepartirLHorloge = async (db: PowerSyncDatabase, interventionId: string) => {
  const i = await db.get<{ machine_id: string; libelle: string }>(
    `SELECT machine_id, libelle FROM intervention WHERE id = ?`, [interventionId])
  if (!i) return
  const hs = await db.getAll<{ id: string; operation: string }>(
    `SELECT id, operation FROM horloge WHERE machine_id = ?`, [i.machine_id])
  const cle = aplati(i.libelle)
  for (const h of hs) {
    if (aplati(h.operation) !== cle) continue
    await db.execute(`UPDATE horloge SET depuis_intervention = ? WHERE id = ?`,
      [interventionId, h.id])
  }
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
