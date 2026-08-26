import { useCallback, useEffect, useRef, useState } from 'react'

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
 *
 * ═══ LE TÉMOIN DE SAUVEGARDE — récit 22.3 ═════════════════════════════════
 *
 * « Un signe que ce que je viens de saisir est gardé, pour cesser de me demander
 * si l'application a fait quelque chose. » — Julian, 25 août.
 *
 * ⚠ IL SORT D'ICI ET DE NULLE PART AILLEURS, et ce n'est pas de la commodité :
 * `useGeste` enveloppe DÉJÀ chaque écriture du produit, donc il est le seul
 * endroit qui sache à la fois QU'une écriture a eu lieu et LAQUELLE — c'est-à-
 * dire quel bloc de l'écran la portait. Un témoin posé ailleurs — sur
 * `marquerSaisie`, par exemple, qui ne reçoit aucun contexte — s'allumerait sur
 * tous les blocs à l'écran à la fois, et un témoin qui désigne tout ne désigne
 * rien.
 *
 * ⚠ ET C'EST UN LISERÉ, PAS UN ROND QUI TOURNE. L'épine UX porte les deux
 * lignes, et elles ne disent pas la même chose : EXPERIENCE.md:212 —
 * « Chargement : il n'y en a pas au noyau ; un indicateur de chargement au
 * paddock est un aveu » — et EXPERIENCE.md:216 — « Synchronisation en attente :
 * un liseré discret sur la carte concernée, jamais une modale, jamais un
 * blocage ». La forme était donc DÉJÀ décidée, et elle répond exactement à la
 * demande. Un rond qui tourne demanderait de lever la 212, et c'est à Julian de
 * le dire.
 *
 * ⚠ IL NE DEVIENT JAMAIS UNE ALARME. Il s'allume quand c'est ÉCRIT, et il
 * s'éteint tout seul. Il ne dit rien de l'envoi au serveur, rien du réseau, rien
 * de ce qui reste en file : ce qui n'est pas parti n'est pas perdu, et le
 * paddock sans réseau ne doit voir aucune dégradation (NFR-7, EXPERIENCE.md:214).
 */

/** Combien de temps le liseré reste allumé. Assez pour être vu en levant les
 *  yeux, assez peu pour ne pas devenir un décor qu'on cesse de lire. */
export const DUREE_TEMOIN_MS = 1400

/** Sépare le fait durable de sa relecture. Une lecture qui échoue après un
 * INSERT réussi ne doit jamais transformer le bouton en invitation à recréer
 * la même ligne. L'appelant reçoit donc les deux vérités séparément. */
export async function ecrirePuisRelire<T>(
  ecrire: () => Promise<T>,
  relire: () => Promise<void>,
): Promise<{ valeur: T; relue: boolean }> {
  const valeur = await ecrire()
  try {
    await relire()
    return { valeur, relue: true }
  } catch {
    return { valeur, relue: false }
  }
}

export function useGeste<A extends unknown[]>(
  faire: (...a: A) => Promise<unknown> | unknown,
  messageErreur?: string,
  surErreur?: (message: string | null) => void,
) {
  const [occupe, setOccupe] = useState(false)
  const [garde, setGarde] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const enVol = useRef(false)
  /** ⚠ LE MINUTEUR SE COUPE AU DÉMONTAGE. Sans ça, un `setGarde` arrive sur un
   *  composant qui n'existe plus — c'est sans conséquence visible en React 18,
   *  et c'est exactement le genre de fuite qu'on ne trouve jamais après coup. */
  const minuteur = useRef<number | null>(null)
  useEffect(() => () => { if (minuteur.current) window.clearTimeout(minuteur.current) }, [])

  const lancer = useCallback(async (...a: A) => {
    if (enVol.current) return
    enVol.current = true
    setOccupe(true)
    setErreur(null)
    surErreur?.(null)
    if (minuteur.current) window.clearTimeout(minuteur.current)
    minuteur.current = null
    setGarde(false)
    try {
      await faire(...a)
      // ⚠ APRÈS LE `await`, ET SEULEMENT LÀ. Allumer le témoin avant l'écriture
      // dirait « c'est gardé » d'une chose qui ne l'est pas encore — et le seul
      // service que ce témoin rend est d'être vrai. Une exception saute cette
      // ligne : ce qui a échoué ne s'annonce pas gardé.
      setGarde(true)
      minuteur.current = window.setTimeout(() => setGarde(false), DUREE_TEMOIN_MS)
    } catch (cause) {
      /* Un appelant qui fournit une phrase d'échec prend la responsabilité de
         la rendre dans son contexte. Le hook retient alors le rejet au lieu de
         laisser un `void lancer()` produire une promesse rejetée hors écran.
         Sans phrase, le comportement historique reste intact : l'erreur remonte
         et aucun ancien parcours ne devient silencieux par accident. */
      if (!messageErreur) throw cause
      setErreur(messageErreur)
      surErreur?.(messageErreur)
    } finally {
      enVol.current = false
      setOccupe(false)
    }
  }, [faire, messageErreur, surErreur])

  return [lancer, occupe, garde, erreur] as const
}
