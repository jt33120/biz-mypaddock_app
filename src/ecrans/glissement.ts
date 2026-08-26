import { useCallback, useRef, useState } from 'react'

/**
 * LE GLISSEMENT QUI RÉVÈLE — récit 22.2.
 *
 * ⚠ UNE RÈGLE ÉCRITE DU PRODUIT SE LÈVE ICI, ET ELLE VISAIT NOMMÉMENT CET
 * ÉLÉMENT. EXPERIENCE.md, 18 août :
 *
 *   « Aucun balayage n'y supprime quoi que ce soit — avec des gants, un
 *     balayage destructeur se déclenche seul. »
 *
 * Julian demande l'inverse le 25 août. La règle ne se contourne pas en silence :
 * elle se lève, datée, et la forme qui la respecte MALGRÉ TOUT est celle-ci — le
 * glissement RÉVÈLE, il ne détruit pas. L'objection d'origine était juste et
 * elle reste vraie : avec des gants, un balayage destructeur se déclenche seul.
 * C'est pourquoi rien n'est fait au relâchement du doigt. Deux languettes
 * apparaissent, et il faut encore les viser.
 *
 * ⚠ ET LA CONFIRMATION NE BOUGE PAS D'UN MILLIMÈTRE. Le glissement remplace le
 * PREMIER tap — celui qui ouvrait « Retirer cette journée » — jamais le second.
 * La phrase qui nomme ce qui part (« avec 2 sessions chronométrées, 4 photos et
 * 1 dépense — 180 € ») est toujours là, et elle est toujours le dernier mot.
 *
 * ═══ TROIS PIÈGES, ET AUCUN NE SE VOIT À LA RELECTURE ══════════════════════
 *
 * ① LE DÉFILEMENT VERTICAL NE DOIT JAMAIS OUVRIR UNE LANGUETTE. C'est le défaut
 *   qui rend ces listes détestables : on fait défiler, une ligne s'entrouvre, on
 *   tape au hasard. La direction se DÉCIDE au premier mouvement significatif et
 *   ne change plus jusqu'au relâchement — sans ce verrou, un pouce qui dérive
 *   fait basculer la ligne au milieu d'un défilement. `touch-action: pan-y` sur
 *   l'élément laisse le navigateur garder le défilement vertical pour lui.
 *
 * ② LE SEUIL EST UNE DISTANCE, PAS UNE VITESSE. Un seuil de vitesse récompense
 *   le geste sec et punit le geste appliqué : gants aux mains, c'est exactement
 *   l'inverse de ce qu'on veut.
 *
 * ③ ET IL FAUT UN CHEMIN SANS GLISSEMENT. EXPERIENCE.md:46 interdit tout geste
 *   caché comme SEUL chemin — au clavier, en lecteur d'écran, ou simplement
 *   quand on ne sait pas que le geste existe. `ouvrir()` est exposé pour ça, et
 *   la ligne pose un bouton qui l'appelle.
 *
 * ⚠ AUCUNE BIBLIOTHÈQUE. `react-swipeable-list` est la seule qui fasse vraiment
 * des languettes : son bundle ESM ne contient AUCUNE occurrence de `aria-`,
 * `role`, `tabindex` ni `onkeydown`, il importe `prop-types` sans le déclarer
 * (donc ne résout pas en pnpm strict), et rien n'y est publié depuis octobre
 * 2024. `@dnd-kit` fait 1,07 Mo de tri, `vaul` traîne quinze sous-paquets Radix,
 * et `react-swipeable` n'est qu'un détecteur de geste. Ce fichier fait quatre-
 * vingts lignes avec les Pointer Events, qui sont dans tous les navigateurs
 * visés.
 */

/** La distance à parcourir vers la gauche pour que les languettes s'ouvrent.
 *  Assez pour n'être jamais accidentelle, assez peu pour se faire au pouce. */
export const SEUIL_PX = 48

/** Au-delà de cette dérive verticale avant le seuil horizontal, on considère que
 *  le doigt défile, et la ligne ne s'ouvrira pas de ce geste-là. */
export const DERIVE_MAX = 12

export type Glissement = {
  /** `true` quand les languettes sont révélées. */
  ouvert: boolean
  /** Le chemin SANS glissement — clavier, lecteur d'écran, ou simple ignorance
   *  du geste. Il n'est pas une commodité : c'est ce qui rend l'ensemble
   *  atteignable (EXPERIENCE.md:46). */
  ouvrir: () => void
  fermer: () => void
  /** À étaler sur l'élément qui glisse. */
  liaisons: {
    onPointerDown: (e: React.PointerEvent) => void
    onPointerMove: (e: React.PointerEvent) => void
    onPointerUp: (e: React.PointerEvent) => void
    onPointerCancel: (e: React.PointerEvent) => void
  }
}

export function useGlissement(): Glissement {
  const [ouvert, setOuvert] = useState(false)
  /** ⚠ MUTABLE, PAS UN ÉTAT — même motif que le verrou de `useGeste`. Un
   *  `setState` ne prend effet qu'au rendu suivant, et un geste tactile produit
   *  des dizaines d'événements avant le premier rendu : la direction serait
   *  redécidée à chaque image, donc jamais verrouillée. */
  const depart = useRef<{ x: number; y: number } | null>(null)
  const direction = useRef<'indecis' | 'horizontal' | 'vertical'>('indecis')

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    depart.current = { x: e.clientX, y: e.clientY }
    direction.current = 'indecis'
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = depart.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y

    // ① LA DIRECTION SE DÉCIDE UNE FOIS. Un pouce qui dérive de quelques pixels
    //    en défilant ne doit pas pouvoir faire basculer la ligne à mi-course.
    if (direction.current === 'indecis') {
      if (Math.abs(dy) > DERIVE_MAX) { direction.current = 'vertical'; return }
      if (Math.abs(dx) > DERIVE_MAX) direction.current = 'horizontal'
      else return
    }
    if (direction.current !== 'horizontal') return

    // ② UNE DISTANCE, PAS UNE VITESSE. Et le geste inverse referme, ce qui est
    //    la seule manière de se raviser sans lever le doigt.
    if (dx <= -SEUIL_PX) setOuvert(true)
    if (dx >= SEUIL_PX) setOuvert(false)
  }, [])

  const finir = useCallback(() => {
    depart.current = null
    direction.current = 'indecis'
  }, [])

  return {
    ouvert,
    ouvrir: useCallback(() => setOuvert(true), []),
    fermer: useCallback(() => setOuvert(false), []),
    liaisons: {
      onPointerDown, onPointerMove, onPointerUp: finir, onPointerCancel: finir,
    },
  }
}
