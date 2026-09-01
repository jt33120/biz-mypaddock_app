// ⚠ SOURCE UNIQUE DES PROMPTS DE LA TENUE — le CASQUE et la COMBINAISON. Même
// règle que `v6.ts`, et pour les mêmes deux raisons qui tiennent chacune seule :
//
//   · un client qui enverrait son propre prompt ferait payer à Julian
//     n'importe quelle génération d'image ;
//   · la grille demandée au modèle et celle de la spritification doivent être
//     LA MÊME. La fonction renvoie donc la sienne, et l'application s'en sert.
//     Deux constantes égales dans deux fichiers finissent toujours par diverger.
//
// Le banc de rendu (`banc-rendu/prompts/v7-tenue.js`) le RÉEXPORTE : il ne le
// recopie pas.
//
// ═══ POURQUOI UN SECOND FICHIER, ET PAS UN `if` DANS v6 ════════════════════
// v6 est le prompt de PRODUCTION de la moto : six itérations mesurées sur des
// photos réelles, et chacune de ses phrases est le reste d'un rendu refusé. Y
// glisser des embranchements par sujet ferait qu'une retouche du casque pourrait
// abîmer la moto — laquelle, elle, a déjà été jugée bonne par Julian. Ce fichier
// REDIT donc les invariants (la grille, le budget compté en carrés, les deux
// sous-palettes étanches, le zéro-lettre, le fond vert détachable, le contour
// d'un carré) avec les chiffres de SON sujet, et il ne redit rien d'autre.
//
// ═══ ⚠ L'ANGLE EST L'INVERSE DE CELUI DE LA MOTO, ET C'EST DÉLIBÉRÉ ════════
// v6 impose un PROFIL STRICT, jusqu'à « si la photo est en trois-quarts, tu
// ramènes la machine au profil ». ICI c'est le contraire : le trois-quarts est
// obligatoire et un profil strict est un rendu à REFUSER.
//
// Ce n'est PAS une incohérence à corriger. Si tu es venu ici pour aligner les
// deux fichiers, lis d'abord ces trois lignes :
//   · une moto de profil montre tout ce qui la distingue — silhouette, découpe
//     du carénage, roues, numéro. Un casque de profil est un OVALE : ni écran,
//     ni mentonnière, ni façade, c'est-à-dire ni ce qui le rend reconnaissable
//     comme casque, ni la surface où sa décoration est peinte ;
//   · une combinaison de profil, c'est une manche devant une jambe : la bosse
//     aérodynamique disparaît derrière l'épaule et les deux bandes latérales se
//     superposent ;
//   · « L'image de chaque casque générée par Gemini doit être dans le même angle
//     (trois quart profil) » — Julian, 1er septembre 2026.
//
// ═══ LA STABILITÉ EST LA DEMANDE, PAS L'ESTHÉTIQUE ═════════════════════════
// Ce qui est exigé n'est pas « un bel angle », c'est LE MÊME angle d'une pièce à
// l'autre : les portraits se rangent côte à côte comme une collection, et deux
// casques rendus sous deux angles ne se comparent plus — on croit voir deux
// formes différentes là où seule la déco change.
// « Trois-quarts » tout seul est un adjectif, et un adjectif se réinterprète à
// chaque photo. L'angle est donc écrit comme un CADRAGE MESURABLE : où pointe
// l'ouverture de l'écran, quelle part de la largeur totale il occupe (le test
// qui départage « trop de face » de « trop de profil »), et où tombe la ligne
// de regard. Un test chiffré se vérifie sur le rendu ; un adjectif, non.

export const version = 'v7-tenue'
export const modele = 'gemini-3-pro-image'
export const entreePx = 1024

// ⚠ LA MÊME GRILLE QUE LA MOTO, ET C'EST UNE CONTRAINTE DE COLLECTION, pas une
// paresse. 1024 / 128 = 8 : le carré logique fait 8 px dans les deux prompts,
// donc un casque et une moto posés côte à côte dans le garage ont EXACTEMENT la
// même grossièreté de pixel. Une grille plus fine ici rendrait le casque
// « mieux dessiné » que la machine, et c'est précisément ce qui casse une
// collection. Si tu la changes, elle doit rester un diviseur entier de 1024.
export const GRILLE = 128
const BLOC = 1024 / GRILLE

