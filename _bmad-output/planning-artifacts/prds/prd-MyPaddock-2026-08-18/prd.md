---
title: "PRD — MyPaddock, application de roulage moto"
status: final
created: 2026-08-18
updated: 2026-08-18
---

# PRD — MyPaddock

_Application de roulage moto. **MyPaddock est un nom de code de travail**, pas un nom public
arrêté : le nom exact est exploité par Oracle Red Bull Racing, et PaddockPro comme ThePaddock sont
déjà des produits de roulage. Julian détient le nom de domaine — **un domaine n'est pas une
marque.** QO-1 est **rouverte le 18 août 2026** et bloque toute exposition publique, campagne
payante comprise (§12.1)._

## 0. Objet du document

Ce PRD est écrit pour un lecteur unique qui porte tous les rôles — Julian est le PM, le
développeur, le designer et l'utilisateur numéro un — et pour les workflows aval qui le
consommeront : `bmad-ux`, `bmad-architecture`, `bmad-create-epics-and-stories`.

Il **ne reproduit pas le brief, il le convertit.** Le brief
([`brief.md`](../../briefs/brief-MyPaddock-2026-08-17/brief.md), 4 292 mots, durci par cinq
méthodes d'élicitation avancée) décide *pourquoi* et *quoi* ; ce document décide *ce que le
système doit faire*, en exigences qu'on peut tester et donc rater. Trois autres entrées le
nourrissent : l'[addendum](../../briefs/brief-MyPaddock-2026-08-17/addendum.md) (registre des
17 hypothèses, chaînes de second ordre, paysage concurrentiel, conformité), le
[memlog du brief](../../briefs/brief-MyPaddock-2026-08-17/.memlog.md) (31 décisions tracées), et
[`DIRECTION.md`](../../../design/DIRECTION.md) (direction de design verrouillée le 18 août 2026).

**Quatre entrées de plus, adoptées le 18 août 2026 après avoir été omises.** Elles existaient
avant ce PRD et n'y étaient pas citées ; leur omission a produit trois divergences, dont une erreur
factuelle sur le nom. Elles sont désormais des sources de premier rang :
la [recherche marché](../../research/market-mypaddock-track-france-2026-08-16/research.md)
(3 992 mots, 44 sources, neuf gates de décision, grille de monétisation, collision de marque), le
[PRFAQ](../../../planning-artifacts/prfaq-MyPaddock.md) (unit economics, moat, conditions NanoCorp),
l'[audit de viabilité](../../../planning-artifacts/viability-assessment-2026-08-16.md) (verdict
VÉRIFIER, protocole de validation, sept conditions avant tout essai réel), et la
[recherche user-voice](../../research/user-voice-apps-trackday-moto-2026-08-17/research.md) —
cette dernière déjà intégrée transitivement, le brief du 17 ayant été révisé sur elle.

**Structure.** Le §3 Glossaire ancre le vocabulaire : les parcours, les exigences et les métriques
l'emploient mot pour mot, sans synonyme. Le §4 groupe les exigences par domaine ; les FR sont
numérotées globalement (FR-1 à FR-61) pour rester stables si les domaines se réorganisent. Les
déductions non confirmées portent un tag `[ASSUMPTION]` en ligne et sont reprises au §13.

**Sur la longueur.** Le standard BMad pour un projet personnel est de deux pages. Ce PRD les
dépasse largement, comme le brief avait dépassé les siennes. L'écart est assumé et a une cause
nommable : quatorze domaines fonctionnels, trois clauses de sécurité issues d'une analyse de second
ordre, une contrainte de responsabilité sur la conformité organisateur, et un noyau daté à
décembre 2026 qui doit être découpable sans discussion. Le technique-comment est poussé en
[addendum](addendum.md).

---

## 1. Vision

Une application pour le pilote amateur qui fait des roulages moto, qui tient ensemble deux choses
que personne ne réunit : **ce qui fait plaisir** — les chronos, la progression, les photos, les
caps franchis, la comparaison avec les potes — et **ce qui est une corvée mais coûte cher quand on
ne le fait pas** : l'entretien, le budget réel de la saison, la traçabilité à la revente.

Le mécanisme est que **l'ennuyeux voyage avec le satisfaisant**. On saisit son meilleur tour par
plaisir ; le système en déduit un roulage de plus, donc une usure de plus. L'entretien se suit sans
que le mot entretien soit prononcé. Et quand la corvée doit apparaître en clair, elle apparaît sous
forme de fierté : « saison complète sans échéance dépassée » est un achievement, pas un rappel.

Le marché est coupé en deux et personne ne franchit la ligne. Les applications de performance et de
communauté — RaceChrono, Trakio, LapTrophy, Driver Nation — n'ont ni coût ni entretien. Les carnets
— MotoBook en tête — n'ont ni communauté, ni chronos. **La strate argent est le seul territoire
vide, et elle se trouve exactement à la jonction des deux moitiés occupées.** Les traqueurs de
dépenses moto existent et se vendent, mais tous raisonnent en kilomètres — une unité qui ne veut
rien dire en piste. Le coût à la journée et le coût au tour n'appartiennent à personne.

**Ce que ça donne dans la bouche d'un pilote**, parce qu'un produit qui ne se raconte pas en une
phrase ne se transmet pas : *« tu rentres ton meilleur tour, et le soir t'as une image à poster —
et sans rien faire de plus, ça sait où en est ta moto et ce que ta saison t'a coûté. »* Cette
phrase est un critère de conception : toute fonctionnalité qui ne peut pas y entrer sans l'allonger
doit justifier sa présence autrement.

Le projet est mené comme un bac à sable : le critère n'est pas le revenu mais l'utilité. Toute
décision de périmètre se tranche sur *de quoi ai-je besoin pour ma saison 2027*.

---

## 2. Utilisateur cible

### 2.1 Jobs to be done

**Fonctionnels**
- Savoir où en est la machine, en usure réelle et pas en kilomètres — parce que le danger n'apparaît
  pas avec le temps, il apparaît quand on progresse.
- Savoir ce que la saison coûte vraiment, sans tenir une comptabilité.
- Pouvoir montrer à un acheteur ce qui a été fait sur la machine, et ce qu'on a consigné soi-même.
- Retrouver son meilleur tour sur un circuit donné, la fois d'avant.

**Émotionnels**
- Voir sa progression avancer d'un point après chaque roulage.
- Consigner une fierté qui n'a aujourd'hui aucun endroit où aller — le premier coude au sol, le
  genou posé du côté faible.
- Ne pas s'ouvrir un dimanche soir sur un formulaire.

**Sociaux**
- Se comparer aux potes du groupe, sans être classé si on ne le veut pas.
- Poster quelque chose dont on est fier, sans que ce soit un travail de communication.

**Contextuels**
- Saisir au paddock, entre deux sessions, avec des gants, en plein soleil, sans réseau.
- Retrouver sa saison en mars, intacte, après quatre mois sans ouvrir l'application.

### 2.2 Non-utilisateurs (v1)

- **L'automobiliste de circuit.** Pas assez de recul, et le porteur n'en serait pas l'utilisateur.
- **L'organisateur de roulages.** Second marché délibérément mis de côté. L'application publie ce
  qu'un organisateur a publié ; elle ne lui vend rien et ne remplace pas son WhatsApp.
- **Le pilote de compétition licencié.** Il a déjà des chronos officiels, un mécanicien et un carnet
  imposé. Le produit ne lui apporte rien qu'il n'ait déjà.
- **L'acheteur d'occasion.** Il *lit* un carnet partagé, il n'a pas de compte. Voir FR-38.
- **La foule.** Place de marché, vérification d'annonce, logistique partagée, « qui roule
  aujourd'hui » : ces domaines attendent du monde, pas un budget. Un écran vide ne sous-délivre pas,
  il signale l'abandon.

### 2.3 Parcours

Six parcours, numérotés UJ-1 à UJ-6. Les exigences fonctionnelles y renvoient en ligne.

---

**UJ-1. Julian saisit son roulage au paddock, entre deux sessions.**

- **Contexte** — Julian, 11 roulages par saison, groupe Rouge. Circuit de Lédenon, un dimanche de
  mai. Il vient de sortir de la session de 11 h. Une heure avant la pause de midi.
- **État d'entrée** — application déjà installée sur l'écran d'accueil, session authentifiée depuis
  des mois. Aucun réseau dans le paddock. Gants encore aux mains, téléphone en plein soleil.
- **Déroulé**
  1. Ouvre l'application. L'accueil affiche le roulage du jour, déjà créé la veille (UJ-5), et un
     bouton unique en pleine largeur : **saisir la session**.
  2. Entre son meilleur tour au sélecteur — `1'47"3` — trois molettes, aucun clavier.
  3. L'écran de retour affiche immédiatement, sans réseau : **meilleur tour du jour**, l'écart avec
     son meilleur tour à Lédenon la fois d'avant (`−1"8`, en vert), et le nombre de sessions roulées.
  4. Prend une photo avec les potes devant la moto. La verse au roulage.
  5. Déclare le geste : **genou posé à gauche**. Rattache la photo comme preuve. L'achievement
     *symétrie* se débloque, en violet.
- **Climax** — le récapitulatif se génère tout seul et s'affiche : `LÉDENON · 6 sessions · meilleur
  tour 1'47"3 · −1"8 · genou gauche posé`. Julian n'a pas demandé à ce qu'il existe.
- **Résolution** — il range le téléphone et retourne en piste. La synchronisation partira toute
  seule quand le réseau reviendra sur la route du retour. Le coût de la journée sera saisi ce
  soir-là ou le lendemain (UJ-3) ; il n'est pas demandé maintenant.
- **Cas limite** — s'il a déjà saisi une session ce jour-là, le système propose *remplacer le
  meilleur tour* ou *ajouter une session*, jamais d'écraser en silence.

---

**UJ-2. Kévin ouvre l'application pour la première fois, et n'ouvre pas sur du vide.**

- **Contexte** — Kévin, un pote du groupe Rouge, installe l'application parce que Julian la lui a
  montrée au paddock. Il n'a pas d'audience à nourrir et le coût au tour ne l'intéresse pas.
- **État d'entrée** — jamais authentifié. Aucune donnée. Ce qui l'attire réellement : voir les temps
  de Julian et essayer de les battre.
- **Déroulé**
  1. Crée un compte. Trois champs, pas de tutoriel.
  2. Déclare sa machine : marque, modèle, année. Rien d'autre n'est obligatoire.
  3. L'accueil ne montre pas des cadres vides en attente. Il montre **une seule action** : *saisir
     mon premier roulage*.
  4. Saisit le roulage du jour même — circuit, groupe, meilleur tour, une photo.
  5. Le récapitulatif se génère sur **un seul roulage, sans courbe** — c'est exactement pour ce
     moment-là qu'il doit fonctionner à un point.
- **Climax** — Kévin a quelque chose à montrer dès le premier jour, sans dépendre de personne. La
  comparaison avec Julian s'allume en plus, pas à la place.
- **Résolution** — sa courbe attend ses roulages, mais rien à l'écran ne le lui reproche.
- **Cas limite** — Kévin est le plus lent du groupe. Au moment de saisir, la visibilité de son
  chrono est un interrupteur, **roulage par roulage**, réglé sur *masqué* par défaut pour un
  nouveau compte. Il partage sa journée sans être classé.

---

**UJ-3. Julian consigne ce que la journée a coûté.**

- **Contexte** — le lendemain du roulage, ou le soir même. Le porteur a une pile de reçus : engagement
  circuit 210 €, essence 74 €, péage, restaurant, un jeu de plaquettes acheté sur place.
- **État d'entrée** — le roulage existe déjà (UJ-1), réseau disponible.
- **Déroulé**
  1. Ouvre le roulage de la veille. Une ligne **ce que ça a coûté** est vide et visible.
  2. Photographie les reçus l'un après l'autre. L'OCR pré-remplit montant et catégorie ; Julian
     corrige ce qui est faux.
  3. Une dépense — les plaquettes — est marquée comme **pièce**, ce qui la rattache à la machine et
     ouvre la maintenance (UJ-4) sans quitter l'écran.
