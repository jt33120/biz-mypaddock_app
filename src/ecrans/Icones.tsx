import { CHEMINS, GRILLE, type Nom } from './dessins'

export { GRILLE, chemins, dessins, type Nom } from './dessins'

/**
 * L'ICÔNE À L'ÉCRAN.
 *
 * ⚠ ELLE EST DÉCORATIVE PAR DÉFAUT, et c'est le cas normal : le mot qu'elle
 * accompagne porte déjà le sens (UX-DR8). Un `titre` ne se passe que là où
 * l'icône est SEULE — et ces endroits doivent rester rares : une icône seule
 * est un rébus, gants aux mains et à travers une visière.
 */
export function Icone({ nom, taille = 16, titre, className }: {
  nom: Nom
  taille?: number
  /** Le nom accessible, UNIQUEMENT quand l'icône n'est accompagnée d'aucun mot. */
  titre?: string
  className?: string
}) {
  return (
    <svg className={className ? `icone ${className}` : 'icone'}
         width={taille} height={taille} viewBox={`0 0 ${GRILLE} ${GRILLE}`}
         fill="currentColor" shapeRendering="crispEdges"
         role={titre ? 'img' : undefined} aria-label={titre}
         aria-hidden={titre ? undefined : 'true'} focusable="false">
      {titre && <title>{titre}</title>}
      <path d={CHEMINS[nom]} />
    </svg>
  )
}
