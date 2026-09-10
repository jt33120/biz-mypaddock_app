import { Wrench, ChartNoAxesCombined, ChartColumn, House, UserRound, Package, HardHat, Bike, Trash2, Pencil, CalendarDays, Camera, Wallet, Trophy, TriangleAlert } from 'lucide-react'
import type { Nom } from './dessins'
export { GRILLE, chemins, dessins, type Nom } from './dessins'
const ICONES = { barres: ChartColumn, maison: House, pilote: UserRound, cle: Wrench, courbe: ChartNoAxesCombined, caisse: Package, casque: HardHat, moto: Bike, poubelle: Trash2, crayon: Pencil, calendrier: CalendarDays, photo: Camera, portefeuille: Wallet, trophee: Trophy, impact: TriangleAlert }
/** Consistent, smooth interface icons. The adjacent label owns the accessible name. */
export function Icone({ nom, taille = 20, titre, className }: { nom: Nom; taille?: number; titre?: string; className?: string }) {
  const Dessin = ICONES[nom]
  return <Dessin className={className ? `icone ${className}` : 'icone'} size={taille} strokeWidth={1.7} role={titre ? 'img' : undefined} aria-label={titre} aria-hidden={titre ? undefined : true} focusable="false" />
}
