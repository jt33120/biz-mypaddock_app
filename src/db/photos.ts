import type { PowerSyncDatabase } from '@powersync/web'
import { nouvelId } from './ids'
import { supabase } from './supabase'
import { marquerSaisie } from './mesures'
import { ecrireLocale, effacerLocale, lireLocale } from './coffre'

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

/* ─── LA COPIE LOCALE — dans le coffre, protégé par persist() ───────────────
   §5.1 : les photos de la journée sont ce que le produit ne peut pas se
   permettre de perdre entre le paddock et le retour du réseau. Elles ne peuvent
   donc pas vivre en mémoire, ni dans une URL d'objet sur un `File` volatil, ni
   dans une file de requêtes de Service Worker — AD-4 l'interdit explicitement.

   ⚠ CES TROIS FONCTIONS ONT DÉMÉNAGÉ DANS `coffre.ts`, ET CE N'EST PAS UN
   RANGEMENT DE CONFORT. Elles écrivaient par `createWritable()`, absent de tout
   Safari antérieur à la 26 : sur iOS 18 l'appel levait un TypeError et AUCUNE
   photo, AUCUN document ne pouvait être versé — la base de production en
   comptait zéro depuis le premier jour. Le coffre choisit son magasin par
   capacité éprouvée et relit dans les deux ; le raisonnement complet est là-bas.
   Elles restent exposées ici parce que tout le produit les appelle par ce
   chemin, et qu'un deuxième chemin vers le stockage ramènerait le défaut. */

export { ecrireLocale, effacerLocale, lireLocale }

/* ─── LE MODÈLE ────────────────────────────────────────────────────────────── */

/** La photo MONTRE un état, la facture PROUVE une dépense. Julian les a nommées
 *  séparément et elles ne servent pas à la même chose — les confondre ferait
 *  annoncer « 3 preuves » là où il y a trois clichés du même disque. */
export type Genre = 'photo' | 'facture'

