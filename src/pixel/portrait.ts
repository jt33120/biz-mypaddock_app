import type { PowerSyncDatabase } from '@powersync/web'
import { jeton } from '../db/compte'
import { reduire } from '../db/photos'
import { spritifier, type Sprite } from './spritifier'
import { GRILLE } from './reglages'

/**
 * LE PORTRAIT DE JEU — l'orchestration côté application, récit 3bis.3.
 *
 * Deux moitiés, et elles n'ont ni le même coût ni les mêmes règles :
 *
 *   · LA MOITIÉ PAYANTE part au serveur. La clé n'existe pas ici (AD-15), le
 *     prompt non plus, et le quota se compte là-bas. L'application ne peut
 *     littéralement pas dépenser toute seule.
 *   · LA MOITIÉ GRATUITE reste ici : la spritification est déterministe, tourne
 *     hors ligne et se rejoue sans un centime. C'est elle qui transforme une
 *     apparence de pixel art en vrai sprite — le modèle rend un look, pas une
 *     structure.
 *
 * La GRILLE vient de la réponse du serveur, jamais de la constante locale : le
 * prompt et la spritification doivent travailler sur la même, et deux constantes
 * égales dans deux dépôts finissent toujours par diverger.
 */

/** Le côté long envoyé au modèle. La réponse le confirme ; c'est un repli. */
const COTE_MODELE = 1024

export type Issue =
  | { ok: true; sprite: Sprite; reste: number; version: string }
  | { ok: false; motif: string; message: string; reste?: number }

/** Chaque refus dit CE QUI S'EST PASSÉ et ce qui reste possible. Aucun ne
 *  reproche, aucun n'emploie l'impératif (FR-13), et aucun ne laisse croire que
 *  la machine ou la photo aurait été perdue — elles ne le sont jamais. */
const MOTS: Record<string, string> = {
  sans_compte: "Le portrait se fabrique sur le serveur, donc il demande un compte. "
    + 'La photo, elle, reste sur ce téléphone et ne dépend de rien.',
  quota: 'Le nombre de portraits inclus est atteint pour ce compte. '
    + 'La photo réelle continue de tenir la scène du garage.',
  cle_absente: "La fabrique de portraits n'est pas encore ouverte. "
    + 'Rien n\'a été facturé, et la photo reste en place.',
  photo_trop_lourde: "Cette image est trop lourde pour partir. "
    + 'Une photo prise au téléphone passe sans difficulté.',
  sans_photo: "Aucune image n'est partie.",
  modele: "Le modèle d'image n'a rien rendu cette fois. Rien n'a été décompté.",
  aucune_image: "Le modèle n'a rendu aucune image. Rien n'a été décompté.",
  reseau: 'Le serveur est resté injoignable. Rien n\'a été décompté, et la photo est intacte.',
  spritification: "L'image est revenue mais n'a pas pu être détachée de son fond.",
}
const dire = (motif: string) => MOTS[motif] ?? "La fabrique de portraits n'a pas abouti."

export const genererPortrait = async (
  _db: PowerSyncDatabase, machineId: string, photo: Blob, piloteEnSelle = false,
): Promise<Issue> => {
  const base = import.meta.env.VITE_SUPABASE_URL
  if (!base) return { ok: false, motif: 'sans_compte', message: dire('sans_compte') }

  let jwt: string | null = null
  try { jwt = await jeton() } catch { /* hors ligne : traité comme un réseau absent */ }
  if (!jwt) return { ok: false, motif: 'sans_compte', message: dire('sans_compte') }

  // La photo part RÉDUITE. Le modèle n'a pas besoin de 48 Mpx pour reconnaître
  // une moto, et les jetons d'image se paient.
  const r = await reduire(photo, COTE_MODELE)
  const b64 = await new Promise<string>((res, rej) => {
    const l = new FileReader()
    l.onload = () => res((l.result as string).replace(/^data:[^,]+,/, ''))
    l.onerror = () => rej(l.error ?? new Error('lecture impossible'))
    l.readAsDataURL(r.blob)
  })

  let rep: Response
  try {
    rep = await fetch(`${base}/functions/v1/sprite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo: b64, machineId, piloteEnSelle }),
    })
  } catch { return { ok: false, motif: 'reseau', message: dire('reseau') } }

  const corps = await rep.json().catch(() => ({}))
  if (!rep.ok || !corps.image) {
    const motif = corps.refus ?? 'reseau'
    return { ok: false, motif, message: dire(motif), reste: corps.reste }
  }

  // La moitié gratuite. Un échec ici ne rend PAS le quota — l'image a bien été
  // produite et payée. Le dire est plus honnête que de laisser croire l'inverse.
  try {
    const octets = await (await fetch(corps.image)).blob()
    const sprite = await spritifier(octets, corps.grille ?? GRILLE)
    return { ok: true, sprite, reste: corps.reste ?? 0, version: corps.version ?? '?' }
  } catch {
    return { ok: false, motif: 'spritification', message: dire('spritification'), reste: corps.reste }
  }
}

/** Ce qui reste au compte, lu depuis les lignes descendues. Le serveur reste
 *  l'autorité — ceci ne sert qu'à ANNONCER, jamais à autoriser. */
export const portraitsRestants = async (
  db: PowerSyncDatabase, quota: number,
): Promise<number> => {
  const r = await db.get<{ n: number }>(`SELECT count(*) AS n FROM generation`)
  return Math.max(0, quota - (r.n ?? 0))
}
