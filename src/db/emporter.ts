import type { PowerSyncDatabase } from '@powersync/web'
import { lireLocale, nomLocal, photoMachine, type Photo } from './photos'
import { CAPS_EMBARQUES } from './corpus'
import { ORDRE } from './sauvegarde'

/**
 * EMPORTER SA SAISON — NFR-6, FR-27.
 *
 * « Le dernier filet quand tous les autres cèdent. » Trois propriétés font ce
 * filet, et aucune n'est décorative :
 *
 *   ① IL SE PRODUIT ICI, sans réseau. Un export qui appelle le serveur n'est
 *     d'aucun secours le jour où le serveur est le problème — compte perdu,
 *     projet suspendu, produit arrêté. Tout sort de la base locale.
 *
 *   ② IL SE LIT SANS MYPADDOCK. Le fichier porte ses propres conventions :
 *     centimes, millisecondes, dates ISO. Sans elles, « 9730 » est un nombre
 *     sans unité et la saison est illisible dans cinq ans.
 *
 *   ③ IL DIT CE QU'IL NE CONTIENT PAS. Une photo restée au serveur, un roulage
 *     encore en attente d'envoi : le fichier les nomme au lieu de les taire.
 *     Un filet qui ment sur ses trous n'est pas un filet.
 *
 * Le RÉFÉRENTIEL n'en fait pas partie — circuits, conseils, catalogue : ce
 * n'est pas la donnée du pilote, et elle se retrouve partout ailleurs. Seuls
 * les libellés de caps réellement cités descendent, pour que « genou_gauche »
 * reste lisible.
 */

export const FORMAT = 1

/**
 * LES TABLES DE PILOTE, ET ELLES SEULEMENT — et elles ne se recopient plus.
 *
 * ⚠ CETTE LISTE ÉTAIT ÉCRITE À LA MAIN, ET ELLE AVAIT SIX TABLES DE RETARD.
 * Elle en portait onze quand la sauvegarde en synchronisait dix-sept : il
 * manquait `equipement`, `chute`, `evenement_vise`, `horloge`,
 * `checklist_ligne` et `document`. L'équipement, les chutes consignées, les
 * horloges d'usure et les preuves d'atelier ne sortaient pas — et le fichier
 * écrivait quand même « rien — tout ce que porte ce téléphone est ici ».
 *
 * C'est la propriété ③ que l'en-tête de ce fichier se donne : un emport qui
 * ment sur ses trous est pire qu'un emport incomplet, parce qu'on ne va pas
 * chercher ailleurs ce qu'on croit tenir.
 *
 * Une liste tenue à la main diverge à la table suivante. Celle-ci est donc
 * DÉRIVÉE de `ORDRE`, la liste d'envoi — même source, même vérité — et un essai
 * unitaire vérifie qu'elles ne se séparent pas.
 */
const TABLES = ORDRE

/** Une photo — ou une vidéo — dont le retrait est demandé n'est plus une donnée
 * à emporter. Le tombstone reste dans la base uniquement pour finir l'effacement
 * Storage ; l'exporter révélerait encore son chemin et la ressusciterait à la
 * restauration. Les deux tables portent le même `etat` et la même clause. */
const filtreEmport = (table: string) =>
  table === 'photo' || table === 'video' ? ` WHERE etat != 'a_supprimer'` : ''

/** Rendue au banc : c'est la clause « l'emport sort ce que la sauvegarde
 *  envoie » qui protège contre la divergence, pas la bonne volonté. */
export const TABLES_EMPORTEES: readonly string[] = TABLES

const CONVENTIONS = {
  argent: 'les montants sont des CENTIMES entiers — 24550 vaut 245,50 €',
  chrono: 'les temps sont des MILLISECONDES entières — 97300 vaut 1\'37"3',
  date: 'les dates sont au format ISO AAAA-MM-JJ',
  identifiant: 'les identifiants sont des UUID v7 : leurs 48 premiers bits '
    + "portent l'instant d'écriture en millisecondes depuis 1970",
  saison: "la saison n'est pas une plage de dates : c'est l'année du roulage, "
    + 'du premier au dernier saisi',
  historique_crash: 'les statuts et récits de crash sont auto-déclarés par le pilote, '
    + "sans constat ni vérification par MyPaddock",
}