export type Photo = {
  id: string
  /** Au moins un porteur est renseigné. Une photo de crash garde aussi son
   *  roulage : retirer le récit du crash ne doit ni détruire la preuve, ni la
   *  laisser sans porteur côté serveur. */
  roulage_id: string | null
  machine_id: string | null
  intervention_id: string | null
  chute_id: string | null
  geste_id: string | null
  chemin_objet: string
  largeur: number | null
  hauteur: number | null
  /** `a_supprimer` est un tombstone synchronisé : la photo disparaît des
   * lectures tout de suite, mais son chemin reste disponible tant que Storage
   * n'a pas confirmé le retrait. */
  etat: 'locale' | 'montee' | 'a_supprimer'
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
  | { roulageId: string; machineId?: null; interventionId?: null; chuteId?: null }
  | { machineId: string; roulageId?: null; interventionId?: null; chuteId?: null }
  | { interventionId: string; roulageId?: null; machineId?: null; chuteId?: null }
  | { chuteId: string; roulageId?: null; machineId?: null; interventionId?: null }

export const verserPhoto = async (
  db: PowerSyncDatabase, porteur: Porteur, fichier: Blob, genre: Genre = 'photo',
): Promise<Photo> => {
  const chuteId = porteur.chuteId ?? null
  let roulageId = porteur.roulageId ?? null
  const machineId = porteur.machineId ?? null
  const interventionId = porteur.interventionId ?? null
  if (chuteId) {
    const chute = await db.getOptional<{ roulage_id: string }>(
      `SELECT roulage_id FROM chute WHERE id = ?`, [chuteId])
    if (!chute) throw new Error('Ce crash est introuvable.')
    // Une photo de crash reste une photo de la journée. Ce second lien rend
    // vraie la promesse « retirer le crash ne détruit pas sa photo » tout en
    // respectant la contrainte serveur qui refuse une photo sans porteur.
    roulageId = chute.roulage_id
  }
  const r = await reduire(fichier)
  const id = nouvelId()
  // Le chemin porte le pilote en PREMIER SEGMENT : c'est ce que la politique du
  // bucket compare à auth.uid(). Il est posé à `local` tant qu'aucun compte
  // n'existe, et réécrit au moment du téléversement — comme le propriétaire
  // d'une ligne, qui est une conséquence du compte et non une donnée locale.
  const chemin = `local/${chuteId ?? roulageId ?? machineId ?? interventionId}/${id}.${r.extension}`
  await ecrireLocale(`${id}.${r.extension}`, r.blob)
  await db.execute(
    `INSERT INTO photo
       (id, roulage_id, machine_id, intervention_id, chute_id,
        chemin_objet, largeur, hauteur, etat, genre)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'locale', ?)`,
    [id, roulageId, machineId, interventionId, chuteId,
      chemin, r.largeur, r.hauteur, genre])
  await marquerSaisie(db)
  return {
    id, roulage_id: roulageId, machine_id: machineId, intervention_id: interventionId,
    chute_id: chuteId, geste_id: null, chemin_objet: chemin,
    largeur: r.largeur, hauteur: r.hauteur,
    etat: 'locale', genre,
  }
}

/** Les pièces d'un geste d'atelier — photos et factures, dans l'ordre d'écriture
 *  (donc chronologique, l'UUID v7 portant l'instant, AD-14). */
export const piecesDeLIntervention = (db: PowerSyncDatabase, interventionId: string) =>
  db.getAll<Photo>(
    `SELECT id, roulage_id, machine_id, intervention_id, chute_id, geste_id, chemin_objet,
            largeur, hauteur, etat, genre
       FROM photo WHERE intervention_id = ? AND etat != 'a_supprimer' ORDER BY id`,
    [interventionId])

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

/**
 * LA PHOTO D'UN ÉQUIPEMENT — « la combinaison c'est comme un skin, et le casque
 * aussi, c'est à pixeliser ! ».
 *
 * Elle suit EXACTEMENT le chemin de la photo de machine : réduite, écrite en
 * local d'abord, référencée ensuite, et indépendante du sprite. Le préfixe du
 * nom local diffère pour que les deux ne se marchent jamais dessus — un casque
 * et une moto peuvent partager un identifiant si l'un vient d'un import.
 */
export const nomLocalEquipement = (id: string, extension: string) =>
  `equipement-${id}.${extension}`

export const verserPhotoEquipement = async (
  db: PowerSyncDatabase, equipementId: string, fichier: Blob,
): Promise<string> => {
  const r = await reduire(fichier)
  const nom = nomLocalEquipement(equipementId, r.extension)
  await ecrireLocale(nom, r.blob)
  const chemin = `local/equipement/${equipementId}.${r.extension}`
  await db.execute(`UPDATE equipement SET photo_chemin = ? WHERE id = ?`, [chemin, equipementId])
  await marquerSaisie(db)
  return chemin
}

export const photoEquipement = async (chemin: string | null): Promise<File | null> => {
  if (!chemin) return null
  const m = chemin.match(/equipement\/([^/]+)\.(\w+)$/)
  return m ? lireLocale(nomLocalEquipement(m[1], m[2])) : null
}

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

/**
 * LES CLICHÉS D'UNE JOURNÉE — et RIEN QUE LES CLICHÉS.
 *
 * ⚠ LE GENRE EST DANS LA REQUÊTE, PAS À L'ÉCRAN. « La photo MONTRE un état, la
 * facture PROUVE une dépense » : une facture d'atelier versée sur la même
 * journée n'a rien à faire dans l'album, et la filtrer côté rendu laisserait la
 * porte ouverte au prochain lecteur qui appellerait cette fonction sans y
 * penser. C'est la même règle, et pour la même raison, que
 * `lignesDuChargement` (src/db/checklist.ts).
 *
 * L'ordre est celui de l'IDENTIFIANT, qui est monotone dans le temps
 * (`nouvelId`) : l'album se lit donc dans l'ordre où les photos ont été prises.
 */
export const photosDuRoulage = (db: PowerSyncDatabase, roulageId: string) =>
  db.getAll<Photo>(
    `SELECT id, roulage_id, machine_id, intervention_id, chute_id, geste_id, chemin_objet,
            largeur, hauteur, etat, genre
       FROM photo
      WHERE roulage_id = ? AND genre = 'photo' AND etat != 'a_supprimer'
      ORDER BY id`, [roulageId])

/** Les clichés attachés à un crash. Ils ont aussi `roulage_id`, afin de rester
 * lisibles dans l'album si le récit du crash est retiré. */
export const photosDeLaChute = (db: PowerSyncDatabase, chuteId: string) =>
  db.getAll<Photo>(
    `SELECT id, roulage_id, machine_id, intervention_id, chute_id, geste_id, chemin_objet,
            largeur, hauteur, etat, genre
       FROM photo
      WHERE chute_id = ? AND genre = 'photo' AND etat != 'a_supprimer'
      ORDER BY id`, [chuteId])

/** Lit d'abord le coffre hors ligne. Sur un second appareil, une métadonnée
 * synchronisée peut désigner un objet déjà monté sans avoir encore ses octets :
 * on le télécharge alors une fois et on le remet dans le même coffre local. */
export const lirePhoto = async (p: Photo): Promise<File | null> => {
  if (p.etat === 'a_supprimer') return null
  const nom = nomLocal(p)
  const locale = await lireLocale(nom)
  if (locale) return locale
  if (!supabase || p.etat !== 'montee' || p.chemin_objet.startsWith('local/')) return null
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null
  if (!envoiCloudActif()) return null
  const { data, error } = await supabase.storage.from('photos').download(p.chemin_objet)
  if (error || !data) return null
  // Le cache est un gain hors ligne, pas une condition de lecture : un WebView
  // qui refuse ses deux magasins doit quand même pouvoir montrer l'objet reçu.
  try { await ecrireLocale(nom, data) } catch { /* lisible maintenant, non cachée */ }
  return new File([data], nom, { type: data.type || 'image/webp' })
}


/**
 * VERSER PLUSIEURS PHOTOS D'UN COUP — récit 18.3.
 *
 * ⚠ EN SÉRIE, ET C'EST UNE CONTRAINTE DE SURVIE, PAS DE STYLE. `reduire` alloue
 * un canevas de 1600 px et décode une image de 48 Mpx : dix en vol tuent
 * l'onglet WebContent, sans erreur rattrapable et sans qu'on puisse le
 * reprendre. C'est le même mur que celui qui impose de lire les dimensions dans
 * l'en-tête plutôt que de décoder — il est simplement atteint par un autre
 * chemin. `Promise.all` sur ce tableau serait la faute exacte.
 *
 * ⚠ ET CE QUI EST VERSÉ RESTE VERSÉ. Si la neuvième échoue, les huit premières
 * ne sont pas rejouées, pas annulées, pas perdues : le rappel `surChacune` les a
 * déjà rendues à l'écran une par une. Une file qui recommencerait à zéro sur un
 * échec redemanderait à un pilote de re-choisir dix photos sur un téléphone, au
 * paddock — ce qu'il ne fera pas.
 *
 * ⚠ AUCUN COMPTEUR. Pas de « 4 sur 10 », pas de barre. Ce qui est versé
 * apparaît ; ce qui reste ne se compte pas. Un compteur transforme un versement
 * en attente à surveiller, et c'est exactement ce que le produit s'interdit
 * partout ailleurs.
 */
export type Echec = { nom: string; motif: string }

/** Le noyau déterministe du lot. Une relecture d'écran qui échoue APRÈS
 * `verser` ne transforme jamais une photo déjà écrite en échec de versement :
 * sinon l'UI la reproposerait et fabriquerait un doublon. */
export const verserEnSerie = async <F extends { name?: string }, P>(
  fichiers: readonly F[],
  verser: (fichier: F) => Promise<P>,
  surChacune?: (photo: P) => void | Promise<void>,
  surAffichageEnRetard?: (photo: P) => void | Promise<void>,
): Promise<Echec[]> => {
  const echecs: Echec[] = []
  for (const f of fichiers) {
    let photo: P
    try {
      photo = await verser(f)
    } catch (e) {
      echecs.push({ nom: f.name || 'une photo', motif: (e as Error).message })
      continue
    }
    try {
      await surChacune?.(photo)
    } catch {
      // Le fait est déjà écrit. Le signal est séparé et lui-même best-effort :
      // aucune panne de rendu ne doit remonter dans la file de versement.
      try { await surAffichageEnRetard?.(photo) } catch { /* affichage seulement */ }
    }
  }
  return echecs
}

export const verserPlusieurs = async (
  db: PowerSyncDatabase,
  porteur: Porteur,
  fichiers: readonly File[],
  /** Appelé APRÈS chaque versement réussi, pour que l'écran se remplisse au fur
   *  et à mesure. Une file qui ne rend rien avant la fin ressemble à une file
   *  bloquée, et on la retape. */
  surChacune?: (photo: Photo) => void | Promise<void>,
  /** Signal distinct : la photo est enregistrée, seul l'affichage doit être
   * rechargé. Il ne rejoint jamais `Echec[]`. */
  surAffichageEnRetard?: (photo: Photo) => void | Promise<void>,
): Promise<Echec[]> => {
  // ⚠ LE NOM DU FICHIER EST RETENU par `verserEnSerie`. « Une photo n'a pas pu
  // être préparée » sur un lot de dix laisse chercher laquelle parmi dix ; iOS
  // rend souvent `image.jpg`, mais aussi `IMG_4213.HEIC`.
  return verserEnSerie(
    fichiers, (f) => verserPhoto(db, porteur, f), surChacune, surAffichageEnRetard)
}

/**
 * OUBLIER UNE PHOTO — récit 18.2, et elle part SEULE.
 *
 * ⚠ IL N'Y AVAIT AUCUN CHEMIN POUR ÇA. La seule suppression de photo du produit
 * était `supprimerRoulage`, qui les emporte toutes avec la journée : pour
 * retirer un cliché raté, il fallait détruire la journée entière — ses sessions,
 * ses tours, ses gestes et ses dépenses. C'est la même classe de défaut que les
 * vingt-cinq roulages qu'on ne pouvait pas effacer : une donnée qu'on ne peut
 * pas corriger cesse d'être saisie.
 *
 * La ligne passe D'ABORD à `a_supprimer`. Ce tombstone est la file de reprise :
 * il disparaît de toutes les lectures, se synchronise comme les autres
 * métadonnées, et garde le chemin de l'objet tant que Storage n'a pas confirmé
 * son retrait. Supprimer les octets avant cette écriture ferait perdre à la fois
 * la photo et le seul moyen de reprendre une suppression distante interrompue.
 */
export type ResultatSuppressionPhoto =
  | { statut: 'introuvable'; distante: 'sans_objet' }
  | { statut: 'terminee'; distante: 'sans_objet' | 'supprimee' }
  | {
      statut: 'en_attente'
      distante: 'sans_objet' | 'en_attente' | 'supprimee'
      /** `base_locale` = la demande elle-même n'est pas persistée, la photo
       * reste visible. `finalisation_locale` = tombstone persisté et masqué,
       * mais sa ligne ou son cache doit encore être nettoyé. */
      motif: 'base_locale' | 'finalisation_locale' | 'hors_ligne' | 'stockage'
    }

const estUnObjetDistant = (p: Pick<Photo, 'chemin_objet'>) =>
  !p.chemin_objet.startsWith('local/')

export type IssueSuppressionObjet = 'supprimee' | 'hors_ligne' | 'stockage'

export type OperationsStockagePhoto = {
  peutTeleverser: () => boolean
  televerser: (chemin: string, fichier: Blob) => Promise<boolean>
  supprimer: (chemin: string) => Promise<IssueSuppressionObjet>
}

const STOCKAGE_PHOTO: OperationsStockagePhoto = {
  peutTeleverser: () => !!supabase && typeof navigator !== 'undefined' && navigator.onLine,
  televerser: async (chemin, fichier) => {
    if (!supabase || typeof navigator === 'undefined' || !navigator.onLine) return false
    try {
      const { error } = await supabase.storage.from('photos').upload(
        chemin, fichier, { upsert: true, contentType: fichier.type || 'image/webp' })
      return !error
    } catch { return false }
  },
  supprimer: async (chemin) => {
    if (!supabase || typeof navigator === 'undefined' || !navigator.onLine) return 'hors_ligne'
    try {
      const { error } = await supabase.storage.from('photos').remove([chemin])
      return error ? 'stockage' : 'supprimee'
    } catch { return 'stockage' }
  },
}

/** Termine un tombstone déjà écrit. Storage vient d'abord : si le réseau
 * refuse, le chemin reste durablement disponible. Le coffre est ensuite vidé
 * AVANT le DELETE SQLite : si son effacement refuse, le tombstone garde une
 * reprise ; si le DELETE refuse, il garde la même reprise, désormais
 * idempotente. Une relecture après DELETE ne peut rien sécuriser et risquerait
 * au contraire de laisser un blob sans aucune ligne pour le retrouver. */
const finaliserSuppressionPhoto = async (
  db: PowerSyncDatabase, p: Photo,
  supprimerObjet: OperationsStockagePhoto['supprimer'] = STOCKAGE_PHOTO.supprimer,
): Promise<ResultatSuppressionPhoto> => {
  let distante: 'sans_objet' | 'en_attente' | 'supprimee' = 'sans_objet'
  if (estUnObjetDistant(p)) {
    const issue = await supprimerObjet(p.chemin_objet)
    if (issue !== 'supprimee')
      return { statut: 'en_attente', distante: 'en_attente', motif: issue }
    distante = 'supprimee'
  }

  try { await effacerLocale(nomLocal(p)) } catch {
    return { statut: 'en_attente', distante, motif: 'finalisation_locale' }
  }
  try {
    await db.execute(
      `DELETE FROM photo WHERE id = ? AND etat = 'a_supprimer'`, [p.id])
  } catch {
    return { statut: 'en_attente', distante, motif: 'finalisation_locale' }
  }
  return { statut: 'terminee', distante }
}

export const oublierPhoto = async (
  db: PowerSyncDatabase, photoId: string,
): Promise<ResultatSuppressionPhoto> => {
  const p = await db.getOptional<Photo>(
    `SELECT id, roulage_id, machine_id, intervention_id, chute_id, geste_id, chemin_objet,
            largeur, hauteur, etat, genre
       FROM photo WHERE id = ?`, [photoId])
  if (!p) return { statut: 'introuvable', distante: 'sans_objet' }
  if (p.etat !== 'a_supprimer') {
    try {
      await db.execute(`UPDATE photo SET etat = 'a_supprimer' WHERE id = ?`, [photoId])
    } catch {
      return {
        statut: 'en_attente',
        distante: estUnObjetDistant(p) ? 'en_attente' : 'sans_objet',
        motif: 'base_locale',
      }
    }
    // La mesure d'usage est auxiliaire : le tombstone, lui, est déjà durable.
    // Une sonde qui refuse ne doit ni ressusciter la photo ni faire croire que
    // la demande n'a pas été enregistrée.
    try { await marquerSaisie(db) } catch { /* tombstone déjà écrit */ }
  }
  return finaliserSuppressionPhoto(db, { ...p, etat: 'a_supprimer' })
}

/** Rejoue les suppressions interrompues. Le résultat ne prétend jamais que le
 * cloud est propre tant que Storage ne l'a pas confirmé. */
export const supprimerPhotosEnAttente = async (
  db: PowerSyncDatabase,
  supprimerObjet: OperationsStockagePhoto['supprimer'] = STOCKAGE_PHOTO.supprimer,
): Promise<{ terminees: number; enAttente: number }> => {
  const photos = await db.getAll<Photo>(
    `SELECT id, roulage_id, machine_id, intervention_id, chute_id, geste_id, chemin_objet,
            largeur, hauteur, etat, genre
       FROM photo WHERE etat = 'a_supprimer' ORDER BY id`)
  let terminees = 0, enAttente = 0
  for (const p of photos) {
    const resultat = await finaliserSuppressionPhoto(db, p, supprimerObjet)
    if (resultat.statut === 'terminee') terminees++
    else enAttente++
  }
  return { terminees, enAttente }
}

/* ─── CE QUI QUITTE LE TÉLÉPHONE, ET LE MOYEN DE LE COUPER — récit 18.4 ─────

   Question de Julian, 25 août : « on ne sauvegarde pas les photos dans notre
   cloud ». Le produit doit répondre par ce qu'il FAIT, pas par une intention.

   ⚠ CE QUI PART EST UNE VIGNETTE, ET RIEN D'AUTRE. `reduire` ramène le côté long
   à COTE_LONG (1600 px) et encode en WebP à 0,82 : 200 à 400 Ko selon la scène.
   L'ORIGINAL — 48 Mpx en HEIC sur un iPhone récent, 3 à 8 Mo — n'est JAMAIS lu
   en entier : ses dimensions se lisent dans l'en-tête (`dimensions`), le décodage
   se fait déjà réduit, et il n'est ni copié, ni téléversé, ni touché. C'est ce
   que la page légale doit dire, mot pour mot, au lieu de « vos photos ».

   ⚠ ET AUCUN POINTEUR VERS LA PHOTOTHÈQUE N'EST STOCKÉ, JAMAIS. L'idée de
   « taguer les photos de l'appareil » plutôt que d'en garder une copie est
   séduisante et elle est impossible sur le web : iOS ne rend aucun nom stable
   (une capture arrive en `image.jpg`), aucune API ne rouvre un fichier après un
   rechargement sans que l'utilisateur le repointe, et l'album afficherait des
   cases vides avec un bouton « retrouve-la toi-même ». Ce n'est pas un report,
   c'est une exclusion.

   ⚠ LE VOLUME, CHIFFRÉ — parce qu'il n'était écrit nulle part et que c'est LUI
   qui devrait décider si le cloud reste ouvert :

     · une vignette : 200 à 400 Ko, disons 300 Ko en moyenne ;
     · une journée de piste bien photographiée : 20 vignettes, soit ~6 Mo ;
     · une saison de dix journées : ~60 Mo ;
     · mille photos, soit une petite dizaine de saisons : ~300 Mo.

   Autrement dit : le premier gigaoctet couvre une trentaine de saisons d'un
   pilote. Le TARIF, lui, se lit chez l'hébergeur et n'est pas recopié ici —
   un prix figé dans un dépôt est un prix faux dans six mois, et c'est pire
   qu'un prix absent parce qu'on le croit. Ce qui est écrit ici est le VOLUME,
   qui ne bouge pas.

   ⚠ ET LE LEVIER N'EST PAS LA PELLICULE, c'est `COTE_LONG` et la qualité WebP :
   passer de 1600/0,82 à 1200/0,75 divise le poids par environ 2,2 sans changer
   une ligne d'architecture. Le jour où le stockage devient le problème, c'est là
   qu'on touche — pas au fait de garder une copie, qui est ce qui permet à
   l'album d'exister hors ligne. */

/** Le réglage vit dans les RÉGLAGES du produit, avec son préfixe : il part donc
 *  avec « effacer mon téléphone », comme les autres. Absent = envoi actif, parce
 *  que c'est le comportement d'origine et qu'un réglage absent ne doit jamais
 *  changer silencieusement ce que le produit faisait hier. */
const CLE_ENVOI = 'mypaddock.envoi-cloud'

export const envoiCloudActif = (): boolean => {
  try { return localStorage.getItem(CLE_ENVOI) !== '0' } catch { return true }
}

export const poserEnvoiCloud = (actif: boolean): void => {
  try { localStorage.setItem(CLE_ENVOI, actif ? '1' : '0') } catch { /* rien à faire */ }
}

/** Un upload peut finir après que son DELETE local a gagné la course. Si le
 * retrait Storage échoue à cet instant, cette ligne recrée uniquement la file
 * de suppression — jamais une photo visible — avec le chemin distant exact.
 *
 * Le tombstone est volontairement détaché : son ancien roulage/chute peut déjà
 * avoir été supprimé. Réutiliser ces identifiants transformerait une reprise
 * Storage sûre en violation de FK (23503). La contrainte serveur autorise ce
 * seul cas sans porteur quand `etat = 'a_supprimer'`. */
const conserverSuppressionDistante = async (
  db: PowerSyncDatabase, p: Photo, chemin: string,
): Promise<boolean> => {
  try {
    await db.execute(
      `INSERT INTO photo
         (id, roulage_id, machine_id, intervention_id, chute_id, geste_id,
          chemin_objet, largeur, hauteur, etat, genre)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'a_supprimer', ?)
       ON CONFLICT(id) DO UPDATE SET
         chemin_objet = excluded.chemin_objet, etat = 'a_supprimer'
       WHERE photo.etat = 'a_supprimer'`,
      [p.id, null, null, null, null, null,
        chemin, p.largeur, p.hauteur, p.genre])
    const gardee = await db.getOptional<Pick<Photo, 'etat' | 'chemin_objet'>>(
      `SELECT etat, chemin_objet FROM photo WHERE id = ?`, [p.id])
    return gardee?.etat === 'a_supprimer' && gardee.chemin_objet === chemin
  } catch { return false }
}

/* ─── LE TÉLÉVERSEMENT DIFFÉRÉ ─────────────────────────────────────────────
   AD-6 : DEUX DÉCLENCHEURS EXACTEMENT — le retour au premier plan et le retour
   de connectivité. Rien d'autre : sur iOS rien ne s'exécute pendant que
   l'application est fermée, WebKit a refusé Background Sync et n'a jamais
   implémenté Background Fetch. Un téléversement interrompu reprend à la
   prochaine ouverture, pas avant. */

export const televerserEnAttente = async (
  db: PowerSyncDatabase, piloteId: string | null,
  stockage: OperationsStockagePhoto = STOCKAGE_PHOTO,
): Promise<number> => {
  // Une demande d'effacement n'est pas un envoi : elle se rejoue même lorsque
  // le pilote a coupé les sauvegardes cloud ou utilise encore l'app sans compte.
  await supprimerPhotosEnAttente(db, stockage.supprimer)
  // Seul le téléversement exige une identité. La finalisation locale ci-dessus
  // doit rester possible avant la connexion du pilote.
  if (!piloteId) return 0
  if (!stockage.peutTeleverser()) return 0
  /* ⚠ LE PILOTE PEUT COUPER L'ENVOI, ET C'EST LE SEUL ENDROIT QUI LE LIT — récit
     18.4. Couper ne casse RIEN : la copie locale existe déjà (elle est écrite
     avant toute chose), l'album s'affiche depuis elle, et le produit marche
     entièrement hors ligne de toute façon. Ce que ça change est précis : les
     photos ne redescendront pas sur un autre appareil, et elles partiront avec
     le téléphone s'il se perd. Le réglage le dit en ces termes.
     Il est lu ICI et pas à l'appel : un appelant qui oublierait de le tester
     enverrait quand même, et ce réglage-là ne peut pas se rater. */
  if (!envoiCloudActif()) return 0
  const l = await db.getAll<Photo>(
    `SELECT id, roulage_id, machine_id, intervention_id, chute_id, geste_id, chemin_objet,
            largeur, hauteur, etat, genre
       FROM photo WHERE etat = 'locale'`)
  let montees = 0
  for (const p of l) {
    // Revalidation juste avant les octets : une suppression gagnée pendant la
    // lecture de la liste ne doit jamais démarrer un upload.
    const courante = await db.getOptional<Photo>(
      `SELECT id, roulage_id, machine_id, intervention_id, chute_id, geste_id, chemin_objet,
              largeur, hauteur, etat, genre
         FROM photo WHERE id = ? AND etat = 'locale'`, [p.id])
    if (!courante) continue
    const f = await lireLocale(nomLocal(courante))
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
    const porteur = courante.chute_id ?? courante.roulage_id ?? courante.machine_id
      ?? courante.intervention_id ?? 'sans-porteur'
    const chemin = `${piloteId}/${porteur}/${nomLocal(courante)}`
    if (!await stockage.televerser(chemin, f)) continue

    // Le WHERE rend la victoire explicite : un tombstone écrit pendant l'HTTP
    // n'est jamais ressuscité en `montee`.
    try {
      await db.execute(
        `UPDATE photo SET etat = 'montee', chemin_objet = ?
          WHERE id = ? AND etat = 'locale'`, [chemin, courante.id])
    } catch { /* la relecture ci-dessous décide selon l'état durable */ }
    const apres = await db.getOptional<Photo>(
      `SELECT id, roulage_id, machine_id, intervention_id, chute_id, geste_id, chemin_objet,
              largeur, hauteur, etat, genre FROM photo WHERE id = ?`, [courante.id])
    if (apres?.etat === 'montee' && apres.chemin_objet === chemin) {
      montees++
      continue
    }

    // La photo a été retirée pendant l'upload. L'objet tout juste créé repart
    // immédiatement ; si Storage refuse, son chemin redevient un tombstone
    // durable et sera rejoué au prochain montage.
    const retiree = await stockage.supprimer(chemin)
    if (retiree === 'supprimee') continue
    if (!apres || apres.etat === 'a_supprimer') {
      // Ligne absente peut signifier que son roulage vient lui aussi d'être
      // supprimé : ne recrée alors aucune FK vers un parent disparu. Un
      // tombstone encore présent conserve en revanche ses porteurs valides.
      const porteur = apres ?? {
        ...courante,
        roulage_id: null, machine_id: null, intervention_id: null,
        chute_id: null, geste_id: null,
      }
      const gardee = await conserverSuppressionDistante(db, porteur, chemin)
      if (gardee) continue
      // Dernier essai avant de reconnaître que ni Storage ni SQLite n'a gardé
      // la responsabilité de cet objet.
      if (await stockage.supprimer(chemin) === 'supprimee') continue
    }
    throw new Error("La fin d'un envoi photo n'a pas pu être sécurisée.")
  }
  return montees
}

/** Les deux seuls déclencheurs, posés une fois. Rend de quoi les retirer. */
export const surRetourDeReseau = (relancer: () => void): (() => void) => {
  const visible = () => { if (document.visibilityState === 'visible') relancer() }
  // Le montage est déjà un retour dans l'application : attendre un prochain
  // événement laisserait une suppression interrompue dormir jusqu'à la fois
  // suivante.
  visible()
  document.addEventListener('visibilitychange', visible)
  window.addEventListener('online', relancer)
  return () => {
    document.removeEventListener('visibilitychange', visible)
    window.removeEventListener('online', relancer)
  }
}
