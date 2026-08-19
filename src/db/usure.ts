import type { PowerSyncDatabase } from '@powersync/web'
import { nouvelId } from './ids'
import { marquerSaisie } from './mesures'

/**
 * L'HORLOGE D'USURE — épique 12, FR-40 à FR-44.
 *
 * ⚠ C'EST LE SEUL ENDROIT DU PRODUIT OÙ UNE ERREUR TOUCHE LA SÉCURITÉ D'UNE
 * MACHINE. Trois clauses en découlent, et aucune n'est décorative :
 *
 *   · FR-40 — TOUTE horloge affiche sa complétude, PARTOUT, sans exception et
 *     sans repli derrière une interaction. Elle hérite de la qualité d'une
 *     saisie faite par plaisir ; un chiffre adjacent à la sécurité ne peut pas
 *     prétendre à une précision que sa source n'a pas. L'invariant descend donc
 *     DANS LE TYPE : `Avancement` et `Completude` sont un seul objet, et il
 *     n'existe aucun chemin qui rende l'un sans l'autre. C'est le même remède
 *     que pour `CoutRoulage.auTour` — une clause tenue par un ternaire de rendu
 *     finit toujours par être contournée.
 *
 *   · FR-44 — le barème est TRANSCRIT, JAMAIS INTERPRÉTÉ. Rien ici ne rend une
 *     durée de vie restante, un verdict, un « à faire avant ». Le produit dit
 *     OÙ EN EST la machine ; il ne dit pas ce qu'il faut faire.
 *
 *   · FR-41 — l'horloge avance avec les ROULAGES SAISIS, pondérés par le
 *     coefficient d'usure appliqué au NIVEAU MYPADDOCK, jamais au nom du
 *     groupe. « Rouge » chez un organisateur et « Expert » chez un autre
 *     projettent sur le même niveau, et le produit n'a pas à tenir une table de
 *     noms qui changerait à chaque nouvel organisateur.
 */

export type Niveau = 'debutant' | 'intermediaire' | 'confirme' | 'racer'

export const NOM_NIVEAU: Record<Niveau, string> = {
  debutant: 'Débutant', intermediaire: 'Intermédiaire', confirme: 'Confirmé', racer: 'Racer',
}

/**
 * LA PROJECTION DU GROUPE SUR LE NIVEAU — FR-6bis.
 *
 * Le rang seul ne dit rien : 3ᵉ sur 3 et 3ᵉ sur 5 ne sont pas le même niveau.
 * C'est donc la POSITION RELATIVE qui se projette, et `null` quand le pilote
 * n'a pas saisi son groupe — un niveau inventé serait une entrée fausse dans le
 * seul calcul du produit qui touche à la sécurité.
 */
export const niveauDuGroupe = (rang: number | null, total: number | null): Niveau | null => {
  if (!rang || !total || total < 1 || rang < 1 || rang > total) return null
  if (total === 1) return 'intermediaire'
  const p = (rang - 1) / (total - 1)   // 0 pour le groupe le plus lent, 1 pour le plus rapide
  // Quartiles, bornes OUVERTES en haut. Sur l'échelle à quatre groupes de
  // Pau-Arnos — Initiation, Intermédiaire, Confirmé, Expert — la projection est
  // alors exactement l'identité, ce qui est le cas le plus fréquent et le seul
  // que le pilote peut vérifier de tête.
  //
  // ⚠ CE DÉCOUPAGE EST UNE HYPOTHÈSE, au même titre que le coefficient d'usure
  // qui part à 1 : aucune source ne l'étaye. Il compte, il ne prétend pas
  // mesurer, et il se recalibre quand une saison de données existe.
  return p < 0.25 ? 'debutant' : p < 0.5 ? 'intermediaire' : p < 0.75 ? 'confirme' : 'racer'
}

/**
 * L'AVANCEMENT ET SA COMPLÉTUDE, INSÉPARABLES.
 *
 * FR-40 exige que la complétude accompagne le chiffre partout. Le seul moyen de
 * le garantir est de rendre l'un impossible sans l'autre : on ne peut pas
 * déstructurer la moitié de cet objet.
 */
export type Avancement = {
  /** Roulages pondérés depuis le dernier geste consigné. Pas des kilomètres :
   *  le téléphone n'est pas le capteur, et personne ne relève son compteur. */
  ponderes: number
  /** L'intervalle transcrit du barème. `null` = aucun barème connu, et alors
   *  l'horloge COMPTE sans jamais échoir — elle n'invente pas d'échéance. */
  intervalle: number | null
  /** FR-40 — la complétude, dans le même objet, obligatoirement. */
  completude: { saisis: number; sansGroupe: number }
  /** FR-61 — la provenance de la recommandation, jamais un état de la machine. */
  source: { url: string | null; recolteLe: string | null; extraitParIa: boolean }
}

export type Horloge = {
  id: string
  machine_id: string
  operation: string
  avancement: Avancement
}

type Ligne = {
  id: string; machine_id: string; operation: string
  intervalle_roulages: number | null
  source_url: string | null; recolte_le: string | null; extrait_par_ia: number | null
  depuis_intervention: string | null
}

/**
 * Les horloges d'une machine, avec leur avancement.
 *
 * Le comptage part de la DATE du dernier geste consigné pour ce poste, ou du
 * début si aucun ne l'a été. Un roulage sans groupe saisi compte pour 1 — il a
 * bien eu lieu — mais il est signalé dans la complétude : sa pondération est
 * inconnue, pas nulle, et confondre les deux ferait mentir le chiffre.
 */
