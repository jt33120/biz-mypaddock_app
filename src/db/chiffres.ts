import type { PowerSyncDatabase } from '@powersync/web'
import { formaterChrono, formaterEuros } from './depot'

/**
 * LA ZONE DES CHIFFRES — FR-15, la seule moitié de l'accueil qui appartient au
 * pilote.
 *
 * La zone temporelle, au-dessus, appartient au SYSTÈME : c'est FR-11 qui
 * décide, et le pilote n'y touche pas — sinon le mécanisme qui fait exister le
 * produit entre deux roulages devient un réglage, donc une chose que personne
 * ne configure. Celle-ci est l'inverse exact, et la frontière est nette.
 *
 * DEUX CLAUSES QUI SE TIENNENT L'UNE L'AUTRE :
 *   · la disposition par défaut est COMPLÈTE ET UTILISABLE TELLE QUELLE. Un
 *     pilote qui n'ouvre jamais ce réglage a un produit entier ;
 *   · le réarrangement n'est JAMAIS présenté comme une étape d'installation.
 *     Il n'y a donc ni assistant, ni invite, ni pastille « personnalise-moi » —
 *     juste un lien discret, sous la zone, pour qui le cherche.
 *
 * Le choix vit en local et ne se synchronise pas : c'est un réglage d'écran,
 * pas une donnée de saison. Le perdre en changeant de téléphone est sans
 * conséquence — la disposition par défaut reprend, et elle est complète.
 */

export type Cle =
  | 'roulages' | 'circuits' | 'meilleur' | 'sessions' | 'tours'
  | 'depense_saison' | 'machines' | 'interventions'

export type Chiffre = { cle: Cle; etiquette: string; valeur: string }

/**
 * ⚠ LE MEILLEUR TOUR PORTE SON CIRCUIT, ici comme au garage.
 *
 * « Meilleur tour : préciser le circuit, ça n'a pas de sens sinon au global
 * comme ça » — Julian. Il l'a dit du garage ; le même chiffre était faux ICI de
 * la même manière, et pour la même raison : 1'38 à Pau-Arnos et 1'38 à Nogaro ne
 * se comparent pas. Un chrono sans circuit n'est pas une donnée imprécise, c'est
 * une donnée FAUSSE — elle laisse croire à une comparaison qui n'existe pas.
 *
 * Le contexte voyage donc à côté de la valeur, pour ce seul chiffre. Les autres
 * n'en ont pas besoin : « 5 roulages » ne dépend d'aucun lieu.
 */
export type Valeur = { valeur: string; ou?: string }

/** Trois par défaut, et ce sont ceux qui parlent dès le premier roulage. */
export const DEFAUT: Cle[] = ['roulages', 'circuits', 'meilleur']

/** Quatre au maximum : au-delà, la grille passe à deux lignes sur un téléphone
 *  et la zone cesse d'être lisible d'un coup d'œil, ce qui est sa seule raison
 *  d'être. FR-15 dit « trois ou quatre » — la borne est dans l'exigence. */
export const MAX = 4

export const ETIQUETTES: Record<Cle, string> = {
  roulages: 'roulages',
  circuits: 'circuits',
  meilleur: 'meilleur tour',
  sessions: 'sessions',
  tours: 'tours chronométrés',
  depense_saison: 'dépensé cette saison',
  machines: 'machines',
  interventions: 'gestes consignés',
}

const CLE_RANGEMENT = 'mypaddock.chiffres'

export const chiffresChoisis = (): Cle[] => {
  try {
    const brut = localStorage.getItem(CLE_RANGEMENT)
    if (!brut) return DEFAUT
    const l = (JSON.parse(brut) as Cle[]).filter((c) => c in ETIQUETTES)
    // Une liste vide serait une zone vide, donc un écran qui sous-délivre
    // (FR-14) : on retombe sur le défaut plutôt que de rendre du rien.
    return l.length ? l.slice(0, MAX) : DEFAUT
  } catch { return DEFAUT }
}

export const poserChiffres = (l: Cle[]) => {
  try { localStorage.setItem(CLE_RANGEMENT, JSON.stringify(l.slice(0, MAX))) }
  catch { /* stockage refusé : la disposition par défaut reste, et elle suffit */ }
}

/**
 * Les valeurs, calculées en une seule requête.
 *
 * ⚠ AUCUNE N'EST UN RATIO NI UNE MOYENNE. Un « coût moyen par roulage » est un
 * chiffre qui descend quand on roule plus — la même perversité que FR-21 traite
 * pour le coût au tour, et elle n'a pas plus sa place ici que là-bas.
 */
export const valeurs = async (db: PowerSyncDatabase): Promise<Record<Cle, Valeur>> => {
  const annee = new Date().getFullYear()
  const r = await db.get<Record<string, number | null>>(
    `SELECT (SELECT count(*) FROM roulage) AS roulages,
            (SELECT count(DISTINCT circuit_nom) FROM roulage WHERE circuit_nom IS NOT NULL) AS circuits,
            (SELECT count(*) FROM session) AS sessions,
            (SELECT count(*) FROM tour) AS tours,
            (SELECT sum(montant_centimes) FROM depense WHERE saison_annee = ?) AS depense_saison,
            (SELECT count(*) FROM machine) AS machines,
            (SELECT count(*) FROM intervention WHERE etat = 'faite') AS interventions`,
    [annee])

  // Le meilleur tour se cherche AVEC sa journée, donc avec son circuit. Un
  // `min()` global rendait le chrono sans savoir où il avait été fait.
  const m = await db.getAll<{ ms: number; circuit: string }>(
    `SELECT t.temps_ms AS ms, r.circuit_nom AS circuit
       FROM tour t
       JOIN session s ON s.id = t.session_id
       JOIN roulage r ON r.id = s.roulage_id
      WHERE r.circuit_nom IS NOT NULL
      ORDER BY t.temps_ms ASC LIMIT 1`)

  const n = (v: number | null): Valeur => ({ valeur: String(v ?? 0) })
  return {
    roulages: n(r.roulages),
    circuits: n(r.circuits),
    // Le tiret dit « rien de mesuré », jamais zéro : un meilleur tour de zéro
    // milliseconde serait un chiffre, et il serait faux.
    meilleur: m[0]
      ? { valeur: formaterChrono(m[0].ms), ou: `à ${m[0].circuit}` }
      : { valeur: '—' },
    sessions: n(r.sessions),
    tours: n(r.tours),
    depense_saison: {
      valeur: r.depense_saison != null ? formaterEuros(r.depense_saison) : '—',
      ou: r.depense_saison != null ? `saison ${annee}` : undefined,
    },
    machines: n(r.machines),
    interventions: n(r.interventions),
  }
}
