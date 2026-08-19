import { useCallback, useRef, useState } from 'react'

/**
 * UN GESTE NE PART QU'UNE FOIS — et ce fichier existe à cause d'un défaut réel.
 *
 * Julian a ouvert l'application avec 25 roulages là où il en avait saisi 5.
 * Aucune jointure ne les multipliait : c'est le bouton « Continuer » qui restait
 * vivant, à l'écran, pendant que l'écriture se faisait. Sur un téléphone, cette
 * écriture n'est pas instantanée — OPFS passe par un worker, `creerRoulage`
 * marque la saisie, puis l'accueil se recalcule en quatre requêtes. Rien ne
 * bouge à l'écran pendant ce temps. Alors on retape. Et chaque tap écrit une
 * journée de plus.
 *
 * ⚠ LE VERROU EST UN `useRef`, PAS UN `useState`, et c'est tout l'intérêt.
 * `setOccupe(true)` ne prend effet qu'au rendu suivant : deux taps dans la même
 * image voient tous les deux `occupe === false` et passent tous les deux. Seule
 * une valeur mutable lue et écrite dans le même tour ferme réellement la porte.
 * L'état, lui, ne sert qu'à le DIRE — un bouton qui se verrouille sans le
 * montrer se retape exactement comme un bouton qui ne se verrouille pas.
 */
export function useGeste<A extends unknown[]>(faire: (...a: A) => Promise<unknown> | unknown) {
  const [occupe, setOccupe] = useState(false)
  const enVol = useRef(false)

  const lancer = useCallback(async (...a: A) => {
    if (enVol.current) return
    enVol.current = true
    setOccupe(true)
    try {
      await faire(...a)
    } finally {
      enVol.current = false
      setOccupe(false)
    }
  }, [faire])

  return [lancer, occupe] as const
}
