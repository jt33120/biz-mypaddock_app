// d2 — SPRITE PIXEL 16 BITS ASSUMÉ.
//
// Le produit se pose comme une borne d'arcade (Hang-On, Out Run). Alors l'actif central du
// garage n'est pas une illustration « stylisée pixel » : c'est un SPRITE. Grille franche,
// palette courte, tramage assumé, contour fermé, zéro anti-aliasing.
//
// Les deux variables réelles, et tout le travail est là :
//   1. la TAILLE DE PIXEL APPARENTE — trop gros, la moto devient une bouillie et le pilote ne
//      reconnaît plus sa machine ; trop fin, le pixel n'est plus qu'un filtre.
//   2. la TAILLE DE PALETTE — trop courte, une moto noire (le cas Tracer) s'effondre en une
//      seule tache ; trop longue, les aplats se dissolvent en faux dégradé.
//
// JOURNAL DES ITÉRATIONS — ce qui a été mesuré sur les images, pas supposé.
// d2a (grille 128, palette 24) : fidélité machine bonne sur les trois, orientation respectée.
//   Trois défauts mesurés : (1) « BRIDGESTONE » écrit en entier sur le sabot de 9245 — la
//   consigne « pas de fausses lettres » ne suffit pas, le modèle recopie les marques QU'IL SAIT
//   LIRE ; il faut interdire l'alphabet lui-même. (2) grille non tenue et non homogène : fond
//   pixellisé au pas demandé, moto dessinée bien plus fin — il faut ancrer la largeur du SPRITE
//   en pixels logiques, pas seulement la grille de l'image. (3) fond à bandes horizontales trop
//   larges et bande cyan géante : le décor mangeait 60 % du cadre et écrasait la machine.
// d2b (mêmes réglages, texte durci, fond calmé) : plus aucune marque écrite — mais sur 9144 la
//   zone sponsor est devenue une SUITE de petits blocs rouges qui imite encore des lettres ; il
//   faut exiger des barres PLEINES sans découpe interne. Deux régressions : (1) sur 9245 le
//   modèle a dérivé vers un trois-quarts alors que d2a tenait le profil — dire « garde ce
//   trois-quarts » invite la rotation, il faut ancrer le flanc et le sens, et forcer le profil
//   dès que la photo est proche du profil ; (2) contamination violette : le blanc de la déco a
//   viré lavande et le noir au violet, le fond teinte la machine. Enfin la grille n'est toujours
//   pas tenue : donner un nombre de pixels logiques ne suffit pas, il faut un BUDGET DE DÉTAIL
//   élément par élément (diamètre de roue en carrés, hauteur du numéro en carrés).
export const version = 'd2c'
export const modele = 'gemini-3-pro-image'
export const entreePx = 1024

// Grille logique. 1024 / GRILLE reste un ENTIER : la consigne devient exécutable
// (agrandissement au plus proche voisin) au lieu d'être un adjectif.
const GRILLE = 128
const BLOC = 1024 / GRILLE
const LARGEUR_MOTO = 112 // en pixels logiques — c'est CE nombre qui fixe la grossièreté vue
const COULEURS = 26

