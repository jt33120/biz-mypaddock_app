// v6 — LE STYLE DE PRODUCTION. Pixel 16 bits, choisi par Julian le 19 août 2026 après
// comparaison de six directions dans le cadre garage réel.
//
// Ce fichier reprend le corps du prompt d2f MOT POUR MOT, parce qu'il porte six itérations
// mesurées sur images et que ses trouvailles ne se redevinent pas :
//   — le BUDGET DE DÉTAIL en carrés (roue ~40, jante ~24, numéro 12-14) est le vrai levier :
//     donner un nombre de pixels logiques ne suffit pas, il faut compter les carrés pièce
//     par pièce, sinon le modèle dessine fin puis pixellise ;
//   — DEUX SOUS-PALETTES ÉTANCHES, sinon le fond bave sur la machine — le blanc vire lavande,
//     les jantes dorées virent grises, et le violet se réfugie entre les rayons ;
//   — interdire les FAUSSES LETTRES ne suffit pas : il faut interdire l'ALPHABET, parce que le
//     modèle recopie les marques qu'il sait lire ; et une zone de sponsor doit être une BARRE
//     PLEINE, une suite de petits blocs restant du faux texte ;
//   — le PROFIL STRICT est assumé comme parti pris : plus fidèle qu'une rotation inventée, plus
//     lisible en sprite, et cohérent d'une machine à l'autre dans le garage.
//
// UNE SEULE CHOSE CHANGE, et elle est structurelle : d2f rendait aussi le DÉCOR — ciel violet,
// horizon magenta, ligne cyan. Or la scène appartient à l'application : sinon l'image se colle à
// l'écran comme un carré, avec deux horizons qui se contredisent. Le sprite arrive donc sur fond
// vert détachable, et il devient réutilisable — le même servira le récapitulatif partageable.
//
// S'y ajoutent les deux correctifs nommés par Julian sur la 9144 et vérifiés à la source :
// cache noir sur l'optique, silencieux sombre.

export const version = 'v6'
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
3. L'ANGLE est un PROFIL STRICT, à hauteur d'oeil, comme un sprite de moto de borne d'arcade :
   aucune perspective, on ne voit ni le dessus du réservoir, ni la selle par-dessus, ni les deux
   extrémités du guidon. Si la photo est en trois-quarts, tu ramènes la machine au profil de son
   flanc visible — sans JAMAIS la faire tourner de l'autre côté ni inverser son sens. Tu ne
   « corriges » pas l'angle vers un trois-quarts plus flatteur : ce serait montrer une autre
   moto que la sienne.
4. Tout ce qui n'est visible que de trois-quarts sur la photo (top-case, valises, saute-vent,
   guidon, phares) reste présent, vu de côté, à sa place et à sa taille.

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

