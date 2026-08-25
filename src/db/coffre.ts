/**
 * LE COFFRE — les octets d'un fichier, sur CE téléphone, en attendant le réseau.
 *
 * ⚠ CE FICHIER EXISTE À CAUSE D'UN DÉFAUT BLOQUANT ET MESURÉ : la base de
 * production comptait ZÉRO photo et ZÉRO document depuis le premier jour. La
 * copie locale n'avait qu'un seul chemin d'écriture, `createWritable()`, et
 * cette méthode N'EXISTE PAS DANS SAFARI AVANT LA VERSION 26 — septembre 2025,
 * safari_ios en miroir (browser-compat-data, api/FileSystemFileHandle.json,
 * nœud createWritable). Sur iOS 18 et antérieur l'appel levait un TypeError :
 * aucune photo de roulage, aucun portrait de moto, aucun manuel d'atelier,
 * aucune facture. L'écran disait « L'image n'a pas pu être préparée sur ce
 * téléphone » — c'était exact, et c'était sans issue, faute de repli.
 *
 * LE REPLI EST INDEXEDDB, et ce n'est pas un contournement honteux :
 *   · Safari accepte les Blob en IndexedDB depuis toujours ;
 *   · c'est le MÊME quota d'origine, couvert par le MÊME
 *     `navigator.storage.persist()` que l'OPFS (AD-5) — le repli ne sort pas de
 *     la protection contre l'éviction ;
 *   · et il NE VIOLE PAS AD-4. Vérifié à la ligne, dans
 *     _bmad-output/planning-artifacts/architecture/
 *     architecture-MyPaddock-2026-08-18/ARCHITECTURE-SPINE.md : AD-4 prévient
 *     « qu'une unité pousse une écriture dans une file de requêtes du Service
 *     Worker en croyant l'avoir enregistrée », et sa règle conclut « Aucune file
 *     de requêtes n'est utilisée pour des données métier ». Ce qui est interdit
 *     est LA FILE DE REQUÊTES DU SERVICE WORKER et sa rétention de sept jours,
 *     pas IndexedDB — où vit d'ailleurs déjà, par nécessité, le repli de VFS de
 *     PowerSync. Ici l'écriture est TERMINÉE quand l'appelant reprend la main :
 *     c'est exactement ce qu'AD-4 exige.
 *
 * TROIS FONCTIONS POUR UN FICHIER — `ecrireLocale`, `lireLocale`,
 * `effacerLocale`. Ce sont les trois seuls points de passage : photos de
 * roulage, portraits de machine, skins d'équipement, manuels et factures les
 * traversent tous. Un quatrième chemin qui parlerait directement à l'OPFS
 * ramènerait le défaut par la porte de derrière.
 *
 * DEUX FONCTIONS POUR L'ENSEMBLE — `inventaireDuCoffre` et `viderLeCoffre`.
 * Elles vivent ici pour la MÊME raison que les trois autres : ce fichier est le
 * seul endroit qui sache qu'il y a DEUX magasins.
 *
 * ⚠ `effacerLeTelephone` NE BALAYAIT QUE L'OPFS, et c'était un écran qui mentait
 * sur un droit. Sur tout iOS ≤ 18 — exactement la population pour laquelle ce
 * coffre existe — le pilote qui exerçait son droit à l'effacement lisait « Il ne
 * reste rien … 0 fichier » pendant que TOUTES ses photos, tous ses portraits et
 * tous ses manuels restaient sur l'appareil, dans `mypaddock-coffre`, qu'aucune
 * des trois étapes de l'effacement ne touchait. Le nombre annoncé à l'écran
 * vient donc d'ici, où les deux magasins se voient — et il est compté, pas
 * supposé.
 */

/* ─── LE CHOIX DU MAGASIN — par capacité éprouvée, jamais par nom de navigateur ─
   Une chaîne d'agent utilisateur ment : elle est gelée, falsifiable, et elle ne
   dit rien d'un WebView embarqué ou d'un mode privé qui refuse le stockage. On
   ne demande donc pas QUI est le navigateur, on demande CE QU'IL SAIT FAIRE —
   et on le lui fait faire pour de vrai. */

