---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - prds/prd-MyPaddock-2026-08-18/prd.md
  - architecture/architecture-MyPaddock-2026-08-18/ARCHITECTURE-SPINE.md
  - ux-designs/ux-MyPaddock-2026-08-18/DESIGN.md
  - ux-designs/ux-MyPaddock-2026-08-18/EXPERIENCE.md
  - ../../_bmad/custom/mypaddock-contraintes.md
---

# MyPaddock — Découpage en épiques et récits

Ce document convertit 62 exigences fonctionnelles, 19 non fonctionnelles et 20 décisions
d'architecture en travail livrable **en soirées, par une personne seule**.

Il a un second rôle, et c'est le plus important : **répondre à QO-10**, la question ouverte la plus
lourde du projet, que l'architecture a explicitement laissée à cette étape.

---

## QO-10 — Le noyau tient-il d'ici le 1er décembre 2026 ?

### La réponse courte

**Non, pas tel qu'il est écrit. Oui, avec trois coupes** — dont deux figurent déjà dans la règle du
§10.1 du PRD, et une troisième que je propose avec son rationnel.

### Le calcul, posé pour être contesté

**Ce qui est disponible.** Du 18 août au 1er décembre 2026 : **105 jours**, soit 15 semaines. Une
personne qui a un travail et qui roule encore — le calendrier de Pau-Arnos relevé le 18 août montre
des roulages en septembre, octobre **et novembre** — ne dispose pas de sept soirées par semaine.

> **`[ASSUMPTION]` — 3 soirées productives par semaine, environ 2 heures chacune, soit ≈ 45 soirées
> utiles.** C'est le chiffre le plus contestable de ce document et tout le reste en dépend. Julian
> est le seul à pouvoir le corriger, et une correction de ±10 soirées change la conclusion.

**Ce qui est demandé.** Chaque récit ci-dessous est dimensionné à **une ou deux soirées**. Le total
du noyau tel qu'écrit au §10.1 :

| Épique | Soirées |
|---|---|
| 0 · Sondes et préconditions | 5 |
| 1 · Le schéma à deux axes | 6 |
| 2 · Le roulage et le chrono | 9 |
| 3 · La photo et le geste | 5 |
| 4 · Le récapitulatif | 6 |
| 5 · Le coût *(avec reconnaissance de reçu)* | 8 |
| 6 · L'accueil temporel | 5 |
| 7 · Les instruments | 2 |
| **Total** | **46** |

**46 demandées contre 45 disponibles.** Ce n'est pas « ça passe de justesse » — c'est **zéro marge
sur un chantier solo daté**, et l'estimation elle-même est optimiste par construction. Sur un projet
en soirées, zéro marge se lit **non**.

### Les trois coupes, et pourquoi celles-là

**Coupe 1 — la reconnaissance de reçu (FR-25). −3 soirées.** C'est la première ligne de la règle de
coupe du §10.1, écrite à l'avance et sans discussion. La saisie manuelle d'un montant reste
possible ; l'exigence dit déjà que la correction manuelle prime toujours. **La fonction ne disparaît
pas, elle perd son raccourci.**

**Coupe 2 — l'accueil réarrangeable (FR-15, zone des chiffres). −2 soirées.** Ce n'est pas dans la
règle écrite, alors voici le rationnel. FR-15 exige que **la disposition par défaut soit complète et
utilisable telle quelle** ; livrer sans le réarrangement ne retire donc rien au premier jour. Et la
zone temporelle — celle qui fait exister le produit entre deux roulages — n'est pas réarrangeable de
toute façon. **On coupe la personnalisation, pas le mécanisme.** Julian avait tranché contre ma
recommandation pour obtenir cette fonction : elle revient au mouvement 2, elle n'est pas annulée.

**Coupe 3 — le catalogue d'achievements pilotable par la donnée se réduit à sa forme minimale.
−1 soirée.** AD-10 exige qu'on puisse ajouter un cap **sans redéploiement**. Trois lignes dans une
table le satisfont. L'éditeur, l'évaluateur de conditions complexes et la gestion de versions
attendent le mouvement 2. **L'invariant est tenu, l'outillage attend.**

### Le verdict

**40 soirées demandées contre ≈ 45 disponibles — cinq soirées de marge, soit 11 %.**

> **Correction assumée.** J'avais d'abord écrit 37 : une erreur d'addition dans mon propre calcul,
> corrigée après avoir totalisé les récits un par un. La marge réelle est **plus mince que ce que
> j'annonçais**, et c'est exactement le genre de chiffre qu'il ne faut pas arrondir dans le bon sens.

**Onze pour cent de marge sur un chantier solo en soirées, c'est tendu.** La conclusion tient — le
noyau coupé est constructible — mais **sans aucune place pour une mauvaise surprise**. La première
semaine perdue mange la moitié de la marge.

**Ce que ce calcul ne dit pas, et qu'il faut voir.** Il suppose que rien ne casse, que PowerSync se
comporte comme documenté sur une PWA iOS installée — **ce qui n'est pas vérifié**, d'où l'épique 0 —
et que Julian ne perd pas trois soirées sur un problème de synchronisation. **C'est exactement
pourquoi les sondes passent en premier** : si l'épique 0 révèle que le SDK web ne tient pas sur iOS,
la question n'est plus le découpage, c'est le choix du moteur, et il vaut mieux l'apprendre le
25 août que le 20 novembre.

### Si la marge disparaît quand même

