/**
 * LES ICÔNES — épique 20, récits 20.2 à 20.4. LES DESSINS.
 *
 * Retour de Julian du 25 août : « Plus d'icônes que de texte : une clé à
 * molette pour la maintenance, une courbe ou une cartographie moteur pour les
 * améliorations, un casque pour l'équipement. »
 *
 * ═══ QUATRE DÉCISIONS, ET AUCUNE N'EST DE GOÛT ════════════════════════════
 *
 * ① UN TRACÉ, JAMAIS UN EMOJI. 🔧 est rendu par la police du système : bombé et
 *   coloré sur iOS, plat sur Android, absent d'un WebView pauvre. Un dessin en
 *   SVG prend la couleur du texte qu'il accompagne et reste le même partout.
 *   C'est la convention déjà écrite et argumentée dans `Trophee.tsx`, et la
 *   même raison qui met les fontes en data URI (NFR-4).
 *
 * ② UNE SEULE GRILLE : 12 × 12, EN APLATS. Le trophée était en `stroke` de 1,8
 *   sur 24 × 24 — un registre de trait fin, lisse, qui ne ressemble à rien
 *   d'autre dans cette application. Deux registres côte à côte se voient
 *   immédiatement, et c'est exactement ce que Julian appelle « un assemblage ».
 *   Le trophée est donc redessiné ici, sur la même grille que les autres.
 *
 * ③ LE DESSIN EST LISIBLE DANS LA SOURCE, ET C'EST TOUT L'INTÉRÊT. Un attribut
 *   `d` copié d'une bibliothèque est opaque : personne ne peut vérifier qu'il
 *   tombe sur la grille, personne ne peut le corriger, et personne ne voit ce
 *   qu'il dessine sans l'ouvrir dans un navigateur. Ici le tracé EST le dessin :
 *   douze lignes de douze caractères, `#` pour un pixel plein. On voit la clé à
 *   molette en lisant le fichier, on la corrige en déplaçant un dièse, et il est
 *   IMPOSSIBLE de sortir de la grille — il n'y a pas de coordonnée à écrire.
 *
 *   Conséquence directe : rien n'est emprunté, donc rien n'est à créditer. Le
 *   plan prévoyait de copier sept tracés de pixelarticons (MIT) avec leur
 *   mention de licence ; aucun de leurs 4 600 tracés ne contient de casque ni de
 *   moto, il aurait fallu en dessiner trois à la main de toute façon, et un jeu
 *   moitié emprunté moitié maison est précisément l'assemblage qu'on retire.
 *
 * ④ L'ICÔNE PERD TOUJOURS CONTRE LE SPRITE. Là où un portrait pixel existe pour
 *   cette moto ou cet équipement, c'est LUI qui s'affiche. L'icône n'est qu'une
 *   amorce sourde, un état vide : si elle est jolie, elle concurrence le sprite,
 *   et le sprite est le sujet du produit.
 *
 * ⚠ ET AUCUNE ICÔNE NE PORTE DE SENS À ELLE SEULE — UX-DR8. Le mot reste, à
 * côté, toujours. Une couleur ou un pictogramme seul exclut ; et sous la pluie,
 * gants aux mains, à travers une visière, c'est le mot qu'on lit.
 *
 * ⚠ LES DESSINS VIVENT DANS CE FICHIER-CI, SANS UNE LIGNE DE JSX, et ce n'est
 * pas du rangement. Le banc unitaire tourne dans un vrai navigateur sur les
 * modules réels servis par Vite : importer un `.tsx` depuis le banc casse le
 * préambule de rafraîchissement de React et AUCUN essai ne tourne — pas un seul,
 * pas seulement ceux des icônes. Un jeu d'icônes qu'on ne peut pas éprouver
 * serait exactement le genre de chose qui se décale d'un pixel sans un mot.
 */

/** Le seul vocabulaire du produit. Une icône qui n'est pas ici n'existe pas :
 *  le type refuse le nom inventé au moment de l'écrire, pas au moment de le
 *  rendre — un `<Icone nom="clé" />` silencieusement vide est le défaut
 *  classique des jeux d'icônes par chaîne de caractères. */
export type Nom =
  | 'cle' | 'courbe' | 'caisse' | 'casque' | 'moto'
  | 'poubelle' | 'crayon' | 'calendrier' | 'photo' | 'portefeuille' | 'trophee'
  | 'impact'

/* ─── LES DESSINS ──────────────────────────────────────────────────────────
   Douze lignes de douze caractères. `#` est un pixel plein, tout le reste est
   du vide. Rien d'autre n'est permis, et un essai unitaire recompte les deux
   dimensions de chacun : un dessin de onze lignes se rendrait décalé, sans
   erreur et sans que rien ne le dise. */
