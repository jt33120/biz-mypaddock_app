import type { PowerSyncDatabase } from '@powersync/web'
import { nouvelId } from './ids'

/**
 * LES TROIS INSTRUMENTS DE BORD — récit 7.1.
 *
 * Ce ne sont pas des mesures sur le PILOTE, ce sont des mesures sur le PROJET.
 * Elles répondent à trois questions dont la réponse, obtenue en octobre 2027,
 * ne servirait plus à rien :
 *
 *   ① Le pilote saisit-il son roulage pendant qu'il s'en souvient ?
 *   ② Le récapitulatif est-il produit — et surtout, est-il RÉELLEMENT partagé ?
 *   ③ Ouvre-t-on l'application entre deux roulages ?
 *
 * AD-20 : elles passent par le CHEMIN D'ÉCRITURE NORMAL. Aucun appel réseau
 * dédié, aucun SDK, aucun point de télémétrie — une mesure est une ligne dans
 * la base locale, qui remonte comme le reste et que RLS protège comme le reste.
 * C'est aussi ce qui les rend justes hors ligne : au paddock il n'y a pas de
 * réseau, et c'est précisément là que la mesure ① se joue.
 *
 * AD-16 : le pilote peut refuser. Le refus n'est PAS un filtrage côté serveur —
 * quand il refuse, RIEN N'EST ÉCRIT, pas même en local. Une donnée qu'on écrit
 * en promettant de ne pas la lire est une donnée qu'on a écrite.
 */

/* ─── ① LE DÉLAI — déduit, jamais écrit ────────────────────────────────────
   La mesure la plus importante ne coûte pas une ligne de table. L'identifiant
   d'un roulage est un UUID v7 (AD-14) : ses 48 premiers bits portent la
   milliseconde où il a été écrit. Sa `date_jour` porte le jour vécu. Le délai
   est la différence entre les deux, et il est donc déjà dans la base depuis le
   premier jour — sans rien consigner, sans rien pouvoir laisser diverger, et
   avec une mesure de moins à faire accepter au pilote. */

/** L'instant d'écriture porté par un UUID v7.
 *
 *  ⚠ LE CONTRÔLE DE VERSION EST NÉCESSAIRE, pas décoratif. Un UUID v4 est fait
 *  des mêmes caractères hexadécimaux : ses douze premiers en sortiraient un
 *  nombre parfaitement valide et parfaitement faux — une date en 1973 ou en
 *  4000, qui traverserait tous les calculs sans jamais lever d'erreur. Un délai
 *  absurde est pire qu'un délai absent : on le croit. */
export const instantDeLId = (id: string): number => {
  const h = id.replace(/-/g, '')
  if (h.length !== 32 || h[12] !== '7') return NaN
  return parseInt(h.slice(0, 12), 16)
}

export type Delai = { roulages: number; medianeH: number | null; maxH: number | null; seuilFranchi: boolean }

/** FR-57 : le seuil d'alerte se franchit dès qu'UN SEUL roulage dépasse 48 h.
 *  Pas une moyenne, pas une tendance — une seule fois suffit, parce qu'un
 *  souvenir perdu ne revient pas. */
export const SEUIL_H = 48

export const delaiSaisie = async (db: PowerSyncDatabase): Promise<Delai> => {
  const l = await db.getAll<{ id: string; date_jour: string }>(
    `SELECT id, date_jour FROM roulage`)
  const heures = l
    .map((r) => {
      const ecrit = instantDeLId(r.id)
      // Le roulage est daté au JOUR ; on compte depuis sa fin, sinon une saisie
      // faite le soir même compterait déjà douze heures de retard.
      const finDuJour = Date.parse(r.date_jour + 'T23:59:59Z')
      return Number.isNaN(ecrit) || Number.isNaN(finDuJour) ? null : (ecrit - finDuJour) / 3_600_000
    })
    .filter((h): h is number => h != null)
    .map((h) => Math.max(0, h))   // saisi le jour même : zéro, jamais négatif
    .sort((a, b) => a - b)

  if (!heures.length) return { roulages: 0, medianeH: null, maxH: null, seuilFranchi: false }
  const m = heures.length % 2
    ? heures[(heures.length - 1) / 2]
    : (heures[heures.length / 2 - 1] + heures[heures.length / 2]) / 2
  const max = heures[heures.length - 1]
  return { roulages: heures.length, medianeH: m, maxH: max, seuilFranchi: max > SEUIL_H }
}

