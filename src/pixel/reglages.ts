/**
 * LES RÉGLAGES DU PIXEL — récit 3bis.3, premier critère : « ils entrent tels
 * quels et EN UN SEUL ENDROIT — un module, des constantes nommées, et aucun
 * réglage par photo ».
 *
 * Chacune de ces valeurs a été MESURÉE sur images au banc de rendu, pas
 * choisie. Les changer sans repasser par le banc dégrade le sprite en silence,
 * parce qu'aucune ne produit d'erreur quand elle est fausse — elle produit une
 * image un peu moins bonne, ce qui ne se remarque qu'en comparant.
 *
 * ⚠ CE MODULE NE CONTIENT PAS LE PROMPT, et c'est délibéré. Le prompt vit dans
 * la fonction serveur, pour deux raisons qui tiennent chacune seule : un client
 * qui enverrait son propre prompt ferait payer à Julian n'importe quelle
 * génération ; et la grille du prompt et celle de la spritification doivent être
 * la même — la fonction RENVOIE donc la sienne, et le client s'en sert. Deux
 * constantes égales dans deux dépôts finissent toujours par diverger.
 */

/** Le côté de la grille logique, en cellules. Le prompt demande la même : la
 *  valeur ici n'est qu'un repli quand le serveur n'a rien dit. */
export const GRILLE = 128

/** Palette finale. 26 est le nombre du prompt, et la contrainte qui donne au
 *  sprite son air 16 bits — au-delà on retrouve une photo pixellisée. */
export const COULEURS_MAX = 26

/** Tolérance de l'inondation qui détache le fond, en somme des écarts RVB.
 *  46 tient le bruit de compression JPEG sans mordre sur le contour sombre du
 *  sprite. Plus haut, la machine se fait manger par le fond ; plus bas, une
 *  frange verte subsiste. */
export const TOLERANCE_FOND = 46

/** Deux couleurs plus proches que cet écart ne comptent pas comme deux teintes.
 *  Sans ce filtre, la palette se remplit de vingt-six nuances du même rouge et
 *  le sprite perd ses aplats. */
export const ECART_TEINTE_MIN = 30

/** Le vote de couleur se fait sur des classes de 5 bits par canal : sinon le
 *  bruit de compression fait de chaque pixel une couleur unique et la modale
 *  n'a plus de majorité à trouver. */
export const BITS_CLASSE = 5