export type Poids = {
  lignes: number
  /** Photos dont la copie locale existe, donc joignables au fichier. */
  photos: number
  octetsPhotos: number
  /** Photos connues de la base mais SANS copie locale : elles ne peuvent pas
   *  être jointes, et le fichier le dira au lieu de les passer sous silence. */
  photosAbsentes: number
}

const photosLocales = async (db: PowerSyncDatabase) => {
  const toutes = await db.getAll<Photo>(
    `SELECT id, roulage_id, machine_id, intervention_id, chute_id, geste_id,
            chemin_objet, largeur, hauteur, etat, genre
       FROM photo WHERE etat != 'a_supprimer' ORDER BY id`)
  const presentes: { photo: Photo; fichier: File }[] = []
  const absentes: Photo[] = []
  for (const p of toutes) {
    const f = await lireLocale(nomLocal(p))
    if (f) presentes.push({ photo: p, fichier: f })
    else absentes.push(p)
  }
  return { presentes, absentes }
}

export const peser = async (db: PowerSyncDatabase): Promise<Poids> => {
  let lignes = 0
  for (const t of TABLES) {
    const r = await db.get<{ n: number }>(
      `SELECT count(*) AS n FROM ${t}${filtreEmport(t)}`)
    lignes += r.n
  }
  const { presentes, absentes } = await photosLocales(db)
  // Les portraits de machine comptent aussi : annoncer un poids qui les ignore
  // reviendrait à annoncer un fichier plus léger que celui qu'on livre, et le
  // pilote décide sur ce chiffre-là, souvent en 4G.
  const portraits = await db.getAll<{ photo_chemin: string | null }>(
    `SELECT photo_chemin FROM machine WHERE photo_chemin IS NOT NULL`)
  let n = 0, octets = 0, sansCopie = 0
  for (const m of portraits) {
    const f = await photoMachine(m.photo_chemin)
    if (f) { n++; octets += f.size } else sansCopie++
  }
  return {
    lignes,
    photos: presentes.length + n,
    octetsPhotos: presentes.reduce((s, p) => s + p.fichier.size, 0) + octets,
    photosAbsentes: absentes.length + sansCopie,
  }
}

const enDataUri = (b: Blob) => new Promise<string>((res, rej) => {
  const l = new FileReader()
  l.onload = () => res(l.result as string)
  l.onerror = () => rej(l.error ?? new Error('lecture impossible'))
  l.readAsDataURL(b)
})

/**
 * Le fichier. `avecPhotos` est un CHOIX DU PILOTE et non un réglage : un emport
 * sans les images tient dans un courriel, un emport avec elles est complet.
 * Les deux sont honnêtes tant que le fichier dit lequel il est.
 */
