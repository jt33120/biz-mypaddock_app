// v2 — la machine SEULE, sans scène. Test : Gemini sait-il rendre un fond transparent ?
//
// Pourquoi ce changement est structurel et pas cosmétique. En v1 le modèle produisait la scène
// entière : l'image arrivait avec son fond, son horizon et son reflet, et se collait donc à
// l'écran comme un carré, avec DEUX lignes d'horizon qui se contredisent. En demandant la
// machine seule, la scène redevient celle de l'application — même horizon, même sol, même
// reflet que le reste du produit — et l'actif est réutilisable : le même détourage sert le
// garage ET le récapitulatif partageable.
//
// Et le point qui renverse tout le chantier précédent : détourer une image QU'ON A FAIT
// PRODUIRE sur fond uniforme est trivial, là où détourer une photo de paddock a résisté à cinq
// approches. On ne résout pas le problème — on arrête de le créer.
export const version = 'v2'
export const modele = 'gemini-3-pro-image'
export const entreePx = 1024

export const prompt = (cadre) => `Tu produis un élément graphique détaché pour l'écran
« garage » d'une application de roulage moto. L'image fournie est la photo réelle de la moto
d'un pilote.

RÈGLE ABSOLUE, avant tout style : c'est CETTE moto, pas une moto. Reproduis fidèlement son
modèle, sa silhouette, sa décoration, ses couleurs exactes, son numéro de course, ses jantes,
ses suspensions, son échappement, ses bagages s'il y en a. Le pilote doit reconnaître SA
machine au premier coup d'œil. N'idéalise pas, ne remplace pas, n'ajoute aucun élément absent
de la photo.

ORIENTATION — impérative. Conserve exactement le côté et l'angle de la photo. Si la photo
montre le flanc gauche, rends le flanc gauche. Ne retourne pas la machine, ne la fais pas
pivoter, ne change pas de point de vue.

TEXTE — impératif. N'invente AUCUNE lettre. Seuls les chiffres du numéro de course sont
reproduits, tels qu'ils sont. Tout logo ou texte de sponsor illisible sur la photo devient une
forme colorée abstraite — jamais un mot approximatif, jamais une marque inventée.

FOND — le point le plus important de cette commande.
Fond entièrement TRANSPARENT. Aucun décor, aucun sol, aucun horizon, aucun dégradé, aucune
ombre portée, aucun reflet, aucune vignette, aucun cadre. Rien que la machine, découpée net
sur du vide. Si tu ne peux pas produire de transparence, alors et seulement alors : un aplat
uniforme d'un vert pur et saturé (#00E000), strictement plat, sans ombre ni dégradé.

CE QUI DISPARAÎT DE LA PHOTO
Paddock, camion, remorque, béquille de stand, gravier, végétation, bâtiments, ciel, autres
véhicules, personnes. ${cadre?.pilote_present
  ? `Un pilote est en selle : RETIRE-LE entièrement. La machine est présentée seule, à
    l'arrêt, droite sur ses roues, jamais inclinée sur l'angle.`
  : `La moto est déjà seule ; garde-la droite sur ses roues.`}

STYLE
Illustration nette et lisible, éclairage neutre et diffus qui révèle les arêtes du carénage,
les rayons des jantes et les disques de frein. Les couleurs propres de la machine restent
justes, sans teinte d'ambiance. Pas de photo-réalisme brillant, pas de cartoon, pas de 3D
lustrée. Contours propres.

La machine occupe toute la largeur disponible, vue entière, roues comprises.
Rends uniquement l'image.`
