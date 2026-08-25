// Les types de `destructif.mjs`, pour l'essai unitaire qui l'importe depuis du
// TypeScript. Le module reste en JavaScript : il doit tourner tel quel dans
// Node, où le banc de fumée le charge sans transpilation.

export type Bouton = {
  /** Tous les libellés possibles : le texte nu et les chaînes d'un ternaire. */
  libelles: string[]
  /** Le contenu de `onClick={…}`, accolades équilibrées. Vide s'il n'y en a pas. */
  gestionnaire: string
  /** Le `className` littéral de la balise, ou '' s'il est calculé. */
  className: string
  /** Le bouton porte-t-il `className="… destructif"` ? */
  classe: boolean
}

export declare const DIT_LA_DESTRUCTION: RegExp
export declare const normaliser: (libelle: string) => string
export declare const gestesDestructifs: (modules: Record<string, string>) => Set<string>
export declare const boutonsDe: (source: string) => Bouton[]
export declare const ditLaDestruction: (bouton: Bouton) => boolean
export declare const appelleUneDestruction: (bouton: Bouton, noms: Set<string>) => boolean
export declare const detruit: (bouton: Bouton, noms: Set<string>) => boolean
export declare const libellesQuiDetruisentSansLeDire: (
  modules: Record<string, string>,
) => Set<string>
