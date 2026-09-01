import { formaterChrono, formaterEcart } from '../db/depot'
import { POINTS_MINIMUM, type Courbe as Donnees } from '../db/courbe'
import type { LigneAnalyse } from '../db/analyse'

/**
 * LE TRACÉ — FR-20.
 *
 * En SVG et non en canevas : il doit rester net à toutes les densités d'écran,
 * et `shape-rendering="crispEdges"` interdit l'anti-aliasing, ce que l'épine de
 * design demande partout ailleurs. Aucun lissage de courbe non plus : les points
 * se relient par des segments droits, parce qu'une courbe lissée invente des
 * valeurs entre deux roulages qui n'ont jamais été mesurées.
 *
 * L'AXE DU TEMPS EST INVERSÉ, et il faut le dire : plus bas veut dire plus
 * rapide. Un chrono qui descend est une progression, et c'est la seule lecture
 * du produit où « ça baisse » est une bonne nouvelle — le libellé le porte.
 */
export function Courbe({ d }: { d: Donnees }) {
  const L = 320, H = 120, M = 8
  const ms = d.points.map((p) => p.ms)
  const min = Math.min(...ms), max = Math.max(...ms)
  // Un écart nul (trois fois le même temps) diviserait par zéro : la courbe est
  // alors plate au milieu, ce qui est exactement ce qu'elle doit montrer.
  const etendue = max - min || 1
  const x = (i: number) => M + (i * (L - 2 * M)) / Math.max(1, d.points.length - 1)
  // ⚠ L'AXE EST LITTÉRAL : un temps plus court est PLUS BAS. Trouvé sur la
  // capture, pas dans les assertions — la première version plaçait le meilleur
  // tour en haut, et le tracé MONTAIT à mesure que le pilote progressait, juste
  // au-dessus d'une phrase disant « plus le tracé descend, plus le tour est
  // rapide ». Un dessin qui contredit sa propre légende est pire qu'un dessin
  // sans légende : on croit le dessin.
  const y = (v: number) => H - M - ((v - min) / etendue) * (H - 2 * M)

  const trace = d.points.map((p, i) => `${x(i)},${y(p.ms)}`).join(' ')

  return (
    <div className="bloc pile courbe">
      <div className="rang">
        <span className="libelle">À {d.circuit} · {d.points.length} roulages</span>
        {/* Le gain ÉNONCE un écart constaté. Il ne promet rien, ne projette
            rien, et n'existe pas si la courbe n'a jamais baissé. */}
        {d.gainMs != null && (
          <span className="chiffre hud-16 mieux">{formaterEcart(-d.gainMs)}</span>
        )}
      </div>

      <svg className="trace" viewBox={`0 0 ${L} ${H}`} role="img"
           aria-label={`Meilleur tour à ${d.circuit}, du plus ancien au plus récent : `
             + d.points.map((p) => formaterChrono(p.ms)).join(', ')}>
        <polyline points={trace} fill="none" stroke="var(--miami)" strokeWidth="2"
                  shapeRendering="crispEdges" />
        {d.points.map((p, i) => (
          // Le violet ne s'allume QUE sur un record — c'est la règle de la
          // palette, et elle n'a de sens que si elle reste rare.
          <rect key={p.id} x={x(i) - 3} y={y(p.ms) - 3} width="6" height="6"
                fill={p.record ? 'var(--record)' : 'var(--miami)'} shapeRendering="crispEdges" />
        ))}
      </svg>

      <div className="rang">
        <span className="libelle faible">{d.points[0].date} · {formaterChrono(d.points[0].ms)}</span>
        <span className="libelle faible">
          {d.points[d.points.length - 1].date} · {formaterChrono(d.points[d.points.length - 1].ms)}
        </span>
      </div>
      <p className="note">Plus le tracé descend, plus le tour est rapide.</p>
    </div>
  )
}

