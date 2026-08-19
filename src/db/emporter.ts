import type { PowerSyncDatabase } from '@powersync/web'
import { lireLocale, nomLocal, type Photo } from './photos'
import { CAPS_EMBARQUES } from './corpus'

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

/** Les tables de PILOTE, et elles seulement. */
const TABLES = [
  'machine', 'roulage', 'session', 'tour', 'depense', 'budget_saison',
  'intervention', 'mesure', 'photo', 'geste', 'plan_si_alors',
] as const

const CONVENTIONS = {
  argent: 'les montants sont des CENTIMES entiers — 24550 vaut 245,50 €',
  chrono: 'les temps sont des MILLISECONDES entières — 97300 vaut 1\'37"3',
  date: 'les dates sont au format ISO AAAA-MM-JJ',
  identifiant: 'les identifiants sont des UUID v7 : leurs 48 premiers bits '
    + "portent l'instant d'écriture en millisecondes depuis 1970",
  saison: "la saison n'est pas une plage de dates : c'est l'année du roulage, "
    + 'du premier au dernier saisi',
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
    `SELECT id, roulage_id, geste_id, chemin_objet, largeur, hauteur, etat FROM photo ORDER BY id`)
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
    const r = await db.get<{ n: number }>(`SELECT count(*) AS n FROM ${t}`)
    lignes += r.n
  }
  const { presentes, absentes } = await photosLocales(db)
  return {
    lignes,
    photos: presentes.length,
    octetsPhotos: presentes.reduce((s, p) => s + p.fichier.size, 0),
    photosAbsentes: absentes.length,
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
  for (const t of TABLES) donnees[t] = await db.getAll(`SELECT * FROM ${t}`)

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
  if (!avecPhotos && presentes.length)
    manques.push(`${presentes.length} photo(s) : emport demandé sans les images`)
  if (absentes.length)
    manques.push(`${absentes.length} photo(s) sans copie dans ce téléphone — `
      + `elles vivent au serveur, à ces chemins : ${absentes.map((p) => p.chemin_objet).join(', ')}`)

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
  if (avecPhotos && presentes.length) {
    const jointes: Record<string, string> = {}
    for (const p of presentes) jointes[nomLocal(p.photo)] = await enDataUri(p.fichier)
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