const DESSINS: Record<Nom, string> = {
  /* LA CLÉ À MOLETTE — ce qui ENTRETIENT. Mâchoire ouverte en haut à gauche,
     manche en diagonale : c'est la seule forme qu'on reconnaît à 16 px. */
  cle: `
............
..##.##.....
..##.##.....
..#####.....
...###......
...####.....
....####....
.....####...
......####..
.......###..
............
............`,

  /* LA COURBE — ce qui AMÉLIORE. Une cartographie moteur : un axe, et une
     puissance qui monte puis s'aplatit. Elle n'est PAS l'icône de l'argent —
     voir `portefeuille` : une courbe de coût qui monte est très près d'un
     verdict. */
  courbe: `
............
.#..........
.#.......###
.#......##..
.#.....##...
.#....##....
.#...##.....
.#..##......
.#.##.......
.###........
.##########.
............`,

  /* LA CAISSE À OUTILS — les BRICOLES, et le carnet de l'atelier. */
  caisse: `
............
....####....
...#....#...
.##########.
.##########.
.#........#.
.#..####..#.
.#..####..#.
.#........#.
.##########.
............
............`,

  /* LE CASQUE — l'ÉQUIPEMENT. Récit 20.4. Calotte, écran ouvert à gauche,
     mentonnière à droite : les trois traits qui font lire « casque » et non
     « ballon ». La combinaison a été tentée et abandonnée — à 12 × 12 elle ne
     se distingue pas d'un bonhomme, et le libellé texte suffit. */
  casque: `
............
...#####....
..#######...
.#########..
.##.....###.
.#.......##.
.#.......##.
.#......###.
.##....####.
.#########..
..#######...
............`,

  /* LA MOTO — la MACHINE, en état vide seulement. Volontairement plate : deux
     roues et une ligne de cadre. Là où le portrait pixel existe, c'est lui qui
     s'affiche, et cette icône ne doit jamais lui faire concurrence. */
  moto: `
............
............
.......####.
......##....
...#######..
..#########.
.###.....###
.#.#.....#.#
.###.....###
............
............
............`,

  /* LA POUBELLE — ce qui DÉTRUIT. Elle accompagne le mot, elle ne le remplace
     jamais : récit 21.3, le rouge et le mot portent le sens, l'icône aide à le
     trouver vite. */
  poubelle: `
............
....####....
..########..
............
..########..
..#.#..#.#..
..#.#..#.#..
..#.#..#.#..
..#.#..#.#..
..########..
............
............`,

  /* LE CRAYON — ce qui MODIFIE. Récits 21.1 et 22.1 : « modifier la moto »,
     « modifier ce roulage ». */
  crayon: `
............
........###.
.......####.
......####..
.....####...
....####....
...####.....
..####......
.####.......
.###........
.##.........
............`,

  /* LE CALENDRIER — une JOURNÉE. */
  calendrier: `
............
..#....#....
..#....#....
.##########.
.##########.
.#........#.
.#.##.##..#.
.#........#.
.#.##.##..#.
.#........#.
.##########.
............`,

  /* L'APPAREIL PHOTO — l'ALBUM. */
  photo: `
............
....###.....
.##########.
.#........#.
.#..####..#.
.#.##..##.#.
.#.##..##.#.
.#..####..#.
.#........#.
.##########.
............
............`,

  /* LE PORTEFEUILLE — l'ARGENT, et ce n'est PAS une courbe ni une jauge. Le
     portefeuille ÉNONCE ; une jauge ou une courbe de croissance JUGERAIT, et
     « dépasser son budget n'est pas une faute ». */
  portefeuille: `
............
.#########..
.##########.
.#........#.
.#........#.
.#......###.
.#......#.#.
.#......###.
.#........#.
.##########.
............
............`,

  /* L'IMPACT — une information de carnet, pas une alerte. Le dessin reprend
     l'éclat demandé sans dépendre du rendu variable de l'emoji système. Le mot
     « Crash » reste toujours à côté : le pictogramme ne porte jamais le sens
     seul. */
  impact: `
.....#......
..#..#..#...
...#.#.#....
....###.....
.#########..
....###.....
...#.#.#....
..#..#..#...
.....#......
............
............
............`,

  /* LE TROPHÉE — redessiné sur la grille commune. Il CONSTATE, il ne décerne
     pas : il marque le MEILLEUR TOUR, un fait mesuré, et n'est jamais posé sur
     un objectif, un reste-à-faire ou un rang. */
  trophee: `
............
.##########.
###......###
###......###
.##########.
.##########.
..########..
....####....
....####....
...######...
..########..
............`,
}

/** Le côté de la grille. Il vaut pour le `viewBox` ET pour la lecture du
 *  dessin : les deux ne peuvent pas diverger. */
export const GRILLE = 12

/**
 * DU DESSIN AU TRACÉ — une fois, au chargement du module.
 *
 * Chaque suite horizontale de pixels pleins devient UN rectangle, pas un par
 * pixel : une icône pleine passe de 144 commandes à une douzaine. Le tracé
 * reste en aplats, sur des coordonnées entières, donc parfaitement net à toute
 * taille avec `shape-rendering: crispEdges`.
 */
const enChemin = (art: string): string => {
  const lignes = art.trim().split('\n')
  let d = ''
  lignes.forEach((ligne, y) => {
    let x = 0
    while (x < ligne.length) {
      if (ligne[x] !== '#') { x++; continue }
      let n = 0
      while (ligne[x + n] === '#') n++
      d += `M${x} ${y}h${n}v1h-${n}z`
      x += n
    }
  })
  return d
}

export const CHEMINS: Record<Nom, string> = Object.fromEntries(
  (Object.keys(DESSINS) as Nom[]).map((n) => [n, enChemin(DESSINS[n])]),
) as Record<Nom, string>

/** Ce que le module a réellement dessiné, pour le banc. Un essai qui relirait
 *  les chaînes de caractères éprouverait le commentaire ; celui-ci éprouve ce
 *  qui part. */
export const dessins = () => DESSINS
export const chemins = () => CHEMINS