/**
 * LA SUITE — LE SECOND TRACÉ, ET IL VIT DANS CE FICHIER EXPRÈS.
 *
 * Un point par pas, reliés par des SEGMENTS DROITS, exactement comme la courbe
 * au-dessus : relier n'invente qu'un intervalle qu'on n'a pas mesuré, lisser
 * inventerait des valeurs entre les pas, et une droite de tendance inventerait
 * tout — à commencer par la suite. Aucun lissage, aucune projection, aucun
 * « à ce rythme ».
 *
 * ⚠ SON AXE EST L'INVERSE DE CELUI DE LA COURBE, ET C'EST PRÉCISÉMENT POURQUOI
 * LES DEUX SONT DANS LE MÊME FICHIER.
 *
 *   · La courbe porte des CHRONOS. Son axe est INVERSÉ — plus bas veut dire
 *     plus rapide — et son plancher est le meilleur temps MESURÉ. Un chrono ne
 *     part pas de zéro : zéro seconde au tour n'existe pas, et caler la courbe
 *     sur zéro écraserait quinze roulages dans trois pixels de haut.
 *   · La suite porte de l'ARGENT ou des DÉCOMPTES. Son axe est NORMAL — plus
 *     haut veut dire plus grand — et son plancher est ZÉRO. Zéro euro et zéro
 *     journée existent tous les deux, et c'est l'origine vraie de l'échelle :
 *     faire partir la suite de son minimum ferait d'un mois à 180 € et d'un
 *     mois à 200 € deux mois que tout sépare.
 *
 * Deux conventions opposées à trente lignes l'une de l'autre appellent
 * l'harmonisation, et c'est exactement ce qu'il ne faut PAS faire : les aligner,
 * dans un sens ou dans l'autre, rejoue un défaut déjà payé une fois — la
 * première courbe MONTAIT à mesure que le pilote progressait, juste au-dessus
 * d'une phrase disant l'inverse (voir le commentaire de `y`, plus haut). Elles
 * se touchent pour qu'on lise les deux raisons avant d'y toucher, pas pour qu'on
 * les rapproche.
 *
 * ⚠ ET LA SUITE NE REÇOIT JAMAIS UN CHRONO. « 1'38 à Pau-Arnos » et « 1'38 à
 * Nogaro » ne se comparent pas : un chrono agrégé par mois, par année ou par
 * moto n'est pas une information imprécise, c'est une information FAUSSE. La
 * table des croisements a une troisième forme, `chrono`, dont l'existence même
 * sert à rendre ça impossible (src/db/analyse.ts). Rien ici n'appelle
 * `formaterChrono`, et la suite ne formate d'ailleurs rien du tout : elle reçoit
 * le texte déjà écrit.
 */