/** Les deux couleurs du fond, communes aux deux sujets ET à v6 : c'est ce qui
 *  fait que les trois portraits se détachent pareil et se cernent pareil. */
const VERT = '#00E000'
const CONTOUR = '#1A0A2E'

/** Le budget de couleurs du sujet lui-même. Plus serré que les 18 de la moto :
 *  une moto porte un moteur, des jantes, des pneus et un carénage, là où un
 *  casque est une coque peinte en 3 ou 4 zones. Un budget large ne rend pas plus
 *  fidèle, il rend plus flou — le modèle fabrique des demi-teintes au lieu
 *  d'aplats. */
const COULEURS_SUJET = 14

export type NomSujet = 'casque' | 'combinaison'

type Fiche = {
  /** Le mot employé DANS le prompt, en toutes lettres. */
  nom: string
  /** Encombrement en carrés logiques sur la grille de 128. Ces deux nombres
   *  sont ce qui fixe la grossièreté vue : le sprite doit être SIMPLIFIÉ à ce
   *  budget, pas dessiné fin puis pixellisé. */
  largeur: number
  hauteur: number
  /** La matière dominante, nommée avec son article : elle sert dans les deux
   *  blocs de palette, qui parleraient sinon de cuir à un casque. */
  matiere: string
  /** Les grandes séparations internes qui portent un contour, et les CREUX qui
   *  doivent rester opaques — c'est là que le vert du fond s'infiltre, et une
   *  liste générique n'y désignerait rien de précis. */
  separations: string
  creux: string
  /** L'angle, le budget de détail et le nettoyage propres au sujet. */
  angle: string
  budget: string
  sujet: string
}

/* ─── LE CASQUE ────────────────────────────────────────────────────────────
   Le cas le plus exposé du produit pour le ZÉRO LETTRE : un casque porte la
   marque au front, la marque de l'écran sur la platine, l'homologation sur la
   jugulaire, et parfois le nom du pilote sur la mentonnière. Le modèle SAIT lire
   ces marques et les recopie de mémoire. */
