import type { PowerSyncDatabase } from '@powersync/web'
import { nouvelId } from './ids'
import { marquerSaisie } from './mesures'
import { CAPS_EMBARQUES } from './corpus'

/**
 * LE GESTE ET SON CATALOGUE — récits 3.2 et 3.3.
 *
 * FR-28 : purement déclaratif. AUCUNE reconnaissance automatique d'image,
 * jamais — exclusion permanente, pas un report. La photo n'est jamais lue par
 * une machine pour en déduire un fait.
 *
 * FR-39bis : UN CAP DE BRAVOURE NE PART JAMAIS TOUT SEUL AU CERCLE. Le cercle
 * n'existe pas encore, et c'est précisément pourquoi la règle se pose
 * maintenant : le danger n'est ni dans le catalogue seul, ni dans le cercle
 * seul, il est dans leur conjonction automatique. Poser la règle après avoir
 * écrit le cercle, c'est la poser trop tard.
 */

export type Cap = { code: string; libelle: string; categorie: 'bravoure' | 'discipline' }
export type Geste = { id: string; roulage_id: string; cap_code: string }

export const listerCaps = async (db: PowerSyncDatabase): Promise<Cap[]> => {
  const l = await db.getAll<Cap>(
    `SELECT code, libelle, categorie FROM cap WHERE actif <> 0 ORDER BY code`)
  // Même règle que le corpus de conseils : le référentiel DESCEND par la
  // synchronisation, donc il est vide au premier lancement hors ligne — et
  // c'est là qu'on déclare son premier genou posé. La base fait autorité dès
  // qu'elle a quelque chose ; le repli embarqué n'est jamais écrit en base.
  return l.length ? l : [...CAPS_EMBARQUES]
}

export const gestesDuRoulage = (db: PowerSyncDatabase, roulageId: string) =>
  db.getAll<Geste>(
    `SELECT id, roulage_id, cap_code FROM geste WHERE roulage_id = ? ORDER BY id`, [roulageId])

export const declarerGeste = async (
  db: PowerSyncDatabase, roulageId: string, capCode: string,
) => {
  const id = nouvelId()
  // ⚠ `partage` S'ÉCRIT, À FAUX, EXPLICITEMENT. Elle est `not null default false`
  // au serveur : jamais écrite, elle part à NULL — et NULL n'est pas « absente »,
  // donc le défaut ne s'applique pas et le geste est refusé à l'adoption (23502).
  // C'est la même classe que `etat` et `chrono_visible` sur `roulage`.
  // Et ça dit la règle FR-39bis là où elle se décide : un geste naît NON PARTAGÉ,
  // ce n'est pas une absence d'information.
  await db.execute(
    `INSERT INTO geste (id, roulage_id, cap_code, partage) VALUES (?, ?, ?, 0)`,
    [id, roulageId, capCode])
  await marquerSaisie(db)
  return id
}

/**
 * FR-39bis, posée dans le code et pas seulement dans un document.
 *
 * Rend ce qui PEUT partir au cercle sans geste explicite du pilote. Un cap de
 * bravoure n'y est jamais, quoi qu'il arrive. Le jour où le cercle existera, il
 * appellera cette fonction — il n'aura pas à se souvenir de la règle.
 */
export const partageableAutomatiquement = (cap: Cap): boolean =>
  cap.categorie !== 'bravoure'