LA PALETTE — DEUX SOUS-PALETTES ÉTANCHES, c'est impératif.
- Palette MACHINE : 18 couleurs au maximum, prélevées uniquement sur la moto de la photo.
- Palette FOND : 6 couleurs au maximum, uniquement celles listées plus bas.
Aucune couleur de la palette FOND n'apparaît sur la machine, et réciproquement. En particulier
AUCUN violet, AUCUN mauve, AUCUN magenta, AUCUN lavande ne touche la moto — ni son moteur, ni
son cadre, ni ses jantes, ni ses pneus, ni ses parties blanches, ni ses ombres. Les ombres de la
machine sont des versions plus sombres de SA propre couleur, jamais des violets. Cela vaut aussi
pour les CREUX et les VIDES de la machine : l'espace entre les rayons d'une jante, l'intérieur
d'une roue, le dessous du carénage, l'ombre sous la selle sont NOIRS ou gris très sombres — jamais
violets, jamais transparents sur le fond. Une jante dorée est dorée sur toute sa couronne ET sur
tous ses rayons.
${COULEURS} couleurs au total au maximum. Chaque zone est un
APLAT. Le volume se rend en 3 valeurs par teinte (ombre / base / lumière), jamais plus, et les
transitions entre deux valeurs se font au TRAMAGE en damier régulier de pixels logiques
(dithering), visible et assumé. Les blancs spéculaires sont un ou deux pixels francs, pas un
halo.
ANTI-CONTAMINATION, à vérifier pixel par pixel : le FOND est violet, la MACHINE ne l'est JAMAIS.
Aucun pixel de la moto ne vire au violet, au mauve ni au lavande. Un blanc de décoration est un
blanc franc et froid (#F0F4FF), pas un gris-lilas. Un rouge de carénage reste ce rouge vif. Des
jantes dorées restent dorées (jaune-bronze), pas grises. Un sabot turquoise reste turquoise. Une
moto noire reste NOIRE et FROIDE. Toutes les pièces sombres de N'IMPORTE QUELLE machine — moteur,
cadre, bras oscillant, fourreaux, pneus, carénage noir — se rendent avec trois gris neutres très
sombres distincts (#12161C, #1D2430, #2C3543) plus un liseré blanc-bleu sur les arêtes hautes ;
jamais en violet, jamais éclaircies en gris moyen. Les couleurs de la machine sont plus saturées et plus contrastées que celles du fond,
pour qu'elle se détache d'un coup d'œil.

CONTOUR.
Silhouette entièrement cernée d'un contour fermé d'UN pixel logique, violet très sombre
(#1A0A2E). Les grandes séparations internes (carénage / moteur / roue / bagages) portent aussi
un contour d'un pixel logique. C'est ce contour qui rend le sprite lisible ; ne l'omets nulle
part.

LA MACHINE.
Vue entière, roues comprises, debout sur ses deux roues, jamais inclinée sur l'angle. Centrée
horizontalement, occupant environ 88 % de la largeur, avec au moins 4 carrés de marge libre de
chaque côté — aucune roue ne touche ni ne dépasse le bord. Le bas des pneus est posé à 80 % de la
hauteur de l'image : il ne reste qu'une mince bande de sol sous les pneus, jamais un quart
d'image vide. Le CENTRAGE est strict : autant de
vide à gauche qu'à droite, à 2 carrés près, et le vide au-dessus du sommet de la machine reste
inférieur au quart de la hauteur. Aucune pièce n'est coupée par un bord.
N'ajoute AUCUNE pièce absente de la photo : pas de sabot, pas de pare-carter, pas de coque
beige ou brune sous le moteur, pas de béquille, pas d'antenne, pas d'aileron.
${cadre?.pilote_present
  ? `Un pilote est en selle sur la photo : RETIRE-LE entièrement, ainsi que ses gants, ses
    bottes et son casque. Seule la machine reste, redressée à la verticale.`
  : `La moto est déjà seule.`}
Tout le décor de la photo disparaît : paddock, camion, remorque, béquille, gravier, herbe,
végétation, fleurs, arbres, bâtiments, portail, montagnes, ciel photographique, piste, autres
véhicules, personnes.

LE FOND — contrainte technique, et c'est le SEUL point où cette commande diffère de la
précédente. Le fond n'est plus un décor : la scène appartient à l'application.
Aplat UNIFORME de vert pur saturé #00E000 sur toute la surface qui n'est pas la machine.
Strictement plat : aucun ciel, aucun horizon, aucune ligne cyan, aucune lueur magenta, aucun
tramage de fond, aucun sol, aucune ombre portée, aucun reflet, aucune vignette, aucun cadre.
Le vert est un seul carré de couleur répété — il ne participe pas au sprite.
Ce vert sera retiré par programme : la machine ne doit contenir ce vert NULLE PART, y compris
dans les creux entre les rayons d'une jante, qui restent NOIRS et opaques. Aucune frange verte,
aucun halo vert ne borde le contour.
Le contour fermé d'un pixel logique autour de la silhouette reste obligatoire, en violet très
sombre #1A0A2E — c'est lui qui rendra le sprite lisible une fois posé sur la scène de
l'application, quelle que soit sa couleur.

LA MACHINE EST PRÉPARÉE POUR LA PISTE, pas sortie de concession. Ne la remets jamais à l'état
d'origine — vérifié sur la photo d'origine, ces deux points ont été rendus faux jusqu'ici :
- un cache NOIR OPAQUE couvre l'optique avant : garde-le noir et opaque, aucun phare vitré,
  allumé, transparent ni chromé ;
- le silencieux est SOMBRE — gris foncé, noir ou titane mat. Jamais doré, laiton, cuivre ni
  chromé.
Pas de rétroviseurs, pas de plaque d'immatriculation, pas de clignotants s'ils sont absents de
la photo. Garde les plaques de numéro, les protections et les traces d'usage.

CADRAGE. Machine vue entière, roues comprises, debout, centrée, occupant environ 88 % de la
largeur, marge égale et minime des quatre côtés. Aucune pièce coupée par un bord.

Rends uniquement l'image.`
