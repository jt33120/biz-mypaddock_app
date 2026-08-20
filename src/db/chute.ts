import type { PowerSyncDatabase } from '@powersync/web'
import { nouvelId } from './ids'
import { marquerSaisie } from './mesures'

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
  await db.execute(
    `INSERT INTO chute (id, roulage_id, endroit, recit) VALUES (?, ?, ?, ?)`,
    [id, c.roulageId, c.endroit?.trim() || null, c.recit?.trim() || null])
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
  await db.writeTransaction(async (tx) => {
    await tx.execute(`UPDATE intervention SET chute_id = NULL WHERE chute_id = ?`, [id])
    await tx.execute(`UPDATE photo SET chute_id = NULL WHERE chute_id = ?`, [id])
    await tx.execute(`DELETE FROM chute WHERE id = ?`, [id])
  })
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
