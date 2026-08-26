import type { PowerSyncDatabase } from '@powersync/web'
import { nouvelId } from './ids'
import { marquerSaisie } from './mesures'
import { anneeSaison } from './depot'
import { TOUTES_JOURNEES } from './vecu'
import { estCategorieIntervention, type Categorie } from './atelier'

/**
 * LA CHUTE — demandée par Julian le 20 août : « renseigner sur un roulage s'il y
 * a eu une chute et des infos sur la chute ».
 *
 * ⚠ CE FICHIER N'EXPORTERA JAMAIS DE COMPTEUR, et c'est la clause la plus
 * importante du produit entier — plus que celles du chrono, plus que celles du
 * coût.
 *
 * Pas de `nombreDeChutes()`. Pas de `roulagesDepuisLaDerniere()`. Pas de
 * `chutesParSaison()`. Pas de gravité, pas de responsabilité, pas de « évitable
 * ou non ». Le schéma lui-même n'a aucune colonne qui puisse se sommer, parce
 * que ce qui n'existe pas ne s'affiche pas par accident — mais une fonction qui
 * compte serait écrite un jour « juste pour le bilan de saison », et elle serait
 * immédiatement utilisée.
 *
 * LA RAISON, ET ELLE EST PRÉCISE. La série « X roulages sans chute » est la
 * mécanique la plus tentante qu'on puisse poser ici, et de loin la pire : elle
 * crée une pression à ne pas la rompre, donc à NE PAS DÉCLARER. Un carnet qu'on
 * n'ose pas remplir ne vaut rien, et sur ce sujet-là il vaut moins que rien —
 * c'est exactement la ligne qui servirait à une assurance, à un acheteur, ou à
 * se souvenir de ce qui s'est passé quand on ne s'en souvient plus.
 *
 * Ce produit est né d'une chute causée par la recherche d'un geste. Il n'a pas
 * le droit d'en faire un score.
 */

export type StatutCrash = 'a_renseigner' | 'aucun' | 'documente'

export type Chute = {
  id: string
  roulage_id: string
  /** « virage 3 », « l'épingle », « la ligne droite ». Ce que le pilote dit,
   *  jamais une coordonnée : le téléphone n'est pas en piste (AD-3). */
  endroit: string | null
  recit: string | null
}

/** Les chutes d'une journée. Il peut y en avoir plusieurs, et il n'y a rien à
 *  en conclure — c'est pour ça que la table n'est pas un booléen sur `roulage`. */
export const chutesDuRoulage = (db: PowerSyncDatabase, roulageId: string) =>
  db.getAll<Chute>(
    `SELECT id, roulage_id, endroit, recit FROM chute WHERE roulage_id = ? ORDER BY id`,
    [roulageId])

/** La qualification du roulage, distincte du nombre de récits écrits. */
export const statutCrashDuRoulage = async (
  db: PowerSyncDatabase, roulageId: string,
): Promise<StatutCrash> => {
  const r = await db.getOptional<{ crash_statut: StatutCrash | null }>(
    `SELECT crash_statut FROM roulage ${TOUTES_JOURNEES} WHERE id = ?`, [roulageId])
  if (!r) throw new Error('Ce roulage est introuvable.')
  return r.crash_statut === 'aucun' || r.crash_statut === 'documente'
    ? r.crash_statut : 'a_renseigner'
}

/** « Aucun crash » est une déclaration, jamais une déduction depuis une liste
 * vide. Elle est refusée si une chute existe déjà, dans la même transaction. */
export const declarerAucunCrash = async (
  db: PowerSyncDatabase, roulageId: string,
): Promise<void> => {
  await db.writeTransaction(async (tx) => {
    const roulage = await tx.getOptional<{ id: string }>(
      `SELECT id FROM roulage ${TOUTES_JOURNEES} WHERE id = ?`, [roulageId])
    if (!roulage) throw new Error('Ce roulage est introuvable.')
    const { n } = await tx.get<{ n: number }>(
      `SELECT count(*) AS n FROM chute WHERE roulage_id = ?`, [roulageId])
    if (n > 0) throw new Error('Un crash est déjà documenté sur ce roulage.')
    await tx.execute(
      `UPDATE roulage SET crash_statut = 'aucun' WHERE id = ?`, [roulageId])
  })
  await marquerSaisie(db)
}

