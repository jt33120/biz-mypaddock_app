# Problem Solving Session : la cadence de onze usages par an

**Date :** 18 août 2026
**Problem Solver :** Julian
**Problem Category :** Rétention et conception produit — problème comportemental, pas technique

---

## 🎯 DÉFINITION DU PROBLÈME

### Énoncé initial

Tel qu'il figure au brief MyPaddock, section « Ce que ça coûte » :

> « La cadence naturelle du produit est d'environ onze usages par an, et c'est une contrainte
> structurelle plus qu'un détail. Elle explique trois choses d'un coup : pourquoi le stockage du
> navigateur ne suffit pas, pourquoi un modèle par abonnement serait mal ajusté à ce rythme, et
> pourquoi le mode hors-saison n'est pas une queue de feuille de route mais le seul organe qui
> crée de l'usage en hiver. **Un produit ouvert onze fois par an ne se retient pas ; il doit
> fabriquer lui-même ses occasions d'ouverture.** »

Constat qui a déclenché cette session : aucun des dix domaines du périmètre v1 n'y répond, sauf le
mode hors-saison — livré en novembre 2027, soit onze mois après le premier roulage.

### Énoncé raffiné

L'énoncé initial souffre de trois défauts que la refonte corrige.

**1. « Onze » est un plancher, pas un plafond.** Les parcours du PRD décrivent déjà trois à quatre
ouvertures par roulage — la checklist la veille, la saisie au paddock, le coût le lendemain,
l'entretien au garage. Onze roulages produisent mécaniquement trente à quarante ouvertures. **Le
problème n'est pas la rareté des ouvertures, c'est ce qui se passe entre les grappes.**

**2. Un seul chiffre recouvre deux vides de nature opposée**, qui n'ont ni la même cause ni la même
parade. Les confondre est probablement ce qui rendait le problème insoluble :

| | Le vide inter-roulage | Le vide saisonnier |
|---|---|---|
| **Durée** | 3 à 8 semaines | ~4 mois (novembre → mars) **pour ce pilote-ci ; d'autres roulent toute l'année** |
| **Ce qui casse** | La saisie différée devient une saisie jamais faite | L'habitude et le lien au produit — **alors que l'activité, elle, ne s'arrête pas** |
| **Signal** | Délai roulage → saisie > 48 h | Zéro ouverture entre décembre et février |
| **Scénario du pre-mortem** | « Le troisième roulage » | « Mars n'arrive jamais » |

**3. La recherche technique du 18 août a retiré un tiers du problème.** Le brief affirmait que la
cadence expliquait la purge du stockage. C'est faux depuis ce matin : `navigator.storage.persist()`
accordé sort l'origine du mécanisme d'éviction, et une PWA installée survit à quatre mois de
silence. **Le problème ne porte plus sur la survie technique de la donnée — uniquement sur
l'habitude et le lien.**

**Énoncé retenu :**

> Entre deux roulages, MyPaddock est absent des trois seuls moments où Julian pense déjà à sa moto :
> quand il bricole ou commande des pièces, quand il parle aux potes du groupe, et quand il réserve
> et prépare le suivant. **Le produit ne souffre pas d'une cadence faible — il souffre de ne
> participer à aucune des occasions qui existent déjà.** Le problème se dédouble en un vide
> inter-roulage, où la saisie différée devient une saisie jamais faite, et un vide saisonnier, où
> l'habitude se perd alors même que la donnée survit.

### Contexte

**Les trois occasions réelles**, déclarées par Julian le 18 août 2026, par ordre d'apparition dans
sa réponse :

1. **Bricoler ou commander des pièces.** Entretien, réglages, achat de pneus, plaquettes,
   consommables. **Retourne une prémisse du brief** : celui-ci classe l'entretien dans la corvée
   qu'il faut faire voyager clandestinement avec le plaisir. Or Julian le fait déjà volontairement,
   entre deux roulages, les mains dans la machine. Au moment du geste, la corvée n'en est pas une.
   Le brief se trompait de moment, pas de nature.
2. **Parler aux potes du groupe.** WhatsApp, débriefs, comparaisons de chronos, organisation du
   prochain roulage. La boucle sociale existe déjà et l'application en est absente.
3. **Réserver et préparer le suivant.** Choix du circuit, de l'organisateur, du groupe, logistique.
   **Le déclencheur est extérieur** — c'est l'organisateur qui ouvre les inscriptions. L'application
   peut s'accrocher à un événement qu'elle ne contrôle pas.

**Ce qui a été écarté par la même réponse :** les vidéos embarquées. Julian ne les regarde pas entre
deux roulages. L'analyse du footage 360 figure pourtant dans la Vision du brief comme extension et
au palier 3 de l'échelle de capacité des chronos. **Elle n'est donc pas un levier de rétention** —
ce qui élimine le chemin le plus coûteux avant de l'avoir emprunté.

**Contraintes fermes qui bornent toute solution :**

- Le noyau de premier roulage doit être livrable au **1er décembre 2026**.
- **S'il faut couper, on coupe la corvée, jamais le plaisir.**
- **Aucun mécanisme à série ni à durée limitée** — exclu par une clause de sécurité de second ordre,
  parce qu'ils fabriquent la pression du « encore une session », et que c'est l'enchaînement qui a
  causé la chute fondatrice.
- On ne conseille jamais mécaniquement : on transcrit le barème et on affiche l'état.
- Rien ne vit uniquement dans le navigateur.
- **Sur iOS, rien ne s'exécute ni ne se synchronise pendant que l'application est fermée** — WebKit a
  refusé Background Sync et n'a jamais implémenté Background Fetch. Les notifications push existent
  en revanche pour une PWA installée sur l'écran d'accueil depuis iOS 16.4.

### Critères de succès

Mesurables, et capables d'échouer.

**Le vide inter-roulage est traité si :**

- **Le délai roulage → saisie reste sous 48 heures** sur toute la saison 2027. C'est déjà l'un des
  deux instruments de bord exigés du PRD ; il devient ici le critère de succès direct.
- **Entre deux roulages, au moins une ouverture qui n'est pas une saisie.** C'est la réfutation
  directe du mode d'échec que Julian a nommé lui-même : *« l'application s'ouvre pour être remplie,
  jamais pour être regardée. »*

**Le vide saisonnier est traité si :**

- **L'application est ouverte au moins une fois entre décembre 2026 et février 2027**, sans y avoir
  été poussé par un rappel.
- **En mars 2027, la première saisie de la saison ne ressemble pas à un recommencement** — vérifiable
  par le fait que le délai de cette première saisie n'est pas supérieur aux suivantes.

**Ça a échoué si** un mécanisme de relance a dû être ajouté pour tenir ces chiffres. Une ouverture
obtenue par notification n'est pas une occasion fabriquée par le produit, c'est une occasion
extorquée — et elle tombe sous la même critique que les séries.

---


## 🔍 DIAGNOSE ET ANALYSE DES CAUSES RACINES

### Bornes du problème — analyse Is / Is Not

