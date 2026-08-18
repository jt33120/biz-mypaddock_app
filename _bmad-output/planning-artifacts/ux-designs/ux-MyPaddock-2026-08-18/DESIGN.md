---
title: "DESIGN — MyPaddock"
status: draft
created: 2026-08-18
updated: 2026-08-18
sources:
  - ../../prds/prd-MyPaddock-2026-08-18/prd.md
  - ../../../design/DIRECTION.md
  - ../../research/academic-lit-coherence-cognitive-du-produit-2026-08-18/research.md

colors:
  ground.deep:      "#080418"
  ground.mid:       "#160A34"
  ground.bridge:    "#4A1B6D"
  ground.horizon:   "#8A2E7A"
  surface:          "#120A2E"
  surface.raised:   "#1C1142"
  rule:             "#302566"
  rule.bright:      "#4C3D9E"
  ink:              "#EEF2FF"
  ink.dim:          "#93A0CE"
  ink.faint:        "#5E6A9B"
  sky.miami:        "#3DE0FF"
  sky.warm:         "#FF7A3C"
  record:           "#B026FF"
  record.light:     "#D98BFF"
  personal.best:    "#2BE88A"
  slower:           "#FFD23F"
  caution:          "#FF5C5C"

typography:
  hud:        "'Press Start 2P', monospace"
  emotion:    "'Racing Catalogue', 'Bungee Shade', cursive"
  text:       "'Chakra Petch', system-ui, sans-serif"
  scale.hud:  "10 / 12 / 16 / 24 / 40 / 64"
  scale.text: "14 / 16 / 18 / 22"

rounded:
  all: "0"

spacing:
  base: "4px"
  scale: "4 / 8 / 12 / 16 / 24 / 32 / 48 / 64"
  touch.min: "56px"
  touch.primary: "72px"

components:
  button.primary:   "pleine largeur · 72px · biseau 4px · HUD 16px"
  selector.wheel:   "3 molettes · chiffres HUD 40px · 88px de haut par molette"
  card.roulage:     "surface.raised · biseau 4px · filet rule 2px"
  gauge.wear:       "barre 12px · complétude toujours accolée"
  meter.credits:    "compteur de crédits · segments 8px"
---

# DESIGN — MyPaddock

**Attract Mode.** La direction est verrouillée depuis le 18 août 2026 et ne se rouvre pas.
Ce document est la référence visuelle ; [`EXPERIENCE.md`](EXPERIENCE.md) est la référence
comportementale. **Les deux gagnent sur toute maquette.**

---

## Brand & Style

MyPaddock ressemble à une **borne d'arcade des années 80 posée dans un paddock** — Hang-On
(Sega, 1985) et Out Run (Sega, 1986), pas une application de fitness. Ce n'est pas un thème
optionnel : c'est le produit. Un carnet d'entretien qui ressemble à un carnet d'entretien ne
s'ouvre pas onze fois par an.

**Trois tensions gouvernent chaque décision visuelle.**

**Le plaisir porte la corvée.** L'écran qui affiche un chrono et l'écran qui affiche une facture
sont **le même écran**, avec la même peau et le même soin. Si la corvée est plus terne, elle est
plus lourde — et c'est exactement ce que le produit est censé éviter.

**La couleur est de l'information, jamais de la décoration.** Chaque teinte de la palette
sémantique répond à une question du pilote. Le violet `record` n'est pas « la couleur de marque
qu'on met partout » : il s'allume **uniquement** sur un record, et son apparition est un événement.

**L'interface énonce, elle ne décerne pas.** C'est la règle la mieux soutenue par la recherche
du 18 août — le feedback verbal positif augmente la motivation intrinsèque là où les récompenses
tangibles la divisent. Visuellement : **pas de badge, pas de médaille, pas d'étoile, pas de
confettis.** Le fait est déjà remarquable ; l'emballer le transforme en récompense tangible.

**Le pixel est un accent, pas une texture.** Correctif de DIRECTION.md, et le plus important des
quatre : les scanlines, le tramage et les biseaux se concentrent sur les moments qui comptent —
le sol, le bloc de tête, l'image de partage — et disparaissent des zones de travail. Un carnet
d'entretien constellé de scanlines est illisible avec des gants au soleil.