/** Corrige une déclaration « aucun » sans fabriquer de crash. Un roulage qui a
 * une chute reste forcément documenté. */
export const reinitialiserStatutCrash = async (
  db: PowerSyncDatabase, roulageId: string,
): Promise<void> => {
  await db.writeTransaction(async (tx) => {
    const roulage = await tx.getOptional<{ id: string }>(
      `SELECT id FROM roulage ${TOUTES_JOURNEES} WHERE id = ?`, [roulageId])
    if (!roulage) throw new Error('Ce roulage est introuvable.')
    const { n } = await tx.get<{ n: number }>(
      `SELECT count(*) AS n FROM chute WHERE roulage_id = ?`, [roulageId])
    if (n > 0) throw new Error('Un crash documenté ne peut pas redevenir inconnu.')
    await tx.execute(
      `UPDATE roulage SET crash_statut = 'a_renseigner' WHERE id = ?`, [roulageId])
  })
  await marquerSaisie(db)
}

/**
 * Consigner. LES DEUX CHAMPS SONT FACULTATIFS, et ce n'est pas de la
 * permissivité : une chute qu'on ne veut pas raconter reste une chute
 * consignée. Exiger un récit le jour même, c'est demander de mettre des mots sur
 * quelque chose une heure après — et obtenir, le plus souvent, rien du tout.
 */
export const consignerChute = async (
  db: PowerSyncDatabase,
  c: { roulageId: string; endroit?: string | null; recit?: string | null },
) => {
  const id = nouvelId()
  await db.writeTransaction(async (tx) => {
    const roulage = await tx.getOptional<{ id: string }>(
      `SELECT id FROM roulage ${TOUTES_JOURNEES} WHERE id = ?`, [c.roulageId])
    if (!roulage) throw new Error('Ce roulage est introuvable.')
    await tx.execute(
      `INSERT INTO chute (id, roulage_id, endroit, recit) VALUES (?, ?, ?, ?)`,
      [id, c.roulageId, c.endroit?.trim() || null, c.recit?.trim() || null])
    await tx.execute(
      `UPDATE roulage SET crash_statut = 'documente' WHERE id = ?`, [c.roulageId])
  })
  await marquerSaisie(db)
  return id
}

/** Le récit se complète après coup, et c'est le cas normal : on écrit « virage
 *  3 » au paddock et le reste le lendemain, quand on a récupéré. */
export const completerChute = async (
  db: PowerSyncDatabase,
  id: string,
  c: { endroit?: string | null; recit?: string | null },
) => {
  await db.execute(
    `UPDATE chute SET endroit = ?, recit = ? WHERE id = ?`,
    [c.endroit?.trim() || null, c.recit?.trim() || null, id])
  await marquerSaisie(db)
}

/**
 * Retirer une chute. Les réparations et les photos qui la désignaient SURVIVENT
 * — le serveur les met à `null` plutôt que de les détruire.
 *
 * C'est délibéré : une chute peut être saisie par erreur sur la mauvaise
 * journée, et les plaquettes changées ensuite ont quand même été changées. Une
 * correction ne doit jamais coûter des données qu'elle ne visait pas.
 */
export const oublierChute = async (db: PowerSyncDatabase, id: string) => {
  const retiree = await db.writeTransaction(async (tx) => {
    const chute = await tx.getOptional<{ roulage_id: string }>(
      `SELECT roulage_id FROM chute WHERE id = ?`, [id])
    if (!chute) return false
    await tx.execute(`UPDATE intervention SET chute_id = NULL WHERE chute_id = ?`, [id])
    await tx.execute(`UPDATE photo SET chute_id = NULL WHERE chute_id = ?`, [id])
    await tx.execute(`DELETE FROM chute WHERE id = ?`, [id])
    const { n } = await tx.get<{ n: number }>(
      `SELECT count(*) AS n FROM chute WHERE roulage_id = ?`, [chute.roulage_id])
    await tx.execute(
      `UPDATE roulage SET crash_statut = ? WHERE id = ?`,
      [n > 0 ? 'documente' : 'a_renseigner', chute.roulage_id])
    return true
  })
  if (retiree) await marquerSaisie(db)
}

