/**
 * LA VIDÉO DURABLE — récit 23.10, celui que le lot 23 a délibérément reporté.
 *
 * Le non-objectif écrit le 26 août disait « attacher une vidéo au crash » et
 * l'hypothèse qui l'accompagnait disait pourquoi : il fallait un versement
 * REPRENABLE, un stockage privé, un quota dit à voix haute, une suppression, un
 * export, et une lecture sur un second appareil. Tant qu'un seul de ces cinq
 * manque, la pièce n'est pas durable — elle est seulement affichée.
 *
 * ⚠ CE MODULE EST LE JUMEAU DE `photos.ts` ET IL EN DIFFÈRE SUR UN POINT, UN SEUL.
 * Les invariants sont les mêmes, mot pour mot : copie locale écrite AVANT la
 * ligne, revalidation juste avant les octets, tombstone synchronisé qui survit
 * à la disparition de son porteur, `UPDATE ... WHERE etat = 'locale'` pour
 * qu'un retrait gagné pendant l'HTTP ne soit jamais ressuscité.
 *
 * Le point qui diffère est la DURÉE DE L'ENVOI. Une vignette part en un aller-
 * retour : la fenêtre pendant laquelle un retrait peut croiser un envoi se
 * compte en centaines de millisecondes, et `photos.ts` la traite en une seule
 * revalidation. Une vidéo part en une dizaine de morceaux sur une 4G de
 * paddock : cette fenêtre dure des minutes. C'est pourquoi la boucle
 * ci-dessous revalide ENTRE CHAQUE MORCEAU et non une fois au départ — sans
 * quoi le produit continuerait à pousser des octets vers un objet que le
 * pilote a déjà retiré de son carnet, puis se retrouverait à devoir effacer
 * quelque chose qu'il vient lui-même de finir d'écrire.
 */
import type { PowerSyncDatabase } from '@powersync/web'
import { supabase, supabaseUrl } from './supabase'
import { ecrireLocale, effacerLocale, lireLocale } from './coffre'
import { nouvelId } from './ids'
import { marquerSaisie } from './mesures'
import { envoiCloudActif, type IssueSuppressionObjet } from './photos'

export type EtatVideo = 'locale' | 'montee' | 'a_supprimer'

export type Video = {
  id: string
  /** Le jour porte la vidéo même quand le crash la porte aussi. Retirer le récit
   *  d'un crash ne détruit pas la preuve : même clause que la photo de chute. */
  roulage_id: string | null
  chute_id: string | null
  chemin_objet: string
  /** Le poids réel APRÈS compression, arrêté à l'écriture locale. C'est la cible
   *  que la reprise compare à l'offset rendu par le serveur. */
  octets: number
  duree_ms: number | null
  largeur: number | null
  hauteur: number | null
  type_mime: string | null
  etat: EtatVideo
}

const COLONNES = `id, roulage_id, chute_id, chemin_objet, octets, duree_ms,
                  largeur, hauteur, type_mime, etat`

/* ─── LE QUOTA, DIT AVANT LE GESTE ET NON APRÈS ─────────────────────────────
   Le récit 23.10 exige un quota EXPLICITE. Explicite ne veut pas dire « appliqué »
   mais « connu avant d'agir » : un pilote qui filme trois minutes au paddock doit
   savoir qu'il ne pourra pas les garder AVANT de les avoir attendues, pas après.

   Les deux bornes ne font pas le même travail et aucune ne remplace l'autre :
   la durée borne CE QU'ON DEMANDE À L'APPAREIL — comprimer dix minutes de vidéo
   sur un téléphone, c'est le faire chauffer et vider sa batterie au paddock ;
   le volume borne CE QUE LE PILOTE TRANSPORTE ET PAIE. */

/** Une minute trente. Un crash se raconte en quelques secondes autour de la
 *  chute, pas en captation de session : au-delà, ce n'est plus une pièce jointe
 *  à un récit, c'est une bibliothèque vidéo — et le produit n'en est pas une. */
export const DUREE_MAX_MS = 90_000

