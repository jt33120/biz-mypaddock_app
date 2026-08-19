// d4 — L'AFFICHE : la machine en héros contre un ciel d'arcade.
//
// Parti pris : pas un portrait de studio, une jaquette de jeu de course de 1990. Caméra basse,
// machine large, horizon net, ciel de crépuscule en dégradé franc, ombre longue au sol.
//
// Le risque de la direction est connu : une composition saturée a envie de repeindre la moto.
// Deux garde-fous structurels contre ça :
//   1. le soleil est DERRIÈRE la machine, la lumière qui décrit la carrosserie est une lumière
//      frontale NEUTRE — la livrée garde ses teintes d'origine, le ciel ne les teinte pas ;
//   2. le ciel est un fond, pas un filtre : il est décrit séparément, et il n'a aucun droit
//      d'entrer dans la peinture de la moto.
// Le cas de la routière noire est traité explicitement : le noir ne devient pas violet, il reste
// noir, et c'est le CIEL qui s'éclaircit derrière lui pour que la silhouette se détache.
export const version = 'd4.4'
export const modele = 'gemini-3-pro-image'
export const entreePx = 1024

export const prompt = (cadre) => `Tu produis une AFFICHE illustrée pour l'écran « garage » d'une
application de roulage moto. L'image fournie est la photo réelle de la moto d'un pilote. Cette
affiche est ce qu'il montrera à un ami.

════════ 1. LA RÈGLE QUI PRIME SUR TOUT LE RESTE ════════
C'est CETTE moto, pas une moto. Un bel affichage d'une autre machine est un échec total.
Relève sur la photo et reproduis sans négocier :
- le modèle et la silhouette exacts (longueur, hauteur de selle, forme du carénage, du réservoir,
  du garde-boue, du saute-vent, de la selle et du support de plaque) ;
- les couleurs exactes de la livrée et le DESSIN de la décoration — où chaque zone de couleur
  commence et s'arrête sur la carrosserie ;
- les chiffres du numéro de course : le même nombre de chiffres, la même forme de fond (plaque
  blanche, aplat, ou rien), la COULEUR DU CHIFFRE et la COULEUR DU FOND telles qu'elles sont sur
  la photo — ne les inverse pas — et uniquement aux emplacements où le numéro figure réellement.
  Ne le recopie pas sur d'autres panneaux « pour équilibrer », et ne l'écris jamais en miroir,
  à l'envers, ni avec les chiffres inversés ;
- les jantes (dessin des bâtons, nombre de bâtons, couleur), les disques, les étriers ;
- les suspensions (couleur des tubes de fourche), le bras oscillant, la chaîne, l'échappement
  et le nombre de silencieux ;
- tout accessoire monté, AVEC SA COULEUR EXACTE : top-case, valises, bulle, protège-mains, tampons,
  et la béquille d'atelier si elle est sous la moto (si elle est rouge sur la photo, elle est rouge).
N'ajoute rien qui ne soit pas sur la photo. N'idéalise pas, ne « nettoie » pas la machine, ne
remplace pas une pièce par une plus belle. Si un détail est illisible sur la photo, SIMPLIFIE-le
en une forme sobre — ne le comble jamais par imagination.

════════ 2. INTERDICTION D'ÉCRIRE ════════
Cette section est une contrainte dure, pas un conseil de style.
- Les SEULS caractères autorisés dans toute l'image sont les CHIFFRES du numéro de course lu sur
  la photo${cadre?.numero ? ` (ici : ${cadre.numero})` : ''}. Rien d'autre.
- AUCUNE LETTRE, nulle part : pas de nom de marque, pas de nom de modèle, pas de sponsor, pas de
  slogan, pas de titre d'affiche, pas de signature, pas de filigrane, pas de plaque
  d'immatriculation lisible.
- Tout autocollant de sponsor illisible sur la photo devient une FORME ABSTRAITE : un rectangle,
  une bande, un aplat, un chevron, dans la couleur dominante de l'autocollant. Une tache de
  couleur muette est CORRECTE ; une suite de lettres inventées est une FAUTE GRAVE.
- N'invente jamais des glyphes qui « ressemblent à » de l'écriture, ni du faux texte flou, ni des
  lettres partielles. Un logo de constructeur que tu ne peux pas reproduire exactement : remplace-le
  par un petit aplat de sa couleur, ou n'y mets rien.
- Pas de damier, nulle part, sous aucune forme.

════════ 3. ORIENTATION : LE MIROIR EST INTERDIT ════════
Tu dois garder EXACTEMENT le côté et l'angle de la photo. Procède par vérification :
a) Sur la photo, l'avant de la moto pointe-t-il vers la gauche ou vers la droite du cadre ?
   Dans ton image, il pointe du MÊME côté. Si la roue avant est à gauche sur la photo, elle est
   à gauche dans ton affiche.
b) Quel flanc de la machine est face à l'objectif ? Si tu vois la chaîne et la couronne, c'est le
   flanc GAUCHE ; si tu vois le silencieux et l'embrayage, c'est le flanc DROIT. Ton image montre
   le MÊME flanc, avec les mêmes organes visibles du même côté.
c) L'angle est-il un profil strict, un trois-quarts avant, un trois-quarts arrière ? Garde-le.
   Ne « redresse » pas un profil en trois-quarts pour rendre la composition plus flatteuse.
Ne retourne pas l'image, ne la reflète pas, ne recompose pas la moto vue de l'autre côté.
C'est le défaut n°1 à éviter : une machine inversée n'est pas reconnaissable par son propriétaire.

════════ 4. LA COMPOSITION D'AFFICHE ════════
Format carré. Caméra BASSE, en légère CONTRE-PLONGÉE : l'objectif est à la hauteur du moyeu de roue,
et la machine domine le spectateur. Trois vérifications à faire avant de dessiner :
- le dessus du réservoir n'est PAS visible : tu n'en vois que la tranche, de côté ;
- l'assise de la selle et le dessus du top-case ne sont PAS visibles, seulement leur profil ;
- en revanche tu vois le DESSOUS du garde-boue avant, le DESSOUS du carénage et du sabot.
Si tu es en train de regarder la moto légèrement d'en haut, tu t'es trompé : recommence plus bas.

Elle est cadrée LARGE et REMPLIT le cadre : environ 88 % de la largeur, une marge de 6 % seulement
devant la roue avant et derrière la queue, et le point le plus haut de la machine (bulle, rétroviseur
ou casque du pilote) monte jusqu'aux deux tiers de la hauteur de l'image. Le ciel vide au-dessus
d'elle ne dépasse pas le quart supérieur. Vue entière : rien n'est coupé par les bords, les deux
roues sont posées au sol et visibles en entier.

L'ILLUSTRATION VA JUSQU'AUX QUATRE BORDS, à fond perdu. Aucune marge blanche, aucun liseré, aucun
cadre, aucun contour d'image, aucun coin arrondi. Ce n'est pas un autocollant posé sur une page.

L'HORIZON est UNE SEULE ligne, droite, nette, parfaitement horizontale, placée au niveau du haut
des roues. Au-dessus : le ciel. En dessous : RIEN D'AUTRE QUE LE SOL — un seul aplat sombre,
nettement plus sombre que le ciel, d'une teinte neutre et froide, avec son tramage de points. Pas
de bande de couleur sous l'horizon, pas d'eau, pas de reflet, pas de deuxième horizon, pas de
dégradé coloré : le ciel ne se prolonge jamais sous la ligne d'horizon.

L'OMBRE PORTÉE est SIMPLE et MODESTE, et elle vaut mieux trop discrète que trop bavarde. Une seule
forme : une bande sombre allongée, aux contours francs, partant du point de contact des deux pneus
en oblique vers un coin du bas de l'image. Sa longueur ne dépasse pas deux fois la hauteur des
roues et elle couvre au plus un cinquième de la surface du sol. Sa pointe se dissout en tramage.
Elle est remplie d'un SEUL noir uni et ne contient AUCUN détail : pas de cercle de roue, pas de
rayon, pas de trou, pas de silhouette de carénage, pas de zone plus claire. Un observateur ne doit
pas pouvoir « lire » une deuxième moto dedans. En cas de doute, dessine une simple ombre allongée
et abstraite plutôt qu'une silhouette détaillée : ce n'est PAS un miroir de la machine.
INTERDIT : une flaque informe, un halo diffus étalé sur tout le bas de l'image, une ombre qui
remplit la moitié de l'image, deux ombres, un reflet de la moto dans le sol, des roues fantômes.

${cadre?.pilote_present
  ? `UN PILOTE EST EN SELLE sur la photo, la machine est sur l'angle : GARDE-LE. Une moto inclinée
