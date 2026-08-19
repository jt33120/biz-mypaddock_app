// v5 — retour à UNE SEULE photo, avec les correctifs nommés de v4.
//
// v4 envoyait quatre photos de la même machine en espérant que le modèle recoupe. Il a fait
// l'inverse : il a MOYENNÉ, et la moyenne a glissé vers son a priori — la livrée HRC bleu/rouge/
// blanc de catalogue, alors que la vraie est rouge/blanc/noir. Il a aussi ignoré la pose
// désignée. Résultat mesuré : plus de références = moins de fidélité.
//
// Contre-intuitif et instructif : une seule image CONTRAINT le modèle, plusieurs images
// l'AUTORISENT à synthétiser. Ce qui compte n'est donc pas la quantité de références mais la
// qualité de la seule qu'on donne — machine seule, de profil, décoration entière et lisible.
// C'est aussi ce que le produit devra demander au pilote, et c'est une consigne simple à donner.
//
// Ce qui est conservé de v4 parce que ça a marché : les interdits nommés un par un contre
// l'idéalisation. Le silencieux est ressorti sombre dès qu'on l'a écrit noir sur blanc, là où
// une consigne générale de fidélité ne suffisait pas.
export const version = 'v5'
export const modele = 'gemini-3-pro-image'
export const entreePx = 1152

export const prompt = (cadre) => `Tu produis un « sprite » — un élément graphique détaché — pour
l'écran garage d'une application de roulage moto. L'image fournie est la photo réelle de la moto
d'un pilote.

LA RÈGLE QUI PRIME SUR TOUT : c'est CETTE machine, celle de la photo. Un rendu magnifique d'une
autre moto est un échec total. Ne reproduis QUE ce que tu vois sur cette image. N'utilise aucun
souvenir de ce à quoi ce modèle de moto ressemble en version d'usine ou en version de course
officielle : la livrée de cette machine est celle de la photo et rien d'autre.

LA LIVRÉE, point par point. Relève les couleurs exactement où elles sont sur la photo, y compris
leurs proportions. Si le réservoir est noir, il reste noir — ne le rends pas bleu. Si une couleur
n'apparaît pas sur la photo, elle n'apparaît pas sur le rendu.

CETTE MACHINE EST PRÉPARÉE POUR LA PISTE, pas sortie de concession. Ne la remets jamais à l'état
d'origine :
- Un cache noir opaque couvre l'optique avant. GARDE-LE NOIR ET OPAQUE. Pas de phare vitré,
  allumé, transparent ni chromé.
- Le silencieux est SOMBRE — gris foncé, noir ou titane mat. Jamais doré, laiton, cuivre ni
  chromé brillant.
- Pas de rétroviseurs, pas de plaque d'immatriculation, pas de clignotants : absents de la photo,
  absents du rendu.
- Garde les plaques de numéro, les protections, les colliers et les traces d'usage. Une machine de
  piste n'est pas neuve.

TEXTE — contrainte stricte, et c'est celle qui a été le plus mal respectée jusqu'ici. Le rendu ne
contient AUCUNE lettre, à une exception près : les chiffres du numéro de course, reproduits tels
quels. Tout autre texte — nom de sponsor, marque de pneu, nom d'équipe — est remplacé par une
BANDE OU UNE FORME DE COULEUR UNIE de la taille approximative du texte d'origine. Ne devine pas un
mot, n'approxime pas une marque, n'écris pas un nom plausible. Une forme unie est le résultat
attendu, pas un pis-aller.

CE QUI EST CACHÉ reste NEUTRE : surface unie de la couleur voisine. N'invente aucun motif, aucun
autocollant, aucune bande que tu ne vois pas.

ORIENTATION. Reproduis exactement le côté et l'angle de la photo. Flanc gauche sur la photo, flanc
gauche sur le rendu ; profil sur la photo, profil sur le rendu. Ne retourne pas la machine, ne la
fais pas pivoter vers un trois-quarts « plus flatteur ».

FOND — contrainte technique, à la lettre. Aplat UNIFORME de vert pur saturé #00E000 partout où il
n'y a pas la machine. Strictement plat : aucun dégradé, aucune texture, aucun damier, aucune
vignette, aucune ombre portée, aucun reflet, aucun halo. Ce vert sera retiré par programme : la
machine ne doit contenir ce vert nulle part et aucune frange verte ne doit border son contour.

CADRAGE. Machine vue entière, roues comprises, droite sur ses roues, remplissant le cadre avec une
marge égale et minime. ${cadre?.pilote_present
  ? 'Aucun pilote dans le rendu : retire-le et redresse la machine.'
  : 'La machine est déjà seule.'} Retire la béquille de stand, le sol et tout le décor.

STYLE. Illustration nette et lisible. Éclairage neutre et diffus révélant les arêtes du carénage,
les rayons des jantes et les disques de frein. Couleurs propres de la machine justes, sans teinte
d'ambiance. Contours francs. Pas de photo-réalisme lustré, pas de cartoon, pas de 3D brillante.

Rends uniquement l'image.`
