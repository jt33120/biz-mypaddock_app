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

/** Codes Postgres dont un réessai ne changera jamais l'issue : contrainte violée,
 *  donnée mal typée, droit refusé. Les rejouer indéfiniment bloquerait la file
 *  derrière une ligne qui ne passera pas — c'est ainsi qu'une synchronisation
 *  meurt en silence. On les écarte, en le disant. */
const DEFINITIF = (code?: string) =>
  !!code && (code.startsWith('22') || code.startsWith('23') || code.startsWith('42') || code === 'PGRST204')

export type Incident = { table: string; op: string; message: string }

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
    const tx = await db.getNextCrudTransaction()
    if (!tx) return

    for (const op of tx.crud) {
      // Le propriétaire est apposé ICI, au moment de l'envoi, parce qu'il n'existe
      // pas en local (voir schema.ts). C'est aussi la seule barrière utile : RLS
      // refuserait de toute façon une ligne portant le nom d'un autre.
      const proprio = PORTE_PROPRIETAIRE.has(op.table) ? { pilote_id: piloteId } : {}
      const table = supabase.from(op.table)

      const { error } =
        op.op === UpdateType.PUT
          ? await table.upsert({ ...op.opData, ...proprio, id: op.id })
          : op.op === UpdateType.PATCH
            ? await table.update({ ...op.opData, ...proprio }).eq('id', op.id)
            : await table.delete().eq('id', op.id)

      if (!error) continue

      if (DEFINITIF(error.code)) {
        // Écarter et le dire. Perdre une ligne en silence serait pire que la perdre.
        surIncident?.({ table: op.table, op: op.op, message: error.message })
        continue
      }
      // Panne passagère : on laisse la transaction en place, le SDK réessaiera.
      throw new Error(`${op.table} : ${error.message}`)
    }

    await tx.complete()
  },
})
