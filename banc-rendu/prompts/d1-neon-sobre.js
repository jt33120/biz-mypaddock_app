// d1 — néon sobre. La voie de v1, exécutée proprement.
//
// Ce que v1 rate et que ce prompt attaque, dans l'ordre de gravité :
//
// 1. ORIENTATION. v1 a retourné IMG_9144 (avant à gauche dans la photo, avant à droite dans le
//    rendu). On ne corrige pas ça avec du vocabulaire — « profil gauche » est une notion que le
//    modèle raisonne mal, et le cadre.json se trompe lui-même (il annonce trois_quarts_avant sur
//    une photo de profil gauche). On le corrige avec une contrainte GÉOMÉTRIQUE vérifiable dans
//    le plan de l'image : la roue avant reste du côté du cadre où elle est. C'est la seule
//    formulation qu'on peut auditer en regardant les deux images côte à côte.
//    Corollaire : on n'utilise PAS cadre.vue. Une métadonnée fausse est pire que pas de
//    métadonnée, parce qu'elle donne au modèle une permission de contredire la photo.
//
// 2. TEXTES HALLUCINÉS. v1 : « SOMINOLE MUNTERES », « ABRIDGESTONE », « ALBACING », « VSS ».
//    Interdire « le texte » ne suffit pas : le modèle voit des taches qui ressemblent à des
//    lettres et son réflexe est de les rendre lisibles. On lui donne donc une SORTIE DE SECOURS
//    explicite — la tache reste une tache, un aplat de couleur au bon endroit et à la bonne
//    taille. Seuls les chiffres du numéro de course sont autorisés à être des glyphes.
//
// 3. LA MACHINE NOIRE. Sur IMG_8974, v1 pose un noir teinté cyan sur un fond teinté cyan : la
//    moto se dissout. On sépare par la VALEUR (fond plus sombre que la machine), pas par la
//    couleur, et on interdit au néon de teinter les aplats — il ne touche que les arêtes et le sol.
//
// Le fond quitte le bleu-canard de v1 pour l'indigo de DESIGN.md (ground.deep → ground.mid, filet
// sky.miami). Écart assumé vs DESIGN.md : pas de tramage ni de scanline sur la machine. DESIGN.md
// dit « le pixel est un accent, pas une texture » et l'image du garage est justement la zone où
// la moto doit être lue, pas décorée. Le grain reste dans le fond.
export const version = 'd1-d'
export const modele = 'gemini-3-pro-image'
export const entreePx = 1280