export type Magasin = 'opfs' | 'indexeddb'

export type Capacite = {
  /** Celui dans lequel on écrit. Le seul des deux qui soit un choix. */
  magasin: Magasin
  /** `navigator.storage.getDirectory()` répond. Vrai depuis Safari 15.2. */
  opfs: boolean
  /** L'API manquante de tout Safari antérieur à la 26. */
  createWritable: boolean
  /** Un octet réellement écrit puis relu. C'est la seule preuve qui compte : une
   *  méthode présente peut échouer (mode privé, quota nul, WebView bridée). */
  ecritureEprouvee: boolean
  /** Ce qui se dit à l'écran. La couleur ne suffit jamais (UX-DR8). */
  raison: string
}

const DOSSIER = 'photos'
/** Le nom du fichier d'épreuve commence par un point : il ne peut collisionner
 *  avec aucun nom local du produit, qui dérivent tous d'un UUID ou d'un préfixe. */
const FICHIER_EPREUVE = '.epreuve-ecriture'
/** L'octet de l'épreuve. Un aller-retour se vérifie sur la VALEUR relue, pas
 *  sur la taille : un magasin qui rend un octet nul rend bien « un octet ». */
const OCTET_EPREUVE = 0x4d

/**
 * LA RÈGLE DU POINT, ET ELLE VAUT DANS LES DEUX MAGASINS : un nom qui commence
 * par un point n'appartient pas au pilote. C'est l'instrumentation du coffre —
 * elle ne se compte jamais, ni à l'inventaire de la sonde, ni dans le nombre
 * annoncé par l'écran de l'effacement.
 *
 * Elle n'est pas une commodité : le retrait de l'épreuve est un `catch` muet —
 * il DOIT l'être, une épreuve qui refuse de partir ne justifie pas de refuser
 * une photo — donc le jour où il échoue, un témoin reste dans le dossier. Sans
 * cette règle, il compterait comme une photo, et un essai qui prenait le premier
 * nom du dossier à l'aveugle lirait le témoin à la place du cliché.
 */
const estUnTemoin = (nom: string) => nom.startsWith('.')

const dossierPhotos = async () => {
  const racine = await navigator.storage.getDirectory()
  return racine.getDirectoryHandle(DOSSIER, { create: true })
}

/**
 * TOUT CHEMIN QUI MÈNE AU REPLI PASSE PAR ICI, ET IL ÉPROUVE LE REPLI.
 *
 * ⚠ LA SONDE N'ÉPROUVAIT PAS LE MAGASIN QU'ELLE ANNONÇAIT. `eprouverLeCoffre`
 * rendait `ecritureEprouvee: false` sur TOUS les chemins IndexedDB sans avoir
 * jamais tenté la moindre écriture IndexedDB : elle validait rigoureusement le
 * magasin qu'on n'utilise pas, et pas celui par lequel tout passe. Sur un
 * iPhone d'avant Safari 26 — le cas nominal de ce coffre — la sonde affichait
 * donc « repli IndexedDB » en gris à vie, sans jamais rien avoir vérifié. C'est
 * le défaut d'origine déplacé d'un cran, pas corrigé.
 *
 * Éprouver ici rend possible la seule phrase qui mérite vraiment une alerte, et
 * qui n'existait nulle part avant : AUCUN MAGASIN N'ÉCRIT.
 */
const replier = async (
  opfs: boolean, createWritable: boolean, pourquoi: string,
): Promise<Capacite> => {
  const ecritureEprouvee = await eprouverIdb()
  return {
    magasin: 'indexeddb', opfs, createWritable, ecritureEprouvee,
    raison: ecritureEprouvee
      ? `IndexedDB — écriture éprouvée (${pourquoi})`
      : `AUCUN MAGASIN N'ÉCRIT sur ce téléphone — ${pourquoi}, et IndexedDB a refusé aussi`,
  }
}

/**
 * L'ÉPREUVE. Elle écrit un octet et le relit — parce que « la méthode existe »
 * et « l'écriture aboutit » sont deux affirmations différentes, et que seule la
 * seconde intéresse une photo de paddock.
 *
 * Elle est exportée telle quelle, sans mémoire, pour que la sonde puisse la
 * refaire à la demande et montrer l'état réel de l'appareil.
 */
