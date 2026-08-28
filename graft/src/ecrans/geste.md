# src/ecrans/geste.ts

- ecrirePuisRelire · function · L56-L67 — async function ecrirePuisRelire<T>( ecrire: () => Promise<T>, relire: () => Promise<void>, ): Promise<{ valeur: T; relue: boolean }>
- useGeste · function · L69-L117 — function useGeste<A extends unknown[]>( faire: (...a: A) => Promise<unknown> | unknown, messageErreur?: string, surErreur?: (message: string | null) => void, )