sans pilote est absurde, et c'est ici que l'affiche prend son sens. Reproduis fidèlement la couleur
et le découpage de sa combinaison, de son casque, de ses bottes et de ses gants, la position exacte
de son corps et son angle d'inclinaison. Son anatomie est juste et ses proportions humaines :
longueur des bras et des jambes crédible, mains réellement posées sur les demi-guidons, buste
descendu derrière la bulle, genou intérieur sorti si la photo le montre. Aucune lettre sur la
combinaison ni sur le casque : les marquages deviennent des aplats de couleur. Le visage n'est pas
visible, la visière est un aplat sombre réfléchissant une bande de ciel. Le sol est alors le bitume
d'un virage, uniforme et sombre, traversé par UNE seule bande blanche de bord de piste, droite et
franche, parallèle à l'horizon.
CADRAGE DE CE CAS : l'ensemble pilote + machine est GRAND et remplit le cadre — sa diagonale va
presque d'un coin à l'autre, la roue avant approche un bord latéral et la roue arrière l'autre, le
casque monte aux deux tiers de la hauteur. Il ne flotte pas au milieu d'un grand fond vide, et il
n'est pas réduit à une petite vignette.`
  : `La machine est SEULE, à l'arrêt, posée sur ses roues (et sur sa béquille si la photo en montre
une). Aucune personne dans l'image. Le sol est un aplat de bitume sombre et lisse, sans gravier,
sans herbe, sans marquage.`}

