import type { PowerSyncDatabase } from '@powersync/web'
import { nouvelId } from './ids'
import { supabase } from './supabase'
import { marquerSaisie } from './mesures'

/**
 * LA PHOTO — récit 3.1.
 *
 * ⚠ LEVÉE D'AMBIGUÏTÉ. NFR-5 interdit « les Storage Buckets ». Le motif cité —
 * « absent de tous les Safari » — ne peut viser qu'une API DE NAVIGATEUR :
 * `navigator.storageBuckets`. Il ne vise PAS Supabase Storage, que l'épine
 * nomme trois fois comme le lieu de vie des photos. Lire NFR-5 comme une
 * interdiction du stockage objet ferait refaire toute cette couche pour rien.
 *
 * DEUX CHEMINS D'ÉCRITURE, distincts et assumés :
 *   · la LIGNE part en SQLite local puis PowerSync, comme tout le reste (AD-4)
 *   · les OCTETS partent en HTTP direct vers le stockage, hors synchronisation
 *
 * Ils sont désynchronisables par nature. C'est pour ça que la photo s'affiche
 * TOUJOURS depuis sa copie locale : une photo « en attente d'envoi » ne peut
 * pas être une photo absente à l'écran (FR-10, NFR-7).
 */

/** Le côté long après réduction. 1600 px suffit à un fond de récapitulatif et
 *  garde la surface du canevas à 2,6 Mpx — six fois sous le plafond de Safari. */
export const COTE_LONG = 1600

/**
 * LES DIMENSIONS SE LISENT DANS L'EN-TÊTE, sans décoder.
 *
 * C'est la clé de la sûreté iOS. Une photo d'iPhone récent fait 48 Mpx ; la
 * décoder pour connaître sa taille fait exploser la mémoire du process
 * WebContent avant même qu'on ait pu la réduire. On lit donc le marqueur SOF du
 * JPEG ou l'IHDR du PNG sur les premiers kilo-octets, et on ne décode qu'une
 * fois, déjà réduit.
 */
export const dimensions = async (blob: Blob): Promise<{ w: number; h: number } | null> => {
  const t = new Uint8Array(await blob.slice(0, 128 * 1024).arrayBuffer())
  const u16 = (i: number) => (t[i] << 8) | t[i + 1]
  const u32 = (i: number) => (t[i] << 24) | (t[i + 1] << 16) | (t[i + 2] << 8) | t[i + 3]
  if (t[0] === 0x89 && t[1] === 0x50) return { w: u32(16), h: u32(20) }
  if (t[0] === 0xff && t[1] === 0xd8) {
    let i = 2
    while (i < t.length - 9) {
      if (t[i] !== 0xff) { i++; continue }
      const m = t[i + 1]
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
        return { w: u16(i + 7), h: u16(i + 5) }
      if (m === 0xd8 || (m >= 0xd0 && m <= 0xd9)) { i += 2; continue }
      i += 2 + u16(i + 2)
    }
  }
  return null
}

export type Reduite = { blob: Blob; largeur: number; hauteur: number; extension: string }

/**
 * Réduire AVANT tout `drawImage`. Au-delà de 16 777 216 px de surface, Safari
 * refuse le canevas et L'ONGLET MEURT — sans erreur rattrapable. Une photo de
 * 48 Mpx est le cas normal, pas le cas limite.
 *
 * `imageOrientation: 'from-image'` applique l'EXIF au décodage : sans lui, les
 * photos portrait d'iPhone arrivent couchées.
 */
export const reduire = async (fichier: Blob, cote = COTE_LONG): Promise<Reduite> => {
  const d = await dimensions(fichier)
  const ech = d ? Math.min(1, cote / Math.max(d.w, d.h)) : 1
  const w = d ? Math.max(1, Math.round(d.w * ech)) : cote
  const h = d ? Math.max(1, Math.round(d.h * ech)) : cote

  const bitmap = await createImageBitmap(fichier, {
    resizeWidth: w, resizeHeight: h, resizeQuality: 'high', imageOrientation: 'from-image',
  })
  const c = document.createElement('canvas')
  c.width = bitmap.width; c.height = bitmap.height
  c.getContext('2d')!.drawImage(bitmap, 0, 0)
  bitmap.close()

  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/webp', 0.82))
  if (!blob) throw new Error("L'image n'a pas pu être encodée.")
  // AD-13 : `blob.type` SE VÉRIFIE APRÈS COUP. Le format demandé peut être
  // ignoré en silence, et on se retrouverait à écrire du PNG sous un nom .webp.
  const extension = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg'
  return { blob, largeur: c.width, hauteur: c.height, extension }
}