export function Suite({ titre, lignes, description }: {
  titre: string
  /** ⚠ LE MÊME TYPE QUE LES BARRES, ET C'EST DÉLIBÉRÉ (src/db/analyse.ts) : une
   *  suite de moins de trois points se rend EN BARRES, et si les deux formes
   *  portaient deux types, cette bascule serait une conversion — c'est-à-dire un
   *  endroit où perdre un champ. La suite lit `valeur` pour la hauteur, `libelle`
   *  pour le texte, `cle` pour la clé de rendu.
   *
   *  Elle ne lit PAS `incertain` : une ligne que le produit ne sait pas ranger —
   *  « Sans mois » — n'a aucune place sur un axe du temps, la poser au bout
   *  inventerait un treizième mois, et `comblerLesMois` l'a déjà sortie. Ce
   *  qu'elle devient est dit avant le tracé, par la phrase de complétude. */
  lignes: readonly LigneAnalyse[]
  /** Ce que le tracé montre, en une phrase — la note du croisement. Vide quand
   *  ce croisement n'a rien à ajouter : on n'écrit pas un paragraphe vide. */
  description: string
}) {
  // ⚠ DEUX POINTS NE FONT PAS UNE LIGNE — la même raison que `POINTS_MINIMUM`,
  // et la même constante : deux points font TOUJOURS une droite, donc toujours
  // une progression ou toujours une chute, et le pilote y lit un mouvement qui
  // n'existe pas. Ce n'est pas ici qu'on décide de la forme d'un croisement —
  // `formeRendue` le fait, et sous trois points elle rend une composition —
  // c'est ici qu'on refuse de tracer la droite si jamais elle se trompait.
  if (lignes.length < POINTS_MINIMUM) return null

  const L = 320, H = 120, M = 8
  const max = Math.max(...lignes.map((l) => l.valeur))
  // Le sommet est le PLUS GROS DE CE QU'ON MONTRE, jamais un plafond ni une
  // cible : la même règle qu'aux barres, et pour la même raison — une suite
  // mesurée contre un plafond est un compteur à rebours. `Math.max(…, 1)` ne
  // corrige rien d'autre qu'une division par zéro quand tout vaut zéro (une
  // enfilade de journées sans dépense saisie, par exemple).
  const sommet = Math.max(max, 1)
  const x = (i: number) => M + (i * (L - 2 * M)) / Math.max(1, lignes.length - 1)
  // ⚠ LE PLANCHER EST ZÉRO, ET L'AXE MONTE. Voir le commentaire de tête : c'est
  // l'inverse exact de la courbe d'à côté, et les deux ont raison.
  const y = (v: number) => H - M - (v / sommet) * (H - 2 * M)

  const trace = lignes.map((l, i) => `${x(i)},${y(l.valeur)}`).join(' ')
  const dernier = lignes[lignes.length - 1]

  return (
    // ⚠ LA CLASSE `courbe` EST PORTÉE EXPRÈS, et ce n'est pas un abus de nom.
    // `.trace` n'est déclarée QUE sous `.courbe .trace` dans la feuille — 100 %
    // de large, 120 px de haut. En redéclarer une seconde au premier niveau pour
    // la suite est mot pour mot le défaut que `.vignette` puis `.barre` ont
    // coûté : deux déclarations, la seconde gagne en silence, et personne ne voit
    // rien. La suite prend donc le même parent — un seul endroit règle la taille
    // des deux tracés, et ils gardent la même hauteur d'une ouverture à l'autre,
    // ce qui est aussi ce qu'on veut à l'écran.
    <div className="bloc pile courbe">
      <span className="sous-titre">{titre}</span>
      {description && <p className="note">{description}</p>}

      <svg className="trace" viewBox={`0 0 ${L} ${H}`} role="img"
           aria-label={`${titre} : `
             + lignes.map((l) => `${l.nom} ${l.libelle}`).join(', ')}>
        <polyline points={trace} fill="none" stroke="var(--miami)" strokeWidth="2"
                  shapeRendering="crispEdges" />
        {/* TOUS LES POINTS PORTENT LA MÊME TEINTE. Le violet du record ne
            s'allume que sur un chrono, et il n'a rien à faire ici : il n'existe
            aucun record d'argent ni de décompte, et un mois n'est ni cher ni bon
            marché. Une seconde couleur rangerait les pas les uns par rapport aux
            autres, c'est-à-dire jugerait. */}
        {lignes.map((l, i) => (
          <rect key={l.cle} x={x(i) - 3} y={y(l.valeur) - 3} width="6" height="6"
                fill="var(--miami)" shapeRendering="crispEdges" />
        ))}
      </svg>

      <div className="rang">
        <span className="libelle faible">{lignes[0].nom} · {lignes[0].libelle}</span>
        <span className="libelle faible">{dernier.nom} · {dernier.libelle}</span>
      </div>
      {/* La légende de l'axe n'est pas décorative non plus : le pilote a appris
          sur la courbe que « ça descend » est une bonne nouvelle, et ce tracé-ci
          dit le contraire. Ne pas l'écrire, c'est laisser deux dessins opposés se
          ressembler. */}
      <p className="note">Le tracé part de zéro, et plus il monte, plus il y en a.</p>
    </div>
  )
}
