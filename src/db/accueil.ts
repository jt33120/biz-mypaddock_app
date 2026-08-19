import type { PowerSyncDatabase } from '@powersync/web'
import { nouvelId } from './ids'
import { CONSEILS_EMBARQUES } from './corpus'

/**
 * L'ACCUEIL TEMPOREL — récit 6.1.
 *
 * Ce qui fait exister le produit ENTRE deux roulages. Un produit qu'on n'ouvre
 * qu'en piste n'existe que onze jours par an.
 *
 * ⚠ LA RÈGLE QUI GOUVERNE TOUT : une source de l'accueil est CE QU'ON A ENVIE
 * DE VOIR, jamais ce qu'on a oublié de faire. C'est pour ça qu'il n'existe ici
 * aucune notion de « en attente », « à compléter » ou « manquant » — et que le
 * coût, quand il se saisit depuis l'accueil, ne se réclame jamais.
 *
 * AD-6 : TOUT SE CALCULE À L'OUVERTURE. Rien ne tourne pendant que
 * l'application est fermée — WebKit a refusé Background Sync et n'a jamais
 * implémenté Background Fetch. L'accueil est donc immunisé par construction :
 * il ne peut pas dépendre de quelque chose qui aurait dû s'exécuter la nuit.
 */

export type Source =
  | { genre: 'a_venir'; roulage: Prochain; jours: number; meilleurIci: number | null }
  | { genre: 'dernier'; roulage: Prochain; jours: number; meilleurIci: number | null }
  | { genre: 'vide' }

export type Prochain = {
  id: string
  circuit_nom: string
  date_jour: string
  meilleur: number | null
  sessions: number
  cout_centimes: number
}

/** Un écart en jours pleins entre deux dates ISO. Aucun mois n'est testé, aucun
 *  fuseau n'intervient : on compare deux jours, pas deux instants (AD-8). */
export const ecartJours = (de: string, a: string): number =>
  Math.round((Date.parse(a + 'T12:00:00Z') - Date.parse(de + 'T12:00:00Z')) / 86_400_000)

const LIGNE = `
  SELECT r.id, r.circuit_nom, r.date_jour,
         (SELECT count(*) FROM session s WHERE s.roulage_id = r.id) AS sessions,
         (SELECT min(t.temps_ms) FROM tour t
            JOIN session s2 ON s2.id = t.session_id WHERE s2.roulage_id = r.id) AS meilleur,
         coalesce((SELECT sum(d.montant_centimes) FROM depense d
                     WHERE d.cible = 'roulage' AND d.roulage_id = r.id), 0) AS cout_centimes
    FROM roulage r`

/**
 * La source du jour, et l'ORDRE compte.
 *
 * ① Un roulage à venir gagne toujours : c'est la seule chose que le pilote a
 *    envie de voir en ouvrant hors d'un roulage.
 * ② Sinon le dernier roulage vécu — son chrono, ce qu'il a coûté.
 * ③ Et s'il n'y a rien, il n'y a pas d'écran vide : il y a une seule action.
 */
export const sourceAccueil = async (db: PowerSyncDatabase, jour: string): Promise<Source> => {
  const aVenir = await db.getAll<Prochain>(
    `${LIGNE} WHERE r.date_jour > ? ORDER BY r.date_jour ASC LIMIT 1`, [jour])
  if (aVenir[0]) {
    return {
      genre: 'a_venir',
      roulage: aVenir[0],
      jours: ecartJours(jour, aVenir[0].date_jour),
      meilleurIci: await meilleurAuCircuit(db, aVenir[0].circuit_nom, aVenir[0].id),
    }
  }

  const dernier = await db.getAll<Prochain>(
    `${LIGNE} WHERE r.date_jour <= ? ORDER BY r.date_jour DESC, r.id DESC LIMIT 1`, [jour])
  if (dernier[0]) {
    return {
      genre: 'dernier',
      roulage: dernier[0],
      jours: ecartJours(dernier[0].date_jour, jour),
      meilleurIci: await meilleurAuCircuit(db, dernier[0].circuit_nom, dernier[0].id),
    }
  }

  return { genre: 'vide' }
}

/** Le meilleur tour du pilote SUR CE CIRCUIT, hors du roulage affiché — c'est
 *  la seule comparaison qui veuille dire quelque chose. Comparer deux circuits
 *  différents ne compare rien. */
export const meilleurAuCircuit = async (
  db: PowerSyncDatabase, circuit: string, saufRoulageId: string,
): Promise<number | null> => {
  const r = await db.getAll<{ m: number | null }>(
    `SELECT min(t.temps_ms) AS m
       FROM tour t
       JOIN session s ON s.id = t.session_id
       JOIN roulage r ON r.id = s.roulage_id
      WHERE r.circuit_nom = ? AND r.id <> ?`, [circuit, saufRoulageId])
  return r[0]?.m ?? null
}