/** 500 Mo par pilote, tous crashs confondus. Chiffré comme le volume des photos
 *  l'est dans `photos.ts`, et pour la même raison : une limite qu'on ne peut pas
 *  calculer est une limite qu'on découvre en la heurtant. À ~4 Mo la vidéo
 *  comprimée de trente secondes, cela fait de l'ordre de cent vingt clips —
 *  soit plusieurs saisons de crashs documentés pour un pilote qui en a peu, et
 *  une limite atteignable pour un pilote qui filmerait tout. C'est le bon
 *  endroit pour qu'elle se voie. */
export const QUOTA_VIDEO_OCTETS = 500 * 1024 * 1024

export type PlaceVideo = { utilises: number; quota: number; restant: number }

/** Ce que les vidéos occupent DÉJÀ. Les tombstones sont hors compte : leur
 *  retrait est demandé, ils ne sont plus une pièce du carnet — les compter
 *  refuserait un versement au nom d'octets que le pilote a déjà rendus. */
export const placeVideo = async (db: PowerSyncDatabase): Promise<PlaceVideo> => {
  const r = await db.get<{ total: number | null }>(
    `SELECT sum(octets) AS total FROM video WHERE etat != 'a_supprimer'`)
  const utilises = r.total ?? 0
  return { utilises, quota: QUOTA_VIDEO_OCTETS, restant: Math.max(0, QUOTA_VIDEO_OCTETS - utilises) }
}

/** Le nom dans le coffre. Comme pour la photo, il porte l'extension réelle :
 *  un fichier relu sans son type ne se rejoue pas. */
export const nomLocalVideo = (v: Pick<Video, 'id' | 'chemin_objet'>) =>
  `${v.id}.${v.chemin_objet.split('.').pop() ?? 'mp4'}`

export type Porteur = { chuteId: string } | { roulageId: string }

export type MetaVideo = {
  duree_ms?: number | null
  largeur?: number | null
  hauteur?: number | null
}

export type RefusVersement = { refus: string }

/**
 * Écrit la vidéo SUR LE TÉLÉPHONE, puis dans le carnet. Jamais l'inverse : une
 * ligne qui désigne un fichier absent est une pièce que le carnet montre et que
 * personne ne peut ouvrir.
 *
 * Le chemin porte `local/` tant qu'aucun compte n'existe et se réécrit au
 * versement, exactement comme la photo — le PREMIER SEGMENT est ce que la
 * politique du bucket compare à `auth.uid()`.
 */
export const verserVideo = async (
  db: PowerSyncDatabase, porteur: Porteur, fichier: Blob, meta: MetaVideo = {},
): Promise<Video | RefusVersement> => {
  const chuteId = 'chuteId' in porteur ? porteur.chuteId : null
  let roulageId = 'roulageId' in porteur ? porteur.roulageId : null
  if (chuteId) {
    const chute = await db.getOptional<{ roulage_id: string }>(
      `SELECT roulage_id FROM chute WHERE id = ?`, [chuteId])
    if (!chute) return { refus: 'Ce crash est introuvable.' }
    // Une vidéo de crash reste une vidéo de la journée. Ce second lien rend
    // vraie la promesse « retirer le crash ne détruit pas sa preuve » tout en
    // respectant la contrainte serveur qui refuse une vidéo sans jour.
    roulageId = chute.roulage_id
  }
  if (!roulageId) return { refus: 'Cette vidéo n’a pas de journée à laquelle se rattacher.' }

  // ⚠ LE QUOTA SE LIT ICI, APRÈS COMPRESSION ET AVANT L'ÉCRITURE. Le mesurer
  // sur le fichier d'origine refuserait des vidéos qui tiennent une fois
  // comprimées ; le mesurer après l'écriture ferait entrer puis ressortir une
  // pièce, ce qui est la façon la plus sûre d'en perdre une.
  const place = await placeVideo(db)
  if (fichier.size > place.restant) {
    return {
      refus: `Cette vidéo pèse ${enPoids(fichier.size)} et il reste `
        + `${enPoids(place.restant)} sur les ${enPoids(place.quota)} de vidéo. `
        + `Retire une vidéo d’un autre crash pour faire de la place.`,
    }
  }

  const id = nouvelId()
  const extension = extensionDe(fichier)
  const chemin = `local/${chuteId ?? roulageId}/${id}.${extension}`
  await ecrireLocale(`${id}.${extension}`, fichier)
  await db.execute(
    `INSERT INTO video
       (id, roulage_id, chute_id, chemin_objet, octets, duree_ms,
        largeur, hauteur, type_mime, etat)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'locale')`,
    [id, roulageId, chuteId, chemin, fichier.size, meta.duree_ms ?? null,
      meta.largeur ?? null, meta.hauteur ?? null, fichier.type || null])
  await marquerSaisie(db)
  return {
    id, roulage_id: roulageId, chute_id: chuteId, chemin_objet: chemin,
    octets: fichier.size, duree_ms: meta.duree_ms ?? null,
    largeur: meta.largeur ?? null, hauteur: meta.hauteur ?? null,
    type_mime: fichier.type || null, etat: 'locale',
  }
}