**Le mot juste.** On dit **roulage**, jamais « trackday ». Le HUD n'a pas d'accents (`LEDENON`) ;
le texte lisible garde les siens (« Lédenon »).

---

## Colors

### Le sol — jamais noir plat

Le fond est un **dégradé vertical à quatre arrêts** plus un tramage 4 px, reproduisant le
crépuscule d'Out Run corrigé vers le **bleu ciel Miami** demandé.

| Token | Hex | Position | Rôle |
|---|---|---|---|
| `ground.deep` | `#080418` | 0 % | Le haut du ciel, presque nuit |
| `ground.mid` | `#160A34` | 35 % | Le corps du ciel |
| `ground.bridge` | `#4A1B6D` | 70 % | **Le pont** — sans lui, l'orange sur le bleu vire au gris brunâtre |
| `ground.horizon` | `#8A2E7A` | 100 % | La ligne d'horizon, magenta chaud |

**Le pont est structurel, pas décoratif.** C'est la règle Out Run : un orange vif posé
directement sur un bleu profond produit un gris sale au point de rencontre. Supprimer
`ground.bridge` casse le dégradé, pas seulement son élégance.

**La correction Miami** consiste à faire entrer `sky.miami` (`#3DE0FF`) dans l'atmosphère — un
voile cyan clair en partie haute, un liseré à l'horizon — pour sortir du purement crépusculaire
et gagner du jour. Le cyan existait déjà comme couleur de donnée secondaire ; il monte au ciel.

### Les surfaces

| Token | Hex | Rôle |
|---|---|---|
| `surface` | `#120A2E` | Le fond des zones de travail, posé sur le sol |
| `surface.raised` | `#1C1142` | Cartes, blocs de saisie, lignes de liste |
| `rule` | `#302566` | Filets, séparateurs, contours au repos |
| `rule.bright` | `#4C3D9E` | Contour actif, focus clavier |

### L'encre

| Token | Hex | Contraste sur `surface` | Rôle |
|---|---|---|---|
| `ink` | `#EEF2FF` | 15,8:1 | Chiffres, titres, tout ce qui se lit au soleil |
| `ink.dim` | `#93A0CE` | 6,1:1 | Libellés, unités, métadonnées |
| `ink.faint` | `#5E6A9B` | 3,2:1 | **Décor uniquement — jamais de texte porteur de sens** |

Les neutres portent tous un **biais bleu** assumé. Un gris neutre sur ce sol paraîtrait sale.

### La palette sémantique — chaque couleur répond à une question

| Token | Hex | Ce que le pilote comprend | Où elle a le droit d'apparaître |
|---|---|---|---|
| `record` | `#B026FF` | **« C'est un record. »** | Meilleur tour, meilleur coût au tour, cap franchi. **Nulle part ailleurs.** |
| `personal.best` | `#2BE88A` | « Plus rapide que la dernière fois. » | Écarts négatifs, horloges d'usure au vert |
| `slower` | `#FFD23F` | « Plus lent que la dernière fois. » | Écarts positifs. **Jamais un reproche — un fait.** |
| `sky.miami` | `#3DE0FF` | Donnée secondaire, atmosphère | Chiffres non comparatifs, sessions, atmosphère du sol |
| `sky.warm` | `#FF7A3C` | Chaleur, horizon, accent d'image | Sol, gabarits de partage. **Jamais un état.** |
| `caution` | `#FF5C5C` | Une échéance d'entretien est dépassée | Entretien uniquement. **Jamais sur une réparation non vitale.** |

> **Règle de contraste non négociable.** `record` (`#B026FF`) échoue AA en petit texte — **4,1:1**.
> Il est réservé aux **tracés, remplissages et gros chiffres** (≥ 24 px HUD). Tout petit texte
> violet utilise `record.light` (`#D98BFF`, 7,4:1).

> **Règle de daltonisme.** `personal.best` et `slower` ne se distinguent pas en deutéranopie.
> Un écart porte **toujours son signe** (`−1"8` / `+0"4`) et **jamais seulement sa couleur**. Voir
> [`EXPERIENCE.md`](EXPERIENCE.md) § Accessibility Floor.

> **Interdit de marque.** Aucun drapeau à damier, nulle part, sous aucune forme.

---

## Typography

