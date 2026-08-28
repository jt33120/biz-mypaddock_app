# src/ecrans/glissement.ts

- Glissement · type · L60-L75 — type Glissement = { /** `true` quand les languettes sont révélées. */ ouvert: boolean /** Le chemin SANS glissement — clavier, lecteur d'écran, ou simple ignorance * du geste. Il n'est pas une commodité : c'est ce qui rend l'ensemble * atteignable (EXPERIENCE.md:46). */ ouvrir: () => void fermer: () => void /** À étaler sur l'élément qui glisse. */ liaisons: { onPointerDown: (e: React.PointerEvent) => void onPointerMove: (e: React.PointerEvent) => void onPointerUp: (e: React.PointerEvent) => void onPointerCancel: (e: React.PointerEvent) => void } }
- useGlissement · function · L77-L125 — function useGlissement(): Glissement