export const horloges = async (
  db: PowerSyncDatabase, machineId: string,
  jour = new Date().toISOString().slice(0, 10),
): Promise<Horloge[]> => {
  const lignes = await db.getAll<Ligne>(
    `SELECT id, machine_id, operation, intervalle_roulages, source_url, recolte_le,
            extrait_par_ia, depuis_intervention
       FROM horloge WHERE machine_id = ? ORDER BY operation`, [machineId])
  if (!lignes.length) return []

  const coefs = await db.getAll<{ niveau: Niveau; coefficient: number }>(
    `SELECT niveau, coefficient FROM coefficient_usure`)
  // Repli à 1 : le référentiel descend par synchronisation et n'existe pas au
  // premier lancement. Un coefficient absent doit compter le roulage, pas
  // l'effacer — c'est exactement le sens de « partir à 1 » (FR-42).
  const coef = (n: Niveau | null) =>
    (n && coefs.find((c) => c.niveau === n)?.coefficient) || 1

  const sortie: Horloge[] = []
  for (const l of lignes) {
    const depuis = l.depuis_intervention
      ? (await db.get<{ d: string | null }>(
          `SELECT date_jour AS d FROM intervention WHERE id = ?`, [l.depuis_intervention])).d
      : null

    // FR-61 : SEULS LES ROULAGES EN USAGE comptent. Un brouillon importé d'un
    // calendrier est une inscription, pas une journée de piste — le faire
    // avancer l'horloge ferait vieillir une machine qui n'a pas roulé.
    // ⚠ ET SEULEMENT LES ROULAGES DÉJÀ VÉCUS. Un roulage saisi pour septembre
    // est un projet, pas de l'usure : le compter ferait vieillir une machine
    // pour une journée qui n'a pas eu lieu. Trouvé en lisant le résultat de
    // l'essai — l'horloge repartait bien, mais à 1 au lieu de 0.
    const roulages = await db.getAll<{ rang: number | null; total: number | null }>(
      `SELECT groupe_rang AS rang, groupe_total AS total FROM roulage
        WHERE machine_id = ? AND etat = 'usage' AND date_jour <= ?
          AND (? IS NULL OR date_jour >= ?)`, [l.machine_id, jour, depuis, depuis])

    let ponderes = 0, sansGroupe = 0
    for (const r of roulages) {
      const n = niveauDuGroupe(r.rang, r.total)
      if (!n) sansGroupe++
      ponderes += coef(n)
    }

    sortie.push({
      id: l.id, machine_id: l.machine_id, operation: l.operation,
      avancement: {
        ponderes: Math.round(ponderes * 10) / 10,
        intervalle: l.intervalle_roulages,
        completude: { saisis: roulages.length, sansGroupe },
        source: {
          url: l.source_url, recolteLe: l.recolte_le, extraitParIa: l.extrait_par_ia === 1,
        },
      },
    })
  }
  return sortie
}

/** Poser une horloge. Sans barème connu, `intervalle` reste nul : elle COMPTE
 *  sans jamais échoir. Inventer un intervalle serait interpréter, ce que FR-44
 *  interdit — et l'interprétation porterait sur la sécurité d'une machine. */
export const poserHorloge = async (
  db: PowerSyncDatabase,
  h: { machineId: string; operation: string; intervalle?: number | null },
) => {
  const id = nouvelId()
  await db.execute(
    `INSERT INTO horloge (id, machine_id, operation, intervalle_roulages, extrait_par_ia)
     VALUES (?, ?, ?, ?, 0)`,
    [id, h.machineId, h.operation.trim(), h.intervalle ?? null])
  await marquerSaisie(db)
  return id
}

/** « C'est fait » : l'horloge repart du geste consigné. Elle ne se remet pas à
 *  zéro — elle change de point de départ, ce qui n'est pas la même chose : rien
 *  n'est effacé, et l'historique reste lisible. */
export const repartirDe = async (
  db: PowerSyncDatabase, horlogeId: string, interventionId: string,
) => {
  await db.execute(`UPDATE horloge SET depuis_intervention = ? WHERE id = ?`,
    [interventionId, horlogeId])
  await marquerSaisie(db)
}

export const oublierHorloge = (db: PowerSyncDatabase, id: string) =>
  db.execute(`DELETE FROM horloge WHERE id = ?`, [id])

/**
 * « C'EST FAIT » DEPUIS L'HORLOGE — le chemin direct, sans rapprochement.
 *
 * Il consigne l'intervention ET fait repartir l'horloge, dans le même geste.
 * L'atelier a son chemin, qui rapproche par le libellé et peut rater ; celui-ci
 * ne peut pas rater, parce que le pilote désigne l'horloge en appuyant dessus.
 * Les deux existent parce que le geste se fait des deux endroits : au garage
 * quand on tient la clé, à l'atelier quand on note ce qu'on vient de faire.
 */
export const cestFaitDepuisLHorloge = async (
  db: PowerSyncDatabase, horlogeId: string, jour: string,
): Promise<string | null> => {
  const h = await db.get<{ machine_id: string; operation: string }>(
    `SELECT machine_id, operation FROM horloge WHERE id = ?`, [horlogeId])
  if (!h) return null
  const interventionId = nouvelId()
  await db.execute(
    `INSERT INTO intervention
       (id, machine_id, categorie, etat, libelle, date_jour)
     VALUES (?, ?, 'entretien', 'faite', ?, ?)`,
    [interventionId, h.machine_id, h.operation, jour])
  await db.execute(`UPDATE horloge SET depuis_intervention = ? WHERE id = ?`,
    [interventionId, horlogeId])
  await marquerSaisie(db)
  return interventionId
}