export const prompt = (cadre) => `AVANT TOUT AUTRE CHOSE, LIS CES DEUX LIGNES. Ce sont les deux
erreurs qui ont fait rejeter les tentatives précédentes.

A. TU NE RETOURNES PAS L'IMAGE. Regarde de quel côté du cadre est la ROUE AVANT sur la photo. Elle
   reste de ce côté. Roue avant à gauche sur la photo → roue avant à gauche dans ton illustration.
   Roue avant à droite → elle reste à droite. Aucun miroir, aucune symétrie, aucun changement de
   côté, jamais, pour aucune raison de composition.
B. TU N'ÉCRIS AUCUNE LETTRE. Zéro caractère alphabétique dans l'image entière. Seuls les CHIFFRES
   du numéro de course sont autorisés.

────────────────────────────────────────────────────────────

Tu redessines la moto de la photo fournie en illustration, pour l'écran d'accueil d'une application
de roulage moto. Le propriétaire de cette moto va voir cette image chaque fois qu'il ouvre
l'application. Il doit reconnaître SA machine, pas une moto du même genre.

═══ 1. CE QUI NE SE NÉGOCIE PAS : C'EST CETTE MACHINE ═══

Traite la photo comme un document de référence, pas comme une inspiration. Tu la redessines, tu ne
la réinterprètes pas. Sont à reproduire exactement, dans cet ordre de priorité :

1. La SILHOUETTE : le modèle exact, la ligne du carénage, la hauteur de selle, la forme du
   saute-vent, la longueur du bras oscillant, la position et la forme du silencieux.
2. Le CÔTÉ ET L'ANGLE (voir section 2, c'est le défaut le plus fréquent).
3. La DÉCORATION : chaque zone de couleur du carénage — sa forme, son sens, sa limite. Un éclair
   blanc qui monte vers l'arrière ne descend pas vers l'avant. Une joue de carénage noire ne
   devient pas rouge.
   ET SURTOUT la PROPORTION des couleurs. Compte, à vue, la part de chaque teinte sur la photo :
   si le noir couvre la moitié du carénage, il couvre la moitié chez toi. Le piège est de laisser
   grossir la couleur la plus vive parce qu'elle est plus « jolie » — une déco majoritairement
   noire et blanche avec du rouge en accent ne devient pas une moto rouge. Un réservoir noir reste
   noir : ne le peins pas de la couleur du carénage.
4. Les COULEURS PROPRES, mesurées sur la photo. Un noir est noir, pas bleu nuit ni anthracite
   verdâtre. Un rouge de course est saturé, pas bordeaux. Un or de jante est or, pas jaune ni
   bronze. Ne fais pas glisser une teinte pour « harmoniser » avec l'éclairage de la scène.
5. Les ÉQUIPEMENTS PRÉSENTS : top-case, valises, bulle haute, protège-mains, sabot, échappement
   non-série, disques flottants, pontets. S'ils sont sur la photo, ils sont sur l'image.
6. Les JANTES : nombre exact de bâtons, leur épaisseur, la couleur du voile, la taille du disque
   et l'étrier. C'est le détail qu'un pilote regarde en premier après sa déco.

Rien de ce qui n'est pas sur la photo n'apparaît. Aucun ajout d'échappement, d'aileron, de
sponsor, de crash-pad, de plaque. Si une pièce est masquée ou floue sur la photo, dessine-la
SIMPLE et sombre — une masse sobre et juste vaut mieux qu'un détail inventé.

═══ 2. LE CÔTÉ ET L'ANGLE : CONTRAINTE GÉOMÉTRIQUE ═══

Tu gardes la position de caméra de la photo. Tu ne tournes pas autour de la moto, tu ne passes pas
de l'autre côté, tu ne fais AUCUN effet miroir.

Procédure, dans cet ordre :

1. Localise sur la photo la ROUE AVANT — celle qui porte la fourche, le garde-boue avant et les
   disques de frein. Note dans quelle moitié du cadre elle se trouve : gauche, ou droite.
2. Localise la QUEUE — coque arrière, feu arrière, silencieux. Elle est dans l'autre moitié.
3. Dans ton illustration, la roue avant va dans LA MÊME moitié que sur la photo, et la queue dans
   l'autre. Le nez de la moto pointe du même côté du cadre que sur la photo.

Si en dessinant tu te retrouves avec la roue avant du côté opposé à la photo, tu as retourné
l'image : l'illustration est refusée, quelle que soit sa beauté. Ne le fais pas.

Trois vérifications complémentaires :

- Le FLANC visible est le même. Mêmes pièces visibles, mêmes pièces cachées. Si le silencieux est
  visible sur la photo il est visible chez toi ; s'il est caché derrière la machine il reste caché.
  La décoration est orientée dans le même sens : un éclair qui file vers l'arrière file vers
  l'arrière, du même côté du cadre.
- Le DEGRÉ DE ROTATION est le même, et c'est l'erreur la plus fréquente après le miroir : on ouvre
  la machine en trois quarts parce que c'est plus vendeur. Non. Mesure sur la photo le RAPPORT
  entre la largeur apparente du pneu avant (sa bande de roulement visible, de gauche à droite) et
  le diamètre de la roue. Reproduis ce rapport. S'il vaut un cinquième sur la photo, il vaut un
  cinquième chez toi — la machine reste quasi de profil. S'il vaut un tiers, garde ce trois quarts.
  Ne mets pas à plat un trois quarts, n'ouvre pas un profil en trois quarts.
- La HAUTEUR DE CAMÉRA est la même : vue basse au niveau de la roue si la photo est basse, vue
  d'homme debout si la photo est prise debout. Pas de contre-plongée héroïque ajoutée.

Tu peux corriger le placement dans le cadre et redresser une machine penchée pour la poser d'aplomb
sur ses deux roues. Tu ne peux pas changer de quel côté elle regarde.

═══ 3. AUCUNE LETTRE, NULLE PART ═══

Règle dure, déjà violée deux fois. Sur la photo, beaucoup de stickers de sponsors sont illisibles :
petites taches de texte, logos écrasés, contours vagues. Ton réflexe sera de les rendre lisibles.
Ce réflexe produit des mots inventés et détruit l'image.

- L'image finie ne contient AUCUN caractère alphabétique. Aucune lettre, même minuscule, même
  floue, même partielle, même comme texture. Pas de nom de marque, pas de nom de modèle, pas de
  nom de pneumatique, pas d'acronyme, pas de nom d'équipe.
- SEULE EXCEPTION : les CHIFFRES du numéro de course, s'ils sont nets et certains sur la photo.
  Mêmes chiffres, même place, même couleur, même fond de plaque. Rien d'autre n'a le droit d'être
  un caractère.
- Les chiffres sont dessinés dans le bon sens, jamais en miroir, jamais retournés, jamais déformés
  au point de devenir un autre chiffre. S'ils sont posés sur une surface vue très de biais, ils
  suivent la perspective de cette surface mais restent lisibles dans le bon sens. Si tu ne sais
  pas les placer correctement sur une surface, ne les mets pas sur cette surface.
- Un sticker illisible devient une PASTILLE SOURDE : une forme simple — rectangle, bande, ovale —
  d'UNE SEULE couleur, celle qui domine le sticker sur la photo, légèrement désaturée, à sa place
  et à sa taille réelles. Pas de trait de texte à l'intérieur, pas de motif, pas de dégradé.
- Ces pastilles sont RARES et DISCRÈTES. En cas de doute, tu en mets MOINS que sur la photo, pas
  plus. Cinq ou six au maximum sur toute la machine. Elles ne doivent pas attirer l'œil avant la
  déco elle-même.
- Aucune pastille multicolore, aucune bande arc-en-ciel, aucun assemblage de carrés de couleurs
  différentes, aucun drapeau, aucun damier. Ce sont des accidents de rendu, pas des stickers.
- Un emblème constructeur qui est PUREMENT un symbole (une aile, un diapason, un oiseau) peut être
  dessiné comme symbole, sans aucune lettre autour.
- Aucune plaque d'immatriculation lisible : une plaque visible reste vide et sombre.
- Aucun texte ajouté par toi : ni titre, ni signature, ni filigrane, ni légende, ni watermark.

Un mot mal orthographié sur le carénage détruit l'image entière. Une tache de couleur, jamais.

═══ 4. LA SCÈNE ═══

La machine seule, à l'arrêt, posée d'aplomb sur ses deux roues, dans un VIDE nocturne.

Le fond n'est pas un lieu. Ce n'est ni un garage, ni un box, ni un atelier, ni un studio meublé,
ni une pièce. C'est un limbe : une profondeur sombre et sans objet. Interdits formels, ils
reviennent à chaque tentative — aucun mur, aucun plafond, aucun sol carrelé, aucune porte, aucun
rideau métallique, aucun pilier, aucune poutre, aucun coin de pièce, aucune arête d'architecture,
aucune ligne de fuite, aucune bouche d'aération, aucun néon-tube au mur, aucun établi, aucun pneu
posé, aucun bidon. Si une paroi apparaît dans ton image, l'image est ratée. Il n'y a que la
machine, la nuit derrière elle, une seule ligne d'horizon lumineuse et le sol sous ses roues.
${cadre?.pilote_present
  ? `Attention : un pilote est en selle sur la photo, et la machine est probablement sur l'angle.