CE QUI DISPARAÎT de la photo : tout le décor réel — arbres, végétation, bâtiments, portails,
clôtures, poteaux, câbles, montagnes, voitures, remorques, sacs, casques posés, fleurs, gravier,
personnes autour. Il ne reste que la machine (et son pilote s'il est en selle), le sol et le ciel.

════════ 5. LE CIEL ET LE STYLE ════════
Esthétique des jaquettes de jeux de course des années 80-90 : illustration peinte, contours nets,
contraste fort, couleurs saturées mais TENUES. Aplats larges et ombres en zones franches, pas de
dégradé mou sur la carrosserie, pas de rendu 3D brillant, pas de photoréalisme, pas de pixel art.
Le DESSIN de la machine est en revanche exact et mesuré, comme une planche de catalogue
constructeur : empattement long, les deux roues du même diamètre, hauteur de selle juste,
perspective cohérente. INTERDIT de styliser les proportions — pas de roue avant surdimensionnée,
pas de carrosserie raccourcie ou gonflée, pas de trait de mascotte, pas de personnage cartoon,
pas de gros contour noir uniforme faisant le tour de chaque pièce.

LE CIEL — sois littéral ici, c'est l'erreur la plus fréquente. Ce n'est PAS une mire de barres de
couleur, PAS un arc-en-ciel, PAS une pile de rayures horizontales. C'est UN SEUL dégradé vertical
CONTINU, lisse comme un aérographe, sans AUCUNE arête entre les teintes. Du haut vers le bas, et
jamais dans un autre ordre :
bleu nuit profond #080418 → violet #160A34 → pourpre #4A1B6D → magenta #8A2E7A → et, sur la dernière
tranche juste au-dessus de l'horizon, orange incandescent #FF7A3C. Chaque teinte fond dans la
suivante ; la valeur monte régulièrement vers l'horizon et ne redescend jamais.
Puis, collé sur la ligne d'horizon, UN SEUL liseré cyan clair #3DE0FF, très fin, tracé une seule
fois — pas deux, pas trois.
RÈGLE DE VÉRIFICATION : dans tout le ciel il n'existe QUE DEUX arêtes horizontales nettes — le
liseré cyan et la ligne d'horizon elle-même. Si tu peux compter une troisième bande à bord franc,
tu as fait une mire de couleur : refais un dégradé continu. Aucun nuage.

LE SOLEIL : un disque simple et plein, d'un orange franc et saturé (jamais blanc, jamais délavé),
à moitié enfoncé derrière l'horizon, de taille modeste. Il est placé dans la zone de ciel la PLUS
VIDE — décalé franchement d'un côté, jamais derrière le réservoir ni derrière le pilote, jamais au
centre. Pas de halo volumineux, pas de rayons, pas d'anneaux.

Un léger tramage de points, régulier, sur le sol uniquement.

════════ 6. LE PIÈGE DE CETTE AFFICHE, ET COMMENT L'ÉVITER ════════
Le ciel est un FOND, pas un filtre. Le soleil est derrière la machine, mais tu l'éclaires par
l'avant avec une lumière blanche NEUTRE et généreuse : sa livrée garde ses teintes exactes de la
photo. Un rouge reste rouge, un blanc reste blanc, un or reste or, un turquoise reste turquoise.
INTERDIT : baigner la moto d'orange ou de violet, la mettre en contre-jour, la réduire à une
silhouette, la teinter pour « l'harmoniser » avec le ciel. Seul un liseré chaud très fin, sur les
arêtes hautes tournées vers le soleil, rappelle le crépuscule.

SI LA MACHINE EST NOIRE : elle reste NOIRE — graphite très sombre, aplats profonds, jamais violette
ni bleutée ni marron. Sa lisibilité ne vient PAS d'un changement de couleur, elle vient de trois
choses : (a) le ciel s'éclaircit derrière elle, on cadre la silhouette contre la partie la plus
lumineuse de l'horizon ; (b) un liseré clair net souligne le contour extérieur de toute la machine ;
(c) les pièces qui ne sont pas noires — fourches, jantes, disques, échappement, lettrage doré
transformé en aplat — sont peintes avec le plus de clarté possible pour structurer la masse. Les
volumes noirs restent séparés les uns des autres par des arêtes claires : la selle, le réservoir,
le carénage, le top-case et les valises doivent rester des formes distinctes, jamais une bouillie.

RIEN D'AJOUTÉ : aucun cadre, aucune bordure, aucun logo, aucun texte, aucun élément d'interface,
aucune flèche de vitesse, aucune étincelle, aucune flamme.

Rends uniquement l'image.`