- **Climax** — le coût de la journée s'affiche : `612 €`. Juste en dessous, **jamais seul** : `3,27 €
  le tour` et `budget de saison : 2 840 € sur 5 500 consommés`. Le coût au tour n'apparaît nulle
  part sans le budget consommé à côté.
- **Résolution** — l'achievement *meilleur coût au tour de la saison* est à 0,14 € près. Un chiffre
  qui descend est devenu une victoire.
- **Cas limite** — si l'OCR se trompe de montant, la correction manuelle est à un tap et le montant
  saisi à la main prime toujours.

---

**UJ-4. Julian change ses plaquettes et le consigne au moment du geste.**

- **Contexte** — samedi matin dans le garage, les mains dans la moto. Le pire moment pour taper sur
  un téléphone, et le seul moment où la mémoire est juste.
- **État d'entrée** — la dépense « plaquettes » existe déjà (UJ-3), rattachée à la machine.
- **Déroulé**
  1. Ouvre la machine, section entretien. La ligne **plaquettes avant** est en tête, marquée comme
     achetées mais non montées.
  2. Un tap sur *c'est fait aujourd'hui*. La date se remplit, la pièce achetée se rattache, l'horloge
     d'usure des plaquettes se remet à zéro.
  3. L'écran indique où en sont les autres postes : `liquide de frein — 7 roulages saisis sur 9`.
     La complétude est affichée avec la valeur, toujours.
- **Climax** — rien de spectaculaire, et c'est le point : trois taps, pas de formulaire. La corvée a
  été transportée par le fait que la pièce était déjà connue.
- **Résolution** — en fin de saison, l'achievement *saison complète sans échéance dépassée* se
  débloque tout seul.
- **Cas limite** — si aucune dépense ne correspond, l'intervention se saisit seule et la dépense
  reste optionnelle. Consigner le geste ne dépend jamais d'avoir consigné l'argent.

---

**UJ-5. Julian prépare le roulage de dimanche, le jeudi soir.**

- **Contexte** — jeudi, canapé. Le roulage est réservé chez un organisateur dont les règles de
  contrôle technique ont changé cette année.
- **État d'entrée** — réseau disponible, l'organisateur a une fiche dans le système.
- **Déroulé**
  1. Crée le roulage : date, circuit, organisateur, groupe, nombre de sessions prévues.
  2. La **checklist de chargement** se compose à partir de la machine, de l'équipement déclaré, et
     des règles publiées par cet organisateur.
  3. Chaque ligne de conformité porte sa source et sa date : *« publié par l'organisateur le
     12 mars 2026 »*. Le système ne certifie pas l'admission.
  4. Coche au fur et à mesure du chargement du camion.
- **Climax** — dimanche matin, rien n'a été oublié, et l'application connaît déjà le roulage : au
  paddock, UJ-1 démarre sur un roulage existant et non sur un formulaire vide.
- **Résolution** — la checklist reste attachée au roulage comme trace.
- **Cas limite** — si la fiche organisateur date de plus de douze mois, la checklist affiche son
  âge et invite à vérifier auprès de l'organisateur. Elle ne se présente jamais comme à jour.

---

**UJ-6. Julian ouvre l'application un dimanche de janvier, sans avoir roulé depuis novembre.**

- **Contexte** — la dernière saison compte onze roulages. Il ne roulera pas avant mars. Mais c'est
  en ce moment que la moto bouge le plus : gros travaux, achats d'occasion moins chers, préparation
  pour l'année suivante.
- **État d'entrée** — deux mois sans ouvrir l'application. Aucun roulage n'est réservé, donc l'axe
  roulage n'a rien à dire.
- **Déroulé**
  1. L'accueil n'a basculé dans aucun mode — il n'y a pas de mode. Il ouvre sur **ce qui est le plus
     proche dans le temps** : un jeu de plaquettes acheté en décembre et jamais monté.
  2. Un tap sur *c'est fait aujourd'hui*. L'intervention se consigne, la pièce se rattache, l'horloge
     d'usure repart.
  3. Dessous, la liste de ce qui attend : **sept réparations non vitales** — le levier tordu de
     septembre, photographié au paddock sans rien remplir, deux stickers, un carénage marqué.
  4. Il consigne le train de pneus acheté la veille parce qu'il était moins cher. La dépense se
     rattache à **la machine**, pas à un roulage — et le budget de saison en tient compte quand même.
  5. Il pose un **événement visé** pour juin : date approximative, coût estimé. Ce n'est pas encore
     une réservation.
- **Climax** — rien de tout cela n'a été déclenché par le mois de janvier. Même écran, mêmes règles
  qu'un dimanche de mai : le produit a réagi à des **états**, pas à une date.
- **Résolution** — le bilan de la saison écoulée reste consultable à tout moment, et il énonce sa
  complétude plutôt que des moyennes fausses : *« 11 roulages saisis, 2 sans chrono »*.
- **Cas limite** — un pilote qui roule en janvier voit son roulage à venir en tête et l'axe machine
  en dessous. Aucune bascule, aucun réglage, aucune version hivernale du produit.

---

## 3. Glossaire

Les parcours, exigences et métriques emploient ces termes **mot pour mot**. Introduire un synonyme
ailleurs dans le document est une faute de discipline. Le vocabulaire est celui des pratiquants :
on dit **roulage**, jamais « trackday ».

| Terme | Définition |
|---|---|
| **Roulage** | Une journée de piste. L'unité de compte du produit. Porte une date, un Circuit, un Organisateur, un Groupe, des Sessions, un Coût de la journée, des Photos, des Gestes. Un Roulage appartient à une Saison. |
| **Session** | Une mise en piste à l'intérieur d'un Roulage, typiquement 15 à 20 minutes. Un Roulage en compte 5 à 8. Une Session peut être écourtée ou sautée, et le signaler change l'Horloge d'usure. |
| **Circuit** | Le tracé. Un Meilleur tour n'a de sens qu'à Circuit constant : toute comparaison de chrono se fait à Circuit égal. |
| **Organisateur** | L'entité qui vend et encadre le Roulage. Publie des règles de Conformité. Hors périmètre comme client (§9). |
| **Groupe** | Le niveau d'allure d'un Roulage. **Défini par l'Organisateur, en nombre comme en nom** : Pau-Arnos annonce 2 à 4 groupes selon la sortie, nommés Initiation / Intermédiaire / Confirmé / Expert. Blanc / Jaune / Rouge est **une convention répandue, pas la seule**. Ce que le produit conserve est le **rang du groupe sur l'échelle de son organisateur**, qui seul se compare d'une sortie à l'autre et seul alimente le Coefficient d'usure. |
| **Meilleur tour** | Le chrono le plus rapide d'un Roulage, saisi à la main par le pilote. Un seul par Roulage en v1. Pas de temps intermédiaire, donc pas de record par secteur. |
| **Niveau** | L'échelle d'allure **du produit**, stable d'un Organisateur à l'autre : **Débutant, Intermédiaire, Confirmé, Racer**. Le Groupe d'un Roulage s'y projette. Le Niveau **se constate, il ne se vise pas** (FR-6bis) : c'est la seule entrée stable du Coefficient d'usure, et le seul repère qu'un pilote reconnaît quand il change de circuit. |
| **Courbe de progression** | La suite des Meilleurs tours à Circuit constant, dans le temps. Un point par Roulage. Hors du Noyau de premier roulage. |
| **Machine** | La moto de piste. Porte marque, modèle, année, et un Équipement. Une Machine porte les Interventions, les Horloges d'usure, et l'historique transmis à la revente. |
| **Équipement** | Ce dont la Machine est munie et ce que le pilote porte — sliders, amortisseur réglable, type de pneus, combinaison, airbag. Filtre le Catalogue d'achievements et les Échéances (FR-3). |
| **Geste** | Un acte de pilotage remarquable **déclaré par le pilote** pour un Roulage — coude au sol, genou posé côté faible. Déclaratif. Une Photo peut y être rattachée comme preuve. Aucune reconnaissance automatique d'image en v1. |
| **Achievement** | Une entrée du Catalogue, débloquée par une condition — un Geste déclaré, ou une valeur dérivée de données déjà saisies. Libellé d'interface : « cap franchi ». |
| **Catalogue d'achievements** | L'ensemble des Achievements disponibles. C'est de la **donnée, pas du code** : on doit pouvoir en ajouter sans redéploiement. |
| **Photo** | Une image versée à un Roulage. Alimente l'Album de saison et peut servir de preuve à un Geste. |
| **Album de saison** | Les Photos d'une Saison, dans l'ordre des Roulages. |
| **Récapitulatif** | L'image composée et partageable produite depuis un Roulage ou une Saison. Se compose selon un Gabarit. Fonctionne sur **un seul Roulage, sans Courbe de progression**. |
| **Gabarit** | Une composition prédéfinie de Récapitulatif — *perf*, *budget*, *geste* — choisie en un tap (FR-33). |
| **Coût de la journée** | La somme des Dépenses rattachées à un Roulage. |
| **Dépense** | Une ligne d'argent : montant, date, catégorie, Roulage ou Machine de rattachement, justificatif optionnel. |
| **Coût au tour** | Coût de la journée divisé par le nombre de tours estimé. **Ne s'affiche jamais seul** : toujours accompagné du Budget de saison consommé (FR-21). |
| **Budget de saison** | L'enveloppe annuelle du pilote, à distribution irrégulière, jamais un montant mensuel constant. Référence porteur : 5 à 6 000 € par saison. |
| **Intervention** | Un acte consigné sur une Machine : quoi, quand, avec quelle Dépense éventuelle. Existe en **trois catégories qui ne se mélangent jamais dans une même liste** (FR-46) : Entretien, Amélioration, Réparation non vitale. |
| **Entretien** | L'Intervention qui touche à la sécurité et suit un Barème constructeur. Remet à zéro l'Horloge d'usure du poste concerné. Ne peut pas être repoussée. |
| **Amélioration** | L'Intervention qui **change la définition de la Machine** — cartographie, meilleur composant. La moto de mars n'est pas celle d'octobre. Peut faire repartir une Horloge d'usure sur un autre Barème. |
| **Réparation non vitale** | L'Intervention définie non par ce qu'elle répare mais par le fait qu'elle **peut attendre** — levier, plastiques, stickers. Ne touche pas à la sécurité, ne suit aucun Barème, se fait en bloc quand l'axe Machine domine. Le seul objet du produit qui se remplit pendant la Saison et se vide en dehors. |
| **Pièce achetée non montée** | Un état de première classe, pas une ligne de Dépense : quelque chose attend au garage. Source de l'Accueil temporel. |
| **Barème constructeur** | La transcription des préconisations d'entretien du fabricant. Transcrit, jamais interprété (§6.1). |
| **Horloge d'usure** | L'état d'un poste d'entretien, avancé par les Roulages saisis pondérés par le Coefficient d'usure. **Affiche toujours sa Complétude** (FR-40). |
| **Coefficient d'usure** | Le facteur qui traduit un Groupe en vitesse d'usure. **Paramètre à calibrer, jamais une constante affichée** — aucune source ne l'étaye à ce jour. |
| **Complétude** | La part des Roulages d'une Saison qui portent les données dont une Horloge d'usure dépend. Format : *« sur 7 roulages saisis sur 9 »*. |
| **Échéance** | Le seuil d'une Horloge d'usure issu du Barème constructeur, filtré par l'Équipement. |
| **Checklist de chargement** | La liste de ce qu'il faut emporter, composée depuis la Machine, l'Équipement et la Conformité organisateur. |
| **Conformité organisateur** | Les règles publiées par un Organisateur pour un Roulage. Porte toujours sa source et sa date. **Ne certifie pas l'admission** (§6.2). |
| **Cercle** | Les pilotes avec qui on se compare. Fermé, de l'ordre de quelques personnes. Pas un classement public. |
| **Visibilité du chrono** | Le choix, **Roulage par Roulage**, de rendre son Meilleur tour visible au Cercle. Masqué par défaut sur un compte neuf. |
| **Saison** | **État dérivé, jamais une plage de dates** : du premier au dernier Roulage saisi de l'année. Le **hors-saison** est tout le reste. Aucun réglage, aucune bascule ; se calcule sur des données déjà saisies et reste juste pour un pilote qui roule en janvier. Unité de budget et de bilan (FR-52). |
| **Accueil temporel** | L'accueil du produit. Il n'affiche pas un tableau de bord fixe mais **ce qui est le plus proche dans le temps** — un Roulage à venir, une Pièce achetée non montée, un Coût non saisi. Tout libellé y énonce un fait, jamais une échéance (FR-13). |
| **Événement visé** | Un Roulage désiré mais pas encore réservé : date approximative, coût estimé. Alimente le budget prévisionnel et donne à l'Accueil temporel de quoi parler quand rien n'est réservé. |
| ~~Mode hors-saison~~ | **Terme supprimé le 18 août 2026.** Le domaine est absorbé par l'axe Machine, pas reporté : s'il existe deux unités de compte, l'hiver n'est plus un trou mais la période où l'axe Machine domine. Un mode déclenché par une date serait faux pour un pilote qui roule toute l'année. Voir §9. |
| **Noyau de premier roulage** | Le sous-ensemble à livrer pour le **1er décembre 2026** (§10.1). |
| **Instrument de bord** | Une mesure du projet lui-même, pas du pilote : Délai de saisie, et Récapitulatifs générés contre postés (§4.13). |
| **Délai de saisie** | Le temps écoulé entre la date d'un Roulage et sa saisie. Instrument de bord n°1. |

---

## 4. Périmètre fonctionnel

Quatorze domaines. Le critère de sélection est hérité du brief et n'a pas bougé : **un domaine
entre en v1 s'il a du contenu dès le premier jour, avec un seul utilisateur.** La version
précédente du produit est morte avec douze domaines dont la moitié affichaient du vide.

Le périmètre du brief en comptait dix. La session de résolution de problème du 18 août en a
ajouté quatre et supprimé un :

| Mouvement | Domaine | Pourquoi |
|---|---|---|
| **+** | L'accueil temporel (§4.3) | Un produit ouvert onze fois par an ne se retient pas ; il doit fabriquer ses propres occasions d'ouverture. |
| **+** | La machine comme axe de premier rang (§4.1) | Bricoler est l'activité déclarée entre deux roulages, et c'est une activité de machine. |
| **+** | La réparation non vitale (§4.11) | Une troisième catégorie d'intervention, définie par le fait qu'elle peut attendre. |
| **+** | Saison dérivée et projection (§4.13) | Il faut savoir ce qu'une saison contient pour la totaliser — sans jamais regarder le calendrier. |
| **−** | Le mode hors-saison | Absorbé, pas reporté. Deux unités de compte suffisent ; un mode déclenché par une date serait faux pour un pilote qui roule en janvier. |

**Deux règles gouvernent tout le §4** et se vérifient exigence par exigence.

> **R1 — Le schéma porte deux axes.** Le roulage et la machine sont deux unités de compte de
> premier rang. C'est la seule décision de ce document dont le coût explose si elle est différée :
> un axe ajouté après coup se paie en migration. Elle est arrêtée **avant la première ligne de
> code du noyau**, même si l'axe machine n'a presque aucun écran en décembre.
>
> **R2 — Aucun comportement n'est piloté par le calendrier.** Le produit réagit à des états — un
> roulage est-il à venir ? un travail est-il en cours sur la machine ? — jamais à un mois de
> l'année.

Les exigences portent une numérotation globale et stable. Chacune est écrite pour être **testable
et donc ratable** ; quand la raison n'est pas évidente, elle est donnée en une ligne, parce qu'une
exigence dont on a perdu la raison finit par être négociée.

---

### 4.1 Socle — les deux axes, le compte, la machine

L'axe machine ouvre le périmètre alors qu'il n'a aucun écran au noyau. C'est délibéré : R1 est une
décision de modèle, et les décisions de modèle se prennent en tête de document.

**FR-1. Créer un compte en trois champs.** Aucun tutoriel, aucun assistant de configuration, aucune
étape d'installation. La seule déclaration qui suit est la machine. → UJ-2.

**FR-2. Le garage contient plusieurs véhicules.** Une machine se déclare en trois champs — marque,
modèle, année — et rien d'autre n'est obligatoire. Le garage est la norme, pas le cas limite :
**chaque roulage porte la machine qui a roulé ce jour-là**, et l'horloge d'usure, le carnet et les
versions (FR-4) sont par machine. Le budget de saison (FR-24), lui, **est celui du pilote** et non
d'une machine : c'est son enveloppe qui se consomme, quelle que soit la moto qui l'a dépensée. Le
coût par machine se dérive de ce rattachement sans être saisi.

**FR-3. Déclarer l'équipement de la machine et du pilote** — sliders, amortisseur réglable, type de
pneus, combinaison, airbag. **L'équipement filtre le catalogue d'achievements et les échéances** :
un achievement qui suppose un équipement absent ne s'affiche pas, une échéance qui porte sur un
poste absent n'existe pas. Le filtrage se dérive de données déjà saisies — il n'y a **aucun écran
de réglage** pour l'obtenir.

**FR-4. La machine porte des versions datées.** Une intervention peut changer la définition de la
machine — cartographie, composant amélioré — et pas seulement remettre un poste à neuf. Trois
conséquences, toutes exigibles : l'horloge d'usure d'un composant amélioré repart **sur un autre
barème** que celle d'un composant simplement remplacé ; le carnet de revente gagne son argument le
plus fort, parce qu'un acheteur veut savoir ce qui a été amélioré et pas seulement ce qui a été
entretenu ; et le système **consigne ce que le propriétaire déclare avoir monté, sans rien
certifier**.

**FR-5. Le modèle de données porte deux axes indépendants.** Un roulage sans machine renseignée et
une machine sans aucun roulage sont deux états valides. Aucune donnée de machine n'est atteignable
uniquement par un roulage, et réciproquement. Exigence de schéma : elle se vérifie sur le modèle,
avant tout écran.

---

### 4.2 Le roulage

**FR-6. Créer un roulage** — date, circuit, organisateur, machine, groupe, nombre de sessions
prévues. La date et le circuit suffisent à l'enregistrer ; tout le reste se complète après, y
compris des mois après.

**Le groupe se saisit sur l'échelle de son organisateur**, pas sur une échelle imposée par le
produit. Relevé sur place le 18 août 2026 : Pau-Arnos annonce **2 à 4 groupes selon la sortie**, et
son moto-club les nomme *Initiation / Intermédiaire / Confirmé / Expert* — pas Blanc / Jaune /
Rouge. Le produit enregistre le nom tel qu'affiché par l'organisateur, **et le rang** (2ᵉ groupe sur
4), parce que le nom ne se compare pas d'un organisateur à l'autre.

**FR-6bis. Le rang se projette sur le Niveau MyPaddock — Débutant, Intermédiaire, Confirmé,
Racer.** C'est l'échelle du produit, stable partout, et la seule entrée possible du coefficient
d'usure (FR-41). Elle donne aussi au pilote un repère qui survit au changement de circuit : « je
roule Confirmé » veut dire quelque chose, « je roule 3ᵉ groupe » ne veut rien dire hors contexte.

> **Le niveau se constate, il ne se vise pas.** C'est une clause de sécurité, pas une préférence de
> ton. Le produit peut **célébrer** un premier roulage dans un niveau plus haut — c'est un cap
> franchi, au même titre qu'un geste (FR-28), et ça s'est produit. Il ne peut **jamais** afficher ce
> qui reste à faire pour y accéder, ni proposer d'y monter, ni compter quoi que ce soit vers le
> niveau suivant. Un produit qui invite à rouler plus vite pour débloquer un palier reproduit
> exactement l'enchaînement qui a causé la chute fondatrice — et il le ferait avec l'autorité d'une
> application.

**FR-7. Un roulage se crée à l'avance ou le jour même**, et les deux chemins produisent le même
objet. Créé le jeudi soir (UJ-5), il est déjà là au paddock le dimanche ; créé au paddock, il ne
demande rien de plus.

**FR-8. Consigner les sessions.** Une session porte son rang dans la journée. La déclaration d'une
session **écourtée ou sautée** arrive **avec l'horloge d'usure qu'elle alimente** (FR-41), pas
avant : son unique consommateur n'existe pas au noyau, et une saisie sans contrepartie immédiate
est précisément ce que la règle de conception interdit. Au noyau, on compte les sessions, rien de
plus.

**FR-9. La journée a une structure connue, qui sert de défaut et non de vérité.** Briefing vers
8 h 30, roulage à 8 h 45, pause de 12 h à 14 h, fin vers 17 h 30 : c'est le **squelette de l'écran
du roulage**, et le produit ne le fait pas saisir. Mais il varie — Pau-Arnos annonce 8 h 30 → 12 h 30
puis 14 h → 18 h, en six séries de vingt minutes. Le squelette est donc un défaut affiché, jamais
une contrainte : un roulage qui n'y ressemble pas se saisit sans friction.

**FR-10. Le roulage est intégralement saisissable hors ligne**, sans exception et sans dégradation
visible : aucun champ, aucun calcul, aucun écran de ce domaine ne dépend du réseau. → UJ-1, NFR-7.

---

### 4.3 L'accueil temporel

Le mécanisme qui répond au vide entre deux roulages. Il ne demande rien : il **montre**. C'est ce
qui le place du côté du regard et non de la saisie, et donc ce qui le protège de la règle de coupe
inversée.

**FR-11. L'accueil ouvre sur ce qui est le plus proche dans le temps**, pas sur un tableau de bord
fixe. L'écran change sans que le pilote ait rien fait, parce que le temps a passé.

**FR-12. Les sources de l'accueil, par ordre de proximité.**

| Source | Exemple de contenu | Disponible au |
|---|---|---|
| Un roulage à venir | « prochain roulage dans 23 jours, à Lédenon, où ton meilleur tour est 1'47"3 » | **noyau déc. 2026** |
| Le dernier roulage | son meilleur tour, ses photos — et le coût, saisissable là, jamais réclamé | **noyau déc. 2026** |
| Une pièce achetée et non montée | « des plaquettes avant t'attendent au garage » | mouvement 2 |
| Des réparations non vitales en attente | « sept réparations en attente » | mouvement 2 |
| Un événement visé, pas encore réservé | « Bol d'Or, juin, ~600 € estimés » | mouvement 2 |
| Un anniversaire de geste | « il y a un an jour pour jour, ton premier coude au sol » | mouvement 2 |

Deux sources suffisent à faire changer l'écran au noyau. C'est le minimum et c'est assumé.

**Une source ne désigne jamais une saisie manquante.** La deuxième ligne du tableau a d'abord été
écrite « un roulage récent dont le coût n'est pas saisi » : factuel dans la forme, mais pointant une
corvée inachevée à chaque ouverture — une relance sans le vocabulaire d'une relance. Ce que
l'accueil montre est **le roulage**, qui vaut d'être regardé pour son chrono et ses photos ; le coût
s'y saisit sans jamais être réclamé. La règle générale : une source de l'accueil est quelque chose
qu'on a envie de voir, jamais quelque chose qu'on a oublié de faire.

**FR-13. Règle du libellé factuel.** Tout libellé de l'accueil énonce **un fait, jamais une échéance
ni une injonction**. Le test est binaire et se passe ligne par ligne à la relecture :

- ✅ *« Prochain roulage dans 23 jours »* — un fait.
- ❌ *« Il te reste 23 jours pour préparer ta moto »* — une échéance déguisée, interdite par la
  clause de sécurité n°4.

C'est un critère d'acceptation, pas une intention de ton. Un libellé qui échoue au test est un
défaut, au même titre qu'un calcul faux.

**Et la règle ne s'arrête pas à l'accueil : elle vaut pour tout le produit.** La recherche du
18 août a établi le seul point sur lequel les deux camps du débat sur les récompenses **convergent** :
le feedback verbal positif augmente la motivation intrinsèque (d = +0,33 de part et d'autre), là où
les récompenses tangibles divisent. Autrement dit, **un produit qui énonce ce qui s'est passé est du
côté soutenu ; un produit qui décerne est du côté contesté.** « Meilleur tour battu de 1"8 » plutôt
que « bravo, tu as gagné un trophée ». Cette règle était écrite pour un écran ; elle est en fait la
posture générale du produit, et le §8 la reprend comme règle de voix.

**FR-14. L'accueil n'affiche jamais du vide.** Quand aucune source n'a de contenu, il affiche le
dernier roulage et son meilleur tour. **Un écran vide ne sous-délivre pas, il signale l'abandon** —
c'est la règle qui a tué douze domaines au brief, et elle s'applique ici en premier.

**FR-15. L'accueil a deux zones, et une seule est réarrangeable.** En tête, **la zone temporelle**
appartient au système : c'est FR-11 qui décide, et le pilote n'y touche pas — sinon le mécanisme
qui fait exister le produit entre deux roulages devient un réglage, donc une chose que personne ne
configure. En dessous, **la zone des chiffres** appartient au pilote : il en choisit trois ou
quatre. La disposition par défaut de cette zone est **complète et utilisable telle quelle**, et le
réarrangement n'est jamais présenté comme une étape d'installation.

---

### 4.4 Chronos

**FR-16. Saisir le meilleur tour au sélecteur** — trois molettes, aucun clavier. Contexte de
saisie : gants aux mains, plein soleil, debout.

**FR-17. L'écart s'affiche immédiatement, hors ligne, à circuit constant** — l'écart avec le
meilleur tour précédent **sur ce circuit**. Vert pour un record personnel, jaune pour plus lent,
violet `#B026FF` pour un record. Une comparaison entre circuits différents n'est jamais proposée.

