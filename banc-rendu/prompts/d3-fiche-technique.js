// d3 — LE PLAN TECHNIQUE LUMINEUX.
//
// Direction : la moto en dessin d'atelier. Élévation de profil, traits lumineux fins sur fond
// très sombre. Pas de matière, pas de reflet, pas d'éclairage — du trait.
//
// Pourquoi ici : la moitié du produit est un carnet d'entretien. Un plan technique dit « machine
// qu'on entretient » là où la photo léchée dit « machine qu'on montre ». Et un trait ne prétend
// pas au réalisme : quand il se trompe d'un détail, il ne tombe pas dans la vallée dérangeante.
//
// Deux partis pris qui viennent des rendus, pas de l'intention :
// 1. La livrée n'est pas peinte, elle est TRACÉE — frontières de peinture en lignes, zones
//    remplies d'un aplat mat. À 15 % d'opacité (d3.1) le rouge devenait saumon et le turquoise
//    menthe : la machine cessait d'être la sienne. L'aplat est remonté.
// 2. Le trait porte une information : blanc = carrosserie, cyan = organe qu'on entretient
//    (moteur, transmission, freins, suspension, échappement). Le plan dit ce qu'on démonte.
export const version = 'd3.4'
export const modele = 'gemini-3-pro-image'
export const entreePx = 1024

export const prompt = (cadre) => `Tu produis le PLAN TECHNIQUE d'une moto, pour l'écran « garage »
d'une application de roulage. L'image fournie est la photo réelle de la moto d'un pilote. Tu la
redessines au trait, comme une élévation d'atelier.

═══ ÉTAPE 0 — LE SENS DE LA MACHINE. À FAIRE AVANT TOUT TRAIT. ═══
Sur la photo, repère la roue AVANT : celle qui porte la fourche, le garde-boue avant, la bulle et
le guidon. Constate de quel côté du cadre elle se trouve, à gauche ou à droite.
Ton dessin place la roue avant DU MÊME CÔTÉ que la photo.
- roue avant à gauche sur la photo → roue avant à gauche sur ton plan ;
- roue avant à droite sur la photo → roue avant à droite sur ton plan.
Autre façon de le vérifier, utile quand la moto est inclinée sur l'angle : dans quel SENS DE MARCHE
va-t-elle sur la photo ? Vers la gauche du cadre ou vers la droite ? Ton plan garde ce sens de
marche. Une moto qui roulait vers la droite pointe vers la droite, redressée ou non.
Aucun miroir, aucun retournement, aucune symétrie horizontale, pour aucune raison de composition.
Tu dessines aussi le MÊME FLANC que la photo. Le flanc d'une moto n'est pas symétrique : la chaîne
et sa couronne sont d'un côté, le silencieux et le sélecteur de l'autre. Ne montre que les pièces
du flanc tourné vers l'objectif ; celles du flanc caché n'apparaissent pas.
Ni une description, ni l'habitude, ni l'élégance ne prime : seule la photo dit le sens et le flanc.

═══ 1. RÈGLE QUI PRIME SUR TOUT LE RESTE ═══
C'est CETTE machine, pas une machine. Le pilote doit reconnaître la sienne au premier coup d'œil :
le modèle exact, sa silhouette, la découpe de son carénage, l'implantation de son échappement, ses
jantes, ses suspensions, ses accessoires, son numéro. Compte les éléments sur la photo et redessine
CEUX-LÀ. N'idéalise pas, ne modernise pas, ne remplace aucune pièce, n'ajoute aucun équipement
absent de la photo. Un détail illisible se simplifie ; il ne se complète jamais par imagination.

═══ 2. PROJECTION — ÉLÉVATION, PAS PHOTO ═══
Élévation orthographique de profil : caméra à hauteur de moyeu, ligne de visée perpendiculaire à
l'axe de la machine, aucune perspective, aucun raccourci, aucun point de fuite.
Quatre critères qui se vérifient à l'œil, et qui valent même si la photo est prise de trois quarts :
tu REPROJETTES la machine en profil pur, tu ne recopies pas l'angle de l'appareil.
- Les deux roues sont des CERCLES parfaits, pas des ellipses ; la roue arrière est du même diamètre
  ou légèrement plus grande que l'avant, jamais plus petite ; les deux moyeux sont exactement sur la
  même horizontale.
- On ne voit AUCUNE surface horizontale : ni le dessus du réservoir, ni l'assise de la selle, ni le
  dessus du garde-boue, ni le dessus du top-case. Si tu vois le dessus d'une pièce, tu n'es pas en
  élévation : recommence plus bas.
- Le guidon est vu de bout : les deux demi-guidons se superposent, la roue avant n'est pas braquée,
  aucune pièce ne part vers l'avant ou vers l'arrière en fuyant.
- Les deux pneus TOUCHENT la ligne de sol. La machine ne flotte pas.
- Rien de la machine n'est coupé par le bord : roue avant, roue arrière, haut de bulle, bas de
  sabot, bagages, tout est entièrement dans l'image.
${cadre?.pilote_present
  ? `- Un pilote est en selle sur la photo : RETIRE-LE entièrement, ainsi que l'angle de la moto.
  Redresse la machine sans changer son sens : l'avant reste du côté où il est sur la photo.
  Reconstitue le flanc que le pilote masquait à partir de ce que la photo montre ailleurs — même
  carénage, même livrée, mêmes couleurs. Ce qui reste douteux devient une surface vide, jamais un
  détail inventé.`
  : `- La moto est déjà seule sur la photo, à l'arrêt.`}