À 11 %, ce n'est plus une hypothèse d'école : **une seule semaine perdue déclenche cette liste.**

L'ordre de coupe suivant, décidé maintenant et à froid plutôt qu'en novembre et sous pression :

1. Les **sessions** (FR-8) — le roulage garde son meilleur tour sans détail de session. −1
2. Le **troisième gabarit** de récapitulatif — *perf* et *geste* suffisent, *budget* attend. −1
3. La **synchronisation** — le noyau tourne en local pur pendant quelques semaines et se synchronise
   avant le premier roulage de mars. **⚠️ Cette coupe-là est dangereuse** : elle rend vraie, pendant
   sa durée, la phrase « ma saison a disparu ». À ne prendre qu'en dernier recours et avec une date
   de fin.

**Et ce qui ne se coupe jamais, quel que soit le retard :** la photo, le geste, le récapitulatif, et
les trois instruments. Les trois premiers parce que c'est le plaisir qui transporte la corvée. Les
instruments parce que sans eux, l'échec ne se constate qu'en octobre 2027.

---

## Inventaire des exigences

### Exigences fonctionnelles

**62 exigences, FR-1 à FR-60 plus FR-6bis et FR-39bis**, définies au §4 du
[PRD](prds/prd-MyPaddock-2026-08-18/prd.md). Elles ne sont pas recopiées ici : le PRD fait foi et
une copie divergerait. Le découpage par domaine :

| Domaine | FR | Mouvement |
|---|---|---|
| §4.1 Socle — deux axes, compte, machine | FR-1 → FR-5 | **Noyau** |
| §4.2 Le roulage | FR-6, FR-6bis → FR-10 | **Noyau** |
| §4.3 L'accueil temporel | FR-11 → FR-15 | **Noyau** *(FR-15 partiel)* |
| §4.4 Chronos | FR-16 → FR-20 | **Noyau** *(sauf FR-20)* |
| §4.5 Le coût | FR-21 → FR-27 | **Noyau** *(sauf FR-25)* |
| §4.6 Gestes et achievements | FR-28 → FR-31 | **Noyau** |
| §4.7 Photos et album | FR-32 | **Noyau** |
| §4.8 Le récapitulatif | FR-33 → FR-37 | **Noyau** |
| §4.9 Cercle et carnet | FR-38, FR-39, FR-39bis | Mouvement 3 |
| §4.10 Entretien et usure | FR-40 → FR-45 | Mouvement 2 et 3 |
| §4.11 Réparation non vitale | FR-46 → FR-48 | Mouvement 2 |
| §4.12 Checklist et conformité | FR-49 → FR-51 | Mouvement 3 |
| §4.13 Saison et projection | FR-52 → FR-56 | Mouvement 2 et 3 |
| §4.14 Instruments de bord | FR-57 → FR-60 | **Noyau** |

### Exigences non fonctionnelles

**19 exigences, NFR-1 à NFR-18 plus NFR-14bis**, §5 du PRD. Celles qui produisent du travail dans
le noyau :

- **NFR-1 à NFR-6** — continuité : `persist()` à chaque ouverture avec état exposé, aucune donnée en
  requête en attente, aucune exécution en arrière-plan, désinstallation destructrice pour le local,
  pas de `localStorage` métier ni de Storage Buckets, export récupérable.
- **NFR-7 à NFR-10** — le paddock : hors ligne intégral, cibles ≥ 56 px, lisibilité au soleil,
  aucune navigation pour saisir un chrono.
- **NFR-11, NFR-12** — partage et composition : `canShare` avec l'objet exact, `AbortError`
  silencieux, même origine ou CORS, `blob.type` vérifié après coup, polices explicites en Worker.
- **NFR-13, NFR-14, NFR-14bis** — le téléphone n'est jamais le capteur, catalogue et barème en
  donnée, produit compréhensible par quelqu'un qui a oublié.
- **NFR-16 à NFR-18** — la peau ne ralentit pas la corvée, `#B026FF` réservé aux gros éléments,
  licence de fonte.

### Exigences supplémentaires — architecture

Aucun starter n'est imposé : la pile est **React + Vite + TypeScript**, montée à la main. Les 20 AD
de la [colonne vertébrale](architecture/architecture-MyPaddock-2026-08-18/ARCHITECTURE-SPINE.md)
sont des invariants et non des tâches, sauf ceux qui produisent du travail explicite :

- **AD-2, AD-14** — schéma à deux axes, UUID v7 côté client. → Récit 1.1
- **AD-5** — `persist()` et son état d'interface. → Récits 0.2 et 1.4
- **AD-11, AD-12** — provenance des données récoltées, surcouche de correction sous RLS, rôle de
  base distinct sans droit d'écriture sur les tables de pilote. → Mouvement 3
- **AD-13** — les trois pièges silencieux de la composition d'image. → Récit 4.1
- **AD-15** — aucun secret dans la PWA. → Récit 0.3
- **AD-16, AD-20** — trois mesures exactement, par le chemin d'écriture normal. → Récit 7.1
- **AD-17, AD-18, AD-19** — coût d'une machine, saison en entier d'année, usure par session. →
  Récits 5.1 et mouvement 3

### Exigences de conception — UX

Extraites des deux épines, chacune produisant du travail identifiable :

- **UX-DR1** — Le système de tokens complet : 18 couleurs, 3 familles typographiques, grille de 4 px,
  échelles HUD et texte. → Récit 2.5