**FR-18. Un seul meilleur tour par roulage en v1 — mais le modèle n'en interdit pas plusieurs.** Pas
de temps intermédiaire ni de record par secteur : c'est une décision de périmètre, pas de schéma.
Et **tout chrono porte sa provenance** — saisi à la main, importé d'un chronomètre embarqué, ou
relevé par le chronométrage de l'organisateur. Un temps saisi à la main et un temps mesuré n'ont pas
la même précision ; le produit ne les présente jamais comme équivalents, par la même discipline qui
fait porter sa complétude à l'horloge d'usure et sa date à la conformité. → NFR-13.

**FR-19. La visibilité du chrono est un interrupteur, roulage par roulage**, réglé sur *masqué* par
défaut sur un compte neuf. Une comparaison imposée fait cesser la saisie de celui qui en a le plus
besoin. → UJ-2.

**FR-20. La courbe de progression** — un point par roulage, à circuit constant. **Délibérément hors
du noyau de décembre** : elle n'a pas encore les points pour dire quoi que ce soit, et c'est la
démonstration même que la récompense du produit est différée.

---

### 4.5 Le coût

Ce domaine s'ouvre sur sa contrainte plutôt que sur son objet, parce que la contrainte le gouverne
entièrement.

**FR-21. Le coût au tour ne s'affiche jamais seul.** Il est toujours accompagné du **budget de
saison consommé**, dans le même bloc visuel, sans interaction à faire pour révéler le second.
Isolé, le coût au tour récompense le fait de rouler plus — plus de tours font un tour moins cher —
et le produit célébrerait une victoire qui s'obtient en dépensant davantage.

**FR-22. Le coût de la journée** est la somme des dépenses rattachées à un roulage.

**FR-23. Une dépense se rattache à un roulage, à une machine, ou à la saison seule.** Les trois
rattachements sont de premier rang. Un train de pneus acheté en janvier parce qu'il est moins cher
n'a **aucune journée** à laquelle se rattacher — et sans ce troisième cas, la moitié du budget réel
échappe au suivi et **FR-21 devient inapplicable**, faute d'un budget de saison complet. → UJ-6.

Une dépense sans roulage se rattache à **la saison en cours si elle existe, sinon à la saison à
venir** — l'achat d'hiver prépare l'année suivante, ce qui est exactement sa raison d'être, et il
alimente le budget prévisionnel (FR-56) au lieu de tomber dans un intervalle sans propriétaire.
Sans cette règle, la dépense de janvier 2027 n'appartient à rien : la saison 2027 n'a pas encore
commencé au sens de FR-52, et c'est précisément la situation que mesure M6.
**Confirmé par Julian le 18 août 2026.**

**FR-24. Le budget de saison** est une enveloppe annuelle à distribution irrégulière, **jamais un
montant mensuel constant**. Référence porteur : 5 000 à 6 000 € par saison.

**Il se déclare au premier affichage d'un coût, en un champ, jamais à la création du compte** —
FR-1 interdit toute étape de configuration, et une enveloppe demandée avant le premier roulage est
une question à laquelle personne ne sait répondre. **Tant qu'il n'est pas déclaré, le coût au tour
ne s'affiche pas** : FR-21 s'applique strictement, sans exception de commodité. Le coût de la
journée (FR-22), lui, s'affiche seul sans difficulté — il ne porte pas la perversité que FR-21
neutralise.

**FR-25. Photographier un reçu pré-remplit montant et catégorie.** La correction manuelle est à un
tap et **prime toujours** sur la valeur reconnue. Le justificatif reste optionnel : l'absence ou
l'échec de la reconnaissance n'empêche jamais la saisie. → UJ-3, §7.

**FR-26. Une dépense marquée « pièce » se rattache à la machine et ouvre l'intervention** sans
quitter l'écran. C'est le pont par lequel l'argent transporte l'entretien.

**FR-27. Le budget est exportable par le pilote**, dans un format lisible sans l'application. →
NFR-6.

---

### 4.6 Gestes et achievements

**FR-28. Déclarer un geste** pour un roulage — coude au sol, genou posé côté faible. Purement
**déclaratif** : aucune reconnaissance automatique d'image en v1.

**FR-29. Rattacher une photo à un geste comme preuve.** Le rattachement n'est pas une condition : un
geste se déclare sans photo, et une photo se verse sans geste.

**FR-30. Le catalogue d'achievements est de la donnée, pas du code.** On doit pouvoir en ajouter un
sans redéploiement — c'est ce qui permet au catalogue de suivre la pratique plutôt que les sorties
de version.

**FR-31. Aucun état gagné ne se reperd, et aucun cap ne s'annonce.** Deux règles, et la recherche
académique du 18 août 2026 a montré que la première est meilleure que celle qu'elle remplace.

**a) Rien de punitif, rien d'irréparable.** Aucun achievement n'est à série ni à durée limitée —
mais la formulation utile est plus large : **aucun compteur ne se remet à zéro, aucun cap ne se
perd, aucun état acquis ne redescend.** Ce que la littérature établit sur les séries n'est pas que
la série nuit, c'est que **la mécanique punitive et non réparable nuit** : la rupture dégrade
l'engagement, l'auto-attribution de la rupture aggrave, et la réparabilité atténue. La règle ainsi
écrite couvre des choses que « pas de série » ne couvrait pas.