═══ 3. AUCUNE LETTRE. JAMAIS. ═══
Une fausse marque sur la moto d'un pilote ruine l'image entière, autant qu'une erreur de modèle.
- Les SEULS caractères autorisés dans toute l'image sont les CHIFFRES du numéro de course, s'il y
  en a un de lisible sur la photo. Rien d'autre, nulle part.
- Ces chiffres apparaissent uniquement là où la photo les montre — sur le flanc de carénage ou la
  plaque de numéro — jamais sur la bulle, jamais sur le réservoir, jamais deux fois par panneau.
- Tout autre texte — sponsors, marque de pneu, de suspension, d'échappement, plaque
  d'immatriculation, nom du constructeur, nom du modèle, emblème de marque, inscription de bulle ou
  de jante — n'est pas redessiné : la surface reste VIDE. Au maximum un petit rectangle au trait,
  strictement vide à l'intérieur. Rien qui ressemble de loin à un mot, à un sigle ou à un emblème.
- Tu n'écris aucun mot, aucune abréviation, aucune suite de lettres, même floue, même minuscule,
  même « en écriture technique ». Pas de titre, pas de légende, pas de cote, pas de cartouche, pas
  de flèche annotée, pas de signature, pas de filigrane.
- Cas piégeux, ils se sont déjà produits : le NOM DU MODÈLE sérigraphié sur le flanc ou le
  réservoir, le sigle du constructeur sur le réservoir ou la bulle, la marque du pneu sur le flanc
  du pneu, le nom du silencieux. Aucun des quatre n'est redessiné. Cette surface reste nue. Mieux
  vaut un flanc muet qu'un nom mal orthographié : le pilote connaît sa moto, il n'a pas besoin
  qu'on lui écrive son nom dessus.
- Entre écrire quelque chose et ne rien écrire : tu ne mets rien.

═══ 4. LE STYLE — DU TRAIT LUMINEUX SUR FOND SOMBRE ═══
Dessin au trait vectoriel, propre et régulier, comme un plan d'atelier rétro-éclairé ou un écran de
diagnostic. Aucune matière, aucun reflet, aucun chrome, aucun rendu 3D, aucune ombre portée, aucune
lumière d'ambiance, aucun dégradé sur la machine, aucune texture de peinture, aucune étincelle.
Les traits sont LUMINEUX PAR CONTRASTE, pas par rayonnement : chaque trait est net, d'épaisseur
constante, à bord franc. Aucune lueur, aucun halo, aucun flou autour des traits, aucun effet néon,
aucune enseigne lumineuse. Ce n'est pas un néon de bar, c'est un tracé sur un écran.