/* ─── LA COPIE LOCALE — dans l'OPFS, protégé par persist() ─────────────────
   §5.1 : les photos de la journée sont ce que le produit ne peut pas se
   permettre de perdre entre le paddock et le retour du réseau. Elles ne peuvent
   donc pas vivre en mémoire, ni dans une URL d'objet sur un `File` volatil, ni
   dans une file de requêtes de Service Worker — AD-4 l'interdit explicitement. */

const dossierPhotos = async () => {
  const racine = await navigator.storage.getDirectory()
  return racine.getDirectoryHandle('photos', { create: true })
}

export const ecrireLocale = async (nom: string, blob: Blob) => {
  const dossier = await dossierPhotos()
  const h = await dossier.getFileHandle(nom, { create: true })
  const w = await h.createWritable()
  await w.write(blob)
  await w.close()
}

export const lireLocale = async (nom: string): Promise<File | null> => {
  try {
    const dossier = await dossierPhotos()
    return await (await dossier.getFileHandle(nom)).getFile()
  } catch { return null }
}

export const effacerLocale = async (nom: string) => {
  try { (await dossierPhotos()).removeEntry(nom) } catch { /* déjà partie */ }
}

/* ─── LE MODÈLE ────────────────────────────────────────────────────────────── */

/** La photo MONTRE un état, la facture PROUVE une dépense. Julian les a nommées
 *  séparément et elles ne servent pas à la même chose — les confondre ferait
 *  annoncer « 3 preuves » là où il y a trois clichés du même disque. */
export type Genre = 'photo' | 'facture'

export type Photo = {
  id: string
  /** L'un des trois est renseigné, jamais aucun : une photo appartient à une
   *  journée, à une moto, ou à un geste d'atelier. Tenu côté serveur. */
  roulage_id: string | null
  machine_id: string | null
  intervention_id: string | null
  geste_id: string | null
  chemin_objet: string
  largeur: number | null
  hauteur: number | null
  etat: 'locale' | 'montee'
  genre: Genre
}

/** Le nom du fichier local se dérive de l'identifiant, donc il est connu avant
 *  tout réseau — le téléversement différé est idempotent et rejouable (AD-14). */
export const nomLocal = (p: Pick<Photo, 'id' | 'chemin_objet'>) =>
  `${p.id}.${p.chemin_objet.split('.').pop()}`

/** Le porteur d'une photo : une journée, ou une moto. Pas les deux à moitié.
 *  ⚠ Le type est un OBJET et non deux chaînes positionnelles, précisément parce
 *  qu'un identifiant de machine était passé là où un identifiant de roulage
 *  était attendu — deux `string` se confondent, deux clés nommées non. */
export type Porteur =
  | { roulageId: string; machineId?: null; interventionId?: null }
  | { machineId: string; roulageId?: null; interventionId?: null }
  | { interventionId: string; roulageId?: null; machineId?: null }

export const verserPhoto = async (
  db: PowerSyncDatabase, porteur: Porteur, fichier: Blob, genre: Genre = 'photo',
): Promise<Photo> => {
  const roulageId = porteur.roulageId ?? null
  const machineId = porteur.machineId ?? null
  const interventionId = porteur.interventionId ?? null
  const r = await reduire(fichier)
  const id = nouvelId()
  // Le chemin porte le pilote en PREMIER SEGMENT : c'est ce que la politique du
  // bucket compare à auth.uid(). Il est posé à `local` tant qu'aucun compte
  // n'existe, et réécrit au moment du téléversement — comme le propriétaire
  // d'une ligne, qui est une conséquence du compte et non une donnée locale.
  const chemin = `local/${roulageId ?? machineId ?? interventionId}/${id}.${r.extension}`
  await ecrireLocale(`${id}.${r.extension}`, r.blob)
  await db.execute(
    `INSERT INTO photo
       (id, roulage_id, machine_id, intervention_id, chemin_objet, largeur, hauteur, etat, genre)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'locale', ?)`,
    [id, roulageId, machineId, interventionId, chemin, r.largeur, r.hauteur, genre])
  await marquerSaisie(db)
  return {
    id, roulage_id: roulageId, machine_id: machineId, intervention_id: interventionId,
    geste_id: null, chemin_objet: chemin, largeur: r.largeur, hauteur: r.hauteur,
    etat: 'locale', genre,
  }
}

/** Les pièces d'un geste d'atelier — photos et factures, dans l'ordre d'écriture
 *  (donc chronologique, l'UUID v7 portant l'instant, AD-14). */
export const piecesDeLIntervention = (db: PowerSyncDatabase, interventionId: string) =>
  db.getAll<Photo>(
    `SELECT id, roulage_id, machine_id, intervention_id, geste_id, chemin_objet,
            largeur, hauteur, etat, genre
       FROM photo WHERE intervention_id = ? ORDER BY id`, [interventionId])