const CASQUE: Fiche = {
  nom: 'CASQUE intégral',
  largeur: 92,
  hauteur: 84,
  matiere: 'la coque',
  separations: 'écran / coque / mentonnière / mousse de cou',
  creux: "l'intérieur de l'ouverture d'écran et l'ombre sous la mentonnière",
  angle: `L'ANGLE — TROIS-QUARTS AVANT, IDENTIQUE POUR TOUS LES CASQUES. C'est la contrainte
la plus importante après la fidélité : deux casques doivent sortir sous LE MÊME angle pour se
ranger côte à côte. Ce n'est pas un goût, c'est une mesure. Applique les quatre points,
puis VÉRIFIE les deux tests du point 2 sur ton rendu avant de le donner.
1. L'ouverture de l'écran (la façade, là où serait le visage) est tournée vers la GAUCHE de
   l'image. On voit EN MÊME TEMPS toute la façade — écran, mentonnière, aération de menton —
   et tout le flanc, qui occupe la partie droite du dessin : coquille latérale, platine
   d'écran, base de nuque.
2. DEUX TESTS, à faire sur ton propre dessin avant de rendre.
   · La largeur apparente de l'ouverture d'écran vaut entre 40 % et 55 % de la largeur totale
     du casque. Au-delà de 65 %, tu es trop DE FACE : tourne. En dessous de 30 %, tu es trop
     DE PROFIL : reviens. Un casque de profil strict est un œuf, et c'est un rendu à refuser.
   · La platine d'écran — le disque de mécanique sur le côté — est ENTIÈREMENT visible, posée
     dans le tiers droit du dessin. Si elle touche le bord de la silhouette ou s'y trouve
     coupée, tu es trop de face. Si elle est au milieu du dessin, tu es trop de profil.
3. LA LIGNE DE REGARD est horizontale et passe au MILIEU de l'image : la fente de l'écran est
   à mi-hauteur, à 2 carrés près. On ne voit ni le dessus de la calotte, ni le dessous de la
   mentonnière : la caméra est à hauteur de l'écran, jamais au-dessus, jamais au-dessous.
4. LE CASQUE EST DROIT. Aucune inclinaison, aucun basculement, aucune pose « dynamique » :
   l'axe haut-bas du casque est vertical dans l'image.
Si la photo fournie montre le casque de dos, de face ou de profil, tu le REPRÉSENTES quand même
sous cet angle-là — c'est le seul angle de ce produit. Tu reportes alors la décoration à sa
place réelle : ce que la photo montre sur le côté reste sur le côté, ce qu'elle montre sur le
front reste sur le front. Tu n'inventes AUCUN motif pour les faces que la photo ne montre pas :
une face inconnue reçoit la couleur dominante du casque, en aplat.`,
  budget: `- la coque entière : 3 valeurs de sa couleur dominante (ombre / base / lumière),
  pas plus ;
- l'ouverture d'écran : une forme pleine d'environ 44 carrés de large sur 22 de haut ;
- l'écran lui-même : DEUX couleurs, le verre et UN éclat franc de 3 carrés posé en haut à
  gauche de l'écran — au même endroit sur tous les casques. Aucun dégradé, aucun reflet
  d'environnement, aucun paysage, aucun photographe, aucune main, aucun visage dedans ;
- le joint et la baguette qui cerne l'écran : 1 carré d'épaisseur ;
- la platine d'écran (la mécanique ronde sur le côté) : un disque plein de 5 carrés, sans vis,
  sans crans, sans molette ;
- une aération de menton ou de calotte : une fente PLEINE de 3 ou 4 carrés. Jamais une grille,
  jamais une série de petits trous — à ce budget, une grille redevient du bruit ;
- la mousse de cou et la jugulaire : une bande sombre de 2 carrés sous la mentonnière ;
  la boucle, l'anneau, la languette : 0 carré, donc ABSENTS ;
- le déflecteur arrière ou le spoiler, s'il existe sur la photo : une masse de 6 carrés ;
- une vis, une couture, une perforation, un cran de crémaillère, une graduation, un logo
  gravé : 0 carré, donc ABSENTS ;
- la DÉCORATION : au plus 4 zones de couleur, et chacune fait au moins 6 carrés dans sa plus
  petite dimension. Une bande, une flamme ou un liseré plus fin que 3 carrés est SUPPRIMÉ,
  jamais rétréci. Ce sont les grandes taches qui font reconnaître un casque, pas ses filets.`,
  sujet: `LE CASQUE, ET LUI SEUL.
Casque entier, vu en trois-quarts avant, droit, centré. Il est VIDE : aucune tête, aucun
visage, aucun œil, aucun cou, aucune personne. L'ouverture de l'écran, si l'écran est relevé
ou teinté clair, est un aplat SOMBRE fermé — un intérieur de casque, pas un visage.
Tout le reste de la photo disparaît : la main qui le tient, la table, l'étagère, le réservoir
sur lequel il est posé, le sac, le carton, le sol, le mur, les gants, le fond de la pièce.
N'ajoute AUCUNE pièce absente de la photo : pas de caméra embarquée, pas de pare-soleil
extérieur, pas de mentonnière relevable si le casque n'en a pas, pas d'antenne, pas de
Bluetooth, pas de socle, pas de support, pas d'ombre portée.`,
}

/* ─── LA COMBINAISON ───────────────────────────────────────────────────────
   ⚠ CHOIX TRANCHÉ ICI : elle est PORTÉE, DEBOUT, ET VIDE — pas étalée à plat.
   « la combinaison c'est comme un skin, et le casque aussi » : un skin de jeu se
   montre debout, parce que c'est debout qu'on le reconnaît. Une combinaison
   étalée à plat perd tout ce qui la distingue — la bosse aérodynamique s'aplatit
   en tache, les protections d'épaule et de genou n'ont plus de relief, et il
   reste une forme de bonhomme en croix qui se lit comme du linge. Debout, la
   silhouette porte l'information à 52 carrés de large, ce qui est le seul budget
   disponible. */
