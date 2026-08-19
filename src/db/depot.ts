import type { PowerSyncDatabase } from '@powersync/web'
import { nouvelId } from './ids'
import { marquerSaisie } from './mesures'

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
  await marquerSaisie(db)
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
  await marquerSaisie(db)
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
  await marquerSaisie(db)
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
 *
 *  Le récit 5.1 demande deux choses qui SEMBLENT en demander trois : « la saison
 *  en cours si elle existe, sinon la saison à venir », et « aucune expression
 *  conditionnelle ne compare un mois de l'année ». Les deux clauses se replient
 *  sur UNE SEULE expression — l'année de la date de la dépense. Si un roulage a
 *  déjà eu lieu cette année-là, la dépense rejoint une saison en cours ; sinon
 *  elle rejoint une saison qui n'a pas encore commencé. Même calcul, deux
 *  lectures. C'est PARCE QUE la règle se replie ainsi qu'aucun mois n'est testé,
 *  et c'est ce qui la rend vraie pour qui roule en janvier (AD-8). */
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
  await marquerSaisie(db)
  return id
}

/** « 245,50 » comme « 245.5 » comme « 245 » → 24550. Rien d'autre ne passe —
 *  et surtout pas un flottant : 0,1 + 0,2 ne fait pas 0,3, et une saison entière
 *  d'additions finit par le montrer. */
export const enCentimes = (saisie: string): number | null => {
  const t = saisie.trim().replace(',', '.')
  if (!/^\d{1,6}(\.\d{0,2})?$/.test(t)) return null
  const [e, dec = ''] = t.split('.')
  return Number(e) * 100 + Number(dec.padEnd(2, '0'))
}

/** Un montant rond s'écrit sans décimales, un montant à centimes en porte DEUX.
 *  « 180,5 € » n'est pas une somme d'argent, c'est un nombre — et sur une colonne
 *  de dépenses ça saute aux yeux. */
export const formaterEuros = (centimes: number) => {
  const d = centimes % 100 === 0 ? 0 : 2
  return (centimes / 100).toLocaleString('fr-FR',
    { minimumFractionDigits: d, maximumFractionDigits: d }) + ' €'
}

/** Ce qui a été DÉPENSÉ sur une saison — toutes cibles confondues, c'est le
 *  budget DU PILOTE. AD-17 : le coût d'une machine est une autre requête, celle
 *  des seules dépenses qui la désignent. Ne pas confondre les deux. */
export const depenseSaison = async (db: PowerSyncDatabase, annee: number) => {
  const r = await db.getAll<{ total: number | null }>(
    `SELECT sum(montant_centimes) AS total FROM depense WHERE saison_annee = ?`, [annee])
  return r[0]?.total ?? 0
}

/** Ce que le pilote S'ÉTAIT FIXÉ. `null` est un état parfaitement normal, et
 *  c'est LUI qui gouverne l'affichage du coût au tour (FR-24). */
export const budgetDeclare = async (db: PowerSyncDatabase, annee: number) => {
  const r = await db.get<{ montant_centimes: number | null }>(
    `SELECT max(montant_centimes) AS montant_centimes FROM budget_saison WHERE annee = ?`, [annee])
  return r.montant_centimes ?? null
}

/** Poser ou corriger le budget d'une saison. On réutilise la ligne existante
 *  plutôt que d'en créer une seconde : deux budgets pour une même saison n'ont
 *  aucun sens, et le serveur le refuserait. */
export const poserBudget = async (db: PowerSyncDatabase, annee: number, centimes: number) => {
  const exist = await db.getAll<{ id: string }>(
    `SELECT id FROM budget_saison WHERE annee = ? LIMIT 1`, [annee])
  if (exist[0]) {
    await db.execute(`UPDATE budget_saison SET montant_centimes = ? WHERE id = ?`,
      [centimes, exist[0].id])
    await marquerSaisie(db)
    return exist[0].id
  }
  const id = nouvelId()
  await db.execute(
    `INSERT INTO budget_saison (id, annee, montant_centimes) VALUES (?, ?, ?)`,
    [id, annee, centimes])
  await marquerSaisie(db)
  return id
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

/* ─── LES DEUX COÛTS, ET LA CLAUSE QUI LES SÉPARE ──────────────────────────
   Le coût de la journée est une CONSTATATION : on a payé ça. Le coût au tour
   est un RAPPORT, et un rapport se manipule — il descend quand on roule plus.
   Affiché seul, il souffle « roule encore, ça baissera » ; c'est exactement le
   mécanisme que les clauses de sécurité du produit interdisent.

   D'où FR-21 et FR-24, tenus ICI plutôt que dans un écran, pour qu'aucun futur
   écran ne puisse les enfreindre par commodité : le coût au tour n'existe QUE
   s'il vient avec le budget consommé. Pas de budget, pas de coût au tour — et
   ni zéro ni tiret, l'absence est une absence. */

export type CoutRoulage = {
  /** La constatation. Toujours disponible, même à zéro. */
  journeeCentimes: number
  tours: number
  /** Le rapport. `null` tant qu'aucun budget n'est déclaré — et alors il ne
   *  s'affiche pas du tout, il ne s'affiche pas « vide ». */
  auTourCentimes: number | null
  /** Ce qui doit accompagner le rapport DANS LE MÊME BLOC (FR-21). */
  budgetCentimes: number | null
  consommeCentimes: number
}

export const coutDuRoulage = async (
  db: PowerSyncDatabase, roulageId: string, annee: number,
): Promise<CoutRoulage> => {
  const journeeCentimes = await coutRoulage(db, roulageId)
  const t = await db.get<{ n: number }>(
    `SELECT count(*) AS n FROM tour t
       JOIN session s ON s.id = t.session_id
      WHERE s.roulage_id = ?`, [roulageId])
  const budgetCentimes = await budgetDeclare(db, annee)
  const consommeCentimes = await depenseSaison(db, annee)

  // La condition porte sur le BUDGET, pas sur le calcul : le rapport est
  // calculable sans lui, et c'est précisément pour ça qu'il faut le retenir.
  const auTourCentimes =
    budgetCentimes != null && t.n > 0 ? Math.round(journeeCentimes / t.n) : null

  return { journeeCentimes, tours: t.n, auTourCentimes, budgetCentimes, consommeCentimes }
}