- **UX-DR2** — Les fontes **intégrées en data URI** : Press Start 2P, Chakra Petch, et la script
  racing. Aucun CDN — le produit doit démarrer hors ligne au paddock. → Récits 0.4 et 2.5
- **UX-DR3** — `button.primary` : pleine largeur, 72 px, biseau 4 px, biseau **inversé** à l'appui,
  aucun déplacement de mise en page. → Récit 2.5
- **UX-DR4** — `selector.wheel` : trois molettes, balayage **et** appui haut/bas (avec des gants le
  balayage rate), aucun clavier, ouverture sur le meilleur tour du circuit. → Récit 2.2
- **UX-DR5** — `card.roulage`, `chip.category`, `gauge.wear`, `meter.credits`. → Récits 2.5 et 5.3
- **UX-DR6** — La profondeur par **biseaux** et jamais par ombre : aucun `border-radius`, aucun
  `blur`, aucune `box-shadow` diffuse. → Récit 2.5
- **UX-DR7** — Scanlines et tramage **uniquement** sur le sol, le bloc de tête et l'image de
  partage ; **interdits** derrière du texte courant, un carnet ou une liste. → Récit 2.5
- **UX-DR8** — Accessibilité : AA partout, `#B026FF` interdit en petit texte, **la couleur n'est
  jamais seule** (tout écart porte son signe), focus clavier visible, `prefers-reduced-motion`
  supprime tout, libellé accessible accentué derrière chaque libellé HUD sans accent. → Récit 2.5
- **UX-DR9** — Navigation à onglets **qui grandit** : deux onglets au noyau, les trois autres
  apparaissent avec leur contenu. → Récit 6.3
- **UX-DR10** — Les états : jamais de vide, jamais d'indicateur de chargement au noyau, **rien ne
  signale l'absence de réseau**, doublon de session = deux choix explicites. → Récits 2.4 et 6.1
- **UX-DR11** — Mouvement court et mécanique : 120 ms sur un état, 240 ms sur un écran, courbes
  linéaires ou à paliers, aucun rebond. → Récit 2.5
- **UX-DR12** — Portrait mobile uniquement, 375/390/430 px, mono-thème sombre, zone sûre respectée.
  → Récit 0.3

---

## Liste des épiques

### Noyau de premier roulage — à livrer pour le 1er décembre 2026

| # | Épique | Récits | Soirées |
|---|---|---|---|
| **0** | Sondes et préconditions | 4 | 5 |
| **1** | Le schéma à deux axes | 4 | 6 |
| **2** | Le roulage et le chrono | 5 | 9 |
| **3** | La photo et le geste | 3 | 4 |
| **4** | Le récapitulatif partageable | 3 | 6 |
| **5** | Le coût de la journée | 3 | 5 |
| **6** | L'accueil temporel | 2 | 3 |
| **7** | Les instruments de bord | 1 | 2 |
| | **Total noyau** | **25** | **40** |

### Mouvement 2 — décembre 2026 à février 2027

| # | Épique | Ce qu'elle contient |
|---|---|---|
| **8** | L'axe machine prend ses écrans | Journal d'interventions daté et indépendant de tout roulage · la pièce achetée non montée comme état de première classe · les **trois catégories séparées** et jamais fusionnées · la réparation non vitale née d'une photo · l'événement visé |
| **9** | L'accueil temporel se branche sur l'atelier | Les quatre sources supplémentaires · **c'est ce branchement qui referme le vide saisonnier**, pas l'axe machine seul |
| **10** | Ce que le noyau a coupé | La reconnaissance de reçu · l'accueil réarrangeable · le catalogue d'achievements outillé |

### Mouvement 3 — saison 2027, sur condition d'allumage

Aucune date : chaque épique s'allume sur une condition observable.

| # | Épique | S'allume quand |
|---|---|---|
| **11** | La courbe de progression | Un circuit a **trois roulages saisis** — avant, elle ne dit rien |
| **12** | L'horloge d'usure et le barème | ≈ mai 2027 — l'usure a besoin de roulages avant de parler |
| **13** | Checklist et conformité organisateur | Avant le premier roulage encadré de la saison |
| **14** | Le cercle et le carnet partagé | **Un pote roule.** Pas avant : un cercle à une personne est un écran vide |
| **15** | Bilan, saison dérivée, budget prévisionnel | Une saison est complète |
| **16** | La récolte — barèmes et calendriers | Le service Railway devient nécessaire, c'est-à-dire à l'épique 12 |

---

## Carte de couverture des FR

| FR | Récit | FR | Récit |
|---|---|---|---|
| FR-1, FR-2 | 1.2, 1.3 | FR-28, FR-29 | 3.2 |
| FR-3 | 1.3 | FR-30, FR-31 | 3.3 |
| FR-4 | Épique 8 | FR-32 | 3.1 |
| FR-5 | **1.1** | FR-33 → FR-36 | 4.2 |
| FR-6, FR-6bis, FR-7 | 2.1 | FR-37 | 4.3 |
| FR-8 | 2.4 | FR-38, FR-39, FR-39bis | Épique 14 |
| FR-9 | 2.4 | FR-40 → FR-45 | Épiques 8 et 12 |
| FR-10 | 2.1, 1.4 | FR-46 → FR-48 | Épique 8 |
| FR-11 → FR-14 | 6.1 | FR-49 → FR-51 | Épique 13 |
| FR-15 | 6.2 *(partiel)* · Épique 10 | FR-52, FR-53 | 5.1 |
| FR-16, FR-17 | 2.2, 2.3 | FR-54 | Épique 8 |
| FR-18 | 1.1, 2.2 | FR-55, FR-56 | Épique 15 |
| FR-19 | 2.3 | FR-57 → FR-60 | **7.1** |
| FR-20 | Épique 11 | | |
| FR-21 → FR-24 | 5.2, 5.3 | | |
| FR-25 | **Coupé** → Épique 10 | | |
| FR-26, FR-27 | 5.1, 5.3 | | |

