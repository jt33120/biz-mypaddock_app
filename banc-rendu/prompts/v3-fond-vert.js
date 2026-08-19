// v3 — la machine seule sur fond vert plat, détachée ensuite par l'application.
//
// v2 demandait la transparence. Le modèle a DESSINÉ UN DAMIER — la convention visuelle du vide,
// peinte comme un motif. Leçon générale et pas anecdotique : un modèle d'image répond sur le
// plan de l'apparence, jamais sur celui de la structure. Ce qui doit être structurel — un canal
// alpha — se produit en aval, par du code.
//
// Et c'est ce qui renverse le chantier précédent : on ne détoure plus une photo de paddock, ce
// qui a résisté à cinq approches ; on détoure un aplat qu'on a soi-même commandé. On n'a pas
// résolu le problème, on a arrêté de le créer.
export const version = 'v3'
export const modele = 'gemini-3-pro-image'
export const entreePx = 1024

export const prompt = (cadre) => `Tu produis un élément graphique détaché — un « sprite » — pour
l'écran garage d'une application de roulage moto. L'image fournie est la photo réelle de la moto
d'un pilote.

RÈGLE ABSOLUE, avant tout style : c'est CETTE moto, pas une moto. Modèle, silhouette,
décoration, couleurs exactes, numéro de course, jantes, suspensions, échappement, bagages s'il y
en a. Le pilote doit reconnaître SA machine au premier coup d'œil. N'idéalise pas, ne remplace
pas, n'ajoute rien qui ne soit sur la photo.

FOND — contrainte technique, à respecter à la lettre.
Le fond est un APLAT UNIFORME de vert pur saturé, exactement #00E000, sur toute la surface qui
n'est pas la machine. Strictement plat : aucun dégradé, aucune texture, aucun damier, aucune
vignette, aucune ombre portée, aucun reflet au sol, aucun halo. Ce vert sera retiré par
programme : tout pixel vert qui touche la machine devient un trou dans la machine, et toute
ombre verte devient une frange. La machine ne doit contenir NULLE PART ce vert.

ORIENTATION — impérative. Conserve exactement le côté et l'angle de la photo. Flanc gauche sur
la photo, flanc gauche sur le rendu. Ne retourne pas, ne fais pas pivoter.

TEXTE — impératif. N'invente aucune lettre. Seuls les CHIFFRES du numéro de course sont
reproduits tels quels. Tout logo ou texte de sponsor illisible devient une forme colorée
abstraite — jamais un mot approximatif, jamais une marque inventée.

CADRAGE. La machine est vue entière, roues comprises, droite sur ses roues, et remplit le cadre
en laissant une marge égale et minime sur les quatre côtés.

CE QUI DISPARAÎT. Paddock, camion, remorque, béquille de stand, gravier, végétation, bâtiments,
ciel, autres véhicules, personnes. ${cadre?.pilote_present
  ? `Un pilote est en selle : RETIRE-LE entièrement, et redresse la machine si elle est sur
    l'angle.`
  : `La moto est déjà seule.`}

STYLE. Illustration nette et lisible. Éclairage neutre et diffus qui révèle les arêtes du
carénage, les rayons des jantes et les disques de frein. Couleurs propres de la machine justes,
sans teinte d'ambiance. Contours francs. Pas de photo-réalisme lustré, pas de cartoon.

Rends uniquement l'image.`
