/**
 * COMPRIMER UNE VIDÉO SUR LE TÉLÉPHONE, AVANT QU'ELLE NE COÛTE QUOI QUE CE SOIT.
 *
 * C'est le pendant de `reduire` dans `photos.ts`, et il répond au même chiffre :
 * ce qui quitte le téléphone doit être BORNÉ, connu, et petit devant ce que
 * l'appareil a produit. Une minute filmée en 4K par un iPhone récent pèse 300 à
 * 400 Mo ; la même minute ramenée à 720p pèse une dizaine de Mo. Sans cette
 * étape, le quota de 500 Mo tiendrait une minute et demie de crash, ce qui
 * revient à ne pas avoir de fonctionnalité.
 *
 * ─── ⚠ POURQUOI CE N'EST PAS `VideoEncoder` SEUL, ET C'EST LA NOTE IMPORTANTE ──
 *
 * L'intention de départ était WebCodecs pur, sans aucune dépendance. WebCodecs
 * fournit `VideoDecoder` et `VideoEncoder` — et RIEN D'AUTRE. Or un fichier
 * vidéo n'est pas un flux d'images encodées : c'est un CONTENEUR (MP4, MOV,
 * WebM) qui range ces images avec leurs horodatages, leur piste audio et leur
 * table d'index. WebCodecs ne sait ni lire ce conteneur en entrée (démultiplexer)
 * ni en fabriquer un en sortie (multiplexer).
 *
 * Autrement dit, `VideoEncoder` seul rend des paquets H.264 nus qu'AUCUN lecteur
 * n'ouvre. Le compléter demanderait un multiplexeur MP4 — c'est-à-dire soit une
 * dépendance, soit plusieurs centaines de lignes de manipulation d'atomes ISO-BMFF
 * dont la moindre erreur produit un fichier que le pilote croit avoir sauvegardé
 * et qui ne se rejoue nulle part. Sur une pièce de carnet, ce risque-là n'est
 * pas payable.
 *
 * Le chemin retenu garde donc l'objectif — zéro dépendance, sortie bornée — et
 * change de moyen : `MediaRecorder` sur un flux capturé depuis un canvas. Il
 * encode ET multiplexe, il est natif partout où le produit tourne (Safari iOS
 * 14.3+, Chrome), et le conteneur qu'il rend est directement lisible. WebCodecs
 * reste utilisé, mais pour ce qu'il fait vraiment bien ici : DIRE CE DONT
 * L'APPAREIL EST CAPABLE avant qu'on lui demande quoi que ce soit.
 *
 * ─── ET LE DÉCODAGE DES FORMATS iPhone ─────────────────────────────────────
 * MOV/HEVC n'est pas décodé par nous : il est donné à un `<video>`, donc au
 * décodeur du système. C'est ce qui rend le HEVC lisible sur Safari sans une
 * ligne de code — et c'est aussi pourquoi le repli ci-dessous existe, car un
 * navigateur qui ne sait pas ouvrir le fichier doit le DIRE, pas rendre une
 * vidéo noire de la bonne durée.
 */

/** 720p sur le côté long. Un crash se regarde pour comprendre un placement et
 *  un enchaînement, pas pour compter les rayures : au-delà, on paie du stockage
 *  qui n'apprend rien de plus au pilote. */
export const COTE_LONG = 720

/** 1,5 Mbit/s. À 720p c'est la zone où l'image reste nette sur un mouvement
 *  rapide sans que le fichier ne double. Trente secondes pèsent ~5 Mo. */
export const DEBIT = 1_500_000

const IPS = 30

/** Les conteneurs par ordre de préférence. WebM/VP8 d'abord parce que c'est ce
 *  que Chrome rend le mieux ; MP4 ensuite parce que c'est ce que Safari rend, et
 *  ce que le pilote pourra rouvrir ailleurs sans se poser de question. */
const FORMATS = [
  'video/mp4;codecs=avc1',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
]

export type Capacite = {
  /** Vrai quand le téléphone sait réellement ré-encoder. Faux = la vidéo part
   *  telle quelle, et le quota devient la seule borne. */
  comprime: boolean
  /** Le conteneur qui sortira, quand il y en a un. */
  format: string | null
  /** Ce qui s'affiche à l'écran. La couleur ne suffit jamais (UX-DR8). */
  raison: string
  /** Présent = l'appareil sait au moins décrire ses codecs. Sert à la sonde du
   *  spike, jamais à décider seul d'un versement. */
  webcodecs: boolean
}

export const capaciteVideo = (): Capacite => {
  const webcodecs = typeof globalThis !== 'undefined' && 'VideoEncoder' in globalThis
  if (typeof MediaRecorder === 'undefined')
    return {
      comprime: false, format: null, webcodecs,
      raison: 'Ce navigateur ne sait pas ré-encoder une vidéo : elle sera gardée telle quelle.',
    }
  const format = FORMATS.find((f) => {
    try { return MediaRecorder.isTypeSupported(f) } catch { return false }
  }) ?? null
  if (!format)
    return {
      comprime: false, format: null, webcodecs,
      raison: 'Aucun format d’enregistrement n’est disponible ici : la vidéo sera gardée telle quelle.',
    }
  if (typeof HTMLCanvasElement === 'undefined'
    || !('captureStream' in HTMLCanvasElement.prototype))
    return {
      comprime: false, format: null, webcodecs,
      raison: 'Ce navigateur ne sait pas capturer une image en continu : la vidéo sera gardée telle quelle.',
    }
  return { comprime: true, format, webcodecs, raison: `Compression en ${format.split(';')[0]}.` }
}

export type Mesure = { duree_ms: number; largeur: number; hauteur: number }