**Aucune FR n'est orpheline.** Trois sont explicitement reportées avec leur épique : FR-4, FR-20 et
FR-25.

---

# Les récits du noyau

Chaque récit est dimensionné à **une ou deux soirées**. Un récit qui déborde est un récit mal
découpé, pas une soirée ratée.

---

## Épique 0 : Sondes et préconditions

**Objectif.** Détruire les trois hypothèses non vérifiées dont dépend tout le reste, **avant**
d'écrire une ligne de produit. Si l'une tombe, il vaut mieux l'apprendre le 25 août que le
20 novembre.

### Récit 0.1 : La sonde de synchronisation — *1 soirée*

En tant que **développeur**, je veux **vérifier que le SDK web PowerSync fonctionne sur une PWA
installée sur l'écran d'accueil iOS**, afin de **savoir si le moteur de synchronisation choisi tient
avant de construire dessus**.

**Critères d'acceptation**

**Étant donné** une page minimale utilisant le SDK web PowerSync, déployée en HTTPS
**Quand** elle est ajoutée à l'écran d'accueil d'un iPhone réel et ouverte en mode autonome
**Alors** le SQLite local s'initialise, une écriture locale survit à la fermeture complète de
l'application, **et** la synchronisation vers Supabase aboutit au retour au premier plan.

**Étant donné** que l'une de ces trois conditions échoue
**Quand** la sonde est exécutée
**Alors** le résultat est consigné au memlog **et** QO-4 est rouverte immédiatement — c'est un
changement d'architecture, pas un contournement.

### Récit 0.2 : La sonde de persistance — *1 soirée*

En tant que **pilote**, je veux **que mes données ne soient pas purgées par le navigateur**, afin de
**retrouver ma saison en mars**.

**Critères d'acceptation**

**Étant donné** la même page de sonde
**Quand** `navigator.storage.persist()` est appelé au démarrage
**Alors** la valeur retournée et celle de `persisted()` sont affichées à l'écran, sur iOS **et** sur
Chrome Android.

**Étant donné** que la persistance est refusée sur l'une des deux plateformes
**Quand** le résultat est consigné
**Alors** l'exigence NFR-1 d'exposer l'état au pilote devient un écran et non une ligne de journal.

**Étant donné** la sonde installée
**Quand** l'application est désinstallée puis réinstallée
**Alors** ce qui survit est consigné — **c'est QO-2, et aucune preuve publique n'existe.**

### Récit 0.3 : Le squelette — *2 soirées*

En tant que **développeur**, je veux **un projet qui démarre, se déploie et s'installe**, afin de
**ne plus jamais payer ce coût pendant les 105 jours**.

**Critères d'acceptation**

**Étant donné** un dépôt neuf avec deux branches `main` et `dev`
**Quand** je pousse sur `main`
**Alors** une PWA React + Vite + TypeScript se déploie, s'installe sur l'écran d'accueil, s'ouvre en
portrait, en thème sombre, et respecte la zone sûre.

**Étant donné** la configuration
**Quand** le paquet client est inspecté
**Alors** il ne contient **que la clé publiable Supabase** — aucune clé de service, aucune clé de
fournisseur d'IA (AD-15).

**Étant donné** que **MyPaddock est un nom de code et pas le nom public** (QO-1, rouverte le 18 août
2026 : le nom exact est exploité par Oracle Red Bull Racing et ThePaddock est déjà le même produit)
**Quand** le nom du produit apparaît quelque part — écrans, manifeste, `<title>`, icônes, cartes de
partage, courriels, texte de boutique
**Alors** il vient d'**une seule constante** et n'est écrit en dur nulle part ailleurs, de sorte
qu'un renommage soit **un changement d'une ligne** et non un chantier.

> C'est ce critère, et lui seul, qui rend le report du nom gratuit. Julian a choisi le 18 août 2026
> de **différer la décision de nom** et de construire sous le nom de code ; ce choix ne tient que si
> la dette de renommage reste nulle. Sans cette constante, chaque soirée de build rend le
> renommage un peu plus coûteux, et la décision différée devient une décision subie.

### Récit 0.4 : La licence de fonte — *1 soirée*

En tant que **porteur du projet**, je veux **que les fontes soient utilisables publiquement**, afin
de **pouvoir lancer une campagne sans découvrir un problème de licence après l'avoir payée**.

**Critères d'acceptation**

**Étant donné** que Racing Catalogue est gratuite **pour usage personnel uniquement**
**Quand** la décision est prise
**Alors** soit une licence commerciale est obtenue auprès d'Octotype, soit **Bungee Shade** (SIL OFL)
lui est substituée dans les tokens — et le choix est consigné.

**Étant donné** les trois familles retenues
**Quand** elles sont intégrées
**Alors** elles le sont **en data URI**, et le produit démarre sans réseau (UX-DR2).