export const prompt = (cadre) => `Tu redessines la photo fournie en SPRITE PIXEL ART 16 BITS,
comme un sprite de borne d'arcade Sega du milieu des années 80 (Hang-On, Out Run). L'image
fournie est la photo réelle de la moto d'un pilote.

RÈGLE QUI PRIME SUR LE STYLE : c'est CETTE moto, pas une moto. Le pilote doit reconnaître SA
machine au premier coup d'œil — son type (sportive carénée / routière à valises), sa silhouette,
la découpe de sa décoration, ses couleurs exactes, son numéro de course, la couleur de ses
jantes, ses suspensions, son échappement, ses bagages s'il y en a. Un joli sprite d'une autre
moto est un échec total. Le pixel simplifie ; il ne remplace pas et n'invente pas.

ORIENTATION — impérative, aucune liberté. Vérifie-la avant de dessiner.
1. LE FLANC. Le flanc de la moto visible sur la photo est celui visible sur le sprite. Jamais
   l'autre. Aucun effet miroir.
2. LE SENS. L'avant de la moto (roue avant, carénage de tête, fourche) pointe du MÊME CÔTÉ de
   l'image que sur la photo — si la roue avant est à droite sur la photo, elle est à droite sur
   le sprite.
3. L'ANGLE. Tu ne fais PIVOTER la machine sous aucun prétexte, et surtout pas vers un
   trois-quarts plus flatteur. Si la photo montre un profil ou presque un profil, le sprite est
   un PROFIL STRICT, sans aucune perspective, sans qu'on voie le guidon des deux côtés ni le
   dessus du réservoir. Si et seulement si la photo est franchement un trois-quarts, le sprite
   garde ce trois-quarts, du même côté et avec le même sens.
4. LA HAUTEUR D'OEIL reste celle de la photo : ni vue de dessus, ni contre-plongée.

ZÉRO LETTRE — la contrainte la plus stricte de cette commande.
AUCUNE lettre de l'alphabet n'apparaît nulle part dans l'image. Zéro. Le SEUL texte autorisé,
dans toute l'image, ce sont les CHIFFRES du numéro de course.
- Si tu reconnais une marque sur la photo — pneu, suspension, échappement, huile, équipe,
  constructeur — tu ne l'écris PAS, même si tu la lis parfaitement, même si elle est célèbre,
  même sur le flanc du pneu. Tu la remplaces par une barre, un chevron ou un carré de couleur
  pleine, de la bonne couleur et à la bonne place.
- Ni sur le sabot, ni sur le flanc du carénage, ni sur le pneu, ni sur le réservoir, ni sur le
  saute-vent, ni sur la selle, ni sur le top-case, ni sur le fond de l'image.
- Une zone de sponsor se rend par une BARRE PLEINE d'une seule couleur, rectangle uni sans
  aucune découpe interne. Interdit : une suite de petits blocs séparés par des vides, alignés
  comme des lettres — c'est encore du faux texte, même sans lettre reconnaissable. Un rectangle
  plein, ou rien.
- N'invente pas non plus de mot approximatif ni d'alphabet décoratif : un sprite de 1986 n'a pas
  de sponsors lisibles, il a des taches de couleur.
- Le numéro de course, lui, est net et gros : chiffres pleins, lisibles, à leur place réelle.
- Emblème du constructeur : toléré seulement s'il est un pur symbole sans lettres (le diapason
  Yamaha, l'aile Honda), réduit à 3 ou 4 pixels logiques. Sinon, rien.

LA GRILLE — c'est le coeur de la commande, applique-la littéralement.
TOUTE l'image — la machine ET le fond — est dessinée sur UNE SEULE grille de ${GRILLE} × ${GRILLE}
pixels logiques, puis agrandie exactement ${BLOC} fois au plus proche voisin.
- La moto elle-même ne fait que ~${LARGEUR_MOTO} pixels logiques de large et ~${Math.round(LARGEUR_MOTO * 0.62)} de haut. C'est
  volontairement peu : le sprite doit être SIMPLIFIÉ à ce budget, pas dessiné fin puis pixellisé.
- Chaque pixel logique est un CARRÉ PLEIN de ${BLOC} × ${BLOC} pixels de l'image finale, d'une
  couleur strictement uniforme, aligné sur la grille. Rien dans l'image n'est plus petit que ce
  carré, ni sur la moto, ni sur le fond.
- AUCUN anti-aliasing, aucun lissage, aucun flou, aucun dégradé continu, aucune transparence
  partielle, aucune ombre douce. Un bord courbe est un ESCALIER de carrés.
BUDGET DE DÉTAIL — la contrainte qui rend la grille réelle. Compte les carrés, littéralement.
- une roue complète, pneu compris : ~40 carrés de diamètre ;
- la jante seule : ~24 carrés, avec 4 ou 5 branches de 2 carrés d'épaisseur, pas plus ;
- un disque de frein : un anneau de 1 carré d'épaisseur, sans perçages ;
- les chiffres du numéro de course : 12 à 14 carrés de haut, traits de 2 carrés ;
- un rétroviseur : 3 carrés ; un clignotant : 2 carrés ; une vis, une durite, une soudure,
  une graduation : 0 carré, donc ABSENTES ;
- le bloc moteur : une masse sombre de 4 ou 5 aplats, pas un mécanisme détaillé ;
- un cadre en treillis devient deux barres ; un faisceau de câbles devient une ligne.
Tout détail qui ne tient pas dans son budget est SUPPRIMÉ, jamais rétréci. Un sprite lisible se
reconnaît à sa silhouette et à ses grandes taches de couleur, pas à ses petites pièces.

LA PALETTE.
${COULEURS} couleurs au maximum dans toute l'image, prélevées sur la photo. Chaque zone est un
APLAT. Le volume se rend en 3 valeurs par teinte (ombre / base / lumière), jamais plus, et les
transitions entre deux valeurs se font au TRAMAGE en damier régulier de pixels logiques
(dithering), visible et assumé. Les blancs spéculaires sont un ou deux pixels francs, pas un
halo.
ANTI-CONTAMINATION, à vérifier pixel par pixel : le FOND est violet, la MACHINE ne l'est JAMAIS.
Aucun pixel de la moto ne vire au violet, au mauve ni au lavande. Un blanc de décoration est un
blanc franc et froid (#F0F4FF), pas un gris-lilas. Un rouge de carénage reste ce rouge vif. Des
jantes dorées restent dorées (jaune-bronze), pas grises. Un sabot turquoise reste turquoise. Une
moto noire reste NOIRE et FROIDE — trois gris très sombres neutres distincts (#12161C, #1D2430,
#2C3543) plus un liseré blanc-bleu sur les arêtes hautes ; jamais violette, jamais éclaircie en
gris moyen. Les couleurs de la machine sont plus saturées et plus contrastées que celles du fond,
pour qu'elle se détache d'un coup d'œil.

CONTOUR.
Silhouette entièrement cernée d'un contour fermé d'UN pixel logique, violet très sombre
(#1A0A2E). Les grandes séparations internes (carénage / moteur / roue / bagages) portent aussi
un contour d'un pixel logique. C'est ce contour qui rend le sprite lisible ; ne l'omets nulle
part.

LA MACHINE.
Vue entière, roues comprises, debout sur ses deux roues, jamais inclinée sur l'angle. Centrée
horizontalement, occupant environ 90 % de la largeur, le bas des pneus posé aux trois quarts de
la hauteur de l'image — le vide restant sous la machine est faible.
${cadre?.pilote_present
  ? `Un pilote est en selle sur la photo : RETIRE-LE entièrement, ainsi que ses gants, ses
    bottes et son casque. Seule la machine reste, redressée à la verticale.`
  : `La moto est déjà seule.`}
Tout le décor de la photo disparaît : paddock, camion, remorque, béquille, gravier, herbe,
végétation, fleurs, arbres, bâtiments, portail, montagnes, ciel photographique, piste, autres
véhicules, personnes.

LE FOND — sobre, il est le décor, pas le sujet. Même grille, mêmes pixels carrés.
- Ciel, du haut vers l'horizon, en TROIS aplats seulement : #160A34 en haut de l'image (le haut
  n'est jamais noir), #2A1150 au milieu, #52205C juste au-dessus de l'horizon. Entre deux
  aplats, UNE bande de tramage en damier de 4 rangées de carrés — c'est tout le dégradé. Pas
  d'empilement de rayures, pas de bandes larges multicolores.
- À l'horizon, une lueur magenta (#8A2E7A) haute de 3 carrés, puis une SEULE ligne d'horizon
  horizontale d'UN carré, cyan #3DE0FF. C'est le seul cyan du fond, et il passe derrière la
  machine au niveau de l'axe des roues.
- Sol : sous l'horizon, aplat sombre #120A2E uni, avec deux rangées de tramage juste sous la
  ligne d'horizon. Aucun reflet, aucune ombre floue — seulement une ombre de contact en aplat
  très sombre, large de 6 et haute de 2 carrés, sous chaque pneu.
- Le fond couvre l'image entière, bord à bord : aucune bande noire ni bandeau uni en haut ou en
  bas de l'image, aucun
  cadre, aucune bordure, aucune vignette, aucune scanline, aucune signature, aucun personnage,
  aucun objet posé.

Format carré. Rends uniquement l'image.`