| Dimension | Le problème EST | Le problème N'EST PAS |
|---|---|---|
| **Où** | À la maison, au garage, téléphone en poche. Partout où rien de physique ne rappelle la moto. | Au paddock — le moment est fort, l'application s'ouvre seule. Ni la veille d'un roulage, où la checklist est une raison suffisante. |
| **Quand** | Quand **aucun déclencheur extérieur** ne provoque une pensée pour la moto. | Quand l'organisateur ouvre ses inscriptions, quand une pièce arrive, quand le groupe écrit. |
| **Qui** | Julian, et **davantage encore le deuxième utilisateur**. | L'organisateur (hors périmètre) et l'acheteur à la revente (lecture unique). |
| **Quoi** | L'absence de participation aux occasions existantes. | Ce n'est **pas** un problème de stockage (résolu le 18 août), **pas** un problème de notification (interdit par clause), **pas** un problème d'onboarding. |

**Trois motifs sortent de ces bornes.**

**1. Les trois occasions réelles sont toutes déclenchées de l'extérieur ou par un objet physique.** Bricoler naît d'une pièce qui arrive ou d'une usure constatée ; parler aux potes naît d'un message reçu ; réserver naît de l'ouverture des inscriptions. **Aucune ne naît de l'application, et l'application n'est branchée sur aucune.**

**2. Le problème est plus grave pour l'utilisateur n°2 que pour l'utilisateur n°1 — et l'utilisateur n°1 ne peut pas le détecter.** Julian ouvre l'application parce qu'il la construit. Cette motivation est massive, continue, et totalement absente chez Kévin. Mesurer la rétention sur soi-même reviendrait à mesurer avec l'instrument le plus biaisé disponible.

**3. Le contenu existe, mais il est statique.** L'album, la courbe, les caps franchis, le budget : tout cela est là. Une galerie déjà vue ne rappelle personne. **Ce n'est pas l'absence de contenu, c'est l'absence de changement.**

### Analyse des causes racines

Deux méthodes appliquées : les **Cinq Pourquoi** sur chacun des deux vides — les chaînes sont linéaires et distinctes — puis la **Pensée systémique** pour les boucles.

#### Chaîne 1 — le vide inter-roulage

> **Symptôme :** Julian n'ouvre pas l'application entre deux roulages.
>
> **1. Pourquoi ?** Parce que rien n'y a changé depuis qu'il l'a fermée.
> **2. Pourquoi ?** Parce que tout état affiché est produit par ses propres saisies.
> **3. Pourquoi ?** Parce que l'application n'a aucune entrée en dehors de lui — ni donnée d'un autre utilisateur, ni flux extérieur, ni calcul qui évolue avec le temps.
> **4. Pourquoi ?** Parce que la v1 est conçue pour un utilisateur unique, et que le cercle ne s'allume que lorsqu'un pote rejoint — ce qui est un critère de succès pour octobre, pas une fonction de mars.
>
> **5. CAUSE RACINE : le produit est un système fermé à un seul scripteur.** Un système fermé à un seul scripteur ne peut jamais surprendre son scripteur. Chaque ouverture entre deux saisies montre exactement ce que la dernière saisie a laissé.

**Conséquence directement actionnable :** pour mériter d'être ouverte, l'application doit contenir **au moins une chose dont l'état change sans que Julian y touche.**

Or l'horloge d'usure — le seul mécanisme « vivant » du produit — avance **à la vitesse du pilote et non du calendrier**. C'est un choix de sécurité délibéré et juste. Mais il a une conséquence non anticipée : **le seul organe vivant du produit ne vit pas entre les roulages.**

#### Chaîne 2 — le vide saisonnier

> **Symptôme :** quatre mois sans ouverture, et en mars la première saisie ressemble à un recommencement.
>
> **1. Pourquoi ?** Parce qu'entre novembre et mars il n'y a pas de roulage, donc pas de saisie, donc pas de raison.
> **2. Pourquoi l'absence de roulage retire-t-elle toute raison ?** Parce que **chaque fonction du produit est indexée sur le roulage**. Le roulage est l'unité de compte.
> **3. Pourquoi est-ce un problème ?** Parce que **la moto, elle, ne cesse pas d'exister en hiver**. Elle est remisée, entretenue, modifiée, parfois vendue.
> **4. Pourquoi le produit ne sert-il pas cette période ?** Parce que le domaine entretien est lui aussi indexé sur le roulage — l'horloge avance avec les roulages — et parce que le mode hors-saison est programmé pour novembre 2027.
>
> **5. CAUSE RACINE : le roulage est la seule unité de compte, et il n'existe pas quatre mois par an.** La machine est un objet continu ; le produit la modélise à travers un événement discontinu.

**Et cette cause racine rencontre exactement la réponse de Julian.** Sa première activité déclarée entre deux roulages — bricoler, commander des pièces — est une activité **de machine**, pas une activité de roulage. Le produit ne la sert pas parce qu'il n'a pas d'axe pour la porter.

### Facteurs contributifs

| Facteur | Nature | Effet |
|---|---|---|
| Scripteur unique | Structurel — cause racine 1 | Aucune surprise possible |
| Roulage comme unique unité de compte | Structurel — cause racine 2 | Quatre mois sans objet |
| Contenu statique entre deux saisies | Conséquence de la cause 1 | Rien ne rappelle |
| Couche sociale volontairement différée | Décision assumée (correctif A7) | Prive le produit de sa seule source externe naturelle |
| Mode hors-saison livré en dernier | Séquencement par le calendrier | Le vide le plus long est traité en dernier |
| L'horloge d'usure avance à la vitesse du pilote | Choix de sécurité — à conserver | Le seul organe vivant s'arrête entre les roulages |
| **Le constructeur ne peut pas mesurer le problème sur lui-même** | Biais de mesure | L'échec restera invisible jusqu'à ce que Julian cesse de coder |

### Dynamiques de système

**Boucle R1 — vertueuse, déjà prévue au brief.** Saisie → récapitulatif → publication → fierté → saisie suivante plus facile. C'est le mécanisme de tête du produit.

**Boucle R2 — vicieuse, et symétrique.** Pas de saisie → trou dans la donnée → courbe moins parlante → récompense plus faible → encore moins de saisie. C'est le scénario du troisième roulage.

**Boucle B1 — équilibrante, et volontairement absente.** La parade standard à R2 est la série, le compteur, la relance. **Elle est interdite par clause de sécurité**, à raison : elle fabrique la pression du « encore une session », l'enchaînement même qui a causé la chute fondatrice. Le produit s'interdit donc son propre stabilisateur, et doit en trouver un autre.

**Boucle R3 — la boucle du constructeur, non déclarée et dangereuse.** Julian ouvre l'application parce qu'il la développe. Tant qu'il code, R2 est entièrement masquée. **La boucle vicieuse ne deviendra observable qu'au moment où le développement s'arrête — c'est-à-dire précisément quand il sera trop tard pour corriger la saison.**

**Le point de levier**, au sens systémique, n'est donc pas dans les boucles de récompense — il est en amont : **ouvrir le système.** Une entrée qui ne vient pas de Julian, ou une unité de compte qui existe quand le roulage n'existe pas.

---

## 📊 ANALYSE

### Analyse du champ de forces

**Forces motrices — ce qui pousse vers la solution**

