import type { PowerSyncDatabase } from '@powersync/web'
import { nouvelId } from './ids'

/** Toutes les lectures et écritures passent ici. Aucun écran n'écrit de SQL. */

export type Roulage = {
  id: string
  circuit_nom: string
  date_jour: string
  groupe_nom: string | null
  groupe_rang: number | null
  groupe_total: number | null
  machine_id: string | null
}

export type Machine = { id: string; marque: string; modele: string; annee: number | null }

/** Le chrono vit en MILLISECONDES ENTIÈRES. Jamais de flottant sur un temps. */
export const formaterChrono = (ms: number): string => {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const d = Math.floor((ms % 1000) / 100)
  return `${m}'${String(s).padStart(2, '0')}"${d}`
}

/** Un écart porte TOUJOURS son signe — la couleur seule ne se distingue pas
 *  en deutéranopie, et le signe survit à l'impression comme au daltonisme. */
export const formaterEcart = (ms: number): string => {
  const signe = ms < 0 ? '−' : '+'
  const a = Math.abs(ms)
  const s = Math.floor(a / 1000)
  const d = Math.floor((a % 1000) / 100)
  return `${signe}${s}"${d}`
}

export const creerMachine = async (db: PowerSyncDatabase, m: Omit<Machine, 'id'>) => {
  const id = nouvelId()
  await db.execute(
    `INSERT INTO machine (id, pilote_id, marque, modele, annee) VALUES (?, ?, ?, ?, ?)`,
    [id, 'local', m.marque, m.modele, m.annee],
  )
  return id
}

export const listerMachines = (db: PowerSyncDatabase) =>
  db.getAll<Machine>(`SELECT id, marque, modele, annee FROM machine ORDER BY id DESC`)

/** Le circuit est stocké en clair sur le roulage tant que le référentiel n'est
 *  pas récolté. La récolte viendra le normaliser ; elle n'est pas au noyau. */
export const creerRoulage = async (
  db: PowerSyncDatabase,
  r: { circuit: string; date: string; groupeNom: string | null; rang: number | null; total: number | null; machineId: string | null },
) => {
  const id = nouvelId()
  await db.execute(
    `INSERT INTO roulage (id, pilote_id, machine_id, date_jour, groupe_nom, groupe_rang, groupe_total, circuit_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, 'local', r.machineId, r.date, r.groupeNom, r.rang, r.total, r.circuit],
  )
  return id
}

export const listerRoulages = (db: PowerSyncDatabase) =>
  db.getAll<Roulage & { sessions: number; meilleur: number | null }>(
    `SELECT r.id, r.circuit_id AS circuit_nom, r.date_jour, r.groupe_nom, r.groupe_rang,
            r.groupe_total, r.machine_id,
            (SELECT count(*) FROM session s WHERE s.roulage_id = r.id) AS sessions,
            (SELECT min(t.temps_ms) FROM tour t
               JOIN session s2 ON s2.id = t.session_id WHERE s2.roulage_id = r.id) AS meilleur
       FROM roulage r
      ORDER BY r.date_jour DESC, r.id DESC`,
  )

/** AD-3 : une session porte une COLLECTION de tours, même quand la v1 n'en
 *  écrit qu'un. Et tout chrono porte sa provenance — il n'y a pas de GPS. */
export const ajouterSession = async (db: PowerSyncDatabase, roulageId: string, tempsMs: number) => {
  const rangs = await db.getAll<{ n: number }>(
    `SELECT coalesce(max(ordre), 0) AS n FROM session WHERE roulage_id = ?`, [roulageId])
  const ordre = (rangs[0]?.n ?? 0) + 1
  const sessionId = nouvelId()
  await db.execute(`INSERT INTO session (id, roulage_id, ordre) VALUES (?, ?, ?)`,
    [sessionId, roulageId, ordre])
  await db.execute(
    `INSERT INTO tour (id, session_id, temps_ms, provenance) VALUES (?, ?, ?, ?)`,
    [nouvelId(), sessionId, tempsMs, 'saisie_manuelle'],
  )
  return ordre
}

/** Le meilleur tour du jour, et l'écart À CIRCUIT CONSTANT avec la dernière
 *  fois. Comparer deux circuits différents ne veut rien dire. */
export const bilanRoulage = async (db: PowerSyncDatabase, roulageId: string) => {
  const l = await db.getAll<{ circuit: string; date: string; sessions: number; meilleur: number | null }>(
    `SELECT r.circuit_id AS circuit, r.date_jour AS date,
            (SELECT count(*) FROM session s WHERE s.roulage_id = r.id) AS sessions,
            (SELECT min(t.temps_ms) FROM tour t
               JOIN session s2 ON s2.id = t.session_id WHERE s2.roulage_id = r.id) AS meilleur
       FROM roulage r WHERE r.id = ?`, [roulageId])
  const cur = l[0]
  if (!cur) return null

  const prec = await db.getAll<{ meilleur: number }>(
    `SELECT min(t.temps_ms) AS meilleur
       FROM tour t
       JOIN session s ON s.id = t.session_id
       JOIN roulage r ON r.id = s.roulage_id
      WHERE r.circuit_id = ? AND r.id <> ? AND r.date_jour <= ?`,
    [cur.circuit, roulageId, cur.date])

  const ancien = prec[0]?.meilleur ?? null
  return {
    ...cur,
    ecart: ancien != null && cur.meilleur != null ? cur.meilleur - ancien : null,
    reference: ancien,
  }
}
