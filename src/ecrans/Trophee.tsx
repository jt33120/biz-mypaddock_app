import { Icone } from './Icones'

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
/**
 * ⚠ ④ IL EST SUR LA GRILLE COMMUNE — récit 20.2. Il était en `stroke` de 1,8 sur
 *   24 × 24 : un trait fin et lisse, seul de son espèce, à côté d'aplats pixel.
 *   Deux registres côte à côte se voient, et c'est exactement ce que Julian
 *   appelle « un assemblage ». Le dessin vit maintenant dans `Icones.tsx` avec
 *   les dix autres ; ce fichier garde son nom et ses trois clauses, qui sont ce
 *   qu'on vient y chercher.
 */
export function Trophee({ taille = 18 }: { taille?: number }) {
  return <Icone nom="trophee" taille={taille} className="trophee" />
}