export const composer = async (
  db: PowerSyncDatabase, avecPhotos: boolean, jour = new Date().toISOString(),
): Promise<File> => {
  const donnees: Record<string, unknown[]> = {}
  for (const t of TABLES)
    donnees[t] = await db.getAll(`SELECT * FROM ${t}${filtreEmport(t)}`)

  // Les libellés des caps CITÉS, pour que le fichier s'explique tout seul. La
  // base fait autorité quand elle a quelque chose, le repli embarqué sinon —
  // même règle que partout ailleurs, et pour la même raison : le référentiel
  // descend par synchronisation et n'existe pas au premier lancement.
  const cites = new Set((donnees.geste as { cap_code: string }[]).map((g) => g.cap_code))
  const enBase = await db.getAll<{ code: string; libelle: string }>(`SELECT code, libelle FROM cap`)
  const caps: Record<string, string> = {}
  for (const c of [...CAPS_EMBARQUES, ...enBase]) if (cites.has(c.code)) caps[c.code] = c.libelle

  const { presentes, absentes } = await photosLocales(db)
  const manques: string[] = []

  // La photo de MACHINE ne vit pas dans la table `photo` : elle est dans l'OPFS,
  // désignée par `machine.photo_chemin`. Elle échappait donc entièrement à
  // l'emport — et l'effacement la détruit juste après l'avoir proposé. Elle est
  // jointe comme les autres, et nommée quand elle ne l'est pas.
  const portraits = (await db.getAll<{ id: string; photo_chemin: string | null }>(
    `SELECT id, photo_chemin FROM machine WHERE photo_chemin IS NOT NULL`))
  const portraitsLus: { nom: string; fichier: File }[] = []
  for (const m of portraits) {
    const f = await photoMachine(m.photo_chemin)
    if (f) portraitsLus.push({ nom: `machine-${m.id}.${f.name.split('.').pop()}`, fichier: f })
    else manques.push(`la photo de la moto ${m.id} n'a pas de copie dans ce téléphone`)
  }
  if (!avecPhotos && portraitsLus.length)
    manques.push(`${portraitsLus.length} photo(s) de moto : emport demandé sans les images`)
  if (!avecPhotos && presentes.length)
    manques.push(`${presentes.length} photo(s) : emport demandé sans les images`)
  if (absentes.length)
    manques.push(`${absentes.length} photo(s) sans copie dans ce téléphone — `
      + `elles vivent au serveur, à ces chemins : ${absentes.map((p) => p.chemin_objet).join(', ')}`)

  // ⚠ LES VIDÉOS NE SONT JAMAIS JOINTES, ET CE N'EST PAS UN OUBLI.
  // Une vignette en base64 pèse 400 Ko et la partie lisible du fichier lui
  // survit. Le quota vidéo est de 500 Mo : les encoder ici produirait un JSON
  // de 700 Mo qu'aucun éditeur n'ouvre, que le navigateur ne sait pas composer
  // en mémoire, et qui échouerait au moment précis où le pilote croit sauver
  // son carnet. Leurs LIGNES partent — identifiants, liens vers la chute et la
  // journée, poids, durée, chemin — donc les relations sont conservées et
  // l'emport reste exploitable. Ce qui manque est dit, comme le reste.
  const videos = (donnees.video ?? []) as { chemin_objet: string }[]
  if (videos.length)
    manques.push(`${videos.length} vidéo(s) : leurs octets ne rentrent pas dans un fichier `
      + `de carnet et ne sont jamais joints. Les lignes et leurs liens sont ici ; `
      + `les fichiers vivent au stockage privé, à ces chemins : `
      + `${videos.map((v) => v.chemin_objet).join(', ')}`)

  const contenu: Record<string, unknown> = {
    produit: 'MyPaddock',
    format: FORMAT,
    emporte_le: jour,
    a_lire_ainsi: CONVENTIONS,
    ne_contient_pas: manques.length ? manques : ['rien — tout ce que porte ce téléphone est ici'],
    caps: caps,
    ...donnees,
  }

  // Les images EN DERNIER, et c'est délibéré : la partie lisible par un humain
  // reste en tête du fichier, avant des milliers de lignes de base64.
  if (avecPhotos && (presentes.length || portraitsLus.length)) {
    const jointes: Record<string, string> = {}
    for (const p of presentes) jointes[nomLocal(p.photo)] = await enDataUri(p.fichier)
    for (const p of portraitsLus) jointes[p.nom] = await enDataUri(p.fichier)
    contenu.photos_jointes = jointes
  }

  const texte = JSON.stringify(contenu, null, 2)
  return new File([texte], `mypaddock-${jour.slice(0, 10)}.json`, { type: 'application/json' })
}

/** « 3,2 Mo », « 42 Ko ». Le poids s'annonce AVANT le geste : un pilote au
 *  paddock, en 4G, doit savoir ce qu'il déclenche. */
export const formaterPoids = (octets: number): string =>
  octets >= 1_000_000 ? `${(octets / 1_048_576).toFixed(1).replace('.', ',')} Mo`
    : `${Math.max(1, Math.round(octets / 1024))} Ko`