Retire complètement le pilote — corps, casque, gants, bottes, combinaison — et REDRESSE la moto à
la verticale, d'aplomb, comme à l'arrêt. Tu conserves le même côté et le même angle de vue qu'à la
photo (section 2). Les parties que le pilote masquait — selle, réservoir, coque arrière, repose-pieds
— sont dessinées sobres et cohérentes avec le reste de la déco, sans inventer de motif nouveau.`
  : `La moto est déjà seule sur la photo. Retire toute béquille, tout support de stand, toute cale.`}

Tout le décor de la photo disparaît : paddock, camion, remorque, gravier, herbe, arbres, ciel,
bâtiments, clôture, fleurs, autres véhicules, personnes, casques, sacs, outils. Rien ne reste au
sol autour de la machine.

Cadrage carré. Vue entière, aucune roue coupée. La moto occupe environ 82 % de la largeur, centrée,
son axe légèrement au-dessus du milieu de l'image pour laisser respirer le reflet en bas.

═══ 5. LE STYLE ═══

Illustration au trait et aplats, propre et graphique. Pas de photoréalisme, pas de rendu 3D
brillant, pas de cartoon, pas de pixel art, pas d'aquarelle, pas de peinture à touches visibles.

- Contour : un liseré sombre fin et net sur la silhouette et les grandes séparations de carénage.
  Le trait s'affine et disparaît dans les zones sombres. Pas de contour noir épais et uniforme.
- Volumes : ombrage en 3 ou 4 valeurs par matériau, avec des limites franches entre les valeurs.
  Pas de dégradé mou et lisse partout — l'image doit avoir de l'arête, pas du velours.
- Matières distinctes, c'est ce qui fait la qualité : la peinture du carénage est laquée, avec un
  reflet long et net et un bord de reflet dur ; le carbone et les plastiques techniques sont mats
  et absorbent ; l'or anodisé des jantes et des fourreaux de fourche est métallique et chaud, avec
  un reflet fin ; l'inox du silencieux et de la ligne est froid et sale ; le pneu est un noir mat
  très sombre avec un liseré lumineux sur le flanc et l'épaule ; le disque de frein est un gris
  métal clair, ses trous et son voile lisibles.
- Le carénage doit se lire comme du plastique peint épais qui accroche la lumière, jamais comme un
  aplat de couleur uniforme.

═══ 6. LA LUMIÈRE ET LE FOND ═══

- Fond : indigo TRÈS sombre, presque noir. #0A0620 en haut, à peine réchauffé vers #1A0F38 au
  niveau du sol. C'est un fond de nuit, pas un fond violet clair : sa zone la plus lumineuse reste
  nettement plus sombre que le pneu de la moto. Aucune tache de projecteur, aucun halo diffus
  derrière la machine.
- LA TEINTE DU FOND, à ne pas rater : c'est un INDIGO VIOLACÉ, jamais un bleu-vert. Dans la couleur
  du fond, la composante rouge est SUPÉRIEURE à la composante verte. Pas de turquoise, pas de
  canard, pas de vert-bleu, pas de sarcelle, pas d'anthracite. Seul le filet d'horizon et les
  liserés de lumière sont cyan ; la masse du fond est violette.
- Une seule ligne d'horizon lumineuse, cyan clair (#3DE0FF), horizontale, fine, nette, calme,
  posée à peu près à la hauteur du moteur. Elle est INTERROMPUE par la silhouette de la moto : on
  la voit à gauche et à droite de la machine, jamais devant elle, jamais par-dessus une pièce. Son
  halo est court, quelques pixels.
- VALEUR DU FOND, contrainte dure : le fond est un dégradé vertical CONTINU et régulier, du plus
  sombre en haut au très légèrement moins sombre en bas. Aucune bande, aucun palier, aucun bandeau
  clair, aucune marche de valeur, aucune arête horizontale — le seul accident horizontal autorisé
  dans toute l'image est le filet cyan. La jonction fond / sol est invisible : aucun effet de
  podium, de plateau, de scène. Et aucune zone du fond, même la plus claire, n'est plus lumineuse
  que le pneu de la moto : si tu plisses les yeux, la machine est claire sur un fond sombre, pas
  une masse sombre sur un fond violet vif.
- Sol : même valeur sombre que le bas du fond ; on ne le devine QUE par le reflet et par l'ombre de
  contact. Sous la machine, un reflet vertical fidèle — même silhouette, mêmes couleurs, contrasté
  à 20 %, coupé net à mi-hauteur et flouté progressivement vers le bas. Le reflet doit rester
  LISIBLE comme la même moto, pas une flaque de taches ni un dessin en double. Si tu ne peux pas le
  rendre lisible, fais-le plus court et plus faible : un reflet raté est pire qu'un reflet discret.
- Une ombre de contact sombre et resserrée sous chaque pneu, pour que la moto pose vraiment.
- Éclairage : une source froide principale, haute, du côté du nez, qui dessine les arêtes du
  carénage ; une source d'appoint plus faible du côté opposé.
- LE LISERÉ N'EST PAS UN CONTOUR. Erreur déjà commise : un trait cyan continu tout autour de la
  moto, pneus compris, qui la transforme en sticker découpé. Le liseré est de la LUMIÈRE : il
  n'existe que sur les arêtes réellement tournées vers la source d'appoint, il est INTERROMPU, il
  s'épaissit sur une arête vive et s'éteint complètement dans les creux, sous le carénage, entre les
  rayons. Il ne fait jamais le tour d'un pneu, jamais le tour d'un disque, jamais le tour du
  carénage entier. Un liseré sur deux tiers de la silhouette au maximum.
- RÈGLE DE COULEUR : le néon vit sur les ARÊTES, dans les REFLETS et sur le SOL. Il ne teinte
  jamais les aplats du carénage. Les couleurs propres de la moto restent celles de la photo.
- CAS DE LA MACHINE NOIRE, à traiter avec soin : un noir reste un noir NEUTRE, graphite, jamais
  bleuté, jamais verdâtre, jamais violacé. On la détache du fond par TROIS moyens, et jamais en
  éclaircissant le fond : (1) le liseré cyan interrompu sur ses arêtes hautes, (2) des reflets
  laqués francs et clairs sur le haut des surfaces peintes — réservoir, flancs de carénage, bulle,
  top-case, valises — qui montrent que c'est du noir brillant, (3) l'or des jantes et des fourreaux,
  les gris métal des disques et de la ligne d'échappement, qui portent la lumière. Une machine noire
  ne doit JAMAIS se confondre avec le fond, et ne doit JAMAIS devenir gris moyen pour se voir.

Aucun cadre, aucune bordure, aucune vignette forte, aucun logo, aucune personne.

═══ 7. DERNIÈRE VÉRIFICATION AVANT DE RENDRE ═══

1. La roue avant est-elle du MÊME côté du cadre que sur la photo ? Si non, recommence.
2. Y a-t-il une seule lettre dans l'image ? Si oui, enlève-la.
3. Est-ce bien ce modèle-là de moto, avec cette déco-là, ces jantes-là, ces bagages-là ?
4. Les proportions de couleurs de la déco sont-elles celles de la photo, ou la couleur vive a-t-elle
   pris la place du noir ?
5. Le fond est-il un dégradé continu, sans bande claire, plus sombre que la machine ?
6. Le liseré cyan est-il interrompu, ou fait-il le tour de la moto comme un contour de sticker ?

Rends uniquement l'image, format carré.`