/** `video/quicktime` → `mov`, `video/mp4` → `mp4`. Le type MIME fait autorité :
 *  un iPhone rend `.MOV` quand il rend un nom, et souvent il n'en rend aucun. */
export const extensionDe = (fichier: Blob): string => {
  const t = (fichier.type || '').toLowerCase()
  if (t.includes('quicktime')) return 'mov'
  if (t.includes('webm')) return 'webm'
  if (t.includes('mp4')) return 'mp4'
  const nom = (fichier as File).name
  const ext = nom?.includes('.') ? nom.split('.').pop()!.toLowerCase() : ''
  return /^[a-z0-9]{2,4}$/.test(ext) ? ext : 'mp4'
}

export const videosDeLaChute = (db: PowerSyncDatabase, chuteId: string) =>
  db.getAll<Video>(
    `SELECT ${COLONNES} FROM video
      WHERE chute_id = ? AND etat != 'a_supprimer' ORDER BY id`, [chuteId])

export const videosDuRoulage = (db: PowerSyncDatabase, roulageId: string) =>
  db.getAll<Video>(
    `SELECT ${COLONNES} FROM video
      WHERE roulage_id = ? AND etat != 'a_supprimer' ORDER BY id`, [roulageId])

/** La copie de CE téléphone, quand elle existe. */
export const lireVideoLocale = (v: Pick<Video, 'id' | 'chemin_objet'>): Promise<File | null> =>
  lireLocale(nomLocalVideo(v))

/**
 * ⚠ LA LECTURE SUR UN SECOND APPAREIL, qui est une clause du récit et non un
 * agrément. Sur le téléphone qui a filmé, la copie locale existe et rien ne
 * transite. Sur l'autre, la ligne est descendue par synchronisation mais les
 * octets sont restés au serveur : sans ce lien signé, le carnet afficherait
 * une vidéo qu'il est incapable d'ouvrir.
 *
 * Le bucket est PRIVÉ : il n'y a pas d'URL publique à composer, seulement un
 * lien signé à durée courte. Une heure suffit largement à regarder un clip et
 * ne laisse pas traîner un accès dans un historique de navigation.
 */
export const lienVideoDistante = async (
  v: Pick<Video, 'chemin_objet' | 'etat'>,
): Promise<string | null> => {
  if (!supabase || v.etat !== 'montee' || !estUnObjetDistant(v)) return null
  try {
    const { data, error } = await supabase.storage.from('videos')
      .createSignedUrl(v.chemin_objet, 3600)
    return error ? null : (data?.signedUrl ?? null)
  } catch { return null }
}

/* ─── LA SUPPRESSION — même mécanique que la photo, mêmes trois refus ────────
   Elle est reprise telle quelle et non factorisée avec `photos.ts`, à dessein :
   les deux tables n'ont ni les mêmes colonnes ni le même bucket, et une
   abstraction commune ferait passer un paramètre de table dans une requête SQL
   pour économiser vingt lignes. Le jour où l'une des deux évolue, c'est
   l'abstraction qui casserait les deux. */