---

## Épique 1 : Le schéma à deux axes

**Objectif.** Poser le modèle de données. **C'est la seule décision du projet dont le coût explose si
elle est différée** — un axe ajouté après coup se paie en migration.

### Récit 1.1 : Le schéma et ses invariants — *2 soirées* 🥇 **le premier récit de tous**

En tant que **développeur**, je veux **un schéma à deux racines indépendantes**, afin que **l'axe
atelier soit atteignable en décembre sans migration**.

**Critères d'acceptation**

**Étant donné** les migrations Supabase
**Quand** elles sont appliquées
**Alors** `roulage` et `machine` sont deux racines, **un roulage sans machine et une machine sans
roulage sont deux états valides et testés** (AD-2).

**Étant donné** une entité créée hors ligne
**Quand** son identifiant est généré
**Alors** c'est un **UUID v7 produit côté client** — aucune séquence, aucun identifiant serveur
(AD-14).

**Étant donné** le modèle de session
**Quand** il est écrit
**Alors** `session` porte une **collection de `tour`**, et chaque `tour` porte
`provenance ∈ {saisie_manuelle, chronometre_embarque, transpondeur_organisateur}` — **il n'existe
aucune provenance GPS** (AD-3, FR-18).

**Étant donné** les conventions
**Quand** une colonne monétaire ou temporelle est créée
**Alors** l'argent est en **centimes entiers** et les chronos en **millisecondes entières** — jamais
de flottant.

### Récit 1.2 : Le compte — *1 soirée*

En tant que **Kévin**, je veux **créer un compte en trois champs**, afin de **saisir mon premier
roulage sans traverser un assistant**.

**Critères d'acceptation**

**Étant donné** un visiteur sans compte
**Quand** il s'inscrit
**Alors** trois champs suffisent, **aucun tutoriel ne s'affiche**, aucune étape de configuration
n'est imposée (FR-1).

**Étant donné** un compte créé
**Quand** RLS est vérifiée
**Alors** aucun pilote ne lit les données d'un autre.

### Récit 1.3 : Le garage — *1 soirée*

En tant que **pilote**, je veux **déclarer mes motos**, afin que **chaque roulage sache laquelle a
roulé**.

**Critères d'acceptation**

**Étant donné** un compte neuf
**Quand** je déclare une machine
**Alors** marque, modèle et année suffisent, **et le garage accepte plusieurs véhicules** (FR-2).

**Étant donné** un équipement déclaré
**Quand** le catalogue d'achievements ou les échéances sont évalués
**Alors** ce qui suppose un équipement absent **ne s'affiche pas** — et ce filtrage se dérive des
données saisies, **sans aucun écran de réglage** (FR-3).

### Récit 1.4 : La synchronisation — *2 soirées*

En tant que **pilote**, je veux **que ma saison vive sur le serveur**, afin de **la retrouver même
si je change de téléphone**.

**Critères d'acceptation**

**Étant donné** une écriture faite hors ligne
**Quand** elle est enregistrée
**Alors** elle atterrit **transactionnellement dans SQLite local** et **jamais uniquement dans une
file de requêtes** (AD-4, NFR-2).

**Étant donné** l'application au premier plan ou le réseau qui revient
**Quand** l'un des deux se produit
**Alors** la synchronisation part — **et nulle part ailleurs**, car rien ne s'exécute en arrière-plan
sur iOS (AD-6, NFR-3).

**Étant donné** que `persisted()` retourne faux
**Quand** le pilote ouvre les réglages
**Alors** il voit que la persistance n'est pas accordée — **un état, pas une alerte anxiogène**
(AD-5, NFR-1).

---

## Épique 2 : Le roulage et le chrono

**Objectif.** Le plaisir immédiat, et la porte d'entrée de tout nouvel utilisateur. **C'est
l'épique qui ne se coupe jamais.**

### Récit 2.1 : Créer un roulage — *2 soirées*

En tant que **Julian**, je veux **créer un roulage au paddock ou le jeudi soir**, afin que **les deux
chemins produisent le même objet**.

**Critères d'acceptation**

**Étant donné** l'écran de création
**Quand** je saisis une date et un circuit
**Alors** le roulage est enregistré — **tout le reste se complète après, y compris des mois après**
(FR-6).

**Étant donné** un roulage
**Quand** je saisis le groupe
**Alors** le **libellé de l'organisateur et son rang** (`n` sur `total`) sont stockés, et le rang se
projette sur le Niveau MyPaddock (FR-6bis, AD-9).

**Étant donné** l'avion en mode avion
**Quand** je crée un roulage complet
**Alors** **aucun champ, aucun calcul et aucun écran ne dépend du réseau**, et rien ne signale
l'absence de connexion (FR-10, NFR-7, UX-DR10).

### Récit 2.2 : Le sélecteur à trois molettes — *2 soirées*

En tant que **Julian avec des gants**, je veux **entrer mon chrono sans clavier**, afin de **le faire
entre deux sessions sans enlever mes gants**.

**Critères d'acceptation**

**Étant donné** l'écran de saisie
**Quand** il s'ouvre
**Alors** trois molettes s'affichent — minutes, secondes, dixièmes — **positionnées sur mon meilleur
tour à ce circuit** s'il existe, sinon `1'00"0`, **et aucun clavier ne s'ouvre jamais** (FR-16,
UX-DR4).