Fond : bleu-nuit presque noir, #080418 en haut vers #100A28 en bas. Par-dessus, une grille technique
très discrète (carreaux réguliers, #16103A, un trait un peu plus clair tous les cinq carreaux) et
une seule ligne de sol horizontale fine sous les pneus, #302566. Rien d'autre : pas de mur, pas de
garage, pas de décor, pas d'horizon, pas de halo, pas de vignettage.

Le trait dit à quoi sert la pièce — c'est la clef de lecture du plan :
- CARROSSERIE ET STRUCTURE en blanc glacé #EAF2FF : contour de la machine, carénage, bulle, selle,
  réservoir, garde-boue, coques arrière, top-case et valises. Trait net, épaisseur moyenne.
- ORGANES D'ENTRETIEN en cyan lumineux #3DE0FF, trait fin : moteur et ses carters, échappement,
  chaîne et couronne, bras oscillant, fourche, amortisseur, disques et étriers de frein, radiateur,
  durites, câbles, boulonnerie. C'est le cyan qui donne au plan son air d'écran de diagnostic — il
  doit se voir nettement sur le fond sombre, sans jamais baver.
- REPÈRES en #4C3D9E, très fin : axes de moyeu, ligne de sol, deux ou trois marques géométriques
  sobres. SANS aucun chiffre ni aucune lettre.
- Les JANTES gardent la couleur réelle de la photo — or, noir, blanc, gris — jamais cyan : une
  jante dorée se lit dorée, c'est un signe de reconnaissance fort pour son propriétaire. Seuls les
  disques, les étriers et le moyeu sont au trait cyan.
- Les pneus sont des anneaux SOMBRES, presque du fond, simplement cerclés d'un trait fin #8FA2D8
  à l'intérieur et à l'extérieur, avec quelques rainures fines — jamais de motif inventé, jamais
  cyan, et jamais remplis d'un aplat clair : un pneu clair et épais écrase tout le dessin.
- Le cyan reste minoritaire dans l'image : c'est un trait fin d'organe, pas la couleur du dessin.

La livrée n'est pas peinte, elle est TRACÉE, mais elle doit rester JUSTE : dessine les frontières
exactes des zones de peinture de la photo comme des lignes fines, puis remplis chaque zone d'un
aplat mat, parfaitement uniforme, dans la teinte VRAIE de la photo, franche et reconnaissable — un
rouge de course est rouge vif, pas saumon ni rose ; un turquoise est turquoise franc, pas menthe
pâle ; un blanc est blanc, pas gris ; un or de jante est or. Les zones NOIRES de la photo ne sont
pas remplies : elles restent du trait nu sur le fond, c'est leur juste traduction, et c'est ce qui
laisse le dessin respirer. Le numéro de course est net : chiffres pleins, forme et emplacement de
la photo.

Interdits de facture, ils ont déjà gâché des essais : pas de liseré blanc épais suivant le contour
de la silhouette, pas d'effet autocollant découpé, pas de fond blanc, pas de contour cerné comme un
sticker. Le contour de la machine est un trait d'égale épaisseur, comme tous les autres.

Deux pièces à ne pas oublier, elles ont manqué dans des essais : le SILENCIEUX, avec sa forme et
sa position exactes s'il est visible sur ce flanc, et la CHAÎNE avec sa couronne. Ce sont deux
pièces qu'un pilote regarde en premier.

═══ 5. CE QUI DISPARAÎT ═══
Tout le décor : sol, gravier, herbe, arbres, fleurs, piste, bâtiments, ciel, camion, remorque,
béquille de stand, cônes, barrières, personnes, casques, sacs, outils. La machine est SEULE.
Les bagages fixés à la moto — top-case, valises latérales, supports — font partie de la machine :
tu les gardes et tu les dessines au trait comme le reste.

═══ 6. CADRAGE ═══
Format carré. La moto de profil, centrée, environ 88 % de la largeur, un peu au-dessus du centre
vertical. Aucun cadre, aucune bordure, aucun coin arrondi.

═══ 7. VÉRIFICATION AVANT DE RENDRE ═══
1. La roue avant est-elle du même côté que sur la photo ? Si non, tu as retourné l'image : refais.
2. Y a-t-il une seule lettre quelque part — flanc, réservoir, bulle, pneu, jante ? Efface-la.
3. Vois-tu le dessus du réservoir ou de la selle ? Alors ce n'est pas une élévation : redescends.
4. Les jantes ont-elles leur couleur réelle, et les pneus sont-ils neutres ?
5. Les couleurs de la livrée sont-elles celles de la photo, franches et non délavées ?
6. Est-ce bien ce modèle de moto, avec ses accessoires et son numéro ?

DERNIER CONTRÔLE, LE PLUS IMPORTANT DE TOUS. Reviens à la photo fournie et trouve la roue avant :
celle qui porte la fourche, le garde-boue avant et la bulle. Est-elle à gauche ou à droite du
cadre ? Ton plan doit la placer exactement du même côté. Si ton dessin la met de l'autre côté, tu
as retourné la machine et l'image est fausse, aussi belle soit-elle : redessine dans le bon sens.

Rends uniquement l'image.`
