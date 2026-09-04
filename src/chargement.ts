/**
 * L'ÉCRAN DE CHARGEMENT — sa durée, sa barre, et ce qu'elle mesure.
 *
 * Le décor lui-même vit dans index.html, peint avant qu'une ligne de script ne
 * soit lue (le motif complet y est écrit). Ce module décide QUAND il part et
 * COMBIEN il en montre — les deux seules choses qui demandent à réfléchir.
 *
 * ⚠ UNE DURÉE MINIMALE GARANTIE, ET C'EST UN CHOIX DE JULIAN, PAS UN OUBLI.
 * Sur un ordinateur, tout est prêt en ~80 ms : l'écran apparaîtrait et
 * disparaîtrait dans le même battement de cils — un clignotement, pas une
 * ouverture. Ralentir volontairement une application est normalement une faute ;
 * ici c'est la condition pour que la chose existe. Il a tranché le 25 août 2026
 * en connaissant le coût, et l'a portée de 600 ms à 3 s le 4 septembre :
 * « l'écran de chargement est un peu trop court ».
 *
 * ⚠ CE QUE LES TROIS SECONDES COÛTENT VRAIMENT, ET LE COMMENTAIRE QUI MENTAIT.
 * Il disait : « il ne retarde jamais rien d'autre […] un tap qui arrive à 400 ms
 * atteint l'écran en dessous dès que le calque est retiré ». C'était vrai à
 * 600 ms et ça ne l'est plus : le décor est un calque plein écran en `z-index:
 * 9999`, il INTERCEPTE les taps tant qu'il est là. À trois secondes, ce n'est
 * plus un détail — c'est trois secondes pendant lesquelles le pilote ne peut
 * rien faire. C'est le prix assumé de l'ouverture, et la barre existe
 * précisément pour que ces trois secondes se lisent comme un travail et non
 * comme un blocage.
 *
 * ⚠ ET ELLES SONT MAINTENANT REMPLIES. Avant, le décor partait dès que la base
 * était ouverte — donc AVANT que l'accueil ait ses données : on voyait la scène
 * s'effacer sur un écran qui finissait de s'assembler. Les cinq étapes
 * ci-dessous vont jusqu'à la saison lue, ce qui veut dire que le décor ne s'en
 * va plus que sur un premier écran RÉELLEMENT prêt. « La rendre utile et
 * fonctionnelle en préchargeant tout ce qui est nécessaire » — c'est ça.
 */

/** 3 000 ms — le plancher posé par Julian le 4 septembre 2026. */
export const DUREE_MINIMALE_MS = 3000

/**
 * ⚠ IL Y A EU CINQ ÉTAPES ICI, ET LA MESURE LES A RÉFUTÉES — le même jour.
 *
 * La première version déclarait cinq étapes d'ouverture (`coffre`,
 * `persistance`, `referentiel`, `ouverture`, `saison`), les faisait franchir
 * par `App.tsx`, et peignait la barre dans une boucle `requestAnimationFrame`
 * pour qu'elle avance sur du travail réel plutôt que sur un chronomètre. C'était
 * la bonne intention — c'est même exactement ce que `Attente.tsx` exige d'un
 * témoin d'attente.
 *
 * Relevé au banc, en échantillonnant la barre dans le temps :
 *
 *     t= 300 ms   1/30      t=1500 ms   8/30
 *     t= 800 ms   8/30      t=2200 ms   8/30
 *                           t=2900 ms   8/30
 *
 * Elle GELAIT deux secondes durant. L'ouverture du moteur SQLite bloque le fil
 * principal — c'est précisément ce qui prend du temps — donc `rAF` ne tourne
 * plus, donc la barre s'arrête exactement pendant l'attente qu'elle devait
 * meubler. Une barre immobile se lit comme une panne : le remède était pire que
 * le mal.
 *
 * L'animation est donc passée à CSS, où elle vit sur le compositeur et continue
 * pendant que le fil principal peine — comme les bandes de la route de ce même
 * décor, qui n'ont jamais cessé de défiler. Ce qui restait des cinq étapes après
 * ça n'aurait plus rien piloté : du code mort qui ressemble à la façon de faire,
 * et c'est celui-là qu'on rappelle six mois plus tard.
 *
 * ⚠ CE QUI A SURVÉCU, ET QUI ÉTAIT LE VRAI SUJET. Le décor ne part plus quand la
 * base est ouverte, mais quand le PREMIER ÉCRAN a ses données (`App.tsx`,
 * `pretPremierEcran`). C'est ça, « la rendre utile et fonctionnelle en
 * préchargeant tout ce qui est nécessaire » : avant, la scène s'effaçait sur un
 * accueil qui finissait de s'assembler. Les trois secondes servent maintenant à
 * quelque chose au lieu de s'écouler à vide.
 */

/** Le décor ne part qu'une fois. `retirerLEcranDeChargement` est appelée depuis
 *  un effet React, qui peut se rejouer. */
let parti = false

export const retirerLEcranDeChargement = (): void => {
  if (parti) return
  parti = true
  const decor = document.getElementById('chargement')
  if (!decor) return

  const reste = Math.max(0, DUREE_MINIMALE_MS - performance.now())

  /* ⚠ ET LA POLICE FINIT DE SE DÉCODER AVANT QUE LE DÉCOR PARTE. Elle est
     embarquée en base64 dans la feuille (`fontes.css`) : il n'y a pas de requête
     réseau à attendre, mais il reste un décodage, et `font-display: block` rend
     le texte INVISIBLE tant qu'il n'est pas fini. Sans cette attente, le décor
     peut s'effacer sur un écran dont les mots ne sont pas encore là — un blanc
     d'un ou deux dixièmes que le pilote lit comme un raté, juste après trois
     secondes passées à regarder une belle scène.
     La course avec `reste` est délibérée : la police ne RETARDE rien, elle
     profite d'un temps déjà payé. Et si l'API se bloque, `Promise.race` la
     laisse derrière — un décor qui ne part jamais parce qu'une police n'a pas
     répondu serait exactement le défaut que le filet de `App.tsx` existe pour
     empêcher. */
  const polices = document.fonts?.ready
    ? Promise.race([document.fonts.ready, new Promise((r) => window.setTimeout(r, 1500))])
    : Promise.resolve()

  window.setTimeout(() => { void polices.then(() => {
    // ⚠ LA TRENTIÈME CELLULE, ET ELLE SE POSE ICI PARCE QU'ELLE NE SE GAGNE PAS
    // AU CHRONOMÈTRE. L'animation CSS parcourt le plancher de trois secondes et
    // s'arrête à 29/30 ; la dernière dit « c'est vraiment fini », et ce n'est
    // vrai qu'ici — quand la base est ouverte ET la saison lue.
    document.getElementById('ch-barre')?.classList.add('ch-plein')
    decor.classList.add('ch-parti')
    // On attend la fin de la transition pour retirer le nœud — le laisser en
    // place, même transparent, garderait un calque au-dessus de toute
    // l'application, et les taps ne passeraient plus.
    const retirer = () => decor.remove()
    decor.addEventListener('transitionend', retirer, { once: true })
    // Filet : `transitionend` ne se déclenche pas quand la transition est
    // désactivée (prefers-reduced-motion) ni si l'onglet passe en arrière-plan.
    window.setTimeout(retirer, 400)
  }) }, reste)
}
