---
title: "EXPERIENCE — MyPaddock"
status: draft
created: 2026-08-18
updated: 2026-08-18
sources:
  - ../../prds/prd-MyPaddock-2026-08-18/prd.md
  - ../../research/academic-lit-coherence-cognitive-du-produit-2026-08-18/research.md
  - ../../../design/DIRECTION.md
---

# EXPERIENCE — MyPaddock

Comment le produit **fonctionne**. [`DESIGN.md`](DESIGN.md) dit comment il **regarde** ; les tokens
y sont référencés par nom, `{colors.record}`. **Les deux épines gagnent sur toute maquette.**

Le vocabulaire est celui du glossaire du PRD, **mot pour mot** : Roulage, Session, Circuit,
Organisateur, Groupe, Niveau, Meilleur tour, Machine, Geste, Cap franchi, Récapitulatif, Gabarit,
Dépense, Coût au tour, Budget de saison, Intervention, Horloge d'usure, Complétude, Cercle.

---

## Foundation

**Une seule surface : le téléphone, en portrait, installé sur l'écran d'accueil.** Pas de tablette,
pas de bureau, pas de mode paysage. Le PRD exclut l'application native ; c'est une PWA.

**Aucun système d'interface tiers.** Pas de shadcn, pas de Material, pas d'UIKit. Les composants
sont propres au produit et définis dans [`DESIGN.md`](DESIGN.md) § Components — un système
générique casserait la peau Attract Mode dès le premier bouton.

### Le contexte est hostile, et il commande tout

Trois contraintes qui ne se négocient pas, parce qu'elles décrivent le lieu réel de la saisie.

**Les gants.** La saisie a lieu au paddock, entre deux passages, gants aux mains. Conséquence :
cibles ≥ 56 px, action primaire 72 px pleine largeur, **sélecteurs plutôt que clavier**, et jamais
deux cibles adjacentes qui font des choses différentes.

**Le soleil.** Plein soleil sur un écran de téléphone. Conséquence : contraste élevé partout,
16 px minimum pour le texte courant, **aucune texture derrière du texte**, et aucune information
portée par une nuance subtile.

**L'oubli.** Onze ouvertures par an, avec un creux de plusieurs mois. Conséquence : **chaque écran
est compréhensible sans mémoire de la fois d'avant.** Aucun parcours ne suppose qu'on se souvienne
d'un geste appris, aucun geste caché (pas de balayage secret, pas d'appui long comme seul chemin),
et le libellé dit ce que fait le bouton plutôt que de nommer un concept interne.