/**
 * LES LIBELLÉS DE TEMPS — et c'est ici que FR-13 se tient ou tombe.
 *
 * « dans 12 jours » énonce un fait. « plus que 12 jours ! » est une échéance.
 * « il y a 3 jours » énonce un fait. « saisis-le vite » est une injonction.
 * La différence n'est pas de ton, elle est de nature : un fait ne demande rien.
 *
 * Aucune de ces chaînes ne contient de verbe à l'impératif, de point
 * d'exclamation, ni de mot de rareté (« plus que », « reste », « encore »).
 */
export const direAVenir = (jours: number): string =>
  jours <= 0 ? "aujourd'hui" : jours === 1 ? 'demain' : `dans ${jours} jours`

export const direPasse = (jours: number): string =>
  jours <= 0 ? "aujourd'hui" : jours === 1 ? 'hier' : `il y a ${jours} jours`

/* ─── LE CONSEIL DU JOUR ET LE PLAN SI-ALORS — récit 6.3 ───────────────────
   Le meilleur rapport valeur/coût de la réorientation, et le seul de ses
   garde-fous que la littérature soutienne réellement.

   ⚠ AUCUNE NOTIFICATION. Ni push, ni rappel, ni relance. Ils sont là QUAND LE
   PILOTE OUVRE ; ils ne vont pas le chercher. C'est la contre-mesure C1 du PRD,
   et son indicateur est « notifications de relance envoyées = 0 » — nommé comme
   le signal d'échec le plus important du dispositif. */

/** Un seul conseil, choisi de façon DÉTERMINISTE à partir de la date.
 *
 *  Déterministe et non aléatoire, pour deux raisons qui tiennent toutes les
 *  deux : deux ouvertures le même jour montrent la même chose — sinon le
 *  produit a l'air de tirer au sort — et rien n'a besoin d'être mémorisé, donc
 *  rien ne se désynchronise entre deux appareils. */
export const conseilDuJour = async (
  db: PowerSyncDatabase, jour: string,
): Promise<string | null> => {
  const l = await db.getAll<{ texte: string }>(
    `SELECT texte FROM conseil WHERE actif <> 0 ORDER BY id`)
  // La base fait autorité dès qu'elle a quelque chose. Sinon le repli embarqué :
  // le référentiel DESCEND par la synchronisation, donc il n'existe pas au
  // premier lancement hors ligne — et c'est précisément là que le conseil doit
  // être présent. Les deux exigences ne s'opposent qu'en apparence (corpus.ts).
  const textes = l.length ? l.map((c) => c.texte) : CONSEILS_EMBARQUES
  if (!textes.length) return null
  const jours = Math.floor(Date.parse(jour + 'T12:00:00Z') / 86_400_000)
  return textes[jours % textes.length]
}

/** Le seuil du récit : quatre sessions saisies. Pas quatre roulages — c'est la
 *  répétition du geste de saisie qui montre que le produit a pris. */
export const SESSIONS_AVANT_INVITE = 4

export type EtatPlan = { texte: string | null; sessions: number; inviter: boolean }

/** L'invite est UNIQUE, jamais récurrente. Trois conditions, et la troisième
 *  est locale : un refus est un état d'affichage, pas une donnée de saison. */
export const etatPlan = async (db: PowerSyncDatabase, jour: string): Promise<EtatPlan> => {
  void jour
  const p = await db.getAll<{ texte: string }>(
    `SELECT texte FROM plan_si_alors ORDER BY id DESC LIMIT 1`)
  const s = await db.get<{ n: number }>(`SELECT count(*) AS n FROM session`)
  return {
    texte: p[0]?.texte ?? null,
    sessions: s.n,
    inviter: !p[0] && s.n >= SESSIONS_AVANT_INVITE && !inviteEcartee(),
  }
}

const CLE_INVITE = 'mypaddock.plan.ecartee'
export const inviteEcartee = (): boolean => {
  try { return localStorage.getItem(CLE_INVITE) === 'oui' } catch { return false }
}
export const ecarterInvite = () => {
  try { localStorage.setItem(CLE_INVITE, 'oui') } catch { /* rien à faire */ }
}

/** Enregistre le plan TEL QU'IL EST ÉCRIT. Le seul nettoyage autorisé est de
 *  retirer les espaces aux extrémités — tout le reste, ponctuation, tournure,
 *  fautes comprises, appartient au pilote et le produit n'y touche pas. */
export const poserPlan = async (db: PowerSyncDatabase, texte: string) => {
  const t = texte.trim()
  if (!t) return null
  const id = nouvelId()
  await db.execute(`INSERT INTO plan_si_alors (id, texte) VALUES (?, ?)`, [id, t])
  return id
}