/** Ouvre le fichier avec le décodeur du système, le temps de lire ses mesures.
 *  Rend `null` quand le navigateur ne sait pas l'ouvrir — un MOV/HEVC sur un
 *  Android ancien, typiquement. C'est un refus utile, pas une panne. */
export const sonder = (fichier: Blob): Promise<Mesure | null> =>
  new Promise((resoudre) => {
    const url = URL.createObjectURL(fichier)
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.muted = true
    const finir = (m: Mesure | null) => {
      URL.revokeObjectURL(url)
      v.removeAttribute('src')
      resoudre(m)
    }
    v.onloadedmetadata = () => {
      const duree = Number.isFinite(v.duration) ? Math.round(v.duration * 1000) : 0
      if (!v.videoWidth || !v.videoHeight) return finir(null)
      finir({ duree_ms: duree, largeur: v.videoWidth, hauteur: v.videoHeight })
    }
    v.onerror = () => finir(null)
    v.src = url
  })

export type Comprimee = {
  blob: Blob
  duree_ms: number
  largeur: number
  hauteur: number
  /** Vrai si le fichier a réellement été ré-encodé. Faux = l'original est rendu
   *  tel quel, et l'écran doit le dire plutôt que de laisser croire au contraire. */
  reencodee: boolean
}

export type RefusCompression = { refus: string }

/** Le côté long ramené à `COTE_LONG`, en gardant les proportions et en évitant
 *  les dimensions impaires que certains encodeurs refusent. */
export const cadre = (largeur: number, hauteur: number, coteLong = COTE_LONG) => {
  const facteur = Math.min(1, coteLong / Math.max(largeur, hauteur))
  const pair = (n: number) => Math.max(2, Math.round(n * facteur / 2) * 2)
  return { largeur: pair(largeur), hauteur: pair(hauteur) }
}

/**
 * Ré-encode la vidéo en la jouant une fois à travers un canvas.
 *
 * ⚠ CELA PREND LE TEMPS DE LA VIDÉO, et c'est assumé. `MediaRecorder` enregistre
 * un flux, donc en temps réel : trente secondes de crash prennent trente
 * secondes à comprimer. C'est précisément pourquoi `DUREE_MAX_MS` existe et
 * pourquoi l'écran annonce l'attente au lieu de la subir — une barre qui avance
 * pendant trente secondes est acceptable, une application figée sans explication
 * ne l'est pas.
 */
export const comprimer = async (
  fichier: Blob, dureeMaxMs: number,
): Promise<Comprimee | RefusCompression> => {
  const mesure = await sonder(fichier)
  if (!mesure)
    return { refus: 'Ce format de vidéo ne s’ouvre pas sur cet appareil. Essaie un MP4.' }
  if (mesure.duree_ms > dureeMaxMs)
    return {
      refus: `Cette vidéo dure ${Math.round(mesure.duree_ms / 1000)} s et la limite est de `
        + `${Math.round(dureeMaxMs / 1000)} s. Découpe le passage qui montre la chute.`,
    }

  const capacite = capaciteVideo()
  // Le repli n'est pas un échec : la vidéo est gardée telle quelle, le quota
  // reste la borne, et l'appelant reçoit `reencodee: false` pour le dire.
  if (!capacite.comprime || !capacite.format)
    return { ...mesure, blob: fichier, reencodee: false }

  const { largeur, hauteur } = cadre(mesure.largeur, mesure.hauteur)
  const url = URL.createObjectURL(fichier)
  const v = document.createElement('video')
  v.src = url
  v.muted = true
  v.playsInline = true

  const nettoyer = () => {
    try { v.pause() } catch { /* déjà arrêtée */ }
    URL.revokeObjectURL(url)
    v.removeAttribute('src')
  }

  try {
    await new Promise<void>((res, rej) => {
      v.onloadeddata = () => res()
      v.onerror = () => rej(new Error('lecture impossible'))
    })

    const toile = document.createElement('canvas')
    toile.width = largeur
    toile.height = hauteur
    const pinceau = toile.getContext('2d')
    if (!pinceau) { nettoyer(); return { ...mesure, blob: fichier, reencodee: false } }

    const flux = toile.captureStream(IPS)
    const graveur = new MediaRecorder(flux, {
      mimeType: capacite.format,
      videoBitsPerSecond: DEBIT,
    })
    const morceaux: Blob[] = []
    graveur.ondataavailable = (e) => { if (e.data.size) morceaux.push(e.data) }

    const fini = new Promise<void>((res) => { graveur.onstop = () => res() })
    graveur.start(1000)

    let anime = true
    const peindre = () => {
      if (!anime) return
      pinceau.drawImage(v, 0, 0, largeur, hauteur)
      requestAnimationFrame(peindre)
    }
    await v.play()
    peindre()

    await new Promise<void>((res) => {
      v.onended = () => res()
      // Un `ended` qui n'arrive jamais laisserait l'écran bloqué sans rien dire.
      // La borne est la durée réelle plus une marge, jamais l'infini.
      setTimeout(res, mesure.duree_ms + 5_000)
    })

    anime = false
    graveur.stop()
    flux.getTracks().forEach((t) => t.stop())
    await fini
    nettoyer()

    const blob = new Blob(morceaux, { type: capacite.format.split(';')[0] })
    // Un ré-encodage qui rend un fichier vide ou PLUS GROS que l'original n'a
    // rien apporté : on garde l'original plutôt que de payer le pire des deux.
    if (!blob.size || blob.size >= fichier.size)
      return { ...mesure, blob: fichier, reencodee: false }
    return { blob, duree_ms: mesure.duree_ms, largeur, hauteur, reencodee: true }
  } catch {
    nettoyer()
    return { ...mesure, blob: fichier, reencodee: false }
  }
}