export const estUnObjetDistant = (v: Pick<Video, 'chemin_objet'>) =>
  !v.chemin_objet.startsWith('local/')

export type ResultatSuppressionVideo =
  | { statut: 'introuvable'; distante: 'sans_objet' }
  | { statut: 'terminee'; distante: 'sans_objet' | 'supprimee' }
  | {
      statut: 'en_attente'
      distante: 'sans_objet' | 'en_attente' | 'supprimee'
      /** `base_locale` = la demande elle-même n'est pas persistée, la vidéo
       *  reste visible. `finalisation_locale` = tombstone persisté et masqué,
       *  mais sa ligne ou son cache doit encore être nettoyé. */
      motif: 'base_locale' | 'finalisation_locale' | 'hors_ligne' | 'stockage'
    }

export type OperationsStockageVideo = {
  peutTeleverser: () => boolean
  /** Rend le nombre d'octets RÉELLEMENT confirmés par le serveur. C'est ce qui
   *  distingue un versement reprenable d'un versement qu'on relance. */
  televerser: (chemin: string, fichier: Blob, id: string) => Promise<number>
  supprimer: (chemin: string) => Promise<IssueSuppressionObjet>
}

/* ─── LE VERSEMENT PAR MORCEAUX ─────────────────────────────────────────────
   Le client `storage` ne sait faire qu'un envoi en UN seul HTTP : une coupure à
   90 % renvoie à zéro. Le protocole par morceaux se parle donc à la main sur
   `/storage/v1/upload/resumable`, en trois gestes et rien de plus :

     · POST   → le serveur ouvre un versement et rend son adresse ;
     · HEAD   → il dit combien d'octets il détient DÉJÀ ;
     · PATCH  → on lui pousse la suite à partir de cet offset.

   ⚠ L'ADRESSE EST LA SEULE CHOSE QU'IL FAUT GARDER, et elle ne va pas dans la
   base. C'est un état d'envoi propre à CE téléphone : le second appareil n'a
   rien à en faire, et la synchroniser ferait remonter une ligne à chaque
   morceau. Elle vit donc dans les réglages, avec le préfixe du produit, et part
   avec « effacer mon téléphone » comme le reste.

   ⚠ ET L'OFFSET NE SE MÉMORISE PAS. C'est le serveur qui le détient, et lui
   seul dit la vérité : un compteur tenu côté client se désynchronise au premier
   morceau à demi reçu, et fait alors sauter des octets au milieu du fichier —
   une vidéo corrompue que rien ne signale, ce qui est pire qu'un envoi perdu. */

/** Supabase impose 6 Mo pour tous les morceaux sauf le dernier. */
const MORCEAU = 6 * 1024 * 1024
const CLE_REPRISE = 'mypaddock.reprise-video'

const adresseDeReprise = (id: string): string | null => {
  try { return localStorage.getItem(`${CLE_REPRISE}.${id}`) } catch { return null }
}
const garderAdresseDeReprise = (id: string, url: string): void => {
  try { localStorage.setItem(`${CLE_REPRISE}.${id}`, url) } catch { /* reprise perdue, envoi refait */ }
}
const oublierAdresseDeReprise = (id: string): void => {
  try { localStorage.removeItem(`${CLE_REPRISE}.${id}`) } catch { /* rien à faire */ }
}

const enTete64 = (v: string) => btoa(unescape(encodeURIComponent(v)))

const jeton = async (): Promise<string | null> => {
  if (!supabase) return null
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  } catch { return null }
}