export const eprouverLeCoffre = async (): Promise<Capacite> => {
  const opfs = typeof navigator !== 'undefined' && !!navigator.storage?.getDirectory
  const createWritable = typeof FileSystemFileHandle !== 'undefined'
    && typeof FileSystemFileHandle.prototype?.createWritable === 'function'

  if (!opfs) return replier(opfs, createWritable, "pas d'OPFS sur cet appareil")
  // ⚠ CE N'EST PLUS UNE PANNE, ET LE MOT DOIT LE DIRE. Depuis que le repli
  // existe, un Safari d'avant la 26 n'est pas un appareil en défaut : c'est un
  // appareil qui écrit ailleurs, et qui écrit. La phrase le dit, et le ton de la
  // sonde le dit avec elle — la couleur n'est jamais seule (UX-DR8).
  if (!createWritable) return replier(opfs, createWritable, 'createWritable absent avant Safari 26')
  try {
    const dossier = await dossierPhotos()
    const h = await dossier.getFileHandle(FICHIER_EPREUVE, { create: true })
    const w = await h.createWritable()
    await w.write(new Uint8Array([OCTET_EPREUVE]))
    await w.close()
    const relus = new Uint8Array(await (await h.getFile()).arrayBuffer())
    // ⚠ ON RETIRE L'ÉPREUVE. Sans ça, l'inventaire de la sonde compterait un
    // fichier que le produit ne connaît pas, et le pilote lirait « 4 photos
    // rangées » pour trois photos.
    await dossier.removeEntry(FICHIER_EPREUVE).catch(() => { /* la règle du point le tient hors des comptes */ })
    if (relus.length !== 1 || relus[0] !== OCTET_EPREUVE) {
      return replier(opfs, createWritable, "l'écriture OPFS n'a pas rendu son octet")
    }
    return { magasin: 'opfs', opfs, createWritable, ecritureEprouvee: true,
      raison: 'OPFS — écriture éprouvée' }
  } catch (e) {
    return replier(opfs, createWritable,
      'écriture OPFS refusée (' + (e as Error).message.slice(0, 40) + ')')
  }
}

/** LE CHOIX SE FAIT UNE FOIS PAR SESSION. Refaire l'épreuve à chaque photo
 *  ferait une écriture parasite par cliché, sur un stockage déjà compté. */
let choix: Promise<Capacite> | null = null

export const capaciteLocale = (): Promise<Capacite> => (choix ??= eprouverLeCoffre())

/**
 * ⚠ RÉSERVÉ AUX ESSAIS. Un choix mémorisé qu'aucun essai ne peut refaire est un
 * choix qu'aucun essai ne peut éprouver — et l'essai qui simule l'absence de
 * `createWritable` après coup ne prouverait rien du tout.
 */
export const oublierLeMagasin = () => { choix = null }

/** L'appareil vient de refuser une écriture OPFS qu'il disait savoir faire. On
 *  ne le lui redemande pas à chaque photo de la journée : on bascule — et on
 *  ÉPROUVE le magasin sur lequel on bascule, sans quoi la sonde annoncerait un
 *  repli dont personne n'aurait vérifié qu'il écrit. */
const retrograder = async (pourquoi: string) => {
  const c = await capaciteLocale()
  choix = replier(c.opfs, c.createWritable, pourquoi)
}

/* ─── LE MAGASIN INDEXEDDB ────────────────────────────────────────────────── */

const NOM_COFFRE = 'mypaddock-coffre'
const RAYON = 'fichiers'

type Range = { blob: Blob; type: string; modifie: number }

let coffre: Promise<IDBDatabase> | null = null