Trois rôles, trois familles. **Chacune a un domaine et n'en sort pas.**

| Rôle | Famille | Ce qu'elle porte | Ce qu'elle ne porte jamais |
|---|---|---|---|
| **HUD** | Press Start 2P | Chiffres, chronos, libellés courts, boutons | Une phrase. Jamais plus de 4 mots. |
| **Émotion** | Racing Catalogue *(script racing)* | Nom du circuit, nom du geste, titre de l'image de partage | Une donnée. Jamais un chiffre. |
| **Texte** | Chakra Petch | Tout ce qui se lit vraiment — explications, conformité, complétude, carnet | Un chrono. |

**Le HUD n'a pas d'accents** — c'est une contrainte de la fonte et un parti pris assumé :
`LEDENON`, `LE MANS`. **Le texte lisible garde les siens** : « Lédenon », « échéance ».

**Échelle HUD** — 10 / 12 / 16 / 24 / 40 / 64 px. Le 64 est réservé au chrono du jour et au coût
au tour, une seule occurrence par écran. **Échelle texte** — 14 / 16 / 18 / 22 px, jamais moins
de 16 px pour du texte courant sur mobile.

`font-variant-numeric: tabular-nums` partout où des chiffres s'alignent — chronos, montants,
horloges. Un chrono qui saute d'une ligne à l'autre est une faute.

> **Piège de licence, à ne pas oublier.** **Racing Catalogue** (Octotype / Thomas Boucherie) est
> gratuite pour **usage personnel uniquement**. Le produit part maintenant vers de l'acquisition
> payante : **toute diffusion publique exige une licence commerciale** (octotypeone@gmail.com) ou
> une substitution. Repli sous licence libre à valider : **Bungee Shade** (SIL OFL). C'est une
> précondition à lever avant la première pub, pas après.
>
> **Contrainte technique** : les fontes sont **intégrées en data URI**, jamais chargées depuis un
> CDN — le produit doit fonctionner hors ligne au paddock.

---

## Layout & Spacing

**Grille de 4 px.** Tout — espacement, biseaux, filets, tailles de cible — est un multiple de 4.
C'est ce qui fait tenir la peau pixel sans qu'elle paraisse approximative.

Échelle : 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64.

**Cibles tactiles.** Minimum **56 px**, action primaire **72 px** pleine largeur.

> **Réserve honnête, écrite ici parce qu'elle sera oubliée sinon.** Ces valeurs ne s'adossent à
> **aucune littérature**. Le seul repère publié est un plancher **main nue** de 9,2 à 9,6 mm, issu
> d'une étude unique de 2006 sur du matériel d'époque. Sur la **saisie gantée sur écran
> capacitif**, la recherche ne renvoie rien. Les 56 et 72 px sont un point de départ généreux
> `[ASSUMPTION]`, **à régler par essai sur appareil avec de vrais gants de piste** — et à traiter
> comme une inconnue, jamais comme un acquis.

**Un écran, une fonction — mais la densité est là.** La navigation est simple ; le contenu ne
l'est pas. Correctif « plus épuré » de DIRECTION.md : **descendre d'un cran** par rapport aux
maquettes, en retirant du décor, jamais de la donnée.

**Marges** : 16 px sur les bords d'écran, 24 px entre blocs, 12 px à l'intérieur d'un bloc.
Disposition en **flex/grid avec `gap`**, jamais en marges individuelles.

---

## Elevation & Depth

**Il n'y a pas d'ombre dans ce produit. Il y a des biseaux.**

La profondeur se lit à la **lumière du biseau**, comme sur une borne d'arcade : bord haut et
gauche éclairé, bord bas et droit assombri.

| Niveau | Traitement |
|---|---|
| **Sol** | Le dégradé + tramage 4 px + scanlines, en fond d'écran uniquement |
| **Surface** | `surface`, filet `rule` de 2 px, pas de biseau |
| **Élevé** | `surface.raised`, biseau 4 px — lumière `rule.bright` en haut/gauche, `ground.deep` en bas/droite |
| **Actif** | Biseau **inversé** — l'élément s'enfonce, comme un bouton d'arcade pressé |

**Aucun flou, nulle part.** Pas de `box-shadow` diffuse, pas de `blur`, pas de glassmorphisme.

