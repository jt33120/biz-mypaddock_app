import type { PowerSyncDatabase } from '@powersync/web'
import { budgetDeclare, depenseSaison, poserBudget } from './depot'
import { A_EU_LIEU, aujourdhui } from './vecu'

/**
 * LE BILAN DE SAISON — épique 15, FR-52, FR-55, FR-56.
 *
 * ⚠ LA CLAUSE QUI GOUVERNE CE FICHIER EST FR-55 : « le bilan ÉNONCE SA
 * COMPLÉTUDE plutôt que de présenter des moyennes fausses ». C'est la même
 * discipline que l'horloge d'usure, appliquée à l'argent et au chrono : un
 * chiffre hérite de la qualité de sa source, et une saison saisie par plaisir
 * a des trous.
 *
 * Conséquence : IL N'Y A AUCUNE MOYENNE DANS CE FICHIER. Pas de « coût moyen
 * par roulage », pas de « chrono moyen », pas de « progression moyenne ». Une
 * moyenne calculée sur onze roulages dont deux sans chrono est fausse de deux
 * façons — elle divise par le mauvais nombre, et elle présente comme une mesure
 * ce qui est une estimation. Le bilan compte, il ne divise pas.
 *
 * FR-52 : la saison est un ÉTAT DÉRIVÉ, du premier au dernier roulage saisi de
 * l'année. Aucun réglage, aucune bascule, aucune étape d'installation — et
 * aucune branche ne teste un mois (FR-53, AD-8).
 */

export type Bilan = {
  annee: number
  /** Bornes réelles de la saison : du premier au dernier roulage saisi.
   *  `null` quand l'année n'a aucun roulage — un état valide, pas un trou. */
  du: string | null
  au: string | null
  roulages: number
  /** FR-55 — la complétude, dans le même objet que les chiffres qu'elle
   *  qualifie. On ne peut pas afficher l'un sans l'autre. */
  sansChrono: number
  sansGroupe: number
  sessions: number
  meilleurMs: number | null
  circuits: number
  depenseCentimes: number
  budgetCentimes: number | null
  photos: number
  gestes: number
}

export const bilanSaison = async (
  db: PowerSyncDatabase, annee: number, jour = aujourdhui(),
): Promise<Bilan> => {
  const a = String(annee)
  // ⚠ LE FILTRE D'ÉTAT SEUL NE SERVAIT À RIEN, et FR-55 se retournait contre
  // elle-même. `creerRoulage` écrit `usage` en dur : une journée annoncée pour
  // septembre passait donc le filtre, entrait dans « N roulages saisis », et
  // comme elle n'a aucun tour, le bilan l'annonçait « sans chrono ». Le seul
  // écran dont la raison d'être est d'énoncer sa complétude désignait un trou
  // qui n'en était pas un. Le prédicat partagé porte les DEUX moitiés.
  const r = await db.get<Record<string, number | string | null>>(
    `SELECT min(r.date_jour) AS du, max(r.date_jour) AS au,
            count(*) AS roulages,
            sum(CASE WHEN (SELECT count(*) FROM tour t
                             JOIN session s ON s.id = t.session_id
                            WHERE s.roulage_id = r.id) = 0 THEN 1 ELSE 0 END) AS sansChrono,
            sum(CASE WHEN r.groupe_rang IS NULL THEN 1 ELSE 0 END) AS sansGroupe,
            count(DISTINCT r.circuit_nom) AS circuits
       FROM roulage r
      WHERE substr(r.date_jour, 1, 4) = ? AND ${A_EU_LIEU('r')}`, [a, jour])

  // Chaque agrégat est compté SÉPARÉMENT et jamais par jointure : joindre
  // sessions, tours, photos et gestes dans la même requête multiplierait les
  // lignes, et chaque compte serait faux d'un facteur différent.
  const c = await db.get<Record<string, number | null>>(
    `SELECT (SELECT count(*) FROM session s JOIN roulage r ON r.id = s.roulage_id
              WHERE substr(r.date_jour, 1, 4) = ? AND ${A_EU_LIEU('r')}) AS sessions,
            (SELECT min(t.temps_ms) FROM tour t
               JOIN session s ON s.id = t.session_id
               JOIN roulage r ON r.id = s.roulage_id
              WHERE substr(r.date_jour, 1, 4) = ? AND ${A_EU_LIEU('r')}) AS meilleur,
            (SELECT count(*) FROM photo p JOIN roulage r ON r.id = p.roulage_id
              WHERE substr(r.date_jour, 1, 4) = ? AND ${A_EU_LIEU('r')}) AS photos,
            (SELECT count(*) FROM geste g JOIN roulage r ON r.id = g.roulage_id
              WHERE substr(r.date_jour, 1, 4) = ? AND ${A_EU_LIEU('r')}) AS gestes`,
    [a, jour, a, jour, a, jour, a, jour])

  return {
    annee,
    du: (r.du as string) ?? null,
    au: (r.au as string) ?? null,
    roulages: Number(r.roulages ?? 0),
    sansChrono: Number(r.sansChrono ?? 0),
    sansGroupe: Number(r.sansGroupe ?? 0),
    sessions: Number(c.sessions ?? 0),
    meilleurMs: (c.meilleur as number) ?? null,
    circuits: Number(r.circuits ?? 0),
    depenseCentimes: await depenseSaison(db, annee),
    budgetCentimes: await budgetDeclare(db, annee),
    photos: Number(c.photos ?? 0),
    gestes: Number(c.gestes ?? 0),
  }
}