**b) Un cap se constate, il ne se vise pas.** Le produit peut **célébrer** un geste après qu'il a eu
lieu. Il ne peut **jamais** afficher ce qui reste à faire pour l'obtenir, ni le proposer, ni compter
vers lui. C'est la règle déjà écrite pour le Niveau (FR-6bis), et elle couvre **tout le catalogue**.
Fondement : le seul enseignement transposable de la littérature sur la mesure et le risque est que
**la direction de l'effet suit la direction de la métrique** — mesurer et récompenser la prudence
réduit les comportements risqués, et rien n'indique qu'une métrique récompensant un geste dangereux
réduise le danger.

Le catalogue équilibre bravoure et discipline. Récompenser le coude au sol pousse à aller le
chercher : c'est exactement l'enchaînement qui a causé la chute fondatrice. Libellé d'interface :
« cap franchi ».

---

### 4.7 Photos et album

**FR-32. Verser une photo à un roulage ; l'album de saison est la suite des photos dans l'ordre des
roulages.** Aucune saisie supplémentaire, aucun classement à faire. La photo est le seul geste du
produit qui ne coûte rien au pilote — c'est pourquoi elle alimente trois autres domaines : la preuve
d'un geste (FR-29), le récapitulatif (§4.8) et la réparation non vitale (FR-47).

---

### 4.8 Le récapitulatif

La vitrine du produit et **l'un de ses deux moteurs d'acquisition** — l'autre étant les campagnes
Meta payantes décidées le 18 août 2026 (§9). Il reste dans le noyau de décembre, avant l'entretien et
avant le budget prévisionnel, par application directe de la règle de coupe inversée : c'est le seul
des deux qui ne coûte rien et qui prouve quelque chose sur le produit lui-même.

**FR-33. Trois gabarits prédéfinis — *perf*, *budget*, *geste* — choisis en un tap.** Le choix de ce
que montre le récapitulatif existe, mais **pré-mâché** : le mode d'échec n'est pas la qualité de
l'image, c'est que poster demande de **décider**.

**FR-34. Le récapitulatif fonctionne sur un seul roulage, sans courbe de progression.** C'est la
condition du premier jour et de UJ-2 : une courbe à deux points ne récompense rien.

**Et il faut dire ce qu'il montre à la place de l'écart**, sans quoi FR-34 est une intention et pas
une exigence. Sur un premier roulage il n'y a pas de `−1"8` : le récapitulatif affiche alors le
circuit, le nombre de sessions, le meilleur tour, **et le fait que c'est un premier** — *« premier
roulage à Lédenon »*. Une première est un événement en soi, et c'est la seule chose que le produit
peut célébrer sans historique. C'est la version du récapitulatif la plus importante du produit,
puisque c'est la seule que verra quelqu'un qui vient d'installer.

**FR-35. Le pilote choisit ce que le récapitulatif montre.** Le coût est masquable, le chrono
aussi ; le masquage se règle à la composition, pas dans un écran de préférences. **Mais aucune
composition ne peut produire une image interdite** : le coût au tour n'apparaît jamais sur une
image sans le budget consommé (FR-21), ni par choix de gabarit ni par masquage. Masquer le budget
masque le coût au tour avec lui. C'est le mode d'échec nommé au §6, et il se ferme ici plutôt que
dans une revue de maquette.

**FR-36. Le récapitulatif se génère sans réseau, et s'affiche sans avoir été demandé** à la fin de
la saisie d'un roulage. → UJ-1.

**FR-37. Le partage ne dépend d'aucune cible nommée.** « Partager vers Instagram » **ne peut pas
être une exigence** : aucun chemin web documenté ne mène aux stories, et aucune API ne permet
d'énumérer les cibles disponibles. En conséquence : le produit propose *partager*, jamais *partager
vers X* ; l'annulation par l'utilisateur est silencieuse ; tout autre échec ouvre un chemin de
repli **visible** qui permet de récupérer l'image. → NFR-11.

---

### 4.9 Le cercle et le carnet

**FR-38. Le carnet de la machine se partage par lien, lisible sans compte.** L'acheteur d'occasion
lit, il ne s'inscrit pas. Le carnet porte **en clair, sur le document lui-même**, qu'il est
**auto-déclaré** : il atteste ce que le propriétaire a consigné, jamais un historique certifié par
un tiers. Cette mention n'est pas un pied de page, c'est une exigence de premier plan — **et elle le
devient davantage depuis que l'acquisition passe par la publicité** : un acheteur peut désormais
arriver sans connaître personne dans la chaîne, et sans aucun moyen de jauger ce que vaut ce qu'il
lit.

**Le carnet porte aussi sa complétude**, comme l'horloge d'usure (FR-40) : *« 11 roulages consignés,
2 sans chrono »*. C'est la sortie du produit qui a le plus de conséquences pour quelqu'un qui n'a
pas saisi les données — un acheteur décide d'un achat dessus — et c'est donc la dernière où un
chiffre a le droit de se présenter plus complet qu'il n'est.

**FR-39. Le cercle est fermé et de l'ordre de quelques personnes**, et compare à circuit égal. Ce
n'est pas un classement public, et il n'existe aucun classement global. Un pilote invisible (FR-19)
apparaît dans le cercle sans son chrono, jamais en creux ni en dernier.

**FR-39bis. Un cap de bravoure ne se partage jamais automatiquement au cercle.** Coude au sol, genou
posé côté faible : ces caps-là se célèbrent pour soi et se partagent **sur décision explicite**,
jamais par défaut. Un cap de discipline, lui, peut se partager comme le reste.

Raison, et c'est le mécanisme le mieux établi de toute la recherche académique du 18 août : **la
présence de pairs augmente la prise de risque en augmentant la sensibilité à la récompense du choix
risqué** — trois essais randomisés convergents, avec substrat neuro-imagé. Et le signe **s'inverse**
pour une audience passive. Un cap partagé à un cercle de potes relève du premier cas.

> **Le danger n'est pas dans le catalogue, il est dans la conjonction du catalogue et du cercle.**
> Ni l'un ni l'autre pris seul ne le décrit.

La littérature ne dit **pas** de quel côté tombe un partage *asynchrone* à un cercle fermé — ni
co-présence, ni audience anonyme. C'est une question ouverte (QR-1), et tant qu'elle l'est, la
prudence est du côté de la séparation.

---

### 4.10 Entretien et horloge d'usure

**FR-40. Toute horloge d'usure affiche sa complétude** — *« sur 7 roulages saisis sur 9 »* —
**partout où elle apparaît**, sans exception et sans repli derrière une interaction. L'horloge
hérite de la qualité d'une saisie faite par plaisir ; un chiffre adjacent à la sécurité ne peut pas
prétendre à une précision que sa source n'a pas.

**FR-41. L'horloge avance avec les roulages saisis, pondérés par le coefficient d'usure**, et non
avec les kilomètres. La pondération s'applique au **Niveau MyPaddock** (FR-6bis) et non au nom du
groupe : « Rouge » chez un organisateur et « Expert » chez un autre projettent sur le même niveau, et
le produit n'a pas à tenir une table de noms qui changerait à chaque nouvel organisateur. Une session écourtée ou sautée (FR-8) change l'avancement.

**FR-42. Le coefficient d'usure part à 1 pour tous les groupes, et se calibre sur les données
réelles.** Aucune source ne l'étaye à ce jour ; **partir à 1, c'est compter les roulages sans les
pondérer** — l'horloge fonctionne dès le premier jour, et la finesse arrive quand une saison de
données existe. Il est modifiable sans redéploiement, comme le catalogue d'achievements, et n'est
**jamais affiché comme une constante**.

**FR-43. Consigner une intervention au moment du geste** — un tap sur *c'est fait aujourd'hui*, la
date se remplit, la pièce achetée se rattache, l'horloge du poste repart. **Consigner le geste ne
dépend jamais d'avoir consigné l'argent** : si aucune dépense ne correspond, l'intervention se
saisit seule. → UJ-4.

**FR-44. Le barème constructeur est transcrit, jamais interprété.** Aucune sortie du produit ne
certifie la sécurité d'un véhicule ni la durée de vie restante d'une pièce. Le produit affiche où
en est la machine ; il ne dit pas ce qu'il faut faire.

**FR-45. La pièce achetée et non montée est un état de première classe**, pas une ligne de dépense
qu'on interprète. C'est une source de l'accueil temporel (FR-12) et le lien direct entre l'argent
et le garage.

---

### 4.11 La réparation non vitale

La troisième catégorie d'intervention, et la découverte la plus exploitable de la session du
18 août. Elle est définie non par ce qu'elle répare mais par le fait qu'elle **peut attendre** — et
qu'elle attend systématiquement.

| | Entretien | Amélioration | **Réparation non vitale** |
|---|---|---|---|
| Touche à la sécurité | oui | parfois | **non, par définition** |
| Suit un barème | oui | non | **non** |
| Peut être repoussée | non | oui | **oui, et elle l'est** |
| Quand elle se fait | dès l'échéance | quand le budget suit | **en bloc, hors saison** |

Quatre propriétés en font un objet à part entière et bon marché : c'est **la seule chose du produit
qui se remplit pendant la saison et se vide en dehors**, donc le seul objet qui relie les deux
unités de compte ; elle se remplit avec un geste déjà au périmètre, la photo ; elle donne à
l'accueil temporel de quoi parler quand rien n'est réservé ; et elle échappe à toutes les clauses de
sécurité, puisqu'il n'y a ni barème à transcrire ni échéance à faire courir.

**FR-46. Les trois catégories d'intervention ne cohabitent jamais dans une même liste.** Entretien,
amélioration et réparation non vitale sont séparés visuellement et structurellement, partout. Si
*« plaquettes en fin de vie »* s'affiche à côté de *« sticker décollé »*, l'élément de sécurité
**hérite du caractère repoussable du cosmétique**, et la liste des choses qui peuvent attendre finit
par contenir une chose qui ne peut pas. C'est exactement le mécanisme que les clauses de second
ordre ont été écrites pour attraper : un affichage plaisant qui, suivi d'un cran, dégrade la
sécurité.

**FR-47. Une réparation non vitale se crée depuis une photo**, au paddock, sans rien remplir
d'autre. Le levier tordu se photographie là où le téléphone est déjà en main, et devient une ligne.

**FR-48. La liste des réparations en attente est une source de l'accueil temporel**, et se solde en
bloc. Elle n'a **aucune échéance, aucun compteur à rebours et aucune relance** — son intérêt est
précisément qu'elle peut attendre.

---

### 4.12 Checklist de chargement et conformité organisateur

**FR-49. La checklist se compose depuis la machine, l'équipement et les règles publiées par
l'organisateur.** Elle se coche au fur et à mesure du chargement et reste attachée au roulage comme
trace. → UJ-5.

**FR-50. Chaque ligne de conformité porte sa source et sa date** — *« publié par l'organisateur le
12 mars 2026 »*. **Le système ne certifie pas l'admission** : il rapporte ce qu'un organisateur a
publié.

**FR-51. Une fiche organisateur de plus de douze mois affiche son âge** et invite à vérifier auprès
de l'organisateur. Elle ne se présente jamais comme à jour.

---

### 4.13 Saison, bilan et projection

**FR-52. La saison est un état dérivé, pas une plage de dates.** Elle court du **premier au dernier
roulage saisi de l'année** ; le hors-saison est tout le reste. Aucun réglage, aucune bascule, aucune
étape d'installation. Un réglage de nommage reste possible pour qui veut découper autrement, mais
jamais comme condition de fonctionnement.

**FR-53. Aucun comportement du produit n'est piloté par le calendrier.** Exigence transverse,
vérifiable à la revue de code : aucune branche conditionnelle ne teste un mois de l'année. Le
produit teste des états — un roulage est-il à venir ? un travail est-il en cours ? — et rien
d'autre. Décembre est une fin pour le porteur et peut être un début pour quelqu'un d'autre.

**FR-54. Un événement visé est un objet léger** — date approximative, coût estimé — désiré avant
d'être réservé. Il alimente le budget prévisionnel et donne à l'accueil temporel quelque chose à
montrer quand rien n'est encore réservé, ce qui était la faiblesse nommée de ce mécanisme.

**FR-55. Le bilan énonce sa complétude** — *« 11 roulages saisis, 2 sans chrono »* — plutôt que de
présenter des moyennes fausses. Il est consultable à tout moment, pas seulement en fin de saison.

**FR-56. Le budget prévisionnel se propose à partir de ce que la saison écoulée a réellement
coûté**, et se corrige à la main. Ce n'est pas une prévision, c'est un report.

---

### 4.14 Instruments de bord

Ce ne sont pas des métriques produit, ce sont **les capteurs du projet lui-même**. Sans elles,
l'échec ne se constate qu'en octobre 2027, quand il est trop tard pour corriger la saison. Elles
sont des exigences fonctionnelles parce qu'elles doivent être **construites**, pas espérées.

**FR-57. Délai roulage → saisie.** Le temps écoulé entre la date d'un roulage et sa saisie. Seuil
d'alerte : **48 heures dépassées une seule fois** signalent que la sortie de route a commencé.

Cet instrument mesure la bonne chose, et la recherche du 18 août le confirme sur deux points.
D'abord, **« je le ferai ce soir » est le format d'intention qui échoue le plus** : une méta-analyse
de 93 comparaisons établit que les intentions à base temporelle réussissent nettement mieux à
intervalle court (g = 0,67). Ensuite — et c'est ce qui compte pour un produit qui s'interdit la
relance — **le rappel n'annule pas l'effet du délai** : dans un protocole comparant une condition
avec relance et une condition sans, la performance restait meilleure aux intervalles courts dans
**les deux**. Le levier n'est donc pas de rappeler le soir. **C'est de rendre la saisie possible au
paddock**, ce que fait déjà tout le §4.2.

**FR-58. Récapitulatifs générés contre récapitulatifs postés.** Un grand écart désigne le
déclencheur, pas l'image.

**FR-59. Ouvertures sans saisie.** Née de la session du 18 août : c'est la mesure directe de
l'accueil temporel. Une ouverture qui ne produit aucune saisie n'est pas un échec — c'est
exactement ce que le mécanisme cherche à provoquer.

**FR-60. Les trois instruments existent dans la première version livrée**, pas dans une version
ultérieure. **Ils remontent, de façon annoncée et minimale** : les trois mesures, rien d'autre,
aucune télémétrie tierce, aucun traceur publicitaire dans l'application elle-même. La version
« locale et privée au porteur » écrite plus tôt supposait un utilisateur unique ; l'acquisition
payante (§7) la rend inapplicable, puisqu'une mesure qui ne remonte pas ne mesure rien chez les
autres. Le pilote peut voir ce qui remonte et s'y opposer.