/**
 * ⚠ UNE CONNEXION INDEXEDDB PEUT MOURIR EN COURS DE SESSION, et ce n'est pas un
 * cas de laboratoire : WebKit ferme les connexions d'une page mise en cache
 * arrière/avant — c'est-à-dire après un simple aller-retour vers l'appareil
 * photo, le geste le plus fréquent de ce produit.
 *
 * Le handle mémorisé devenait alors mort SANS QUE RIEN NE LE DISE :
 * `transaction()` levait `InvalidStateError` pour TOUT LE RESTE DE LA SESSION,
 * et l'écran réaffichait « L'image n'a pas pu être préparée sur ce téléphone » —
 * le symptôme exact que ce coffre existe pour faire disparaître. Une photo par
 * session passait, et plus aucune ensuite.
 *
 * Deux écoutes suffisent à l'entendre : `onclose` pour la fermeture SUBIE,
 * `onversionchange` pour celle qu'un autre onglet réclame. Dans les deux cas on
 * OUBLIE la connexion, pour que la suivante s'ouvre au lieu d'être ressortie
 * morte du cache.
 */
const ouvrirCoffre = (): Promise<IDBDatabase> => {
  if (coffre) return coffre
  const promesse = new Promise<IDBDatabase>((tenir, rendre) => {
    // On n'oublie QUE si c'est encore celle-ci qui est mémorisée : une fermeture
    // tardive ne doit pas jeter la connexion qui l'a déjà remplacée.
    const oublier = () => { if (coffre === promesse) coffre = null }
    const d = indexedDB.open(NOM_COFFRE, 1)
    d.onupgradeneeded = () => { d.result.createObjectStore(RAYON) }
    d.onsuccess = () => {
      const base = d.result
      base.onclose = oublier
      // `close()` NE DÉCLENCHE PAS `onclose` — la spécification le réserve à la
      // fermeture subie. On oublie donc explicitement avant de fermer, sans quoi
      // le coffre garderait un handle qu'il vient lui-même de tuer.
      base.onversionchange = () => { oublier(); base.close() }
      tenir(base)
    }
    // Une base qui ne s'ouvre pas ne doit pas rester mémorisée : le mode privé de
    // Safari refuse parfois la première ouverture et accepte la suivante.
    d.onerror = () => { oublier(); rendre(d.error ?? new Error('IndexedDB a refusé de s\'ouvrir')) }
    d.onblocked = () => { oublier(); rendre(new Error('IndexedDB est bloqué par un autre onglet')) }
  })
  coffre = promesse
  return promesse
}

/**
 * ⚠ EN ÉCRITURE, ON ATTEND LA TRANSACTION, PAS LA REQUÊTE. Un `put` peut
 * réussir et la transaction avorter juste après — dépassement de quota, base
 * fermée sous les doigts. Rendre la main sur `onsuccess` reviendrait à annoncer
 * une photo rangée qui ne l'est pas : c'est précisément le défaut qu'AD-4
 * interdit, sous une autre forme.
 */