/* ─── ② ET ③ — les deux qui doivent s'écrire ──────────────────────────────── */

export type Genre = 'ouverture' | 'recap_genere' | 'recap_poste'

/** Le consentement vit EN LOCAL et par appareil, et ce n'est pas un raccourci :
 *  un refus qu'il faudrait téléverser pour être effectif serait une
 *  contradiction. Il doit être lisible avant la première écriture. */
const CLE = 'mypaddock.mesures'

export const mesuresAcceptees = (): boolean => {
  try { return localStorage.getItem(CLE) !== 'non' } catch { return true }
}

export const accepterMesures = (oui: boolean) => {
  try { localStorage.setItem(CLE, oui ? 'oui' : 'non') } catch { /* rien à faire */ }
}

const aujourdhui = () => new Date().toISOString().slice(0, 10)

const ecrire = async (db: PowerSyncDatabase, genre: Genre, valeur = 0) => {
  // AD-16 : le refus arrête l'écriture ICI, avant la base. Il ne filtre rien
  // plus loin, parce qu'il n'y a rien de plus loin.
  if (!mesuresAcceptees()) return null
  const id = nouvelId()
  await db.execute(
    `INSERT INTO mesure (id, genre, valeur, jour) VALUES (?, ?, ?, ?)`,
    [id, genre, valeur, aujourdhui()])
  return id
}

/** L'ouverture en cours. Tenue ICI et non dans un écran, et c'est le point de
 *  conception : le marquage descend dans le CHEMIN D'ÉCRITURE (voir depot.ts),
 *  parce qu'un marquage posé écran par écran finit toujours par manquer au
 *  suivant — et un marquage manquant ne se signale pas, il fait juste dire à
 *  l'instrument que personne n'a rien saisi. */
let ouvertureCourante: string | null = null

/** ③ Une ouverture. Elle naît à 0 — « n'a rien produit » — et c'est l'état
 *  attendu, pas un échec : l'accueil temporel existe pour provoquer des
 *  ouvertures qui ne saisissent rien (FR-59). */
export const ouverture = async (db: PowerSyncDatabase) => {
  ouvertureCourante = await ecrire(db, 'ouverture')
  return ouvertureCourante
}

/** Marque l'ouverture courante comme ayant produit une saisie. Appelé par le
 *  dépôt, jamais par un écran. Idempotent — la deuxième saisie ne compte pas
 *  deux fois — et sans effet si le pilote a refusé la mesure : il n'y a alors
 *  aucune ouverture à marquer, puisqu'aucune n'a été écrite. */
export const marquerSaisie = async (db: PowerSyncDatabase) => {
  if (!ouvertureCourante) return
  await db.execute(`UPDATE mesure SET valeur = 1 WHERE id = ? AND valeur = 0`, [ouvertureCourante])
}

/** ② Les deux moitiés de FR-58, et l'écart entre elles est tout l'intérêt :
 *  un récapitulatif produit puis jamais posté dit quelque chose de précis. */
export const recapGenere = (db: PowerSyncDatabase) => ecrire(db, 'recap_genere')
export const recapPoste = (db: PowerSyncDatabase) => ecrire(db, 'recap_poste')

/* ─── LA LECTURE ───────────────────────────────────────────────────────────── */

export type Tableau = {
  delai: Delai
  ouvertures: number
  ouverturesSansSaisie: number
  recapsGeneres: number
  recapsPostes: number
}

export const tableauDeBord = async (db: PowerSyncDatabase): Promise<Tableau> => {
  const c = await db.getAll<{ genre: Genre; n: number; produit: number }>(
    `SELECT genre, count(*) AS n, sum(valeur) AS produit FROM mesure GROUP BY genre`)
  const de = (g: Genre) => c.find((x) => x.genre === g)
  const ouv = de('ouverture')
  return {
    delai: await delaiSaisie(db),
    ouvertures: ouv?.n ?? 0,
    ouverturesSansSaisie: (ouv?.n ?? 0) - (ouv?.produit ?? 0),
    recapsGeneres: de('recap_genere')?.n ?? 0,
    recapsPostes: de('recap_poste')?.n ?? 0,
  }
}