---

## 5. Exigences non fonctionnelles

Dix-huit exigences transverses. Les six premières viennent de la recherche technique du 18 août
([`research.md`](../../research/technical-pwa-hors-ligne-et-partage-2026-08-18/research.md),
52 sources) et **remplacent des croyances par des faits sourcés** — c'est le seul endroit de ce PRD
où une exigence a été écrite contre l'intuition initiale.

### 5.1 Continuité des données — le mode de panne principal

Le mode de panne à craindre n'est pas « pas de réseau au paddock », c'est **« j'ouvre en mars et ma
saison a disparu »**. Sur un produit dont la promesse est la continuité, c'est fatal.

**Le compte avec sauvegarde serveur est la réponse de fond, et il est acquis** (Julian, 18 août
2026). La conséquence est qu'il faut relire tout ce qui suit : le stockage local n'est **pas** la
source de vérité de la saison, c'est un cache travaillant et le tampon du hors-ligne. Ça ne rend pas
NFR-1 à NFR-6 inutiles — ça **rétrécit la fenêtre qu'elles protègent**, et il faut la nommer
précisément :

> **La fenêtre de vulnérabilité va de la saisie au paddock au retour du réseau.** Des heures, pas
> des mois. Pendant cette fenêtre, le meilleur tour, les photos et le geste de la journée n'existent
> **que** sur le téléphone — et c'est exactement le contenu que le produit ne peut pas se permettre
> de perdre, puisque c'est celui qui a été saisi par plaisir.

C'est une bonne nouvelle et elle change une priorité : la peur de mars est traitée par le compte,
et l'effort de robustesse se concentre sur la journée elle-même.

**NFR-1. Appeler `navigator.storage.persist()` à chaque ouverture, et exposer l'état au pilote.**
La croyance courante — « une PWA installée est exempte de la purge » — n'est documentée nulle part
par Apple. Ce qui protège réellement, et que WebKit documente, c'est que le stockage soit **en mode
persistant**. `persist()` est donc une **exigence, pas une optimisation**. Et si elle n'est pas
accordée, la promesse de continuité n'est pas tenue : le pilote doit pouvoir le savoir.

**NFR-2. Aucune donnée saisie n'existe uniquement sous forme de requête en attente.** La base locale
est la source de vérité ; la synchronisation est une réconciliation. Si une file de requêtes est
malgré tout utilisée, sa rétention est **fixée explicitement** : le défaut de sept jours des
bibliothèques courantes est très en deçà du cycle d'un produit ouvert onze fois par an.

**NFR-3. Rien ne repose sur une exécution en arrière-plan.** WebKit a refusé Background Sync et n'a
jamais implémenté Background Fetch — l'alternative qu'il recommande pourtant. Sur iOS, **rien ne
s'exécute pendant que l'application est fermée**, ni maintenant ni plus tard. La synchronisation se
déclenche à l'ouverture et au retour du réseau, pas autrement. Tout le §4 est conçu pour en être
immunisé : l'accueil temporel se calcule **à l'ouverture**.

**NFR-4. La désinstallation est traitée comme destructrice pour le local.** Aucune preuve publique
n'établit ce qui survit à la désinstallation d'une PWA — après deux tours de recherche, l'absence de
témoignage est elle-même le constat. On ne construit donc sur aucune hypothèse de survie **du
cache** : ce qui protège la saison est le compte, et la réinstallation doit reconstituer l'intégralité
des données depuis le serveur. Corollaire : **une désinstallation faite pendant la fenêtre de
vulnérabilité perd ce qui n'était pas encore synchronisé**, et c'est irrécupérable — raison de plus
pour que la synchronisation parte au premier réseau disponible et non à la prochaine ouverture.

**NFR-5. Ni `localStorage` pour les données métier** (plafond dur de 5 Mio), **ni Storage Buckets**
(absent de tous les Safari), **et les chiffres de `estimate()` ne sont jamais affichés comme des
mesures** — ils sont approximatifs par conception, pour empêcher le pistage.

**NFR-6. Le pilote peut récupérer ses données** dans un format lisible sans l'application. C'est le
dernier filet quand tous les autres cèdent.

### 5.2 Le paddock

Le brief avait choisi le paddock contre le dimanche soir par intuition de terrain. **La recherche du
18 août 2026 le valide, pour une raison qu'on ne pouvait pas deviner :** le stress aigu dégrade
l'encodage mnésique — 113 études, 6 216 participants — **sauf** quand le délai entre l'événement et
la saisie est très court **et** que ce qu'on saisit est directement lié à cet événement, auquel cas
il l'**améliore**. « Je note mon chrono trente secondes après être sorti de piste » **est** cette
configuration. Ce n'est pas la preuve que la saisie au paddock sera fidèle ; c'est une raison sourcée
de penser que c'est **le cas le moins défavorable**, et le corollaire est net : **plus la saisie
s'éloigne de la sortie de piste, plus elle quitte la fenêtre favorable.**

Détail utile pour ne pas raisonner de travers : **la magnitude de la réponse cortisolique n'est pas
reliée aux effets sur la mémoire.** « L'adrénaline » n'est pas un bon modèle de ce qui se passe, et
concevoir avec ce mot en tête mènerait à de mauvaises décisions.

**NFR-7. Le noyau fonctionne intégralement hors ligne**, sans dégradation visible et sans message
d'excuse.

**NFR-8. Cibles tactiles généreuses, sélecteurs plutôt que clavier.** Gants aux mains, debout, entre
deux sessions. **Le dimensionnement ne peut pas s'adosser à la littérature : il n'y en a pas.** Le
seul repère publié est un plancher **main nue** — 9,2 mm pour une cible isolée, 9,6 mm en série, au
pouce sur petit écran — issu d'une étude unique de 2006, sur du matériel d'époque. Sur la **saisie
gantée sur écran capacitif**, la recherche accessible ne renvoie **rien** : elle rabat
systématiquement sur la main nue. La cible gantée se règle donc **par essai sur appareil, avec de
vrais gants**, et se traite comme une inconnue — jamais comme un acquis.

**NFR-9. Lisible en plein soleil.** Le contraste est une exigence de terrain avant d'être une
exigence d'accessibilité, et les deux vont dans le même sens.

**NFR-10. Saisir son meilleur tour ne demande aucune navigation.** Un bouton unique, en pleine
largeur, sur l'accueil (UJ-1) : de l'ouverture au sélecteur, sans menu, sans onglet, sans choisir
d'abord un roulage quand celui du jour existe déjà. Le nombre de taps n'est pas fixé ici — c'est
une conséquence de l'écran, pas une cible arbitraire.

### 5.3 Composition et partage

**NFR-11. Le partage teste `canShare` avec l'objet exact qui sera passé à `share()`**, distingue
l'annulation par l'utilisateur — silencieuse — de tout autre échec, qui ouvre un chemin de repli
visible. Aucune cible n'est nommée nulle part dans le code ni dans l'interface (FR-37).

**NFR-12. Trois pièges de composition d'image, tous silencieux, tous à traiter.** La photo de fond
est servie depuis la même origine ou avec un CORS correct, sinon la composition lève une erreur de
sécurité ; le type du blob produit est **vérifié après coup** plutôt que déduit du format demandé,
qui peut être ignoré sans erreur ; et si la composition tourne dans un worker, les polices y sont
**ajoutées explicitement** — rien n'est hérité du document, et l'ensemble de polices d'un worker
démarre vide.

### 5.4 Extensibilité

**NFR-13. Le téléphone n'est jamais le capteur.** Le pilote **n'a pas son téléphone sur lui en
piste** — il est resté dans le camion ou au paddock. Tout chronométrage par le GPS du téléphone est
donc **faux dès le départ**, et pas seulement repoussé à plus tard. L'échelle de capacité se relit
en conséquence :

| Palier | Ce que c'est | Où est le capteur |
|---|---|---|
| **1 — la saisie manuelle** | Le pilote entre son meilleur tour au sélecteur (FR-16). **Base permanente, pas une béquille en attendant mieux.** | Nulle part : le pilote se souvient |
| **2 — l'import** | Un chronomètre embarqué dédié sur la moto, ou le chronométrage par transpondeur de l'organisateur. **Le téléphone reçoit ce qu'un autre appareil a mesuré.** | Sur la moto, ou chez l'organisateur |
| **3 — l'analyse vidéo** | Dépouillement d'une captation embarquée. | Sur la moto |

Conséquence de schéma, et c'est la seule qui engage maintenant : le modèle de session doit accueillir
**plusieurs tours par session** — un appareil embarqué les donne tous — et **une provenance par
chrono** (FR-18), sans réécriture. Conséquence de produit : la saisie manuelle ne sera jamais rendue
obsolète par une capture automatique, donc elle mérite tout le soin qu'on lui donne au §4.4.

**NFR-14. Le catalogue d'achievements et le barème constructeur sont de la donnée**, modifiables
sans redéploiement.

**NFR-14bis. Le produit est conçu pour quelqu'un qui a oublié comment il marche.** Onze usages par
an, avec un creux de plusieurs mois : chaque écran doit être compréhensible sans mémoire de la fois
d'avant, et aucun parcours ne suppose qu'on se souvienne d'un geste appris.

**Sur quoi cette exigence repose, et sur quoi elle ne repose pas.** Une méta-analyse de 1 344 tailles
d'effet établit que les compétences procédurales décroissent avec le non-usage — environ 0,08 écart
type par mois en précision, la moitié des gains perdue vers 6,5 mois. **Mais elle porte sur des
compétences à composante motrice**, et ne dit rien du modèle mental d'une interface ni du fait de se
souvenir d'ouvrir un outil. Écrire « après six mois l'utilisateur aura oublié l'application » serait
une extrapolation, pas un constat. Ce qu'on peut dire honnêtement : **la direction du risque est
sourcée, son ampleur ici est inconnue** — et le seul modérateur nommé par les auteurs, les
opportunités de pratique intermittente, n'est pas chiffré. Onze usages répartis dans l'année *sont*
de la pratique intermittente ; le creux est ce qui approche la demi-vie mesurée.

**NFR-15. Les domaines en attente de foule sont prévus au schéma et absents du planning** — place de
marché, vérification d'annonce, logistique partagée, « qui roule aujourd'hui ». L'architecture les
prévoit ; rien ne les développe.

### 5.5 Peau, contraste, licence

**NFR-16. La peau Arcade s'applique partout, sans écran exempté — mais la saisie de facture et le
carnet d'entretien doivent y rester aussi rapides qu'ailleurs.** À instrumenter, parce que le risque est
précis : une peau qui ralentit la corvée punit exactement ce que le produit est censé transporter.

**NFR-17. `#B026FF` échoue le contraste AA en petit texte** (4,1:1). Il est réservé aux tracés, aux
remplissages et aux gros chiffres ; le petit texte violet utilise une version éclaircie.

**NFR-18. Racing Catalogue est sous licence personnelle uniquement.** Toute diffusion publique exige
une licence commerciale (octotypeone@gmail.com) ou une alternative sous licence libre — repli à
valider : **Bungee Shade** (SIL OFL). **Depuis la décision d'acquisition payante, l'échéance est
précise : c'est une précondition à la première campagne, pas à une hypothétique sortie du bac à
sable.** Une publicité qui pointe vers une application diffusant une fonte non licenciée est le
genre de problème qu'on ne veut pas découvrir après l'avoir payée.

---

## 6. Contraintes et garde-fous

Huit interdictions fermes, tranchées en amont et non rediscutables ici. Ce tableau existe pour une
raison : une interdiction sans exigence qui la porte n'est qu'une intention. Chacune est reliée à
ce qui la rend **vérifiable**.

| # | L'interdiction | Ce qui la porte | Comment on la rate |
|---|---|---|---|
| 1 | On ne conseille jamais mécaniquement | FR-44, FR-40 | Une phrase du produit qui dit ce qu'il faut faire plutôt que où on en est |
| 2 | L'horloge d'usure affiche toujours sa complétude | FR-40 | Un écran où le chiffre apparaît seul, même « pour gagner de la place » |
| 3 | Le coût au tour ne s'affiche jamais seul | FR-21, FR-23 | Un récapitulatif *budget* qui montre le coût au tour sans le budget consommé |
| 4 | Rien de punitif ni d'irréparable ; aucun cap ne s'annonce | FR-31, FR-13, FR-48, FR-6bis | Un libellé d'accueil qui compte les jours restants ; un compteur qui se remet à zéro ; un cap présenté comme atteignable |
| 5 | Le coefficient d'usure est un paramètre, jamais une constante affichée | FR-42 | Un nombre en dur dans une formule, puis dans une interface |
| 6 | La conformité porte sa source et sa date, ne certifie pas l'admission | FR-50, FR-51 | Une checklist qui se présente comme à jour parce qu'elle est affichée |
| 7 | Le carnet est auto-déclaré, jamais une attestation tierce | FR-38, FR-4 | Une mention reléguée en pied de page du document partagé |
| 8 | La visibilité du chrono est un choix, roulage par roulage | FR-19, FR-39 | Un défaut « visible » sur un compte neuf, par commodité de développement |

### Ce que ces clauses sont, et ce qu'elles ne sont pas

**Elles sont des choix de conception assumés. Elles ne sont pas des conclusions de littérature, et
le PRD ne doit pas leur donner une caution qu'elles n'ont pas.** La recherche académique du 18 août
2026 a vérifié ce point, et le résultat est net sur deux d'entre elles.

Sur **les récompenses contingentes à la performance** — ce qu'est un record — la littérature est
frontalement partagée et ne l'a jamais tranché en vingt-cinq ans : une méta-analyse de référence les
code comme érodant la motivation intrinsèque (d = −0,28), une re-méta-analyse du même corpus conclut
qu'elles l'augmentent ou ne changent rien.

Sur **les séries**, l'interdiction est plus large que la preuve : ce qui est établi concerne la
mécanique punitive et non réparable, pas la série en soi — d'où la reformulation de FR-31. Et les
chiffres qui circulent partout pour justifier les séries proviennent **exclusivement de blogs
d'éditeurs de gamification, dont aucun ne cite d'étude**.

**Les clauses restent, sans exception.** Elles ont une raison meilleure qu'une méta-analyse : la
chute qui a fait naître ce produit. Mais elles s'appliquent parce qu'on les a choisies, pas parce
que la science les impose — et c'est plus solide ainsi, parce qu'une caution qu'on invente est une
caution qui peut être retournée.