| Force | Intensité | Influençable ? |
|---|---|---|
| **Les trois occasions existent déjà et sont fréquentes** — le produit n'a pas à en créer, seulement à s'y brancher | forte | oui, directement |
| **Le récapitulatif produit déjà un artefact qui vit hors de l'application** et travaille pendant qu'elle est fermée | forte | oui, sous-exploitée |
| **L'entretien est déjà volontaire** — la prémisse « corvée » était fausse au moment du geste | forte | oui, c'est un renversement gratuit |
| La réservation est déclenchée de l'extérieur — signal de temporalité gratuit | moyenne | partiellement |
| Les notifications push existent sur une PWA installée depuis iOS 16.4 | moyenne | **oui, mais volontairement écartée** — voir plus bas |
| Julian est sincèrement engagé | forte | non — et c'est un piège de mesure |

**Forces de résistance — ce qui bloque**

| Force | Intensité | Influençable ? |
|---|---|---|
| **Le système est fermé à un seul scripteur** | très forte | oui — c'est le point de levier |
| **Le roulage est la seule unité de compte** | très forte | oui — c'est le second point de levier |
| Aucune exécution en arrière-plan sur iOS : rien ne peut se calculer application fermée | forte | non — propriété permanente de la plateforme |
| Interdiction des séries et des compteurs à échéance | forte | **non, et il ne faut pas** — c'est une clause de sécurité |
| La couche sociale n'a aucun contenu tant qu'un pote n'a pas rejoint | forte | partiellement |
| L'échéance du 1er décembre 2026, sur un noyau déjà tendu | forte | non |
| Les soirées de Julian sont la ressource rare | très forte | non |
| **Ma propre clause : une ouverture obtenue par relance est extorquée** | forte | oui, mais je la maintiens |

### Identification de la contrainte

**Contraintes réelles**, à respecter sans discussion : l'absence d'exécution en arrière-plan sur iOS, la date du 1er décembre, l'interdiction des séries, et le nombre de soirées disponibles.

**Contraintes supposées, et fausses :**

- ❌ **« L'application doit fabriquer des occasions d'ouverture. »** Non. Elle doit **participer** à celles qui existent. La formulation du brief programmait la mauvaise solution en énonçant le problème.
- ❌ **« L'entretien est une corvée. »** Réfuté par la réponse de Julian du 18 août : il bricole volontairement entre deux roulages. La corvée n'est pas l'entretien, c'est la **saisie** de l'entretien à un moment où on n'a pas les mains dedans.
- ❌ **« L'hiver a besoin d'un mode dédié. »** À vérifier en étape 5, mais si le produit cesse de tout indexer sur le roulage, l'hiver n'est plus un trou et le mode devient sans objet.
- ❌ **« Onze usages par an. »** Plancher, pas plafond.

**La contrainte au sens de la théorie des contraintes — le goulot qui limite tout le reste :**

> **Le produit est un système fermé à un seul scripteur, indexé sur un événement qui n'arrive que onze fois par an.**

Tout le reste en découle. Augmenter le contenu ne sert à rien tant que ce contenu ne change pas ; ajouter un mode hiver ne sert à rien tant que l'unité de compte disparaît en hiver. **Il n'y a que deux manières de desserrer ce goulot : ouvrir le système à une entrée extérieure, ou lui donner une seconde unité de compte qui existe toute l'année.**

### Enseignements clés

1. **Un système fermé à un seul scripteur ne peut pas surprendre son scripteur.** C'est vrai indépendamment de la qualité du contenu.
2. **La machine est un objet continu ; le roulage est un événement discontinu.** Modéliser le premier à travers le second crée un trou de quatre mois par construction.
3. **Les trois occasions réelles sont machine-centrées ou sociales, jamais roulage-centrées.** Le produit est indexé sur le seul axe qui ne correspond à aucune d'elles.
4. **L'entretien était mal classé.** Le brief en fait la corvée à transporter clandestinement ; c'est en réalité l'activité volontaire la plus fréquente de l'entre-deux.
5. **Le constructeur ne peut pas mesurer ce problème sur lui-même.** Toute validation doit passer par le deuxième utilisateur.
6. **Le récapitulatif est déjà la seule chose qui travaille application fermée.** Le brief le traite comme moteur d'acquisition ; c'est aussi, et peut-être surtout, un organe de rétention.
7. **Le produit s'interdit son propre stabilisateur** — et il a raison. Il doit donc en trouver un qui ne soit pas une série.

<<<SUITE>>>
---

## 💡 GÉNÉRATION DE SOLUTIONS

### Méthodes employées

**Brainstorming inversé** d'abord, pour établir la ligne de base. Puis **bris d'hypothèses**, parce que la diagnose a montré que la formulation du problème contenait elle-même de fausses contraintes. Puis la **matrice de contradiction TRIZ**, parce que le problème est une contradiction propre : augmenter la fréquence d'ouverture sans augmenter la pression.

### Brainstorming inversé — comment rendre cette application maximalement oubliable ?

La question retournée donne cinq recettes. Elles méritent d'être lues lentement.

1. N'afficher que ce que l'utilisateur a saisi lui-même.
2. Indexer toutes les fonctions sur un événement qui n'arrive que onze fois par an.
3. Placer la fonction sociale derrière une condition qui ne se réalisera qu'en octobre.
4. Livrer le mode hiver en novembre, soit onze mois après le premier roulage.
5. Ne rien faire changer entre deux ouvertures.

**La conception actuelle applique les cinq.** Ce n'est pas un jugement, c'est une lecture : chacun de ces cinq points est une décision documentée et défendable du brief, prise pour de bonnes raisons locales. Ensemble, elles composent la recette exacte d'un produit oubliable.

Le renversement de chacune donne directement les cinq directions de solution qui suivent.

### La contradiction TRIZ

> **On veut augmenter la fréquence d'ouverture sans augmenter la pression exercée sur le pilote.**

Contradiction classique « améliorer X sans dégrader Y ». Quatre principes inventifs s'appliquent :

- **Principe 25 — auto-service.** L'objet se sert lui-même : le contenu change sans intervention.
- **Principe 10 — action préalable.** Faire le travail avant qu'il ne soit demandé : la page du prochain roulage existe avant qu'on y pense.
- **Principe 2 — extraction.** Retirer du système la partie qui pose problème : le récapitulatif vit déjà **hors** de l'application.
- **Principe 3 — qualité locale.** Des parties différentes remplissent des fonctions différentes : un axe roulage et un axe machine, chacun dominant à sa saison.

### Solutions générées

#### Famille A — donner au produit une seconde unité de compte : la machine

**S1. La machine comme axe, pas comme sous-menu.** L'application cesse d'indexer tout sur le roulage. La machine devient un objet de premier rang, avec sa propre chronologie continue. *Bris d'hypothèse n°2.*

**S2. Le journal de la machine.** Chaque intervention, pièce, réglage est une entrée datée, indépendante de tout roulage. Alimentable et consultable toute l'année — y compris en janvier, quand aucun roulage n'existe.

**S3. La pièce achetée mais non montée comme état de première classe.** Déjà présente dans le parcours UJ-4, jamais exploitée comme organe de rétention. Elle crée un état qui **attend**, sans échéance et sans pression : la moto a des plaquettes neuves dans un carton. *Principe TRIZ 25.*

