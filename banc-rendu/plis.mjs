/**
 * OUVRIR LES PLIS DE L'ÉCRAN COURANT — outil de banc, jamais de produit.
 *
 * Le lot 3 replie ce qui ne se lit pas d'un coup d'œil : le bilan de saison, le
 * chargement vide, la note du cercle sans compte, le coût de la journée,
 * l'album. Onze fumées se sont arrêtées le même jour sur la même phrase —
 * « waiting for locator(…) » — parce que ce qu'elles venaient lire existe
 * toujours, à un tap de distance.
 *
 * ⚠ ONZE COPIES DE CE GESTE AURAIENT DIVERGÉ AVANT LA FIN DE LA SEMAINE. C'est
 * le même raisonnement qui a produit `TeteRepli` côté produit : un geste écrit
 * onze fois est un geste qu'on corrigera dix fois.
 *
 * ⚠ ET IL N'OUVRE QUE CE QUI EST FERMÉ. `aria-expanded` est lu avant de taper :
 * cliquer une tête déjà ouverte la REFERME, et un utilitaire qui referme ce
 * qu'il vient d'ouvrir est un utilitaire qui rend l'essai rouge une fois sur
 * deux, selon l'état où il tombe. C'est le même piège que la réouverture du
 * budget dans `fumee-budget`, payé une fois déjà.
 *
 * ⚠ IL N'EST PAS UNE FAÇON DE CONTOURNER LE PLI. Un essai qui doit vérifier
 * qu'une chose se LIT SANS OUVRIR ne l'appelle pas — il lit l'en-tête. Cet
 * utilitaire sert aux essais qui éprouvent ce qu'il y a DEDANS, et pour qui le
 * pli n'est qu'un chemin de plus.
 */
export const ouvrirTousLesPlis = async (page) => {
  const tetes = page.locator('.atelier-tete[aria-expanded="false"]')
  // On relit le compte à chaque tour : ouvrir un pli peut en révéler un autre
  // (l'album vit à l'intérieur d'un écran que le premier tap déplie).
  for (let tour = 0; tour < 6; tour++) {
    const n = await tetes.count()
    if (!n) return
    for (let i = 0; i < n; i++) {
      const t = tetes.nth(0)
      if (!await t.count()) break
      await t.click({ timeout: 5_000 }).catch(() => {})
    }
  }
}
