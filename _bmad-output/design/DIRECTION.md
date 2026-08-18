# Direction de design — verrouillée le 18 août 2026

## La décision

**Attract Mode** (itération 4, `04-attract-mode.html`) est la direction retenue.
Arcade assumée, référencée sur **Hang-On** (Sega, 1985, Yu Suzuki — premier grand jeu
de moto) et **Out Run** (Sega, 1986) pour la couleur.

Les trois itérations précédentes restent au dossier comme matériau, pas comme options :
`01-chrono-violet.html` (instrument sobre), `02-banc-essai.html` (essais de sol),
`03-six-ecrans.html` (app moderne, bento). La sémantique et les six fonctions sont
identiques dans les quatre — seule la peau change.

## Ce qui est acquis et ne se rouvre plus

- **Le violet `#B026FF` ne s'allume que sur un record.** Meilleur tour, meilleur secteur,
  coût au tour record, geste débloqué. Vert = record personnel, jaune = plus lent.
- **Le violet est le pont du dégradé.** Règle Out Run : un orange vif posé sur un bleu
  profond donne un gris brunâtre ; il faut un magenta ou un violet saturé entre les deux.
  Le violet de marque est cette pièce. Ce n'est pas un choix décoratif, c'est structurel.
- **Le fond n'est jamais noir plat.** Dégradé vertical multi-arrêts + tramage 4 px + scanlines.
- **Biseaux pixel, pas ombres douces.** Aucun coin arrondi, aucun flou.
- **Le HUD n'a pas d'accents** (« LEDENON »), le texte lisible garde les siens.
- **Le budget de saison est un compteur de crédits.** Le coût au tour est un score qui descend.
- **Aucun damier de drapeau à damier comme signe de marque.**

## Correctifs demandés — à appliquer à la prochaine passe

1. **Décaler la palette vers le bleu ciel — vibe Miami.** Aujourd'hui le ciel va du violet
   au magenta au orange. Ajouter un bleu ciel / cyan clair comme couleur d'atmosphère, pour
   sortir du purement crépusculaire et gagner du jour. Le cyan `#3DE0FF` est déjà présent
   comme couleur de donnée secondaire — l'étendre au ciel.
2. **Plus épuré.** Moins d'éléments par écran, plus de vide. La densité actuelle est
   au plafond de ce qui reste lisible ; redescendre d'un cran.
3. **Deux polices, dont une manuscrite.** Garder Press Start 2P pour le HUD et les chiffres,
   et ajouter une script racing du style **Racing Catalogue** (Octotype / Thomas Boucherie,
   dafont, juin 2022) pour les titres et les moments d'émotion — nom du circuit, nom du geste,
   titre de l'image de partage.
   **Contrainte de licence à ne pas oublier :** Racing Catalogue est gratuite pour usage
   personnel uniquement. Toute diffusion publique de l'app exige une licence commerciale
   (octotypeone@gmail.com). Prévoir une alternative sous licence libre si le produit sort
   du bac à sable.
4. **Alléger.** Moins de clignotement, moins de scanline, moins de biseau partout. Le pixel
   doit rester un accent, pas une texture générale.

## Piste ouverte

Garder la peau pixel **uniquement pour l'image de partage Instagram** — là où elle travaille
le plus fort — et tenir l'app elle-même en version « Six Écrans ». Non tranché.

## Vérifications faites

Contraste WCAG AA mesuré sur les 20 couples couleur/fond de la version arcade : tous passent.
Le violet de marque `#B026FF` échoue en petit texte (4,1:1) — il reste réservé aux tracés,
remplissages et gros chiffres ; le petit texte violet utilise une version éclaircie.
