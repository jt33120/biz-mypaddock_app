import type { PowerSyncDatabase } from '@powersync/web'
import { jeton, seDeconnecter } from './compte'

/**
 * EFFACER SON COMPTE — NFR-6, FR-27. Le jumeau de l'emport.
 *
 * L'ORDRE EST LA SEULE CHOSE QUI COMPTE VRAIMENT ICI, et il n'est pas
 * réversible : le serveur d'abord, le local ensuite, jamais l'inverse.
 * Effacer le local en premier puis échouer côté serveur laisserait le pilote
 * sans sa saison ET avec son compte — le pire des deux mondes, et un état dont
 * il ne pourrait pas sortir.
 *
 * L'emport est proposé AVANT, et ce n'est pas de la politesse : un produit qui
 * détient la seule copie d'une saison et l'efface sans avoir offert de la rendre
 * se comporte mal, même quand c'est le pilote qui a demandé.
 */

/** Toutes les clés du produit portent le même préfixe. La règle vaut mieux
 *  qu'une liste : une clé ajoutée plus tard sera effacée sans qu'on y pense,
 *  et une liste oubliée laisserait une trace derrière un effacement annoncé. */
const PREFIXE = 'mypaddock.'

export type Issue =
  | { ok: true; objets: number }
  | { ok: false; motif: string; message: string }

const MOTS: Record<string, string> = {
  sans_compte: "Aucun compte n'est ouvert sur ce téléphone. Rien n'a été touché.",
  reseau: "Le serveur est resté injoignable. Le compte est intact, et ce téléphone aussi — "
    + "l'effacement ne se fait pas à moitié.",
  stockage: "Les photos n'ont pas pu être retirées du serveur. Le compte n'a donc pas été "
    + 'supprimé : il ne resterait plus rien pour les désigner.',
  compte: "Le compte n'a pas pu être supprimé. Rien n'a changé sur ce téléphone.",
}
const dire = (motif: string) => MOTS[motif] ?? "L'effacement n'a pas abouti. Rien n'a changé."

/**
 * Les réglages du produit, et EUX SEULS.
 *
 * Par préfixe et non par liste : une clé ajoutée plus tard partira d'elle-même,
 * là où une liste oubliée laisserait une trace derrière un effacement annoncé.
 * Et le filtre n'est pas un détail — `localStorage` est partagé par toute
 * l'origine, donc un `clear()` emporterait ce qui ne nous appartient pas.
 */
export const effacerLesReglages = (): number => {
  let n = 0
  try {
    for (const k of Object.keys(localStorage).filter((k) => k.startsWith(PREFIXE))) {
      localStorage.removeItem(k); n++
    }
  } catch { /* stockage indisponible */ }
  return n
}

/** ÉTAPE 1 — le serveur. Tant qu'elle n'a pas rendu `ok`, rien n'est touché en
 *  local : c'est ce qui rend l'échec sans conséquence. */
export const effacerAuServeur = async (): Promise<Issue> => {
  const base = import.meta.env.VITE_SUPABASE_URL
  if (!base) return { ok: false, motif: 'sans_compte', message: dire('sans_compte') }

  let jwt: string | null = null
  try { jwt = await jeton() } catch { return { ok: false, motif: 'reseau', message: dire('reseau') } }
  if (!jwt) return { ok: false, motif: 'sans_compte', message: dire('sans_compte') }

  let rep: Response
  try {
    rep = await fetch(`${base}/functions/v1/effacer`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    })
  } catch { return { ok: false, motif: 'reseau', message: dire('reseau') } }

  const corps = await rep.json().catch(() => ({}))
  if (!rep.ok || !corps.efface) {
    const motif = corps.refus ?? 'reseau'
    return { ok: false, motif, message: dire(motif) }
  }
  return { ok: true, objets: corps.objets ?? 0 }
}

/** ÉTAPE 2 — ce téléphone. Trois stockages, et aucun n'est facultatif : en
 *  oublier un laisse une trace derrière un effacement annoncé, ce qui est pire
 *  que de ne pas l'avoir annoncé. */
export const effacerLeTelephone = async (
  db: PowerSyncDatabase,
): Promise<{ photos: number; cles: number }> => {
  // ① Les octets des photos, dans l'OPFS. Ils ne sont dans aucune base : rien
  //    d'autre ne les emporterait.
  let photos = 0
  try {
    const racine = await navigator.storage.getDirectory()
    const dossier = await racine.getDirectoryHandle('photos')
    for await (const [nom] of (dossier as unknown as {
      entries: () => AsyncIterable<[string, unknown]>
    }).entries()) { await dossier.removeEntry(nom); photos++ }
  } catch { /* aucun dossier de photos : rien à retirer */ }

  // ② La base locale ET sa file d'envoi. `disconnectAndClear` coupe la
  //    synchronisation avant de vider : sans la coupure, le moteur réécrirait
  //    ce qu'il vient de recevoir.
  try { await db.disconnectAndClear() } catch { /* déjà déconnectée */ }

  // ③ Les réglages.
  const cles = effacerLesReglages()

  await seDeconnecter().catch(() => { /* le compte n'existe déjà plus côté serveur */ })
  return { photos, cles }
}
