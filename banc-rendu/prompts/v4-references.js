// v4 — corrige les deux défauts nommés par Julian sur v1/v3, et le défaut qui les explique.
//
// (1) « il y a du scotch noir sur les phares » et (2) « le pot est gris pas doré » : vérifié à la
// source, la vraie machine a bien un cache noir opaque sur l'optique et un silencieux sombre. Le
// modèle avait rendu un phare vitré et un pot doré. Une seule cause : il RAMÈNE une machine
// préparée piste vers une machine de concession. C'est son a priori le plus fort, et il faut le
// combattre nommément — une consigne générale de fidélité ne suffit pas, v1 en avait déjà une.
//
// (3) Et le défaut qui commande les autres : sur IMG_9243, où le pilote couvre le carénage, le
// modèle n'a pas vu la décoration et a rendu une AUTRE moto en livrée de catalogue. D'où les
// références multiples — plus d'information, pas un meilleur adjectif.
export const version = 'v4'
export const modele = 'gemini-3-pro-image'
export const entreePx = 1152

export const prompt = (cadre, G) => `Tu produis un « sprite » — un élément graphique détaché —
pour l'écran garage d'une application de roulage moto. Tu reçois PLUSIEURS photos de LA MÊME
machine : ${G.machine}.

RÔLE DES IMAGES. L'image 1 donne la POSE : c'est son angle et son côté que tu reproduis. Les
images suivantes montrent la même machine sous d'autres angles ; elles servent uniquement de
preuve sur la décoration, les couleurs et les équipements réels. Ne reprends ni leur angle, ni
leur cadrage, ni le pilote qui s'y trouve.

LA RÈGLE QUI PRIME SUR TOUT : c'est CETTE machine. Un rendu magnifique d'une autre moto est un
échec total. Recoupe les images entre elles pour établir la décoration, et tiens-t'en à ce que tu
vois.

CE QUE TU NE DOIS PAS FAIRE — le piège principal, nommé précisément.
Cette machine est PRÉPARÉE POUR LA PISTE, pas sortie de concession. Ne la remets jamais à l'état
d'origine. En particulier :
- Un cache noir opaque couvre l'optique avant. GARDE-LE NOIR ET OPAQUE. Ne rends pas un phare
  vitré, allumé, transparent ou chromé.
- Le silencieux est SOMBRE — gris foncé, noir ou titane mat. Ne le rends ni doré, ni laiton, ni
  cuivre, ni chromé brillant.
- Pas de rétroviseurs, pas de plaque d'immatriculation, pas de clignotants : absents des photos,
  absents du rendu.
- Garde les plaques de numéro de course, les autocollants, les colliers, les protections et les
  traces d'usage. Une machine de piste n'est pas neuve.

CE QUE TU FAIS DE CE QUI EST CACHÉ. Si une partie est masquée par le pilote, la béquille ou
l'angle de prise de vue, rends-la de la façon la plus NEUTRE possible : surface unie de la couleur
voisine. N'invente aucun motif de livrée, aucun autocollant, aucun logo de sponsor, aucune bande
de couleur que tu ne vois sur AUCUNE des images.

TEXTE. N'invente aucune lettre. Seuls les CHIFFRES du numéro de course sont reproduits, tels
qu'ils sont. Tout texte de sponsor illisible devient une forme colorée abstraite — jamais un mot
approximatif, jamais une marque inventée.

ORIENTATION. Reproduis exactement le côté et l'angle de l'image 1. Ne retourne pas la machine.

FOND — contrainte technique, à la lettre. Aplat UNIFORME de vert pur saturé #00E000 sur toute la
surface qui n'est pas la machine. Strictement plat : aucun dégradé, aucune texture, aucun damier,
aucune vignette, aucune ombre portée, aucun reflet, aucun halo. Ce vert sera retiré par programme :
la machine ne doit contenir ce vert nulle part, et aucune ombre verte ne doit border son contour.

CADRAGE. Machine vue entière, roues comprises, droite sur ses roues, remplissant le cadre avec une
marge égale et minime. ${cadre?.pilote_present
  ? 'Aucun pilote dans le rendu : retire-le et redresse la machine.'
  : 'La machine est déjà seule.'} Retire aussi la béquille de stand, le sol et tout le décor.

STYLE. Illustration nette et lisible. Éclairage neutre et diffus révélant les arêtes du carénage,
les rayons des jantes et les disques de frein. Couleurs propres de la machine justes, sans teinte
d'ambiance. Contours francs. Pas de photo-réalisme lustré, pas de cartoon, pas de 3D brillante.

Rends uniquement l'image.`
