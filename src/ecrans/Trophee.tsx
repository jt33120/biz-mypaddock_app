/**
 * LE TROPHÉE — demandé par Julian, « un icône trophée à côté du meilleur temps
 * au tour sur l'écran d'accueil ».
 *
 * Trois décisions tiennent dans ces vingt lignes :
 *
 * ① UN TRACÉ, PAS UN EMOJI. 🏆 est rendu par la police du système : doré et
 *   bombé sur iOS, plat et jaune sur Android, absent d'un WebView pauvre. Un
 *   dessin en SVG prend la couleur du texte qu'il accompagne et reste le même
 *   partout — c'est la même raison qui met les fontes en data URI (NFR-4).
 *
 * ② IL CONSTATE, IL NE DÉCERNE PAS. C'est la clause la plus fine du produit et
 *   c'est ici qu'elle se joue : le trophée marque LE MEILLEUR TOUR, un fait
 *   mesuré, et n'est jamais posé sur un objectif, un reste-à-faire ou un rang.
 *   Il n'apparaît donc que là où un chrono existe déjà.
 *
 * ③ IL EST DÉCORATIF POUR UN LECTEUR D'ÉCRAN. Le chrono qu'il accompagne porte
 *   déjà son libellé en toutes lettres ; l'annoncer une seconde fois ferait lire
 *   « trophée » à quelqu'un qui vient d'entendre « meilleur tour ».
 */
export function Trophee({ taille = 18 }: { taille?: number }) {
  return (
    <svg className="trophee" width={taille} height={taille} viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" focusable="false">
      {/* La coupe */}
      <path d="M7 3h10v6a5 5 0 0 1-10 0V3Z" />
      {/* Les deux anses — ce qui fait lire « coupe » et non « seau » */}
      <path d="M7 5H4v2a3 3 0 0 0 3 3" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3" />
      {/* Le pied et le socle */}
      <path d="M12 14v4" />
      <path d="M8 21h8" />
      <path d="M9 18h6v3H9z" />
    </svg>
  )
}
