/**
 * LE RETRAIT DE L'ÉCRAN DE CHARGEMENT — la seule ligne de JavaScript qu'il ait.
 *
 * Le décor lui-même vit dans index.html, peint avant qu'une ligne de script ne
 * soit lue (le motif complet y est écrit). Il ne reste ici qu'à décider QUAND il
 * part, et c'est la seule chose qui demande à réfléchir.
 *
 * ⚠ UNE DURÉE MINIMALE GARANTIE, ET C'EST UN CHOIX DE JULIAN, PAS UN OUBLI.
 * Sur un ordinateur, tout est prêt en ~80 ms : l'écran apparaîtrait et
 * disparaîtrait dans le même battement de cils — un clignotement, pas une
 * ouverture. Ralentir volontairement une application est normalement une faute ;
 * ici c'est la condition pour que la chose existe. Il a tranché le 25 août 2026,
 * en connaissant le coût.
 *
 * ⚠ ET IL NE RETARDE JAMAIS RIEN D'AUTRE. Le décor s'efface par-dessus une
 * application DÉJÀ montée et déjà utilisable : ce qui attend, c'est le décor, pas
 * le pilote. Un tap qui arrive à 400 ms atteint l'écran en dessous dès que le
 * calque est retiré, et rien n'a été perdu.
 */

/** 600 ms — assez pour voir les feux s'allumer une fois, trop peu pour agacer. */
export const DUREE_MINIMALE_MS = 600

let parti = false

export const retirerLEcranDeChargement = (): void => {
  if (parti) return
  parti = true
  const decor = document.getElementById('chargement')
  if (!decor) return

  // `performance.now()` compte depuis le début de la navigation : c'est
  // exactement l'âge de l'écran, sans avoir à poser un repère nulle part.
  const reste = Math.max(0, DUREE_MINIMALE_MS - performance.now())

  window.setTimeout(() => {
    decor.classList.add('ch-parti')
    // On attend la fin de la transition pour retirer le nœud — le laisser en
    // place, même transparent, garderait un calque au-dessus de toute
    // l'application, et les taps ne passeraient plus.
    const retirer = () => decor.remove()
    decor.addEventListener('transitionend', retirer, { once: true })
    // Filet : `transitionend` ne se déclenche pas quand la transition est
    // désactivée (prefers-reduced-motion) ni si l'onglet passe en arrière-plan.
    window.setTimeout(retirer, 400)
  }, reste)
}