**S4. L'état de préparation de la machine** — prête, en cours, immobilisée. Un état que Julian change lui-même, qui reflète une réalité physique, et qui donne une raison de regarder sans rien devoir remplir.

#### Famille B — participer aux occasions existantes plutôt qu'en créer

**S5. Le calendrier des organisateurs suivis.** L'ouverture des inscriptions est un déclencheur extérieur gratuit et récurrent. L'application affiche les dates connues. **Elle ne notifie pas — elle est simplement à jour quand on l'ouvre.** *Principe TRIZ 10.*

**S6. La page du jour, partageable au groupe.** À la réservation, l'application compose la page du roulage : horaires, groupe, météo, règles de contrôle technique, lien du photographe. C'est le rôle « ce vers quoi WhatsApp pointe » que l'addendum avait identifié puis refusé de développer en produit. **Ici ce n'est pas un produit, c'est une page.**

**S7. Le récapitulatif de groupe.** Après un roulage commun, une image montrant les chronos de ceux qui ont accepté de les rendre visibles. L'occasion n'est pas dans l'application, elle est dans le WhatsApp du groupe.

**S8. L'import du chrono par photo de la feuille de temps.** N'ajoute aucune occasion, mais supprime de la friction sur celle qui existe déjà — la photo de la feuille est prise de toute façon.

#### Famille C — rendre le contenu vivant sans le rendre pressant

**S9. L'accueil temporel.** L'application n'a pas d'écran d'accueil fixe : elle ouvre sur ce qui est **le plus proche dans le temps**. Le roulage de dimanche, ou la pièce qui attend d'être montée, ou le bilan de la saison qui vient de finir. *Bris d'hypothèse n°5, principe TRIZ 3.*

**S10. Le compte à rebours factuel — et non injonctif.** Pas « il te reste 23 jours pour préparer », mais « prochain roulage dans 23 jours, à Lédenon, où ton meilleur tour est 1'47"3 ». **Un fait, pas une injonction.** Il change tout seul chaque jour, sans rien demander. C'est la forme la moins chère possible d'un contenu qui bouge.

**S11. La rétrospective à date.** « Il y a un an jour pour jour, ton premier coude au sol. » Le contenu change parce que le temps passe, pas parce qu'une tâche est due. Aucune pression possible : on ne peut pas être en retard sur un souvenir.

**S12. Le budget prévisionnel vivant.** Ce que la saison a coûté à ce jour, projeté sur la saison entière. Se met à jour à chaque dépense — **y compris hors-saison** : assurance, remisage, pièces d'hiver.

#### Famille D — idées sauvages et bris d'hypothèses

**S13. Supprimer le mode hors-saison en tant que domaine.** S'il existe deux unités de compte, l'hiver cesse d'être un trou : c'est simplement la période où l'axe machine domine. Le « mode » devient sans objet. **C'est un domaine en moins à livrer, pas un de plus.** *Bris d'hypothèse n°4.*

**S14. Le récapitulatif de fin de saison, proposé en janvier.** Le moment où tout le monde poste des rétrospectives. L'artefact travaille pendant que l'application dort. *Principe TRIZ 2.*

**S15. Accepter que l'ouverture ne soit pas celle de Julian.** Le récapitulatif partagé, la page du jour envoyée au groupe : le produit vit dans les mains d'autres gens. **Une ouverture par un pote vaut une ouverture.** *Retournement complet du critère.*

**S16. Le carnet exportable comme objet de vente.** Occasion rare mais à très forte valeur — et rétroactivement, elle justifie d'avoir tenu le carnet toute la saison.

**S17. Ne rien faire pour le vide inter-roulage, et tout miser sur le saisonnier.** Option nulle assumée : si les trente à quarante ouvertures annuelles suffisent, le seul vrai problème est l'hiver. À garder comme hypothèse basse.

### Alternatives créatives — les trois qu'il faut refuser explicitement

Ces trois-là fonctionneraient. Elles sont écartées, et il faut dire pourquoi, sinon elles reviendront.

**❌ La notification de relance.** Techniquement disponible : le push existe sur une PWA installée depuis iOS 16.4. **Écartée** — une ouverture obtenue par relance est extorquée, pas fabriquée. Elle tombe sous la même critique que les séries, et elle rendrait les critères de succès de cette session inatteignables par construction. *Une exception étroite serait défendable : une alerte que l'utilisateur pose lui-même sur un fait extérieur — « préviens-moi quand les inscriptions de Lédenon ouvrent ». Ce n'est pas une relance, c'est un service commandé. Hors périmètre v1 faute de source de données organisateurs.*

**❌ La série de saisies et le compteur d'assiduité.** Interdits par clause de sécurité de second ordre.

**❌ Le rappel d'entretien à échéance calendaire.** Séduisant, et doublement interdit : c'est un compteur à échéance, et cela reviendrait à conseiller mécaniquement, ce que la règle de sécurité du brief proscrit. L'horloge d'usure affiche un état ; elle ne réclame rien.

---

## ⚖️ ÉVALUATION DES SOLUTIONS

### Critères d'évaluation

**Filtre éliminatoire, avant toute notation.** Une solution qui échoue à l'un de ces trois points est écartée sans être notée : aucune série ni compteur à échéance ; aucun conseil mécanique ; aucune ouverture obtenue par relance. Les trois alternatives de la famille refusée sont sorties ici.

**Critères notés de 1 à 5, pondérés :**

| Critère | Poids | Pourquoi ce poids |
|---|---|---|
| **Participe à une occasion réelle déclarée** | ×3 | Bricoler, parler aux potes, réserver. C'est le renversement central de la diagnose. |
| **Change sans action de Julian** | ×3 | Attaque la cause racine n°1, le système fermé à un seul scripteur. |
| **Existe quand le roulage n'existe pas** | ×3 | Attaque la cause racine n°2, l'unité de compte unique. |
| **Coût en soirées** *(inversé)* | ×3 | La seule ressource vraiment rare du projet. |
| **Sert le deuxième utilisateur** | ×2 | Julian ne peut pas mesurer le problème sur lui-même. |
| **Livrable pour décembre 2026** | ×2 | Contrainte ferme, mais un bon mécanisme livré en février reste un bon mécanisme. |

### Analyse des solutions

Les dix-sept idées se regroupent en six ensembles cohérents. Noter les ensembles plutôt que les idées évite de recommander un assemblage qui ne tient pas debout.

| Ensemble | Occasion | Change seul | Hors roulage | Coût | 2ᵉ util. | Déc. | **Total /80** |
|---|---|---|---|---|---|---|---|
| **A · Accueil temporel** (S9, S10, S11) | 2 | 5 | 3 | 5 | 4 | 5 | **63** |
| **D · Calendrier des organisateurs** (S5) | 5 | 5 | 5 | 1 | 5 | 1 | **60** |
| **C · Branchement social** (S6, S7, S15) | 5 | 5 | 3 | 2 | 5 | 1 | **57** |
| **B · Axe machine** (S1–S4, S13) | 5 | 2 | 5 | 2 | 4 | 2 | **54** |
| **E · Artefact hors application** (S14, S16) | 3 | 1 | 5 | 4 | 3 | 3 | **51** |
| **F · Option nulle** (S17) | 0 | 0 | 0 | 5 | 0 | 0 | **15** |