const COMBINAISON: Fiche = {
  nom: 'COMBINAISON de moto en cuir',
  largeur: 52,
  hauteur: 112,
  matiere: 'le cuir',
  separations: 'buste / manche / jambe / protection / bosse aérodynamique',
  creux: "le creux du col, l'intérieur des poignets et des bas de jambes, "
    + "l'écart entre un bras et le buste",
  angle: `L'ANGLE — TROIS-QUARTS AVANT, IDENTIQUE POUR TOUTES LES COMBINAISONS, et c'est le
MÊME angle que celui des casques : les deux se rangent côte à côte. Applique les quatre points,
puis VÉRIFIE les deux tests du point 2 sur ton rendu avant de le donner.
1. La combinaison est DEBOUT, à la verticale, vue en trois-quarts avant : la poitrine est
   tournée vers la GAUCHE de l'image, et c'est le flanc droit du dessin qui montre le côté —
   bande latérale, coude, hanche, bosse aérodynamique qui dépasse derrière l'épaule.
2. DEUX TESTS, à faire sur ton propre dessin avant de rendre.
   · Les DEUX épaules sont visibles et séparées, et la poitrine se voit en entier. Si les deux
     bras se superposent, ou si une seule épaule se distingue, tu es trop DE PROFIL.
   · La bande latérale du flanc droit du dessin se suit sans interruption de l'aisselle à la
     cheville, et la bosse aérodynamique dépasse derrière l'épaule. Si aucun flanc ne se voit
     et si la bosse a disparu, tu es trop DE FACE.
3. LA POSE EST NEUTRE ET TOUJOURS LA MÊME : jambes droites légèrement écartées, bras le long
   du corps mais DÉCOLLÉS du buste d'au moins 3 carrés de chaque côté, pour que la bande
   latérale reste visible sur toute sa longueur. Aucune pose de course, aucun genou posé,
   aucun bras levé, aucune torsion.
4. La ligne de regard est à mi-hauteur de la combinaison : on ne la voit ni en plongée, ni en
   contre-plongée.
Si la photo montre la combinaison à plat, sur un cintre, pliée ou portée par quelqu'un, tu la
REPRÉSENTES quand même debout et vide, sous cet angle-là. Tu reportes la décoration à sa place
réelle. Tu n'inventes AUCUN motif pour les faces que la photo ne montre pas : une face inconnue
reçoit la couleur dominante du cuir, en aplat.`,
  budget: `- le cuir : 3 valeurs de sa couleur dominante (ombre / base / lumière), pas plus ;
- la bosse aérodynamique : une masse de 14 carrés de long sur 8 de haut, derrière l'épaule ;
- une protection d'épaule, de coude ou de genou : un aplat bombé de 8 à 10 carrés, cerné d'un
  contour d'un carré. Aucune vis, aucune écaille, aucune coque à facettes ;
- le slider de genou : un carré arrondi plein de 5 carrés ;
- les soufflets élastiques (lombaires, derrière le genou, sous le bras) : au plus 3 lignes
  horizontales d'un carré. Pas quinze plis ;
- une bande de décoration : au moins 3 carrés de large sur TOUTE sa longueur. Plus fine, elle
  est SUPPRIMÉE, jamais rétrécie ;
- la fermeture éclair : une ligne d'un carré. Ses dents, sa tirette, son rabat : 0 carré ;
- une couture, une surpiqûre, une perforation d'aération, un œillet, une étiquette :
  0 carré, donc ABSENTS ;
- le col, les poignets et le bas des jambes : un aplat SOMBRE fermé de 2 carrés d'épaisseur.`,
  sujet: `LA COMBINAISON, ET ELLE SEULE.
Elle est PORTÉE et VIDE, comme un mannequin de vitrine : le volume est celui d'une combinaison
sur quelqu'un — épaules pleines, coudes et genoux à peine fléchis, bosse aérodynamique
dressée — mais il n'y a PERSONNE dedans. Aucune tête, aucun visage, aucun cou, aucune main,
aucun pied, aucune silhouette humaine, aucun mannequin visible, aucun cintre, aucun support,
aucun socle. Le col, les deux poignets et les deux bas de jambe se ferment sur un aplat sombre.
Elle n'est PAS étalée à plat, PAS pliée, PAS pendue.
Tout le reste de la photo disparaît : la personne qui la porte, le lit, le cintre, la penderie,
le mur, le sol, le casque, les gants, les bottes, la dorsale, le sac.
N'ajoute AUCUNE pièce absente de la photo : pas de gants, pas de bottes, pas de casque, pas de
dorsale par-dessus, pas de ceinture, pas d'écusson.`,
}

const FICHES: Record<NomSujet, Fiche> = { casque: CASQUE, combinaison: COMBINAISON }

