import type { PowerSyncDatabase } from '@powersync/web'
import { nouvelId } from './ids'
import { marquerSaisie } from './mesures'
import { supabase } from './supabase'
import { ecrireLocale, effacerLocale, lireLocale } from './photos'

/**
 * LES DOCUMENTS D'UNE MACHINE — le manuel d'atelier en tête.
 *
 * ⚠ LE SERVEUR NE VA JAMAIS CHERCHER UN DOCUMENT, et c'est un arbitrage, pas
 * une limite technique. Julian demandait « un websearch une fois puis sauvegarde
 * dans le Supabase Storage le manuel ». La lecture littérale — le serveur suit
 * l'URL trouvée et en dépose une copie — ferait de nous l'hébergeur d'une œuvre
 * protégée, pour tous les pilotes qui ont la même moto. Ce n'est plus « garder
 * mon manuel », c'est devenir une bibliothèque de manuels.
 *
 * LE PILOTE VERSE SON DOCUMENT, comme il verse une facture. Le service rendu est
 * identique — le manuel est là au paddock, sans réseau, à côté de la moto qu'il
 * concerne — et le pas entre trouver et garder reste le sien.
 *
 * DEUX CHEMINS D'ÉCRITURE, comme pour la photo (AD-4) : la LIGNE part par
 * PowerSync, les OCTETS en HTTP direct. Et comme pour la photo, la copie locale
 * fait foi à l'affichage : un document « en attente d'envoi » ne peut pas être
 * un document absent quand on en a besoin.
 */

export type Genre = 'manuel' | 'carte_grise' | 'assurance' | 'facture' | 'autre'

export const NOM_GENRE: Record<Genre, string> = {
  manuel: "Manuel d'atelier",
  carte_grise: 'Carte grise',
  assurance: 'Assurance',
  facture: 'Facture',
  autre: 'Autre',
}

export type Document = {
  id: string
  machine_id: string
  nom: string
  genre: Genre
  chemin_objet: string
  octets: number | null
  type_mime: string | null
}

/** ⚠ AUCUNE RÉDUCTION, AUCUNE CONVERSION. Un PDF de manuel qui passerait par le
 *  canevas deviendrait une image illisible de sa première page. Le document est
 *  gardé TEL QUEL — c'est la seule chose qu'on lui demande. */
export const nomLocalDocument = (id: string, ext: string) => `doc-${id}.${ext}`

const extensionDe = (f: File) => {
  const p = f.name.split('.').pop()
  return p && p.length <= 5 ? p.toLowerCase() : 'bin'
}

/** 25 Mio — le plafond du bucket. Un manuel scanné les dépasse parfois, et un
 *  refus au moment du versement doit être DIT avant l'envoi, pas après. */
export const OCTETS_MAX = 25 * 1024 * 1024

export const verserDocument = async (
  db: PowerSyncDatabase,
  d: { machineId: string; genre: Genre; nom?: string },
  fichier: File,
): Promise<Document | { refus: string }> => {
  if (fichier.size > OCTETS_MAX) {
    return { refus: `Ce fichier fait ${Math.round(fichier.size / 1048576)} Mo, et la limite est de 25 Mo.` }
  }
  const id = nouvelId()
  const ext = extensionDe(fichier)
  await ecrireLocale(nomLocalDocument(id, ext), fichier)

  // Le pilote est le PREMIER SEGMENT du chemin : c'est ce que la politique du
  // bucket compare à auth.uid(). Posé à `local` tant qu'aucun compte n'existe,
  // réécrit au téléversement — comme le propriétaire d'une ligne.
  const chemin = `local/${d.machineId}/${id}.${ext}`
  await db.execute(
    `INSERT INTO document (id, machine_id, nom, genre, chemin_objet, octets, type_mime)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, d.machineId, (d.nom || fichier.name).trim(), d.genre, chemin,
      fichier.size, fichier.type || null])
  await marquerSaisie(db)
  return {
    id, machine_id: d.machineId, nom: (d.nom || fichier.name).trim(), genre: d.genre,
    chemin_objet: chemin, octets: fichier.size, type_mime: fichier.type || null,
  }
}

export const documentsDeLaMachine = (db: PowerSyncDatabase, machineId: string) =>
  db.getAll<Document>(
    `SELECT id, machine_id, nom, genre, chemin_objet, octets, type_mime
       FROM document WHERE machine_id = ? ORDER BY genre, id DESC`, [machineId])

/** La copie locale d'abord, TOUJOURS. Un document versé au paddock hors ligne
 *  doit s'ouvrir au paddock hors ligne — c'est tout l'intérêt de l'avoir versé. */
export const ouvrirDocument = async (d: Document): Promise<File | null> => {
  const ext = d.chemin_objet.split('.').pop() ?? 'bin'
  const local = await lireLocale(nomLocalDocument(d.id, ext))
  if (local) return local
  if (!supabase || !navigator.onLine) return null
  const { data, error } = await supabase.storage.from('documents').download(d.chemin_objet)
  if (error || !data) return null
  // On le remet en local au passage : la fois suivante sera hors ligne.
  const f = new File([data], d.nom, { type: d.type_mime ?? data.type })
  await ecrireLocale(nomLocalDocument(d.id, ext), f)
  return f
}

export const oublierDocument = async (db: PowerSyncDatabase, d: Document) => {
  const ext = d.chemin_objet.split('.').pop() ?? 'bin'
  try { await effacerLocale(nomLocalDocument(d.id, ext)) } catch { /* déjà partie */ }
  await db.execute(`DELETE FROM document WHERE id = ?`, [d.id])
}

/**
 * Le téléversement différé, sur le même modèle que les photos et avec les mêmes
 * deux déclencheurs (AD-6) : retour au premier plan, retour de connectivité.
 *
 * ⚠ CHAQUE `error` EST LIÉE ET TESTÉE. supabase-js RETOURNE ses erreurs de
 * stockage au lieu de les lever : un `try/catch` autour ne se déclenche jamais,
 * et c'est exactement ce qui a orphelinné des photos lors de l'effacement d'un
 * compte. Un envoi raté est un REPORT, jamais une perte — la ligne reste locale.
 */
export const televerserDocuments = async (
  db: PowerSyncDatabase, piloteId: string,
): Promise<number> => {
  if (!supabase || !navigator.onLine) return 0
  const l = await db.getAll<Document>(
    `SELECT id, machine_id, nom, genre, chemin_objet, octets, type_mime
       FROM document WHERE chemin_objet LIKE 'local/%'`)
  let montes = 0
  for (const d of l) {
    const ext = d.chemin_objet.split('.').pop() ?? 'bin'
    const f = await lireLocale(nomLocalDocument(d.id, ext))
    if (!f) continue
    const chemin = `${piloteId}/${d.machine_id}/${d.id}.${ext}`
    const { error } = await supabase.storage.from('documents')
      .upload(chemin, f, { upsert: true, contentType: d.type_mime || 'application/octet-stream' })
    if (error) continue
    await db.execute(`UPDATE document SET chemin_objet = ? WHERE id = ?`, [chemin, d.id])
    montes++
  }
  return montes
}

/** Un poids qui se lit. Les octets nus ne disent rien à personne. */
export const formaterOctets = (n: number | null): string => {
  if (n == null) return ''
  if (n < 1024) return `${n} o`
  if (n < 1048576) return `${Math.round(n / 1024)} Ko`
  return `${(n / 1048576).toFixed(1)} Mo`
}