**Trois lectures que le classement seul ne donne pas.**

**A gagne parce qu'il est presque gratuit, pas parce qu'il est le plus fort.** L'accueil temporel n'a besoin que de la date du prochain roulage — déjà présente dans le noyau de décembre. Il attaque frontalement la cause racine n°1 pour un coût quasi nul. Mais il a une faiblesse structurelle : **le compte à rebours a besoin d'un roulage à venir.** En décembre, rien n'est réservé. A traite très bien le vide inter-roulage et mal le vide saisonnier.

**D obtient le meilleur profil d'effet et le pire profil de coût — et sa note de coût est une supposition que je ne peux pas étayer.** Je ne sais pas comment les organisateurs publient leurs calendriers. Il n'existe probablement aucune interface programmable ; l'information est dispersée entre sites, pages Facebook et groupes WhatsApp. **Le 1 en coût est une estimation, pas un constat**, et il faudrait le vérifier avant de trancher. Cette incertitude suffit à écarter D de la v1 sans l'écarter du produit.

**B est le seul qui traite la cause racine n°2, et il porte une suppression.** S13 retire le mode hors-saison du périmètre — un domaine en moins, pas un de plus. Son score de coût sous-estime donc son intérêt : la comparaison honnête n'est pas « B contre rien » mais « B contre le mode hors-saison prévu au brief », et à ce jeu B coûte probablement moins.

### Solution recommandée

**Deux mécanismes, un par vide, plus une suppression.** Traiter les deux vides séparément était ta décision d'ouverture ; l'analyse la confirme, parce qu'ils ont des causes racines différentes.

#### ▸ Pour le vide inter-roulage — **l'accueil temporel** (A, plus S3)

L'application n'a pas d'écran d'accueil fixe. Elle ouvre sur **ce qui est le plus proche dans le temps** :

- un roulage réservé → « prochain roulage dans 23 jours, à Lédenon, où ton meilleur tour est 1'47"3 » ;
- une pièce achetée et non montée → « des plaquettes avant t'attendent au garage » ;
- un roulage récent non complété → le coût de la journée, encore vide ;
- rien de tout ça → « il y a un an jour pour jour, ton premier coude au sol ».

**Le test qui garde ce mécanisme du bon côté de la clause de sécurité :** un énoncé factuel, jamais injonctif. *« Prochain roulage dans 23 jours »* est un fait. *« Il te reste 23 jours pour préparer ta moto »* est une échéance déguisée, et tombe sous l'interdiction. La règle est vérifiable à la relecture de chaque libellé.

#### ▸ Pour le vide saisonnier — **la machine comme seconde unité de compte** (B, avec S13)

La machine cesse d'être un sous-menu du roulage et devient un objet de premier rang, avec sa chronologie continue : interventions, pièces, réglages, état de préparation. **Ce qui suit du renversement de la diagnose : bricoler est ta première activité déclarée entre deux roulages, et c'est une activité de machine, pas de roulage.**

Et **le mode hors-saison disparaît du périmètre.** S'il existe deux unités de compte, l'hiver n'est plus un trou : c'est la période où l'axe machine domine. Le domaine 10 du brief est absorbé, pas reporté.

#### ▸ En réserve, avec leur condition d'allumage

- **C — branchement social**, quand un pote roule. La condition existe déjà au brief (correctif A7).
- **D — calendrier des organisateurs**, quand une source de données existe. **À vérifier avant de s'engager.**
- **E — récapitulatif de saison en janvier**, qui réutilise le moteur d'image déjà présent au noyau.

### Justification

**Pourquoi ce couple plutôt que le mieux classé seul.** Le classement récompense A, mais A ne sait pas quoi afficher en décembre quand aucun roulage n'est réservé. B répond exactement là où A est muet. Les deux ensemble couvrent les deux causes racines ; l'un des deux seul en laisse une entière.

**Pourquoi ça respecte la règle de coupe inversée.** L'entretien était classé « corvée » au brief. Ta réponse le déclasse : tu le fais volontairement. Ce que le mécanisme recommandé donne à voir — la pièce qui attend, l'état de la machine — est du côté du **regard**, pas de la saisie. On ne demande rien, on montre. Si la pression de décembre force une coupe, c'est la saisie assistée de l'entretien qui tombe, jamais l'affichage.

**Pourquoi ça tient sur iOS.** Tout se calcule **à l'ouverture**. Rien ne demande d'exécution en arrière-plan — ce que la plateforme interdit de façon permanente. Le mécanisme recommandé est, par construction, immunisé contre la contrainte technique la plus dure établie ce matin.

**Ce qui reste préoccupant, et que je ne masque pas.**

1. **B est un changement de schéma de données, pas un écran.** Il doit être décidé en décembre même s'il est livré en février — un axe machine ajouté après coup coûte bien plus qu'un axe machine prévu.
2. **A pourrait ne rien avoir à dire pendant de longues périodes.** Si aucun roulage n'est réservé, aucune pièce n'attend et aucun anniversaire ne tombe, l'accueil temporel affiche du vide. **Et un écran vide ne sous-délivre pas, il signale l'abandon** — c'est la règle du brief qui a tué douze domaines. À traiter à la conception, pas à l'exécution.
3. **Aucun de ces mécanismes n'ouvre réellement le système.** Ils contournent la cause racine n°1 en faisant changer le contenu avec le temps, mais le seul scripteur reste Julian. **Seul C ouvre vraiment le système** — et il dépend d'un pote qui n'est pas encore là. C'est une faiblesse assumée, pas résolue.

---

## 🚀 PLAN DE MISE EN ŒUVRE

### Approche

**Trois mouvements, séquencés par le calendrier** — conformément au principe du brief selon lequel l'ordre de livraison n'est pas un arbitrage de priorités mais une conséquence de la date à laquelle chaque chose devient utile.

Pas de grand soir. Le premier mouvement entre dans le noyau parce qu'il est presque gratuit ; le deuxième se construit **pendant la période qu'il sert**, ce qui en fait son propre banc d'essai ; le troisième s'allume sur condition.

### Étapes d'action

#### ▸ Mouvement 1 — avant le 1er décembre 2026, dans le noyau

**A1. Décider le schéma à deux axes.** Roulage et machine, dès la première ligne de modèle de données, **même si l'axe machine n'a aucun écran en décembre.** C'est la seule action de cette liste dont le coût explose si elle est différée : un axe ajouté après coup se paie en migration.

**A2. Construire l'accueil temporel avec les deux seules sources disponibles au noyau** — la date du prochain roulage, et un roulage récent dont le coût n'est pas saisi. Deux cas suffisent à faire changer l'écran sans que Julian touche à rien.

**A3. Écrire la règle du libellé factuel au PRD, comme exigence vérifiable.** Tout libellé de l'accueil énonce un fait, jamais une échéance. Contrôlable à la relecture, ligne par ligne.

