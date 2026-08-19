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

export type Machine = {
  id: string; marque: string; modele: string; annee: number | null
  /** Portrait pixel en data URI. `null` est un état valide : le garage montre alors une
   *  silhouette. AD-2 fait de la machine une racine, pas un objet conditionnel à un média. */
  sprite: string | null
}

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
    `INSERT INTO machine (id, marque, modele, annee, sprite) VALUES (?, ?, ?, ?, ?)`,
    [id, m.marque, m.modele, m.annee, m.sprite],
  )
  return id
}

export const listerMachines = (db: PowerSyncDatabase) =>
  db.getAll<Machine>(`SELECT id, marque, modele, annee, sprite FROM machine ORDER BY id DESC`)

/** Le sprite se pose et se retire sans toucher au reste de la machine : c'est une
 *  reconstruction, pas une donnée d'identité. Le pilote doit pouvoir le refuser. */
export const poserSprite = (db: PowerSyncDatabase, machineId: string, sprite: string | null) =>
  db.execute(`UPDATE machine SET sprite = ? WHERE id = ?`, [sprite, machineId])

/** Ce que la machine a coûté : EXCLUSIVEMENT les dépenses dont la cible est cette machine.
 *  Jamais une jointure implicite par les roulages (AD-17). */
export const coutMachine = async (db: PowerSyncDatabase, machineId: string) => {
  const r = await db.get<{ total: number | null }>(
    `SELECT SUM(montant_centimes) AS total FROM depense WHERE cible = 'machine' AND machine_id = ?`,
    [machineId],
  )
  return r.total ?? 0
}

/** Roulages et meilleur tour de CETTE machine. Une machine sans roulage rend des zéros
 *  et un meilleur tour nul — c'est un état valide, pas une absence de données (AD-2). */
export const bilanMachine = async (db: PowerSyncDatabase, machineId: string) => {
  const r = await db.get<{ roulages: number; meilleur: number | null }>(
    `SELECT COUNT(DISTINCT r.id) AS roulages, MIN(t.temps_ms) AS meilleur
       FROM roulage r
       LEFT JOIN session s ON s.roulage_id = r.id
       LEFT JOIN tour t ON t.session_id = s.id
      WHERE r.machine_id = ?`,
    [machineId],
  )
  return { roulages: r.roulages ?? 0, meilleurMs: r.meilleur ?? null }
}

/** Le circuit est stocké EN CLAIR, dans `circuit_nom`. La récolte viendra poser
 *  `circuit_id` par-dessus ; elle n'est pas au noyau. Écrire le nom dans la
 *  référence — ce que faisait la v0 — bloquait toute synchronisation (récit 1.2). */
export const creerRoulage = async (
  db: PowerSyncDatabase,
  r: { circuit: string; date: string; groupeNom: string | null; rang: number | null; total: number | null; machineId: string | null },
) => {
  const id = nouvelId()
  await db.execute(
    `INSERT INTO roulage (id, machine_id, date_jour, groupe_nom, groupe_rang, groupe_total, circuit_nom)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, r.machineId, r.date, r.groupeNom, r.rang, r.total, r.circuit],
  )
  return id
}

export const listerRoulages = (db: PowerSyncDatabase) =>
  db.getAll<Roulage & { sessions: number; meilleur: number | null }>(
    `SELECT r.id, r.circuit_nom, r.date_jour, r.groupe_nom, r.groupe_rang,
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
    `SELECT r.circuit_nom AS circuit, r.date_jour AS date,
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
      WHERE r.circuit_nom = ? AND r.id <> ? AND r.date_jour <= ?`,
    [cur.circuit, roulageId, cur.date])

  const ancien = prec[0]?.meilleur ?? null
  return {
    ...cur,
    ecart: ancien != null && cur.meilleur != null ? cur.meilleur - ancien : null,
    reference: ancien,
  }
}

/* ─── LES DÉPENSES ─────────────────────────────────────────────────────────
   AD-7 : trois cibles de premier rang, exclusives et obligatoires — roulage,
   machine, saison. Indexer le coût sur le seul roulage ferait échapper la
   moitié du budget réel, et rendrait inapplicable la clause « le coût au tour
   ne s'affiche jamais seul ».
   L'argent est en CENTIMES ENTIERS. Jamais de flottant sur de la monnaie. */

export type Cible = 'roulage' | 'machine' | 'saison'

/** AD-18 : `saison_annee` est un entier fixé À LA SAISIE et jamais recalculé.
 *  AD-8 : aucune branche ne teste un mois de l'année. On prend l'année de la
 *  date de la dépense, point — ce qui reste vrai pour qui roule en janvier. */
export const anneeSaison = (dateIso: string) => Number(dateIso.slice(0, 4))

export const creerDepense = async (
  db: PowerSyncDatabase,
  d: { cible: Cible; roulageId: string | null; machineId: string | null; centimes: number; libelle: string; date: string },
) => {
  const id = nouvelId()
  await db.execute(
    `INSERT INTO depense (id, cible, roulage_id, machine_id, saison_annee, montant_centimes, libelle)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, d.cible, d.roulageId, d.machineId, anneeSaison(d.date), d.centimes, d.libelle || null],
  )
  return id
}

export const formaterEuros = (centimes: number) =>
  (centimes / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €'

/** Le budget de saison consommé — toutes cibles confondues, c'est le budget
 *  DU PILOTE. AD-17 : le coût d'une machine serait une autre requête, celle
 *  des seules dépenses qui la désignent. Ne pas confondre les deux. */
export const budgetSaison = async (db: PowerSyncDatabase, annee: number) => {
  const r = await db.getAll<{ total: number | null }>(
    `SELECT sum(montant_centimes) AS total FROM depense WHERE saison_annee = ?`, [annee])
  return r[0]?.total ?? 0
}

export const coutRoulage = async (db: PowerSyncDatabase, roulageId: string) => {
  const r = await db.getAll<{ total: number | null }>(
    `SELECT sum(montant_centimes) AS total FROM depense WHERE cible = 'roulage' AND roulage_id = ?`, [roulageId])
  return r[0]?.total ?? 0
}

export const listerDepenses = (db: PowerSyncDatabase, annee: number) =>
  db.getAll<{ id: string; cible: Cible; libelle: string | null; montant_centimes: number; roulage_id: string | null }>(
    `SELECT id, cible, libelle, montant_centimes, roulage_id
       FROM depense WHERE saison_annee = ? ORDER BY id DESC`, [annee])

/* ─── REPRISE D'UNE BASE ÉCRITE AVANT LE RÉCIT 1.2 ─────────────────────────
   La v0 rangeait le NOM du circuit dans `circuit_id`, une référence au
   référentiel. Les bases déjà posées sur un téléphone portent donc leurs
   roulages au mauvais endroit, et aucun d'eux ne pourrait partir.

   Une seule passe, idempotente, à l'ouverture : le nom rejoint sa colonne et la
   référence redevient nulle — ce qu'elle aurait toujours dû être tant que la
   récolte n'a rien apparié. */
export const normaliserCircuits = async (db: PowerSyncDatabase): Promise<number> => {
  const avant = await db.get<{ n: number }>(
    `SELECT count(*) AS n FROM roulage WHERE circuit_nom IS NULL AND circuit_id IS NOT NULL`)
  if (!avant.n) return 0
  await db.execute(
    `UPDATE roulage SET circuit_nom = circuit_id, circuit_id = NULL
      WHERE circuit_nom IS NULL AND circuit_id IS NOT NULL`)
  return avant.n
}
