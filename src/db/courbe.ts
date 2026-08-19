import type { PowerSyncDatabase } from '@powersync/web'
import { aplati } from './depot'

/**
 * LA COURBE DE PROGRESSION — FR-20, épique 11.
 *
 * « Un point par roulage, à circuit constant. » Elle était DÉLIBÉRÉMENT hors du
 * noyau de décembre : elle n'avait pas encore les points pour dire quoi que ce
 * soit, et c'était la démonstration même que la récompense du produit est
 * différée. Elle s'allume sur une CONDITION OBSERVABLE, jamais sur une date :
 * trois roulages chronométrés sur le même circuit.
 *
 * TROIS CHOSES QU'ELLE NE FAIT PAS, et chacune est une décision :
 *   · elle ne PROJETTE rien. Pas de tendance, pas de droite de régression, pas
 *     de « à ce rythme ». Une projection sur quatre points est une fiction, et
 *     une fiction qui fixe un objectif que personne n'a choisi.
 *   · elle ne compare JAMAIS deux circuits. Un point de Pau-Arnos et un point
 *     de Nogaro sur le même axe ne mesurent rien.
 *   · elle n'affiche AUCUNE cible. Ce qui reste à faire pour battre un temps
 *     n'apparaît nulle part — un cap se constate, il ne se vise pas.
 */

export const POINTS_MINIMUM = 3

export type Point = { id: string; date: string; ms: number; record: boolean }
export type Courbe = {
  circuit: string
  points: Point[]
  /** Le gain entre le premier point et le meilleur, en millisecondes. Positif
   *  quand le pilote a progressé. Il ÉNONCE un écart constaté, il ne promet
   *  rien — et il n'existe pas si la courbe n'a jamais baissé. */
  gainMs: number | null
}

/**
 * La courbe d'un circuit, ou `null` s'il n'a pas encore de quoi en faire une.
 *
 * Rendre une courbe de deux points serait pire que n'en rendre aucune : deux
 * points font toujours une droite, donc toujours une progression ou toujours
 * une chute, et le pilote y lirait un mouvement qui n'existe pas.
 */
export const courbeDuCircuit = async (
  db: PowerSyncDatabase, circuit: string,
): Promise<Courbe | null> => {
  // ⚠ LE RAPPROCHEMENT SE FAIT À PLAT, comme l'écart du bilan. L'égalité SQL
  // stricte a déjà été corrigée une fois dans `bilanRoulage` — et rejouée ici
  // sans y penser : « pau arnos » tapé un soir sortait de sa propre courbe, le
  // titre annonçait un roulage de moins, et le gain se calculait sur une série
  // amputée. Trouvé par une passe adverse, pas par un essai.
  const tous = await db.getAll<{ id: string; date: string; ms: number; nom: string }>(
    `SELECT r.id, r.date_jour AS date, min(t.temps_ms) AS ms, r.circuit_nom AS nom
       FROM roulage r
       JOIN session s ON s.roulage_id = r.id
       JOIN tour t ON t.session_id = s.id
      WHERE r.circuit_nom IS NOT NULL
      GROUP BY r.id HAVING ms IS NOT NULL
      ORDER BY r.date_jour ASC, r.id ASC`)
  const cle = aplati(circuit)
  const l = tous.filter((p) => aplati(p.nom) === cle)
  if (l.length < POINTS_MINIMUM) return null

  // Un RECORD est un temps meilleur que TOUS ceux qui le précèdent. Le premier
  // point n'en est pas un : il n'a rien battu, il a commencé.
  let mieux = Infinity
  const points: Point[] = l.map((p, i) => {
    const record = i > 0 && p.ms < mieux
    if (p.ms < mieux) mieux = p.ms
    return { id: p.id, date: p.date, ms: p.ms, record }
  })

  const depart = points[0].ms
  const meilleur = Math.min(...points.map((p) => p.ms))
  return { circuit, points, gainMs: meilleur < depart ? depart - meilleur : null }
}

/** Les circuits qui ont de quoi faire une courbe, du plus fourni au moins.
 *  Sert à ne proposer que ce qui existe — on ne montre jamais une liste de
 *  circuits « pas encore prêts », ce qui reviendrait à afficher ce qui manque. */
export const circuitsAvecCourbe = async (
  db: PowerSyncDatabase,
): Promise<{ circuit: string; n: number }[]> => {
  // Le regroupement aussi se fait à plat : grouper sur le nom brut ferait
  // apparaître « Pau-Arnos » et « pau arnos » comme deux circuits, chacun sous
  // le seuil, et aucune courbe ne s'allumerait.
  const l = await db.getAll<{ circuit: string; id: string }>(
    `SELECT DISTINCT r.circuit_nom AS circuit, r.id
       FROM roulage r
       JOIN session s ON s.roulage_id = r.id
       JOIN tour t ON t.session_id = s.id
      WHERE r.circuit_nom IS NOT NULL`)
  const par = new Map<string, { circuit: string; n: number }>()
  for (const x of l) {
    const k = aplati(x.circuit)
    const v = par.get(k)
    if (v) v.n++
    else par.set(k, { circuit: x.circuit, n: 1 })
  }
  return [...par.values()].filter((v) => v.n >= POINTS_MINIMUM)
    .sort((a, b) => b.n - a.n || a.circuit.localeCompare(b.circuit))
}