**A4. Instrumenter avant d'avoir besoin de l'instrument.** Les deux mesures déjà exigées par le brief — délai roulage → saisie, récapitulatifs générés contre postés — plus une troisième née de cette session : **les ouvertures sans saisie.** Elles doivent exister dans la première version, sinon l'échec ne se verra qu'en octobre.

**A5. Recruter Kévin.** Ce n'est pas une action de développement, et c'est pourtant la plus importante du plan : sans un deuxième utilisateur, aucune des mesures ci-dessus n'est interprétable.

#### ▸ Mouvement 2 — décembre 2026 à février 2027, pendant le premier vide saisonnier réel

**A6. Le journal de la machine.** Interventions datées, indépendantes de tout roulage.

**A7. La pièce achetée et non montée**, comme état de première classe et non comme ligne de dépense.

**A8. Brancher l'accueil temporel sur ces deux nouvelles sources.** L'écran cesse alors de dépendre de l'existence d'un roulage à venir — c'est ce qui referme le vide saisonnier.

**A9. Retirer le mode hors-saison du périmètre**, et mettre le PRD à jour en conséquence. Le domaine 10 est absorbé, pas reporté.

#### ▸ Mouvement 3 — pendant la saison 2027, sur condition

**A10. La page du jour**, composée à la réservation et partageable au groupe.

**A11. La visibilité opt-in des chronos et le récapitulatif de groupe** — s'allument quand un pote roule, condition déjà posée par le correctif A7 du brief.

**A12. Le récapitulatif de saison**, proposé en janvier 2028.

**A13. Vérifier la faisabilité du calendrier des organisateurs avant de s'y engager.** Ma note de coût sur cet ensemble est une supposition ; il faut l'établir.

### Jalons

Ancrés sur des dates extérieures fixes, jamais sur une estimation d'effort.

| Jalon | Date | Ce qui doit être vrai |
|---|---|---|
| **Schéma arrêté** | avant tout code de noyau | Deux axes, roulage et machine |
| **Noyau de premier roulage** | 1ᵉʳ décembre 2026 | A1 à A4 livrés, A5 engagé |
| **Premier vide saisonnier** | décembre 2026 → février 2027 | A6 à A9 se construisent pendant qu'il se vit |
| **Premier roulage de la saison** | mars 2027 | L'accueil temporel a tenu quatre mois sans roulage |
| **Le troisième roulage** | ~mai 2027 | Le délai de saisie est resté sous 48 h |
| **Bilan** | octobre 2027 | Les quatre critères de succès sont mesurés |

### Ressources nécessaires

**Une seule, et elle est rare : les soirées de Julian.** Le brief l'a établi — les soirées qui servent à construire sont exactement celles qui serviront à remplir, et le développement doit être fini avant que la saison commence.

Le mouvement 2 est le seul qui échappe à cette tension, parce qu'il se construit en hiver, quand il n'y a rien à saisir. C'est un argument en sa faveur qui n'apparaît dans aucun critère de la matrice.

**Aucune ressource financière nouvelle.** Aucun des mécanismes retenus n'appelle de service tiers.

### Parties responsables

Julian, pour tout — c'est un projet solo. Avec une exception qui n'en est pas une : **la validation dépend de Kévin**, et Kévin n'est pas une ressource qu'on planifie. A5 est donc la seule action du plan dont l'issue ne dépend pas de son auteur.

---

## 📈 SURVEILLANCE ET VALIDATION

### Mesures de succès

| # | Mesure | Cible | Valide |
|---|---|---|---|
| **M1** | Délai roulage → saisie | < 48 h sur toute la saison | Accueil temporel, cas « roulage récent incomplet » |
| **M2** | Ouvertures **sans saisie**, par intervalle inter-roulage | ≥ 1 | La réfutation directe de « s'ouvre pour être remplie, jamais pour être regardée » |
| **M3** | Ouvertures entre décembre 2026 et février 2027 | ≥ 1, **sans relance** | Axe machine + accueil temporel |
| **M4** | Délai de la première saisie de mars 2027 | ≤ médiane de la saison | Que mars ne soit pas un recommencement |
| **M5** | Kévin ouvre entre deux roulages | au moins une fois | **La seule mesure non contaminée par le biais du constructeur** |

### Contre-mesures — à ne surtout pas optimiser

| # | Contre-mesure | Cible | Pourquoi |
|---|---|---|---|
| **C1** | Notifications de relance envoyées | **0** | Si ce chiffre monte, la solution recommandée a échoué et a été remplacée par celle qui est interdite. C'est le signal d'échec le plus important du dispositif. |
| **C2** | Ouvertures servant un accueil vide | proche de 0 | Un écran vide ne sous-délivre pas, il signale l'abandon. |
| **C3** | Temps passé par ouverture | **à ne pas maximiser** | Un produit ouvert onze fois par an dont le temps de session s'allonge est probablement utilisé pour une mauvaise raison. |

### Plan de validation

**Le biais du constructeur est le problème central de toute validation ici.** Julian ouvre l'application parce qu'il la développe ; ses propres ouvertures sont contaminées et le resteront jusqu'à la fin du développement — c'est-à-dire jusqu'en mars, soit après la période que la solution est censée couvrir.

Trois parades, par ordre de fiabilité :

1. **Valider sur Kévin** (M5). C'est la seule mesure propre. Elle exige que A5 soit réellement fait.
2. **Distinguer les ouvertures « pendant une session de développement »** des autres dans l'instrumentation. Imparfait, mais mécanisable.
3. **Traiter l'hiver 2026-2027 comme un banc d'essai réel et non simulé.** Le vide saisonnier se produira pour de vrai, aux dates réelles, avec la vraie moto. C'est le meilleur pilote possible — à condition de ne pas confondre les ouvertures de développeur avec les ouvertures d'utilisateur.

**La preuve recherchée** est un graphique simple : les ouvertures dans le temps, avec les dates de roulage marquées. Si les ouvertures ne forment que des pics sur les roulages, la solution a échoué. Si des ouvertures existent dans les creux, elle fonctionne.

### Atténuation des risques

| Risque | Détection précoce | Parade |
|---|---|---|
| **La boucle du constructeur masque l'échec jusqu'à ce qu'il soit trop tard** | M5 reste à zéro alors que M2 est bon | Ne jamais conclure sur les seules données de Julian |
| **L'axe machine est une extension de périmètre déguisée en réduction** | Le mouvement 2 déborde sur mars | La comparaison honnête est « axe machine contre mode hors-saison », pas « contre rien ». Si le premier coûte plus que le second, S13 ne tient plus |
| **L'accueil temporel dérive vers l'injonctif** | Un libellé contient « il te reste », « pense à », « n'oublie pas » | A3 en fait une exigence relisible ligne par ligne |
| **L'accueil temporel n'a rien à dire** | C2 monte | Prévu à la conception, pas à l'exécution : définir dès A2 ce qui s'affiche quand les trois sources sont muettes |
| ~~Le bricolage est lui aussi saisonnier~~ | — | **Risque levé le 18 août — voir la révision en fin de document. L'hiver est la période de plus forte activité machine, pas la plus faible.** |