**Étant donné** une molette
**Quand** je balaie verticalement **ou** que j'appuie sur sa zone haute ou basse
**Alors** les deux fonctionnent — **avec des gants, le balayage rate**.

**Étant donné** l'accueil
**Quand** un roulage du jour existe
**Alors** un **bouton unique en pleine largeur** mène au sélecteur **sans aucune navigation
intermédiaire** (NFR-10).

### Récit 2.3 : L'écart, immédiatement et hors ligne — *1 soirée*

En tant que **Julian**, je veux **voir mon écart tout de suite**, afin de **savoir si j'ai progressé
avant de repartir en piste**.

**Critères d'acceptation**

**Étant donné** un chrono validé sans réseau
**Quand** l'écran de retour s'affiche
**Alors** il montre le meilleur tour du jour, l'écart **à circuit constant**, et le nombre de
sessions — **immédiatement** (FR-17).

**Étant donné** un écart affiché
**Quand** il est rendu
**Alors** il **porte toujours son signe** (`−1"8`, `+0"4`) et jamais seulement sa couleur — sans le
signe, l'information est perdue pour un pilote deutéranope (UX-DR8).

**Étant donné** un record
**Quand** il est atteint
**Alors** `#B026FF` s'allume — **et c'est le seul endroit du produit où il apparaît**.

**Étant donné** un compte neuf
**Quand** un chrono est saisi
**Alors** sa visibilité au cercle est **masquée par défaut**, réglable roulage par roulage (FR-19).

### Récit 2.4 : Les sessions — *1 soirée*

En tant que **pilote**, je veux **compter mes sessions**, afin que **le récapitulatif et l'usure
sachent de quoi la journée était faite**.

**Critères d'acceptation**

**Étant donné** un roulage
**Quand** j'ajoute une session
**Alors** elle porte son rang dans la journée (FR-8).

**Étant donné** une session déjà saisie ce jour-là
**Quand** j'en saisis une autre
**Alors** deux choix explicites s'affichent — *remplacer le meilleur tour* ou *ajouter une session* —
**et jamais d'écrasement silencieux** (UX-DR10).

**Étant donné** l'écran du roulage
**Quand** il se compose
**Alors** la structure de journée sert de **squelette par défaut** — briefing, pause, fin — sans être
saisie, **et un roulage qui n'y ressemble pas se saisit sans friction** (FR-9).

### Récit 2.5 : La peau Attract Mode — *3 soirées*

En tant que **pilote**, je veux **une application qui ne ressemble pas à un tableur**, afin de
**l'ouvrir onze fois par an**.

**Critères d'acceptation**

**Étant donné** le système de tokens
**Quand** il est implémenté
**Alors** les 18 couleurs, les 3 familles et la grille de 4 px de `DESIGN.md` existent en variables
CSS, **et aucune couleur n'est écrite en dur dans un composant** (UX-DR1).

**Étant donné** n'importe quel élément
**Quand** il est rendu
**Alors** `border-radius` vaut **0**, il n'existe **aucune `box-shadow` diffuse ni aucun `blur`**, et
la profondeur passe par des **biseaux de 4 px** (UX-DR6).

**Étant donné** du texte courant, une liste ou un formulaire
**Quand** il s'affiche
**Alors** **aucune scanline ni aucun tramage ne passe derrière** — ils sont réservés au sol, au bloc
de tête et à l'image de partage (UX-DR7).

**Étant donné** l'audit d'accessibilité
**Quand** il est passé
**Alors** tout couple texte/fond atteint AA, `#B026FF` n'apparaît **jamais** en petit texte, le focus
clavier est visible, `prefers-reduced-motion` supprime **tout** y compris les effets de sol, et
chaque libellé HUD sans accent porte un libellé accessible accentué (UX-DR8).

**Étant donné** la saisie d'une dépense et le carnet
**Quand** ils sont mesurés
**Alors** ils sont **aussi rapides que les écrans de chrono** — sinon la peau punit exactement la
corvée que le produit doit transporter (NFR-16).

---

## Épique 3 : La photo et le geste

**Objectif.** La fierté qui n'a aujourd'hui aucun endroit où aller. **Coût de saisie nul pour le
pilote, et alimente trois autres domaines.**

### Récit 3.1 : Verser une photo — *2 soirées*

En tant que **Julian**, je veux **verser une photo à mon roulage**, afin de **la retrouver dans
l'album et sur le récapitulatif**.

**Critères d'acceptation**

**Étant donné** un roulage
**Quand** je verse une photo
**Alors** elle est disponible immédiatement à l'écran, **même sans réseau**, et son téléversement
part au retour du réseau (FR-32).

**Étant donné** une photo qui doit servir de fond au récapitulatif
**Quand** elle est servie
**Alors** elle l'est **depuis la même origine ou avec un CORS correct** — sinon la composition lève
`SecurityError` (AD-13).

**Étant donné** un téléversement qui échoue
**Quand** l'erreur est présentée
**Alors** elle dit ce qui s'est passé, **ce qui est conservé**, et ce qui va se passer.

### Récit 3.2 : Déclarer un geste — *1 soirée*

En tant que **Julian**, je veux **déclarer mon genou posé à gauche**, afin de **consigner une fierté
qui n'a nulle part où aller**.

**Critères d'acceptation**

**Étant donné** un roulage
**Quand** je déclare un geste
**Alors** il est enregistré — **purement déclaratif, aucune reconnaissance automatique d'image**
(FR-28).