/**
 * LA PHOTO DE LA MACHINE — récit 3bis.3.
 *
 * Elle suit exactement le chemin de la photo de roulage : réduite, écrite en
 * local d'abord, référencée ensuite. Ce qui change est où elle se range — sur la
 * machine, parce que c'est la machine qui a un portrait, pas la journée.
 *
 * Elle EXISTE INDÉPENDAMMENT DU SPRITE, et c'est tout l'objet : le pixel est une
 * présentation. Refuser un rendu retire le sprite et ne touche pas à la photo.
 */
export const nomLocalMachine = (machineId: string, extension: string) =>
  `machine-${machineId}.${extension}`

export const verserPhotoMachine = async (
  db: PowerSyncDatabase, machineId: string, fichier: Blob,
): Promise<string> => {
  const r = await reduire(fichier)
  const nom = nomLocalMachine(machineId, r.extension)
  await ecrireLocale(nom, r.blob)
  // Le chemin porte le pilote en premier segment, comme toute photo : c'est ce
  // que la politique du stockage compare à auth.uid(). Il est posé à `local`
  // tant qu'aucun compte n'existe, et réécrit au téléversement.
  const chemin = `local/machine/${machineId}.${r.extension}`
  await db.execute(`UPDATE machine SET photo_chemin = ? WHERE id = ?`, [chemin, machineId])
  await marquerSaisie(db)
  return chemin
}

/** La photo de machine telle qu'elle est sur ce téléphone. `null` est un état
 *  valide — la machine existe sans portrait (AD-2), et le garage montre alors
 *  sa silhouette plutôt que d'exiger un média. */
export const photoMachine = async (chemin: string | null): Promise<File | null> => {
  if (!chemin) return null
  const m = chemin.match(/machine\/([^/]+)\.(\w+)$/)
  return m ? lireLocale(nomLocalMachine(m[1], m[2])) : null
}

export const photosDuRoulage = (db: PowerSyncDatabase, roulageId: string) =>
  db.getAll<Photo>(
    `SELECT id, roulage_id, machine_id, intervention_id, geste_id, chemin_objet,
            largeur, hauteur, etat, genre
       FROM photo WHERE roulage_id = ? ORDER BY id`, [roulageId])

/* ─── LE TÉLÉVERSEMENT DIFFÉRÉ ─────────────────────────────────────────────
   AD-6 : DEUX DÉCLENCHEURS EXACTEMENT — le retour au premier plan et le retour
   de connectivité. Rien d'autre : sur iOS rien ne s'exécute pendant que
   l'application est fermée, WebKit a refusé Background Sync et n'a jamais
   implémenté Background Fetch. Un téléversement interrompu reprend à la
   prochaine ouverture, pas avant. */

export const televerserEnAttente = async (
  db: PowerSyncDatabase, piloteId: string,
): Promise<number> => {
  if (!supabase || !navigator.onLine) return 0
  const l = await db.getAll<Photo>(
    `SELECT id, roulage_id, machine_id, intervention_id, geste_id, chemin_objet,
            largeur, hauteur, etat, genre
       FROM photo WHERE etat = 'locale'`)
  let montees = 0
  for (const p of l) {
    const f = await lireLocale(nomLocal(p))
    if (!f) continue
    // ⚠ LE DEUXIÈME SEGMENT EST LE PORTEUR RÉEL, pas `roulage_id` en dur.
    // Une photo de machine ou de geste d'atelier a un `roulage_id` nul : le
    // chemin composé valait littéralement `pilote/null/xxx.webp`. Ce n'était
    // pas bloquant — la politique du bucket ne compare que le PREMIER segment
    // à auth.uid(), et le nom de fichier porte déjà l'UUID — mais toutes les
    // photos hors roulage finissaient dans un même dossier nommé « null »,
    // c'est-à-dire dans un rangement qui ment. Un chemin qui ment se paie au
    // premier ménage : c'est le genre de dossier qu'on supprime en le croyant
    // vide de sens.
    const porteur = p.roulage_id ?? p.machine_id ?? p.intervention_id ?? 'sans-porteur'
    const chemin = `${piloteId}/${porteur}/${nomLocal(p)}`
    const { error } = await supabase.storage.from('photos')
      .upload(chemin, f, { upsert: true, contentType: f.type || 'image/webp' })
    if (error) continue      // on retentera : ce n'est pas une perte, c'est un report
    await db.execute(`UPDATE photo SET etat = 'montee', chemin_objet = ? WHERE id = ?`,
      [chemin, p.id])
    montees++
  }
  return montees
}

/** Les deux seuls déclencheurs, posés une fois. Rend de quoi les retirer. */
export const surRetourDeReseau = (relancer: () => void): (() => void) => {
  const visible = () => { if (document.visibilityState === 'visible') relancer() }
  document.addEventListener('visibilitychange', visible)
  window.addEventListener('online', relancer)
  return () => {
    document.removeEventListener('visibilitychange', visible)
    window.removeEventListener('online', relancer)
  }
}