**Le trou que j'avais nommé, et sa levée.** J'avais inféré de « il bricole entre deux roulages » qu'il bricole aussi en janvier — inférence non déclarée, signalée comme l'hypothèse la plus portante et non vérifiée de la session. **Elle a été vérifiée le 18 août et se révèle vraie, mais en plus fort que prévu :** l'hiver n'est pas une période de faible activité machine, c'est la période de **plus forte** activité. Voir la révision en fin de document, qui enrichit la recommandation en conséquence.

### Déclencheurs d'ajustement

- **M1 dépasse 48 h une seule fois** → l'accueil temporel ne suffit pas sur le vide inter-roulage. Escalader vers C, le branchement social, avant d'envisager quoi que ce soit d'autre.
- **M3 reste à zéro fin février 2027** → soit l'axe machine n'a pas été livré, soit le bricolage hivernal n'existe pas. Vérifier lequel des deux **avant** de concevoir une parade.
- **L'envie d'ajouter une notification apparaît** → c'est le signal que le mécanisme a échoué, pas que la notification est nécessaire. Revenir à la diagnose plutôt qu'à l'interdit.
- **M5 reste à zéro alors que M2 est bon** → la solution ne sert que son constructeur. C'est le pire résultat possible, et il ressemble de loin à un succès.

---

## 📝 ENSEIGNEMENTS

### Enseignements clés

1. **L'énoncé du problème contenait sa propre mauvaise solution.** « Le produit doit fabriquer ses occasions d'ouverture » programme la fabrication d'occasions — donc les relances, les séries, les notifications. La formulation juste est qu'il doit **participer** aux occasions qui existent déjà. Une phrase de brief peut orienter six mois de conception.

2. **Un système fermé à un seul scripteur ne peut pas surprendre son scripteur.** Indépendamment de la qualité du contenu. C'est une propriété de structure, pas de contenu — et c'est pour ça qu'ajouter des fonctions n'aurait rien réglé.

3. **La réponse de l'utilisateur a réfuté une prémisse du document.** Le brief classe l'entretien dans la corvée. Julian le fait volontairement entre deux roulages. Trois sessions de travail avaient bâti sur cette prémisse sans que personne la teste — il a suffi de demander ce qu'il fait, plutôt que ce que le produit devrait faire.

4. **La réponse au vide de l'hiver était de retirer un domaine, pas d'en ajouter un.** Le brief prévoyait un mode hors-saison. La bonne solution rend ce mode inutile en changeant l'unité de compte. Une solution qui réduit le périmètre est presque toujours suspecte de trop belle simplicité ; celle-ci résiste parce qu'elle attaque la cause racine.

5. **Le constructeur ne peut pas mesurer la rétention sur lui-même.** Et le mode d'échec correspondant ressemble de loin à un succès.

6. **Deux clauses de sécurité interdisaient la parade standard — et c'est ce qui a forcé une meilleure réponse.** Sans l'interdiction des séries, l'analyse se serait arrêtée à un compteur d'assiduité. Une contrainte bien posée est un instrument de conception.

7. **Une inférence non déclarée peut porter tout un plan.** J'avais déduit « il bricole en janvier » de « il bricole entre deux roulages ». L'avoir signalée plutôt que masquée a permis de la vérifier en une question — et la vérification a changé la recommandation.

8. **La recherche technique du matin a rétréci le problème avant qu'on l'attaque.** Un tiers de ce que le brief attribuait à la cadence — la purge du stockage — n'existe plus. Faire la recherche avant la résolution a évité de concevoir contre un risque disparu.

### Ce qui a fonctionné

- **Demander ce que Julian fait réellement**, plutôt que ce que le produit devrait faire. Les trois occasions étaient déjà là ; il suffisait de les nommer.
- **Le brainstorming inversé comme premier coup**, avant toute génération. Découvrir que la conception actuelle applique les cinq recettes de l'oubli a cadré tout le reste.
- **Refuser de confondre les deux vides.** C'était ta décision d'ouverture et elle a tenu jusqu'au bout : les deux causes racines se sont révélées différentes.
- **Traiter « onze usages par an » comme une affirmation à tester** et non comme un fait. C'était un plancher.
- **Noter des ensembles cohérents** plutôt que dix-sept idées isolées. Le classement d'idées seules aurait recommandé un assemblage qui ne tient pas debout.

### Ce qu'il faut éviter

- **Prendre l'énoncé d'un brief pour argent comptant**, même quand il vient de cinq méthodes d'élicitation avancée. Celui-ci contenait deux fausses contraintes et un chiffre trompeur.
- **Confondre l'absence de contenu et l'absence de changement.** Le produit a du contenu ; il n'a pas de mouvement.
- **Laisser passer « il faut un mode hiver »** sans demander pourquoi l'hiver serait un trou.
- **Conclure sur les données du constructeur.**
- **Déduire d'une réponse ce qu'elle ne dit pas.** J'ai inféré « il bricole en janvier » de « il bricole entre deux roulages ». C'est signalé au registre des risques, et c'est exactement le genre d'inférence qui se glisse sans bruit dans un plan.

---

_Généré avec BMAD Creative Intelligence Suite — Problem Solving Workflow_

_Révisé le 18 août 2026 après vérification de l'hypothèse hivernale._
---

## 🔄 RÉVISION — 18 août 2026, après vérification de l'hypothèse hivernale

L'hypothèse la plus portante de la session — « Julian bricole aussi en janvier » — a été posée en question et non laissée en risque. La réponse la valide **et déplace deux choses**.

### Ce qui change n°1 — le produit ne doit pas être saisonnier

> « Il faut rester flexible, certaines personnes roulent toute l'année, on n'a pas besoin de faire une app saisonnière. »

J'avais traité le vide saisonnier comme une propriété **du produit**. C'est une propriété **de cette pratique-ci**. Un pilote qui roule en janvier n'a aucun vide saisonnier, et un produit qui basculerait en « mode hiver » à une date de calendrier lui donnerait tort.

**Règle de conception qui en découle, et qui vaut pour tout le PRD :**

> **Aucun comportement du produit n'est piloté par le calendrier.** Le produit réagit à des **états** — un roulage est-il à venir ? un travail est-il en cours sur la machine ? — jamais à un mois de l'année.

**Précision apportée par Julian le 18 août :** *« Décembre est la fin pour moi mais peut-être le début pour quelqu'un d'autre. C'est plutôt deux volets, saison et hors-saison, et être flexible sur les mois. »*

Les deux volets sont donc des **états dérivés**, pas des dates :

- **La saison** court du premier roulage saisi de l'année au dernier. **Le hors-saison** est tout le reste.
- Cette définition ne demande **aucun réglage**, se calcule sur des données déjà saisies, et fonctionne telle quelle pour un pilote qui roule en janvier.
- Un réglage reste possible pour qui veut nommer sa saison autrement — **jamais comme étape d'installation**. Le memlog du brief avait déjà identifié le risque de « l'écran de réglages que personne ne configure ».

Et le produit n'a en réalité pas besoin de la notion pour fonctionner au quotidien : l'accueil temporel se contente de « y a-t-il un roulage à venir ? » et « y a-t-il du travail en cours ? ». **Le volet n'est utile qu'au bilan** — il faut bien savoir ce qu'une saison contient pour la totaliser.

