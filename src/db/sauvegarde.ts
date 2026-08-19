import type { PowerSyncDatabase } from '@powersync/web'
import { supabase } from './supabase'

/**
 * L'ADOPTION — ce qui a été saisi AVANT le compte ne se perd pas.
 *
 * Le produit s'ouvre et fonctionne sans compte : c'est une règle de fond, pas une
 * tolérance. Un pilote peut donc arriver au compte avec une saison déjà saisie,
 * et cette saison n'appartient encore à personne.
 *
 * ⚠ POURQUOI CE N'EST PAS LA FILE D'ENVOI QUI FAIT LE TRAVAIL. PowerSync tient un
 * JOURNAL DES CHANGEMENTS, et le rejouer suppose que chaque changement était
 * valide au moment où il a eu lieu. Ceux-là ne l'étaient pas : ils désignent un
 * propriétaire qui n'existait pas. Rejouer l'histoire d'un pilote sans compte
 * échouerait à la première ligne et bloquerait la file pour toujours.
 *
 * L'adoption n'est donc PAS un rejeu, c'est une PRISE EN COMPTE DE L'ÉTAT : on
 * envoie ce qui est là, tel qu'il est, sous le nom du pilote qui vient d'arriver.
 * Le journal d'avant est ensuite écarté — il ne décrit le passé de personne.
 *
 * La même fonction sert de sauvegarde manuelle : envoyer l'état, c'est aussi ce
 * qu'on veut quand on appuie sur « sauvegarder ». Un seul chemin, deux usages.
 */

export type BilanEnvoi = Record<string, number>

/** L'ordre est celui des dépendances, et il ne se négocie pas : une session sans
 *  son roulage est refusée par la clé étrangère, pas par une convention. */
const ORDRE = ['machine', 'roulage', 'session', 'tour', 'depense', 'budget_saison', 'intervention', 'mesure'] as const

/** TOUTES les tables de pilote portent leur propriétaire côté serveur, feuilles
 *  comprises, pour que le flux descendant s'écrive à plat et que l'envoi n'ait
 *  aucun cas particulier. Ce n'est pas une contrainte du moteur — les Sync
 *  Streams acceptent les sous-requêtes — c'est une simplification assumée.
 *  Le local, lui, n'en garde aucun : le propriétaire est apposé ici. */
export const PORTE_PROPRIETAIRE: ReadonlySet<string> = new Set<string>(ORDRE)

/** Ce qui est là, avant tout envoi. Sert à montrer au pilote ce que le compte
 *  va reprendre — un chiffre concret vaut mieux qu'une promesse. */
export const etatLocal = async (db: PowerSyncDatabase): Promise<BilanEnvoi> => {
  const etat: BilanEnvoi = {}
  for (const table of ORDRE) {
    const r = await db.get<{ n: number }>(`SELECT count(*) AS n FROM ${table}`)
    if (r.n) etat[table] = r.n
  }
  return etat
}

export const sauvegarder = async (
  db: PowerSyncDatabase,
  piloteId: string,
): Promise<BilanEnvoi> => {
  if (!supabase) throw new Error("Le compte n'est pas configuré.")

  // La ligne du pilote est normalement posée par le déclencheur sur auth.users.
  // On la garantit quand même : sans elle, toutes les clés étrangères tombent,
  // et l'échec serait incompréhensible depuis l'écran.
  const { error: ePilote } = await supabase.from('pilote').upsert({ id: piloteId })
  if (ePilote) throw new Error('pilote : ' + ePilote.message)

  const bilan: BilanEnvoi = {}
  for (const table of ORDRE) {
    const lignes = await db.getAll<Record<string, unknown>>(`SELECT * FROM ${table}`)
    if (!lignes.length) { bilan[table] = 0; continue }

    const charge = lignes.map((l) =>
      PORTE_PROPRIETAIRE.has(table) ? { ...l, pilote_id: piloteId } : l)

    // `upsert` et non `insert` : l'adoption doit pouvoir être relancée sans
    // dupliquer quoi que ce soit. Les identifiants sont des UUID v7 posés par le
    // client (AD-14), donc la même ligne retrouve toujours sa place.
    const { error } = await supabase.from(table).upsert(charge)
    if (error) throw new Error(`${table} : ${error.message}`)
    bilan[table] = charge.length
  }
  return bilan
}

/**
 * Écarter le journal local sans toucher aux données.
 *
 * Appelé une seule fois, juste après une adoption réussie : à cet instant le
 * serveur porte exactement l'état local, donc les changements en attente n'ont
 * plus rien à raconter. Les garder ferait rejouer, sous le nom du pilote, une
 * histoire écrite quand il n'avait pas de nom.
 */
export const ecarterJournal = async (db: PowerSyncDatabase): Promise<number> => {
  let ecartes = 0
  for (;;) {
    const tx = await db.getNextCrudTransaction()
    if (!tx) break
    ecartes += tx.crud.length
    await tx.complete()
  }
  return ecartes
}

/* ─── LE PASSAGE, ET POURQUOI IL EST GARDÉ ─────────────────────────────────
   La synchronisation continue ne doit PAS s'allumer sur une base qui n'a jamais
   été adoptée. Son journal contient alors des changements écrits sans compte,
   qui seraient rejoués tels quels : c'est exactement ce que l'adoption existe
   pour éviter. On retient donc, par pilote, que l'état a déjà été posé une fois
   sur le serveur — après quoi le journal redevient une histoire fiable. */

const CLE_ADOPTE = 'mypaddock.adopte.'

export const estAdopte = (piloteId: string): boolean => {
  try { return localStorage.getItem(CLE_ADOPTE + piloteId) === '1' } catch { return false }
}

const marquerAdopte = (piloteId: string) => {
  try { localStorage.setItem(CLE_ADOPTE + piloteId, '1') } catch { /* rien à faire */ }
}

/** L'adoption complète : poser l'état, écarter le journal d'avant, ouvrir la
 *  voie à la synchronisation continue. Les trois vont ensemble ou pas du tout. */
export const adopter = async (
  db: PowerSyncDatabase,
  piloteId: string,
): Promise<{ bilan: BilanEnvoi; ecartes: number }> => {
  const bilan = await sauvegarder(db, piloteId)
  const ecartes = await ecarterJournal(db)
  marquerAdopte(piloteId)
  return { bilan, ecartes }
}
