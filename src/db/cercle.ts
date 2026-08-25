import type { PowerSyncDatabase } from '@powersync/web'
import { supabase } from './supabase'
import { marquerSaisie } from './mesures'
import { TOUTES_JOURNEES } from './vecu'

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

/**
 * ⚠ UNE LECTURE QUI ÉCHOUE N'EST PAS UNE LECTURE VIDE.
 *
 * Les quatre appels de ce fichier ne liaient pas leur `error` et retombaient sur
 * `?? []`. supabase-js NE LÈVE PAS : il RETOURNE l'erreur. Un réseau coupé, un
 * jeton expiré, une politique qui refuse rendaient donc tous `data = null`, donc
 * une liste vide — et l'écran affirmait « Personne du cercle n'a encore roulé
 * ici. » alors que la vérité était « je n'ai pas pu demander ».
 *
 * Le critère de l'épique 14 dit mot pour mot que l'écran « ne ment pas sur ce
 * qu'il ne montre pas ». Trois lectures sur quatre transformaient une panne en
 * affirmation de vide, dont une qui renvoyait un pilote à « Créer un cercle »
 * alors qu'il en a un.
 */
export type Reponse<T> = { valeur: T; souci: string | null }

const PANNE = "Le cercle n'a pas pu être lu. Il est en ligne, contrairement au reste."

export const mesCercles = async (): Promise<Reponse<Cercle[]>> => {
  if (!supabase) return { valeur: [], souci: null }
  const { data, error } = await supabase.from('cercle').select('id, nom, code')
  if (error) return { valeur: [], souci: PANNE }
  return { valeur: (data as Cercle[]) ?? [], souci: null }
}

/**
 * ⚠ LA CRÉATION EST UN SEUL GESTE, ET IL EST CÔTÉ SERVEUR.
 *
 * Elle en faisait deux — `cercle` puis `membre_cercle` — sans transaction, et
 * l'erreur du second n'était jamais lue. Un échec là laissait un cercle dont le
 * créateur n'était pas membre : illisible par tous (`cercle` ne se lit que par
 * `est_membre`), ineffaçable par tous (aucune politique de suppression), et dont
 * le code continuait de répondre. Le premier inconnu à l'avoir en devenait
 * l'unique membre.
 *
 * Le code se tire désormais AU SERVEUR : un client qui choisit son propre code
 * peut en choisir un devinable. Voir 20260825000004.
 */
export const creerCercle = async (nom: string, pseudo: string): Promise<string | null> => {
  if (!supabase) return "Aucun serveur n'est configuré."
  const { error } = await supabase.rpc('creer_cercle',
    { p_nom: nom.trim(), p_pseudo: pseudo.trim() })
  if (error) return /compte requis/i.test(error.message)
    ? 'Le cercle demande un compte.'
    : "Le cercle n'a pas pu être créé."
  return null
}

export const rejoindre = async (code: string, pseudo: string): Promise<string | null> => {
  if (!supabase) return "Aucun serveur n'est configuré."
  // On ne peut pas LIRE un cercle dont on n'est pas membre — la politique
  // l'interdit, et c'est ce qui le rend fermé. Le serveur résout donc le code.
  //
  // ⚠ ET C'EST MAINTENANT LA SEULE PORTE. Jusqu'au 25 août, la politique
  // d'insertion de `membre_cercle` ne vérifiait que l'identité de l'inscrit,
  // jamais le cercle visé : une requête suffisait à entrer dans n'importe lequel
  // sans code. Une porte fermée à côté d'une fenêtre ouverte.
  const { error } = await supabase.rpc('rejoindre_cercle',
    { p_code: code.trim().toUpperCase(), p_pseudo: pseudo.trim() })
  if (error) return /introuvable/i.test(error.message)
    ? "Ce code ne correspond à aucun cercle."
    : "Le cercle n'a pas pu être rejoint."
  return null
}

export const membres = async (cercleId: string): Promise<Reponse<Membre[]>> => {
  if (!supabase) return { valeur: [], souci: null }
  const { data, error } = await supabase.from('membre_cercle')
    .select('pilote_id, pseudo').eq('cercle_id', cercleId)
  if (error) return { valeur: [], souci: PANNE }
  return { valeur: (data as Membre[]) ?? [], souci: null }
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
): Promise<Reponse<LigneCercle[]>> => {
  if (!supabase) return { valeur: [], souci: null }
  const { data, error } = await supabase.from('roulage_du_cercle')
    .select('id, pseudo, circuit_nom, date_jour, meilleur_ms')
    .eq('cercle_id', cercleId)
    .order('date_jour', { ascending: false })
  if (error) return { valeur: [], souci: PANNE }
  const l = (data as LigneCercle[]) ?? []
  const cle = pivot(circuit)
  return { valeur: l.filter((x) => pivot(x.circuit_nom) === cle), souci: null }
}

/** Deux façons d'écrire le même circuit ne doivent pas séparer deux pilotes qui
 *  ont roulé au même endroit. Le pivot est le même que celui du serveur
 *  (`nom_pivot`, 20260825000003) — accents et ponctuation retirés. */
const pivot = (nom: string): string =>
  nom.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '')

/* ─── FR-19 : LA VISIBILITÉ DU CHRONO ──────────────────────────────────── */

export const chronoVisible = async (db: PowerSyncDatabase, roulageId: string) => {
  const r = await db.get<{ v: number | null }>(
    `SELECT chrono_visible AS v FROM roulage ${TOUTES_JOURNEES} WHERE id = ?`, [roulageId])
  return r.v === 1
}

export const rendreVisible = async (
  db: PowerSyncDatabase, roulageId: string, oui: boolean,
) => {
  await db.execute(`UPDATE roulage SET chrono_visible = ? WHERE id = ?`,
    [oui ? 1 : 0, roulageId])
  await marquerSaisie(db)
}