L'accueil temporel y satisfait déjà par construction : il ouvre sur ce qui est le plus proche **dans le temps**, pas sur ce qu'indique le calendrier. C'était un heureux hasard ; c'est maintenant une exigence.

Et cela **renforce la suppression du mode hors-saison** au lieu de l'affaiblir : un mode déclenché par une date serait faux pour une partie des utilisateurs, alors qu'un axe machine est juste pour tous.

### Ce qui change n°2 — l'hiver n'est pas un trou, c'est la saison d'atelier

> « L'hiver, c'est là où on fait les plus gros travaux, du design pour la préparer pour la saison prochaine. On achète car c'est souvent moins cher, on prépare, on fait les gros travaux, on essaye d'améliorer — cartographie, meilleurs composants — et on planifie peut-être quelques gros événements de la saison d'après. »

Le brief appelait cette période « le trou ». **C'est l'inverse d'un trou : c'est la période de plus forte activité machine de l'année.** Le produit n'a pas une saison et un vide — il en a deux, qui alternent :

| | **La saison de piste** | **La saison d'atelier** |
|---|---|---|
| Unité de compte | Le roulage | La machine |
| Ce qu'on y fait | Rouler, chronométrer, dépenser en journées | Améliorer, acheter, préparer, planifier |
| Ce qui change | Les chronos, l'usure, l'album | **La machine elle-même** |
| Rythme des dépenses | Par journée, régulier | Par gros achats, opportuniste |

**Le mot « trou » était l'erreur d'origine.** Il a produit un « mode hors-saison » relégué en fin de feuille de route, alors que la bonne réponse était une seconde unité de compte de plein exercice.

### Ce que la révision ajoute à la solution recommandée

Cinq activités hivernales ont été déclarées. Trois d'entre elles ne sont **pas** de l'entretien, et n'ont aucun objet dans le périmètre actuel.

**R-A. La machine a des versions, pas seulement un entretien.** Cartographie, meilleurs composants : la moto de mars n'est pas celle d'octobre. Le brief ne modélise que la remise à neuf d'un poste d'usure. Il faut la notion de **changement de définition de la machine** — et elle porte trois conséquences en cascade :
- l'horloge d'usure d'un composant remplacé repart, mais celle d'un composant **amélioré** repart sur un autre barème ;
- le carnet de revente gagne son argument le plus fort — un acheteur veut savoir ce qui a été amélioré, pas seulement ce qui a été entretenu ;
- la règle de sécurité s'applique intégralement : **on consigne ce que le propriétaire déclare avoir monté, on ne certifie rien.**

**R-B. Une dépense peut n'avoir aucun roulage auquel se rattacher.** Le brief indexe le coût sur la journée : « coût de la journée », « coût au tour ». Un train de pneus acheté en janvier parce qu'il est moins cher n'a pas de journée. **Le modèle de coût doit accepter une dépense rattachée à la machine ou à la saison, pas seulement à un roulage** — sans quoi la moitié du budget réel échappe au suivi, et la clause « le coût au tour ne s'affiche jamais seul, toujours contre le budget de saison consommé » devient inapplicable, faute d'un budget de saison complet.

**R-C. La planification de la saison suivante est un objet, pas une intention.** « On planifie quelques gros événements de la saison d'après » : ce sont des roulages qui n'existent pas encore, désirés avant d'être réservés. Un objet léger — un événement visé, avec sa date approximative et son coût estimé — alimente directement le budget prévisionnel et **donne à l'accueil temporel quelque chose à montrer en décembre**, quand rien n'est encore réservé. C'est précisément la faiblesse que l'évaluation avait identifiée sur l'ensemble A.

**R-D. La réparation non vitale est une troisième catégorie, et c'est la découverte la plus exploitable de la révision.** Ce que Julian appelait « design » est précis : *« tu répares des aspects cosmétiques non importants pendant la saison pour repartir à neuf — levier, plastiques, stickers. Ce n'est pas de la maintenance, ce sont des réparations non vitales. »*

Le produit n'avait que deux catégories : l'entretien, qui touche à la sécurité et suit un barème constructeur, et l'amélioration, qui change la définition de la machine. **Il en manque une troisième**, définie non par ce qu'elle répare mais par le fait qu'elle **peut attendre** :

| | Entretien | Amélioration | **Réparation non vitale** |
|---|---|---|---|
| Touche à la sécurité | oui | parfois | **non, par définition** |
| Suit un barème | oui | non | **non** |
| Peut être repoussée | non | oui | **oui, et elle l'est systématiquement** |
| Quand elle se fait | dès l'échéance | quand le budget suit | **en hiver, en bloc** |

Quatre propriétés en font un objet de produit à part entière, et bon marché :

1. **C'est la seule chose du produit qui se remplit en saison et se vide en hiver.** Elle relie naturellement les deux unités de compte, là où tout le reste appartient à l'une ou à l'autre.
2. **Elle se remplit avec un geste déjà au périmètre** : la photo. Le levier tordu se photographie au paddock, où le téléphone est déjà en main — et devient une ligne sans rien remplir.
3. **Elle donne à l'accueil temporel quelque chose à montrer en décembre**, quand aucun roulage n'est réservé : *« sept réparations en attente »*. C'est exactement la faiblesse que l'évaluation avait identifiée sur l'ensemble A.
4. **Elle échappe à toutes les clauses de sécurité** : rien de vital, donc aucun barème à transcrire, aucun risque de conseil mécanique, aucune échéance à faire courir.

**Le risque de second ordre qui va avec, et qu'il faut poser tout de suite.** Ces trois catégories ne doivent **jamais cohabiter dans une même liste**. Si « plaquettes en fin de vie » s'affiche à côté de « sticker décollé », l'élément de sécurité hérite du caractère repoussable du cosmétique — et la liste des choses qui peuvent attendre finit par contenir une chose qui ne peut pas. C'est exactement le mécanisme que les clauses de second ordre du brief ont été écrites pour attraper : **un affichage plaisant qui, suivi d'un cran, dégrade la sécurité.**

### Ce que la révision ne change pas

- **L'accueil temporel reste le mécanisme du vide inter-roulage**, et reste dans le noyau de décembre.
- **Les deux causes racines tiennent** : système fermé à un seul scripteur, et unité de compte unique.
- **La suppression du mode hors-saison tient**, et se renforce.
- **Le mouvement 2 reste construit pendant l'hiver 2026-2027**, ce qui reste son meilleur banc d'essai — sous la même réserve du biais de constructeur.

### Effet net sur les critères de succès

La mesure **M3** — « au moins une ouverture entre décembre 2026 et février 2027 » — était calibrée sur l'hypothèse d'une période creuse. Elle est **trop indulgente** au regard de ce qui vient d'être décrit : si l'hiver est la période de plus forte activité machine, une seule ouverture en trois mois serait un échec, pas un succès.

> **M3 révisée : au moins une ouverture par mois entre décembre 2026 et février 2027, sans relance.** Et une mesure nouvelle, **M6 : au moins une dépense hivernale consignée** — c'est le test le plus direct de R-B.

<<<REV>>>