**Une chose est en revanche établie et va dans le sens du produit :** le feedback verbal positif
augmente la motivation intrinsèque (d = +0,33), et **les deux camps convergent** là-dessus. Énoncer
plutôt que décerner est la seule pratique que personne ne conteste. Voir FR-13 et §8.

**Les trois clauses de second ordre** — issues de l'analyse des effets en cascade au brief — sont
d'une autre nature : elles n'interdisent pas un mécanisme, elles décrivent **un mécanisme plaisant
qui, suivi d'un cran, dégrade la sécurité**. Elles sont portées par FR-21 (le coût au tour qui
récompenserait de rouler plus), FR-31 (l'achievement de bravoure qui pousse à aller chercher le
geste) et **FR-46**, la plus récente : la liste mélangée où l'élément de sécurité hérite du
caractère repoussable du cosmétique.

**Deux contraintes de conception les accompagnent, et elles commandent le §10 :**

> **S'il faut couper, on coupe la corvée, jamais le plaisir.** La pente naturelle d'un chantier solo
> sous pression est de livrer ce qui est simple à coder — entretien, budget — et de repousser la
> photo, le geste et le récapitulatif. Or c'est le plaisir qui transporte la corvée, jamais
> l'inverse. Un mois de retard sur le carnet d'entretien est rattrapable ; un mois sans le geste ni
> le récapitulatif, et il n'y a plus de raison d'ouvrir l'application.
>
> **Une saisie ne promet jamais une utilité future, elle se rembourse dans le même geste** — sauf
> pour les toutes premières, où c'est faux, et c'est pourquoi FR-34 existe.

---

## 7. Assistance automatique et ses limites

Le produit n'a pas d'assistant, pas de conversation et pas de recommandation. Il a **deux
traitements automatiques**, tous deux bornés par la même règle : ils **pré-remplissent, ils ne
décident pas**.

**La reconnaissance de reçu** (FR-25) lit un montant et propose une catégorie. Elle est un
raccourci de frappe, pas une source de vérité : la correction manuelle prime toujours, et l'absence
totale de reconnaissance ne bloque jamais la saisie. Le choix entre reconnaissance embarquée et
service distant est une décision d'architecture, pas de produit — avec une contrainte de périmètre
qui en découle : **le hors-ligne du paddock ne dépend pas d'elle**, puisque le coût se saisit le
soir ou le lendemain (UJ-3).

**La composition du récapitulatif** (§4.8) assemble une image à partir de données déjà saisies. Elle
ne choisit pas ce qui est intéressant : ce sont les trois gabarits qui décident, et le pilote qui
tranche en un tap.

**Ce qui est exclu, et le restera :** toute forme de conseil mécanique (interdiction n°1), toute
reconnaissance automatique d'un geste sur une photo (FR-28 est déclaratif), et toute inférence
présentée comme un fait. Un produit qui touche à la sécurité d'une machine n'a pas le droit de
deviner.

### Support, données et obligations — ce que l'acquisition payante rend vrai tout de suite

Le paragraphe qui précédait disait : « pas de support, un seul utilisateur qui est aussi le
développeur ; ce point deviendra faux au deuxième utilisateur ». **La décision du 18 août 2026 de
recruter par campagnes Meta payantes le rend faux immédiatement**, et pas au conditionnel. Trois
lignes de ce document basculent d'un coup, et une quatrième s'y ajoute.

**Le support existe dès la première installation venue d'une publicité.** Au minimum une adresse
qui répond et un chemin pour signaler un problème. Un inconnu qui perd sa saison n'a pas le numéro
du développeur.

**Les instruments de bord ne peuvent plus être seulement locaux.** FR-60 les voulait privés au
porteur ; des utilisateurs recrutés par publicité rendent la mesure inexploitable si elle ne remonte
pas. Ce qui remonte doit être **annoncé en clair et minimal** — les trois instruments, rien d'autre.

**Le carnet auto-déclaré sera lu par des gens qui ne savent pas ce qu'il vaut.** C'était déjà une
exigence de premier plan (FR-38) ; ça devient la sortie la plus exposée du produit, puisqu'un
acheteur d'occasion peut désormais arriver sans connaître personne dans la chaîne.

**Et les obligations réglementaires s'attachent aux utilisateurs, pas au chiffre d'affaires.**
Politique de confidentialité, base légale RGPD pour les données saisies et pour la mesure d'audience
publicitaire, conditions d'utilisation, chemin de suppression de compte et d'export. Ce ne sont pas
des exigences de produit et elles ne figurent pas au §4 — **mais aucune campagne ne se lance sans
elles.** Voir QO-11.

**Les clauses de sécurité comptent davantage avec des inconnus qu'avec un pote.** Un ami à qui on
montre l'application connaît l'histoire de la chute ; quelqu'un qui l'installe après une publicité
ne la connaît pas. Les huit interdictions du §6 et la neuvième née de la recherche (FR-39bis) ne
sont pas des scrupules de bac à sable — ce sont les seules protections d'un utilisateur qui n'a
aucun contexte.

### La frontière des quatre états — exigence du mouvement 3

**FR-61. Le modèle distingue quatre états et ne les confond jamais : brouillon, usage, preuve,
recommandation.** Un roulage importé d'un calendrier d'organisateur est un **brouillon** — une
inscription ou une présence ne prouve pas qu'on a roulé, et certains roulages loisir interdisent
tout chronométrage. Il ne devient un **usage** que confirmé par le pilote ou par une mesure. Une
facture, une photo, une ligne de carnet sont des **preuves** et ne se déduisent jamais. Et la sortie
d'une règle — barème, horloge d'usure, échéance — est une **recommandation** qui porte sa source et
son incertitude, jamais un état de la machine.

**Portée : c'est une contrainte de modèle, pas un lexique d'interface.** Les quatre mots ne
remontent pas à l'écran. Le pilote voit au plus une distinction — « à confirmer » contre confirmé —
et ne lit jamais « preuve » ni « recommandation » comme étiquette. Quelqu'un qui ouvre
l'application onze fois par an n'apprend pas le vocabulaire de son schéma.

> Cette exigence vient de la condition 4 de l'audit de viabilité, qui la voulait dans le schéma
> **avant tout développement**. Vérifié le 18 août 2026 : elle est **absente des vingt AD** de la
> colonne vertébrale. La nuance qui décide de sa date : elle gouverne l'import et le moteur de
> règles, tous deux au **mouvement 3**. Elle ne bloque donc pas le noyau de décembre, qui n'a ni
> import ni règle — **elle bloque l'horloge d'usure et le barème.** À porter en AD côté
> architecture avant le premier récit du mouvement 3, et non pendant.

---

## 8. Esthétique et voix

La direction est **verrouillée** et détaillée dans [`DIRECTION.md`](../../../design/DIRECTION.md).
Ce qui suit est ce que le PRD en retient parce que ça contraint les exigences.

**Attract Mode** — arcade assumée, référencée sur Hang-On (Sega, 1985) et Out Run (Sega, 1986),
appliquée aux six écrans. Ce n'est pas un thème optionnel ni une peau de partage : c'est le produit.

Acquis qui ne se rouvrent pas :

- **Le violet `#B026FF` ne s'allume que sur un record** — meilleur tour, meilleur coût au tour,
  geste débloqué. Vert pour un record personnel, jaune pour plus lent. La couleur porte une
  information ; elle n'est jamais décorative.
- **Le violet est le pont du dégradé.** Un orange vif posé sur un bleu profond donne un gris
  brunâtre : il faut un magenta ou un violet saturé entre les deux. Structurel.
- **Le fond n'est jamais noir plat** — dégradé vertical multi-arrêts, tramage, scanlines.
- **Biseaux pixel, pas d'ombres douces.** Aucun coin arrondi, aucun flou.
- **Le budget de saison est un compteur de crédits ; le coût au tour est un score qui descend.**
  C'est la traduction visuelle de FR-21 : un chiffre qui baisse devient une victoire, et le crédit
  qui se consomme reste visible à côté.
- **Aucun drapeau à damier** comme signe de marque.

Quatre correctifs restent à appliquer : palette décalée vers un bleu ciel « Miami », composition
plus épurée, deux polices — Press Start 2P pour le HUD et les chiffres, une script racing pour les
titres et les moments d'émotion — et **moins d'effets** : le pixel doit rester un accent, pas une
texture générale.

**La voix. Le produit énonce, il ne décerne pas.** Factuelle, jamais injonctive (FR-13). Le
vocabulaire est celui des pratiquants : on dit **roulage**, jamais « trackday ». Un libellé énonce ce
qui est, jamais ce qu'il faudrait faire.