export type ReparationDeChute = {
  id: string
  libelle: string
  date_jour: string
  cout_centimes: number | null
}

export type { Categorie } from './atelier'

/** Les réparations de CE crash, sans produire de statistique de saison. */
export const reparationsDeLaChute = (
  db: PowerSyncDatabase, chuteId: string,
) => db.getAll<ReparationDeChute>(
  `SELECT id, libelle, date_jour, cout_centimes
     FROM intervention
    WHERE chute_id = ? AND etat = 'faite'
    ORDER BY date_jour DESC, id DESC`, [chuteId])

/** Une réparation payée est deux vues d'un même fait :
 *  - l'intervention documente ce qui a été réparé et porte `chute_id` ;
 *  - la dépense entre une seule fois dans le budget et est référencée par
 *    `intervention.depense_id`.
 *
 * Les deux lignes naissent dans la même transaction LOCALE. Le réseau les
 * transporte CRUD par CRUD : sur une FK encore absente, le connecteur
 * n'acquitte donc rien et rejoue toute la transaction. Les PUT sont des upserts
 * idempotents ; c'est une garantie de convergence, pas une fausse transaction
 * HTTP. */
export const consignerReparationDeChute = async (
  db: PowerSyncDatabase,
  r: {
    chuteId: string; machineId: string; categorie: Categorie
    libelle: string; date: string; centimes: number
  },
): Promise<{ interventionId: string; depenseId: string }> => {
  const libelle = r.libelle.trim()
  if (!libelle) throw new Error('La réparation doit être nommée.')
  if (!estCategorieIntervention(r.categorie))
    throw new Error("La catégorie d'intervention est invalide.")
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) throw new Error('La date est invalide.')
  if (!Number.isInteger(r.centimes) || r.centimes < 0)
    throw new Error('Le coût doit être un nombre entier de centimes positif ou nul.')

  const interventionId = nouvelId()
  const depenseId = nouvelId()
  await db.writeTransaction(async (tx) => {
    const chute = await tx.getOptional<{ machine_id: string | null }>(
      `SELECT r.machine_id
         FROM chute c JOIN roulage r ${TOUTES_JOURNEES} ON r.id = c.roulage_id
        WHERE c.id = ?`, [r.chuteId])
    if (!chute) throw new Error('Ce crash est introuvable.')
    if (!chute.machine_id) throw new Error("Ce roulage n'a pas de moto liée.")
    if (chute.machine_id !== r.machineId)
      throw new Error("La réparation doit appartenir à la moto de ce roulage.")

    await tx.execute(
      `INSERT INTO depense
         (id, cible, roulage_id, machine_id, saison_annee, montant_centimes,
          libelle, date_jour, poste)
       VALUES (?, 'machine', NULL, ?, ?, ?, ?, ?, 'entretien')`,
      [depenseId, r.machineId, anneeSaison(r.date), r.centimes, libelle, r.date])
    await tx.execute(
      `INSERT INTO intervention
         (id, machine_id, chute_id, categorie, etat, libelle, date_jour,
          cout_centimes, depense_id, photo_id)
       VALUES (?, ?, ?, ?, 'faite', ?, ?, ?, ?, NULL)`,
      [interventionId, r.machineId, r.chuteId, r.categorie,
        libelle, r.date, r.centimes, depenseId])
  })
  await marquerSaisie(db)
  return { interventionId, depenseId }
}

/**
 * CE QUE CETTE CHUTE A COÛTÉ EN RÉPARATIONS.
 *
 * La seule somme que ce fichier calcule, et elle porte sur UNE chute — jamais
 * sur une saison, jamais sur un pilote. C'est une facture, pas une statistique :
 * elle répond à « combien m'a coûté cette journée-là », question qu'on se pose
 * une fois, pas à « est-ce que je chute trop », question que le produit
 * n'aidera jamais personne à se poser.
 */
export const coutDeLaChute = async (db: PowerSyncDatabase, chuteId: string) => {
  const r = await db.get<{ total: number | null; n: number }>(
    `SELECT coalesce(sum(cout_centimes), 0) AS total, count(*) AS n
       FROM intervention WHERE chute_id = ? AND etat = 'faite'`, [chuteId])
  return { centimes: r.total ?? 0, reparations: r.n }
}
