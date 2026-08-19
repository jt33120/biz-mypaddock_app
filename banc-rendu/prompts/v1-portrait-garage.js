// v1 — le portrait de garage, demandé directement.
//
// Parti pris : on ne demande PAS un détourage puis une composition. On demande l'image finale.
// Si le modèle sait poser la machine dans une scène, tout l'étage détourage disparaît — et
// c'était l'étage qui bloquait.
export const version = 'v1'
export const modele = 'gemini-3-pro-image'
export const entreePx = 1024

export const prompt = (cadre) => `Tu produis une illustration pour l'écran « garage » d'une
application de roulage moto. L'image fournie est la photo réelle de la moto d'un pilote.

RÈGLE ABSOLUE, avant toute considération de style : c'est CETTE moto, pas une moto.
Reproduis fidèlement son modèle, sa silhouette, sa décoration, ses couleurs exactes, ses
numéros de course, ses jantes, ses suspensions, ses échappements. Le pilote doit reconnaître
SA machine au premier coup d'œil. Ne remplace pas, n'idéalise pas, n'invente aucun élément
qui n'est pas sur la photo. Si un détail est illisible sur la photo, simplifie-le — ne le
comble pas par imagination.

CE QUE TU PRODUIS
Un portrait de la machine seule, de trois quarts ou de profil selon l'angle de la photo,
posée dans un garage nocturne sobre. Vue entière, la moto occupe environ 80 % de la largeur,
centrée, légèrement au-dessus du centre vertical.

CE QUI DISPARAÎT
Tout le décor de la photo : paddock, camion, remorque, gravier, végétation, bâtiments, ciel,
autres véhicules, personnes autour. ${cadre?.pilote_present
  ? `Un pilote est en selle sur la photo : RETIRE-LE, la machine est présentée seule, à l'arrêt,
    posée sur ses roues.`
  : `La moto est déjà seule.`}

STYLE
Néon nocturne sobre, pas de pixel art, pas de cartoon, pas de rendu 3D brillant.
- Fond : bleu nuit très sombre, presque noir, uniforme, avec un léger dégradé vertical.
- Une seule ligne d'horizon lumineuse derrière la machine, cyan, fine, discrète.
- Sol : sombre et mat, avec un reflet doux de la machine, court et flou.
- Éclairage : deux sources froides latérales qui dessinent les arêtes du carénage et les
  jantes ; la couleur propre de la moto reste juste, non teintée par les néons.
- Aucun texte, aucun logo ajouté, aucun cadre, aucune bordure, aucune signature.
- Aucune personne, aucun outil, aucun objet posé.

Format carré. Rends uniquement l'image.`
