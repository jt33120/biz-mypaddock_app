import type { PowerSyncDatabase } from '@powersync/web'
import { aplati } from './depot'
import { A_EU_LIEU, aujourdhui } from './vecu'

/**
 * LA FICHE D'UN CIRCUIT — demandée par Julian le 20 août : « pour chaque
 * circuit, le plan du circuit, les virages principaux, longueur, bon à savoir,
 * lien vers le site de circuit ».
 *
 * ⚠ DEUX SOURCES QUI NE SE MÉLANGENT JAMAIS, et c'est toute la conception de ce
 * fichier :
 *
 *   · LE RÉFÉRENTIEL — longueur, sens, virages, bon à savoir. Il DESCEND par la
 *     synchronisation, la PWA ne l'écrit jamais (AD-12), et il peut être vide :
 *     tant que la récolte n'a pas tourné, il l'est entièrement.
 *   · CE QUE LE PILOTE Y A FAIT — ses journées, son meilleur tour, sa
 *     progression. Toujours disponible, hors ligne, dès le premier roulage.
 *
 * L'ORDRE COMPTE : la fiche montre d'abord ce qui est À LUI. Une fiche qui
 * s'ouvre sur « aucune donnée disponible » est une fiche qu'on n'ouvre plus,
 * et le référentiel sera vide pendant des mois. Ce que le pilote a fait là-bas,
 * lui, existe dès le premier chrono — c'est ce qui rend l'écran utile avant que
 * la récolte n'existe, et c'est ce qui restera vrai même si elle n'existe jamais.
 */

export type FicheCircuit = {
  nom: string
  /** Tout ce bloc est nul tant que le référentiel n'est pas descendu. Ce n'est
   *  pas un défaut : c'est l'état normal du premier jour. */
  reference: {
    id: string
    pays: string | null
    longueur_m: number | null
    sens: 'horaire' | 'antihoraire' | null
    nb_virages: number | null
    site_web: string | null
    plan_url: string | null
    bon_a_savoir: string | null
    source_url: string | null
    recolte_le: string | null
    extrait_par_ia: boolean
  } | null
  virages: { numero: number | null; nom: string | null; note: string | null }[]
  /** Ce que le pilote y a fait. Disponible dès le premier roulage, hors ligne. */
  sien: {
    journees: number
    meilleurMs: number | null
    premiere: string | null
    derniere: string | null
    /** Son tout premier chrono ici, et son meilleur. L'écart entre les deux est
     *  un FAIT MESURÉ, jamais une projection ni un objectif. */
    premierChronoMs: number | null
  }
}

/**
 * La fiche, par le NOM tel que le pilote l'écrit.
 *
 * Le rapprochement avec le référentiel se fait À PLAT — sans accent, sans casse,
 * sans séparateur. La même égalité stricte a déjà coûté un écart disparu dans le
 * bilan, une courbe amputée et un circuit favori coupé en deux ; elle ne coûtera
 * pas une fiche vide en plus.
 */
export const ficheCircuit = async (
  db: PowerSyncDatabase, nom: string, jour = aujourdhui(),
): Promise<FicheCircuit> => {
  const cle = aplati(nom)

  const tous = await db.getAll<{
    id: string; nom: string; pays: string | null; longueur_m: number | null
    sens: string | null; nb_virages: number | null; site_web: string | null
    plan_url: string | null; bon_a_savoir: string | null
    source_url: string | null; recolte_le: string | null; extrait_par_ia: number | null
  }>(`SELECT id, nom, pays, longueur_m, sens, nb_virages, site_web, plan_url,
             bon_a_savoir, source_url, recolte_le, extrait_par_ia
        FROM circuit`)
  const c = tous.find((x) => aplati(x.nom) === cle) ?? null

  const virages = c
    ? await db.getAll<{ numero: number | null; nom: string | null; note: string | null }>(
      `SELECT numero, nom, note FROM virage WHERE circuit_id = ?
        ORDER BY coalesce(numero, 9999), id`, [c.id])
    : []

  // Ses journées ici. Le rapprochement se fait à plat côté application, pour la
  // même raison que partout ailleurs : deux orthographes ne font pas deux
  // circuits, et `lower()` de SQLite ignore les accents.
  //
  // ⚠ « TA DERNIÈRE JOURNÉE ICI » NE PEUT PAS ÊTRE UNE DATE À VENIR. Cette
  // requête filtrait l'état sans filtrer le temps : le 12 septembre saisi le
  // 25 août entrait dans `journees` et devenait `derniere` — la fiche annonçait
  // comme dernière visite une journée où le pilote n'était pas encore allé.
  const r = await db.getAll<{ nom: string; jour: string; meilleur: number | null }>(
    `SELECT r.circuit_nom AS nom, r.date_jour AS jour,
            (SELECT min(t.temps_ms) FROM tour t
               JOIN session s ON s.id = t.session_id WHERE s.roulage_id = r.id) AS meilleur
       FROM roulage r
      WHERE r.circuit_nom IS NOT NULL AND ${A_EU_LIEU('r')}
      ORDER BY r.date_jour ASC, r.id ASC`, [jour])
  const siens = r.filter((x) => aplati(x.nom) === cle)
  const chronos = siens.filter((x) => x.meilleur != null)

  return {
    nom,
    reference: c ? {
      id: c.id, pays: c.pays, longueur_m: c.longueur_m,
      sens: c.sens === 'horaire' || c.sens === 'antihoraire' ? c.sens : null,
      nb_virages: c.nb_virages, site_web: c.site_web, plan_url: c.plan_url,
      bon_a_savoir: c.bon_a_savoir, source_url: c.source_url,
      recolte_le: c.recolte_le, extrait_par_ia: c.extrait_par_ia === 1,
    } : null,
    virages,
    sien: {
      journees: siens.length,
      meilleurMs: chronos.reduce<number | null>(
        (m, x) => (m == null || x.meilleur! < m ? x.meilleur! : m), null),
      premiere: siens[0]?.jour ?? null,
      derniere: siens[siens.length - 1]?.jour ?? null,
      premierChronoMs: chronos[0]?.meilleur ?? null,
    },
  }
}

/** Une longueur s'écrit en kilomètres au-delà de mille mètres, comme sur les
 *  panneaux : « 3,03 km » et non « 3030 m ». `null` reste `null` — le
 *  référentiel peut ne rien savoir, et c'est un état, pas un manque. */
export const formaterLongueur = (m: number | null): string | null => {
  if (m == null) return null
  return m >= 1000
    ? (m / 1000).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' km'
    : `${m} m`
}