const unePasse = async <T>(
  mode: IDBTransactionMode, agir: (r: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
  const base = await ouvrirCoffre()
  return new Promise<T>((tenir, rendre) => {
    // `transaction()` lève ICI, de façon synchrone, quand la connexion est
    // morte : le rejet de cette promesse est donc bien le chemin de la panne.
    const tx = base.transaction(RAYON, mode)
    const req = agir(tx.objectStore(RAYON))
    req.onerror = () => rendre(req.error ?? new Error('IndexedDB a refusé la requête'))
    if (mode === 'readonly') req.onsuccess = () => tenir(req.result)
    else {
      tx.oncomplete = () => tenir(req.result)
      tx.onabort = () => rendre(tx.error ?? new Error('IndexedDB a annulé l\'écriture'))
    }
  })
}

/**
 * UNE SEULE NOUVELLE TENTATIVE, ET SUR UN SEUL MOTIF.
 *
 * `InvalidStateError` est le nom que la spécification donne à « ta connexion est
 * morte » — le seul échec qu'une réouverture puisse réparer. Un dépassement de
 * quota ou une transaction avortée, eux, se reproduiraient à l'identique :
 * les rejouer écrirait deux fois la même panne, et une boucle de tentatives
 * serait pire que l'erreur qu'elle prétend rattraper.
 */
const enRayon = async <T>(
  mode: IDBTransactionMode, agir: (r: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
  try {
    return await unePasse<T>(mode, agir)
  } catch (e) {
    if ((e as Error | null)?.name !== 'InvalidStateError') throw e
    coffre = null
    return await unePasse<T>(mode, agir)
  }
}

/**
 * ⚠ RÉSERVÉ AUX ESSAIS. Ferme la connexion SANS l'oublier — exactement ce que
 * subit une page mise en cache arrière/avant : `close()` ne déclenche pas
 * `onclose`, donc le coffre garde un handle mort et croit encore l'avoir. C'est
 * la seule façon de fabriquer à la demande la panne que la seconde chance
 * ci-dessus répare.
 *
 * Elle rend la connexion tuée pour que l'essai puisse vérifier qu'elle est bien
 * morte : sans les DEUX SENS — elle refuse, et le coffre écrit quand même — un
 * essai vert ne prouverait rien du tout. Et un essai qui lui envoie un événement
 * `close` éprouve l'autre moitié du correctif : celle qui OUBLIE la connexion.
 */
export const fermerLaConnexionDuCoffre = async (): Promise<IDBDatabase> => {
  const base = await ouvrirCoffre()
  base.close()
  return base
}

const ecrireIdb = async (nom: string, blob: Blob) => {
  const range: Range = { blob, type: blob.type, modifie: Date.now() }
  await enRayon('readwrite', (r) => r.put(range, nom))
}

const lireIdb = async (nom: string): Promise<File | null> => {
  try {
    const range = await enRayon<Range | undefined>('readonly', (r) => r.get(nom))
    if (!range?.blob) return null
    // On rend un File et non un Blob : tout le produit en aval en attend un —
    // `URL.createObjectURL`, le téléversement Supabase, l'export d'emport.
    return new File([range.blob], nom, { type: range.type || range.blob.type, lastModified: range.modifie })
  } catch { return null }
}

const effacerIdb = async (nom: string) => {
  try { await enRayon('readwrite', (r) => r.delete(nom)) } catch { /* déjà partie */ }
}

/**
 * L'ALLER-RETOUR D'UN OCTET DANS INDEXEDDB — la moitié qui manquait à l'épreuve.
 *
 * Écrire, relire, comparer la VALEUR, puis retirer le témoin. C'est ce qui
 * permet à `replier()` de dire « éprouvée » sans mentir, et de dire « aucun
 * magasin n'écrit » quand c'est vrai. Le retrait est muet parce qu'il doit
 * l'être — un témoin qui refuse de partir ne justifie pas de refuser une photo —
 * et la règle du point le tient de toute façon hors des comptes.
 */
const eprouverIdb = async (): Promise<boolean> => {
  try {
    const temoin: Range = {
      blob: new Blob([new Uint8Array([OCTET_EPREUVE])]), type: '', modifie: Date.now(),
    }
    await enRayon('readwrite', (r) => r.put(temoin, FICHIER_EPREUVE))
    const relu = await enRayon<Range | undefined>('readonly', (r) => r.get(FICHIER_EPREUVE))
    const octets = relu?.blob ? new Uint8Array(await relu.blob.arrayBuffer()) : new Uint8Array()
    await enRayon('readwrite', (r) => r.delete(FICHIER_EPREUVE))
      .catch(() => { /* la règle du point le tient hors des comptes */ })
    return octets.length === 1 && octets[0] === OCTET_EPREUVE
  } catch { return false }
}

/* ─── LE MAGASIN OPFS ─────────────────────────────────────────────────────── */

const ecrireOpfs = async (nom: string, blob: Blob) => {
  const dossier = await dossierPhotos()
  const h = await dossier.getFileHandle(nom, { create: true })
  const w = await h.createWritable()
  await w.write(blob)
  await w.close()
}

/** ⚠ LA LECTURE OPFS NE DEMANDE QUE `getFile()`, disponible depuis Safari 15.2.
 *  C'est ce qui rend le chemin de repli symétrique : même un appareil qui ne
 *  SAIT PLUS écrire dans l'OPFS peut toujours y relire ce qu'il y a mis. */
const lireOpfs = async (nom: string): Promise<File | null> => {
  try {
    const dossier = await dossierPhotos()
    return await (await dossier.getFileHandle(nom)).getFile()
  } catch { return null }
}

const effacerOpfs = async (nom: string) => {
  try { await (await dossierPhotos()).removeEntry(nom) } catch { /* déjà partie */ }
}

/* ─── LES TROIS SEULS POINTS DE PASSAGE ───────────────────────────────────── */

/**
 * Écrire dans le magasin choisi — et RETOMBER SUR SES PIEDS si celui-ci refuse.
 * Une photo qui n'a pas pu s'écrire est une photo perdue : le repli ne peut pas
 * attendre la prochaine ouverture de l'application.
 *
 * Le jumeau de même nom part de l'autre magasin. Ce n'est pas nécessaire à la
 * justesse — la lecture commence toujours par le magasin en usage, donc la copie
 * fraîche gagne — mais un portrait de moto remplacé dix fois laisserait sinon
 * dix octets morts derrière lui, dans un quota qu'on partage avec la base.
 */
export const ecrireLocale = async (nom: string, blob: Blob) => {
  if ((await capaciteLocale()).magasin === 'opfs') {
    try {
      await ecrireOpfs(nom, blob)
      await effacerIdb(nom)
      return
    } catch (e) {
      await retrograder('OPFS a lâché en cours de route (' + (e as Error).message.slice(0, 40) + ') — repli IndexedDB')
    }
  }
  await ecrireIdb(nom, blob)
  await effacerOpfs(nom)
}

/**
 * ⚠ LA LECTURE CHERCHE DANS LES DEUX MAGASINS, ET C'EST LE VRAI PIÈGE DE CE
 * CORRECTIF. Un pilote sur iOS 18 range toutes ses photos en IndexedDB ; il met
 * son téléphone à jour ; `createWritable` apparaît, le magasin choisi devient
 * l'OPFS — et une lecture qui ne regarderait que là rendrait INVISIBLES toutes
 * les photos déjà versées. Elles seraient intactes sur l'appareil et absentes de
 * l'écran, ce qui est la pire des deux façons de perdre quelque chose.
 *
 * L'ordre part du magasin en usage : la copie la plus récente est forcément là.
 */
export const lireLocale = async (nom: string): Promise<File | null> => {
  const prefere = (await capaciteLocale()).magasin
  const f = prefere === 'opfs' ? await lireOpfs(nom) : await lireIdb(nom)
  if (f) return f
  return prefere === 'opfs' ? await lireIdb(nom) : await lireOpfs(nom)
}

/** Effacer, c'est effacer DES DEUX CÔTÉS. Un oubli laisserait la copie de
 *  l'autre magasin ressusciter la photo au prochain affichage — une journée
 *  retirée par le pilote qui revient toute seule. */
export const effacerLocale = async (nom: string) => {
  await effacerOpfs(nom)
  await effacerIdb(nom)
}

/* ─── L'INVENTAIRE, POUR LA SONDE ─────────────────────────────────────────── */

/** Ce que chaque magasin contient réellement. C'est ce qui rend le piège
 *  ci-dessus visible : des fichiers rangés d'un côté pendant qu'on écrit de
 *  l'autre, ça se lit ici avant de se perdre à l'écran. */
export const inventaireDuCoffre = async (): Promise<{ opfs: number; indexeddb: number }> => {
  const { opfs, indexeddb } = await nomsDuCoffre()
  return { opfs: opfs.length, indexeddb: indexeddb.length }
}

/** Les NOMS, et pas seulement leur nombre : compter est un cas particulier de
 *  lister, et l'effacement a besoin de la liste pour dire un vrai chiffre.
 *  Les témoins du coffre en sont exclus des deux côtés — règle du point. */
export const nomsDuCoffre = async (): Promise<{ opfs: string[]; indexeddb: string[] }> => {
  const opfs: string[] = []
  try {
    const dossier = await dossierPhotos()
    for await (const [nom] of dossier.entries()) if (!estUnTemoin(nom)) opfs.push(nom)
  } catch { /* pas d'OPFS : zéro, et c'est une réponse */ }
  let indexeddb: string[] = []
  try {
    // `getAllKeys()` et non `count()` : un témoin dont le retrait a échoué doit
    // pouvoir être écarté, et un nombre nu ne se filtre pas.
    const cles = await enRayon<IDBValidKey[]>('readonly', (r) => r.getAllKeys())
    indexeddb = cles.map(String).filter((n) => !estUnTemoin(n))
  } catch { /* idem */ }
  return { opfs, indexeddb }
}

/**
 * ⚠ LE MÊME INVENTAIRE, SANS LA LENTILLE — réservé au banc.
 *
 * `nomsDuCoffre` écarte les témoins par la règle du point, et c'est juste : ce
 * qui commence par un point n'appartient pas au pilote et n'a rien à faire dans
 * un décompte qu'on lui montre.
 *
 * Mais un ESSAI qui vérifie « l'épreuve n'a laissé aucun témoin » à travers ce
 * filtre-là regarde le témoin par la lentille qui le cache : il ne peut pas
 * rougir. C'est le cas — vérifié le 25 août en retirant les DEUX retraits de
 * témoin : les essais restaient verts. Une garde qui ne peut pas échouer est une
 * garde absente qui se croit présente, et c'est le défaut que ce dépôt traque.
 */
export const nomsBrutsDuCoffre = async (): Promise<{ opfs: string[]; indexeddb: string[] }> => {
  const opfs: string[] = []
  try {
    const dossier = await dossierPhotos()
    for await (const [nom] of dossier.entries()) opfs.push(nom)
  } catch { /* pas d'OPFS : zéro, et c'est une réponse */ }
  let indexeddb: string[] = []
  try {
    indexeddb = (await enRayon<IDBValidKey[]>('readonly', (r) => r.getAllKeys())).map(String)
  } catch { /* idem */ }
  return { opfs, indexeddb }
}

/**
 * VIDER LE COFFRE — LES DEUX MAGASINS, ET LE VRAI COMPTE.
 *
 * ⚠ C'EST LE CORRECTIF D'UN ÉCRAN QUI MENTAIT SUR UN DROIT. L'effacement de
 * compte ne balayait que l'OPFS : sur tout iOS ≤ 18, où pas un seul fichier ne
 * passe par l'OPFS, le pilote lisait « Il ne reste rien … 0 fichier » pendant
 * que toutes ses photos, tous ses portraits et tous ses manuels restaient dans
 * `mypaddock-coffre`. Ni `disconnectAndClear()`, ni `effacerLesReglages()`, ni
 * personne d'autre ne touchait cette base.
 *
 * LE NOMBRE RENDU EST CELUI QUI S'AFFICHE, donc il est COMPTÉ, jamais supposé :
 * on relève les noms avant de retirer, et un fichier présent dans les deux
 * magasins — le jumeau qu'`ecrireLocale` s'efforce d'effacer — ne compte qu'une
 * fois. Un `Set` plutôt qu'une addition : deux copies du même souvenir, ce n'est
 * pas deux souvenirs.
 *
 * On VIDE le magasin, on ne SUPPRIME PAS la base : `deleteDatabase()` reste
 * bloqué tant qu'une connexion est ouverte — la nôtre l'est — et rendrait une
 * promesse qui ne se résout jamais, c'est-à-dire un écran d'effacement figé.
 */
export const viderLeCoffre = async (): Promise<number> => {
  const partis = new Set<string>()

  try {
    const dossier = await dossierPhotos()
    // On liste AVANT de retirer : retirer pendant qu'on itère laisse des entrées
    // derrière soi, et un effacement partiel est le défaut qu'on corrige ici.
    const noms: string[] = []
    for await (const [nom] of dossier.entries()) noms.push(nom)
    for (const nom of noms) {
      // Les témoins partent aussi — ils ne se comptent simplement pas.
      try { await dossier.removeEntry(nom) } catch { continue }
      if (!estUnTemoin(nom)) partis.add(nom)
    }
  } catch { /* pas d'OPFS, ou pas de dossier : rien à retirer de ce côté */ }

  try {
    const cles = await enRayon<IDBValidKey[]>('readonly', (r) => r.getAllKeys())
    await enRayon('readwrite', (r) => r.clear())
    for (const c of cles) if (!estUnTemoin(String(c))) partis.add(String(c))
  } catch { /* IndexedDB indisponible : il n'y avait rien à y prendre */ }

  return partis.size
}