**Les scanlines et le tramage ne vont que sur le sol, le bloc de tête de l'accueil, et l'image
de partage.** Ils sont **interdits** derrière du texte courant, un carnet d'entretien, une liste
de dépenses ou un formulaire — c'est le correctif « alléger », et il a une raison fonctionnelle :
au soleil, avec des gants, une texture derrière du texte le rend illisible.

---

## Shapes

**Aucun coin arrondi. `border-radius: 0` partout, sans exception.**

Les formes viennent du vocabulaire arcade : **le rectangle biseauté** (bloc, carte, bouton), **le
segment** (compteur de crédits, jauge d'usure), **le chevron** (progression, direction), **la
molette** (sélecteur de chrono), **le filet 2 px** (séparation).

**Les icônes sont des tracés pixel** alignés sur la grille de 4, jamais des glyphes arrondis et
**jamais des emoji**.

---

## Components

### `button.primary` — le bouton unique

Pleine largeur, **72 px**, fond `record` ou `sky.miami` selon le contexte, texte HUD 16 px en
`ground.deep`, biseau 4 px. À l'appui : biseau inversé, aucun déplacement de la mise en page.

C'est l'élément le plus important du produit : **c'est lui qui porte « saisir la session »** sur
l'accueil, avec des gants, au soleil, entre deux passages.

### `selector.wheel` — les trois molettes

La saisie du chrono. **Trois molettes** — minutes, secondes, dixièmes — chiffres HUD **40 px**,
88 px de hauteur par molette, la valeur active en `ink` et les voisines en `ink.faint`.
**Aucun clavier ne s'ouvre jamais.**

### `card.roulage`

`surface.raised`, biseau 4 px, filet `rule` 2 px. Circuit en **Émotion**, date et groupe en
HUD 12 px `ink.dim`, meilleur tour en HUD 24 px.

### `gauge.wear` — la jauge d'usure

Barre segmentée de 12 px. **La complétude est accolée à la valeur, dans le même bloc visuel, en
texte 14 px** — jamais derrière une interaction, jamais en pied de page.

Il n'existe **aucune version de ce composant sans sa complétude.** C'est une règle de sécurité
avant d'être une règle de design.

### `meter.credits` — le budget de saison

Un **compteur de crédits d'arcade** : segments de 8 px qui se consomment de gauche à droite.
`sky.miami` pour le consommé, `rule` pour le restant.

**Le coût au tour est un score qui descend**, en HUD 64 px, et il **ne s'affiche jamais sans ce
compteur dans le même bloc.** Voir [`EXPERIENCE.md`](EXPERIENCE.md) § State Patterns.

### `chip.category` — les trois catégories d'intervention

Entretien, amélioration, réparation non vitale. **Trois traitements visuellement distincts et
jamais mélangés dans une même liste** — filet plein, filet pointillé, filet fin. La séparation
est structurelle : voir FR-46.

---

## Do's and Don'ts

| ✅ | ❌ |
|---|---|
| Le violet s'allume **sur un record** | Le violet comme couleur de marque partout |
| L'écart porte son **signe** et sa couleur | L'écart porte seulement sa couleur |
| « Meilleur tour battu de 1"8 » | « Bravo ! Tu as gagné un trophée » |
| « Premier roulage à Lédenon » | « Débloqué : Baptême du feu ⭐ » |
| Biseaux pixel 4 px | `box-shadow`, `blur`, coins arrondis |
| Scanlines sur le sol et l'image de partage | Scanlines derrière un carnet d'entretien |
| Icônes tracées, grille de 4 | Emoji en guise d'icônes |
| `LEDENON` en HUD | `Lédenon` en HUD (la fonte n'a pas l'accent) |
| « Lédenon » en texte lisible | « LEDENON » en texte lisible |
| La jauge d'usure avec sa complétude | La jauge d'usure seule, « pour gagner de la place » |
| Le coût au tour contre le compteur de crédits | Le coût au tour seul, même sur l'image de partage |
| La corvée a la même peau que le plaisir | Un carnet d'entretien plus terne que les chronos |
| Le pixel comme accent | Le pixel comme texture générale |
| Un cap se constate après coup | Une barre de progression vers un cap |
| Aucun drapeau à damier | Un damier « parce que c'est le sport auto » |