**Étant donné** un geste
**Quand** j'y rattache une photo
**Alors** le rattachement se fait — **mais un geste se déclare sans photo, et une photo se verse sans
geste** (FR-29).

**Étant donné** un cap de bravoure débloqué
**Quand** il s'affiche
**Alors** il **n'est jamais partagé automatiquement au cercle** (FR-39bis) — même si le cercle
n'existe pas encore, la règle est posée dans le code.

### Récit 3.3 : Le catalogue minimal — *1 soirée*

En tant que **porteur**, je veux **ajouter un cap sans redéployer**, afin que **le catalogue suive la
pratique et non les sorties de version**.

**Critères d'acceptation**

**Étant donné** le catalogue
**Quand** il est implémenté
**Alors** il vit **en base**, avec sa condition **évaluée comme donnée** et non compilée (AD-10,
FR-30).

**Étant donné** le contenu livré
**Quand** il est inspecté
**Alors** **aucun cap n'est à série ni à durée limitée**, aucun compteur ne se remet à zéro, aucun
état acquis ne redescend, **et aucun écran n'affiche ce qui reste à faire pour obtenir un cap**
(FR-31).

**Étant donné** un cap franchi
**Quand** il est présenté
**Alors** le produit **énonce le fait** — « genou gauche posé » — et **ne décerne rien** : ni badge,
ni médaille, ni étoile, ni points.

---

## Épique 4 : Le récapitulatif partageable

**Objectif.** La vitrine, et l'un des deux moteurs d'acquisition. **Ne se coupe jamais.**

### Récit 4.1 : La composition d'image — *3 soirées*

En tant que **Julian**, je veux **une image composée automatiquement**, afin de **la poster sans
faire un travail de communication**.

**Critères d'acceptation**

**Étant donné** un roulage saisi sans réseau
**Quand** la saisie se termine
**Alors** le récapitulatif **se compose tout seul et s'affiche sans avoir été demandé** (FR-36).

**Étant donné** l'export du canevas
**Quand** il produit un blob
**Alors** **`blob.type` est vérifié après coup** plutôt que déduit du format demandé — qui peut être
ignoré silencieusement (AD-13).

**Étant donné** une composition dans un Worker
**Quand** elle démarre
**Alors** les polices sont **ajoutées explicitement à `self.fonts`** — rien n'est hérité du document
et l'ensemble démarre vide (AD-13, NFR-12).

### Récit 4.2 : Les trois gabarits — *2 soirées*

En tant que **Julian**, je veux **choisir ce que montre mon image en un tap**, afin de **ne pas avoir
à décider**.

**Critères d'acceptation**

**Étant donné** un récapitulatif
**Quand** il s'affiche
**Alors** trois gabarits — *perf*, *budget*, *geste* — sont **choisissables en un tap** (FR-33).

**Étant donné** un **premier** roulage sans historique
**Quand** le gabarit *perf* se compose
**Alors** il affiche circuit, sessions, meilleur tour **et le fait que c'est un premier** — *premier
roulage à Lédenon* — car **une première est un événement en soi** (FR-34).

**Étant donné** que le pilote masque le budget
**Quand** l'image est composée
**Alors** **le coût au tour se masque avec lui** — aucune composition ne peut produire une image
montrant le coût au tour sans le budget consommé (FR-35, FR-21).

### Récit 4.3 : Le partage sans cible nommée — *1 soirée*

En tant que **Julian**, je veux **partager mon image**, afin de **la poster où je veux**.

**Critères d'acceptation**

**Étant donné** une image composée
**Quand** j'appuie sur partager
**Alors** `canShare` est testé **avec l'objet exact** qui sera passé à `share()` (NFR-11).

**Étant donné** que j'annule le partage
**Quand** `AbortError` est levée
**Alors** **rien ne s'affiche** — c'est un choix, pas une erreur.

**Étant donné** tout autre échec
**Quand** il survient
**Alors** un **chemin de repli visible** permet de récupérer l'image, **et aucune cible n'est nommée
nulle part** — ni dans le code, ni dans l'interface (FR-37).

---

## Épique 5 : Le coût de la journée

**Objectif.** Le territoire vide du marché. Et la clause de sécurité la plus facile à violer par
commodité.

### Récit 5.1 : La dépense et ses trois cibles — *2 soirées*

En tant que **pilote**, je veux **rattacher une dépense à un roulage, à une moto ou à la saison**,
afin que **mon budget soit complet**.

**Critères d'acceptation**

**Étant donné** une dépense
**Quand** elle est créée
**Alors** sa cible est **exclusive et obligatoire** parmi roulage, machine ou saison (FR-23, AD-7).

**Étant donné** une dépense sans roulage
**Quand** elle est rattachée
**Alors** elle va à la saison en cours si elle existe, **sinon à la saison à venir** — et
`saison_annee` est un **entier fixé à la saisie, jamais recalculé** (AD-18).

**Étant donné** le code
**Quand** il est relu
**Alors** **aucune expression conditionnelle ne compare un mois de l'année** (FR-53, AD-8).

**Étant donné** une dépense marquée « pièce »
**Quand** elle est enregistrée
**Alors** elle se rattache à la machine (FR-26).

### Récit 5.2 : Le coût de la journée — *1 soirée*

En tant que **Julian**, je veux **savoir ce que la journée a coûté**, afin de **le consigner sans
tenir une comptabilité**.

**Critères d'acceptation**