/**
 * ⚠ LE SUJET EST OBLIGATOIRE ET NE SE DEVINE PAS. Aucune valeur par défaut ici :
 * un sujet inconnu qui retomberait sur « casque » ferait dessiner une
 * combinaison avec une consigne de mentonnière — et l'appel serait payé quand
 * même.
 *
 * La levée n'est PAS morte, même si le type la rend inatteignable depuis
 * TypeScript : le banc de rendu appelle ce module depuis du JavaScript, où le
 * type ne garde rien. Elle est sûre là où elle est appelée — `index.ts` compose
 * la consigne AVANT `reserver_generation`, donc une levée n'a ni réservé de
 * créneau de quota ni envoyé un octet au modèle.
 */
export const prompt = (sujet: NomSujet): string => {
  const f = FICHES[sujet]
  if (!f) throw new Error(`sujet_inconnu: ${String(sujet)}`)
  // Les deux parts d'image sont DÉRIVÉES de l'encombrement, jamais saisies à
  // côté : deux nombres à tenir d'accord finissent par ne plus l'être, et le
  // prompt annoncerait alors une taille que son propre budget contredit.
  const partLargeur = Math.round((f.largeur / GRILLE) * 100)
  const partHauteur = Math.round((f.hauteur / GRILLE) * 100)

  return `Tu redessines la photo fournie en SPRITE PIXEL ART 16 BITS, comme un sprite de borne
d'arcade Sega du milieu des années 80 (Hang-On, Out Run). L'image fournie est la photo réelle
d'une pièce d'équipement appartenant à un pilote : ${f.nom}.

RÈGLE QUI PRIME SUR LE STYLE : c'est CETTE pièce, pas une pièce du même genre. Le pilote doit
reconnaître LA SIENNE au premier coup d'œil — sa forme, ses couleurs exactes, la découpe de sa
décoration, la place de chaque zone de couleur. Un joli sprite d'un autre équipement est un
échec total. Le pixel simplifie ; il ne remplace pas et n'invente pas.

${f.angle}

ZÉRO LETTRE — la contrainte la plus stricte de cette commande, et l'équipement en est le pire
cas de tout ce produit.
AUCUNE lettre de l'alphabet n'apparaît nulle part dans l'image. Zéro. Aucun mot, aucune
initiale, aucun sigle, aucun alphabet décoratif, aucun caractère d'aucune écriture.
- Une pièce d'équipement porte des marques TRÈS lisibles et tu les connais : sur un casque, au
  front, sur la mentonnière, sur la platine d'écran, sur la jugulaire ; sur une combinaison,
  sur la poitrine, les manches, les cuisses et les protections. Tu ne les écris PAS, même si
  tu les lis parfaitement, même si elles sont célèbres, même si elles sont l'élément le plus
  visible de la photo.
- Tu les remplaces par une BARRE PLEINE, un chevron ou un carré de couleur pleine : de la
  bonne couleur, à la bonne place, à la bonne taille. Un rectangle uni sans aucune découpe
  interne. Interdit : une suite de petits blocs séparés par des vides, alignés comme des
  lettres — c'est encore du faux texte, même sans lettre reconnaissable. Un rectangle plein,
  ou rien.
- L'étiquette d'homologation, la taille, la date de fabrication, le nom du pilote : ABSENTS.
  Ils sont de toute façon hors budget — voir plus bas : un texte qui ne fait pas 12 carrés de
  haut n'a aucune place sur cette grille, donc il n'existe pas.
- Emblème du fabricant : toléré seulement s'il est un pur symbole sans lettres, réduit à 3 ou
  4 carrés. Sinon, rien.
- Le SEUL texte autorisé, dans toute l'image, ce sont les CHIFFRES d'un numéro réellement
  peint en grand sur la pièce, s'il y en a un : chiffres pleins, 12 à 14 carrés de haut,
  traits de 2 carrés, à leur place réelle. S'il n'y en a pas sur la photo, il n'y en a pas sur
  le sprite — tu n'en inventes aucun.

LA GRILLE — c'est le cœur de la commande, applique-la littéralement.
TOUTE l'image — la pièce ET le fond — est dessinée sur UNE SEULE grille de ${GRILLE} × ${GRILLE}
pixels logiques, puis agrandie exactement ${BLOC} fois au plus proche voisin.
- La pièce elle-même ne fait que ~${f.largeur} carrés de large et ~${f.hauteur} carrés de haut.
  C'est volontairement peu : le sprite doit être SIMPLIFIÉ à ce budget, pas dessiné fin puis
  pixellisé.
- Chaque pixel logique est un CARRÉ PLEIN de ${BLOC} × ${BLOC} pixels de l'image finale, d'une
  couleur strictement uniforme, aligné sur la grille. Rien dans l'image n'est plus petit que ce
  carré, ni sur la pièce, ni sur le fond.
- AUCUN anti-aliasing, aucun lissage, aucun flou, aucun dégradé continu, aucune transparence
  partielle, aucune ombre douce. Un bord courbe est un ESCALIER de carrés.
BUDGET DE DÉTAIL — la contrainte qui rend la grille réelle. Compte les carrés, littéralement.
${f.budget}
Tout détail qui ne tient pas dans son budget est SUPPRIMÉ, jamais rétréci. Un sprite lisible se
reconnaît à sa silhouette et à ses grandes taches de couleur, pas à ses petites pièces.

LA PALETTE — DEUX SOUS-PALETTES ÉTANCHES, c'est impératif.
- Palette PIÈCE : ${COULEURS_SUJET} couleurs au maximum, prélevées uniquement sur la pièce
  photographiée.
- Palette FOND : DEUX couleurs et deux seulement, le vert ${VERT} et le violet ${CONTOUR}
  du contour. Le violet n'apparaît QUE dans le trait de contour, jamais en aplat à
  l'intérieur de la pièce.
Aucune couleur de la palette FOND n'apparaît sur la pièce, et réciproquement. En particulier
AUCUN vert de fond ne touche la pièce, et AUCUN violet, mauve, magenta ni lavande ne s'y pose :
ni sur ${f.matiere}, ni sur ses parties blanches, ni dans ses ombres. Les ombres de la pièce
sont des versions plus sombres de SA propre couleur, jamais des violets.
Chaque zone est un APLAT. Le volume se rend en 3 valeurs par teinte (ombre / base / lumière),
jamais plus, et les transitions entre deux valeurs se font au TRAMAGE en damier régulier de
pixels logiques (dithering), visible et assumé. Les blancs spéculaires sont un ou deux pixels
francs, pas un halo.
ANTI-CONTAMINATION, à vérifier carré par carré. Un blanc de décoration est un blanc franc et
froid (#F0F4FF), pas un gris-lilas. Un rouge reste ce rouge vif. Un or reste doré, pas gris.
Une pièce NOIRE reste NOIRE ET FROIDE : ${f.matiere} et tout ce qui est sombre se rendent avec
trois gris neutres très sombres distincts (#12161C, #1D2430, #2C3543) plus un liseré
blanc-bleu sur les arêtes hautes ; jamais en violet, jamais éclaircis en gris moyen. Une pièce
noire est le cas le plus fréquent et le plus facile à rater : elle doit rester lisible par ses
arêtes, pas devenir une silhouette pleine.

CONTOUR.
Silhouette entièrement cernée d'un contour fermé d'UN carré, violet très sombre ${CONTOUR}.
Les grandes séparations internes (${f.separations}) portent aussi un contour d'un
carré. C'est ce contour qui rend le sprite lisible ; ne l'omets nulle part. C'est le
MÊME contour que celui du portrait de la moto : les trois sprites se posent sur la même
scène de l'application et doivent s'y cerner pareil.

${f.sujet}

LE FOND — contrainte technique. La scène appartient à l'application, pas à l'image.
Aplat UNIFORME de vert pur saturé ${VERT} sur toute la surface qui n'est pas la pièce.
Strictement plat : aucun décor, aucun horizon, aucun sol, aucune ombre portée, aucun reflet,
aucune lueur, aucun tramage de fond, aucune vignette, aucun cadre, aucun socle.
Le vert est un seul carré de couleur répété — il ne participe pas au sprite.
Ce vert sera retiré par programme : la pièce ne doit contenir ce vert NULLE PART, y compris
dans ses creux et ses vides. ${f.creux} :
tous restent des aplats SOMBRES et OPAQUES. Aucune frange verte, aucun halo vert ne borde le
contour.

CADRAGE. Pièce vue entière, centrée horizontalement à 2 carrés près, occupant environ
${partLargeur} % de la largeur et ${partHauteur} % de la hauteur de l'image. Au moins
4 carrés de marge libre de chaque côté. Aucune partie coupée par un bord, aucun débordement.

Rends uniquement l'image.`
}