/** Ouvre un versement et rend son adresse, ou nul si le serveur refuse. */
const ouvrirVersement = async (
  chemin: string, fichier: Blob, autorisation: string,
): Promise<string | null> => {
  const r = await fetch(`${supabaseUrl}/storage/v1/upload/resumable`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${autorisation}`,
      'tus-resumable': '1.0.0',
      'upload-length': String(fichier.size),
      'upload-metadata': [
        `bucketName ${enTete64('videos')}`,
        `objectName ${enTete64(chemin)}`,
        `contentType ${enTete64(fichier.type || 'video/mp4')}`,
        // Le versement doit pouvoir ÉCRASER un objet à demi écrit dont on a
        // perdu l'adresse : sans cela une reprise ratée bloque le chemin pour
        // toujours et la vidéo ne monte plus jamais.
        `upsert ${enTete64('true')}`,
      ].join(','),
    },
  })
  return r.ok ? r.headers.get('location') : null
}

/** Ce que le serveur détient déjà. `null` = ce versement n'existe plus, il faut
 *  en rouvrir un — un versement expiré rendrait sinon un offset définitivement
 *  bloqué. */
const offsetDetenu = async (adresse: string, autorisation: string): Promise<number | null> => {
  try {
    const r = await fetch(adresse, {
      method: 'HEAD',
      headers: { authorization: `Bearer ${autorisation}`, 'tus-resumable': '1.0.0' },
    })
    if (!r.ok) return null
    const o = Number(r.headers.get('upload-offset'))
    return Number.isFinite(o) && o >= 0 ? o : null
  } catch { return null }
}

const STOCKAGE_VIDEO: OperationsStockageVideo = {
  peutTeleverser: () => !!supabase && typeof navigator !== 'undefined' && navigator.onLine,

  televerser: async (chemin, fichier, id) => {
    if (!supabase || typeof navigator === 'undefined' || !navigator.onLine) return 0
    const autorisation = await jeton()
    if (!autorisation) return 0
    try {
      let adresse = adresseDeReprise(id)
      let offset = adresse ? await offsetDetenu(adresse, autorisation) : null
      if (adresse === null || offset === null) {
        adresse = await ouvrirVersement(chemin, fichier, autorisation)
        if (!adresse) return 0
        garderAdresseDeReprise(id, adresse)
        offset = 0
      }

      while (offset < fichier.size) {
        const fin = Math.min(offset + MORCEAU, fichier.size)
        const r = await fetch(adresse, {
          method: 'PATCH',
          headers: {
            authorization: `Bearer ${autorisation}`,
            'tus-resumable': '1.0.0',
            'upload-offset': String(offset),
            'content-type': 'application/offset+octet-stream',
          },
          body: fichier.slice(offset, fin),
        })
        // Une coupure rend simplement ce qui est acquis : le prochain passage
        // repartira du même endroit, et c'est tout l'intérêt du dispositif.
        if (!r.ok) return offset
        const suivant = Number(r.headers.get('upload-offset'))
        // ⚠ SANS PROGRÈS, ON S'ARRÊTE. Un serveur qui rend deux fois le même
        // offset ferait tourner cette boucle à l'infini en poussant des octets
        // que personne n'écrit — sur une 4G de paddock, c'est le forfait du
        // pilote qui paie la boucle.
        if (!Number.isFinite(suivant) || suivant <= offset) return offset
        offset = suivant
      }
      oublierAdresseDeReprise(id)
      return offset
    } catch { return 0 }
  },

  supprimer: async (chemin) => {
    if (!supabase || typeof navigator === 'undefined' || !navigator.onLine) return 'hors_ligne'
    try {
      const { error } = await supabase.storage.from('videos').remove([chemin])
      return error ? 'stockage' : 'supprimee'
    } catch { return 'stockage' }
  },
}

/** Termine un tombstone déjà écrit. Storage d'abord : si le réseau refuse, le
 *  chemin reste durablement disponible. Le coffre ensuite, AVANT le DELETE — si
 *  son effacement refuse, le tombstone garde une reprise ; si le DELETE refuse,
 *  il garde la même, désormais idempotente. */
const finaliserSuppressionVideo = async (
  db: PowerSyncDatabase, v: Video,
  supprimerObjet: OperationsStockageVideo['supprimer'] = STOCKAGE_VIDEO.supprimer,
): Promise<ResultatSuppressionVideo> => {
  let distante: 'sans_objet' | 'en_attente' | 'supprimee' = 'sans_objet'
  if (estUnObjetDistant(v)) {
    const issue = await supprimerObjet(v.chemin_objet)
    if (issue !== 'supprimee')
      return { statut: 'en_attente', distante: 'en_attente', motif: issue }
    distante = 'supprimee'
  }
  // Un versement à demi fait n'a plus de raison d'être repris : son objet vient
  // d'être retiré, ou n'a jamais quitté ce téléphone.
  oublierAdresseDeReprise(v.id)

  try { await effacerLocale(nomLocalVideo(v)) } catch {
    return { statut: 'en_attente', distante, motif: 'finalisation_locale' }
  }
  try {
    await db.execute(`DELETE FROM video WHERE id = ? AND etat = 'a_supprimer'`, [v.id])
  } catch {
    return { statut: 'en_attente', distante, motif: 'finalisation_locale' }
  }
  return { statut: 'terminee', distante }
}

export const oublierVideo = async (
  db: PowerSyncDatabase, videoId: string,
): Promise<ResultatSuppressionVideo> => {
  const v = await db.getOptional<Video>(`SELECT ${COLONNES} FROM video WHERE id = ?`, [videoId])
  if (!v) return { statut: 'introuvable', distante: 'sans_objet' }
  if (v.etat !== 'a_supprimer') {
    try {
      await db.execute(`UPDATE video SET etat = 'a_supprimer' WHERE id = ?`, [videoId])
    } catch {
      return {
        statut: 'en_attente',
        distante: estUnObjetDistant(v) ? 'en_attente' : 'sans_objet',
        motif: 'base_locale',
      }
    }
    // La mesure d'usage est auxiliaire : le tombstone, lui, est déjà durable.
    try { await marquerSaisie(db) } catch { /* tombstone déjà écrit */ }
  }
  return finaliserSuppressionVideo(db, { ...v, etat: 'a_supprimer' })
}

/** Rejoue les suppressions interrompues. Ne prétend jamais que le stockage est
 *  propre tant qu'il ne l'a pas confirmé. */
export const supprimerVideosEnAttente = async (
  db: PowerSyncDatabase,
  supprimerObjet: OperationsStockageVideo['supprimer'] = STOCKAGE_VIDEO.supprimer,
): Promise<{ terminees: number; enAttente: number }> => {
  const videos = await db.getAll<Video>(
    `SELECT ${COLONNES} FROM video WHERE etat = 'a_supprimer' ORDER BY id`)
  let terminees = 0, enAttente = 0
  for (const v of videos) {
    const resultat = await finaliserSuppressionVideo(db, v, supprimerObjet)
    if (resultat.statut === 'terminee') terminees++
    else enAttente++
  }
  return { terminees, enAttente }
}

/**
 * LE VERSEMENT DIFFÉRÉ — mêmes deux déclencheurs que la photo (`surRetourDeReseau`) :
 * le retour au premier plan et le retour de connectivité. Sur iOS rien ne
 * s'exécute pendant que l'application est fermée ; un versement interrompu
 * reprend à la prochaine ouverture, pas avant. La différence est qu'il REPREND
 * au lieu de recommencer.
 */
export const televerserVideosEnAttente = async (
  db: PowerSyncDatabase, piloteId: string | null,
  stockage: OperationsStockageVideo = STOCKAGE_VIDEO,
): Promise<number> => {
  // Une demande d'effacement n'est pas un envoi : elle se rejoue même quand le
  // pilote a coupé les sauvegardes cloud ou utilise encore l'app sans compte.
  await supprimerVideosEnAttente(db, stockage.supprimer)
  if (!piloteId) return 0
  if (!stockage.peutTeleverser()) return 0
  // Le même interrupteur que les photos, lu ICI et pas à l'appel : un appelant
  // qui oublierait de le tester enverrait quand même.
  if (!envoiCloudActif()) return 0

  const l = await db.getAll<Video>(`SELECT ${COLONNES} FROM video WHERE etat = 'locale'`)
  let montees = 0
  for (const v of l) {
    // Revalidation juste avant les octets : un retrait gagné pendant la lecture
    // de la liste ne doit jamais démarrer un envoi.
    const courante = await db.getOptional<Video>(
      `SELECT ${COLONNES} FROM video WHERE id = ? AND etat = 'locale'`, [v.id])
    if (!courante) continue
    const f = await lireVideoLocale(courante)
    if (!f) continue

    const porteur = courante.chute_id ?? courante.roulage_id ?? 'sans-porteur'
    const chemin = `${piloteId}/${porteur}/${nomLocalVideo(courante)}`
    const envoyes = await stockage.televerser(chemin, f, courante.id)
    // Un envoi partiel n'est pas un échec : l'adresse de reprise est gardée et
    // le prochain déclencheur repartira de cet offset. Rien à dire à l'écran,
    // rien à défaire — c'est le comportement nominal d'une 4G de paddock.
    if (envoyes < courante.octets) continue

    // Le WHERE rend la victoire explicite : un tombstone écrit pendant l'envoi
    // n'est jamais ressuscité en `montee`.
    try {
      await db.execute(
        `UPDATE video SET etat = 'montee', chemin_objet = ? WHERE id = ? AND etat = 'locale'`,
        [chemin, courante.id])
    } catch { /* la relecture ci-dessous décide selon l'état durable */ }
    const apres = await db.getOptional<Video>(
      `SELECT ${COLONNES} FROM video WHERE id = ?`, [courante.id])
    if (apres?.etat === 'montee' && apres.chemin_objet === chemin) {
      montees++
      continue
    }

    // La vidéo a été retirée pendant l'envoi. L'objet tout juste écrit repart
    // immédiatement ; si le stockage refuse, son chemin redevient un tombstone
    // durable et sera rejoué au prochain montage.
    if (await stockage.supprimer(chemin) === 'supprimee') continue
    if (!apres || apres.etat === 'a_supprimer') {
      const gardee = await conserverSuppressionDistante(db, courante, chemin)
      if (gardee) continue
      if (await stockage.supprimer(chemin) === 'supprimee') continue
    }
    throw new Error("La fin d'un envoi vidéo n'a pas pu être sécurisée.")
  }
  return montees
}

/** Un envoi peut finir après que son retrait a gagné la course. Cette ligne
 *  recrée alors UNIQUEMENT la file de suppression — jamais une vidéo visible —
 *  avec le chemin distant exact.
 *
 *  Le tombstone est volontairement DÉTACHÉ : son roulage ou sa chute peut déjà
 *  avoir disparu, et réutiliser ces identifiants transformerait une reprise sûre
 *  en violation de clé étrangère. La contrainte serveur autorise ce seul cas
 *  sans porteur quand `etat = 'a_supprimer'`. */
const conserverSuppressionDistante = async (
  db: PowerSyncDatabase, v: Video, chemin: string,
): Promise<boolean> => {
  try {
    await db.execute(
      `INSERT INTO video
         (id, roulage_id, chute_id, chemin_objet, octets, duree_ms,
          largeur, hauteur, type_mime, etat)
       VALUES (?, NULL, NULL, ?, ?, ?, ?, ?, ?, 'a_supprimer')
       ON CONFLICT(id) DO UPDATE SET
         chemin_objet = excluded.chemin_objet, etat = 'a_supprimer'
       WHERE video.etat = 'a_supprimer'`,
      [v.id, chemin, v.octets, v.duree_ms, v.largeur, v.hauteur, v.type_mime])
    const gardee = await db.getOptional<Pick<Video, 'etat' | 'chemin_objet'>>(
      `SELECT etat, chemin_objet FROM video WHERE id = ?`, [v.id])
    return gardee?.etat === 'a_supprimer' && gardee.chemin_objet === chemin
  } catch { return false }
}

/** « 3,2 Mo », « 420 Ko ». Repris de `formaterPoids` : le poids s'annonce AVANT
 *  le geste, et un quota qui ne se lit pas n'est pas explicite. */
const enPoids = (octets: number): string =>
  octets >= 1_000_000 ? `${(octets / 1_048_576).toFixed(1).replace('.', ',')} Mo`
    : `${Math.max(1, Math.round(octets / 1024))} Ko`
