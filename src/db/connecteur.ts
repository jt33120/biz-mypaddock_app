import { UpdateType, type PowerSyncBackendConnector } from '@powersync/web'
import { supabase } from './supabase'
import { jeton } from './compte'
import { PORTE_PROPRIETAIRE } from './sauvegarde'

/**
 * LE CONNECTEUR — ce qui relie la base locale au compte.
 *
 * Deux devoirs, et c'est tout : dire au service de synchronisation qui parle
 * (`fetchCredentials`), et pousser les changements locaux vers Supabase
 * (`uploadData`). La descente, elle, ne passe pas par ici : elle est décrite par
 * les règles de synchronisation, côté service.
 */

export const POWERSYNC_URL = (import.meta.env.VITE_POWERSYNC_URL ?? '').trim()
export const powersyncConfigure = POWERSYNC_URL.length > 0

/** `23503` n'est PAS définitif dans une file hors ligne : la ligne référencée
 * peut être dans la transaction précédente, encore en route depuis un autre
 * appareil, ou créée plus tôt dans la transaction que l'on va rejouer. Le
 * classer avec les autres contraintes produisait des feuilles orphelines. */
export const erreurDefinitive = (code?: string) =>
  !!code && code !== '23503'
  && (code.startsWith('22') || code.startsWith('23') || code.startsWith('42') || code === 'PGRST204')

export type Incident = { table: string; op: string; message: string }

type OperationCrud = {
  table: string
  op: UpdateType
  opData?: Record<string, unknown> | null
  id: string
}

type TransactionCrud = {
  crud: readonly OperationCrud[]
  complete: () => Promise<void>
}

type ErreurEnvoi = { code?: string; message: string }

/** Envoie une transaction locale sans prétendre la transformer en transaction
 * HTTP. Sur une FK encore absente, RIEN n'est acquitté : le SDK rendra la même
 * transaction, et les PUT déjà réussis convergent par `upsert` sans doublon. */
export const envoyerTransaction = async (
  piloteId: string,
  tx: TransactionCrud,
  executer: (
    op: OperationCrud, donnees: Record<string, unknown>,
  ) => Promise<{ error: ErreurEnvoi | null }>,
  surIncident?: (i: Incident) => void,
): Promise<void> => {
  for (const op of tx.crud) {
    const proprio = PORTE_PROPRIETAIRE.has(op.table) ? { pilote_id: piloteId } : {}
    const donnees = op.op === UpdateType.PUT
      ? { ...(op.opData ?? {}), ...proprio, id: op.id }
      : { ...(op.opData ?? {}), ...proprio }
    const { error } = await executer(op, donnees)
    if (!error) continue

    if (erreurDefinitive(error.code)) {
      // Écarter et le dire. Perdre une ligne en silence serait pire que la perdre.
      surIncident?.({ table: op.table, op: op.op, message: error.message })
      continue
    }
    // Pas d'acquittement : toute la transaction sera rejouée. Les upserts déjà
    // réussis sont idempotents, contrairement à une reprise à mi-chemin.
    throw new Error(`${op.table} : ${error.message}`)
  }
  await tx.complete()
}

export const creerConnecteur = (
  piloteId: string,
  surIncident?: (i: Incident) => void,
): PowerSyncBackendConnector => ({
  /** Toujours frais, jamais mis en cache — la consigne du SDK. `null` veut dire
   *  « pas de compte » ; une erreur levée veut dire « réessaie ». Confondre les
   *  deux couperait la synchronisation d'un pilote qui traverse un tunnel. */
  fetchCredentials: async () => {
    const t = await jeton()
    return t ? { endpoint: POWERSYNC_URL, token: t } : null
  },

  uploadData: async (db) => {
    if (!supabase) return
    const client = supabase
    const tx = await db.getNextCrudTransaction()
    if (!tx) return

    await envoyerTransaction(piloteId, tx, async (op, donnees) => {
      const table = client.from(op.table)
      return op.op === UpdateType.PUT
        ? await table.upsert(donnees)
        : op.op === UpdateType.PATCH
          ? await table.update(donnees).eq('id', op.id)
          : await table.delete().eq('id', op.id)
    }, surIncident)
  },
})
