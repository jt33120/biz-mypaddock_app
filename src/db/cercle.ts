import type { PowerSyncDatabase } from '@powersync/web'
import { supabase } from './supabase'
import { marquerSaisie } from './mesures'

/**
 * LE CERCLE — épique 14, FR-39 et FR-39bis.
 *
 * ⚠ IL EST EN LIGNE, ET C'EST DÉLIBÉRÉ. Tout le reste du produit fonctionne au
 * paddock sans réseau ; le cercle non, parce qu'il n'y a rien à montrer d'un
 * cercle hors ligne — les chronos des autres n'existent pas dans ce téléphone,
 * et les faire descendre par la synchronisation reviendrait à ranger les
 * données d'autrui dans une base qu'on ne contrôle plus. La lecture passe par
 * une VUE serveur, qui décide ce qui sort.
 *
 * TROIS CLAUSES DE SÉCURITÉ, et elles ne sont pas dans ce fichier par hasard :
 *
 *   · FR-19 — le chrono est MASQUÉ PAR DÉFAUT, roulage par roulage. « Une
 *     comparaison imposée fait cesser la saisie de celui qui en a le plus
 *     besoin. » Le pilote invisible apparaît dans le cercle SANS son chrono,
 *     jamais en creux ni en dernier.
 *   · FR-39 — aucun classement. Ni ici, ni côté serveur : la vue ne porte
 *     aucune colonne de rang, donc il n'y a rien à trier et rien à fuiter.
 *   · FR-39bis — un cap de bravoure ne part JAMAIS tout seul. Le mécanisme est
 *     le mieux établi de toute la recherche : la présence de pairs augmente la
 *     prise de risque. Le danger n'est ni dans le catalogue ni dans le cercle
 *     pris seuls — il est dans leur conjonction, et ce produit est né d'une
 *     chute causée par la recherche d'un geste.
 */

export type Cercle = { id: string; nom: string; code: string }
export type Membre = { pilote_id: string; pseudo: string }
export type LigneCercle = {
  id: string; pseudo: string; circuit_nom: string; date_jour: string
  meilleur_ms: number | null
}

/** Un code court, lisible à voix haute au paddock : pas de 0/O ni de 1/I/L. */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
export const nouveauCode = (): string => {
  const t = new Uint8Array(8)
  crypto.getRandomValues(t)
  return [...t].map((n) => ALPHABET[n % ALPHABET.length]).join('')
}

export const mesCercles = async (): Promise<Cercle[]> => {
  if (!supabase) return []
  const { data } = await supabase.from('cercle').select('id, nom, code')
  return (data as Cercle[]) ?? []
}

export const creerCercle = async (nom: string, pseudo: string): Promise<Cercle | null> => {
  if (!supabase) return null
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) return null
  const c = { id: crypto.randomUUID(), nom: nom.trim(), code: nouveauCode(), cree_par: u.user.id }
  const { error } = await supabase.from('cercle').insert(c)
  if (error) return null
  await supabase.from('membre_cercle')
    .insert({ cercle_id: c.id, pilote_id: u.user.id, pseudo: pseudo.trim() })
  return c
}

export const rejoindre = async (code: string, pseudo: string): Promise<string | null> => {
  if (!supabase) return "Aucun serveur n'est configuré."
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) return 'Le cercle demande un compte.'
  // On ne peut pas LIRE un cercle dont on n'est pas membre — la politique
  // l'interdit, et c'est ce qui le rend fermé. Le serveur résout donc le code.
  const { error } = await supabase.rpc('rejoindre_cercle',
    { p_code: code.trim().toUpperCase(), p_pseudo: pseudo.trim() })
  if (error) return /introuvable/i.test(error.message)
    ? "Ce code ne correspond à aucun cercle."
    : "Le cercle n'a pas pu être rejoint."
  return null
}

export const membres = async (cercleId: string): Promise<Membre[]> => {
  if (!supabase) return []
  const { data } = await supabase.from('membre_cercle')
    .select('pilote_id, pseudo').eq('cercle_id', cercleId)
  return (data as Membre[]) ?? []
}

/**
 * CE QUE LE CERCLE MONTRE — à circuit égal, et sans classement.
 *
 * Le tri est CHRONOLOGIQUE, jamais par temps. Trier par temps produirait un
 * classement même sans colonne de rang, et un pilote invisible se retrouverait
 * mécaniquement en dernier — exactement ce que FR-19 interdit.
 */
export const roulagesDuCercle = async (
  cercleId: string, circuit: string,
): Promise<LigneCercle[]> => {
  if (!supabase) return []
  const { data } = await supabase.from('roulage_du_cercle')
    .select('id, pseudo, circuit_nom, date_jour, meilleur_ms')
    .eq('cercle_id', cercleId)
    .order('date_jour', { ascending: false })
  const l = (data as LigneCercle[]) ?? []
  const cle = circuit.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  return l.filter((x) => x.circuit_nom.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() === cle)
}

/* ─── FR-19 : LA VISIBILITÉ DU CHRONO ──────────────────────────────────── */

export const chronoVisible = async (db: PowerSyncDatabase, roulageId: string) => {
  const r = await db.get<{ v: number | null }>(
    `SELECT chrono_visible AS v FROM roulage WHERE id = ?`, [roulageId])
  return r.v === 1
}

export const rendreVisible = async (
  db: PowerSyncDatabase, roulageId: string, oui: boolean,
) => {
  await db.execute(`UPDATE roulage SET chrono_visible = ? WHERE id = ?`,
    [oui ? 1 : 0, roulageId])
  await marquerSaisie(db)
}