> Sur quoi cette troisième contrainte repose : la décroissance des compétences avec le non-usage est
> établie (0,08 σ/mois, demi-vie ≈ 6,5 mois sur 1 344 tailles d'effet), **mais sur des compétences à
> composante motrice** — pas sur des modèles mentaux d'interface. La direction du risque est
> sourcée ; **son ampleur ici est inconnue** `[ASSUMPTION]`. On conçoit prudemment sans prétendre
> mesurer.

---

## Information Architecture

**Cinq destinations, pas une de plus.** Barre de navigation basse, cinq onglets, toujours visible.
Le PRD compte quatorze domaines ; ils ne produisent pas quatorze onglets — ils se rangent dans cinq
lieux que le pilote reconnaît.

| Onglet | Ce qu'on y trouve | Domaines PRD | Noyau déc. 2026 |
|---|---|---|---|
| **Accueil** | Ce qui est le plus proche dans le temps | §4.3 | ✅ complet |
| **Roulages** | La liste, et le détail d'un roulage : sessions, chrono, coût, photos, gestes | §4.2 · 4.4 · 4.5 · 4.6 · 4.7 | ✅ complet |
| **Machine** | Le garage, l'entretien, les réparations, le carnet | §4.1 · 4.10 · 4.11 | ⬜ mouvement 2 |
| **Saison** | Le bilan, le budget, les événements visés | §4.13 | ⬜ mouvement 3 |
| **Cercle** | Les potes, la comparaison à circuit égal | §4.9 | ⬜ mouvement 3 |

**Au noyau de décembre, trois onglets sur cinq sont vides.** Ils ne s'affichent pas.
La barre en montre deux — Accueil et Roulages — et grandit à mesure que les mouvements arrivent.
**Un onglet vide ne sous-délivre pas, il signale l'abandon** ; on ne montre pas la place réservée.

**Deux surfaces n'ont pas d'onglet, et c'est voulu.** Le **récapitulatif** est une sortie, pas un
lieu : il apparaît à la fin d'une saisie et se partage. Le **carnet partagé** est une page web
lisible sans compte, servie par lien — l'acheteur d'occasion n'installe rien.

**Fermeture.** Chaque besoin énoncé au PRD atterrit sur une surface, et chaque surface est atteinte
par au moins un parcours des Key Flows. Deux besoins n'ont pas encore de surface et sont notés
comme tels : la **checklist de chargement** (§4.12, se rangera dans le détail d'un roulage à venir)
et la **conformité organisateur** (même écran). Livrés au mouvement 3 `[ASSUMPTION]`.

---

## Voice and Tone

**Le produit énonce ce qui s'est passé. Il ne décerne jamais.**

Ce n'est pas une préférence de style. C'est le seul point sur lequel les deux camps du débat sur
les récompenses convergent : le feedback verbal positif augmente la motivation intrinsèque
(d = +0,33 de part et d'autre) là où les récompenses tangibles la divisent depuis vingt-cinq ans.

| ✅ Énoncer | ❌ Décerner |
|---|---|
| « Meilleur tour battu de 1"8 » | « Bravo ! Tu as gagné un trophée » |
| « Premier roulage à Lédenon » | « Débloqué : Baptême du feu ⭐ » |
| « Genou gauche posé » | « +50 points de symétrie » |
| « 3,04 € le tour · 2 840 € sur 5 500 » | « Nouveau record ! 🔥 » |
| « 7 roulages saisis sur 9 » | « Complète ton profil à 78 % ! » |

**Le test du libellé factuel**, applicable ligne par ligne à la relecture, et c'est un critère
d'acceptation — un libellé qui y échoue est un défaut, au même titre qu'un calcul faux :

- ✅ « Prochain roulage dans 23 jours » — **un fait**
- ❌ « Il te reste 23 jours pour préparer ta moto » — **une échéance déguisée**
- ✅ « Des plaquettes avant t'attendent au garage » — un fait
- ❌ « N'oublie pas de monter tes plaquettes ! » — une injonction

**Deuxième personne, présent, phrases courtes.** Pas de point d'exclamation. Pas d'emoji dans
l'interface. Pas de « oups », pas de « désolé ». Une erreur dit ce qui s'est passé et ce qu'on peut
faire : « La photo n'est pas partie. Elle est gardée, elle repartira au réseau. »

**Vocabulaire de pratiquant.** Roulage. Groupe Rouge. Meilleur tour. Session. Jamais « trackday »,
jamais « performance », jamais « objectif ».

---

## Ce que l'interface n'a pas le droit de faire

Huit interdictions du PRD, traduites en règles d'écran. Ce sont des **critères de rejet** : une
maquette qui en viole une est refusée, quelle que soit sa qualité par ailleurs.

**1. Aucun écran ne conseille mécaniquement.** L'entretien affiche **où en est la machine**, jamais
ce qu'il faut faire. « Liquide de frein — 7 roulages sur 9 saisis » et non « Vidangez votre liquide
de frein ». Aucun bouton ne s'appelle « Que dois-je faire ? ».

**2. La jauge d'usure n'existe pas sans sa complétude.** Dans le même bloc visuel, jamais derrière
un appui, jamais en pied de page, jamais « masqué pour gagner de la place ». Le composant n'a pas
de variante nue.

**3. Le coût au tour n'apparaît jamais sans le budget consommé** — à l'écran **et sur l'image de
partage**. Si le pilote masque le budget dans un gabarit, **le coût au tour se masque avec lui**.
Le masquage ne peut pas produire une image interdite.

**4. Aucun compteur ne se remet à zéro, aucun état acquis ne redescend, aucun cap ne s'annonce.**
Pas de série, pas de compte à rebours, pas de barre de progression vers un cap, pas de
« plus que 2 pour débloquer ». **Un cap se constate après coup, il ne se vise pas.**

**5. Le coefficient d'usure n'est jamais affiché comme une constante.** Aucun écran ne montre
« × 1,4 pour le groupe Rouge ».

**6. Toute ligne de conformité porte sa source et sa date.** « Publié par l'organisateur le
12 mars 2026 ». Une fiche de plus de douze mois affiche son âge. Aucun écran ne dit « conforme ».

**7. Le carnet partagé porte, en premier plan, qu'il est auto-déclaré et sa complétude.** C'est la
seule sortie du produit lue par quelqu'un qui n'a pas saisi les données, et sur laquelle un
inconnu décide d'un achat. Ni pied de page, ni astérisque.

**8. La visibilité du chrono est un interrupteur par roulage, masqué par défaut sur un compte
neuf.** Un pilote invisible apparaît dans le Cercle **sans son chrono**, jamais en creux, jamais en
dernier, jamais grisé.

**Et une neuvième, née de la recherche du 18 août.** **Un cap de bravoure ne se partage jamais
automatiquement au Cercle.** Coude au sol, genou posé côté faible : célébrés pour soi, partagés sur
décision explicite. Le mécanisme est établi — la présence de pairs augmente la prise de risque en
augmentant la sensibilité à la récompense du choix risqué, et le signe s'inverse pour une audience
passive. **Le danger n'est pas dans le catalogue, il est dans la conjonction du catalogue et du
Cercle.**

---

## Component Patterns

Comportements. Les spécifications visuelles sont dans [`DESIGN.md`](DESIGN.md) § Components.

### Le sélecteur de chrono

Trois molettes — minutes, secondes, dixièmes. Balayage vertical ou appui sur les zones haute et
basse de chaque molette (les deux marchent, parce qu'avec des gants le balayage rate). **Aucun
clavier ne s'ouvre jamais.** Position d'ouverture : le meilleur tour du pilote sur ce circuit s'il
existe, sinon `1'00"0`. Validation par le bouton primaire, jamais par un geste.

### Le bouton primaire

Un seul par écran, en bas, pleine largeur, `{spacing.touch.primary}`. Il porte un **verbe et un
objet** : « Saisir la session », « Ajouter une dépense ». Jamais « OK », « Valider », « Continuer ».
Pendant un traitement il reste appuyé et son libellé passe au participe : « Enregistré ».

### La ligne d'horloge d'usure

Trois éléments **indissociables** sur une ligne : le poste, la jauge, la complétude. Aucun n'est
optionnel. Au-delà de l'échéance, la jauge passe `{colors.caution}` **et** la ligne porte le mot
« dépassée » — la couleur n'est jamais seule à porter l'information.

### Les trois catégories d'intervention

Entretien, amélioration, réparation non vitale : **trois listes séparées, jamais fusionnées, jamais
un filtre sur une liste commune.** Séparation structurelle, pas visuelle — si « plaquettes en fin
de vie » peut apparaître à côté de « sticker décollé », l'élément de sécurité hérite du caractère
repoussable du cosmétique.

### Le compteur de crédits

Le budget de saison en segments qui se consomment. **Il accompagne le coût au tour partout où ce
dernier apparaît**, dans le même bloc. Tant que le budget n'est pas déclaré, le coût au tour ne
s'affiche pas — seul le coût de la journée, qui ne porte pas la même perversité.

### La carte de roulage

Circuit en Émotion, date et groupe en HUD, meilleur tour en gros. Un appui ouvre le détail. Aucun
balayage n'y supprime quoi que ce soit — avec des gants, un balayage destructeur se déclenche seul.

---

## State Patterns

| État | Ce que le pilote voit | Règle |
|---|---|---|
| **Vide, jamais vide** | L'accueil sans source affiche le dernier roulage et son meilleur tour | Un écran vide signale l'abandon. Il n'existe aucun écran vide dans ce produit. |
| **Premier jour** | Une seule action : « Saisir mon premier roulage » | Pas de cadres en attente, pas de squelette de graphique, pas de tutoriel |
| **Chargement** | Il n'y en a pas au noyau | Tout est local. Un indicateur de chargement au paddock est un aveu. |
| **Hors ligne** | Rien ne change | Aucun bandeau, aucune icône barrée, aucune dégradation visible. Voir § Continuité. |
| **Synchronisation en attente** | Un liseré discret sur la carte concernée | Jamais une modale, jamais un blocage |
| **Erreur** | Ce qui s'est passé + ce qui est gardé + ce qui va se passer | « La photo n'est pas partie. Elle est gardée, elle repartira au réseau. » |
| **Saison incomplète** | Le bilan énonce sa complétude | « 11 roulages saisis, 2 sans chrono » plutôt que des moyennes fausses |
| **Doublon de session** | Deux choix explicites | « Remplacer le meilleur tour » ou « Ajouter une session ». **Jamais d'écrasement silencieux.** |
| **Budget non déclaré** | Coût de la journée seul | Le coût au tour attend le budget. Pas de zéro, pas de tiret. |
| **Record** | `{colors.record}` s'allume, avec le signe | Le seul moment où le violet apparaît |

---

## Continuité et hors ligne

**La promesse est la continuité, et le mode de panne à craindre n'est pas le paddock — c'est mars.**

**Le compte a une sauvegarde serveur** : c'est la réponse de fond. Le stockage local n'est pas la
source de vérité de la saison, c'est un cache de travail et le tampon du hors-ligne.

**La fenêtre à protéger est la journée elle-même** — de la saisie au paddock au retour du réseau.
Des heures, pas des mois. Et c'est précisément le contenu saisi par plaisir : le chrono, les photos,
le geste.

Conséquences d'expérience :

- **Rien ne signale l'absence de réseau.** Pas de bandeau, pas d'icône. Le produit se comporte
  pareil ; c'est la promesse.
- **La synchronisation part au premier réseau disponible**, pas à la prochaine ouverture. Rien ne
  s'exécute pendant que l'application est fermée sur iOS — donc au retour au premier plan et au
  retour de connectivité.
- **La désinstallation est destructrice pour le local.** Ce qui n'était pas synchronisé est perdu et
  irrécupérable. Ce n'est pas un message d'avertissement à afficher — c'est une raison de
  synchroniser tôt.
- **Un état de persistance visible.** Si le navigateur refuse le stockage persistant, le pilote doit
  pouvoir le savoir — un état dans les réglages, pas une alerte anxiogène. La promesse de
  continuité n'est pas tenue et il a le droit de le savoir.

---

## Interaction Primitives

| Geste | Usage | Interdit |
|---|---|---|
| **Appui** | Tout. C'est la primitive par défaut, gants compris. | — |
| **Balayage vertical** | Molettes du sélecteur, défilement | Jamais destructeur |
| **Balayage horizontal** | Choix de gabarit sur le récapitulatif | Jamais pour supprimer |
| **Appui long** | Rien d'essentiel. Raccourci facultatif au plus. | Jamais l'unique chemin vers une action |
| **Pincement** | Rien | — |
| **Secousse, inclinaison** | Rien | — |

**Aucune action destructrice n'est à un seul geste.** Supprimer un roulage demande une confirmation
qui nomme ce qui disparaît : « Supprimer le roulage de Lédenon du 12 mai, ses 6 sessions et ses
4 photos ? »

**Retour haptique** sur validation d'un chrono et sur un record — les seuls moments où il vaut
quelque chose. Avec des gants, le retour visuel seul est faible.

**Mouvement.** Court, mécanique, sans rebond : 120 ms sur un changement d'état, 240 ms sur une
transition d'écran, courbes linéaires ou à paliers — pas d'`ease-out` moelleux, ça contredit la
peau. **`prefers-reduced-motion` supprime tout**, y compris le scintillement du sol et les
scanlines animées.

---

## Accessibility Floor

**Contraste.** AA minimum partout. `{colors.record}` échoue en petit texte (4,1:1) : réservé aux
tracés, remplissages et chiffres ≥ 24 px ; `{colors.record.light}` pour tout petit texte violet.

**La couleur n'est jamais seule.** Un écart porte **toujours son signe** — `−1"8`, `+0"4`. Une
échéance dépassée porte **le mot** « dépassée ». Une catégorie d'intervention se distingue par sa
liste et son filet, pas seulement par sa teinte. `{colors.personal.best}` et `{colors.slower}` sont
indistinguables en deutéranopie : sans le signe, l'information est perdue pour une partie des
pilotes.

**Cibles** ≥ 56 px, espacées d'au moins 8 px. Voir la réserve de [`DESIGN.md`](DESIGN.md) : ces
valeurs ne s'adossent à aucune littérature pour la saisie gantée.

**Texte** ≥ 16 px pour le courant, jamais de texte en HUD au-delà de quatre mots, respect du
grossissement système jusqu'à 200 % sans perte de fonction.

**Focus clavier visible** — contour `{colors.rule.bright}` de 2 px, jamais supprimé. Ordre de
tabulation identique à l'ordre visuel.

**Rôles et libellés.** Chaque bouton icône porte un libellé accessible. Le sélecteur de chrono est
un groupe de trois champs annoncés (« minutes », « secondes », « dixièmes »), pas un bloc opaque.
Les chiffres HUD sans accent (`LEDENON`) portent un libellé accessible accentué (« Lédenon »),
sinon un lecteur d'écran prononce faux.

**`prefers-reduced-motion`** supprime les animations et les effets de sol.

---

## Key Flows

Les six parcours du PRD, repris **avec leurs noms et leurs protagonistes**.

### UJ-1 — Julian saisit son roulage au paddock, entre deux sessions

1. Ouvre l'application. L'accueil montre le roulage du jour, déjà créé jeudi, et **un bouton
   pleine largeur : « Saisir la session »**.
2. Trois molettes. `1'47"3`. Aucun clavier.
3. **Retour immédiat, sans réseau** : le meilleur tour du jour, l'écart avec sa dernière fois à
   Lédenon — `−1"8` en `{colors.personal.best}`, **avec le signe** — et le nombre de sessions.
4. Photo avec les potes. Versée au roulage en un appui.
5. Déclare le geste : **genou posé à gauche**. Rattache la photo comme preuve.
   `{colors.record}` s'allume.
6. **Climax** — le récapitulatif se compose **tout seul** et s'affiche : `LEDENON · 6 SESSIONS ·
   1'47"3 · −1"8 · GENOU GAUCHE POSÉ`. **Il ne l'a pas demandé.**
7. Il range le téléphone. La synchronisation partira au réseau, sur la route du retour. **Le coût
   n'est pas demandé maintenant.**

> **Cas limite** — une session déjà saisie ce jour-là : deux choix explicites, jamais d'écrasement.

### UJ-2 — Kévin ouvre l'application pour la première fois, et n'ouvre pas sur du vide

1. Compte en trois champs. Aucun tutoriel.
2. Sa machine : marque, modèle, année.
3. L'accueil montre **une seule action** : « Saisir mon premier roulage ». Pas de cadres en attente.
4. Il saisit le roulage du jour — circuit, groupe, meilleur tour, une photo.
5. **Climax** — le récapitulatif se compose **sur un seul roulage, sans courbe**. Il n'y a pas
   d'écart à montrer, alors il montre autre chose : `PREMIER ROULAGE À LÉDENON`. **Une première est
   un événement en soi**, et c'est la seule chose célébrable sans historique.
6. Sa courbe attend ses roulages, et **rien à l'écran ne le lui reproche**.

> **Cas limite** — Kévin est le plus lent du groupe. La visibilité de son chrono est un
> interrupteur, **masqué par défaut**. Il partage sa journée sans être classé.

### UJ-3 — Julian consigne ce que la journée a coûté

1. Le roulage de la veille. Une ligne **« Ce que ça a coûté »**, vide et visible — **jamais
   réclamée**.
2. Il photographie les reçus. Montant et catégorie pré-remplis ; **la correction manuelle prime**.
3. Les plaquettes sont marquées **pièce** : rattachées à la machine, l'entretien s'ouvre sans
   quitter l'écran.
4. **Climax** — `612 €`. Juste en dessous et **jamais seul** : `3,27 € le tour` contre le compteur
   de crédits, `2 840 € sur 5 500`.
5. Le meilleur coût au tour de la saison est à 0,14 € près. **Un chiffre qui descend est une
   victoire.**

### UJ-4 — Julian change ses plaquettes et le consigne au moment du geste

1. Onglet Machine, entretien. **Plaquettes avant** en tête, achetées, non montées.
2. Un appui sur « C'est fait aujourd'hui ». Date remplie, pièce rattachée, horloge repartie.
3. L'écran montre les autres postes **avec leur complétude** : « liquide de frein — 7 roulages
   saisis sur 9 ».
4. **Climax** — trois appuis, aucun formulaire. La corvée a été transportée par le fait que la
   pièce était déjà connue.

> **Cas limite** — aucune dépense ne correspond : l'intervention se saisit seule. **Consigner le
> geste ne dépend jamais d'avoir consigné l'argent.**

### UJ-5 — Julian prépare le roulage de dimanche, le jeudi soir

1. Crée le roulage : date, circuit, organisateur, machine, groupe, sessions prévues.
2. La **checklist de chargement** se compose depuis la machine, l'équipement et les règles publiées.
3. Chaque ligne de conformité **porte sa source et sa date**. Le système ne certifie pas
   l'admission.
4. Il coche au chargement du camion.
5. **Climax** — dimanche matin, rien n'a été oublié, et **UJ-1 démarre sur un roulage existant**,
   pas sur un formulaire vide.

### UJ-6 — Julian ouvre l'application un dimanche de janvier

1. **L'accueil n'a basculé dans aucun mode — il n'y a pas de mode.** Il ouvre sur ce qui est le plus
   proche dans le temps : des plaquettes achetées en décembre, jamais montées.
2. Un appui. Consigné.
3. Dessous : **sept réparations non vitales** — le levier tordu de septembre, photographié au
   paddock sans rien remplir. **Aucune échéance, aucun compte à rebours.**
4. Le train de pneus acheté la veille se rattache **à la machine**, pas à un roulage — et compte
   quand même au budget.
5. Il pose un **événement visé** pour juin : date approximative, coût estimé.
6. **Climax** — rien n'a été déclenché par le mois de janvier. Même écran, mêmes règles qu'un
   dimanche de mai. **Le produit a réagi à des états, pas à une date.**

---

## Responsive & Platform

**Portrait mobile uniquement.** Le paysage n'est pas supporté — le produit se tient à une main,
debout, avec des gants.

Largeurs de référence : **375 px** (iPhone SE / mini), **390 px** (référence), **430 px** (Max).
Le contenu large — carnet, liste de dépenses — défile dans son propre conteneur ; **le corps de la
page ne défile jamais horizontalement**.

**iOS et Android**, installée sur l'écran d'accueil. Pas de navigateur de bureau : la page
d'accueil web y invite à installer, le carnet partagé s'y lit normalement.

**Zone sûre** respectée en bas — la barre de navigation vit au-dessus de l'indicateur d'accueil.

**Thème.** Le produit est **volontairement mono-thème sombre** : Attract Mode est le produit, pas
une préférence. Aucun mode clair. Les couleurs sont peintes explicitement, jamais héritées du
système.

---

## Inspiration & Anti-patterns

**Références assumées** — Hang-On (Sega, 1985), Out Run (Sega, 1986), les tableaux de bord de
moto sportive, les compteurs de crédits d'arcade.

**Anti-patterns, et pourquoi.**

- **Les applications de fitness gamifiées** — badges, anneaux à fermer, séries. Interdits par les
  clauses ; et les chiffres qui circulent pour les justifier viennent de blogs d'éditeurs de
  gamification, dont aucun ne cite d'étude.
- **Le tableau de bord d'entreprise** — cartes grises, graphiques partout, densité sans hiérarchie.
  Un écran vide y est normal ; ici il signale l'abandon.
- **Le carnet d'entretien classique** — tableur amélioré. Le mode d'échec nommé par le porteur
  lui-même : *« si c'est juste un Excel amélioré avec une UI de merde, j'y crois pas et je
  désinstalle. »*
- **Le damier** — signe de marque interdit.
- **L'assistant conversationnel** — le produit ne conseille pas mécaniquement.