**Étant donné** un roulage avec des dépenses
**Quand** j'ouvre son détail
**Alors** le coût de la journée est la somme de ses dépenses (FR-22).

**Étant donné** que je demande « ce que cette moto m'a coûté »
**Quand** le calcul est fait
**Alors** c'est **exclusivement** la somme des dépenses dont la cible est cette machine — **jamais
une jointure implicite par les roulages** (AD-17).

### Récit 5.3 : Le coût au tour et le compteur de crédits — *2 soirées*

En tant que **Julian**, je veux **voir mon coût au tour**, afin de **transformer un chiffre qui
descend en victoire**.

**Critères d'acceptation**

**Étant donné** un budget de saison déclaré
**Quand** le coût au tour s'affiche
**Alors** le budget consommé est **dans le même bloc visuel**, sans interaction pour le révéler
(FR-21).

**Étant donné** qu'aucun budget n'est déclaré
**Quand** un coût s'affiche
**Alors** **le coût au tour ne s'affiche pas** — seul le coût de la journée, qui ne porte pas la même
perversité. **Pas de zéro, pas de tiret** (FR-24).

**Étant donné** le premier affichage d'un coût
**Quand** aucun budget n'existe
**Alors** un champ unique le demande — **jamais à la création du compte**, jamais comme étape
d'installation.

---

## Épique 6 : L'accueil temporel

**Objectif.** Ce qui fait exister le produit entre deux roulages. **Presque gratuit à ce stade, et
c'est pour ça qu'il entre au noyau.**

### Récit 6.1 : Les deux sources — *2 soirées*

En tant que **Julian**, je veux **que l'accueil change tout seul avec le temps**, afin de **trouver
quelque chose en ouvrant hors d'un roulage**.

**Critères d'acceptation**

**Étant donné** un roulage à venir
**Quand** j'ouvre l'application
**Alors** l'accueil l'affiche avec sa distance en jours et mon meilleur tour à ce circuit (FR-11,
FR-12).

**Étant donné** aucun roulage à venir mais un roulage récent
**Quand** j'ouvre
**Alors** l'accueil montre **le dernier roulage** — son chrono, ses photos — **et le coût s'y saisit
sans jamais être réclamé**. Une source de l'accueil est ce qu'on a envie de voir, jamais ce qu'on a
oublié de faire.

**Étant donné** aucune source
**Quand** j'ouvre
**Alors** l'accueil montre le dernier roulage et son meilleur tour — **il n'existe aucun écran vide**
(FR-14).

**Étant donné** un libellé quelconque de l'accueil
**Quand** il est relu
**Alors** il **énonce un fait et jamais une échéance ni une injonction** — test binaire, ligne par
ligne, **et un libellé qui y échoue est un défaut au même titre qu'un calcul faux** (FR-13).

**Étant donné** que tout se calcule à l'ouverture
**Quand** l'application était fermée
**Alors** **rien n'a tourné pendant ce temps** — l'accueil est immunisé par construction contre
l'interdiction iOS (AD-6).

### Récit 6.2 : Les deux zones et la navigation — *1 soirée*

En tant que **pilote**, je veux **une navigation qui ne me montre pas des pièces vides**, afin de
**ne pas croire que l'application est abandonnée**.

**Critères d'acceptation**

**Étant donné** l'accueil
**Quand** il se compose
**Alors** la **zone temporelle est en tête et appartient au système** — le pilote n'y touche pas —
et la zone des chiffres est en dessous (FR-15, disposition par défaut complète).

**Étant donné** le noyau de décembre
**Quand** la barre de navigation s'affiche
**Alors** elle montre **deux onglets** — Accueil et Roulages. **Machine, Saison et Cercle
n'apparaissent pas tant qu'ils n'ont rien à montrer** (UX-DR9).

---

## Épique 7 : Les instruments de bord

**Objectif.** Sans eux, l'échec ne se constate qu'en octobre 2027. **Ne se coupent jamais.**

### Récit 7.1 : Les trois mesures — *2 soirées*

En tant que **porteur du projet**, je veux **trois capteurs sur le projet lui-même**, afin de
**corriger la saison avant qu'elle soit finie**.

**Critères d'acceptation**

**Étant donné** un roulage saisi
**Quand** la mesure est enregistrée
**Alors** le **délai roulage → saisie** est consigné, avec un seuil d'alerte à **48 heures dépassées
une seule fois** (FR-57).

**Étant donné** un récapitulatif
**Quand** il est généré puis partagé
**Alors** les deux événements sont distingués — **générés contre postés** (FR-58).

**Étant donné** une ouverture qui ne produit aucune saisie
**Quand** elle se termine
**Alors** elle est comptée — **et ce n'est pas un échec, c'est exactement ce que l'accueil temporel
cherche à provoquer** (FR-59).

**Étant donné** un événement d'instrument
**Quand** il est écrit
**Alors** il passe par **le chemin d'écriture normal** — local d'abord, synchronisé ensuite, protégé
par RLS. **Aucun appel réseau dédié, aucun SDK d'analytique, aucun point de terminaison de
télémétrie** (AD-20).

**Étant donné** que le pilote refuse la remontée
**Quand** il l'exprime
**Alors** **rien n'est écrit localement** — le refus n'est pas un filtrage côté serveur (AD-16).

**Étant donné** la première version livrée
**Quand** elle part
**Alors** **les trois instruments y sont** — pas dans une version ultérieure (FR-60).