/** Les années qui ont au moins un roulage VÉCU, la plus récente d'abord. Le
 *  produit ne propose jamais une année vide : montrer « 2028 · rien » serait
 *  montrer un écran vide, et un écran vide signale l'abandon (FR-14).
 *
 *  ⚠ ET UNE JOURNÉE ANNONCÉE POUR JANVIER PROCHAIN OUVRIRAIT EXACTEMENT ÇA :
 *  une saison 2027 qui n'existe pas encore, avec zéro roulage dedans — puisque
 *  `bilanSaison` ne compte, lui, que les vécus. Les deux lectures doivent donc
 *  se prononcer de la même manière, sinon elles se contredisent d'un écran. */
export const anneesSaisies = async (
  db: PowerSyncDatabase, jour = aujourdhui(),
): Promise<number[]> => {
  const l = await db.getAll<{ a: string }>(
    `SELECT DISTINCT substr(date_jour, 1, 4) AS a FROM roulage
      WHERE date_jour IS NOT NULL AND ${A_EU_LIEU('')} ORDER BY a DESC`, [jour])
  return l.map((x) => Number(x.a)).filter((n) => Number.isFinite(n))
}

/**
 * LE BUDGET PRÉVISIONNEL — FR-56.
 *
 * « Il se propose à partir de ce que la saison écoulée a RÉELLEMENT COÛTÉ, et
 * se corrige à la main. Ce n'est pas une prévision, c'est un report. »
 *
 * La distinction est tout le mécanisme : le produit ne modélise rien, ne majore
 * de rien, n'applique aucune inflation et ne tient compte d'aucune tendance.
 * Il recopie un chiffre réel d'une année sur l'autre et laisse le pilote le
 * corriger. Une « prévision » aurait l'air plus intelligente et serait moins
 * vraie — et surtout, elle appartiendrait au produit plutôt qu'au pilote.
 */
export type Report = { depuis: number; centimes: number } | null

export const reportPossible = async (
  db: PowerSyncDatabase, pour: number,
): Promise<Report> => {
  const deja = await budgetDeclare(db, pour)
  if (deja != null) return null   // un budget posé ne se remplace jamais tout seul
  const precedente = pour - 1
  const c = await depenseSaison(db, precedente)
  return c > 0 ? { depuis: precedente, centimes: c } : null
}

export const reporter = (db: PowerSyncDatabase, pour: number, centimes: number) =>
  poserBudget(db, pour, centimes)