Ce n'est plus seulement une préférence de ton depuis le 18 août 2026 : c'est **le seul point sur
lequel les deux camps du débat sur les récompenses convergent**. Le feedback verbal positif augmente
la motivation intrinsèque (d = +0,33 de part et d'autre) là où les récompenses tangibles divisent.
La conséquence est concrète et se vérifie ligne par ligne :

| ✅ Le produit énonce | ❌ Le produit décerne |
|---|---|
| « Meilleur tour battu de 1"8 » | « Bravo ! Tu as gagné un trophée » |
| « Premier roulage à Lédenon » | « Débloqué : Baptême du feu ⭐ » |
| « Genou gauche posé » | « +50 points de symétrie » |
| « 3,04 € le tour, 2 840 € sur 5 500 » | « Nouveau record ! » |

Le fait est déjà remarquable. L'emballage le transforme en récompense tangible — et c'est
exactement ce que la littérature conteste.

---

## 9. Non-objectifs

**Décisions fermes, définitivement hors périmètre.** L'automobile de circuit. L'application native.
Toute suite de comptabilité ou de gestion pour les organisateurs. Tout remplacement de leurs groupes
WhatsApp. Toute forme de classement public.

**En attente d'une foule, et non d'un budget.** Place de marché, vérification d'annonce, logistique
partagée, « qui roule aujourd'hui ». Ces domaines ne sont pas coupés parce qu'ils coûtent cher : ils
sont coupés parce qu'**un écran vide ne sous-délivre pas, il signale l'abandon**. L'architecture les
prévoit (NFR-15) ; le planning ne les contient pas.

**Supprimé le 18 août 2026 : le mode hors-saison.** Il figurait au brief comme dixième domaine,
livrable en novembre 2027 — soit onze mois après le premier roulage. Il est **absorbé, pas
reporté** : s'il existe deux unités de compte, l'hiver n'est plus un trou mais la période où l'axe
machine domine. Et un mode déclenché par une date serait faux pour un pilote qui roule en janvier
(FR-53). La suppression d'un domaine est la seule réduction de périmètre de cette session ; toutes
les autres décisions en ajoutent.

**Pas de modèle de revenu, mais des dépenses d'acquisition.** Aucun modèle de revenu n'est arrêté, et
en trancher un maintenant reviendrait à concevoir pour un client qu'on n'a pas. Le produit reste
conçu **comme s'il devait être commercialisable** — c'est une contrainte de qualité.

**Ce qui a changé le 18 août 2026 :** Julian ajoute des **campagnes Meta payantes** comme second
canal d'acquisition, sur le modèle de [NanoCorp](https://www.nanocorp.so/) — une société autonome
qui construit, déploie, encaisse et fait tourner ses publicités depuis un prompt. Deux conséquences
qu'il faut écrire plutôt que subir.

**Le bac à sable n'en est plus tout à fait un.** Le critère reste l'utilité et non le revenu, mais
un produit qui achète des installations amène des **inconnus**, pas des amis — avec des obligations
qui s'attachent aux utilisateurs et non au chiffre d'affaires (§7).

**Et de l'acquisition payante sans revenu est une dépense nette.** Ce n'est pas une objection —
c'est le prix d'obtenir des utilisateurs qui ne doivent rien à Julian, donc des mesures qui veulent
dire quelque chose. Mais ça mérite un plafond décidé à l'avance plutôt qu'une découverte au relevé
bancaire. Voir QO-11.

### Économie du produit — ce qui est renversé, ce qui reste en test

Trois artefacts du 16 août 2026 portaient des conclusions commerciales que ce PRD n'avait pas
reprises. Les voici, avec ce qu'on en fait.

**Renversé, et déjà renversé en amont : « ne rien construire avant validation comportementale ».**
L'audit de viabilité rend **VÉRIFIER** et écrit que le projet « ne mérite pas encore un PRD de
construction complète […] prêt pour une validation comportementale, pas pour un lancement ». Le
brief du 17 août avait déjà renversé cette décision de tête ; ce PRD l'applique sans l'avoir écrit,
ce qui est la vraie faute. Deux raisons rendent l'arbitrage solide, et il faut les lire ensemble.
D'abord l'audit **gradue trois ambitions** et le cadrage bac à sable ne vise que la première :
« niche autofinancée : plausible sous conditions », contre « produit France B2C établi : non
démontrée » et « grande entreprise : impossible ». Ensuite son propre protocole de validation —
comparaison directe chronométrée, pilote de quinze propriétaires, réplication à trente — **exige un
objet qui fonctionne** : on ne chronomètre pas une comparaison contre l'outil actuel sans l'outil.
Construire le noyau n'enfreint pas le protocole, **c'en est la précondition.** La distinction qui
porte tout : **construire n'est pas lancer**, et c'est la même ligne que celle du nom (QO-1).

**Renversé par Julian, et c'est un arbitrage qu'il faut tracer : les conditions NanoCorp.** Le
PRFAQ posait une condition écrite — NanoCorp « ne sera testé qu'après activation, répétition,
paiement et attribution mesurés hors de sa plateforme » — et jugeait l'offre publique, 30 $/mois
plus 15 à 150 $/jour de publicité, « incompatible avec le plafond externe actuel de 0 € ». La
décision du 18 août d'ajouter les campagnes Meta payantes **renverse cette condition**. Elle est
maintenue : le rationnel est que des inconnus recrutés par publicité sont plus coûteux en euros mais
strictement moins contaminés que le pote qui ne dit pas ce qui ne va pas. Mais une des conditions
survit et devient exigible : **l'attribution mesurée hors de la plateforme du prestataire** rejoint
les préconditions de QO-11. Sans elle, on paie sans savoir ce qu'on achète.

**En test, et il n'y a rien à construire : la monétisation.** La règle de la recherche marché est
conservée mot pour mot — **« monétisation à tester, pas à prévoir »**. Ce ne sont pas des prix, ce
sont des cellules d'essai, et aucune conversion ni aucun paiement n'a été observé à ce jour.

| Moment de valeur | Cellule d'essai | Ce qu'on sait, et ce qu'on ne sait pas |
|---|---:|---|
| Noyau | Gratuit, une machine | À comparer à un essai limité ou payant. La gratuité concurrente ne dicte pas le modèle. |
| Pass saison | 29–39 € | Aligné sur Apex Lines, MotoVault, LookOver. Aucune conversion observée. |
| Partage revente | 9–19 € ponctuels | Plage arbitraire ; seul repère observé, MotoStack à 9,99 $. |
| Loueur / école | À découvrir | Substituts publiés de 9 à 199 €/mois. Aucune volonté de payer observée. |

**Et un raisonnement que le brief avait commencé sans le finir.** La cadence d'environ onze usages
par an rend l'abonnement **mal ajusté** — facturer au mois un produit ouvert onze fois l'an est une
machine à résiliation, et c'est le constat économique le plus solide du dossier. Il ne tue pas le
prix, il change sa forme. L'unité de compte du produit est **déjà la saison** — un état dérivé
(FR-53), et un entier dans le schéma. Un **pass saison**, payé à l'ouverture d'une saison et
conservé ensuite, est donc *natif* au modèle de données là où l'abonnement lui est étranger. La
ligne gratuit / payant qui en découle : **le noyau reste gratuit**, parce que mettre un péage sur la
chose qui doit être ouverte onze fois pour valoir quelque chose est à l'envers ; le payant porterait
sur les **paliers coûteux** — import de chrono, axe machine et carnet, cercle partagé. C'est le
« accès premium sur les paliers coûteux » du brief, avec une forme.

**Et le deuxième ordre du pass saison, qu'il faut écrire avant de s'attacher à l'idée.** Un pass
payé à l'ouverture d'une saison est une dépense engagée sur cette saison. Il fabrique le
raisonnement « j'ai payé, il faut que ça serve », donc une incitation à rouler davantage pour
amortir. L'interdiction n°4 exclut les séries et les compteurs à échéance **au motif précis qu'ils
fabriquent la pression du « encore une session »** : introduire cette pression par la facturation
plutôt que par une mécanique de jeu est la même faute par une autre porte, et elle est **pire en un
point** — invisible dans l'interface, elle échappe aux prohibitions écrites au niveau des écrans.

**Un second candidat n'a pas ce défaut : l'achat définitif du palier.** On achète l'import de
chrono, ou l'axe machine, une fois et pour de bon. Il n'y a rien à renouveler, donc le problème de
cadence disparaît aussi bien qu'avec le pass ; il n'y a **aucun coût échoué par saison**, donc
rouler plus ne récupère rien et n'est pas encouragé ; et on paie une capacité plutôt que du temps,
ce qui est l'unité honnête pour un produit ouvert onze fois l'an. Son défaut est commercial et non
cognitif — le revenu est ponctuel par utilisateur. **Sur un projet dont le critère écrit est
l'utilité et non le revenu, c'est le défaut qu'on peut se permettre**, et c'est l'inverse pour
l'autre.

> **Deux candidats, aucune décision.** La règle « à tester, pas à prévoir » s'applique aux deux, et
> l'achat définitif est le plus cohérent avec les règles que le produit s'est déjà données — ce qui
> ne le rend pas gagnant, seulement mieux argumenté à ce stade. La raison pour laquelle on peut
> laisser la question ouverte sans risque est arithmétique : **elle ne coûte aucune soirée au noyau
> de décembre.** Rien dans les 25 récits n'en dépend, et le noyau gratuit est exactement la
> première cellule du tableau.

---

## 10. Noyau de premier roulage et séquencement

### 10.1 Le noyau — à livrer pour le 1er décembre 2026

Le brief avait six domaines datés « mars », ce qui décrivait un souhait plutôt qu'un plan. Le
strict minimum qui doit exister **le jour du premier roulage de la saison** est plus étroit, et il
est daté de décembre et non de mars pour une raison qui n'est pas la prudence : **le développement
doit être fini avant que la saison commence.** Les soirées qui servent à construire sont exactement
celles qui serviront à remplir. Un chantier qui déborde sur avril ne retarde pas une livraison — il
mange la saisie, et la saisie conditionne tout le reste.

| Dans le noyau | Exigences | Pourquoi celui-là |
|---|---|---|
| **Le schéma à deux axes** | FR-5, FR-2 | Décision de modèle. La seule dont le coût explose si elle est différée. |
| **Le roulage** | FR-6 → FR-10 | L'unité de compte. Rien ne fonctionne sans. |
| **Le meilleur tour du jour** | FR-16 → FR-19 | Le plaisir immédiat, et la porte d'entrée de Kévin. |
| **Le coût de la journée et le coût au tour** | FR-21 → FR-25 | Le territoire vide du marché. Et FR-23 dès le noyau, sinon le budget est faux. |
| **La photo et le geste déclaré** | FR-28, FR-29, FR-32 | La fierté qui n'a nulle part où aller. Coût de saisie nul. |
| **Le récapitulatif sur un seul roulage** | FR-33 → FR-37 | Le seul moteur d'acquisition, et la condition du premier jour. |
| **L'accueil temporel, deux sources** | FR-11 → FR-15 | Presque gratuit à ce stade, et c'est ce qui fait exister le produit entre deux roulages. |
| **Les trois instruments de bord** | FR-57 → FR-60 | Sans eux, l'échec ne se voit qu'en octobre 2027. |

**Délibérément hors du noyau, et il faut le noter :** la **courbe de progression** (FR-20). Elle n'a
pas encore les points pour dire quoi que ce soit. C'est la démonstration même que la récompense du
produit est différée — donc qu'elle ne peut pas porter le premier roulage.

**La règle de découpe, si décembre serre.** On coupe la corvée, jamais le plaisir. Concrètement et
dans cet ordre : la reconnaissance de reçu (FR-25) tombe avant la saisie manuelle du coût ; la
saisie assistée de l'entretien tombe avant l'affichage de l'état de la machine ; **la photo, le
geste et le récapitulatif ne tombent pas.**

### 10.2 Séquencement — trois mouvements, ancrés sur des dates extérieures

L'ordre de livraison n'est pas un arbitrage de priorités : c'est **une conséquence de la date à
laquelle chaque chose devient utile**. Le calendrier de la saison séquence le chantier tout seul.

**Mouvement 1 — d'ici le 1er décembre 2026.** Le noyau ci-dessus. Plus une action qui n'est pas du
développement et qui est pourtant la plus importante du plan : **recruter Kévin.** Sans un deuxième
utilisateur, aucune des mesures du §11 n'est interprétable.

**Mouvement 2 — décembre 2026 à février 2027, pendant le premier vide saisonnier réel.** L'axe
machine prend ses écrans : le journal d'interventions indépendant de tout roulage (FR-43), la pièce
achetée non montée (FR-45), les trois catégories séparées (FR-46), la réparation non vitale
(FR-47, FR-48), l'événement visé (FR-54). Puis l'accueil temporel se branche sur ces nouvelles
sources (FR-12), **et c'est ce branchement qui referme le vide saisonnier**. Ce mouvement se
construit pendant la période qu'il sert : c'est son propre banc d'essai, à la réserve près du biais
de constructeur (§11.3).

**Mouvement 3 — pendant la saison 2027, sur condition.** Chaque élément a une condition d'allumage,
pas une date : la courbe de progression quand elle a des points ; l'horloge d'usure et le barème
(FR-40 → FR-44) vers mai, parce que l'usure a besoin de roulages avant de dire quoi que ce soit ;
la checklist et la conformité (§4.12) avant le premier roulage ; le cercle et le carnet partagé
(§4.9) **quand un pote roule** ; le bilan et le budget prévisionnel (§4.13) quand une saison est
complète.

**Trois jalons, ancrés sur des dates extérieures fixes et jamais sur une estimation d'effort :**

| Jalon | Quand | Ce qui doit être vrai |
|---|---|---|
| **Schéma arrêté** | avant la première ligne de code du noyau | Deux axes, roulage et machine |
| **Noyau livré** | 1er décembre 2026 | Le tableau du §10.1, instruments compris |
| **Développement clos** | avant mars 2027 | Les soirées repassent de la construction à la saisie |

---

## 11. Critères de succès

Le critère du projet est l'utilité personnelle, pas le revenu. Mais « utile à moi » ne peut pas
renvoyer non, donc ce n'est pas un critère. Ce qui suit est mesurable et **peut échouer**.

### 11.1 Les mesures

| # | Mesure | Cible | Ce qu'elle valide |
|---|---|---|---|
| **M1** | Délai roulage → saisie (FR-57) | < 48 h sur toute la saison | L'accueil temporel, cas « roulage récent incomplet » |
| **M2** | Ouvertures sans saisie, par intervalle inter-roulage (FR-59) | ≥ 1 | La réfutation directe de « s'ouvre pour être remplie, jamais pour être regardée » |
| **M3** | Ouvertures entre décembre 2026 et février 2027 | **≥ 1 par mois, sans relance** | L'axe machine et l'accueil temporel |
| **M4** | Délai de la première saisie de mars 2027 | ≤ médiane de la saison | Que mars ne soit pas un recommencement |
| **M5** | **Un utilisateur qui n'est pas Julian** ouvre entre deux roulages | au moins une fois | **La seule mesure non contaminée par le biais du constructeur.** Le brief l'appelait « Kévin » et visait un pote ; l'acquisition payante remplace le recrutement d'un ami par des inconnus. La mesure ne change pas — **sa source, si.** |
| **M6** | Dépense hivernale consignée | ≥ 1 | Le test le plus direct de FR-23 |
| **M7** | Récapitulatif posté sans effort de communication | ≥ 1 sur la saison | Que ce qui devait être satisfaisant le soit |
| **M8** | Saison consignée en entier | tous les roulages, pas les trois premiers | La condition de tout le reste |
| **M9** | Régulations **externe** et **introjectée** au *User Motivation Inventory*, mesurées sur un deuxième utilisateur | basses | **La distinction qui gouverne ce PRD, mesurée au lieu d'être affirmée** |

**Deux réserves sur ces mesures, à ne pas laisser implicites.**

**M7 dépend de QO-3, qui est ouverte.** Si le partage n'atteint pas Instagram par un chemin
utilisable, le pilote devra enregistrer l'image puis la poster à la main — c'est-à-dire fournir
exactement l'« effort de communication » dont M7 exige l'absence. Tant que QO-3 n'est pas tranchée,
un échec de M7 ne distingue pas « l'image ne donnait pas envie » de « le chemin n'existait pas ».
FR-37 protège le produit ; il ne protège pas la mesure.

**M9 rend enfin mesurable ce qui n'était qu'une conviction.** La distinction « adoption par la
valeur contre engagement par la pression » gouverne tout ce document sans avoir jamais été mesurée.
Le *User Motivation Inventory* sépare, dans le contexte de l'engagement avec un système interactif,
les régulations **externe** et **introjectée** — c'est-à-dire la pression — des régulations
identifiée et intrinsèque. Deux réserves à porter : l'instrument est nommé dans une revue lue mais
ses propriétés psychométriques n'ont pas été vérifiées, et **il n'a aucun sens sur un utilisateur
qui est aussi le développeur** — M9 attend donc le deuxième utilisateur, comme M5.

**M8 n'a aucun instrument et n'en aura pas.** Le produit ne peut pas connaître les roulages qui n'y
ont jamais été saisis. M8 se relève **à la main**, une fois, en fin de saison, en comparant ce qui
est consigné à ce que le porteur sait avoir roulé. C'est une mesure honnête à condition d'être
annoncée comme manuelle ; présentée comme instrumentée, elle serait fausse.

M3 a été durcie le 18 août. Elle était calibrée sur l'hypothèse d'une période creuse ; si l'hiver
est au contraire la période de plus forte activité machine, **une seule ouverture en trois mois
serait un échec, pas un succès**.

### 11.2 Les contre-mesures — à ne surtout pas optimiser

| # | Contre-mesure | Cible | Pourquoi |
|---|---|---|---|
| **C1** | Notifications de relance envoyées | **0** | Si ce chiffre monte, le mécanisme a échoué et a été remplacé par celui qui est interdit. C'est le signal d'échec le plus important du dispositif. |
| **C2** | Ouvertures servant un accueil vide | proche de 0 | Un écran vide ne sous-délivre pas, il signale l'abandon (FR-14) |
| **C3** | Temps passé par ouverture | **à ne pas maximiser** | Un produit ouvert onze fois par an dont le temps de session s'allonge est probablement utilisé pour une mauvaise raison |

### 11.3 Le biais du constructeur

**C'est le problème central de toute validation ici, et il n'est pas résolu.** Julian ouvre
l'application parce qu'il la développe ; ses propres ouvertures sont contaminées et le resteront
jusqu'à la fin du développement — c'est-à-dire jusqu'en mars, soit **après** la période que le
mécanisme est censé couvrir. Trois parades, par ordre de fiabilité : valider sur Kévin (M5, la seule
mesure propre) ; distinguer dans l'instrumentation les ouvertures faites pendant une session de
développement, imparfait mais mécanisable ; traiter l'hiver 2026-2027 comme un banc d'essai réel,
aux vraies dates, avec la vraie moto.

**La preuve recherchée est un graphique simple** : les ouvertures dans le temps, avec les dates de
roulage marquées. Si les ouvertures ne forment que des pics sur les roulages, le mécanisme a
échoué. Si des ouvertures existent dans les creux, il fonctionne.

### 11.4 Ce qui déclenche un ajustement

- **M1 dépasse 48 h une seule fois** → l'accueil temporel ne suffit pas sur le vide inter-roulage.
  Escalader vers le branchement social, pas vers une relance.
- **M3 reste à zéro fin février 2027** → soit l'axe machine n'a pas été livré, soit le bricolage
  hivernal n'existe pas. Vérifier **lequel des deux** avant de concevoir une parade.
- **M5 reste à zéro alors que M2 est bon** → le produit ne sert que son constructeur. C'est le pire
  résultat possible, **et il ressemble de loin à un succès.**
- **L'envie d'ajouter une notification apparaît** → c'est le signal que le mécanisme a échoué, pas
  que la notification est nécessaire. Revenir au diagnostic, pas à l'interdit.

---

## 12. Questions ouvertes

**Onze questions**, dont dix posées à Julian le 18 août 2026 et une ouverte par la stratégie
d'acquisition. **Sept sont tranchées** et redescendent en exigences ou en décisions d'architecture.
**Quatre restent ouvertes** : deux ne se règlent que sur un appareil réel, une attend la saison 2027,
et **QO-1 a été rouverte le 18 août après réconciliation** — elle avait été fermée à tort.

### 12.1 Ce qui reste ouvert

| # | Question | Comment on la ferme | Quand |
|---|---|---|---|
| **QO-3** | **Quand on appuie sur « partager » depuis une application web, l'image arrive-t-elle vraiment dans une story Instagram ?** Meta ne documente aucun chemin, et les destinations de la feuille de partage iOS ont déjà disparu une fois par le passé. | **Requalifiée le 18 août : à faire, mais hors du plan de base**, au même titre que les fonctions de second temps. Une page de test vivra sur la branche `dev`. FR-37 rend le produit indépendant de la réponse, et l'acquisition payante lui donne un second canal — donc ce n'est plus bloquant. | Sur `dev`, quand ça arrange |
| **QO-11** | **Le plafond de dépense publicitaire, et les préconditions réglementaires.** Politique de confidentialité, base légale RGPD, CGU, suppression de compte et export — plus la licence de fonte (NFR-18). | Un montant décidé à l'avance, et une liste cochée. **Aucune campagne ne se lance avant.** | Avant la première publicité |
| **QO-1** | **Le nom public n'est pas trouvé, et MyPaddock ne peut pas l'être.** Vérifié le 18 août 2026, et **plus grave que ce que le dossier du 16 écrivait** : [MyPaddock](https://www.redbullracing.com/int-en/projects/my-paddock-loyalty-programme) est le programme de fidélité d'Oracle Red Bull Racing — lancé en 2021, **750 000 membres**, 6,2 M de visites en 2025, et il fonctionne **aux points et aux paliers**, donc même secteur et mécanique voisine. [ThePaddock](https://thepaddock.app/) n'est pas un voisin mais **le même produit** : chronos et records personnels, partage d'accomplissements, photos de sessions, journal de roulages — déjà sur l'App Store. [PaddockPro](https://paddock-pro.com/) est lui-même contesté entre trois domaines, et Paddock Manager, ThePaddock.live et Paddock Tracker occupent le reste. La graphie « MyPadock » n'élimine ni les collisions phonétiques, ni typographiques, ni celles des résultats de recherche. | **Report décidé par Julian le 18 août 2026, et non oubli.** On construit sous le nom de code ; le nom public se choisira devant le produit qui tourne plutôt que devant un PRD. Ce report est **gratuit à une condition, portée par le récit 0.3** : le nom d'affichage vient d'une seule constante, donc le renommage reste un changement d'une ligne. **Déclencheur de levée** — la recherche à l'identique sur [`data.inpi.fr`](https://data.inpi.fr) est gratuite et instantanée ; la recherche en **similarité est payante et faite par des documentalistes INPI**, donc elle ne se lance que sur un seul nom, ce qui impose de réduire d'abord. Puis conseil professionnel. **Rien de public sous « MyPaddock »** : ni campagne, ni boutique, ni dépôt. | **Avant le premier euro de publicité.** QO-1 rejoint la liste de QO-11 |
| **QO-5** | **La calibration du coefficient d'usure.** Aucune source ne l'étaye (A14). Tranché à court terme par FR-42 — il part à 1 — mais la valeur juste reste inconnue. | Mesure sur les données réelles de la saison 2027. | Saison 2027 |

### 12.2 Ce qui a été tranché le 18 août 2026

| # | Décision | Ce qu'elle entraîne |
|---|---|---|
| **QO-2** | **Le compte a une sauvegarde serveur**, et c'est la réponse de fond à « ma saison a disparu ». | Le stockage local cesse d'être la source de vérité de la saison : c'est un cache et le tampon du hors-ligne. La fenêtre à protéger se rétrécit à **la journée elle-même**, de la saisie au paddock au retour du réseau (§5.1, NFR-4). Le test de désinstallation reste utile mais n'est plus bloquant. |
| **QO-4** | **Le moteur de synchronisation se tranche à `bmad-architecture`**, sur critères écrits. **Point rouvert le 18 août 2026 au montage :** le palier gratuit de PowerSync (2 Go synchronisés/mois, 500 Mo hébergés, 50 connexions) **désactive un projet après une semaine d'inactivité**. Sur un produit ouvert **onze fois par an**, c'est une collision structurelle et non un détail de facturation — le palier suivant est à **49 $/mois**. Sans effet sur les sondes ni sur le développement, où l'usage est quotidien ; à trancher avant la mise en service. | Quatre candidats vivants, Legend-State écarté pour l'échéance de décembre. **Et le périmètre technique s'élargit** : voir QO-6, qui introduit un service serveur là où il n'y en avait pas. |
| **QO-6** | **Le barème constructeur ne se saisit pas, il se récolte.** Recherche web et extraction assistée par IA, sur un service serveur (Railway) exécuté **hors du temps de l'utilisateur**. | C'est la décision la plus lourde du lot, et elle porte un risque qu'il faut nommer : **une extraction par IA n'est pas une transcription, c'est une reconstruction** — voir §12.3. |
| **QO-7** | **Une source existe déjà, et personne n'a besoin d'être convaincu.** [`calendrier-piste.fr`](https://www.calendrier-piste.fr/circuit/21-Pau-Arnos) agrège les roulages par circuit et par organisateur, avec date, prix et nombre de groupes — et **les organisateurs y renseignent eux-mêmes leurs sorties**, exactement le modèle que Julian décrivait. | Aucune API, aucun iCal, aucun RSS : du HTML. Donc le même service serveur que QO-6, et le même mode de récolte. Voir aussi §12.3. |
| **QO-8** | **Recherche menée le 18 août 2026** — ~40 sources, 8 affirmations portantes tracées. **La réserve n'est pas levée : elle est déplacée.** | Trois clauses renforcées, deux privées de leur caution affichée sans perdre leur bien-fondé, et **une révélée moins protectrice que le document ne le croyait** — la conjonction du catalogue de caps et du cercle (FR-39bis). Rapport : [`research.md`](../../research/academic-lit-coherence-cognitive-du-produit-2026-08-18/research.md). |
| **QO-9** | **Tranchée par la stratégie d'acquisition, et dans l'autre sens.** Le deuxième utilisateur n'est plus un pote à recruter : ce sont des inconnus amenés par publicité. | FR-60 remonte désormais, de façon annoncée et minimale. Le §7 gagne une section « Support, données et obligations ». **« Recruter Kévin » sort du plan** — l'action la plus importante hors développement est remplacée par un budget publicitaire. |
| **QO-10** | **Tranchée deux fois, et la seconde corrige la première.** Le 18 août, réponse de Julian : on construit tout, décembre devient une cible plutôt qu'une contrainte de coupe. Puis `bmad-create-epics-and-stories` a posé le calcul et rendu **non tel quel**. | 105 jours, `[ASSUMPTION]` ≈ 45 soirées utiles — le chiffre le plus contestable du dossier. Le noyau tel qu'écrit demandait 46 soirées, soit **zéro marge**. **Trois coupes appliquées** (reconnaissance de reçu −3, accueil réarrangeable −2, catalogue d'achievements minimal −1) → **40 soirées contre 45, 11 % de marge.** Ordre de coupe suivant décidé à froid : sessions, troisième gabarit, puis synchronisation — cette dernière **dangereuse**, elle rend vraie « ma saison a disparu » pendant sa durée. Détail : [`epics.md`](../../epics.md). |

### 12.3 Trois conséquences des réponses, qui sont des questions neuves

**Un service serveur entre dans le périmètre, et il n'y était pas.** QO-6 et QO-7 exigent tous deux
de la récolte web et de l'extraction — travail asynchrone, hors du temps de l'utilisateur, sur
Railway. Et le compte avec sauvegarde (QO-2) en exige un autre : authentification, stockage des
photos, base de la saison. Jusqu'ici le PRD décrivait une PWA plus un moteur de synchronisation ;
il en faut trois de plus. **À intégrer à `bmad-architecture`, pas à découvrir en le codant.**

**Recommandation de stockage, à confirmer à l'architecture.** Julian dispose de Supabase et de Neon
en gratuit pour le POC. Les deux sont du Postgres ; la différence est ce qu'il y a autour.
**Supabase pour l'application**, parce que le compte et les photos sont déjà au périmètre et qu'il
apporte l'authentification et le stockage de fichiers sans rien assembler — et parce que PowerSync,
l'un des quatre candidats de QO-4, le vise explicitement comme cible. **La même base accueille les
données récoltées** : rien ne justifie deux fournisseurs pour un POC. Neon reste le repli naturel si
la récolte devient un chantier à part entière, son branchement et sa mise à l'échelle à zéro y étant
mieux adaptés. **Réserve à ne pas perdre :** la recherche du 18 août a établi que Supabase ne fera
**pas** le travail du hors-ligne — position officielle tenue depuis 2023, et l'acquisition de
Triplit s'est accompagnée de la déclaration explicite qu'il ne serait pas intégré. C'est le moteur
de synchronisation qui porte le hors-ligne, pas la base.

**Une extraction par IA n'est pas une transcription.** L'interdiction n°1 dit qu'on transcrit le
barème constructeur et qu'on ne l'interprète jamais. Une extraction automatique **est** une
interprétation : elle peut se tromper de modèle, d'année, d'unité, ou halluciner une échéance. Et
c'est le seul endroit du produit où une erreur touche la sécurité d'une machine. Trois garde-fous
en découlent, à écrire comme exigences quand le domaine entretien sera spécifié : le barème porte
**sa source et sa date de récolte**, exactement comme la conformité organisateur (FR-50) ; il porte
**la mention qu'il a été extrait automatiquement** ; et il est **validable par le pilote**, qui a le
manuel sous les yeux et dont la correction prime. Sans ces trois-là, la décision QO-6 met le
produit en contradiction avec sa propre clause de sécurité.

**Kévin n'existe pas, et il ne sera pas recruté.** À la question « c'est qui Kévin ? », la réponse
est : personne. C'est le protagoniste de UJ-2, l'archétype du pote qui utilise l'application sans
avoir été supplié — le plus petit signal externe qui existe, et toute la différence entre « utile à
moi » et « utile ».

**La stratégie d'acquisition payante le remplace, et c'est un arbitrage qui se défend.** Trouver un
ami disposé à saisir onze roulages est lent, incertain, et biaisé par l'amitié elle-même. Des
inconnus recrutés par publicité sont plus coûteux en euros mais **strictement moins contaminés** :
ils ne doivent rien à Julian. **M5 ne change donc pas — seule sa source change.**

**Ce que ce remplacement coûte, et qu'il faut voir venir.** Un pote pardonne un bug, dit ce qui ne
va pas, et n'a pas besoin de politique de confidentialité. Un inconnu désinstalle en silence, ne
dit rien, et arrive avec des obligations (§7). Le signal sera plus propre **et beaucoup plus
difficile à lire** : une désinstallation muette ne distingue pas « le produit ne sert à rien » de
« l'application a planté au premier écran ». D'où l'importance des trois instruments (FR-57 à
FR-60), qui deviennent la seule voix des utilisateurs qu'on ne connaît pas.

---

## 13. Index des hypothèses

Deux registres, qui ne se confondent pas.

### 13.1 Les hypothèses tranchées dans ce document

**Les quatre hypothèses que ce PRD portait ont été tranchées par Julian le 18 août 2026.** Aucune
ne subsiste ; elles sont conservées ici pour la trace, parce que deux d'entre elles ont été
tranchées **contre** l'arbitrage de l'auteur.

| Où | Ce qui était supposé | Ce qui a été décidé |
|---|---|---|
| FR-2 | Le porteur n'a qu'une machine | **Faux.** Le garage contient plusieurs véhicules, c'est la norme et non le cas limite. Chaque roulage porte sa machine ; le budget de saison reste celui du pilote. |
| FR-23 | La dépense d'hiver compte pour la saison **à venir** | **Confirmé.** L'achat d'hiver prépare l'année suivante, ce qui est sa raison d'être. |
| FR-42 | Coefficient d'usure modifiable sans redéploiement, calibration non décidée | **Confirmé, et complété** : il part à 1 pour tous les groupes — c'est-à-dire qu'on compte les roulages sans les pondérer — et se calibre sur les données de 2027. |
| FR-60 | Instruments locaux, aucune télémétrie tierce | **Confirmé**, jusqu'au deuxième utilisateur (QO-9). |
| NFR-10 | Quatre taps pour saisir une session | **Écarté.** Le chiffre était inventé. L'exigence réelle est qu'il n'y ait **aucune navigation** : un bouton en pleine largeur sur l'accueil mène au sélecteur. Le nombre de taps est une conséquence de l'écran, pas une cible. |

### 13.2 Les hypothèses héritées du brief

Le registre complet des dix-sept vit dans
l'[addendum du brief](../../briefs/brief-MyPaddock-2026-08-17/addendum.md). Quatre ont bougé depuis,
et c'est le seul intérêt de les reprendre ici :

| # | Hypothèse | Statut au 18 août 2026 |
|---|---|---|
| **A12** | Une PWA hors ligne suffit à tenir la promesse de continuité | **Validée — mais par un autre mécanisme que celui qu'on croyait.** L'exemption liée à l'installation n'est documentée nulle part ; ce qui protège est le mode de stockage persistant. `persist()` devient une exigence (NFR-1), pas une optimisation. |
| **A3** | Le porteur poste un récapitulatif spontanément | **Risque déplacé.** L'API de partage fonctionne ; c'est la destination qui n'est garantie par personne. D'où FR-37, qui rend le produit indépendant d'une cible nommée. QO-3 reste ouverte. |
| **A14** | Un coefficient d'usure par groupe est calibrable | **Inchangée, sans source.** Portée par FR-42 et QO-5. |
| **A15** | Sept domaines sur dix sont livrables pour mars | **Remplacée** par le noyau de décembre (§10.1) et les trois mouvements. La question n'est plus combien de domaines, mais lesquels et à quelle date extérieure. |

---

_Fin du PRD. Prochaines étapes de la chaîne : revue (`bmad-review`, lentille `produit` incluse),
puis `bmad-ux`, `bmad-architecture`, `bmad-create-epics-and-stories`._
