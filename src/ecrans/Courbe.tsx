import { formaterChrono, formaterEcart } from '../db/depot'
import type { Courbe as Donnees } from '../db/courbe'

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
