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
d'architecture en **récits livrables et vérifiables un par un**.

Il a un second rôle : **répondre à QO-10**, la question ouverte la plus
lourde du projet, que l'architecture a explicitement laissée à cette étape.

---

## QO-10 — Le noyau tient-il d'ici le 1er décembre 2026 ?

### La question était mal posée, et c'est Julian qui l'a corrigée

**Correction du 19 août 2026.** Ce document répondait en **soirées de développement** : 45
disponibles, 40 puis 44 demandées, une marge tombée de 11 % à 2 %, un scénario A contre un
scénario B pour choisir quoi couper. **Tout cet appareil reposait sur une rareté qui n'existe
pas.** Julian ne tape pas le code du produit — il le décide, le relit, le teste sur son
téléphone et répond aux questions que lui seul peut trancher. Compter ses soirées de
développement mesurait le travail de quelqu'un qui ne le fait pas.

> **Ce n'est pas un détail d'unité.** Une estimation fausse ne se contente pas d'être
> imprécise : elle **fabrique des décisions**. Ici elle a produit une coupe — l'épique 5
> réduite à un montant et un champ — dont le seul motif était de financer trois soirées
> imaginaires.

**Ce qui tombe avec le chiffrage :**

- **La coupe de l'épique 5 est annulée.** Elle n'avait pas d'autre justification que son
  financement. L'épique 5 reprend sa forme complète : les trois cibles, le coût au tour, le
  compteur de crédits, le budget de saison. *Ce qui survit de l'analyse, parce que c'est vrai
  indépendamment du coût : la coupe rendait FR-24 tenue par construction. Ce n'était pas une
  raison de couper, c'était une consolation. Elle disparaît avec la coupe.*
- **Les scénarios A et B en tant qu'arbitrage budgétaire.** Le garage reste — **parce qu'il est
  le centre du produit**, pas parce qu'on avait trouvé trois soirées pour le payer.
- **La liste de coupe et son ordre**, qui n'ont plus de déclencheur chiffré.

### Ce qui reste rare, et c'est là qu'il faut compter

Trois choses, et aucune ne se mesure en soirées.

**1. Les dates extérieures, qui ne se négocient pas.** La saison 2027 commence au printemps
qu'on soit prêt ou non. Un produit qui n'existe pas au premier roulage ne rate pas une
livraison : il rate **une saison entière de données**, et il n'y a qu'une saison par an.
C'est le seul calendrier qui commande encore, et le 1er décembre 2026 en est la marge de
sécurité — non plus parce que les soirées de construction seraient celles de la saisie, mais
parce qu'un produit qu'on découvre au paddock n'est pas un produit qu'on a testé.

**2. L'attention de Julian.** Elle est la seule ressource dont le stock est vraiment fixe.
Chaque récit ci-dessous porte donc la seule annotation qui ait un sens : **`demande Julian`**
quand il faut sa décision, son jugement esthétique, son téléphone, ou une réponse que le code
ne peut pas produire. Le reste avance sans lui et lui revient en relecture. **Le plan se lit
par cette colonne, pas par un total.**

**3. Les hypothèses non vérifiées.** C'est le vrai risque de calendrier, et il est
indifférent à la quantité de travail disponible : si le SDK web ne tient pas sur une PWA iOS
installée, la question n'est plus le découpage mais le choix du moteur. **Mieux vaut
l'apprendre en août qu'en novembre** — c'est pourquoi l'épique 0 passe en premier, et c'est la
seule contrainte d'ordonnancement qui n'a pas bougé d'un mot avec la correction.

### La règle de découpe survit, mais pour un autre motif

« On coupe la corvée, jamais le plaisir » reste vraie — non plus comme plan de rationnement,
mais comme **règle de priorité quand deux choses se disputent la même relecture**. La photo,
le geste, le récapitulatif et les trois instruments ne se coupent jamais : les trois premiers
parce que c'est le plaisir qui transporte la corvée, les instruments parce que sans eux
l'échec ne se constate qu'en octobre 2027.

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

| # | Épique | Récits | Demande Julian |
|---|---|---|---|
| **0** | Sondes et préconditions | 5 | **4 sur 5** — c'est l'épique la plus dépendante de lui, et c'est normal : elle ne produit que des verdicts |
| **1** | Le schéma à deux axes | 4 | — |
| **2** | Le roulage et le chrono | 5 | 2 — la cible gantée et la peau |
| **3** | La photo et le geste | 3 | 1 — le catalogue |
| **3bis** | **Le garage — la machine devient une présence** | 3 | 1 — la mise en scène · **et l'épique entière est sous condition du récit 0.5** |
| **4** | Le récapitulatif partageable | 3 | 2 — les gabarits et l'essai de partage |
| **5** | Le coût de la journée | 3 | — |
| **6** | L'accueil temporel | 3 | 1 — les conseils |
| **7** | Les instruments de bord | 1 | — |

**Onze récits sur vingt-sept demandent Julian**, et pas au même titre : quatre attendent un
verdict de sonde, quatre un jugement esthétique, deux un essai sur appareil réel, un du contenu.
**C'est cette colonne qui séquence le chantier**, pas un total d'effort.

### Mouvement 2 — décembre 2026 à février 2027

| # | Épique | Ce qu'elle contient |
|---|---|---|
| **8** | L'axe machine prend ses écrans | Journal d'interventions daté et indépendant de tout roulage · la pièce achetée non montée comme état de première classe · les **trois catégories séparées** et jamais fusionnées · la réparation non vitale née d'une photo · l'événement visé |
| **9** | L'accueil temporel se branche sur l'atelier | Les quatre sources supplémentaires · **c'est ce branchement qui referme le vide saisonnier**, pas l'axe machine seul |
| **10** | Ce que le noyau a coupé | La reconnaissance de reçu · l'accueil réarrangeable · le catalogue d'achievements outillé · **et depuis le 19 août : le sélecteur des trois cibles de dépense, le coût au tour, le compteur de crédits, le budget de saison, le coût par machine** — aucun n'exige de migration |

### Mouvement 3 — saison 2027, sur condition d'allumage

Aucune date : chaque épique s'allume sur une condition observable.

> **⚠ Ces deux tableaux ne sont plus la seule description des épiques 8 à 16.** Leurs récits et
> leurs critères d'acceptation ont été écrits le 25 août 2026 — voir *Les récits des mouvements
> 2 et 3*, en fin de document. **35 récits, 193 critères, dont 67 NON TENUS.** Plusieurs portes
> annoncées dans ces tableaux y sont corrigées : celle de l'épique 14, en particulier, était
> fausse — « un pote roule » ouvre le cercle, pas le carnet partagé, qu'un acheteur d'occasion
> lit sans avoir besoin d'aucun pote.

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
| FR-21 → FR-24 | **Coupé** → Épique 10 *(FR-24 tenue par construction, voir 5.1)* | | |
| FR-25 | **Coupé** → Épique 10 | | |
| FR-26, FR-27 | **Coupé** → Épique 10 | | |
| FR-22 | 5.1 *(la somme seule)* | | |

**Aucune FR n'est orpheline.** Reportées avec leur épique : FR-4, FR-20, FR-25, et depuis le
réarbitrage du 19 août **FR-21, FR-23 partiellement, FR-24, FR-26 et FR-27** — toutes vers
l'épique 10, **aucune n'exigeant de migration**.

**Deux récits ne portent aucune FR, et c'est volontaire.** Le récit **0.5** (la porte de rendu) et
l'épique **3bis** (le garage) naissent de la réorientation des 18–19 août, postérieure aux 62 FR du
PRD. Leur contrat est écrit dans leurs critères d'acceptation et dans le §5bis du PRD ; les FR
correspondantes seront numérotées à la prochaine passe du PRD plutôt que faufilées ici — **on ne
renumérote pas 62 exigences pour un ajout.**

---

# Les récits du noyau

Chaque récit est **une seule chose livrable et vérifiable**. Un récit qu'on ne sait pas déclarer
fini est un récit mal découpé.

---

## Épique 0 : Sondes et préconditions

**Objectif.** Détruire les trois hypothèses non vérifiées dont dépend tout le reste, **avant**
d'écrire une ligne de produit. Si l'une tombe, il vaut mieux l'apprendre le 25 août que le
20 novembre.

### Récit 0.1 : La sonde de synchronisation — **demande Julian** *(son iPhone)*

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

### Récit 0.2 : La sonde de persistance — **demande Julian** *(son iPhone)*

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

### Récit 0.3 : Le squelette

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
> la dette de renommage reste nulle. Sans cette constante, chaque build rend le
> renommage un peu plus coûteux, et la décision différée devient une décision subie.

### Récit 0.4 : La licence de fonte — **demande Julian** *(une décision de licence)*

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

### Récit 0.5 : La porte de rendu — **demande Julian** *(ses photos et son jugement)*

En tant que **Julian**, je veux **voir ce que le pipeline pixel fait de mes propres photos de moto
de piste avant qu'on l'écrive dans l'application**, afin de **savoir si le pixel devient l'identité
du garage ou si le garage reste une photo réelle mise en scène**.

**Ce n'est plus une porte budgétaire, c'est une porte de produit** — et elle en devient plus
importante, pas moins. La question n'est pas « est-ce qu'on peut se le payer » mais « est-ce que
ça mérite d'être le visage du produit ». L'épique 3bis ne démarre pas sans son verdict.

**Critères d'acceptation**

**Étant donné** le banc d'essai
**Quand** il est construit
**Alors** il est **déterministe et entièrement local** — réduction, détourage, quantification,
palette, contour — **aucun modèle génératif, aucun appel réseau, aucune clé d'API**. C'est la
propriété qui rend le résultat reproductible : un pipeline déterministe se débogue sur un cas et se
**prouve** sur un jeu, là où un modèle génératif ne garantit rien d'un utilisateur au suivant.

**Étant donné** le jeu d'essai
**Quand** il est constitué
**Alors** il ne peut pas être choisi pour flatter le rendu. Il contient **au minimum** : trois motos
distinctes dont **au moins une qui n'est pas celle de Julian**, un fond de paddock chargé — camion,
parasol, autres motos —, une photo en contre-jour, une de profil et une de trois-quarts avant.
**Une photo cadrée proprement sur fond uni ne prouve rien**, c'est le cas facile.

**Étant donné** les critères de jugement
**Quand** ils sont énoncés
**Alors** ils le sont **avant** que la première sortie soit regardée, et ils sont ceux-ci : *les
rayons sont-ils des rayons ? le disque de frein est-il perforé ? la silhouette est-elle
reconnaissable de profil ? est-ce que tu la montrerais à un pote ?*

**Étant donné** le critère de reproductibilité
**Quand** il est évalué
**Alors** **les mêmes réglages passent sur toutes les photos du jeu sans réglage manuel par
photo**. Si une photo demande un ajustement à la main, le pipeline **n'est pas reproductible** — et
c'est un échec, pas un cas particulier. C'est l'exigence explicite de Julian et c'est la seule qui
distingue un rendu qui marche chez lui d'un rendu qui marche chez ses utilisateurs.

**Étant donné** une photo d'iPhone récent
**Quand** elle entre dans le pipeline
**Alors** elle est réduite par `createImageBitmap` **avant tout `drawImage`** — une photo de 48 Mpx
dépasse le plafond de 16 777 216 px de Safari et **fait planter l'onglet** (AD-13). Le banc mesure
aussi le temps de rendu sur appareil réel, cible **sous une seconde**.

**Étant donné** un chrono mesuré sous Chrome headless
**Quand** il est lu
**Alors** **il est refusé** : le mode headless avance en **temps virtuel** et `performance.now()`
saute jusqu'au budget alloué — le banc a rendu 19 990 ms sur une image de 340 px. Le verdict de
performance se rend **en navigateur réel, sur l'iPhone**. La planche headless sert à juger l'image,
jamais la vitesse.

**Étant donné** la fin de la sonde
**Quand** elle est close
**Alors** elle produit **un verdict écrit à trois issues** — *pixel*, *photo en scène*, *échec* — et
ce verdict **commande l'épique 3bis** : au verdict *photo en scène*, l'épique 3bis se réduit à son
premier récit et **le pipeline pixel n'est jamais écrit** — ce qui n'est pas un échec du produit,
seulement de cette voie-là.

---

## Épique 1 : Le schéma à deux axes

**Objectif.** Poser le modèle de données. **C'est la seule décision du projet dont le coût explose si
elle est différée** — un axe ajouté après coup se paie en migration.

### Récit 1.1 : Le schéma et ses invariants 🥇 **le premier récit de tous**

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

### Récit 1.2 : Le compte

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

### Récit 1.3 : Le garage

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

### Récit 1.4 : La synchronisation

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

### Récit 2.1 : Créer un roulage

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

### Récit 2.2 : Le sélecteur à trois molettes — **demande Julian** *(un essai gantée sur appareil)*

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

### Récit 2.3 : L'écart, immédiatement et hors ligne

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

### Récit 2.4 : Les sessions

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

### Récit 2.5 : La peau Attract Mode — **demande Julian** *(son jugement esthétique)*

En tant que **pilote**, je veux **une application qui ne ressemble pas à un tableur**, afin de
**l'ouvrir par intermittence**, après des semaines sans y toucher.  
> *(Cadence corrigée le 18 août 2026 : onze est le nombre de roulages d'une saison, pas le nombre d'ouvertures de l'application. Le besoin de réapprentissage reste réel pour les écrans saisonniers ; il ne vaut plus pour tout le produit.)*

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

### Récit 3.1 : Verser une photo

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

**Étant donné** une photo prise avec un iPhone récent
**Quand** elle est versée
**Alors** elle est réduite par `createImageBitmap(file, {resizeWidth, resizeHeight, resizeQuality,
imageOrientation: 'from-image'})` **avant tout `drawImage`** — au-delà de 16 777 216 px Safari
refuse le canevas et **l'onglet meurt**. Une photo de 48 Mpx est le cas normal, pas le cas limite.

**Étant donné** un téléversement qui échoue
**Quand** l'erreur est présentée
**Alors** elle dit ce qui s'est passé, **ce qui est conservé**, et ce qui va se passer.

### Récit 3.2 : Déclarer un geste

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

### Récit 3.3 : Le catalogue minimal — **demande Julian** *(le contenu du catalogue)*

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

## Épique 3bis : Le garage — la machine devient une présence

**Objectif.** Le centre du produit depuis la réorientation du 18 août.

**Précondition dure : le récit 0.5 doit rendre le verdict *pixel*.** Au verdict *photo en scène*,
cette épique se réduit à son premier récit — la machine en scène, qui vaut par elle-même.

### Récit 3bis.1 : La machine en scène — **demande Julian** *(son jugement esthétique)*

En tant que **Julian**, je veux **ouvrir l'application et voir ma moto**, afin que **le garage soit
un endroit et non une liste**.

**Critères d'acceptation**

**Étant donné** une machine avec une photo
**Quand** le garage s'ouvre
**Alors** elle est **présentée en scène** — cadre, sol, horizon, éclairage — et non affichée en
vignette dans une ligne de tableau.

**Étant donné** une machine **sans** photo
**Quand** le garage s'ouvre
**Alors** la scène existe quand même et la machine y est représentée par sa silhouette. **Le garage
n'est jamais vide et ne demande jamais une photo pour fonctionner** — AD-2 fait de la machine une
racine de premier rang, pas un objet conditionnel à un média.

**Étant donné** plusieurs machines
**Quand** le garage s'ouvre
**Alors** elles sont toutes atteignables, et **le roulage se rattache à celle qui a roulé** (FR-2,
AD-2).

**Étant donné** que le pilote est hors ligne
**Quand** le garage s'ouvre
**Alors** la scène et la photo sont là — **rien dans cet écran ne dépend du réseau**.

### Récit 3bis.2 : Le détourage au doigt

En tant que **pilote**, je veux **passer le doigt sur ma moto pour la détacher du fond**, afin
d'**obtenir une image propre sans qu'aucun service extérieur ne voie ma photo**.

**Critères d'acceptation**

**Étant donné** une photo et quelques traits au doigt
**Quand** le détourage est calculé
**Alors** il l'est **entièrement sur l'appareil** — aucun téléversement, aucun modèle téléchargé,
**zéro kilo-octet de poids ajouté au bundle**. Cible mesurée : **~145 ms**, qualité de l'ordre de
**88 % d'IoU** avec une dizaine de traits.

**Étant donné** le guidage à l'écran
**Quand** il est écrit
**Alors** il demande **peu de traits, pas beaucoup** : mesuré, quarante-cinq traits **dégradent** le
résultat — 83 % contre 88 % à dix. C'est contre-intuitif, donc l'interface doit le dire, sinon le
pilote peindra jusqu'à abîmer sa propre image.

**Étant donné** un détourage que le pilote juge raté
**Quand** il le refait
**Alors** il repart de la photo intacte — **la photo d'origine n'est jamais écrasée**.

**Étant donné** la question de la propriété
**Quand** on cherche l'endroit où l'image sort du téléphone
**Alors** **il n'y en a pas.** C'est la raison du choix : les conditions de Tripo (§5.2.1, 11 juillet
2025) attribuent au service **le maillage et la photo source**, et le palier gratuit de Gemini
entraîne sur les données versées. Rien ne quitte l'appareil, donc rien n'est cédé, **et aucun
chantier RGPD ne s'ouvre**.

### Récit 3bis.3 : Le pipeline pixel dans l'application

En tant que **Julian**, je veux **que ma moto ait sa forme de jeu**, afin qu'**elle devienne l'objet
qui monte en niveau**.

**Critères d'acceptation**

**Étant donné** les réglages validés par le récit 0.5
**Quand** ils entrent dans l'application
**Alors** ils y entrent **tels quels et en un seul endroit** — un module, des constantes nommées, et
**aucun réglage par photo**.

**Étant donné** une machine passée au pipeline
**Quand** le rendu est produit
**Alors** il est **calculé une fois et conservé** — le garage ne recalcule pas à chaque ouverture, et
la conservation suit le chemin d'écriture normal, local d'abord.

**Étant donné** le vocabulaire à l'écran
**Quand** il est écrit
**Alors** **c'est la machine qui monte en niveau, jamais le pilote.** Toute progression s'énonce sur
l'objet — la moto, ses kilomètres, son entretien. Double effet : on ne peut pas « aller chercher »
un kilomètre comme on va chercher un genou au sol, et la fierté se pose sur quelque chose qu'on
montre.

**Étant donné** un rendu que le pilote n'aime pas
**Quand** il le refuse
**Alors** **la photo réelle reprend sa place** — le pixel est une présentation, jamais un
remplacement destructif.

---

## Épique 4 : Le récapitulatif partageable

**Objectif.** La vitrine, et l'un des deux moteurs d'acquisition. **Ne se coupe jamais.**

### Récit 4.1 : La composition d'image

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

### Récit 4.2 : Les trois gabarits — **demande Julian** *(son jugement esthétique)*

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

### Récit 4.3 : Le partage sans cible nommée — **demande Julian** *(un essai de partage sur appareil)*

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
commodité. **Réduite le 19 août puis rétablie entière le même jour**, la coupe étant tombée avec le
chiffrage qui la justifiait.

### Récit 5.1 : La dépense et ses trois cibles

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

### Récit 5.2 : Le coût de la journée

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

### Récit 5.3 : Le coût au tour et le compteur de crédits

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

### Récit 6.1 : Les deux sources

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

### Récit 6.2 : Les deux zones et la navigation

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

### Récit 6.3 : Le conseil du jour et le plan si-alors — **demande Julian** *(le contenu des conseils)*

En tant que **pilote**, je veux **une chose technique à la fois quand j'ouvre l'application**, afin
de **progresser sans me faire pousser**.

**Meilleur rapport valeur/coût de la réorientation**, et le seul de ses garde-fous qui soit soutenu
par la littérature.

**Critères d'acceptation**

**Étant donné** le corpus de conseils
**Quand** il est implémenté
**Alors** il vit **en base**, comme le catalogue de caps (AD-10) — un conseil s'ajoute **sans
redéploiement**.

**Étant donné** une ouverture
**Quand** l'accueil s'affiche
**Alors** **un seul** conseil est présenté, choisi de façon **déterministe à partir de la date**, et
il **énonce une technique** — jamais une performance à atteindre, jamais un chiffre à battre.

**Étant donné** le contenu livré
**Quand** il est relu
**Alors** **aucun bandeau de prévention n'y figure.** Mesuré : l'attention à un message
d'avertissement chute **dès la deuxième exposition**, et une menace sans action facile associée
produit **de la défense, pas du changement** (Witte & Allen, 93 études). Écrire « la plupart des
chutes arrivent l'après-midi » sans dire quoi faire est **pire que ne rien écrire**.

**Étant donné** un pilote qui a saisi **quatre sessions**
**Quand** il ouvre l'application
**Alors** il reçoit **une invite unique** — pas récurrente — lui proposant d'écrire un **plan
si-alors dans ses propres mots** (« si je me fais rattraper, alors je lève et je le laisse passer »).
C'est l'intervention comportementale la mieux établie du dossier, **d ≈ 0,65 sur 94 essais**.

**Étant donné** un plan si-alors écrit
**Quand** il est conservé
**Alors** il l'est **mot pour mot** — le produit ne le reformule jamais, ne le corrige jamais, ne le
note jamais. **C'est le fait qu'il soit dans ses mots qui le fait fonctionner.**

**Étant donné** le conseil et l'invite
**Quand** on cherche la notification
**Alors** **il n'y en a aucune** — ni push, ni rappel, ni relance. Ils sont là **quand le pilote
ouvre**, ils ne vont pas le chercher — contre-mesure **C1** du §11.2 du PRD : *notifications de
relance envoyées = 0*, « le signal d'échec le plus important du dispositif ».

---

## Épique 7 : Les instruments de bord

**Objectif.** Sans eux, l'échec ne se constate qu'en octobre 2027. **Ne se coupent jamais.**

### Récit 7.1 : Les trois mesures

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

---

# Les récits des mouvements 2 et 3

**Écrits le 25 août 2026, après coup — et c'est le point.** Les épiques 8 à 16 ont été
CONSTRUITES contre une ligne de tableau chacune. Il n'existait donc rien à quoi opposer leur
code : ni rétrospective, ni revue, ni recette ne pouvaient dire « ce critère n'est pas tenu »,
faute de critère. Plusieurs trous ont vécu des semaines à cause de ça.

Ces récits réparent la dette. Ils ont été écrits dans cet ordre, et l'ordre est la seule chose
qui les rende utiles : ① l'intention d'abord — la ligne de tableau, les FR du PRD, les
interdits ; ② les critères que cette intention exige, y compris ceux qu'on soupçonnait non
tenus ; ③ le code ensuite, et un verdict par critère.

**Un critère déduit de l'implémentation ne peut pas échouer — il tamponne.** C'est la faute
que cette passe cherchait à ne pas commettre, et un lecteur critique a été lancé après coup
pour traquer ceux qui l'avaient commise malgré tout : sa liste est en fin de partie.

⚠ **LE VERDICT FAIT PARTIE DU RÉCIT, ET IL SE PÉRIME.** Il dit l'état du code au 25 août 2026,
avec de quoi le rejouer. Un verdict qu'on ne rejoue pas devient une croyance.


## Épique 8 : L'axe machine prend ses écrans

**Objectif.** Donner des écrans à l'axe machine : un carnet d'interventions daté qui ne passe par aucune journée de piste, ce qui attend au garage sans jamais échoir, et ce que le pilote vise sans l'avoir réservé. Elle refuse trois choses par construction — conseiller mécaniquement, certifier quoi que ce soit, et relancer : elle énonce ce que le propriétaire a déclaré, et ne dit ni quoi faire ni quand.

**La porte.** Le tableau de synthèse ne donne AUCUNE porte à l'épique 8 — il lui donne une fenêtre de calendrier (« mouvement 2, décembre 2026 à février 2027 »), et une date n'est pas une condition observable. Elle est donc fausse au sens où les portes 11 à 16 sont écrites. La bonne porte : **le garage contient au moins une machine**. Avant, l'atelier n'a rien à porter, et le code le dit — `Poste` et `Atelier` ne se rendent que depuis une machine (src/ecrans/Garage.tsx:191-194, 406). Deux choses qu'elle n'est PAS : ce n'est pas « un roulage est saisi » — FR-5 fait des deux axes des racines indépendantes, et rien dans src/db/atelier.ts ne connaît de roulage ; et ce n'est surtout pas « la saison est finie », que FR-53 interdit comme condition de comportement (vérifié : aucune branche du produit ne teste un mois).

*4 récits · 24 critères · 15 tenus · 8 non tenus.*


### Récit 8.1 : Le carnet de la machine, daté et sans journée

En tant que **pilote**, je veux **consigner ce que j'ai fait sur ma moto, avec sa date et ses pièces justificatives**, afin de **avoir un historique que je peux montrer à un acheteur, sans avoir jamais eu à passer par un roulage**.


**Critères d'acceptation**


**Étant donné** une machine sur laquelle aucun roulage n'a jamais été saisi  
**Quand** le pilote consigne une vidange  
**Alors** elle s'enregistre **sans qu'aucun roulage ne soit demandé ni créé** — le carnet est un axe à part entière, pas une feuille de la journée (FR-43, FR-5)

> ✅ **tenu** — src/ecrans/Poste.tsx:46-52 — le composant ne reçoit que `machine` ; src/db/atelier.ts:110-126 — `consigner` n'a aucun paramètre de roulage.


**Étant donné** un geste dont le pilote ne connaît pas ou ne veut pas dire le prix  
**Quand** il le consigne  
**Alors** l'enregistrement **aboutit sans montant** — consigner le geste ne dépend jamais d'avoir consigné l'argent (FR-43)

> ✅ **tenu** — src/ecrans/Poste.tsx:506-507 (« montant, si tu l'as ») et 516 — le bouton n'est désactivé que sur un libellé vide.


**Étant donné** une vidange faite trois semaines plus tôt  
**Quand** le pilote la rattrape au carnet  
**Alors** il peut **poser la vraie date**, et le geste d'un seul tap « c'est fait aujourd'hui » **reste le défaut** — une date fausse sur un carnet d'entretien est pire qu'une absence (FR-43)

> ✅ **tenu** — src/ecrans/Poste.tsx:512-521 (saisie) et 405-425 (acte en attente) — la date est un lien discret, pas un champ toujours ouvert.


**Étant donné** une intervention qui change la définition de la machine — cartographie, amortisseur remplacé par un modèle supérieur  
**Quand** elle est consignée  
**Alors** la machine **porte une version datée** lisible, **distincte d'un simple remplacement à neuf** : c'est l'argument le plus fort du carnet de revente, un acheteur veut savoir ce qui a été amélioré et pas seulement ce qui a été entretenu (FR-4)

> ❌ **NON TENU** — Aucun champ, aucun écran. src/db/schema.ts:33-54 — la table `machine` porte marque, modèle, année, sprite, photo, prix et date d'achat, rien d'autre ; `grep -rn "version" supabase/migrations` ne rend que la version du générateur d'images. La catégorie « amélioration » existe (src/db/atelier.ts:21) mais ne produit aucune version : elle range, elle ne date rien.


**Étant donné** un geste dont le pilote a la facture et une photo de la pièce montée  
**Quand** il les verse au carnet  
**Alors** les deux se rattachent au geste et **la facture n'est jamais comptée comme une photo** — « 3 pièces » sur trois clichés du même disque annoncerait un dossier là où il n'y a qu'un album (FR-38, migration de la preuve d'atelier)

> ✅ **tenu** — src/ecrans/Poste.tsx:380-392 (deux boutons, deux genres), 346-347 et 372-376 (décompte séparé) ; supabase/migrations/20260819000018_preuve_atelier.sql — colonne `photo.genre`, contrainte `photo_genre_connu`.


**Étant donné** le carnet affiché à l'écran  
**Quand** le pilote — ou l'acheteur par-dessus son épaule — le lit  
**Alors** il **énonce là qu'il est auto-déclaré** : il atteste ce que le propriétaire a consigné, **jamais un historique certifié par un tiers** (FR-38, contrainte §2.7)

> ❌ **NON TENU** — src/ecrans/Poste.tsx:105 — le titre est « Le carnet », sans aucune mention. La seule mention du produit vit dans une page à part, src/ecrans/Legal.tsx:35-36, que rien n'oblige à ouvrir. Le carnet lui-même ne dit pas ce qu'il n'est pas.


### Récit 8.2 : Trois listes, jamais une

En tant que **pilote**, je veux **que l'entretien, les améliorations et les bricoles restent séparés partout où le produit les montre**, afin de **qu'un élément de sécurité n'hérite jamais du caractère repoussable d'un cosmétique**.


**Critères d'acceptation**


**Étant donné** des interventions des trois catégories sur la même machine  
**Quand** l'atelier s'affiche  
**Alors** elles se présentent en **trois listes distinctes**, et **aucun écran ne sait en assembler deux** (FR-46)

> ✅ **tenu** — src/ecrans/Atelier.tsx:34-37 — trois aperçus, un par catégorie ; src/db/atelier.ts:83-90 — `interventions` exige la catégorie, il n'existe aucune lecture sans elle.


**Étant donné** la saisie d'une intervention  
**Quand** elle est créée  
**Alors** sa catégorie est **obligatoire** et choisie parmi **exactement trois** — un paramètre facultatif suffirait à faire exister la liste mélangée (FR-46)

> ✅ **tenu** — src/db/atelier.ts:110-150 — `consigner` et `viser` prennent `categorie` en paramètre requis ; supabase/migrations/20260818000001_schema_deux_axes.sql:39 — l'énumération `categorie_intervention` et la colonne `not null`.


**Étant donné** des plaquettes achetées non montées (entretien) et un sticker décollé (bricole), tous deux en attente  
**Quand** le pilote ouvre la préparation de son prochain roulage  
**Alors** les deux **ne figurent pas dans la même liste**, et le libellé de sécurité **ne se lit pas sous le même titre** que le cosmétique — c'est exactement le mécanisme que FR-46 a été écrite pour attraper (FR-46)

> ❌ **NON TENU** — src/db/preparation.ts:74-88 — une seule requête ramène les trois catégories et les pousse toutes dans le même `Tache[]` ; le `genre` vaut `'chute'` ou `'piece'` et **ne porte pas la catégorie**, contrairement à ce qu'affirme le commentaire ligne 71-73. src/ecrans/Preparation.tsx:79-90 — un unique `taches.map` les rend à la suite, chacune sous le même intitulé « Au garage » (src/db/preparation.ts:51).


**Étant donné** trois titres de catégorie  
**Quand** ils s'affichent  
**Alors** chacun **porte sa définition en clair** — trois catégories dont on doit deviner la différence sont trois catégories qu'on remplit au hasard, et FR-46 n'est une clause de sécurité que si le rangement est évident (FR-46)

> ✅ **tenu** — src/db/atelier.ts:63-67 (`SOUS_TITRE`) rendu par src/ecrans/Atelier.tsx:64-67 et src/ecrans/Poste.tsx:76.


**Étant donné** une catégorie où rien n'est consigné  
**Quand** sa page s'ouvre  
**Alors** elle **dit ce que son vide veut dire**, chacune dans ses mots, et **aucune ne se présente comme un échec** — une absence se dit plutôt que de laisser un écran vide

> ✅ **tenu** — src/db/atelier.ts:69-77 (`VIDE`, un texte par catégorie) rendu par src/ecrans/Poste.tsx:106.


**Étant donné** les trois catégories  
**Quand** un chiffre du produit les résume  
**Alors** **aucune vue ne les additionne sous un seul nom** — le fichier d'atelier se l'interdit explicitement, « pas par commodité, pas pour le total : aucune » (FR-46)

> ❌ **NON TENU** — src/db/chiffres.ts:98 — `count(*) FROM intervention WHERE etat = 'faite'`, sans catégorie, étiqueté « gestes consignés » (src/db/chiffres.ts:61). C'est un compte et non une liste, donc aucun élément de sécurité n'y voisine un cosmétique : le tort est structurel, pas visuel — mais la règle que src/db/atelier.ts:16-18 pose est bien enfreinte, depuis un autre fichier.


### Récit 8.3 : Ce qui attend au garage

En tant que **pilote**, je veux **que la pièce achetée et pas encore montée, et la bricole que j'ai photographiée au paddock, existent comme des choses qui attendent**, afin de **les retrouver sans qu'aucune d'elles ne me relance ni ne me compte un retard**.


**Critères d'acceptation**


**Étant donné** un jeu de plaquettes acheté et posé sur l'établi  
**Quand** le pilote le consigne  
**Alors** il devient un **acte en attente à part entière**, **sans date** — et non une ligne de dépense qu'on interprète (FR-45)

> ✅ **tenu** — src/db/atelier.ts:134-150 (`viser`, aucune date insérée) ; src/ecrans/Poste.tsx:522-525 (« Acheté, pas encore monté ») ; la contrainte serveur l'impose, supabase/migrations/20260819000011_atelier.sql:32-36.


**Étant donné** une dépense saisie pour une pièce  
**Quand** elle est enregistrée  
**Alors** elle **ouvre la déclaration de la pièce non montée sans ressaisie**, et la somme **n'est comptée qu'une fois** — c'est le lien direct entre l'argent et le garage (FR-45, FR-26)

> ❌ **NON TENU** — `intervention.depense_id` n'est écrit par personne : `grep -rn "depenseId" src` ne rend que sa définition et son passage à travers src/db/atelier.ts:108, 114, 123, 138, 147 — aucun appelant ne le fournit. Conséquence : le garde anti-double-compte de src/db/depot.ts:99 (`depense_id IS NULL`) est toujours vrai, la « deuxième porte » décrite en commentaire (src/db/depot.ts:84-90) n'existe pas, et le montant saisi à l'atelier ne consomme aucun budget de saison.


**Étant donné** un levier tordu constaté au paddock, gants aux mains  
**Quand** le pilote le photographie  
**Alors** une bricole existe **à partir de la seule photo**, **sans aucun autre champ à remplir** (FR-47)

> ✅ **tenu** — src/ecrans/Poste.tsx:463-483 — `ParLaPhoto` verse la photo puis `viser` avec le libellé « À regarder » posé d'office ; la photo porte la MACHINE et non un roulage (Poste.tsx:468), correctif nommé lignes 456-461.


**Étant donné** des choses en attente depuis des mois  
**Quand** le pilote les consulte, ou ouvre l'accueil  
**Alors** **aucune échéance, aucun compte à rebours, aucun retard, aucune pastille et aucune relance** n'y figurent — leur intérêt est précisément qu'elles peuvent attendre (FR-48, contre-mesure C1)

> ✅ **tenu** — src/ecrans/Atelier.tsx:72-76 (« N en attente », rien d'autre) ; src/ecrans/Poste.tsx:108-112 (ce qui attend en tête, sans marque d'urgence) ; src/db/accueil.ts:125-142 — la présence est énoncée, jamais l'attente ; aucune notification n'existe dans le produit.


**Étant donné** quatre bricoles accumulées pendant la saison  
**Quand** le pilote les fait toutes en une après-midi d'hiver  
**Alors** elles **se soldent en bloc**, en un geste — c'est la seule chose du produit qui se remplit pendant la saison et se vide en dehors, et c'est ce geste-là qui referme le vide saisonnier (FR-48)

> ❌ **NON TENU** — Aucun geste groupé n'existe. src/db/atelier.ts:155 — `cestFait` prend un seul identifiant ; src/ecrans/Poste.tsx:405-425 — « C'est fait aujourd'hui » est rendu ligne par ligne, à l'intérieur de chaque `Geste`. Solder quatre bricoles demande quatre parcours.


**Étant donné** une pièce en attente que le pilote vient de monter  
**Quand** il tape « c'est fait aujourd'hui »  
**Alors** elle devient un acte posé qui **porte sa date**, **garde sa dépense, sa photo et son libellé**, et **fait repartir l'horloge du poste** — c'est FR-43 en entier, en un seul tap (FR-43)

> ✅ **tenu** — src/db/atelier.ts:155-161 (`cestFait` ne touche que `etat` et `date_jour`) puis 179-191 (`faireRepartirLHorloge`, rapprochement à plat sur le libellé, heuristique assumée en commentaire lignes 163-178).


### Récit 8.4 : Ce que le pilote vise

En tant que **pilote**, je veux **noter une sortie que je désire sans l'avoir réservée, avec une date à peu près et un coût à vue de nez**, afin de **avoir quelque chose devant moi quand rien n'est encore engagé, sans que ce désir devienne un engagement**.


**Critères d'acceptation**


**Étant donné** un Bol d'Or auquel le pilote pense sans rien avoir réservé  
**Quand** il le note  
**Alors** **le libellé seul suffit** à l'enregistrer — sa pauvreté est le sujet, pas un manque (FR-54)

> ✅ **tenu** — src/App.tsx:766-768 — le bouton n'est désactivé que sur un libellé vide ; src/db/atelier.ts:220-230 — date et coût nullables ; supabase/migrations/20260819000011_atelier.sql:58-68 — seul `libelle` est `not null`.


**Étant donné** un pilote qui ne sait dire que « juin »  
**Quand** il renseigne la date  
**Alors** elle **se donne à peu près**, sans jour précis — exiger un jour exact **transformerait un désir en engagement**, et le pilote cesserait d'en poser (FR-54)

> ❌ **NON TENU** — src/App.tsx:770 — `<input type="date">` impose un jour complet ; « le Bol d'Or, juin » n'est pas saisissable. Le modèle, lui, le permet (colonne `date_approx` nullable) et src/db/atelier.ts:209-211 donne explicitement « Le Bol d'Or, juin » pour une réponse complète : l'écran contredit son propre contrat.


**Étant donné** un événement visé daté  
**Quand** il s'affiche sur l'accueil ou dans la liste  
**Alors** sa date se présente **comme approximative** et son coût **comme estimé** — jamais comme un fait (FR-54)

> 🟡 **partiel** — Le coût est tenu : « environ … estimés » (src/App.tsx:633) et « ~ » dans la liste (src/App.tsx:761). La date ne l'est pas : src/App.tsx:759-760 rend `date_approx` brute, et src/App.tsx:629 affiche « dans 97 jours » — que le commentaire immédiatement au-dessus (src/App.tsx:627-628) interdit mot pour mot : « afficher dans 97 jours sur un juin inventerait une précision ».


**Étant donné** un événement visé dont la date approche  
**Quand** le pilote ouvre l'application  
**Alors** **rien ne le relance** : aucune notification, aucun impératif, aucun mot de rareté (« plus que », « reste ») — il est là quand le pilote ouvre, il ne va pas le chercher (contre-mesure C1, FR-13)

> ✅ **tenu** — src/App.tsx:622-636 — un titre et deux faits, aucun verbe à l'impératif ; src/db/accueil.ts:186-190 — `direAVenir` ne produit que « aujourd'hui », « demain », « dans N jours » ; aucun envoi de notification n'existe dans le produit.


**Étant donné** un événement visé et une saison en cours  
**Quand** le bilan, les chiffres ou la courbe sont calculés  
**Alors** il **n'y entre pour rien** et **ne devient jamais un roulage** — il est désiré, pas vécu (FR-52, FR-55)

> ✅ **tenu** — `grep -rn "evenement_vise" src` : la table n'est lue que par src/db/accueil.ts:106 et src/db/atelier.ts:217 ; ni src/db/chiffres.ts, ni le bilan de saison, ni la courbe ne la touchent.


**Étant donné** un événement passé, ou un désir auquel le pilote a renoncé  
**Quand** il veut l'effacer  
**Alors** il **se retire**, sinon un désir abandonné **devient une relance permanente** — exactement ce que FR-48 refuse à ce qui attend (FR-54, FR-48)

> ❌ **NON TENU** — `oublierEvenement` existe et est exporté (src/db/atelier.ts:232-234) mais **n'est appelé nulle part** — même profil de défaut que `repartirDe` avant son correctif. L'écran src/App.tsx:753-784 n'offre ni retrait, ni modification : la ligne reste dans « Ce que tu vises » indéfiniment, y compris après la date.


## Épique 9 : L'accueil temporel se branche sur l'atelier

**Objectif.** Brancher la zone temporelle de l'accueil sur les objets que l'épique 8 vient de créer — la pièce achetée non montée, la réparation non vitale, l'événement visé, l'anniversaire de geste — pour que l'accueil ait quelque chose de neuf à dire les cinq mois où plus aucune date n'est devant. Elle n'ajoute aucun objet, n'ouvre aucun écran et ne crée aucune table : elle change ce que l'accueil regarde et l'ordre dans lequel il le regarde. Ce qu'elle refuse : fabriquer un motif d'ouverture — aucune notification, aucune relance — et transformer une source en corvée désignée.

**La porte.** Le tableau de synthèse (epics.md:195) ne donne AUCUNE porte à l'épique 9 : il la date, « décembre 2026 à février 2027 ». Cette datation est fausse au sens du produit — FR-53 tranche qu'« aucun comportement du produit n'est piloté par le calendrier », et une épique qui s'allume sur un mois est exactement la chose que FR-53 interdit à l'intérieur du code. La bonne porte est un état observable, et il se lit en une requête : l'axe machine porte au moins un objet capable d'être une source — une intervention à l'état « visée », un événement visé, ou un geste vieux d'un an jour pour jour — ET la zone temporelle affiche encore un roulage (« Prochain roulage » ou « Dernier roulage ») ou « Rien de saisi ». Tant que ces deux faits sont vrais ensemble, l'épique est allumée et non tenue : l'atelier a de quoi parler et l'accueil ne l'écoute pas. Elle s'éteint quand aucun de ces objets n'existe — un garage vide n'a rien à brancher.

*4 récits · 21 critères · 11 tenus · 7 non tenus.*


### Récit 9.1 : Les quatre sources de l'atelier entrent à l'accueil

En tant que **pilote**, je veux **que l'accueil me montre ce qui m'attend au garage**, afin de **trouver quelque chose à regarder quand plus aucune date n'est devant moi**.


**Critères d'acceptation**


**Étant donné** une pièce achetée et pas encore montée sur ma machine  
**Quand** j'ouvre l'application et qu'aucune date n'est devant moi  
**Alors** l'accueil **l'énonce et la nomme**, avec la **machine** qui l'attend — « Au garage · Plaquettes avant · sur la R6 » (FR-12, FR-45)

> ✅ **tenu** — src/db/accueil.ts:130-138 (la requête sur les actes visés) et src/App.tsx:639-650 (le bloc rendu). Rejoué par banc-rendu/fumee-vide-saisonnier.mjs:68-70.


**Étant donné** des réparations non vitales en attente  
**Quand** j'ouvre et que rien de plus proche n'existe  
**Alors** l'accueil **en dit le nombre**, et **rien d'autre** — aucune échéance, aucun compte à rebours, aucune relance (FR-48)

> ✅ **tenu** — src/db/accueil.ts:139-142 et src/App.tsx:652-662 : « Ça peut attendre · 7 choses à regarder · sur la R6 ». Aucun compteur, aucune date.


**Étant donné** un événement visé, désiré et pas encore réservé  
**Quand** j'ouvre et que rien n'est réservé  
**Alors** l'accueil le montre avec sa **date approximative** — et sans distance en jours si elle n'existe pas — et son coût **annoncé comme estimé** (FR-54)

> ✅ **tenu** — src/db/accueil.ts:105-123 et src/App.tsx:622-637 : « environ 600 € estimés », et la distance n'est rendue que si date_approx existe (App.tsx:629). Vérifié par banc-rendu/fumee-vide-saisonnier.mjs:84.


**Étant donné** un geste consigné il y a un an jour pour jour  
**Quand** j'ouvre ce jour-là  
**Alors** l'accueil **le rappelle**, avec le **circuit** où il a eu lieu et **le nombre d'années**, et il **disparaît de lui-même le lendemain** (FR-12)

> ✅ **tenu** — src/db/accueil.ts:82-96 (comparaison jour-et-mois, année strictement antérieure) et src/App.tsx:612-620. Aucun état persistant : la source cesse d'exister quand la date change.


**Étant donné** une pièce que l'accueil annonce comme achetée et attendant au garage  
**Quand** on cherche l'achat qui la fonde  
**Alors** elle **porte la dépense qui l'a payée** — c'est ce qui en fait « le lien direct entre l'argent et le garage » plutôt qu'une intention notée (FR-45)

> ❌ **NON TENU** — src/ecrans/Poste.tsx:495-498 : `viser(db, commun)` où `commun` vaut `{ machineId, categorie, libelle, centimes }` — jamais `depenseId`. Aucun appelant de `viser` dans tout src/ ne renseigne `depenseId` (grep « depenseId » ne rend que la définition, src/db/atelier.ts:138 et :147). La colonne existe pourtant depuis supabase/migrations/20260819000011_atelier.sql:40-41, écrite pour ça. L'accueil affirme donc un achat que rien n'atteste.


**Étant donné** les quatre nouvelles sources  
**Quand** l'essai de fumée du vide saisonnier tourne  
**Alors** **chacune des quatre y a son cas** — une source qu'aucun essai ne couvre est une source qui peut disparaître sans que personne le voie, et c'est précisément ce branchement qui referme le vide saisonnier (epics.md:195)

> ❌ **NON TENU** — banc-rendu/fumee-vide-saisonnier.mjs couvre le roulage à venir (①, l.38), la pièce (②, l.51-70) et l'événement visé (③, l.72-84). **La source « réparations » et la source « anniversaire » n'ont aucun cas** — deux des quatre sources de l'épique ne sont éprouvées nulle part.


### Récit 9.2 : L'ordre de l'accueil est celui qui a été écrit

En tant que **pilote**, je veux **que ce qui est le plus proche dans le temps prenne la tête tout seul**, afin de **ne rien avoir à régler pour voir ce qui compte aujourd'hui**.


**Critères d'acceptation**


**Étant donné** plusieurs sources qui ont du contenu en même temps  
**Quand** l'accueil se compose  
**Alors** **une seule** paraît en tête, et c'est **le système qui la choisit** — le pilote ne peut ni la changer, ni la réordonner, ni la masquer (FR-11, FR-15)

> ✅ **tenu** — src/db/accueil.ts:72-155 rend un seul objet Source ; src/App.tsx:586-662 rend une seule branche ; aucun réglage n'existe pour la zone temporelle (le seul réarrangement, src/App.tsx:797+, porte sur la zone des chiffres).


**Étant donné** l'ordre de proximité écrit au dossier — roulage à venir, dernier roulage, pièce, réparations, événement, anniversaire  
**Quand** l'écran l'applique  
**Alors** c'est **cet ordre-là**, ou bien **l'écart est écrit et motivé au dossier** — un ordre qui ne vit que dans un commentaire de code n'est opposable à rien (FR-12)

> ❌ **NON TENU** — Trois écarts, aucun écrit hors du code. ① L'anniversaire passe de dernier à **premier** (src/db/accueil.ts:73-96, il retourne avant même que le roulage à venir soit interrogé). ② Le dernier roulage passe de **deuxième à dernier**, derrière les quatre sources d'atelier (src/db/accueil.ts:144-153). ③ L'événement visé passe **devant** la pièce et les réparations (src/db/accueil.ts:121-123). Le seul motif écrit est en commentaire (accueil.ts:73-75, 101-104, 125-129) ; epics.md et le PRD §4.3 portent toujours l'ordre d'origine. Et banc-rendu/fumee-vide-saisonnier.mjs:83 consacre l'écart ③ comme comportement attendu.


**Étant donné** un événement visé sans date, une fois qu'il a eu lieu ou qu'il est abandonné  
**Quand** les mois passent  
**Alors** il **cesse d'occuper l'accueil** — sans quoi une seule ligne posée une fois **éteint définitivement les quatre sources du garage** et rouvre le vide saisonnier (FR-11, FR-54)

> ❌ **NON TENU** — src/db/accueil.ts:107 retient `date_approx IS NULL OR date_approx > ?` : un événement sans date ne sort jamais. Et `oublierEvenement` (src/db/atelier.ts:232-234) **n'est appelé nulle part dans src/** — l'écran des événements (src/App.tsx:735-785) n'offre ni retrait ni « c'est fait ». Comme le retour à l'événement précède la pièce et les réparations (accueil.ts:121-123), un « Bol d'Or » sans date épingle l'accueil pour toujours.


**Étant donné** un anniversaire de geste vieux de quatre ans et un roulage réservé pour demain  
**Quand** l'accueil choisit  
**Alors** c'est **celui des deux qui est le plus proche** qui paraît — l'anniversaire est **comparé**, il ne préempte pas (FR-11)

> 🟡 **partiel** — src/db/accueil.ts:82-96 : l'anniversaire retourne avant toute autre requête. Le commentaire (accueil.ts:73-75) argumente que zéro jour est la plus courte distance possible, ce qui se défend ; mais le code n'écrit pas une comparaison, il écrit une priorité absolue — contrairement au couple roulage/événement, qui lui est bien départagé par la distance (accueil.ts:110-113). Un roulage aujourd'hui même perd contre un anniversaire.


**Étant donné** que le vide saisonnier est une période de l'année  
**Quand** le produit décide quoi montrer  
**Alors** il **teste des états et jamais un mois du calendrier** — l'hiver de l'un est la saison de l'autre (FR-53)

> ✅ **tenu** — Aucun `getMonth()`, aucun `strftime('%m')` dans src/. Le seul découpage de date est src/db/accueil.ts:88, qui compare le jour-et-mois de DEUX dates du pilote — ce n'est pas tester un mois de l'année. Réserve : rien n'automatise ce verdict, il ne tient qu'à la relecture.


**Étant donné** que tout se calcule à l'ouverture  
**Quand** l'application était fermée pendant l'hiver  
**Alors** **rien n'a tourné pendant ce temps** — aucune source ne dépend d'une tâche qui aurait dû s'exécuter la nuit (AD-6)

> ✅ **tenu** — src/App.tsx:151-159 : `sourceAccueil` part de `rafraichir`, au montage et à chaque écriture. Les six branches de src/db/accueil.ts:72-155 sont six requêtes SQL locales, sans état dérivé ni cache daté.


### Récit 9.3 : Aucune de ces sources ne réclame quoi que ce soit

En tant que **pilote**, je veux **ouvrir sans qu'on me rappelle ce que je n'ai pas fait**, afin de **continuer à ouvrir**.


**Critères d'acceptation**


**Étant donné** un libellé produit par l'une des quatre nouvelles sources  
**Quand** on le relit ligne par ligne  
**Alors** il **énonce un fait** et **jamais une échéance ni une injonction** — aucun impératif, aucune exclamation, aucun mot de rareté (FR-13)

> ✅ **tenu** — src/App.tsx:612-662 : « Il y a un an, jour pour jour », « Tu vises », « Au garage », « Ça peut attendre · 7 choses à regarder ». Aucun verbe à l'impératif, aucun « plus que », « reste », « pense à ».


**Étant donné** des réparations qui attendent depuis des mois  
**Quand** l'accueil les annonce  
**Alors** **aucun compteur à rebours, aucune échéance et aucune relance** ne les accompagne — leur intérêt est précisément qu'elles peuvent attendre (FR-48, contre-mesure C1)

> ✅ **tenu** — src/App.tsx:652-662 n'affiche ni date ni ancienneté ; src/db/accueil.ts:139-142 ne calcule aucun délai. Aucune notification n'existe dans le produit (src/db/accueil.ts:199-202).


**Étant donné** le coût d'un événement visé  
**Quand** il paraît à l'accueil  
**Alors** il est **annoncé comme estimé** et **jamais comme une somme due** (FR-54)

> ✅ **tenu** — src/App.tsx:632-634 : « environ 600 € estimés ». Le mot « estimés » est éprouvé au banc, banc-rendu/fumee-vide-saisonnier.mjs:84.


**Étant donné** n'importe quelle chose que l'accueil met sous les yeux du pilote  
**Quand** on cherche ce qu'elle désigne  
**Alors** elle désigne **quelque chose qu'on a envie de voir**, et **jamais une saisie qu'on a oublié de faire** — c'est la règle qui a fait réécrire la deuxième ligne du tableau des sources (FR-12)

> 🟡 **partiel** — Les quatre sources de la zone temporelle tiennent. Mais l'autre moitié du branchement — la préparation, rendue DANS l'accueil sous la zone temporelle dès qu'un roulage est à venir (src/App.tsx:505-510) — se termine par « L'engagement · aucune dépense d'engagement saisie sur cette journée » (src/db/preparation.ts:125-135). C'est littéralement une saisie manquante désignée à chaque ouverture. L'atténuation est réelle et écrite (preparation.ts:117-124 : on n'affirme pas l'impayé), mais la ligne apparaît par ABSENCE de donnée, ce qui est exactement le motif de la clause.


**Étant donné** un libellé de l'accueil qui échoue au test factuel  
**Quand** l'essai de fumée du vide saisonnier tourne  
**Alors** **l'essai échoue** — « un libellé qui échoue au test est un défaut au même titre qu'un calcul faux » (FR-13)

> ❌ **NON TENU** — banc-rendu/fumee-vide-saisonnier.mjs:87-89 calcule bien la liste des mots interdits et l'imprime, mais la ligne :94 fait `process.exit(erreurs.length ? 1 : 0)` où `erreurs` ne collecte que les erreurs de console et de page. Les trois assertions du fichier (l.70, 83, 84, 89) impriment « NON » et l'essai sort à 0. Le banc rapporte, il ne sanctionne pas — et le contrôle FR-13 ne porte que sur l'écran ③, jamais sur les libellés des réparations ni de l'anniversaire.


### Récit 9.4 : Le mur entre les trois catégories tient jusque dans la liste d'avant-roulage

En tant que **pilote**, je veux **que ce qui touche à la sécurité ne soit jamais rangé avec ce qui est cosmétique**, afin de **ne pas repousser une plaquette parce qu'elle voisine un sticker décollé**.


**Critères d'acceptation**


**Étant donné** une plaquette de frein en attente et un sticker décollé en attente sur la même machine  
**Quand** la liste d'avant-roulage se compose à l'accueil  
**Alors** les deux **ne figurent jamais dans la même liste** — sinon l'élément de sécurité **hérite du caractère repoussable du cosmétique** (FR-46)

> ❌ **NON TENU** — src/db/preparation.ts:78-89 : le genre est décidé par `i.chute_id ? 'chute' : 'piece'` — la catégorie n'entre jamais dans le genre. Un entretien et une réparation non vitale reçoivent donc tous deux `genre: 'piece'`, et src/db/preparation.ts:51 les coiffe du même mot, « Au garage ». src/ecrans/Preparation.tsx:79-90 les rend dans un seul `taches.map` plat, avec le même chevron. Seul le motif diffère (« acheté, pas encore monté » contre « à regarder, sans gravité »).


**Étant donné** le partage voulu par le schéma — unifier les deux actes visés en base et les séparer à l'écran  
**Quand** un écran affiche des interventions en attente  
**Alors** **la catégorie descend jusqu'à l'écran** et reste exploitable pour les séparer — le modèle n'a pas à connaître deux objets, mais l'écran doit connaître trois catégories (FR-46)

> ❌ **NON TENU** — L'intention est écrite noir sur blanc dans supabase/migrations/20260819000011_atelier.sql:12-15 : « elles se distinguent par leur CATÉGORIE, qui ne les mélange jamais dans une liste (FR-46). Les unifier ici et les séparer à l'écran est exactement le bon partage. » src/db/preparation.ts:74-89 lit bien `categorie` mais la dissout dans une chaîne de `motif` : le type `Tache` (preparation.ts:39-48) ne porte aucune catégorie, donc aucun écran en aval ne PEUT grouper. Et le commentaire de preparation.ts:71-73 affirme le contraire de ce que le code fait — « Le genre porte la catégorie » : il porte `chute_id`.


**Étant donné** une réparation non vitale dans la liste d'avant-roulage  
**Quand** elle paraît à côté d'une échéance d'usure et d'un entretien  
**Alors** elle **n'hérite d'aucune urgence** de ses voisines — ni compteur de progression, ni couleur d'alerte, ni rang qui la fasse passer pour une chose à finir (FR-46, FR-48)

> 🟡 **partiel** — Tenu sur la moitié qui se voit : aucun compteur, aucune barre, aucune pastille (src/ecrans/Preparation.tsx:23-26 et src/db/preparation.ts:30-34, règle explicitement portée). Non tenu sur le rang : src/db/preparation.ts:76 trie `ORDER BY categorie, id`, ce qui intercale amelioration, entretien puis reparation_non_vitale dans une seule suite — l'entretien de sécurité se retrouve encadré par deux lignes repoussables, sous le même en-tête.


**Étant donné** un garage où rien n'attend et un engagement déjà saisi  
**Quand** la liste d'avant-roulage se compose  
**Alors** elle **dit qu'il n'y a rien** plutôt que de laisser une zone blanche — une absence se dit (FR-14, et la règle de fond : une absence se dit plutôt que de laisser un écran vide)

> ✅ **tenu** — src/ecrans/Preparation.tsx:62-73 : « Rien n'attend au garage, et l'engagement est saisi. » — un état énoncé, pas un vide. Et la préparation n'apparaît jamais sur un roulage déjà vécu (src/App.tsx:498-505), ce qui serait un reproche.


## Épique 10 : Ce que le noyau a coupé — l'argent de la saison

**Objectif.** Rendre au pilote les huit choses que la coupe de décembre lui a retirées sur le seul domaine qu'elle a vraiment amputé : l'argent. Le budget de saison, le coût au tour et sa clause de non-perversion, les trois cibles de rattachement, le pont vers l'atelier, le coût par machine, la reconnaissance de reçu et l'emport. Elle refuse trois choses par principe : elle ne prévoit rien — le seul chiffre du produit qui parle d'avenir est l'enveloppe que le pilote a posée lui-même ; elle n'affiche aucun reste à dépenser ni aucun compte à rebours sur de l'argent ; et elle ne laisse jamais paraître un coût au tour sans le budget consommé, parce qu'un rapport isolé récompense le fait de rouler plus. Deux items du tableau de synthèse ne sont pas repris ici et c'est délibéré : le catalogue d'achievements outillé a déjà ses critères au récit 3.3, et la moitié « deux zones » de l'accueil réarrangeable les a au récit 6.2 — seule la moitié « le pilote choisit ses chiffres » est reprise, au récit 10.3, parce qu'elle est le seul endroit d'où un pilote pourrait casser la clause du coût au tour.

**La porte.** Le tableau de synthèse ne donne AUCUNE porte à l'épique 10 — elle figure dans le tableau « Ce qu'elle contient », pas dans celui des allumages. C'est une omission, pas une épique inconditionnelle, et la bonne porte est celle que FR-24 désigne déjà mot pour mot : **la première dépense saisie**, c'est-à-dire le premier affichage d'un coût. Avant elle, il n'y a ni budget à déclarer, ni consommé à montrer, ni coût au tour à retenir — et la demander plus tôt serait l'étape de configuration que FR-1 interdit. Une réserve, et elle est de fond : **l'emport n'a pas cette porte et ne doit pas l'attendre.** C'est un filet, et un filet posé après la chute ne sert à rien ; il s'allume à la première donnée saisie, quelle qu'elle soit, y compris avant toute dépense.

*4 récits · 23 critères · 11 tenus · 7 non tenus.*


### Récit 10.1 : Le reçu photographié

En tant que **pilote**, je veux **photographier le ticket au lieu de retaper le montant**, afin de **saisir une dépense en un geste, le soir, sans chercher mes lunettes**.


**Critères d'acceptation**


**Étant donné** une dépense en cours de saisie et un ticket de caisse en main  
**Quand** le pilote le photographie  
**Alors** le **montant** et la **catégorie** arrivent **pré-remplis** dans les champs, et **rien n'est enregistré** tant qu'il n'a pas validé — le traitement propose, il ne décide pas (FR-25, §7 du PRD)

> ❌ **NON TENU** — Aucune ligne, nulle part. `src/db/schema.ts:125-139` : la table `depense` porte cible, roulage_id, machine_id, saison_annee, montant_centimes, libelle, poste — aucune colonne de justificatif ni de photo. Recherche de « reçu », « justificatif », « OCR », « pixtral » sur `src/db`, `src/ecrans`, `src/recap`, `src/pixel`, `supabase/functions`, `supabase/migrations` : aucun résultat sur un chemin de dépense.


**Étant donné** un montant reconnu qui se trompe d'un chiffre  
**Quand** le pilote le corrige  
**Alors** sa correction **prime toujours** et s'obtient **en un tap**, et la valeur reconnue **ne revient jamais** par-dessus (FR-25)

> ❌ **NON TENU** — Rien à corriger : le seul chemin de saisie est manuel de bout en bout (`src/ecrans/Depense.tsx:68-75`, `src/ecrans/Budget.tsx:160-165`). Le critère est sans objet parce que la moitié qui le rendrait nécessaire n'existe pas.


**Étant donné** un pilote sans ticket, ou une reconnaissance qui échoue  
**Quand** il saisit malgré tout sa dépense  
**Alors** la saisie **aboutit exactement pareil** — le justificatif est **optionnel** et son absence n'a **aucune conséquence** sur ce qui est enregistré (FR-25)

> ✅ **tenu** — Tenu PAR ABSENCE, et il faut le dire ainsi : `src/ecrans/Depense.tsx:47-64` n'exige que le montant et, pour la cible machine, une machine. Aucun blocage ne peut venir d'un justificatif puisqu'aucun justificatif n'existe. Le verdict tombera à réévaluer le jour où FR-25 sera écrit.


**Étant donné** le paddock, sans réseau  
**Quand** le pilote saisit une dépense  
**Alors** le **hors-ligne ne dépend en rien** de la reconnaissance — la saisie du coût se fait le soir ou le lendemain, et rien du paddock n'attend un service distant (§7 du PRD, UJ-3)

> ✅ **tenu** — Tenu par absence, comme le précédent. `src/ecrans/Depense.tsx` et `src/db/depot.ts:414-425` n'émettent aucun appel réseau : l'écriture va dans la base locale et repart par la synchronisation ordinaire.


**Étant donné** une reconnaissance qui appellerait un service payant  
**Quand** le pilote la déclenche  
**Alors** le **refus tombe AVANT l'appel** — le solde et le plafond sont vérifiés d'abord, et un tap répété **ne fabrique jamais une facture répétée**

> ⬜ **non vérifiable** — Rien à déclencher, donc rien à mettre en échec aujourd'hui. Le gabarit existe pourtant et devra être réemployé : `reserver_generation()` réserve sous verrou avant l'appel pour la fabrique de portraits, avec la table `plafond` en base et le registre `generation` où seule la fonction serveur écrit (A-FAIRE §6). Aucune réservation équivalente n'existe pour une lecture de reçu.


**Étant donné** un reçu photographié et gardé  
**Quand** la dépense est relue plus tard  
**Alors** le justificatif est **conservé avec elle** et **repart dans l'emport** — sans quoi la preuve d'un achat vit sur un seul téléphone (FR-25, NFR-6)

> ❌ **NON TENU** — `src/db/schema.ts:125-139` : la table `depense` n'a aucune colonne de photo, et la table `photo` (`src/db/schema.ts` § photo) ne porte pas de `depense_id` — un cliché ne peut se rattacher qu'à un roulage, une machine, une chute, un geste ou une intervention. Une facture d'atelier a un porteur (`supabase/migrations/20260819000018_preuve_atelier.sql`), une dépense n'en a pas.


### Récit 10.2 : Les trois cibles, et la pièce qui ouvre l'atelier

En tant que **pilote**, je veux **rattacher chaque dépense à une journée, à une moto, ou à la saison seule**, afin de **que rien de ce que je paie n'échappe au budget de ma saison**.


**Critères d'acceptation**


**Étant donné** une nouvelle dépense  
**Quand** le pilote choisit à quoi elle se rattache  
**Alors** les **trois cibles** — cette journée, cette moto, la saison seule — sont offertes **au même rang**, et **aucune n'est un repli silencieux** : rien n'est écrit sans qu'il ait choisi (FR-23, AD-7)

> 🟡 **partiel** — Tenu sur le chemin principal : `src/ecrans/Depense.tsx:86-93` offre les trois, la journée n'apparaissant que lorsqu'un roulage existe — ce qui est correct, une cible sans objet ne s'affiche pas morte. Non tenu sur le second chemin : `src/ecrans/Budget.tsx:146` fixe la cible par défaut et `src/ecrans/Budget.tsx:166` masque entièrement le choix quand aucune moto n'est déclarée — la dépense part alors en « saison » sans qu'aucune question ait été posée.


**Étant donné** un train de pneus acheté en janvier, hors de toute journée  
**Quand** il est enregistré  
**Alors** il rejoint la **saison en cours si elle existe**, sinon la **saison à venir** — il n'atterrit **jamais dans un intervalle sans propriétaire**, et aucun mois de l'année n'est comparé pour l'obtenir (FR-23, AD-8, AD-18, M6)

> ✅ **tenu** — `src/db/depot.ts:412` — `anneeSaison` est l'année de la date de la dépense, une seule expression pour les deux lectures, aucun test de mois. Fixée à la saisie et jamais recalculée (`src/db/depot.ts:414-425`). Éprouvé au banc : `banc-rendu/unite/essais.ts:93-97`.


**Étant donné** des pneus payés le 28 décembre et saisis le 3 janvier  
**Quand** la dépense est enregistrée  
**Alors** elle porte la **saison de l'achat**, pas celle de la saisie — le pilote peut **dire la date à laquelle il a payé** (FR-23, M6)

> ❌ **NON TENU** — Aucun champ de date n'existe hors du chemin roulage. `src/ecrans/Budget.tsx:154` écrit `date: aujourdhui()` sans jamais la demander ; `src/ecrans/Depense.tsx:61` retombe sur `new Date()` dès que la cible n'est pas un roulage. La dépense d'hiver la plus caractéristique du produit — celle que M6 mesure — bascule silencieusement d'une saison à l'autre au passage du 31 décembre.


**Étant donné** une dépense marquée « pièce »  
**Quand** elle est enregistrée  
**Alors** elle se rattache à la **moto** et **ouvre l'intervention sans quitter l'écran** — c'est **le pont par lequel l'argent transporte l'entretien** (FR-26)

> 🟡 **partiel** — Première moitié tenue : `src/ecrans/Depense.tsx:89-91` rattache « PIÈCE OU ENTRETIEN » à la machine. Seconde moitié absente : le pont est câblé côté données (`intervention.depense_id`, `src/db/schema.ts:198`) et côté interface de programmation (`src/db/atelier.ts:111-150`, `depenseId` optionnel), mais **aucun appelant ne le traverse** — les deux seuls appels de `viser`/`consigner` sont `src/ecrans/Poste.tsx:469` et `src/ecrans/Poste.tsx:497-498`, et ni l'un ni l'autre ne passe de dépense. La colonne est écrite `null` partout.


**Étant donné** une pièce achetée mais pas encore montée  
**Quand** le garage est consulté  
**Alors** elle existe comme **état de première classe** — quelque chose attend au garage — et **non comme une simple ligne d'argent**, sans qu'aucun rappel ni compteur ne la réclame (FR-45, FR-48, glossaire)

> ✅ **tenu** — `src/db/atelier.ts:22` — l'état `visee` est une valeur du domaine, pas un artefact ; `src/db/atelier.ts:135-150` crée l'acte visé sans date, « elles attendent, c'est leur nature ». Compté et jamais ordonné : `src/db/atelier.ts:93-101`, affiché « en attente » à `src/ecrans/Poste.tsx:83-86`. Aucune notification associée.


**Étant donné** des dépenses rattachées à une moto  
**Quand** le pilote regarde ce que cette moto lui coûte  
**Alors** le total **se dérive du rattachement, sans aucune saisie supplémentaire**, et **ne compte pas deux fois** une pièce dont on a saisi l'argent et le geste (FR-2, AD-17)

> ❌ **NON TENU** — La fonction juste existe et **n'est appelée nulle part** : `src/db/depot.ts:95-105` — `coutMachine` additionne les dépenses de cible machine et les montants d'intervention non doublonnés (`depense_id IS NULL`) ; recherche de `coutMachine` sur tout `src/` : aucune occurrence hors de sa définition. Le seul chiffre d'argent affiché par moto est `coutAtelier` (`src/db/atelier.ts:195-202`), qui ne somme que `intervention.cout_centimes` par catégorie et **ignore toute dépense de cible machine** — rendu à `src/ecrans/Poste.tsx:90` et `src/ecrans/Atelier.tsx:76`. Un train de pneus à 400 € saisi comme dépense de moto n'apparaît sur aucun écran de cette moto.


### Récit 10.3 : La zone des chiffres, et le coût au tour qui ne paraît jamais seul

En tant que **pilote**, je veux **voir ce que ma saison me coûte sans jamais être félicité d'avoir dépensé plus**, afin de **décider de rouler pour rouler, et non pour amortir**.


**Critères d'acceptation**


**Étant donné** un coût au tour calculable  
**Quand** il s'affiche, où que ce soit  
**Alors** le **budget de saison consommé** est dans **le même bloc visuel**, visible **sans aucune interaction** — et **aucun chemin du produit** ne peut rendre l'un sans l'autre (FR-21, FR-35)

> ✅ **tenu** — L'invariant est descendu dans le TYPE, pas dans un rendu : `src/db/depot.ts:567` — `auTour` transporte `budgetCentimes` et `consommeCentimes` dans un objet indéstructurable, `null` sinon (`src/db/depot.ts:585-587`). Les deux seuls consommateurs le respectent : `src/App.tsx:1237-1249` et `src/recap/composer.ts:195-199`. C'est la garantie la plus solide de toute l'épique.


**Étant donné** un pilote qui n'a pas déclaré son enveloppe  
**Quand** il ouvre le bilan d'une journée  
**Alors** le coût au tour **ne s'affiche pas du tout** — ni zéro, ni tiret — tandis que le **coût de la journée s'affiche seul sans difficulté** (FR-21, FR-22, FR-24)

> ✅ **tenu** — `src/db/depot.ts:585-587` : la condition porte sur le budget et non sur le calcul, « pas de budget, pas de rapport, ni zéro ni tiret ». `src/App.tsx:1233` rend le coût de la journée inconditionnellement ; `src/App.tsx:1237` ne rend le reste que si `auTour` existe.


**Étant donné** un pilote qui n'a jamais posé d'enveloppe  
**Quand** un coût s'affiche pour la première fois  
**Alors** elle se demande **là, en un seul champ**, **jamais à la création du compte** et **jamais comme une étape d'installation** (FR-24, FR-1)

> ✅ **tenu** — `src/App.tsx:1256-1272` — le champ apparaît à la place du coût au tour, dans le bilan du roulage, avec la raison énoncée sans injonction ; `poserBudget` (`src/db/depot.ts:466-482`) réutilise la ligne de l'année plutôt que d'en empiler une seconde. Aucune demande de budget dans le parcours d'inscription.


**Étant donné** toute la dépense réelle d'une saison  
**Quand** le budget consommé est calculé  
**Alors** il **compte tout l'argent saisi**, quel que soit l'écran par lequel il est entré — sinon **FR-21 devient inapplicable faute d'un budget de saison complet**, et le coût au tour reste calculable tout en étant faux (FR-23, FR-21)

> ❌ **NON TENU** — Il existe un SECOND registre d'argent qui ne rejoint jamais le premier. `src/db/budget.ts:163-176` — `declarerEquipement` écrit un montant dans `equipement.cout_centimes` **sans créer aucune dépense** ; `src/db/budget.ts:186-190` le totalise à part (`coutEquipement`, affiché seul à `src/ecrans/Budget.tsx:238-240`). Or le consommé de la saison ne lit que `depense` : `src/db/depot.ts:450-454`. Une combinaison à 900 € et une tente à 300 € déclarées à l'équipement sont invisibles du budget consommé — donc du couple que FR-21 impose — alors qu'un poste « Équipement » existe par ailleurs (`src/db/budget.ts:33-36`), ce qui rend la double saisie tout aussi possible que l'oubli.


**Étant donné** la zone des chiffres de l'accueil et ses trois ou quatre cases  
**Quand** le pilote la réarrange comme il veut  
**Alors** **aucune combinaison qu'il peut produire** ne laisse le coût au tour seul, la zone **ne descend jamais au vide**, et la **disposition par défaut est complète et utilisable telle quelle** — le réarrangement n'est **jamais présenté comme une étape d'installation** (FR-15, FR-21, FR-14)

> ✅ **tenu** — Tenu par construction, et c'est la bonne façon de le tenir : le coût au tour **n'est pas une case proposée** — `src/db/chiffres.ts:25-33` n'offre que roulages, circuits, meilleur tour, sessions, tours, dépensé cette saison, machines, gestes. Défaut à trois cases complètes (`src/db/chiffres.ts:46`), plafond à quatre (`src/db/chiffres.ts:51`), plancher à une (`src/App.tsx:805-810`), et l'accès au réglage est un lien discret sous la zone (`src/App.tsx:840`), sans assistant ni invite.


**Étant donné** le budget consommé de la saison  
**Quand** il est représenté  
**Alors** il se lit comme un **compteur de crédits qui se consomme**, jamais comme un **reste à dépenser** ni un compte à rebours — et il est **visible partout où la saison parle d'argent** (§8 du PRD, FR-21)

> 🟡 **partiel** — Le compteur n'existe qu'à un seul endroit et le second se l'interdit. Présent au bilan d'un roulage : `src/App.tsx:1248-1253`, « consommé X sur Y » plus une jauge qui se remplit, sans reste à dépenser. Absent de l'écran qui porte le nom : `src/ecrans/Budget.tsx` n'importe ni `budgetDeclare` ni le consommé, et son en-tête (`src/ecrans/Budget.tsx:27-34`) proscrit explicitement « aucune barre qui se remplit » — l'écran Budget affiche donc un total par poste sans jamais montrer l'enveloppe. Les deux écrans se contredisent sur la même règle.


### Récit 10.4 : L'emport, et ce qu'il dit de lui-même

En tant que **pilote**, je veux **récupérer ma saison dans un fichier lisible sans l'application**, afin de **ne pas dépendre du produit pour garder ce que j'ai vécu**.


**Critères d'acceptation**


**Étant donné** un pilote qui demande son emport  
**Quand** le fichier est produit  
**Alors** il se lit **sans MyPaddock**, avec un outil courant, et il **porte ses propres conventions** — sans quoi un nombre reste un nombre sans unité et la saison est illisible dans cinq ans (FR-27, NFR-6)

> ✅ **tenu** — `src/db/emporter.ts:56-65` — les conventions (centimes entiers, millisecondes, dates ISO, UUID v7, définition de la saison) sont écrites DANS le fichier ; `src/db/emporter.ts:185-186` produit un JSON indenté. Le poids est annoncé avant le geste (`src/ecrans/Compte.tsx:247-255`).


**Étant donné** tout ce que le compte sauvegarde  
**Quand** l'emport est produit  
**Alors** il **sort exactement ce que la sauvegarde envoie** — une donnée qui monte au serveur et ne descend pas dans le fichier est une donnée qu'on croit tenir et qu'on n'a pas (NFR-6)

> ✅ **tenu** — Corrigé depuis l'inventaire du 24 août, qui relevait onze tables sur dix-sept : la liste n'est plus tenue à la main, elle est DÉRIVÉE de la liste d'envoi — `src/db/emporter.ts:50` (`const TABLES = ORDRE`), `src/db/sauvegarde.ts:52` (les dix-sept), et un essai interdit la divergence : `banc-rendu/unite/essais.ts:336-338`. L'équipement, les chutes, les horloges d'usure, l'événement visé, la checklist et les preuves d'atelier en sortent désormais.


**Étant donné** un emport auquel il manque quelque chose  
**Quand** le fichier est relu  
**Alors** il **nomme ce qu'il ne contient pas** au lieu de le taire, et il **n'affirme jamais être complet quand il ne l'est pas** — une absence se dit (NFR-6)

> 🟡 **partiel** — Le mécanisme existe et il est bon : `src/db/emporter.ts:143-163` nomme les photos restées au serveur, celles écartées par le choix « sans les images », et les portraits de machine sans copie locale. Mais la phrase de repli reste plus large que le fichier : `src/db/emporter.ts:169` écrit « rien — tout ce que porte ce téléphone est ici » alors que le référentiel (circuits, caps, conseils, barèmes, organisateurs) et le registre des générations sont bien sur ce téléphone et ne sortent pas. L'exclusion est délibérée et documentée (`src/db/emporter.ts:22-26`) — c'est la phrase, pas la décision, qui dépasse.


**Étant donné** un serveur inaccessible, un compte perdu, ou le produit arrêté  
**Quand** le pilote déclenche son emport  
**Alors** le fichier se produit **entièrement hors ligne**, depuis ce que porte le téléphone — un filet qui appelle le serveur n'est d'aucun secours le jour où le serveur est le problème (NFR-6, NFR-2)

> ✅ **tenu** — `src/db/emporter.ts` n'émet aucune requête réseau : lectures `db.getAll` pour les tables (`src/db/emporter.ts:129-131`) et lectures OPFS pour les images (`src/db/emporter.ts:76-86`, `src/db/emporter.ts:150-156`). Aucun `fetch` dans le fichier.


**Étant donné** un carnet d'entretien emporté et transmis à un acheteur  
**Quand** il est relu hors de l'application  
**Alors** il porte **avec lui** qu'il est **auto-déclaré** — il atteste ce que le propriétaire a consigné, **jamais un historique certifié par un tiers** (interdit n°7)

> ❌ **NON TENU** — La clause n'existe qu'à l'écran : `src/ecrans/Legal.tsx:35-36`. Les clés du fichier emporté (`src/db/emporter.ts:164-172` : produit, format, emporte_le, a_lire_ainsi, ne_contient_pas, caps, puis les tables) ne portent aucune mention de ce genre. Un JSON d'interventions envoyé à un acheteur arrive donc dépouillé de la seule phrase qui l'empêche de se lire comme une attestation.


## Épique 11 : La courbe de progression

**Objectif.** Rendre lisible, circuit par circuit, ce qu'une saison de chronos a produit : un point par journée chronométrée, relié aux autres, et rien de plus. Elle constate un écart déjà mesuré — elle ne projette aucune tendance, ne fixe aucune cible, ne met aucun pilote en face d'un autre, et ne commente jamais un tour plus lent. Elle est délibérément hors du noyau de décembre parce qu'elle n'a pas les points pour dire quoi que ce soit avant d'en avoir : c'est la démonstration même que la récompense de ce produit est différée.

**La porte.** La porte du tableau est fausse sur ses deux moitiés. ① « trois roulages saisis » n'allume rien : le point de la courbe est un chrono, pas une journée — trois roulages inscrits à Pau-Arnos sans meilleur tour laissent l'écran muet (courbe.ts:50-57, la jointure exige un tour). La bonne condition est : UN MÊME CIRCUIT COMPTE TROIS ROULAGES PORTANT CHACUN UN CHRONO — orthographes rapprochées à plat, jamais une date. ② « avant, elle ne dit rien » décrit le code mais promeut un défaut en spécification : FR-14 tranche qu'un écran vide ne sous-délivre pas, il signale l'abandon, et la décision produit du 24 août (commit 151afca, « Le garage dit ce qui manque au lieu de montrer un cadre vide ») a déjà appliqué la règle ailleurs. La bonne seconde moitié est : EN DEÇÀ DU SEUIL, L'ÉCRAN NOMME CE QUI PRENDRA CETTE PLACE — comme la fiche de circuit nomme la longueur qui descendra de la récolte — sans décompter et sans réclamer de saisie.

*4 récits · 21 critères · 15 tenus · 5 non tenus.*


### Récit 11.1 : L'allumage, et l'absence qui se dit

En tant que **pilote**, je veux **que ma progression sur un circuit apparaisse dès qu'elle a de quoi se lire, et qu'on me dise ce qui l'attend tant qu'elle n'y est pas**, afin de **ne pas prendre un blanc pour une panne ni pour une fonction absente**.


**Critères d'acceptation**


**Étant donné** un circuit où j'ai trois roulages portant chacun un meilleur tour  
**Quand** j'en ouvre un  
**Alors** la courbe est là — l'allumage tient à **une condition observable**, **jamais à une date**, et deux points ne suffisent jamais : deux points font toujours une droite, donc toujours un mouvement qui n'existe pas (FR-20)

> ✅ **tenu** — src/db/courbe.ts:23 (POINTS_MINIMUM = 3) et :60 (retourne null en deçà) ; banc-rendu/unite/essais.ts:419-422 ; banc-rendu/fumee-courbe.mjs:21-32 et :45-49


**Étant donné** trois roulages inscrits au même circuit **sans aucun chrono** — y compris une sortie annoncée depuis un calendrier et pas encore roulée  
**Quand** je les ouvre  
**Alors** **rien ne s'allume** : le point de la courbe est un **chrono**, pas une journée, et une inscription ne prouve pas qu'on a roulé (FR-20, FR-61)

> ✅ **tenu** — src/db/courbe.ts:50-57 — la jointure roulage → session → tour et `HAVING ms IS NOT NULL` écartent toute journée sans tour ; tenu par la forme de la requête, aucune clause n'exclut explicitement l'état brouillon


**Étant donné** le même circuit écrit « Pau-Arnos » un jour et « pau arnos » un soir  
**Quand** la courbe se construit  
**Alors** les deux journées **font la même courbe** — deux orthographes ne fabriquent pas deux circuits chacun sous le seuil, et le gain ne se calcule jamais sur une série amputée

> ✅ **tenu** — src/db/courbe.ts:58-59 et :91-97 (rapprochement et regroupement par `aplati`) ; src/db/depot.ts:198-200 ; défaut ④ de la revue adverse 9aca3ef, corrigé


**Étant donné** deux roulages chronométrés seulement sur ce circuit  
**Quand** j'ouvre le roulage  
**Alors** l'écran **nomme ce qui prendra cette place**, comme la fiche de circuit nomme la longueur qui descendra de la récolte — **il ne se tait pas** (FR-14)

> ❌ **NON TENU** — src/App.tsx:1169-1176 — le commentaire l'assume mot pour mot : « Rien ne signale son absence, et rien n'annonce ce qu'il faudrait faire pour la voir apparaître » ; src/db/courbe.ts:76-78 refuse par principe de lister les circuits « pas encore prêts » ; et banc-rendu/fumee-courbe.mjs:33-34 vérifie activement l'INVERSE — l'essai passe au vert précisément parce que rien n'est dit


**Étant donné** cette annonce d'absence  
**Quand** elle est rendue  
**Alors** elle **ne décompte rien** (« encore un roulage ») et **ne réclame aucune saisie** — un décompte fabrique une cible, et **un cap se constate**

> ⬜ **non vérifiable** — la clause n'a pas d'objet : rien n'est affiché sous le seuil (src/App.tsx:1176). banc-rendu/fumee-courbe.mjs:33-34 teste l'absence de tout texte de ce genre et passe ; ce contrôle devra être inversé, pas supprimé, le jour où le critère précédent est tenu


**Étant donné** un circuit qui a de quoi tracer une courbe  
**Quand** je pars du circuit lui-même  
**Alors** je **l'atteins depuis lui** — la porte de cette épique est un **circuit**, pas un roulage, et un produit conçu pour quelqu'un qui a oublié comment il marche ne peut pas exiger qu'on retrouve la bonne journée (NFR-14bis)

> ❌ **NON TENU** — la courbe n'est montée qu'à un seul endroit, le bilan d'un roulage : src/App.tsx:1176 (unique usage, vérifié par grep sur tout src/). src/ecrans/Circuit.tsx affiche premier chrono, meilleur et progrès mais aucune courbe et aucun lien vers elle. src/db/courbe.ts:79 `circuitsAvecCourbe` est exporté et **appelé nulle part** — même classe de défaut que `repartirDe` au défaut ① de la revue adverse 9aca3ef


### Récit 11.2 : Le tracé littéral — le plus rapide est le plus bas

En tant que **pilote**, je veux **un dessin qui dit la même chose que sa légende**, afin de **lire ma progression d'un coup d'œil sans me tromper de sens**.


**Critères d'acceptation**


**Étant donné** une série où mon dernier tour est le plus rapide  
**Quand** la courbe est rendue  
**Alors** le point du **tour le plus rapide est le plus bas** du tracé, et la phrase sous le dessin dit **la même chose que le dessin** — un dessin qui contredit sa légende est pire qu'un dessin sans légende : **on croit le dessin**

> ✅ **tenu** — src/ecrans/Courbe.tsx:31 (`y = H - M - ((v - min) / etendue) * (H - 2 * M)`) et :65 (« Plus le tracé descend, plus le tour est rapide ») ; vérifié sur les COORDONNÉES, pas sur la légende, par banc-rendu/fumee-courbe.mjs:68-79


**Étant donné** deux roulages successifs  
**Quand** ils sont reliés  
**Alors** le trait est **droit** et **aucune valeur n'est inventée** entre deux journées qui n'ont jamais été mesurées — aucun lissage, aucun flou

> ✅ **tenu** — src/ecrans/Courbe.tsx:33 et :49-50 (polyline, `shapeRendering="crispEdges"`, aucune courbe de Bézier) ; src/styles/systeme.css:254-257 ; banc-rendu/fumee-courbe.mjs:51-58


**Étant donné** un roulage qui compte plusieurs sessions  
**Quand** il devient un point  
**Alors** il en fait **exactement un**, son **meilleur tour du jour** — un point par roulage, pas par session (FR-20)

> ✅ **tenu** — src/db/courbe.ts:51-56 (`min(t.temps_ms) … GROUP BY r.id`) ; banc-rendu/fumee-courbe.mjs:51-58 compte les points


**Étant donné** un tour qui bat tous ceux qui le précèdent  
**Quand** il est tracé  
**Alors** **le violet s'allume sur lui seul** — et le premier point n'en est jamais un : il n'a rien battu, il a commencé

> ✅ **tenu** — src/db/courbe.ts:62-69 (`record = i > 0 && p.ms < mieux`) ; src/ecrans/Courbe.tsx:51-56 (`fill` bascule sur `--record`) ; banc-rendu/fumee-courbe.mjs:55 et :59


**Étant donné** un pilote qui n'y voit pas  
**Quand** la courbe est lue à voix haute  
**Alors** elle **énonce les chronos eux-mêmes**, dans leur ordre du plus ancien au plus récent — pas « graphique »

> ✅ **tenu** — src/ecrans/Courbe.tsx:46-48 (aria-label listant `formaterChrono` de chaque point) ; banc-rendu/fumee-courbe.mjs:60 et :72-74, qui s'en sert comme source de vérité


**Étant donné** le défaut d'axe **déjà commis une fois** — la courbe rendue à l'envers sous une légende qui disait le contraire  
**Quand** il est rejoué  
**Alors** il **fait rougir les essais**, pas seulement une ligne de journal — un contrôle qui ne sait pas mettre en échec n'en est pas un

> ❌ **NON TENU** — banc-rendu/fumee-courbe.mjs:78-79 imprime « NON — le tracé contredit sa légende » puis :108 sort avec `process.exit(erreurs.length ? 1 : 0)` — seule une erreur de console rougit. Idem :82 (projection) et :97 (mélange de circuits). banc-rendu/essais.mjs:6-9 ne lit que le code de sortie : le seul essai né de l'incident ne peut pas le rattraper


### Récit 11.3 : Les trois refus — aucune projection, aucune cible, aucun autre pilote

En tant que **pilote**, je veux **qu'elle constate et rien de plus**, afin de **ne pas repartir avec un objectif que je n'ai pas choisi**.


**Critères d'acceptation**


**Étant donné** une série de quatre points qui descend  
**Quand** elle est rendue  
**Alors** **aucune tendance, aucune droite, aucun « à ce rythme »** n'y figure — une projection sur quatre points est une **fiction**, et une fiction qui fixe un objectif que personne n'a choisi

> ✅ **tenu** — src/ecrans/Courbe.tsx:33-56 ne trace que les points mesurés ; src/db/courbe.ts:14-16 pose la clause ; contrôle (non bloquant, voir 11.2) banc-rendu/fumee-courbe.mjs:81-82


**Étant donné** mon record sur ce circuit  
**Quand** la courbe l'affiche  
**Alors** **ce qui reste à faire pour le battre n'apparaît nulle part** — un cap se constate, il ne se vise pas

> ✅ **tenu** — src/db/courbe.ts ne calcule aucun reste : les seules sorties sont `points` et `gainMs` (:25-33, :71-73) ; src/ecrans/Courbe.tsx n'affiche aucun objectif


**Étant donné** des roulages à Pau-Arnos et à Nogaro  
**Quand** j'ouvre la courbe de Pau-Arnos  
**Alors** **Nogaro n'y entre pas** et son nom n'y apparaît pas — deux circuits sur le même axe ne mesurent rien (FR-17, FR-20)

> ✅ **tenu** — src/db/courbe.ts:58-59 filtre sur `aplati(circuit)` ; banc-rendu/fumee-courbe.mjs:85-103 ajoute Nogaro et recompte les points de Pau-Arnos


**Étant donné** un dernier roulage **plus lent** que le premier  
**Quand** la courbe est rendue  
**Alors** elle **montre le tracé et se tait** — aucun mot de jugement, aucune relance, aucun encouragement : le produit **énonce**

> ✅ **tenu** — src/db/courbe.ts:73 (`gainMs: meilleur < depart ? depart - meilleur : null`) et :29-32 ; src/ecrans/Courbe.tsx:41-43 — le chiffre n'est simplement pas rendu s'il n'y a pas eu de gain, aucune branche « plus lent » n'existe


**Étant donné** un pote qui roule sur les mêmes circuits que moi  
**Quand** j'ouvre ma courbe  
**Alors** **aucune courbe d'un autre pilote** ne partage mon axe et **aucun rang** n'est calculé entre nous

> ✅ **tenu** — src/db/courbe.ts:50-57 n'interroge que la base locale, qui ne porte que mes lignes (RLS, supabase/migrations/20260824000001_est_membre_ne_repond_que_de_soi.sql) ; aucune référence à la courbe dans src/db/cercle.ts ni src/ecrans/Cercle.tsx (grep sur tout src/)


**Étant donné** le récapitulatif partageable  
**Quand** il est fabriqué  
**Alors** **la courbe n'y entre pas** — le récapitulatif doit fonctionner sur **un seul roulage, sans courbe**, et un chrono masqué (FR-19) ne peut pas ressortir par un tracé

> ✅ **tenu** — aucune occurrence de `Courbe` dans src/ecrans/Recap.tsx ; le composant n'est monté qu'en src/App.tsx:1176, dans le bilan privé du roulage


### Récit 11.4 : Chaque point dit d'où vient son chrono

En tant que **pilote**, je veux **savoir, point par point, si le temps vient de ma mémoire ou d'un appareil**, afin de **ne pas lire comme une progression ce qui n'est qu'un changement d'instrument**.


**Critères d'acceptation**


**Étant donné** un point de la courbe  
**Quand** je le lis, à l'écran ou à voix haute  
**Alors** il **dit d'où vient son chrono** — ma mémoire, un chronomètre embarqué, ou le chronométrage de l'organisateur — parce qu'un temps saisi et un temps mesuré **n'ont pas la même précision** et que le produit ne les présente **jamais comme équivalents** (FR-18, NFR-13), par la même discipline qui fait porter sa complétude à l'horloge d'usure et sa date à la conformité

> ❌ **NON TENU** — src/db/courbe.ts:51 ne sélectionne jamais `t.provenance` — le type `Point` (:25) ne porte que `id`, `date`, `ms`, `record` ; src/ecrans/Courbe.tsx, y compris l'étiquette d'accessibilité :46-48, n'en dit rien. La colonne existe pourtant, obligatoire, depuis supabase/migrations/20260818000001_schema_deux_axes.sql:159 et src/db/schema.ts:114-120


**Étant donné** une série où **deux provenances** se suivent — trois tours de mémoire puis un relevé au transpondeur  
**Quand** elles sont tracées sur le même axe  
**Alors** la différence **se voit sur le tracé**, sinon le dessin fabrique une progression qui n'est que le changement d'appareil

> ❌ **NON TENU** — rien dans src/db/courbe.ts ni src/ecrans/Courbe.tsx ne distingue deux provenances. Le mélange ne se produit pas aujourd'hui pour une seule raison, accidentelle : src/db/depot.ts:350-353 et src/ecrans/Sonde.tsx:78 n'écrivent que `'saisie_manuelle'`, le palier 2 de NFR-13 n'étant pas construit. Le jour où un import arrive, le défaut est silencieux


**Étant donné** n'importe quel point de n'importe quelle courbe  
**Quand** on cherche son origine  
**Alors** **aucun ne vient du GPS du téléphone** — le pilote n'a pas son téléphone en piste, il est resté au camion, et un chronométrage par GPS est **faux dès le départ**, pas seulement repoussé (NFR-13)

> ✅ **tenu** — aucune occurrence de `geolocation`, `navigator.geo` ou `watchPosition` dans src/ ; l'énumération `provenance_chrono` de supabase/migrations/20260818000001_schema_deux_axes.sql:20-23 ne contient aucune valeur GPS, et src/db/schema.ts:114 le dit en toutes lettres


## Épique 12 : L'horloge d'usure et le barème

**Objectif.** Dire au pilote où en est chaque poste d'entretien de sa machine, en comptant les roulages qu'il a réellement faits, pondérés par son niveau, et en portant toujours la qualité de sa propre source. Elle refuse trois choses sans exception : conseiller — aucune sortie ne dit ce qu'il faut faire ni ne certifie la sécurité d'une machine ; inventer un intervalle qu'aucun barème n'a donné ; et laisser un chiffre adjacent à la sécurité prétendre à une précision que sa source n'a pas.

**La porte.** La porte du tableau est fausse, et de deux façons. Elle dit « ≈ mai 2027 » : c'est une date, alors que le tableau qui la porte s'ouvre sur « Aucune date : chaque épique s'allume sur une condition observable ». Et elle est fausse au fond : ce qui allume l'horloge n'est pas l'accumulation de roulages — une horloge sans intervalle compte utilement dès le premier — c'est l'existence d'un poste suivi. La bonne porte, observable : **une machine porte au moins un poste d'entretien suivi, avec ou sans intervalle, et au moins un roulage en usage a eu lieu depuis le point de départ de ce poste.** Corollaire à trancher, parce qu'il casse une dépendance écrite ailleurs : la porte de l'épique 16 dit « le service Railway devient nécessaire, c'est-à-dire à l'épique 12 ». C'est faux depuis A-FAIRE §5 (A-FAIRE.md:102) — aucune source de barème constructeur ne sera proposée, une documentation d'atelier étant de la propriété intellectuelle protégée. L'épique 12 n'a donc besoin d'aucune récolte : elle a besoin d'un poste saisi à la main. Vérifié en base le 25 août : `bareme` 0 ligne, `source_recolte` de genre `bareme` 0 ligne, `horloge` 0 ligne — la porte n'est franchie chez personne aujourd'hui.

*4 récits · 23 critères · 12 tenus · 7 non tenus.*


### Récit 12.1 : L'horloge compte les roulages, et dit sur quoi elle compte

En tant que **pilote**, je veux **voir où en est chaque poste d'entretien de ma machine, avec la qualité de ce chiffre à côté du chiffre**, afin de **décider moi-même quand y aller, sans croire une précision qui n'existe pas**.


**Critères d'acceptation**


**Étant donné** une machine dont un poste est suivi  
**Quand** son avancement s'affiche  
**Alors** il se compte en **roulages** et jamais en kilomètres, et chaque roulage **pèse selon le niveau du pilote ce jour-là**, jamais selon le nom du groupe donné par l'organisateur (FR-41, FR-6bis)

> ✅ **tenu** — src/db/usure.ts:134-144 — la requête filtre par machine et pondère chaque ligne par `coef(niveauDuGroupe(rang, total))` ; la projection rang→niveau est src/db/usure.ts:45-58 et n'utilise que la position relative, jamais un libellé. Couvert au banc : banc-rendu/unite/essais.ts:425-441 (six cas, dont l'organisateur à groupe unique).


**Étant donné** un chiffre d'usure présenté au pilote  
**Quand** il apparaît, **où qu'il apparaisse**  
**Alors** sa **complétude est dans le même écran, à côté de lui**, sans exception et sans repli derrière une interaction (FR-40, interdit n°2 du PRD §6)

> ❌ **NON TENU** — Tenu sur l'écran du garage : src/ecrans/Usure.tsx:59-67 rend « sur N roulages saisis · M sans groupe » sans interaction. **Défait sur le second écran** : src/db/preparation.ts:106-111 fabrique la tâche « X roulages depuis, l'intervalle est de Y », rendue nue par src/ecrans/Preparation.tsx:86 — aucune complétude, aucune mention des roulages sans groupe. L'invariant que src/db/usure.ts:67-78 place dans le type `Avancement` est contourné parce que preparation.ts n'appelle pas `horloges()` : il requête la table directement (src/db/preparation.ts:95-97). Un invariant de type ne protège que les chemins qui passent par lui.


**Étant donné** deux écrans qui parlent du même poste de la même machine  
**Quand** chacun affiche son avancement et son dépassement  
**Alors** ils donnent **le même nombre** et **le même seuil**

> ❌ **NON TENU** — Deux divergences, sur la même donnée. ① Le nombre : src/db/usure.ts:143 additionne des coefficients (`ponderes += coef(n)`), src/db/preparation.ts:101 fait un `count(*)` brut, non pondéré — identiques tant que tous les coefficients valent 1 (vérifié en base : 4 lignes à 1), et divergents au jour où FR-42 est calibré, c'est-à-dire au jour où ce chiffre commence à vouloir dire quelque chose. ② Le seuil : src/ecrans/Usure.tsx:49 déclare dépassé à `ponderes >= intervalle`, src/db/preparation.ts:106 à `n > intervalle`. À exactement 6 roulages sur un intervalle de 6, le garage annonce « au-delà de l'intervalle » et la liste d'avant-roulage ne dit rien.


**Étant donné** un roulage saisi sans son groupe de niveau  
**Quand** il entre dans le compte  
**Alors** il **compte pour un** — il a bien eu lieu — et sa **pondération inconnue est dite**, jamais confondue avec une pondération nulle

> ✅ **tenu** — src/db/usure.ts:139-144 : `if (!n) sansGroupe++` puis `ponderes += coef(n)` où `coef(null)` retourne 1 (src/db/usure.ts:117-118). Rendu à src/ecrans/Usure.tsx:63-65 : « M sans groupe, donc comptés sans pondération ».


**Étant donné** le facteur qui traduit un niveau en vitesse d'usure  
**Quand** on cherche où il vit et ce qu'il montre  
**Alors** il **vit en base**, se change **sans redéploiement**, et **aucun écran ne l'affiche** comme une constante (FR-42, interdit n°5)

> ✅ **tenu** — Table `coefficient_usure` semée à 1 pour les quatre niveaux (supabase/migrations/20260819000013_frontiere_et_usure.sql:33-40), descendue par le flux référentiel (powersync/sync-config.yaml:58), lue à src/db/usure.ts:112-113 avec repli à 1 si absente. Vérifié en base le 25 août : 4 lignes, toutes à 1. Aucune occurrence du coefficient dans src/ecrans/.


**Étant donné** un roulage saisi pour une date à venir  
**Quand** l'horloge compte  
**Alors** il **ne fait pas vieillir la machine** — une journée qui n'a pas eu lieu n'use rien

> ✅ **tenu** — src/db/usure.ts:136 (`date_jour <= ?`, le jour courant étant l'argument par défaut de src/db/usure.ts:104) et src/db/preparation.ts:103. Le commentaire src/db/usure.ts:130-133 date le défaut : l'horloge repartait à 1 au lieu de 0.


### Récit 12.2 : Poser un poste, et le faire repartir d'un geste

En tant que **pilote**, je veux **choisir moi-même les postes que je suis, et dire « c'est fait » d'un seul tap**, afin de **que l'horloge reparte au moment du geste, sans passer par la caisse ni par un formulaire**.


**Critères d'acceptation**


**Étant donné** un poste que je veux suivre sans connaître son intervalle  
**Quand** je le pose  
**Alors** l'horloge **compte sans jamais échoir**, et le produit **dit qu'elle ne peut pas échoir** au lieu de laisser croire à une échéance (FR-44)

> ✅ **tenu** — src/db/usure.ts:164-175 : `intervalle` reste nul si le pilote ne le donne pas. Dit deux fois à l'écran : src/ecrans/Usure.tsx:107-110 avant la pose, src/ecrans/Usure.tsx:66 après (« aucun barème connu, cette horloge compte sans échoir »).


**Étant donné** un poste que je viens de faire, la clé encore à la main  
**Quand** j'appuie sur « c'est fait aujourd'hui »  
**Alors** le geste **est consigné** et l'horloge **repart**, dans le même tap — et **rien n'exige d'avoir consigné la dépense** (FR-43)

> ✅ **tenu** — src/db/usure.ts:200-216 : une intervention `entretien`/`faite` est écrite, puis `depuis_intervention` pointe dessus, sans jamais toucher à `depense`. Câblé à src/ecrans/Usure.tsx:87-91. Le commentaire src/ecrans/Usure.tsx:83-86 date le défaut : le troisième effet manquait, et l'horloge affichait son dépassement à vie.


**Étant donné** une horloge qui vient de repartir  
**Quand** je relis le carnet du poste  
**Alors** **rien n'a été effacé** — l'horloge a changé de point de départ, elle ne s'est pas remise à zéro

> ✅ **tenu** — src/db/usure.ts:180-186 et 212-213 n'écrivent que `depuis_intervention` ; les lignes `intervention` précédentes subsistent et restent listées par le carnet du poste (src/ecrans/Poste.tsx:104-113). Aucun DELETE sur `intervention` dans src/db/usure.ts.


**Étant donné** une machine sur laquelle aucun poste n'est suivi  
**Quand** j'ouvre l'entretien  
**Alors** **une phrase le dit** plutôt que de laisser un blanc sous un titre — une absence se dit

> ❌ **NON TENU** — src/ecrans/Usure.tsx:46-47 pose le titre « usure » puis itère sur une liste vide : il ne reste que le lien « Suivre un poste d'usure » (src/ecrans/Usure.tsx:117), et aucune phrase. Le motif juste existe deux blocs plus bas dans le même écran, pour le carnet : src/ecrans/Poste.tsx:106 rend `VIDE[categorie]` quand la liste est vide. Cas réel aujourd'hui : `horloge` compte 0 ligne en base.


**Étant donné** une horloge qui a dépassé son intervalle  
**Quand** je la regarde  
**Alors** le produit **énonce le dépassement** et s'arrête là — ni « à changer », ni « danger », ni durée de vie restante (FR-44, interdit n°1)

> ✅ **tenu** — src/ecrans/Usure.tsx:69-73 : une seule phrase, « Au-delà de l'intervalle transcrit. » Aucun champ de verdict n'existe dans le schéma, et c'est délibéré — supabase/migrations/20260819000013_frontiere_et_usure.sql:45-51 nomme les trois champs refusés (`etat_piece`, `risque`, `a_faire_avant`) au motif que « ce qui n'existe pas dans le schéma ne s'affiche pas par accident ».


**Étant donné** un intervalle que j'ai tapé moi-même au clavier  
**Quand** le dépassement s'énonce  
**Alors** le produit **ne le présente pas comme venant du constructeur** — il ne peut pas transcrire ce que personne ne lui a donné

> ❌ **NON TENU** — src/ecrans/Usure.tsx:72 affiche « Au-delà de l'intervalle **transcrit** » pour toute horloge, sans regarder la provenance. Or src/db/usure.ts:170-172 écrit `extrait_par_ia = 0` et ne pose **aucun** `source_url` : à ce jour, 100 % des intervalles viennent du clavier du pilote. Le mot « transcrit » attribue au constructeur un chiffre que le pilote a estimé — exactement la confusion que FR-44 existe pour empêcher, et au seul endroit du produit où l'erreur touche la sécurité.


### Récit 12.3 : Le barème constructeur, ou son absence dite

En tant que **pilote**, je veux **que l'intervalle d'un poste vienne du barème de ma machine quand ce barème existe**, afin de **ne pas avoir à deviner un chiffre qui touche à la sécurité — et savoir quand le produit ne l'a pas**.


**Critères d'acceptation**


**Étant donné** une machine dont la marque, le modèle et l'année sont saisis  
**Quand** je pose un poste d'entretien  
**Alors** l'intervalle **du barème de cette machine-là** est proposé s'il existe (FR-44)

> ❌ **NON TENU** — Aucun fichier de src/ ne lit la table `bareme` — la seule occurrence hors schéma est src/db/schema.ts:398 (déclaration) et src/db/schema.ts:459 (liste du référentiel). Le formulaire de pose ne consulte rien : src/ecrans/Usure.tsx:99-113 est deux champs de texte. L'année est pourtant collectée pour cette raison exacte, et le libellé le promet : src/ecrans/Garage.tsx:466-469, « Année · elle désigne le bon barème d'entretien ». Elle ne désigne rien.


**Étant donné** un barème présenté quelque part dans le produit  
**Quand** je le lis  
**Alors** il **porte sa source, sa date de relevé et la mention qu'il a été extrait automatiquement** (FR-44, AD-11)

> 🟡 **partiel** — Les trois colonnes sont obligatoires côté serveur (supabase/migrations/20260818000001_schema_deux_axes.sql:81-96) et l'écran sait les rendre (src/ecrans/Usure.tsx:75-81, avec « transcrit, jamais interprété. À vérifier auprès du constructeur »). Mais ce bloc est conditionné à `a.source.url`, et **aucun écrivain ne le remplit jamais** : src/db/usure.ts:170-172 insère sans `source_url`. Le seul écrivain existant est le service de récolte (recolte/index.mjs:154-175), qui écrit dans `bareme`, table que le flux de synchronisation **exclut délibérément** (powersync/sync-config.yaml:46-48). La garantie est écrite et n'a jamais été exercée : 0 ligne dans `bareme` en base.


**Étant donné** une ligne de barème que j'ai corrigée à la main  
**Quand** une nouvelle récolte passe dessus  
**Alors** **ma correction n'est jamais écrasée** — une extraction par IA est une reconstruction, pas une transcription

> 🟡 **partiel** — Le garde-fou existe côté serveur et il est vérifié AVANT écriture : recolte/index.mjs:164-167 lit `corrige_par_pilote` et passe son tour. La colonne existe bien en base (vérifié le 25 août sur `information_schema.columns`). Mais **aucun chemin ne permet à un pilote de corriger quoi que ce soit** : `corrige_par_pilote` n'apparaît nulle part dans src/. Le drapeau que la récolte respecte, personne ne peut le lever.


**Étant donné** un barème constructeur, qui s'exprime en kilomètres ou en mois  
**Quand** une horloge, qui compte en roulages, doit s'en servir  
**Alors** la conversion **n'est jamais inventée** — et si elle ne peut pas être transcrite, le produit **le dit** au lieu de fabriquer un intervalle

> ❌ **NON TENU** — C'est la vraie raison pour laquelle ce point est noir, et ce n'est pas un oubli de branchement. `bareme` ne porte que `intervalle_km` et `intervalle_mois` (supabase/migrations/20260818000001_schema_deux_axes.sql:88-89, contrainte `bareme_a_un_intervalle` ligne 95) ; `horloge` ne porte que `intervalle_roulages` (supabase/migrations/20260819000013_frontiere_et_usure.sql:56). Aucun pont n'existe, et **tout pont serait une interprétation** — traduire 6 000 km en roulages exige de supposer un kilométrage par journée que le produit ne mesure pas et refuse de mesurer (pas de GPS, pas de compteur relevé, src/db/usure.ts:68-69). Le produit ne dit nulle part qu'il ne peut pas faire descendre un barème dans une horloge : il laisse le pilote saisir un nombre et l'appelle ensuite « transcrit ».


**Étant donné** aucun barème connu pour ma machine  
**Quand** j'arrive sur l'entretien  
**Alors** le produit **dit qu'il n'en a pas** et me laisse saisir l'intervalle moi-même, plutôt que de rester muet sur la question

> 🟡 **partiel** — Dit, mais trop tard et seulement à moitié. Le formulaire annonce l'incertitude (« tous les combien de roulages · si tu le sais », src/ecrans/Usure.tsx:104) et l'horloge posée sans intervalle le rappelle (src/ecrans/Usure.tsx:66). Rien ne le dit **avant** la pose ni au niveau de la machine : un pilote qui a saisi son année pour « désigner le bon barème » (src/ecrans/Garage.tsx:469) n'apprend jamais qu'aucun barème n'existe, ni qu'aucune source n'en apportera — A-FAIRE.md:100-105 tranche qu'aucune source de barème ne sera proposée, une documentation d'atelier étant protégée.


**Étant donné** n'importe quelle sortie du produit  
**Quand** on y cherche un verdict de sécurité  
**Alors** **rien ne certifie** l'état d'un véhicule ni la durée de vie restante d'une pièce (FR-44, interdit n°1)

> ✅ **tenu** — Aucun champ de verdict dans le schéma, refus documenté à supabase/migrations/20260819000013_frontiere_et_usure.sql:45-51. Aucune sortie de src/db/usure.ts ne rend une durée restante — `Avancement` (src/db/usure.ts:67-78) ne porte que le compte, l'intervalle, la complétude et la provenance. L'écran renvoie explicitement au constructeur (src/ecrans/Usure.tsx:79). Réserve sans effet sur ce verdict : le mot « transcrit » du critère 12.2-6 abuse de la provenance, il ne certifie rien.


### Récit 12.4 : La frontière tenue dans le modèle, et invisible à l'écran

En tant que **pilote**, je veux **que le produit ne compte comme roulé que ce que j'ai réellement roulé**, afin de **que ma machine ne vieillisse pas d'une journée que je n'ai pas faite — sans avoir à apprendre le vocabulaire de son schéma**.


**Critères d'acceptation**


**Étant donné** une journée venue d'un calendrier d'organisateur  
**Quand** l'horloge compte  
**Alors** elle **ne la compte pas** : une inscription ou une présence annoncée n'use pas une machine (FR-61)

> ✅ **tenu** — Le filtre est en place aux deux endroits qui comptent : src/db/usure.ts:136 et src/db/preparation.ts:103, tous deux `etat = 'usage'`. La contrainte serveur n'admet que deux valeurs (supabase/migrations/20260819000013_frontiere_et_usure.sql:16). Réserve honnête : **jamais exercé** — 0 roulage en `brouillon` en base, et aucun chemin d'import n'existe encore (src/db/depot.ts:509-511, « seul un import de calendrier produit un brouillon, et il n'existe pas encore »).


**Étant donné** une journée annoncée que j'ai réellement faite  
**Quand** je la confirme  
**Alors** elle **rejoint le compte de l'usure** — un brouillon devient un usage confirmé par le pilote ou par une mesure (FR-61)

> ❌ **NON TENU** — Aucun geste de confirmation n'existe dans le produit : la seule écriture de `roulage.etat` hors création est le rattrapage à passe unique src/db/depot.ts:513-519, qui force tout à `usage`. Le côté serveur, lui, fabrique déjà des brouillons dans `roulage_publie` (recolte/index.mjs:175-184). Sans porte de confirmation, un brouillon qui descendra un jour restera invisible à l'usure pour toujours.


**Étant donné** les quatre mots de la frontière — brouillon, usage, preuve, recommandation  
**Quand** je parcours l'application  
**Alors** **aucun ne remonte à l'écran** : je vois au plus une distinction, « à confirmer » contre confirmé

> ✅ **tenu** — `brouillon` n'apparaît dans src/ que dans des commentaires et une valeur SQL (src/db/schema.ts:100, src/db/usure.ts:127, src/db/depot.ts:511) ; aucune occurrence dans un libellé rendu. Tenu par défaut plutôt que par construction, cela dit : « à confirmer » n'existe pas non plus (grep vide), ce qui est l'autre face du critère précédent.


**Étant donné** ce que l'horloge m'affiche  
**Quand** je demande d'où sort ce chiffre  
**Alors** c'est une **sortie de règle qui porte sa source et son incertitude**, jamais un état de la machine (FR-61)

> 🟡 **partiel** — L'incertitude est portée : la complétude est inséparable du chiffre dans le type (src/db/usure.ts:67-78) et rendue sans interaction (src/ecrans/Usure.tsx:59-67). La source ne l'est pas : le bloc de provenance est conditionné à `a.source.url` (src/ecrans/Usure.tsx:75), qu'aucun écrivain ne pose (src/db/usure.ts:170-172). Aujourd'hui, toute horloge affichée est donc un chiffre sans aucune source — et sur le second écran, ni source ni incertitude (src/ecrans/Preparation.tsx:86).


**Étant donné** une facture, une photo ou une ligne de carnet  
**Quand** le produit en a besoin  
**Alors** elle **ne se déduit jamais** d'autre chose — une preuve se saisit

> ✅ **tenu** — src/db/usure.ts:200-216 n'écrit une intervention que sur le tap explicite du pilote (src/ecrans/Usure.tsx:87-91) ; rien n'infère une intervention depuis une dépense, une photo ou un dépassement d'horloge. Symétriquement, src/db/preparation.ts n'écrit rien : il ne fait qu'énoncer des faits déjà saisis (src/db/preparation.ts:10-28).


## Épique 13 : Checklist de chargement et conformité organisateur

**Objectif.** Faire qu'un jeudi soir de préparation suffise à ce que rien ne manque dimanche matin, et que ce qu'un organisateur exige arrive tel qu'il l'a publié, avec sa date. Elle refuse trois choses, et chacune est une conséquence de schéma avant d'être une question de rédaction : certifier une admission — aucun « conforme », aucun « validé », aucune colonne qui pourrait le dire ; compter la progression — une liste qui affiche ce qui manque devient une chose à finir ; inventer une règle — ce qui vient d'un organisateur porte sa source ou n'existe pas.

**La porte.** Le tableau écrit « avant le premier roulage encadré de la saison ». **Elle est fausse deux fois.** D'abord c'est une date déguisée, alors que le mouvement 3 pose que chaque épique s'allume sur une condition observable (epics.md:200-206) et que FR-53 interdit tout comportement piloté par le calendrier. Ensuite le mot « encadré » ne désigne rien dans le produit : un roulage ne porte ni organisateur saisi ni rattachement au référentiel, aucun écran ne propose de choisir un organisateur, et la table `organisateur` compte 0 ligne — rien ne distingue un roulage encadré d'un autre. La porte juste est en deux temps, et il faut les séparer parce qu'elles n'ouvrent pas les mêmes récits. ① Le chargement s'allume quand **un roulage à venir est saisi** — il ne lui faut rien d'autre, et cette porte-là est déjà ouverte. ② La conformité s'allume quand **le référentiel porte au moins une règle publiée rattachée au circuit ou à l'organisateur de ce roulage** — c'est celle qui compte, parce que sans elle l'épique ne livre qu'une liste de camion générique et que FR-50 comme FR-51 n'ont plus rien à décrire. Cette seconde porte est fermée aujourd'hui, et mesurablement : `regle_organisateur` 0 ligne, `organisateur` 0 ligne, 0 roulage sur 4 rattaché à un circuit, `source_recolte` 5 lignes dont 0 active (requête du 25 août 2026 sur le projet mypaddock).

*4 récits · 23 critères · 17 tenus · 5 non tenus.*

> **RELECTURE DU 25 AOÛT 2026.** Cette épique est la première relue une par une,
> et la relecture a produit plus que des verdicts corrigés.
>
> ⚠ **Un défaut BLOQUANT que aucun récit ne décrivait, parce qu'il ne vit dans
> aucun des deux écrans mais ENTRE EUX.** « Avant d'y aller » (23 août) et le
> chargement partagent la table `checklist_ligne` sur le même roulage. L'écran du
> chargement lisait toutes les catégories, et s'en servait pour décider s'il était
> déjà composé. Une seule tâche de préparation — « payer l'engagement », le geste
> que Julian décrit lui-même — et le chargement de ce roulage devenait
> **définitivement incomposable** : plus de bouton, une liste vide, et un en-tête
> qui annonçait « 1 chargé » alors que le camion était vide. Deux jours de vie,
> aucun essai capable de le voir : aucun n'exerçait les deux listes sur le même
> roulage. Corrigé, et l'essai qui le reproduit a été vérifié dans les deux sens
> (banc-rendu/fumee-preparation.mjs ⑥).
>
> ⚠ **La porte de l'épique était fermée par UN DÉCLENCHEUR MANQUANT, pas par une
> fonctionnalité manquante.** src/db/depot.ts:605-610 explique pourquoi la PWA ne
> pose pas `circuit_id` — le raisonnement est juste — et conclut : « la
> normalisation se fait côté serveur ». Elle n'a jamais été écrite : `roulage` ne
> portait aucun déclencheur, et 4 roulages sur 4 étaient sans circuit, depuis le
> premier jour. C'est ce qui rendait FR-49, FR-50 et FR-51 inatteignables, avec
> 32 circuits pourtant en base. Écrit, appliqué, vérifié : **4 roulages sur 4
> rattachés**, un nom inconnu n'attache rien, et un renvoi à NULL par l'adoption
> se répare tout seul (migration 20260825000003).


### Récit 13.1 : Le chargement se compose depuis ce qui est déjà saisi

En tant que **pilote**, je veux **que la liste de chargement se compose seule depuis ma machine, mon équipement déclaré et ce que l'organisateur publie**, afin de **n'avoir rien à écrire le jeudi soir et rien à me rappeler le dimanche matin**.


**Critères d'acceptation**


**Étant donné** une machine et un équipement déjà déclarés au garage  
**Quand** je prépare le chargement d'un roulage à venir  
**Alors** la liste porte **ma machine et mon équipement à moi** — le casque et la combinaison que j'ai saisis — et non une liste générique identique pour tout le monde (FR-49)

> ❌ **NON TENU** — src/db/checklist.ts:54-66 — `CHARGEMENT_EMBARQUE`, onze libellés en dur (« Combinaison », « Casque », « Béquilles »…) ; src/db/checklist.ts:107-112 les insère tels quels. `composer` n'interroge jamais `equipement` ni `machine` : son seul SELECT sur le roulage est checklist.ts:93-94 et ne lit que `circuit_id` et `organisateur_id`. La table `equipement` existe pourtant et porte le nom de chaque pièce (src/db/schema.ts:155-169).


**Étant donné** un roulage dont l'organisateur publie des règles  
**Quand** la liste se compose  
**Alors** ces règles **y figurent comme lignes de conformité**, à côté du chargement (FR-49, UJ-5)

> ❌ **NON TENU** — mais **le verrou nommé ici est levé depuis le 25 août**. La normalisation « censée le poser plus tard » n'existait nulle part : `roulage` ne portait aucun déclencheur. Elle existe maintenant (migration 20260825000003, `roulage_trouve_son_circuit`), et **4 roulages sur 4 sont rattachés** — un nom tapé « pau arnos » trouve Pau-Arnos, un nom inconnu n'attache rien, et le renvoi à NULL de l'adoption se répare de lui-même. Ce qui reste bloquant est ailleurs, et c'est le récit 13.4 : `regle_organisateur` est vide et n'a **aucun semeur**. La requête de checklist.ts rend donc encore une liste vide — faute de règles, non plus faute de rattachement.


**Étant donné** des lignes cochées au fur et à mesure du chargement du camion  
**Quand** je referme l'application, la relance, ou reviens l'année suivante  
**Alors** les coches **sont toujours là**, attachées à ce roulage comme trace (FR-49)

> ✅ **tenu** — src/db/checklist.ts:125-128 (`cocher` écrit en base locale) ; powersync/sync-config.yaml:29 fait descendre `checklist_ligne` ; banc-rendu/fumee-checklist.mjs:44-50 rejoue le rechargement et vérifie « 2 chargés ».


**Étant donné** la liste ouverte  
**Quand** je cherche ce qui me dirait où j'en suis — un « 8 sur 11 », un pourcentage, une barre qui se remplit  
**Alors** **il n'y en a aucun** : la liste énonce ce qui est **chargé**, jamais ce qui manque (FR-50, interdiction n°4 du §6 du PRD)

> ✅ **tenu** — src/ecrans/Checklist.tsx:44-48 — « 8 chargés » quand des lignes sont cochées, « 11 lignes » sinon ; jamais de dénominateur. banc-rendu/fumee-checklist.mjs:56-60 échoue sur « conforme », « validé », « admis », « %, sur 11 » et sur la présence d'une jauge.


**Étant donné** une liste déjà composée et partiellement cochée  
**Quand** je rouvre l'écran du roulage  
**Alors** **rien ne se recompose et rien ne se décoche** — une liste qui se décoche toute seule est une liste qu'on cesse d'utiliser (FR-49)

> ✅ **tenu** — src/db/checklist.ts:89-91 — `composer` compte les lignes existantes et rend 0 sans rien écrire dès qu'il y en a une.


**Étant donné** un roulage à venir, saisi le jeudi soir  
**Quand** je l'ouvre depuis « Prochain roulage »  
**Alors** le chargement est accessible **avant la journée**, et pas seulement après elle (UJ-5)

> ✅ **tenu** — src/App.tsx:1182 rend `<Checklist>` sur la fiche d'un roulage sans aucune condition sur les sessions ni sur le chrono ; la fiche est atteinte depuis le bloc « Prochain roulage » (src/App.tsx:665-671).


**Étant donné** que j'ai noté le jeudi soir ce qu'il me reste à faire — « payer l'engagement », « passer chercher le bidon »
**Quand** j'ouvre ensuite le chargement du même roulage
**Alors** je peux **toujours le composer**, et l'en-tête **ne compte que le camion** : ce que je fais AVANT d'y aller n'est pas ce que j'emporte (FR-49)

> ✅ **tenu depuis le 25 août** — **ce critère manquait, et son absence a laissé vivre un défaut bloquant.** Les deux listes partagent `checklist_ligne` sur le même roulage depuis le 23 août ; l'écran du chargement lisait toutes les catégories et s'en servait pour décider s'il était déjà composé. Une seule tâche de préparation rendait le chargement **définitivement incomposable** — plus de bouton, une liste vide — et l'en-tête annonçait « 1 chargé » pour un camion vide. Aucun essai ne pouvait le voir : aucun n'exerçait les deux listes sur le même roulage, et c'est pourtant l'ordre naturel des gestes. Le chargement lit maintenant `CHARGEMENT` et rien d'autre (src/db/checklist.ts, `lignesDuChargement`, garde de `composer`). Trois essais nouveaux : le reproducteur de bout en bout, vérifié dans les deux sens (fumee-preparation ⑥), et deux unitaires qui empêchent une cinquième catégorie d'apparaître sans être rangée d'un côté, ou d'exister dans le produit sans être acceptée par le serveur.

> ⚠ **UNE CONTRADICTION RESTE OUVERTE ENTRE LE PREMIER ET LE CINQUIÈME CRITÈRE, et elle n'est pas de rédaction.** Le premier veut que la liste se compose depuis *mon* équipement déclaré ; le cinquième veut que rien ne se recompose jamais. Les deux sont justes séparément et incompatibles ensemble : la dorsale achetée en mars n'apparaîtra jamais sur une liste composée en février, en silence, et le pilote partira sans elle en croyant sa liste à jour. La règle qui manque est une troisième : **un équipement déclaré après coup s'ajoute comme ligne non cochée, et aucune coche existante ne bouge.** À trancher avant d'implémenter le premier critère, sans quoi on livrera le défaut avec la fonctionnalité.


### Récit 13.2 : Ce que l'organisateur publie, avec sa source et sa date

En tant que **pilote**, je veux **que chaque ligne venue d'un organisateur me dise qui l'a publiée et quand**, afin de **savoir ce que je lis, et ne jamais croire que l'application m'a autorisé à entrer**.


**Critères d'acceptation**


**Étant donné** une ligne venue d'un organisateur  
**Quand** elle s'affiche  
**Alors** elle dit **qui l'a publiée et à quelle date**, en clair — « publié par l'organisateur le 12 mars 2026 » (FR-50)

> ✅ **tenu depuis le 25 août** — l'était « partiellement » : « publié le 2026-03-12 », la date au format machine, et personne. `regle_organisateur` SAIT pourtant qui — elle porte `organisateur_id` et `circuit_id` — mais la composition ne recopiait que trois colonnes. Deux colonnes ajoutées (`publie_par`, migration 20260825000002), recopiées à la composition depuis un `LEFT JOIN` sur l'organisateur puis le circuit (src/db/checklist.ts), et rendues par `direPublication` : « publié par le Moto Club de Pau le 12 mars 2026 ». Dénormalisées à dessein — une trace dit ce qui était vrai le jour où elle a été prise. Essai unitaire : « une règle publiée dit QUI, et le dit en clair ».


**Étant donné** n'importe quel endroit de l'écran  
**Quand** j'y cherche un mot qui tranche — conforme, validé, admis, autorisé  
**Alors** **il n'y en a aucun**, et aucune fonction ne rend un tel verdict : le produit **rapporte** ce qu'un organisateur a publié, il ne certifie pas l'admission (FR-50, interdiction n°6 du §6 du PRD)

> ✅ **tenu** — 20260819000014_checklist_et_conformite.sql:33-46 — aucune colonne « conforme », « admis » ni « valide » ; src/db/checklist.ts:30-37 (le type `Ligne` n'en porte pas) ; banc-rendu/fumee-checklist.mjs:52-58 met l'absence à l'épreuve sur le texte réel de l'écran.


**Étant donné** que j'ajoute une ligne à la main  
**Quand** j'essaie d'en faire une exigence d'organisateur  
**Alors** **je ne peux pas** — une règle sans provenance n'existe ni à l'écran ni en base (FR-50)

> ✅ **tenu** — src/db/checklist.ts:130-141 — la catégorie `conformite` est ramenée à `machine` avant l'insertion (ligne 136) ; côté serveur la contrainte `conformite_porte_sa_source` refuse le cas (20260819000014_checklist_et_conformite.sql:42-44). L'écran n'offre d'ailleurs que « autre chose à charger » (Checklist.tsx:90-99).


**Étant donné** une règle **reconstruite par une extraction automatique**  
**Quand** elle s'affiche au pilote  
**Alors** elle **le dit** — une extraction n'est pas une transcription, et ce texte-là engage le passage au contrôle technique (FR-50 ; garde-fou QO-6, PRD §11)

> ✅ **tenu depuis le 25 août** — c'était le manque le plus grave de l'épique : la mention existait dans le référentiel depuis le 19 août et se perdait **exactement au moment où elle atteint un humain**, sur un texte qui engage le passage au contrôle technique (garde-fou QO-6). `checklist_ligne.extrait_par_ia` ajoutée (20260825000002), recopiée à la composition, affichée en clair — « relevé automatiquement sur la page ». Et la contrainte serveur `conformite_porte_sa_source` l'exige désormais au même titre que la source et la date : une règle extraite ne peut plus entrer en se présentant, par le silence, comme une transcription.


**Étant donné** un roulage dont on ne connaît aucune règle publiée  
**Quand** j'ouvre le chargement  
**Alors** le produit **dit qu'il ne sait rien** des règles de cet organisateur, au lieu de faire disparaître la section sans un mot — une absence se dit (FR-50 ; règle de fond du projet)

> ✅ **tenu depuis le 25 août** — la catégorie `conformite` survit désormais à son vide, seule des trois : « Aucune règle publiée n'est connue pour ce roulage. Ça ne veut pas dire qu'il n'y en a pas — l'organisateur reste la seule source. » Faire disparaître la section laissait lire « l'organisateur n'exige rien » là où la vérité est « le produit ne sait rien ». Le garde-fou du banc a été resserré en même temps plutôt qu'assoupli : il vérifiait l'absence de la SECTION, il vérifie maintenant l'absence de toute LIGNE sans source, et la présence de la phrase (banc-rendu/fumee-checklist.mjs ④).


### Récit 13.3 : Une fiche vieille de plus d'un an le dit

En tant que **pilote**, je veux **qu'une règle publiée il y a longtemps m'affiche son âge et m'invite à vérifier**, afin de **aller demander à l'organisateur plutôt que de partir avec une exigence périmée**.


**Critères d'acceptation**


**Étant donné** une règle publiée plus de douze mois avant le jour du roulage  
**Quand** j'ouvre le chargement  
**Alors** la ligne **affiche son âge** et une note **invite à vérifier auprès de l'organisateur** (FR-51)

> ⬜ **non vérifiable** — et il reste le seul de l'épique dans cet état. Le rendu est écrit, et il est meilleur qu'au 24 août (`direLAge`, la note d'invitation à vérifier). Des deux raisons qui l'empêchaient d'être éprouvé, une est tombée le 25 : les roulages sont désormais rattachés à leur circuit. L'autre tient : `regle_organisateur` compte 0 ligne, faute de semeur (récit 13.4). Le jour où une seule règle entre, ce critère devient vérifiable **sans une ligne de code de plus** — c'est la meilleure raison de traiter 13.4 en premier.


**Étant donné** une règle récente  
**Quand** elle s'affiche  
**Alors** **rien ne la présente comme à jour** — aucun « à jour », aucune pastille verte, aucun « vérifié le » (FR-51, interdiction n°6)

> ✅ **tenu** — src/ecrans/Checklist.tsx:67-74 n'affiche que la date de publication ; aucun libellé de fraîcheur dans src/db/checklist.ts:39-44 (`NOM_CATEGORIE` dit « Ce que l'organisateur publie », pas « Conformité »).


**Étant donné** l'âge d'une fiche  
**Quand** il se calcule  
**Alors** il part de **la date de publication**, jamais de la date de récolte — récolter hier une page de 2024 ne rajeunit pas la règle (FR-50, FR-51)

> ✅ **tenu** — src/db/checklist.ts:150-155 — `moisDepuis(publie_le, jour)`, appelé avec `ligne.publie_le` (Checklist.tsx:55). `recolte_le` n'est même pas recopié dans la ligne de checklist (checklist.ts:113-118), ce qui rend la confusion impossible par construction.


**Étant donné** une fiche publiée il y a dix-huit mois  
**Quand** son âge s'affiche  
**Alors** il est **lisible et exploitable** — « il y a 18 mois » — et non arrondi à une unité qui écrase l'écart (FR-51)

> ✅ **tenu depuis le 25 août** — `direLAge` remplace l'arrondi : « il y a 18 mois » jusqu'à vingt-trois, puis « il y a 2 ans et 6 mois ». L'arrondi écrasait précisément l'écart que FR-51 demande de rendre exploitable — treize mois, on vérifie par acquit ; vingt-trois, la saison entière a changé de règlement. Essai unitaire : « l'âge d'une fiche n'écrase jamais l'écart », qui exige aussi qu'aucune forme de machine (« an(s) ») ne subsiste.


**Étant donné** une fiche périmée  
**Quand** elle s'affiche  
**Alors** elle **n'est ni masquée ni barrée** — le produit énonce son âge, il ne retire pas la règle ni ne bloque le chargement (FR-51)

> ✅ **tenu** — src/ecrans/Checklist.tsx:54-77 rend la ligne quel que soit son âge ; l'ancienneté n'ajoute qu'un suffixe (ligne 72) et une note (78-86), et ne retire jamais rien.


### Récit 13.4 : Les règles publiées entrent par la récolte, ou n'entrent pas

En tant que **porteur du projet**, je veux **que les règles publiées par les circuits arrivent dans le référentiel par le service de récolte**, afin de **que la conformité ait quelque chose à rapporter — sans quoi les deux récits précédents décrivent un écran que personne ne verra jamais**.


**Critères d'acceptation**


**Étant donné** une source active qui publie les règles d'un circuit  
**Quand** un tour de récolte a lieu  
**Alors** ces règles **sont écrites dans le référentiel**, chacune avec sa source, sa date de publication et sa date de récolte (FR-49, FR-50)

> ❌ **NON TENU** — recolte/index.mjs:152 n'a que deux branches — `s.genre === 'bareme' ? SCHEMA_BAREME : SCHEMA_CALENDRIER` — et la boucle d'écriture (index.mjs:160-186) n'écrit que dans `bareme` ou `roulage_publie`. Aucun schéma d'extraction de règle n'existe (index.mjs:81-94). `regle_organisateur` n'a donc **aucun semeur**, alors que la base déclare bien trois genres : requête sur `source_recolte` → `calendrier` 2, **`regle` 3** (Pau-Arnos, Nogaro, Lédenon).


**Étant donné** une source de genre « règle » que l'on activerait aujourd'hui  
**Quand** elle est récoltée  
**Alors** elle **n'est pas traitée comme un calendrier** — une page de règles n'est pas une liste de dates (FR-49)

> ❌ **NON TENU** — recolte/index.mjs:152 — le ternaire envoie tout ce qui n'est pas `bareme` vers `SCHEMA_CALENDRIER`. Une page de règles de Pau-Arnos partirait donc avec la consigne « rends les sorties, le prix, le nombre de groupes », et ce qui en sortirait serait tenté en insertion dans `roulage_publie` (index.mjs:176-183). La règle n'irait nulle part ; une date reconstruite, elle, pourrait atterrir.


**Étant donné** une règle écrite dans le référentiel  
**Quand** il lui manque sa source ou sa date de publication  
**Alors** **elle est refusée** — sans date, l'âge de FR-51 serait incalculable et la fiche se présenterait comme à jour, ce qui est l'inverse exact de ce qui est demandé (FR-50, FR-51)

> ✅ **tenu** — 20260819000014_checklist_et_conformite.sql:23-24 — `source_url text not null`, `publie_le date not null` ; le motif est écrit en tête du fichier (lignes 8-16). Contrainte réelle et bien placée, mais jamais éprouvée : la table est vide.


**Étant donné** un service déployé sans clé d'extraction  
**Quand** on déclenche un tour de récolte  
**Alors** il **refuse avant d'avoir récupéré ou appelé quoi que ce soit** — ce qui coûte de l'argent est refusé avant d'être appelé (règle de fond du projet)

> ✅ **tenu** — recolte/index.mjs:58-64 (`pretARecolter` : base, `MISTRAL_API_KEY`, `RECOLTE_JETON`) est appelé en première ligne de `recolter` (index.mjs:133-134), avant la lecture des sources et avant tout appel réseau. A-FAIRE.md:92-98 confirme que la clé n'est pas posée et que les cinq sources sont à `actif = false`.


**Étant donné** un pilote au paddock, sans réseau  
**Quand** il ouvre le chargement d'un roulage  
**Alors** les règles publiées **sont déjà dans son téléphone**, descendues avec le référentiel (AD-12)

> ✅ **tenu** — powersync/sync-config.yaml:59 fait descendre `regle_organisateur` dans le flux `referentiel` (auto-abonné) ; src/db/schema.ts:340-349 la déclare en local et src/db/schema.ts:458 la classe au référentiel, donc en lecture seule côté PWA. Le chemin de descente est complet — c'est ce qu'on y met qui manque.


**Étant donné** les trois sources de règles présentes en base depuis le 19 août  
**Quand** on regarde ce qu'elles ont produit  
**Alors** **au moins une ligne de conformité existe** chez un pilote ayant préparé un roulage sur l'un de ces trois circuits (FR-49, FR-50)

> ❌ **NON TENU** — Requête du 25 août 2026 : `regle_organisateur` 0, `organisateur` 0, `source_recolte` actives 0 sur 5, `checklist_ligne` 0 dont `conformite` 0. Bout en bout, l'épique 13 n'a jamais produit une seule ligne de conformité. Trois verrous indépendants l'en empêchaient ; **l'un est levé le même jour** — le rattachement du roulage à son circuit (4 sur 4). Restent les deux qui demandent une décision et non un correctif : **pas de semeur** pour `regle_organisateur` (recolte/index.mjs:152 n'a que deux branches pour trois genres déclarés) et **aucune source active** (A-FAIRE.md:96-98, la clé d'extraction n'est pas posée). Ce sont eux, et eux seuls, qui tiennent maintenant FR-49 à FR-51 fermés.


## Épique 14 : Le cercle et le carnet partagé

**Objectif.** Rendre possible la comparaison entre quelques potes sans jamais fabriquer un classement, et rendre lisible à un inconnu sans compte ce qu'une machine a vécu. Ce qu'elle refuse explicitement : tout rang, tout tri par temps, tout cercle public, toute remontée automatique d'un cap au cercle, et toute présentation du carnet comme une attestation tierce. C'est la seule épique où une donnée quitte le téléphone du pilote pour l'œil d'un autre — donc la seule où un défaut de conception se paie sur quelqu'un qui n'a rien saisi.

**La porte.** Le tableau dit « Un pote roule. Pas avant : un cercle à une personne est un écran vide ». C'est vrai pour une moitié de l'épique et faux pour l'autre, et il faut deux portes. ① Le cercle : « un pote roule » est la bonne condition, et elle n'est pas gardée dans le code — le bloc « Créer un cercle » s'affiche sous chaque journée dès le premier roulage, avant qu'aucun pote n'existe (src/App.tsx:1189, src/ecrans/Cercle.tsx:100-104). ② Le carnet partagé : la porte est fausse. Un acheteur d'occasion n'a besoin d'aucun pote — il n'a même pas de compte, c'est le sens de FR-38. Sa vraie condition d'allumage est « une machine porte un carnet qu'on veut montrer à quelqu'un qui n'installera pas l'application », c'est-à-dire, en dépendance réelle, le journal d'interventions de l'épique 8 — pas le cercle. Les deux portes ne s'ouvrent ni au même moment ni pour la même raison, et rien n'oblige à les allumer ensemble.

*4 récits · 25 critères · 11 tenus · 9 non tenus.*

> **RELECTURE DU 25 AOÛT 2026** — douze agents, dont cinq envoyés détruire les
> défauts affirmés plutôt que les confirmer. Elle a rendu quatre choses.
>
> ⚠ **LE PIRE DÉFAUT DU PRODUIT ÉTAIT ICI, ET DEUX CRITÈRES LE DÉCRIVAIENT SANS
> MESURER CE QU'IL COÛTAIT** (14.1 c6, 14.3 c5). En SQL, « la colonne vaut NULL »
> et « la colonne est absente » ne sont pas la même chose : le défaut serveur ne
> s'applique qu'à l'absente. Vérifié sur la base réelle — l'insertion d'un roulage
> avec `chrono_visible` à NULL rend `23502`, la même insertion sans la colonne
> passe. Conséquence pour un pilote qui saisit sa saison avant de créer un compte,
> ce que le produit l'invite à faire : à la connexion, **chaque roulage est
> refusé**, et avec eux les sessions, les tours, les chutes et les dépenses qui y
> pendent. Il lui reste sa moto. Corrigé pour la classe entière — dix colonnes,
> reconstruites par un essai depuis les migrations, valeurs comprises.
>
> ⚠ **LE CERCLE AVAIT UNE FENÊTRE OUVERTE À CÔTÉ DE SA PORTE, et aucun critère ne
> la couvrait.** La politique d'insertion de `membre_cercle` vérifiait qui
> s'inscrit, jamais où : une requête suffisait à entrer dans n'importe quel cercle
> sans code, et à y lire le nom, LE CODE et tous les membres. Fermé, vérifié dans
> la peau d'un pilote connecté (42501). Au passage, la création est devenue
> atomique : elle faisait deux écritures sans transaction, dont la seconde n'était
> jamais vérifiée, et son échec laissait un cercle illisible par tous, ineffaçable
> par tous, dont le code continuait de répondre.
>
> ⚠ **TROIS VERDICTS VERTS ÉTAIENT VRAIS POUR DE MAUVAISES RAISONS**, et une
> raison fausse est un piège pour celui qui s'y fiera demain. Le détail est sous
> chaque critère.
>
> ⚠ **CE QUE L'ÉPIQUE N'EXIGE PAS** est rassemblé en fin d'épique. Le plus lourd :
> `anon` détient aujourd'hui SELECT, INSERT, UPDATE et DELETE sur toutes les
> tables du pilote — les droits par défaut de Supabase, jamais retirés. Rien ne
> fuit, parce que la RLS refuse. Mais la frontière entière tient sur une seule
> couche, et le carnet public du récit 14.4 est exactement ce qui la mettra à
> l'épreuve.


### Récit 14.1 : L'interrupteur du chrono, journée par journée

En tant que **pilote**, je veux **décider journée par journée si mon meilleur tour est visible de mon cercle**, afin de **saisir mes temps sans subir une comparaison que je n'ai pas choisie**.


**Critères d'acceptation**


**Étant donné** un roulage qui vient d'être saisi sur un compte neuf  
**Quand** on regarde ce que le cercle en verrait  
**Alors** le chrono est **masqué**, et ce défaut ne se règle **jamais globalement** — le défaut est celui qui protège (FR-19, interdiction 8 du §6).

> ✅ **tenu** — mais **la preuve disait le contraire du code, et c'est elle qu'il fallait corriger**. « L'INSERT n'écrit pas la colonne, elle reste nulle » donnait la nullité comme la preuve du défaut protecteur, alors que la nullité était précisément le défaut que le critère 6 dénonce. Depuis le 25 août, src/db/depot.ts écrit `chrono_visible` à 0 **explicitement** : le masquage est une valeur posée, pas une absence. Même résultat à l'écran (src/db/cercle.ts, `r.v === 1` rend faux pour 0 comme pour nul), meilleure raison. Reste vrai : src/App.tsx:1290 (état initial faux), migration 20260819000016:7 (`not null default false`).


**Étant donné** deux roulages du même pilote  
**Quand** l'un est rendu visible  
**Alors** l'autre **reste masqué** : l'interrupteur porte sur **la journée**, jamais sur le compte ni sur la saison (FR-19).

> ✅ **tenu** — src/db/cercle.ts:114-119 (`UPDATE roulage SET chrono_visible = ? WHERE id = ?`) · src/App.tsx:1188 et 1289-1298 (un interrupteur monté par journée, aucun réglage de compte nulle part)


**Étant donné** un roulage laissé masqué  
**Quand** un membre du cercle interroge les données par n'importe quel chemin  
**Alors** le temps **n'en sort pas** — le masquage tient **côté serveur**, pas seulement à l'écran (FR-19, AD-11).

> ✅ **tenu** — la conclusion tient, **un des deux arguments est faux**. « Le grant ne porte que sur la vue » décrit une barrière de privilèges qui n'existe pas : `20260824000001:58` ACCORDE un droit sur la vue, il n'en retire aucun aux tables, et aucun `revoke` ne vise `roulage`, `session` ni `tour` (les seuls visent le rôle `recolte`). Vérifié sur la base réelle : `authenticated` **et `anon`** détiennent SELECT, INSERT, UPDATE, DELETE sur ces trois tables. Ce qui ferme le chemin par la table est **uniquement la RLS** — celle-là est bien réelle et bien citée. La nuance décide de la suite : la frontière du produit tient sur une seule couche.


**Étant donné** un pilote qui a laissé son chrono masqué  
**Quand** il apparaît dans la liste du cercle  
**Alors** il y est **à sa date, comme les autres**, jamais **en dernier** ni **en creux** (FR-19, FR-39).

> 🟡 **partiel** — src/db/cercle.ts:98 et src/ecrans/Cercle.tsx:85-93 : la position est tenue, le tri est chronologique et jamais par temps. Mais src/ecrans/Cercle.tsx:92 remplit sa colonne de chrono par un tiret `'—'`, qui le **désigne** comme celui qui n'a rien montré. « Sans son chrono » et « en creux » sont ici la même chose.


**Étant donné** un pilote qui s'est rendu visible puis se ravise  
**Quand** il remasque sa journée  
**Alors** le chrono **disparaît du cercle** — rien n'est irréparable et rien ne se verrouille (FR-19).

> ✅ **tenu** — src/db/cercle.ts:114-119 (le booléen se repose dans les deux sens) · src/App.tsx:1293-1297 · supabase/migrations/20260824000001:49-53 (la vue relit la colonne à chaque lecture)


**Étant donné** un roulage dont le pilote n'a jamais touché l'interrupteur  
**Quand** sa saison est reprise par un compte  
**Alors** le roulage **arrive au serveur**, en masqué — un défaut jamais écrit ne doit pas faire **refuser la ligne** (FR-19).

> ✅ **tenu depuis le 25 août** — le verdict était juste, et il sous-estimait la portée : ce n'était pas une colonne mais une **classe**, et elle ne coûtait pas une ligne mais la saison entière. Dix colonnes du schéma local sont déclarées `not null default …` au serveur ; deux n'étaient jamais écrites. `DEFAUTS_SERVEUR` pose maintenant la valeur du défaut plutôt que de retirer la clé — retirer la clé rendait les lignes hétérogènes, et PostgREST refuse une insertion groupée dont les objets n'ont pas les mêmes clés (`PGRST102`), ce qui aurait transformé une adoption en une requête HTTP par ligne. La source est fermée aussi : src/db/depot.ts écrit `chrono_visible` à faux dans le même INSERT que `etat`. Un essai unitaire reconstruit la liste depuis les migrations — **noms et valeurs** — et rougit sur les deux.


### Récit 14.2 : Le cercle fermé, et sans aucun rang

En tant que **pilote**, je veux **rejoindre par un code un cercle de quelques personnes**, afin de **me comparer à circuit égal sans entrer dans un classement**.


**Critères d'acceptation**


**Étant donné** un code donné de vive voix au paddock  
**Quand** un pilote le saisit avec son pseudo  
**Alors** il entre dans le cercle, et un code faux ne répond **rien d'autre qu'« introuvable »** — le contenu d'un cercle **n'est jamais lisible avant de l'avoir rejoint** (FR-39).

> ✅ **tenu** — supabase/migrations/20260819000016_cercle_et_visibilite.sql:86-104 (`rejoindre_cercle`, security definer, ne rend qu'un identifiant ou lève « introuvable ») et :49-55 (aucune lecture sans appartenance) · src/db/cercle.ts:69-79 · src/db/cercle.ts:39-44 (alphabet sans 0/O ni 1/I/L, lisible à voix haute)


**Étant donné** deux pilotes du même cercle ayant roulé au même circuit  
**Quand** l'un ouvre le cercle  
**Alors** il voit **la journée de l'autre** — sans quoi il n'y a **pas de cercle du tout**, seulement soi-même sous un pseudo (FR-39).

> ❌ **NON TENU** — supabase/migrations/20260824000001_est_membre_ne_repond_que_de_soi.sql:45-46 déclare la vue `with (security_invoker = true)` : elle s'exécute avec les droits du lecteur, donc la RLS de `roulage` s'applique. Or supabase/migrations/20260818000002_rls_et_role_recolte.sql:41-42 est la **seule** politique de cette table — `for all using (pilote_id = auth.uid())`. La vue ne peut donc rendre que les journées du lecteur lui-même. Le verrou est double : `session` et `tour` sont fermés de la même façon (20260819000003:37 et :46), donc `meilleur_ms` d'autrui serait nul même si `roulage` s'ouvrait. L'écran est celui de src/ecrans/Cercle.tsx:85-93, et il affichera le pseudo du lecteur en face de ses propres temps.


**Étant donné** la liste que le cercle montre  
**Quand** on y cherche un rang  
**Alors** il n'y en a **aucun** : ni numéro, ni podium, ni « meilleur du cercle », et le tri est **chronologique** et jamais par temps (FR-39).

> 🟡 **partiel** — l'écran ne classe pas, et c'est vrai (src/db/cercle.ts trie sur `date_jour`, src/ecrans/Cercle.tsx n'affiche aucune position). Mais **la raison invoquée est fausse**, et c'est elle qui prétendait rendre la garantie structurelle : la vue porte `meilleur_ms`, colonne ordinaire et triable, et `grant select on roulage_du_cercle to authenticated` porte sur toutes ses colonnes. PostgREST expose le tri sur toute relation sélectionnable — `?order=meilleur_ms.asc` rend le cercle classé au temps, avec les chronos. L'interdiction « tout rang, tout tri par temps » annoncée en tête d'épique n'est donc tenue **que dans le client**, ce qui est exactement ce que « ni ici, ni côté serveur » promettait d'éviter.


**Étant donné** deux journées roulées sur des circuits différents  
**Quand** elles arrivent au cercle  
**Alors** elles **ne sont jamais mises face à face**, et **deux façons d'écrire le même circuit ne séparent pas** deux pilotes qui ont roulé au même endroit (FR-39).

> 🟡 **partiel** — La première moitié tient : src/db/cercle.ts:99-102 filtre par circuit avant l'affichage. La seconde ne tient pas : l'appariement est une **chaîne de caractères normalisée** (accents et ponctuation retirés), pas un identifiant, alors que `roulage.circuit_id` existe (src/db/schema.ts:86-87) — « Le Vigeant » et « Val de Vienne » ne se rejoignent jamais. Et le filtre est fait **dans le téléphone** : la vue rend d'abord toutes les journées de tous les membres, tous circuits confondus (supabase/migrations/20260824000001:45-56, aucune clause de circuit).


**Étant donné** un cercle dit « de l'ordre de quelques personnes »  
**Quand** son code circule au-delà de ceux à qui on l'a donné  
**Alors** quelque chose **l'arrête** — un cercle sans borne, dont le code est **permanent et irrévocable**, n'est plus fermé (FR-39).

> ❌ **NON TENU** — et **le trou n'était pas là où le critère le cherchait**. Tout cela est exact (aucune borne, code permanent, aucun retrait, code affiché à chaque membre). Mais le code n'était même pas nécessaire : la politique d'insertion de `membre_cercle` ne vérifiait que l'identité de l'inscrit, **jamais le cercle visé** — une requête HTTP suffisait à entrer dans n'importe quel cercle dont on connaît l'identifiant, et un membre qui part garde cet identifiant. « On quitte pour soi » ne fermait donc rien du tout. **Fermé le 25 août** : `membre_cercle` et `cercle` ne s'écrivent plus que par `creer_cercle` et `rejoindre_cercle`, toutes deux `security definer` ; l'écriture directe rend 42501, vérifié. Ce qui reste ouvert demande une **décision** et non un correctif : combien de personnes, un code qui se renouvelle ou expire, et qui peut retirer qui.


**Étant donné** un cercle où personne n'a encore roulé au circuit du jour  
**Quand** le pilote l'ouvre  
**Alors** l'écran **dit l'absence** au lieu de rester vide, et **ne ment pas** sur ce qu'il ne montre pas (UX-DR10).

> 🟡 **partiel** — le document voyait un mensonge ; il y en avait deux, et le second est **corrigé le 25 août**. Les quatre lectures du cercle ne liaient pas leur `error` et retombaient sur `?? []` : supabase-js ne lève pas, il **retourne** l'erreur. Un réseau coupé, un jeton expiré, une politique qui refuse rendaient donc une liste vide, et l'écran affirmait « Personne du cercle n'a encore roulé ici. » quand la vérité était « je n'ai pas pu demander ». Pire, `mesCercles` renvoyait à « Créer un cercle » un pilote qui en a déjà un — qui en aurait créé un second. Les soucis de lecture sont désormais dits, et distingués du refus d'un geste. **Le premier mensonge tient toujours** : la vue ne rend la journée de personne d'autre (critère 2).


### Récit 14.3 : Le cap ne part jamais tout seul

En tant que **pilote**, je veux **que chaque geste célébré reste chez moi tant que je n'ai pas dit de le montrer**, afin de **que mon cercle ne devienne pas une raison d'aller chercher le geste**.


**Critères d'acceptation**


**Étant donné** un geste tout juste déclaré, coude au sol compris  
**Quand** on regarde ce que le cercle en voit  
**Alors** il **n'en voit rien** : le défaut est **non partagé**, pour un cap de bravoure comme pour tout autre (FR-39bis).

> ✅ **tenu** — src/db/gestes.ts:38-45 (l'INSERT ne porte que id, roulage_id et cap_code) · src/db/schema.ts:247-255 · supabase/migrations/20260819000016_cercle_et_visibilite.sql:18 (`not null default false`)


**Étant donné** le catalogue de caps et le cercle, tous deux livrés  
**Quand** ils coexistent dans la même application  
**Alors** **aucun chemin ne relie l'un à l'autre** sans un geste du pilote — le danger n'est ni dans le catalogue ni dans le cercle pris seuls, il est dans leur **conjonction automatique** (FR-39bis).

> ⬜ **sans objet** — les faits cités sont exacts, mais c'est un vert obtenu **par absence**, et le document ne peut pas coter la même absence verte ici et rouge trois lignes plus bas (critère 3). Rien ne relie le catalogue au cercle parce que le partage de geste n'est écrit nulle part. Le seul garde-fou réellement écrit, `partageableAutomatiquement` (src/db/gestes.ts), **n'a aucun appelant dans tout le dépôt**. La conjonction qu'interdit FR-39bis n'est empêchée par aucun mécanisme : elle est seulement non construite — et ce produit est né d'une chute causée par la recherche d'un geste.


**Étant donné** un cap de bravoure que le pilote veut montrer  
**Quand** il décide de le partager  
**Alors** il le fait **geste par geste**, sur **décision explicite**, jamais par un réglage qui vaudrait pour tous (FR-39bis).

> ❌ **NON TENU** — Le chemin n'existe pas : `partage` n'est **écrit nulle part** dans src/ — la seule occurrence du dépôt est sa déclaration à src/db/schema.ts:254 — et aucun écran ne l'offre. La clause tient aujourd'hui par **absence de tout partage de geste**, pas par une décision du pilote : ce n'est pas la même chose, et ça se cassera le jour où le partage s'écrira.


**Étant donné** un cap de discipline  
**Quand** le pilote le montre à son cercle  
**Alors** il **se partage comme le reste** — seule la bravoure demande une décision séparée (FR-39bis).

> ❌ **NON TENU** — src/db/gestes.ts:54-55 (`partageableAutomatiquement`) est la seule trace de la distinction dans le code, et elle **n'a aucun appelant** : une seule occurrence dans tout le dépôt, sa définition. La `categorie` du cap est portée jusqu'au schéma local (src/db/schema.ts:290-293) et n'est lue par personne.


**Étant donné** un geste dont la colonne de partage n'a jamais été écrite  
**Quand** la saison est reprise par un compte  
**Alors** le geste **arrive au serveur** — un défaut jamais écrit ne doit pas faire refuser la ligne (FR-39bis).

> ✅ **tenu depuis le 25 août** — fermé par le même geste que 14.1 c6, et par sa source : src/db/gestes.ts écrit désormais `partage` à faux dans l'INSERT. Ça dit la règle FR-39bis là où elle se décide — un geste naît **non partagé**, ce n'est pas une absence d'information.


### Récit 14.4 : Le carnet de la machine, lisible sans compte

En tant que **pilote qui cède sa machine**, je veux **ouvrir mon carnet à quelqu'un par un simple lien**, afin de **qu'un acheteur lise ce que j'ai consigné sans avoir à s'inscrire**.


**Critères d'acceptation**


**Étant donné** une machine et son carnet d'entretien  
**Quand** le pilote demande à le montrer  
**Alors** un **lien** est produit, et ce lien **s'ouvre sans compte** — l'acheteur lit, il ne s'inscrit pas (FR-38).

> ❌ **NON TENU** — Aucune route publique : vercel.json ne réécrit que `/banc` et `index.html`, et **aucun fichier de src/ ne lit `location.pathname`** — l'application n'a pas de routage du tout. Aucune politique ni aucun grant `anon` dans supabase/migrations/. Aucun jeton, aucune table de partage. La matière, elle, existe déjà (src/ecrans/Poste.tsx:105, src/ecrans/Atelier.tsx) : ce qui manque est l'exposition, pas le contenu.


**Étant donné** le carnet ouvert par quelqu'un qui n'a pas de compte  
**Quand** il le lit  
**Alors** la mention **auto-déclaré** est **sur le document lui-même et en premier plan**, jamais reléguée en pied de page (FR-38, interdiction 7 du §6).

> ❌ **NON TENU** — La seule mention du dépôt vit à src/ecrans/Legal.tsx:35, dans un écran réservé au pilote connecté à son propre carnet — c'est-à-dire exactement la personne qui n'en a pas besoin. Il n'existe aucun document partagé qui pourrait la porter.


**Étant donné** un carnet partagé qui annonce un décompte  
**Quand** l'acheteur le lit pour décider d'un achat  
**Alors** il porte sa **complétude** — « 11 roulages consignés, 2 sans chrono » — car c'est la **dernière sortie du produit** où un chiffre a le droit de se présenter plus complet qu'il n'est (FR-38, FR-40).

> ❌ **NON TENU** — La formule existe pour la saison (src/ecrans/Saison.tsx:66-70) et pour l'horloge d'usure (src/db/usure.ts:63-75, src/ecrans/Usure.tsx:61-65) ; rien de tel n'existe pour un carnet de machine, partagé ou non.


**Étant donné** un lien de carnet ouvert par un inconnu  
**Quand** il regarde ce qui en sort  
**Alors** **seule la machine partagée** en sort — ni le reste du garage, ni les dépenses, ni les chronos, ni l'identité du pilote (FR-38, AD-11).

> ⬜ **non vérifiable** — Il n'y a rien à mettre en échec : ni lien, ni jeton, ni vue de lecture publique. Ce verdict n'est pas un acquit — la clause de cloisonnement n'a simplement pas encore d'objet, et elle devra être vérifiée le jour où le récit 14.4 s'écrit.


**Étant donné** un lien déjà donné à un acheteur  
**Quand** le pilote se ravise ou vend à quelqu'un d'autre  
**Alors** le lien **cesse d'ouvrir** — un carnet partagé se **reprend** (FR-38).

> ❌ **NON TENU** — Aucune table de jeton, aucune colonne de partage ni d'expiration sur `machine` (src/db/schema.ts), aucun chemin de révocation nulle part dans src/.



### Ce que l'épique 14 n'exige pas — relevé du 25 août 2026

La leçon de l'épique 13 s'est répétée : **les deux pires défauts ne vivaient dans
aucun critère**. Voici ce que la relecture a vérifié et que le découpage ne
demande nulle part. Chacun est un critère à écrire, pas une remarque.

**① `anon` détient tout, et seule la RLS l'arrête.** Vérifié sur la base :
`anon` a SELECT, INSERT, UPDATE, DELETE, TRUNCATE sur `roulage`, `session`,
`tour`, `geste`, `pilote`, `machine`, `cercle`, `membre_cercle` et la vue du
cercle — les droits par défaut de Supabase, retirés seulement au rôle `recolte`.
Rien ne fuit aujourd'hui, parce que la RLS refuse. Mais la frontière tient sur une
seule couche, et le récit 14.4 — un carnet lisible **sans compte** — est
précisément ce qui la mettra à l'épreuve. Le dépouillement d'`anon` doit précéder
l'écriture de 14.4, pas la suivre.

**② Le tiret confond deux états, et en accuse un troisième.** src/ecrans/Cercle.tsx
rend `—` quand `meilleur_ms` est nul. Or la sous-requête `min(t.temps_ms)` de la
vue rend nul **aussi** quand le pilote est visible et n'a chronométré aucun tour.
Un pilote qui a tout montré s'affiche exactement comme celui qui a fermé son
interrupteur — et le critère 14.1 c4 interdit justement de le **désigner**.

**③ Deux membres peuvent porter le même pseudo.** Aucune unicité sur
`(cercle_id, pseudo)` — la seule contrainte est « non vide ». Et
`rejoindre_cercle` fait `on conflict … do update set pseudo` : un membre peut se
renommer **du pseudo d'un autre**, quand il veut. L'écran n'affiche que pseudo,
date et chrono : rien ne distingue les deux, et un temps s'attribue alors à la
mauvaise personne, sans un mot.

**④ Le pseudo n'est pas un pseudonyme.** La vue expose `r.pilote_id`, l'identifiant
d'authentification, et `membre_cercle` l'expose aussi à tout membre. Le même homme
sous deux pseudos dans deux cercles est reliable par quiconque appartient aux
deux. L'écran promet « ton pseudo dedans » ; la base rend un identifiant stable.

**⑤ On ne peut pas quitter un cercle depuis l'application.** La politique existe
depuis le 19 août ; **aucun écran ne l'appelle**. Et quitter ne serait pas une
frontière tant que le point ① du critère 14.2 c5 n'est pas tranché : le partant
garde le code, qui lui a été affiché à chaque ouverture.

**⑥ L'écran télécharge tout le cercle pour en montrer un circuit.** La lecture ne
pose ni limite ni filtre de circuit côté serveur : toutes les journées de tous les
membres descendent, puis la plupart sont jetées dans le téléphone. C'est le
contraire exact de la doctrine que le fichier écrit lui-même — « faire descendre
les données d'autrui dans ce téléphone serait les ranger là où on ne les contrôle
plus ».

**⑦ Le remasquage est instantané à l'écran et différé au cercle.** `rendreVisible`
écrit en SQLite et le libellé bascule aussitôt ; la remontée passe par la file
PowerSync, éteinte tant que le compte n'a pas adopté la saison. Au paddock, sans
réseau, le bouton affirme « ton chrono de ce jour est masqué » pendant que la vue
serveur — ce que le cercle lit — rend encore le temps. Rien ne le dit.

## Épique 15 : Bilan, saison dérivée, budget prévisionnel

**Objectif.** Rendre lisible une saison sans jamais lui prêter une exactitude qu'elle n'a pas : le bilan annonce ses trous avant ses chiffres, les bornes de la saison viennent des roulages saisis et de rien d'autre, et le budget de l'année suivante est la recopie d'un chiffre réel. L'épique refuse trois choses nommément : toute moyenne, tout comportement déclenché par un mois de l'année, et toute projection — le produit ne modélise pas l'avenir, il reconduit un fait et laisse le pilote le corriger. Elle ne juge pas la saison et ne la compare à celle de personne.

**La porte.** La porte du tableau — « une saison est complète » — est FAUSSE, et deux fois. D'abord elle contredit frontalement la FR que l'épique porte : FR-55 dit « il est consultable à tout moment, PAS SEULEMENT EN FIN DE SAISON ». Ensuite « complète » n'est pas observable : la saison est un état dérivé (FR-52), du premier au dernier roulage saisi ; rien ne déclare jamais qu'elle est finie, et pour le lui faire dire il faudrait tester une date — ce que FR-53 interdit. LA BONNE PORTE EST DOUBLE, parce que l'épique porte deux mécanismes de conditions différentes. ① Le bilan et la saison dérivée s'allument au PREMIER ROULAGE SAISI : dès un roulage, le bilan a quelque chose de vrai à dire (« 1 roulage saisi, 0 sans chrono »), et le code l'admet déjà — `anneesSaisies` (src/db/bilan.ts:94) ouvre l'écran sur la première année portant un roulage. ② Le budget prévisionnel s'allume quand UNE ANNÉE ANTÉRIEURE PORTE UNE DÉPENSE : un report a besoin de quelque chose à reporter, et `reportPossible` (src/db/bilan.ts:115-122) le dit mot pour mot en exigeant `depenseSaison(pour - 1) > 0`. Cette seconde porte n'a rien à voir avec une saison achevée : elle peut s'allumer en plein mois de mai.

*3 récits · 18 critères · 10 tenus · 5 non tenus.*


### Récit 15.1 : Le bilan dit ce qui lui manque avant de dire ce qu'il sait

En tant que **pilote**, je veux **que mon bilan de saison annonce ses trous avant ses chiffres**, afin de **ne jamais lire un chiffre plus sûr que la saisie dont il vient**.


**Critères d'acceptation**


**Étant donné** une saison où onze roulages sont saisis et deux ne portent aucun chrono  
**Quand** j'ouvre le bilan  
**Alors** « 11 roulages saisis, 2 sans chrono » se lit **avant le premier chiffre**, jamais après ni à côté (FR-55)

> ✅ **tenu** — src/ecrans/Saison.tsx:67-71 (la complétude) précède src/ecrans/Saison.tsx:73-80 (circuits, sessions, meilleur tour) ; l'ordre est mesuré par banc-rendu/fumee-saison.mjs:38-40, qui compare l'index de « roulages saisis » à celui de « circuits ».


**Étant donné** un bilan de saison  
**Quand** ses chiffres sont produits  
**Alors** **aucune moyenne n'y figure** — ni chrono moyen, ni coût moyen par roulage, ni dépense mensuelle, ni ratio d'aucune sorte (FR-55)

> ✅ **tenu** — src/db/bilan.ts:48-88 ne comporte aucune division ; les seules occurrences de « moyen » dans src/ sont des commentaires qui l'interdisent (src/db/bilan.ts:13-17, src/db/chiffres.ts:85). banc-rendu/fumee-saison.mjs:47-49 vérifie l'absence par la négative, sur six formulations.


**Étant donné** un roulage saisi jeudi pour le dimanche suivant, pas encore couru  
**Quand** j'ouvre le bilan le vendredi  
**Alors** il **ne compte pas parmi les roulages sans chrono** — un roulage à venir n'est pas un trou de saisie, et le compter en trou fabrique un reproche pour une journée qui n'a pas eu lieu (FR-55, UJ-5)

> ❌ **NON TENU** — src/db/bilan.ts:51-57 compte tout roulage `etat='usage'` de l'année **sans aucune borne de date**, là où src/db/usure.ts:136 et src/db/preparation.ts:102 bornent, eux, par `date_jour <= ?`. Le roulage de dimanche gonfle `sansChrono` dès sa création. Aggravant : banc-rendu/fumee-saison.mjs:20-21 met en scène ce cas exact en le décrivant comme « exactement le trou que la complétude doit énoncer » — l'essai consacre le défaut au lieu de l'attraper.


**Étant donné** une année où des dépenses existent — un train de pneus acheté en janvier — mais où aucun roulage n'est encore saisi  
**Quand** je cherche le bilan de cette année  
**Alors** **cette année est consultable et son dépensé s'y lit** ; l'achat d'hiver ne tombe dans aucun intervalle sans propriétaire (FR-55, FR-23, UJ-6)

> ❌ **NON TENU** — src/db/bilan.ts:94-99 : `anneesSaisies` ne liste que les années portant un roulage, et src/ecrans/Saison.tsx:38 rend `null` sans année. La dépense est pourtant correctement rattachée à `saison_annee = 2027` (src/db/depot.ts:412-423) et sommable (src/db/depot.ts:450-453) — c'est le seul chemin d'accès qui manque. L'argent existe en base et aucun écran de bilan ne l'atteint avant le premier roulage de l'année.


**Étant donné** un pilote qui n'a encore rien saisi  
**Quand** il ouvre l'écran où vit le bilan  
**Alors** **une phrase dit l'absence** au lieu d'un bloc qui s'évanouit sans un mot (une absence se dit plutôt que de laisser un vide)

> ❌ **NON TENU** — src/ecrans/Saison.tsx:38 — `if (!annees.length || !b) return null`. Le commentaire de src/db/bilan.ts:91-93 assume de ne jamais proposer une année vide, ce qui règle correctement le sélecteur d'années mais laisse le cas zéro sans énoncé : le bloc disparaît, et rien ne dit pourquoi.


**Étant donné** le bilan d'une saison  
**Quand** il est lu  
**Alors** il **n'affiche aucun rang, aucune comparaison à un autre pilote, aucun jugement** sur la saison écoulée — il énonce, il ne note pas (interdits de fond)

> ✅ **tenu** — src/db/bilan.ts:44-89 ne joint aucune table de cercle ni de visibilité ; src/ecrans/Saison.tsx:42-119 ne rend que des comptes et des sommes du pilote, sans qualificatif ni palmarès.


### Récit 15.2 : La saison, bornée par ce que j'ai saisi

En tant que **pilote**, je veux **que les bornes de ma saison viennent de mes roulages**, afin de **qu'aucun mois de l'année ne décide de ce que je vois**.


**Critères d'acceptation**


**Étant donné** des roulages saisis dans une année  
**Quand** la saison s'établit  
**Alors** ses bornes sont **le premier et le dernier roulage saisi de cette année**, et l'écran le dit au pilote au lieu de le laisser croire à une plage de dates (FR-52)

> ✅ **tenu** — src/db/bilan.ts:49 — `min(r.date_jour)` / `max(r.date_jour)` ; src/ecrans/Saison.tsx:58-64 affiche « Du … au … — c'est ce que tu as saisi qui la borne, pas un calendrier » ; banc-rendu/fumee-saison.mjs:43-44 vérifie les deux.


**Étant donné** le code du bilan, de la saison et de la dépense  
**Quand** il est relu  
**Alors** **aucune branche conditionnelle ne compare un mois de l'année** — le produit teste des états, jamais une position dans le calendrier (FR-53, AD-8)

> ✅ **tenu** — src/db/bilan.ts:57 et 64-72 filtrent sur `substr(date_jour, 1, 4)`, l'année seule ; src/db/depot.ts:412 `anneeSaison` prend quatre caractères et le commentaire 402-411 explique pourquoi la règle « saison en cours sinon saison à venir » se replie sur cette unique expression. Les deux seules occurrences de mois du produit — src/ecrans/Budget.tsx:438 et src/ecrans/Garage.tsx:487 — sont un `max` posé sur un champ de saisie, pas une branche de comportement.


**Étant donné** une dépense de janvier rattachée à la saison  
**Quand** un roulage est ajouté ou supprimé plus tard dans l'année et déplace les bornes  
**Alors** **son appartenance budgétaire ne bouge pas** — l'entier d'année est fixé à la saisie et jamais recalculé (AD-18)

> ✅ **tenu** — `saison_annee` n'est écrit qu'à l'insertion (src/db/depot.ts:420-423, src/db/budget.ts:99) ; la revue de toutes ses occurrences dans src/ ne trouve aucun `UPDATE … SET saison_annee`. Les totaux se somment sur cet entier (src/db/depot.ts:450-453, src/db/chiffres.ts:96), jamais sur un intervalle de dates.


**Étant donné** un pilote qui roule en janvier  
**Quand** il ouvre le produit  
**Alors** **aucune bascule, aucun mode saisonnier, aucun réglage** ne s'active — il voit le même écran et les mêmes règles qu'un dimanche de mai (FR-52, UJ-6, terme « mode hors-saison » supprimé)

> ✅ **tenu** — aucune occurrence de « hors-saison » dans src/ ; l'écran de saison (src/ecrans/Saison.tsx) n'a qu'une entrée, l'année choisie, et aucune branche de date. L'absence est couverte par un essai dédié, banc-rendu/fumee-vide-saisonnier.mjs.


**Étant donné** une saison encore en cours  
**Quand** j'ouvre son bilan  
**Alors** il **s'affiche sans attendre une fin de saison**, et ses bornes se déplacent d'elles-mêmes au roulage suivant (FR-55, FR-52)

> ✅ **tenu** — src/App.tsx:849-857 monte le bilan en tête de l'onglet Roulages sans aucune condition de date, avec le commentaire qui le dit ; src/ecrans/Saison.tsx:30-36 recharge à chaque changement d'année. C'est ce critère qui invalide la porte annoncée au tableau.


**Étant donné** un roulage en brouillon — annoncé, pas couru  
**Quand** le bilan est composé  
**Alors** il **ne compte nulle part** : ni dans les roulages saisis, ni dans les sessions, ni dans le meilleur tour, ni dans le sélecteur d'années (FR-61, FR-55)

> 🟡 **partiel** — src/db/bilan.ts:57 filtre bien `r.etat = 'usage'` pour le compte des roulages et la complétude, mais src/db/bilan.ts:62-72 — sessions, meilleur tour, photos, gestes — ne filtre pas, et src/db/bilan.ts:94-98 (`anneesSaisies`) non plus. Un brouillon peut donc ouvrir une année au sélecteur et pousser des sessions sous une complétude qui annonce « 0 roulage saisi ». La discipline correcte existe deux fichiers plus loin, src/db/usure.ts:127 et 136.


### Récit 15.3 : Le budget de l'an prochain est un report, jamais une prévision

En tant que **pilote**, je veux **qu'on me propose pour la saison à venir ce que la précédente m'a réellement coûté**, afin de **corriger un chiffre vrai plutôt que de croire une projection**.


**Critères d'acceptation**


**Étant donné** une saison écoulée qui a coûté 4 380 €  
**Quand** un budget est proposé pour la suivante  
**Alors** le montant proposé est **exactement 4 380 €** — sans marge, sans inflation, sans lissage, sans tendance : le produit recopie, il ne modélise pas (FR-56)

> ✅ **tenu** — src/db/bilan.ts:115-123 — `reportPossible` renvoie `depenseSaison(pour - 1)` tel quel ; aucune multiplication ni coefficient dans le fichier. La garde `deja != null` (ligne 118-119) empêche en plus qu'un report écrase un budget déjà posé.


**Étant donné** le montant proposé  
**Quand** il s'affiche  
**Alors** il est **nommé report de l'an dernier**, jamais prévision, jamais estimation, jamais objectif à tenir (FR-56, le produit énonce et ne juge pas)

> ✅ **tenu** — src/ecrans/Saison.tsx:106-112 — « {année} t'a coûté {montant}. Ce n'est pas une prévision, c'est un report : le même chiffre, reconduit tel quel. » banc-rendu/fumee-saison.mjs:54-55 vérifie que le mot « prévision » n'apparaît qu'écarté.


**Étant donné** un budget de saison déjà posé — repris depuis l'an dernier ou déclaré à la main  
**Quand** je veux le corriger  
**Alors** **un champ le permet, et le chiffre corrigé fait foi** ; un report qu'on ne peut pas corriger n'est plus un report, c'est une décision du produit (FR-56, « et se corrige à la main »)

> ❌ **NON TENU** — le seul champ de montant du produit (src/App.tsx:1256-1271) vit dans la branche `else` de `c.auTour`, c'est-à-dire **uniquement tant qu'aucun budget n'existe** ; dès qu'il en existe un, src/App.tsx:1237-1254 le remplace par une jauge sans saisie. Et sur l'écran de saison, le bloc de report disparaît aussi vite qu'un budget est posé (src/db/bilan.ts:118-119, src/ecrans/Saison.tsx:98). `poserBudget` sait pourtant faire un `UPDATE` (src/db/depot.ts:467-480) : c'est l'interface qui n'appelle jamais ce chemin. Aggravant : `Budget` est monté sur l'année courante (src/ecrans/Garage.tsx:181 et 413) et `onBudget` sur l'année du roulage ouvert (src/App.tsx:391) — un budget 2027 reporté en août 2026 n'a donc littéralement aucun écran où se corriger.


**Étant donné** un événement visé pour juin, avec son coût estimé  
**Quand** le budget de la saison à venir se compose  
**Alors** **ce coût y entre**, et reste distinct du report — c'est la raison d'être annoncée de l'événement visé (FR-54, FR-56)

> ❌ **NON TENU** — `reportPossible` (src/db/bilan.ts:115-123) ne lit que la table des dépenses. `cout_estime_centimes` existe bien (supabase/migrations/20260819000011_atelier.sql:61) et n'est lu que par l'accueil temporel (src/db/accueil.ts:106) et l'atelier (src/db/atelier.ts:217) ; aucun chemin ne le relie au budget prévisionnel, alors que FR-54 et le glossaire du PRD (« Alimente le budget prévisionnel ») en font sa moitié de justification. La moitié « accueil temporel » est tenue, la moitié « budget » ne l'est pas.


**Étant donné** qu'aucune saison antérieure ne porte de dépense  
**Quand** j'ouvre la saison  
**Alors** **rien n'est proposé et l'absence est dite** — pas de zéro, pas de tiret, pas de montant inventé, mais pas de silence non plus

> 🟡 **partiel** — la moitié dure est tenue : rien n'est fabriqué — `reportPossible` renvoie `null` quand `c > 0` est faux (src/db/bilan.ts:122) et le bloc n'est pas rendu (src/ecrans/Saison.tsx:98). Mais rien n'est dit : le report s'évanouit sans un mot, et par le même silence exactement que lorsqu'un budget existe déjà (src/db/bilan.ts:118-119). Deux situations opposées — « il n'y a rien à reporter » et « c'est déjà fait » — rendues de façon indiscernable.


**Étant donné** le budget déclaré et le dépensé d'une saison  
**Quand** ils s'affichent  
**Alors** **aucun reste à dépenser n'est calculé et aucune barre ne se vide** — un compteur à rebours sur de l'argent produit l'arrêt de la saisie, pas l'économie (clause ② du module budget)

> 🟡 **partiel** — tenu au bilan : src/ecrans/Saison.tsx:91-96 juxtapose « Budget déclaré … · consommé … » sans jamais soustraire. Violé dans le bloc coût du roulage : src/App.tsx:1250-1253 rend une `jauge` dont la largeur est `consomme / budget * 100`, soit précisément la barre qui se remplit que src/ecrans/Budget.tsx:26-32 s'interdit noir sur blanc. Le désaccord est réel entre deux écrans du même produit ; il se répare dans l'épique 5, mais il se constate depuis celle-ci.


## Épique 16 : La récolte — barèmes et calendriers

**Objectif.** Un service séparé, exécuté hors du temps du pilote, fabrique le référentiel que le produit n'a pas à saisir : règles publiées par les circuits, calendriers de sorties, et un jour des barèmes constructeur. Il refuse trois choses, et ce sont elles qui le définissent — dépenser un centime sans qu'un humain l'ait allumé, écrire une seule ligne appartenant à un pilote, et laisser passer une extraction par IA pour une transcription. Son titre est déjà en retard sur son travail : le produit déclare trois genres de sources — barème, calendrier, règle — et les seules sources posées à ce jour sont des règles, dont aucune n'a de traitement.

**La porte.** Fausse telle qu'écrite. Le tableau allume l'épique « quand le service Railway devient nécessaire, c'est-à-dire à l'épique 12 » (≈ mai 2027, l'usure ayant besoin de roulages avant de parler). Or l'épique 12 est précisément le seul consommateur que la récolte a renoncé à servir : A-FAIRE.md:100-104 tranche qu'AUCUNE source de barème constructeur ne sera proposée, une documentation d'atelier étant de la propriété intellectuelle protégée. La porte pointe donc l'unique client déjà écarté. Le vrai premier consommateur est l'épique 13 — « avant le premier roulage encadré de la saison », soit ~mars 2027, deux mois plus tôt — dont l'écran de conformité est livré, déployé, et lit les règles publiées (src/db/checklist.ts:98-103). LA BONNE PORTE, et elle est observable aujourd'hui : un roulage porte un circuit ou un organisateur, sa checklist se compose, et la section conformité rend zéro ligne. Cette condition est déjà remplie — l'épique est allumée depuis la livraison de l'épique 13, et personne ne l'a vu parce que la section vide disparaît sans un mot (src/ecrans/Checklist.tsx:38, le filtre `.filter(([, l]) => l.length)`).

*4 récits · 19 critères · 7 tenus · 11 non tenus.*


### Récit 16.1 : Le service déployé ne peut ni dépenser ni déborder

En tant que **porteur du projet**, je veux **qu'un service en ligne soit incapable de dépenser un euro ou de toucher ma saison tant que je ne l'ai pas allumé moi-même**, afin de **pouvoir le mettre en production sans surveiller ma facture ni mes données**.


**Critères d'acceptation**


**Étant donné** un service en ligne à qui personne n'a donné de clé de fournisseur  
**Quand** un tour de récolte est demandé  
**Alors** il **refuse avant d'avoir lu une seule page et avant d'avoir appelé un seul modèle** — le refus se lit, et **aucun octet payant ne part** (contrainte de fond : ce qui coûte de l'argent est refusé AVANT d'être appelé)

> ✅ **tenu** — recolte/index.mjs:133-135 — `recolter()` appelle `pretARecolter()` (index.mjs:57-62) et sort par `return { refus }` AVANT `createClient` (137) et avant le premier `fetch` (147). Vérifié en ligne, sans coût : `GET https://recolte-production.up.railway.app/sante` → `{"pret":false,"refus":"base non configurée"}`.


**Étant donné** l'adresse publique du service, qu'un inconnu peut trouver  
**Quand** il demande un tour de récolte sans y être autorisé  
**Alors** il est **éconduit**, et cette éconduite **ne dépend pas de l'absence de clé** — sinon la porte s'ouvrirait le jour exact où le service commence à coûter

> ✅ **tenu** — recolte/index.mjs:225 — le jeton est vérifié AVANT l'appel à `recolter()`, donc avant l'interrupteur de clé ; comparaison en temps constant (index.mjs:72-79) et échec fermé si le jeton n'est pas configuré (index.mjs:73). Vérifié en ligne : `POST /recolter` sans en-tête → HTTP 401.


**Étant donné** un tour autorisé qui s'emballe  
**Quand** il enchaîne les extractions payantes  
**Alors** le nombre d'appels facturés est **plafonné**, et le plafond se règle **sans redéploiement**

> 🟡 **partiel** — recolte/index.mjs:39 et 139 — `plafondAppels` (variable d'environnement, défaut 20) s'applique en `.limit()` sur les sources, à raison d'un appel par source : le plafond tient DANS un tour. Rien ne borne le nombre de TOURS — ni délai, ni budget journalier, ni compteur persistant. Le commentaire index.mjs:36-38 (« une boucle qui dérive ne peut pas le franchir ») est vrai à l'intérieur d'un tour et faux à l'échelle du service.


**Étant donné** un service qui n'a aucune raison de toucher aux données d'un pilote  
**Quand** on cherche ce qui l'en empêche  
**Alors** c'est **le moteur de la base qui le lui refuse**, pas la politesse de son code — un droit qu'on s'abstient d'exercer n'est pas un droit qu'on n'a pas (AD-12)

> ❌ **NON TENU** — Le rôle dédié existe avec ses `grant`/`revoke` (supabase/migrations/20260818000002_rls_et_role_recolte.sql:66-78) mais RIEN NE L'EMPLOIE : relevé sur `pg_auth_members`, `recolte` n'est membre que de `postgres`, jamais de `authenticator` — PostgREST ne peut donc pas s'y muer. Le service se connecte avec `SUPABASE_SERVICE_ROLE_KEY` (recolte/index.mjs:33 et 137), c'est-à-dire le rôle `service_role`, qui contourne RLS et peut écrire TOUTES les tables de pilote. Le commentaire index.mjs:25-27 l'avoue sans le savoir — « le service ne le tente même pas » — soit exactement la discipline que la migration disait vouloir remplacer (20260818000002:4-6 : « la frontière est donc portée par la base elle-même et non par la discipline du code »).


**Étant donné** les refus que le service revendique  
**Quand** on veut les rejouer un an plus tard, ou après une refonte  
**Alors** **un essai les rejoue** — un garde-fou qu'on n'éprouve jamais finit par ne plus exister, et le service le dit lui-même de son cinquième garde-fou

> ❌ **NON TENU** — Aucun essai n'importe `recolte/index.mjs`. banc-rendu/ contient 25 fichiers `fumee-*.mjs` (accueil, atelier, budget, checklist, usure, emport…) et AUCUN `fumee-recolte.mjs` ; banc-rendu/unite/essais.ts ne mentionne ni `pretARecolter`, ni `jetonValide`, ni `recolter`. recolte/package.json ne déclare aucun script d'essai. Les trois refus documentés dans A-FAIRE.md:80-84 ont été constatés à la main, une fois.


### Récit 16.2 : Une ligne récoltée dit d'où elle vient, jusqu'à l'écran

En tant que **pilote**, je veux **savoir de quelle page vient un chiffre, quand il a été relevé, et qu'une machine l'a lu à ma place**, afin de **pouvoir aller vérifier avant de faire confiance à un chiffre qui touche la sécurité de ma moto**.


**Critères d'acceptation**


**Étant donné** une ligne produite par la récolte  
**Quand** elle est écrite  
**Alors** elle porte **son adresse de source, sa date de relevé et la mention qu'une machine l'a extraite** — les trois, ensemble (AD-11, FR-50)

> ✅ **tenu** — Colonnes obligatoires et non nulles sur les trois tables cibles : supabase/migrations/20260818000001_schema_deux_axes.sql:73-75 (roulages publiés) et :90-92 (barème) ; supabase/migrations/20260819000014_checklist_et_conformite.sql:23-26 (règles). Le service les pose en un seul objet appliqué à chaque ligne (recolte/index.mjs:154-158), avec `extrait_par_ia: true` en dur et le commentaire « TOUJOURS vrai ici ».


**Étant donné** une ligne à qui l'un des trois manque  
**Quand** la récolte tente de l'écrire  
**Alors** **elle n'est pas écrite** — ni en partie, ni avec un trou, ni avec une valeur de remplissage

> ✅ **tenu** — Tenu par la base et non par le service : les contraintes `not null` refusent l'insertion. recolte/index.mjs:172 et 186 se contentent de ranger le refus dans `bilan.soucis` et de continuer, ce qui est le bon comportement obtenu par le bon mécanisme — la contrainte, pas la discipline. C'est l'inverse exact du garde-fou de l'épique 16.1 sur les tables de pilote.


**Étant donné** une règle publiée par un circuit, récoltée puis recopiée sur la liste de chargement d'un roulage  
**Quand** le pilote la lit au paddock  
**Alors** **la mention d'extraction automatique l'accompagne**, et n'est jamais reléguée en pied de page (AD-11)

> ❌ **NON TENU** — La mention meurt à la frontière référentiel → pilote. La table d'accueil ne porte que la source et la date de publication — pas le fait d'une extraction (supabase/migrations/20260819000014_checklist_et_conformite.sql:40-41) ; la recopie ne transporte que ces deux champs (src/db/checklist.ts:116-118) ; l'écran affiche « publié le … » sans jamais dire qu'une IA a lu la page (src/ecrans/Checklist.tsx:68-72). Le pilote lit une règle de conformité comme si un humain l'avait transcrite.


**Étant donné** une fiche d'organisateur de plus de douze mois  
**Quand** elle s'affiche  
**Alors** elle **dit son âge et invite à vérifier auprès de l'organisateur**, et ne se présente jamais comme à jour (FR-51)

> ✅ **tenu** — src/ecrans/Checklist.tsx:78-85 — bandeau conditionné à `moisDepuis(x.publie_le, jour) > MOIS_AVANT_DOUTE`, texte « rapportées telles qu'elles ont été publiées, jamais vérifiées — l'organisateur reste la seule source à jour » ; l'âge s'affiche aussi ligne à ligne (Checklist.tsx:72). Calcul en src/db/checklist.ts:146.


**Étant donné** une échéance d'entretien affichée au garage  
**Quand** elle provient d'une extraction  
**Alors** la **mention d'extraction est inséparable du chiffre**, au même titre que la complétude — portée par le type, jamais par un test d'affichage (AD-11, FR-40)

> ❌ **NON TENU** — src/ecrans/Usure.tsx:75 — le bloc de provenance est sous `{a.source.url && (…)}`. Un intervalle dont l'adresse de source serait nulle s'afficherait donc SANS aucune mention. Le remède appliqué à FR-40 dans le même domaine — rendre l'un impossible sans l'autre dans le type `Avancement` (src/db/usure.ts:61-78, avec son commentaire « une clause tenue par un ternaire de rendu finit toujours par être contournée ») — n'a pas été appliqué à AD-11, alors que c'est le même piège. Et la base ne rattrape pas : la table d'horloge n'a AUCUNE contrainte liant l'extraction à la présence d'une source (supabase/migrations/20260819000013_frontiere_et_usure.sql:58-60 ; relevé sur `pg_constraint`, seuls existent deux `check` sur l'intervalle et le libellé).


### Récit 16.3 : La correction du pilote gagne toujours

En tant que **pilote qui a le manuel constructeur sous les yeux**, je veux **corriger une échéance fausse et qu'aucune récolte ultérieure ne revienne l'écraser**, afin de **ne pas avoir à surveiller éternellement un chiffre que j'ai déjà corrigé une fois**.


**Critères d'acceptation**


**Étant donné** une valeur récoltée que le pilote juge fausse  
**Quand** il veut la corriger  
**Alors** **le produit lui offre le geste** — sans quoi la primauté de sa correction est une phrase sans objet

> ❌ **NON TENU** — Aucun écran ne présente une valeur récoltée à corriger, et pour cause : rien n'écrit jamais la provenance d'une horloge d'usure. Le seul créateur d'horloge insère `extrait_par_ia = 0` en dur et ne pose ni source ni date (src/db/usure.ts:170-172). Le seul intervalle que le produit connaît est celui que le pilote a tapé lui-même : il n'y a rien à corriger parce qu'il n'y a rien de récolté. Confirmé en base : la table de barème compte 0 ligne.


**Étant donné** une correction faite par le pilote  
**Quand** elle est enregistrée  
**Alors** elle vit **dans ses données à lui**, jamais dans le référentiel que la récolte possède — deux propriétaires pour une même table, et un incident de récolte corrompt une saison (AD-11, AD-12)

> ❌ **NON TENU** — AD-11 prescrit une surcouche par pilote sous RLS (`bareme_correction`) référençant la ligne corrigée. Cette table N'EXISTE NULLE PART : absente de supabase/migrations/, absente de la base, absente de src/ (une seule occurrence dans tout le dépôt, dans le document d'architecture lui-même). Le code a choisi l'inverse exact — un drapeau `corrige_par_pilote` posé SUR la table de référentiel, testé à recolte/index.mjs:164-167.


**Étant donné** le drapeau censé protéger une correction  
**Quand** on cherche qui peut le lever  
**Alors** **quelqu'un le peut** — un verrou que personne ne peut fermer n'est pas un verrou

> ❌ **NON TENU** — Le défaut le plus silencieux de l'épique. La table de barème ne porte QU'UNE politique, en lecture, pour tous (supabase/migrations/20260818000002_rls_et_role_recolte.sql:31 ; confirmé sur `pg_policies` : une seule ligne, cmd=SELECT, roles={public}). Aucun pilote ne peut donc écrire ce drapeau. Et il ne le verrait même pas : le barème est délibérément exclu du flux qui descend sur le téléphone (powersync/sync-config.yaml, bloc `referentiel`, avec son commentaire « LE BARÈME CONSTRUCTEUR EST VOLONTAIREMENT ABSENT »), exclusion assumée par un essai (banc-rendu/unite/essais.ts:243-252). Le garde-fou n°2 est structurellement inatteignable : le service le teste à chaque tour, la colonne restera `false` à jamais.


**Étant donné** une source déjà lue au tour précédent  
**Quand** la récolte y repasse  
**Alors** elle **ne duplique pas** ce qu'elle a déjà écrit — et une ligne déjà en double **ne dégrade pas** le tour suivant

> ❌ **NON TENU** — Aucune clé unique ne protège le barème sur (marque, modèle, opération) ni les roulages publiés sur (circuit, date) — relevé sur `pg_indexes` : uniquement des index NON uniques (`bareme_marque_modele_idx`, `roulage_publie_circuit_id_date_jour_idx`). Les roulages publiés sont insérés à sec, sans recherche préalable (recolte/index.mjs:181) : un second tour duplique tout le calendrier. Pire sur le barème : dès qu'un doublon existe, le `.maybeSingle()` de recolte/index.mjs:166 renvoie une erreur que la ligne 164 JETTE AU SOL (`const { data: deja }` n'extrait pas `error`), `deja` vaut alors `null`, et le service insère un TROISIÈME exemplaire. Le défaut s'aggrave à chaque tour au lieu de se stabiliser — et il s'aggrave sur la seule table du produit où une erreur touche la sécurité d'une machine.


### Récit 16.4 : Une source s'ajoute sans redéployer, et chaque genre trouve sa table

En tant que **porteur du projet**, je veux **ajouter, couper ou changer une source depuis la base, et que chaque genre de source aboutisse là où il doit**, afin de **ne pas redéployer un service pour un changement d'adresse, et ne pas découvrir au paddock qu'une famille entière de sources n'a jamais rien produit**.


**Critères d'acceptation**


**Étant donné** une source qui casse ou dont les conditions d'utilisation deviennent douteuses  
**Quand** on veut l'écarter  
**Alors** **on la désactive depuis la base**, sans redéploiement, et les autres continuent de tourner

> ✅ **tenu** — La table des sources porte un drapeau d'activité (relevé sur `information_schema.columns` : `actif boolean not null default true`) et le service ne lit que les actives (recolte/index.mjs:139, `.eq('actif', true)`). Une source en échec inscrit son souci et la boucle poursuit (recolte/index.mjs:194-199). Constaté en base : 5 sources posées, 0 active — le service ne lit donc rien et n'appelle rien aujourd'hui.


**Étant donné** une source neuve d'un genre déjà traité  
**Quand** on l'ajoute  
**Alors** **aucun redéploiement n'est nécessaire** — les sources sont de la donnée, pas du code (AD-10)

> ✅ **tenu** — Genre, adresse et libellé sont des colonnes lues à chaque tour (recolte/index.mjs:138-139). Rien dans recolte/index.mjs ne code en dur une adresse de source. La réserve est au critère suivant : cela ne vaut que pour les genres déjà branchés.


**Étant donné** les **trois genres de sources** que le produit déclare  
**Quand** la récolte tourne  
**Alors** **chacun est traité selon ce qu'il est** et aboutit dans sa propre table — aucun ne tombe dans la branche d'un autre

> ❌ **NON TENU** — La faute la plus lourde de l'épique. La base autorise trois genres (contrainte `source_recolte_genre_check` relevée sur `pg_constraint` : `calendrier`, `bareme`, `regle`). Le service n'en connaît que DEUX : recolte/index.mjs:152 (`s.genre === 'bareme' ? SCHEMA_BAREME : SCHEMA_CALENDRIER`) et index.mjs:161 (`if (s.genre === 'bareme') … else …`). Un genre `regle` est donc extrait avec le gabarit CALENDRIER puis écrit dans les roulages publiés. Conséquence directe : la table des règles d'organisateur N'A AUCUN SEMEUR — ni la récolte, ni une migration, ni la PWA — alors que TROIS des cinq sources posées sont précisément de genre `regle` (Lédenon, Nogaro, Pau-Arnos, relevées en base). Le titre même de l'épique, « barèmes et calendriers », a enregistré l'oubli.


**Étant donné** un écran déjà livré qui lit ce que la récolte doit produire  
**Quand** le référentiel est vide  
**Alors** l'écran **dit qu'il n'y a rien** — une absence se dit, elle ne laisse pas une section disparaître sans un mot

> ❌ **NON TENU** — Relevé en base ce jour : barème 0, roulages publiés 0, organisateur 0, règles d'organisateur 0. Le seul référentiel peuplé est celui des circuits (32 lignes), et il vient d'une migration (supabase/migrations/20260819000009_circuits_de_reference.sql), pas de la récolte. La section conformité de la liste de chargement compose donc toujours zéro ligne (src/db/checklist.ts:98-103) — et la catégorie entière est SILENCIEUSEMENT SUPPRIMÉE de l'affichage par `.filter(([, l]) => l.length)` (src/ecrans/Checklist.tsx:38). Le pilote ne peut pas distinguer « cet organisateur ne publie rien » de « on n'a jamais rien récolté ». S'y ajoute un second trou du même ordre : rien n'écrit jamais l'organisateur d'un roulage (aucune écriture de `organisateur_id` dans src/, seulement des lectures en src/db/checklist.ts:93-103), donc la moitié du rapprochement des règles est morte avant même que la table soit remplie.


**Étant donné** la table des sources et le drapeau de correction du pilote  
**Quand** on rejoue les migrations sur une base neuve  
**Alors** **on retrouve la même base** — ce qui vit en production et nulle part dans le dépôt disparaîtra sans bruit

> ❌ **NON TENU** — Dérive de schéma confirmée dans les deux sens. `source_recolte` (8 colonnes, une contrainte de genre, un unique sur l'adresse) et `bareme.corrige_par_pilote` existent en base (relevés sur `information_schema.columns` et `pg_constraint`) et N'APPARAISSENT DANS AUCUN fichier de supabase/migrations/ — grep sur les 29 migrations : zéro occurrence, les seules mentions du dépôt sont A-FAIRE.md:96 et recolte/index.mjs. Sur une base reconstruite depuis le dépôt, le service échouerait au premier tour sur `sources illisibles` (recolte/index.mjs:140) et le drapeau de correction n'existerait plus.


---

## Ce qu'un lecteur critique a relevé sur ces récits


Un agent a relu l'ensemble avec une seule consigne : trouver les critères qu'on ne sait pas
mettre en échec. **Sa lecture n'a porté que sur les épiques 8 à 12** — le texte transmis a été
tronqué, et il le dit lui-même en tête. Les épiques 13 à 16 n'ont donc PAS été relues, et
c'est le premier point à reprendre.


**Périmètre reçu : épiques 8 à 12 seulement.** Le texte s'arrête au milieu du critère 12.4-5. **Les épiques 13, 14, 15 et 16 sont absentes** — donc trois des six non-tenus de l'inventaire du 24 août (13 `regle_organisateur` sans semeur, 14 FR-38 carnet partagé, 16 référentiel vide) n'ont **aucun critère**. C'est le premier trou, et il est plus grave que tout ce qui suit.

Racine : `/Users/juliantalou/Documents/PRO/03-PROJECTS/MyPaddock3` (chemins relatifs ci-dessous).

---

## ① Les critères à réécrire

**11.1-1 et 11.1-2 — la porte a été recopiée sur le code.** epics.md:195 dit « trois roulages saisis ». Le récit déclare cette intention *fausse*, la remplace par ce que fait `courbe.ts:50-57` (trois roulages **avec chrono**), puis se décerne « tenu ». C'est la faute cardinale, commise dans la porte elle-même. Version qui sait échouer :
> **Étant donné** un circuit où trois roulages sont saisis sans aucun chrono **Quand** j'ouvre l'un d'eux **Alors** l'écran **nomme ce qui prendra cette place et pourquoi elle est vide** — un pilote qui a fait le geste que la spécification nomme ne repart jamais avec un blanc (FR-14, FR-20). → **non tenu** (App.tsx:1169-1176).

**11.1-2 encore — « tenu par la forme de la requête » est un aveu, pas un verdict.** `courbe.ts:50-57` **n'a aucun filtre `etat = 'usage'`**, contrairement à `usure.ts:136` et `preparation.ts:103`. Réécrire : *« un roulage en brouillon portant un chrono importé n'entre pas dans la courbe »* → **non tenu aujourd'hui**. Le récit 11.4-2 grade *non tenu* exactement le même accident (« le mélange ne se produit pas pour une raison accidentelle ») : deux poids, deux mesures dans la même épique.

**10.1-3 et 10.1-4 — « tenu par absence ».** Deux « tenu » sur le récit de FR-25, que l'inventaire du 24 août range parmi les non-tenus. Un critère dont l'objet n'existe pas se grade *sans objet*, jamais *tenu* : le tableau de rétrospective comptera deux verts. Réécrire pour qu'ils échouent :
> **Alors** le chemin manuel reste atteignable **en un tap depuis l'écran de reconnaissance**, et l'échec de lecture **se dit** au lieu de laisser un champ vide.

**11.2-1 à 11.2-5, et 9.1-1 à 9.1-4 — les preuves reposent sur un banc que le récit suivant déclare incapable d'échouer.** Vérifié : `banc-rendu/fumee-courbe.mjs:108` et `banc-rendu/fumee-vide-saisonnier.mjs:94` font tous deux `process.exit(erreurs.length ? 1 : 0)` ; même forme dans `fumee-usure`, `fumee-cercle`, `fumee-checklist`, `fumee-legal`, `fumee-saison`, `fumee.mjs`. Neuf « tenu » sont donc prouvés par un fichier qui imprime « NON » et sort à 0. Ajouter à chacun la clause d'exécution — *« et un essai le met en échec quand il est cassé »* — bascule les neuf en **non tenu**.

**10.3-1 — « aucun chemin ne PEUT rendre l'un sans l'autre » est faux.** Le type interdit de *transporter* une moitié, pas de *rendre* une moitié : `recap/composer.ts:194-196` rend `co.auTour.centimes` puis le consommé en deux appels indépendants ; rien n'empêche le second de disparaître. Et `grep auTour` sur `banc-rendu/` : **aucun essai**. Réécrire : *« un écran qui rend le coût au tour sans le consommé fait rougir un essai »* → **non tenu**.

**9.2-2 — la disjonction annule le critère.** « c'est cet ordre-là, **ou bien** l'écart est écrit au dossier » : n'importe quel écart se légalise en éditant le dossier. Choisir l'ordre, ou faire de l'écart lui-même le critère.

**10.2-2 — critère recopié mot pour mot du commentaire qu'il cite** (`depot.ts:401-409` : « la saison en cours si elle existe, sinon la saison à venir… aucun mois comparé »). Preuve = commentaire. L'ancrer sur le cas observable : *pneus payés le 15 décembre, après le dernier roulage de la saison*.

---

## ② Les verdicts suspects

**8.4-3 contredit 9.1-3 sur la même ligne.** `App.tsx:629` est gardé par `src.jours != null`, et `accueil.ts:112` met `joursEv` à `null` quand `date_approx` l'est. 9.1-3 « tenu » est juste ; **8.4-3 a mal lu sa propre preuve**. Le vrai défaut est ailleurs : `App.tsx:759-761` (date brute dans la liste) et l'`<input type="date">` de 8.4-2. Deux épiques opposeront au code deux verdicts inverses sur la même ligne.

**9.1-1 « tenu » masque une violation de FR-46 dans la requête qu'il cite.** `accueil.ts:136` : `piece = attente.find(a => a.categorie !== 'reparation_non_vitale')` — **entretien et amélioration sont fondus dans une seule source « Au garage »**. L'épique 8 consacre un récit entier au mur entre les trois catégories ; l'épique 9 valide la source qui en fusionne deux.

**8.2-6 plaide sa propre relaxe.** « le tort est structurel, pas visuel » : un verdict qui explique pourquoi la violation ne compte pas. Le fait est net et vérifié — `chiffres.ts` somme `count(*) FROM intervention WHERE etat='faite'` sous l'étiquette « gestes consignés », toutes catégories confondues. Non tenu sec, ou pas de critère.

**12.1-1 et 12.4-1 « tenu à vide ».** La pondération ne pondère rien (quatre coefficients à 1) ; la frontière brouillon/usage n'a jamais été exercée (0 brouillon). Ce sont des critères **en attente**, pas tenus — et 12.1-3 admet lui-même qu'ils divergeront « au jour où ce chiffre commence à vouloir dire quelque chose ».

**10.4-2 « tenu » tient** — vérifié : `emporter.ts:50` `const TABLES = ORDRE`, `sauvegarde.ts:52` liste bien 17 tables, essai à `unite/essais.ts:336-338`. C'est le seul point de l'inventaire du 24 août légitimement refermé.

---

## ③ Ce qui manque

1. **Épiques 13 à 16 : rien.** (voir en tête)
2. **FR-4, première conséquence, orpheline** (prd.md:374-380) : *« l'horloge d'usure d'un composant amélioré repart sur un autre barème que celle d'un composant simplement remplacé »*. 8.1-4 ne couvre que l'argument de revente et la non-certification ; l'épique 12 n'en parle jamais. Or la carte de couverture renvoie FR-4 à l'épique 8.
3. **FR-54, seconde moitié, orpheline et pire, contredite** : *« il alimente le budget prévisionnel »*. 8.4-5 écrit l'inverse en critère (« il n'y entre pour rien ») sans borner à l'épique 15 — on s'en servira pour refuser le lien FR-56.
4. **L'interdit « ce qui coûte de l'argent est refusé AVANT d'être appelé »** n'est porté que par 10.1-5, gradé *non_verifiable*. C'est un interdit de produit, pas une propriété d'une fonction absente : il doit être un critère opposable au gabarit `reserver_generation`, sinon rien ne protège le futur chemin OCR.
5. **UX-DR9** : `App.tsx:417-421` proclame « LA BARRE SE CALCULE, elle n'est pas une liste figée » au-dessus de **quatre boutons en dur**. Exactement le motif commentaire-qui-ment que 9.4-2 dénonce sur `preparation.ts:71-73` — et aucun critère de 8 ou 9 ne le relève.

---

## ④ Doublons et chevauchements

- **`intervention.depense_id` jamais écrit : 8.3-2, 9.1-5 et 10.2-4.** Trois épiques, un seul défaut, trois billets de rétrospective.
- **La liste mélangée d'avant-roulage (`preparation.ts:74-90`) : 8.2-3, 9.4-1, 9.4-2 et 9.4-3.** Quatre critères sur un fichier ; 8.2-3 et 9.4-1 sont le même critère à la reformulation près.
- **`oublierEvenement` jamais appelé : 8.4-6 et 9.2-3.**
- **« Aucune échéance, aucune relance » sur ce qui attend : 8.3-4, 9.3-2, 9.1-2.** Trois fois la même absence.
- **La pièce non montée comme état de première classe : 8.3-1 et 10.2-5**, mêmes lignes d'`atelier.ts`, tous deux tenus.
- **Chevauchement de portes 8/9** : la porte de 9 exige les objets de 8, et les deux épiques revendiquent « refermer le vide saisonnier ». Il faut trancher laquelle porte les sources de l'accueil — sinon aucune rétrospective ne peut conclure sur l'une sans rouvrir l'autre.
- **Référence fausse à corriger** : 8.1-5 cite **FR-38** (carnet partagé par lien) pour la distinction facture/photo. C'est FR-4 + la migration `20260819000018_preuve_atelier.sql`.


---

# Les récits des retours du 25 août 2026

Douze retours de Julian après un usage réel, restructurés, challengés un par un,
puis découpés. La méthode a été la sienne : *« un agent qui restructure, un agent
qui critique et challenge, un agent qui planifie, un agent qui implémente, un
agent qui fait la revue »*, et *« au maximum, cherche des librairies déjà
existantes »*.

**Ce que la relecture a d'abord établi : la moitié de ces demandes n'est pas une
fonctionnalité manquante, mais un CHEMIN manquant.** Saisir une journée à venir
marche déjà, l'accueil sait l'afficher, la préparation existe, la checklist
existe — et pourtant, après validation, l'application demande le meilleur tour
d'une journée qui n'a pas eu lieu. Ce n'est pas du code qui manque, c'est un
enchaînement qui ment.

**Trois demandes contredisent une règle écrite du produit.** Elles sont marquées
⚠ dans les récits concernés, avec la ligne exacte qu'elles lèvent. Aucune n'est
tranchée ici : lever une règle est une décision de Julian, et elle se date comme
celles du 18 et du 23 août.

## Épique 17 : Le roulage à venir — un chemin, pas une fonctionnalité

**Objectif.** Faire qu'une journée annoncée s'ouvre sur ce qui la prépare, et jamais sur ce qui la raconte. Les quatre morceaux de R2 sont déjà écrits — la date future s'accepte (App.tsx:1056), l'accueil sait dire « Prochain roulage · dans N jours » (accueil.ts:98-120, App.tsx:664-693), « Avant d'y aller » se dérive (preparation.ts:64-138), la liste modifiable est livrée (Preparation.tsx:105-121) — et aucun n'est atteignable, parce que le tap sur le bloc de l'accueil ouvre un post-mortem (App.tsx:669 → ouvrirBilan → BilanEcran:1115-1202). Cette épique ne construit presque rien : elle raccorde, et elle répare les quatre endroits où une journée qui n'a pas eu lieu se compte déjà comme vécue.

**La porte.** Un roulage dont `date_jour` est postérieure au jour courant existe en base. Cette porte est OUVERTE depuis le premier jour — la saison de démonstration en sème un (Garage.tsx:145-148, daté du 19 septembre 2026, pas du 12 comme Julian). Ce qui est fermé n'est pas la porte, c'est ce qu'il y a derrière.

**Ce qu'elle refuse.** Certifier une préparation — aucun « prêt », aucun « 4 sur 7 », aucun pourcentage, aucune barre. Réclamer — rien ne relance, rien n'échoit, rien ne se décoche tout seul. Compter par avance — une journée annoncée n'entre dans aucun total, aucune moyenne, aucune horloge d'usure, aucune « dernière journée sur ce circuit ». Embarquer un intervalle — une ligne d'entretien identique pour tout le monde se coche sans être lue dès la deuxième fois, et cocher une ligne de frein donne le sentiment d'avoir fait le travail (Preparation.tsx:16-21).

*5 récits · 40 critères · aucun tenu — rien n'est écrit.*


### Récit 17.1 : Une journée annoncée est un projet, jamais un vécu

En tant que pilote, je veux que la journée que j'annonce reste un projet tant que je n'y suis pas allé, afin que mes compteurs ne mentent pas et qu'on ne me demande pas le meilleur tour d'une journée qui n'a pas eu lieu.

*Taille : moyen.*


**Critères d'acceptation**


**Étant donné** le 12 septembre saisi le 25 août  
**Quand** je valide le formulaire  
**Alors** l'application ne m'emmène PAS sur « Meilleur tour de la session » — App.tsx:364 enchaîne aujourd'hui `setEcran('session')` et App.tsx:1100 demande un chrono sur une journée qui n'existe pas encore

**Étant donné** cette journée annoncée  
**Quand** l'accueil affiche « X roulages » et « Y circuits »  
**Alors** elle n'y est pas comptée — chiffres.ts:92-95 fait `count(*) FROM roulage` sans filtre de date ni d'état, et l'accueil annonce 6 pour 5 vécus

**Étant donné** le bilan de saison  
**Quand** il énonce sa complétude  
**Alors** le 12 septembre n'est pas compté parmi les journées « sans chrono » — bilan.ts:57 filtre `etat = 'usage'`, ce qui ne sert à rien puisque creerRoulage écrit `usage` en dur (depot.ts:249-252), et FR-55 se retourne contre elle-même en annonçant un trou qui n'en est pas un

**Étant donné** « Ce que tu sais de ce circuit »  
**Quand** il affiche `sien.journees` et `derniere`  
**Alors** la dernière journée n'est jamais une date à venir — circuits.ts:88-92

**Étant donné** la première session, la première photo ou la première dépense rattachée à cette journée  
**Quand** elle est saisie  
**Alors** la journée devient vécue sans que rien ne me le demande : aucune case, aucune confirmation, aucune relance — FR-61 le permet déjà (« confirmé par le pilote OU par une mesure », prd.md:1244)

**Étant donné** une cinquième lecture qui compterait des roulages, écrite après ce récit  
**Quand** elle est ajoutée sans le prédicat partagé `etat='usage' AND date_jour <= :jour`  
**Alors** un essai unitaire échoue — usure.ts:127,136 a la bonne discipline, bilan.ts en a la moitié, chiffres.ts et circuits.ts aucune : corriger les quatre requêtes une par une est exactement la manière dont le défaut est né

**Étant donné** n'importe quel écran  
**Quand** une journée à venir s'affiche  
**Alors** rien ne dit combien de jours il « reste pour préparer » : « dans 23 jours » est un fait, « il te reste 23 jours » est une échéance déguisée (EXPERIENCE.md:105-108)

> *Touche :* src/App.tsx, src/db/depot.ts, src/db/chiffres.ts, src/db/bilan.ts, src/db/circuits.ts, src/db/schema.ts, banc-rendu/unite/essais.ts


### Récit 17.2 : Le tap sur « Prochain roulage » ouvre la préparation, pas le post-mortem

En tant que pilote, je veux qu'un tap sur ma prochaine journée m'ouvre ce qui la prépare, afin de ne pas me voir proposer de déclarer une chute sur une journée qui n'a pas eu lieu.

*Taille : moyen.*


**Critères d'acceptation**


**Étant donné** un roulage à venir  
**Quand** je tape le bloc de l'accueil (App.tsx:669)  
**Alors** je n'obtiens ni « Meilleur tour du jour · — », ni « Sessions · 0 », ni le bloc des chutes, ni « Saisir une session » en bouton primaire pleine largeur (App.tsx:1144-1200)

**Étant donné** ce même écran  
**Quand** il se rend  
**Alors** il porte ce qui prépare : « Avant d'y aller » (dérivée, non cochable), le chargement (composé, cochable) et ce que j'ajoute — et son bouton primaire est « Ajouter une chose à faire »

**Étant donné** que le chargement vit aujourd'hui DANS le bilan, derrière un tap (App.tsx:1178, Checklist.tsx:37)  
**Quand** le bilan sort du chemin d'un roulage à venir  
**Alors** le chargement reste atteignable : le composant se déplace, il ne se duplique pas — sinon on supprime la seule chose de R2 qui était déjà construite

**Étant donné** le matin du 12 septembre à 6 h, en chargeant le camion  
**Quand** j'ouvre l'application  
**Alors** « Avant d'y aller » est encore là — accueil.ts:99 filtre `date_jour > ?` en strict, et App.tsx:505 ne rend `<Preparation>` que si `genre === 'a_venir'` : la liste disparaît le jour même où l'on s'en sert

**Étant donné** ce même matin, une fois la première session saisie  
**Quand** je rouvre  
**Alors** la journée montre son chrono et ses sessions, et le basculement tient à un fait observable (une session existe), jamais à une heure ni à un réglage

**Étant donné** l'écran d'une journée à venir  
**Quand** je cherche où j'en suis — « 4 sur 7 », un pourcentage, une barre qui se remplit  
**Alors** il n'y en a aucun : la liste énonce ce qui est fait, jamais ce qui manque

**Étant donné** une journée déjà passée  
**Quand** je l'ouvre  
**Alors** aucune liste de préparation ne s'y affiche — « ce qui reste à faire sur une journée déjà passée serait un reproche » (App.tsx:498-505), et la symétrie doit tenir dans les deux sens

> *Touche :* src/App.tsx, src/db/accueil.ts, src/ecrans/Preparation.tsx, src/ecrans/Checklist.tsx


### Récit 17.3 : La liste d'avant d'y aller cesse d'être structurellement vide

En tant que pilote, je veux que « vérifier l'huile » et « prendre l'assurance » apparaissent parce que le produit sait quelque chose sur MA moto, afin de ne pas cocher une liste générique que je cesserai de lire à la deuxième journée.

*Taille : gros.*


**Critères d'acceptation**


⚠ CONTRADICTION NON TRANCHÉE, ET C'EST ELLE QUI FIXE LA TAILLE —
**Étant donné** que preparation.ts:10-16 et checklist.ts:101-104 écrivent « un fait dérivé ne se stocke pas », et que Julian réclame huile / consommables / assurance en liste de base  
**Quand** on choisit entre embarquer et dériver  
**Alors** rien de ce récit ne s'écrit avant sa réponse : la contre-proposition ci-dessous est une proposition, pas une décision

**Étant donné** que sa liste est aujourd'hui structurellement vide — preparation.ts:98 fait `if (!h.intervalle) continue`, la table `horloge` compte 0 ligne, aucun semeur n'existe dans corpus.ts et A-FAIRE §5 dit qu'aucune source de barème constructeur ne sera proposée  
**Quand** la liste se dérive  
**Alors** elle ne peut porter qu'UNE ligne, « L'engagement » : Julian ne demande pas une liste embarquée par paresse, il la demande parce que la sienne est vide

**Étant donné** une moto sans aucune horloge  
**Quand** j'ouvre l'état vide de la préparation (Preparation.tsx:60-70)  
**Alors** on me propose de poser les postes de CETTE moto en un geste — vidange, plaquettes, chaîne, liquide de frein, pneus, filtre à air — tous avec `intervalle = null`, ce que poserHorloge accepte déjà (usure.ts:163-174)

**Étant donné** une horloge posée sans intervalle  
**Quand** elle compte  
**Alors** elle ne produit AUCUNE ligne d'avant-roulage et n'invente aucun verdict : sans barème elle compte sans jamais échoir (FR-44)

**Étant donné** une saison sans aucune dépense de poste `assurance` (budget.ts:31)  
**Quand** la liste se dérive  
**Alors** elle porte une ligne qui DIT le fait et mène au budget, exactement comme « L'engagement » (preparation.ts:117-135) — et cette ligne disparaît dès que la dépense existe, au lieu de rester cochable à côté d'une donnée que le produit détient déjà

**Étant donné** la même horloge de la même moto  
**Quand** elle s'affiche au garage et dans l'avant-roulage  
**Alors** les deux écrans donnent le même nombre et le même seuil — aujourd'hui usure.ts:143 additionne des coefficients, preparation.ts:101 fait un `count(*)` brut, et le seuil est `ponderes >= intervalle` d'un côté (Usure.tsx:49) contre `n > intervalle` de l'autre (preparation.ts:106)

**Étant donné** que ces deux erreurs se compensent EXACTEMENT aujourd'hui (n vaut pondérés + 1, donc `n > i` équivaut à `pondérés >= i`)  
**Quand** on en corrige une seule  
**Alors** toute la liste se décale d'un roulage : les deux se corrigent dans le même geste ou aucune

**Étant donné** le roulage qu'on prépare  
**Quand** l'horloge compte  
**Alors** il ne se compte pas lui-même — preparation.ts:99-104 compte `date_jour <= ?` avec la date DU roulage préparé, et le commentaire qui le surplombe (preparation.ts:90-93) décrit un code qui n'existe pas

**Étant donné** un chiffre d'usure affiché dans l'avant-roulage  
**Quand** il s'affiche  
**Alors** sa complétude est dans le même écran, à côté de lui, comme au garage (Usure.tsx:59-67) — FR-40 et l'interdiction n°2 du §6 du PRD n'ont pas d'exception d'écran

**Étant donné** une ligne d'entretien quelconque  
**Quand** elle est cochable  
**Alors** elle ne l'est pas : ce qui est dérivé s'énonce et ne se coche jamais — cocher une ligne de plaquettes donne le sentiment d'avoir fait le travail sans l'avoir fait

> *Touche :* src/db/preparation.ts, src/db/usure.ts, src/db/checklist.ts, src/db/budget.ts, src/ecrans/Preparation.tsx, src/ecrans/Usure.tsx, A-FAIRE.md


### Récit 17.4 : Ce que j'ajoute moi-même, et ce que le circuit a publié

En tant que pilote, je veux ajouter « réserver la remorque » et « réparer le sabot » à la main, et que les règles publiées par Pau-Arnos arrivent sans effacer mes coches, afin que ma liste soit la mienne et qu'elle ne se retourne jamais contre moi.

*Taille : moyen.*


**Critères d'acceptation**


**Étant donné** l'ajout libre, déjà livré (Preparation.tsx:105-121, checklist.ts:194-206)  
**Quand** j'ouvre l'écran du roulage à venir  
**Alors** le champ d'ajout est en bas de cet écran, et non enfoui dans un bloc de l'accueil — rien à construire, seulement à rendre atteignable

**Étant donné** une ligne que j'ai ajoutée  
**Quand** elle s'affiche  
**Alors** elle se coche, et ce qui est dérivé ne se coche pas : l'asymétrie est déjà juste et ne bouge pas

**Étant donné** le lien « retirer » (Preparation.tsx:97-99)  
**Quand** il s'affiche  
**Alors** il est en rouge et dit ce qui part — R12 s'applique ici aussi, et il supprime aujourd'hui sans confirmation ni couleur

**Étant donné** que je tape « assurance » alors que la ligne dérivée « L'assurance » est déjà là  
**Quand** la liste se rend  
**Alors** le produit ne me montre pas deux fois la même chose sans le dire — `memeTache` (preparation.ts:145) ne rapproche que les libellés strictement identiques à plat, et `ajouter()` ne dé-doublonne pas

**Étant donné** un chargement composé le jeudi soir hors ligne, et les règles de Pau-Arnos qui redescendent le vendredi  
**Quand** je rouvre la liste  
**Alors** ces règles s'ajoutent comme lignes de conformité NON COCHÉES et aucune coche existante ne bouge — aujourd'hui `composer` rend 0 dès qu'une ligne existe (checklist.ts:137-141) et les règles sont perdues pour ce roulage, définitivement, sans un mot

**Étant donné** un pilote sans compte — le mode par défaut du produit — dont `circuit_id` restera nul pour toujours (depot.ts:249-252, résolution serveur seule : migration 20260825000003)  
**Quand** la section conformité s'affiche  
**Alors** elle distingue « aucune règle publiée » de « je n'ai pas pu lire les règles » : le texte d'absence actuel dit que le produit ne sait rien, alors qu'il sait et n'a pas pu lire

**Étant donné** une ligne venue d'un organisateur ou d'un circuit  
**Quand** elle s'affiche  
**Alors** elle porte sa source et sa date, et aucun écran ne dit « conforme », « validé » ou « admis » (FR-50)

> *Touche :* src/db/checklist.ts, src/db/preparation.ts, src/ecrans/Preparation.tsx, src/ecrans/Checklist.tsx, src/db/depot.ts, supabase/migrations/20260825000003_le_roulage_trouve_son_circuit.sql


### Récit 17.5 : Ce que je vais chercher ce jour-là

En tant que pilote, je veux poser avant la journée ce que je vais y chercher, afin de le relire le soir sans que personne me note.

*Taille : moyen.*


**Critères d'acceptation**


⚠ LA RÈGLE QUI S'Y OPPOSAIT EST TOMBÉE, ET C'EST JULIAN QUI L'A LEVÉE —
prd.md:1022-1026 : « Séries, objectifs et caps annoncés redeviennent possibles… FR-6bis tombe avec elle », et la quatrième prohibition d'écran de l'épine UX tombe également. Ce récit n'est donc pas interdit. Trois choses résistent malgré tout, et deux sont des contradictions internes

⚠ LE MOT RESTE INTERDIT —
**Étant donné** EXPERIENCE.md:114 (« jamais performance, jamais objectif »), non levé le 18 août  
**Quand** l'écran nomme la chose  
**Alors** soit le lexique est levé par une décision datée, soit elle porte un autre nom — le produit ne peut pas afficher un mot que sa propre épine interdit

⚠ LE PRÉCÉDENT QUI DOIT INQUIÉTER —
**Étant donné** que Julian a DÉJÀ rejeté un champ de texte libre à remplir avant de rouler, verbatim dans le code (App.tsx:566-570 : « ça fait un peu gamin, personne va prendre le temps de le remplir… c'est quoi cette merde »), et que c'était le plan si-alors, l'intervention la mieux établie du dossier  
**Quand** on ouvre un champ vide « tes objectifs »  
**Alors** c'est le même objet sous un autre nom et il finira pareil

**Étant donné** la journée du 12 septembre  
**Quand** je veux dire ce que j'y cherche  
**Alors** le produit PROPOSE d'abord ce qu'il sait déjà — les virages de la fiche circuit (circuits.ts:78-82), les caps de `discipline` (gestes.ts:23-31), le fait « Jamais roulé ici » déjà calculé (App.tsx:695) — et le texte libre vient en dernier

**Étant donné** ce que j'ai visé  
**Quand** la journée est passée  
**Alors** rien ne se coche, rien ne dit « atteint », rien ne dit « 2 sur 3 » : un objectif non coché le soir est un échec affiché sans qu'aucun libellé ait à le dire

**Étant donné** la courbe de progression  
**Quand** un chrono visé existerait  
**Alors** aucune cible n'apparaît sur le tracé et aucun écart ne se calcule — courbe.ts:14-20 et epics.md:1815-1834 refusent la tendance, la droite et le « à ce rythme », et un chrono visé fabrique un verdict le soir même

**Étant donné** les caps de `bravoure`  
**Quand** je choisis ce que je vais chercher  
**Alors** seuls les caps de `discipline` sont proposés — `partageableAutomatiquement` (gestes.ts:60-61) sait déjà faire la distinction, coût nul : viser « genou gauche posé » est littéralement l'enchaînement de la chute fondatrice, et lever ça demande une décision datée comme celle du 18 août

**Étant donné** le stockage  
**Quand** on choisit où vit ce que je vise  
**Alors** c'est une 5e catégorie `objectif` sur `checklist_ligne` — un mot dans `Categorie` (checklist.ts:28), un dans `NOM_CATEGORIE`, une ligne dans le `check` serveur (migration 20260823000001:20), et `CHARGEMENT` l'exclut déjà par construction — et non une table neuve, qui coûterait schema.ts + migration + ORDRE + DEPENDANCES + DEFAUTS_SERVEUR + les règles PowerSync + l'essai unitaire : facteur dix

**Étant donné** une cinquième catégorie ajoutée  
**Quand** elle n'est rangée ni du côté du chargement ni du côté de la préparation  
**Alors** l'essai unitaire écrit le 25 août échoue — c'est exactement le défaut bloquant qui a rendu un chargement définitivement incomposable (epics.md:2184)

> *Touche :* src/db/checklist.ts, src/db/gestes.ts, src/db/circuits.ts, src/db/courbe.ts, src/App.tsx, supabase/migrations/20260823000001_preparation_et_skin_equipement.sql, _bmad-output/planning-artifacts/ux-designs/ux-MyPaddock-2026-08-18/EXPERIENCE.md

## Épique 18 : Les photos — l'album, et ce qui ne quitte jamais le téléphone

**Objectif.** Faire d'une journée un album qu'on regarde, et dire une bonne fois ce que le produit garde et ce qu'il n'a jamais pris. R4b n'est pas « dur » ni « con » : c'est impossible — aucune API navigateur ne donne accès à la pellicule, File System Access est absent de Safari, les handles persistables aussi, et Web Share Target est ouvert chez WebKit depuis février 2019 (bug 194593, toujours NEW). Mais ce que Julian cherche, le produit le fait DÉJÀ : `reduire` ramène le côté long à 1600 px en WebP q0,82 (photos.ts:63-86), son original 48 Mpx n'est jamais lu ni envoyé. Il y a une phrase à lui dire, pas une architecture à inventer.

**La porte.** Un roulage porte au moins deux photos ET le versement d'image aboutit sur l'appareil de Julian. La seconde moitié de cette porte est aujourd'hui FERMÉE, et personne ne le sait : `ecrireLocale` appelle `h.createWritable()` (photos.ts:100-105), livré dans Safari 26 seulement.

**Ce qu'elle refuse.** Prétendre atteindre la pellicule — aucun tag, aucun pointeur vers un fichier de l'appareil, un pointeur ment dès la première suppression et serait un fait dérivé stocké. Mélanger un cliché et un justificatif — le genre `facture` existe sur la même table (photos.ts:123). Charger soixante photos d'un coup — l'onglet meurt sans erreur rattrapable (photos.ts:54). Classer, noter, élire « la meilleure ».

*4 récits · 24 critères · aucun tenu — rien n'est écrit.*


### Récit 18.1 : Le versement d'image marche sur le téléphone qu'on a

En tant que pilote sur un iPhone qui n'est pas à jour, je veux qu'une photo versée au paddock soit gardée, afin de ne pas découvrir au retour que rien n'a été enregistré.

*Taille : gros.*


**Critères d'acceptation**


**Étant donné** un iPhone sous iOS 18 ou antérieur  
**Quand** je verse une photo  
**Alors** elle est gardée — aujourd'hui `h.createWritable` est `undefined` (livré dans Safari 26.0, septembre 2025) et l'appel lève un TypeError : photos.ts:100-105

**Étant donné** cet échec  
**Quand** il se produit  
**Alors** il emporte TOUT le chemin média — `verserPhoto`, `verserPhotoMachine`, `verserPhotoEquipement` et `verserDocument` (documents.ts:74, qui importe `ecrireLocale`) : pas d'album, pas de portrait de moto, pas de manuel d'atelier, pas de facture

**Étant donné** le message affiché  
**Quand** le versement échoue pour un défaut d'API  
**Alors** il ne dit pas « L'image n'a pas pu être préparée sur ce téléphone » (Photos.tsx:53) : il dit ce qui manque, ce qui est gardé et ce qui va se passer

**Étant donné** la sonde qui affirme « OPFS confirmé, persist() accordé » (Sonde.tsx:10)  
**Quand** elle rend son verdict  
**Alors** elle a réellement ÉCRIT un octet et l'a relu, pas seulement obtenu un répertoire — une sonde qui ne mesure pas ce qui casse est pire qu'aucune sonde

**Étant donné** un chemin de repli  
**Quand** il est écrit  
**Alors** aucune photo ne se perd en silence : soit elle est gardée, soit le pilote le sait tout de suite

**Étant donné** le banc  
**Quand** ce récit est déclaré fini  
**Alors** un essai exerce le versement sur un navigateur sans `createWritable` et échoue si le repli manque

> *Touche :* src/db/photos.ts, src/db/documents.ts, src/ecrans/Sonde.tsx, src/ecrans/Photos.tsx


### Récit 18.2 : L'album d'une journée

En tant que pilote, je veux revoir les photos d'un roulage en album, afin de retrouver ma journée plutôt qu'une bande de vignettes qui défile.

*Taille : moyen.*


**Critères d'acceptation**


**Étant donné** un roulage avec quinze photos  
**Quand** j'ouvre son album  
**Alors** c'est une grille, et un tap ouvre une photo en grand avec la navigation d'une photo à l'autre — aujourd'hui il n'y a qu'une bande horizontale (Photos.tsx:70-74) et aucune ouverture en grand

**Étant donné** le commentaire de systeme.css:503 qui a tranché la bande contre la grille (« au paddock on en verse une ou deux, pas vingt, et une grille à trous fait vide »)  
**Quand** la grille arrive  
**Alors** la décision est explicitement retournée et datée, pas contournée en silence — et elle ne tient que si 18.3 la précède

**Étant donné** `.vignette` déclaré DEUX FOIS au premier niveau de systeme.css — ligne 507 (`height:96px; width:auto`) et ligne 606 (`width:84px; height:84px; overflow:hidden`), la seconde gagnant par cascade  
**Quand** l'album hérite de la collision  
**Alors** la vignette a la taille que son commentaire annonce, ou la seconde règle est renommée : elle ne sert qu'aux pièces d'atelier (Poste.tsx)

**Étant donné** soixante photos de saison  
**Quand** je fais défiler l'album  
**Alors** l'onglet ne meurt pas : `charger()` (Photos.tsx:28) crée un `URL.createObjectURL` par photo et ne révoque l'ancien lot qu'au setState suivant — chargement paresseux, révocation à la sortie de vue

**Étant donné** une facture d'atelier versée sur le même roulage (genre `facture`, photos.ts:123, schema.ts:240-243)  
**Quand** l'album des clichés s'affiche  
**Alors** elle n'y est pas : « la photo MONTRE un état, la facture PROUVE une dépense »

**Étant donné** une photo que je ne veux plus  
**Quand** je la supprime  
**Alors** elle part seule, en rouge, sans emporter les autres — aujourd'hui seule `supprimerRoulage` les efface, en masse (depot.ts:323-345)

**Étant donné** l'album  
**Quand** je le regarde  
**Alors** rien n'est classé, noté, mis en avant ni élu « la meilleure » : il énonce ce qui a été pris

**Étant donné** le choix technique  
**Quand** on cherche une bibliothèque  
**Alors** on n'en prend aucune : PhotoSwipe (~45 Ko) et yet-another-react-lightbox (~30 Ko) apportent coins arrondis, flèches SF-Symbols et fondus, qu'il faudrait désécrire à coups de `!important` contre le pixel 16 bits — une grille `repeat(auto-fill, minmax(96px,1fr))` plus un plein écran font 40 lignes

> *Touche :* src/ecrans/Photos.tsx, src/db/photos.ts, src/styles/systeme.css, src/db/depot.ts


### Récit 18.3 : Verser plusieurs photos d'un coup

En tant que pilote, je veux choisir dix photos d'un seul geste, afin que l'album se remplisse au lieu de rester à trois vignettes.

*Taille : petit.*


**Critères d'acceptation**


**Étant donné** le sélecteur iOS  
**Quand** je choisis mes photos  
**Alors** je peux en prendre plusieurs — Photos.tsx:104 passe `e.target.files?.[0]` et l'input n'a pas l'attribut `multiple` : vingt photos, c'est vingt allers-retours, et l'album ne se remplira jamais

**Étant donné** dix photos choisies d'un coup  
**Quand** elles se versent  
**Alors** elles se versent EN SÉRIE : `reduire()` alloue un canevas de 1600 px, et dix en vol tuent l'onglet (photos.ts:54, « l'onglet meurt sans erreur rattrapable »)

**Étant donné** que la neuvième échoue  
**Quand** le versement s'arrête  
**Alors** les huit premières restent versées et le produit dit laquelle a manqué

**Étant donné** le versement en cours  
**Quand** il dure  
**Alors** ce qui est déjà versé s'affiche au fur et à mesure, et aucun compteur ne dit « 4 sur 10 »

> *Touche :* src/ecrans/Photos.tsx, src/db/photos.ts


### Récit 18.4 : Ce que le produit garde, dit une fois pour toutes

En tant que pilote, je veux savoir exactement ce qui quitte mon téléphone, afin de décider en connaissance de cause au lieu d'imaginer un cloud qui avale mes photos.

*Taille : petit.*


**Critères d'acceptation**


**Étant donné** la question de Julian (« on ne sauvegarde pas les photos dans notre cloud »)  
**Quand** le produit répond  
**Alors** il dit ce qu'il fait vraiment : une vignette de 1600 px en WebP q0,82, ~200 à 400 Ko, et l'original 48 Mpx en HEIC n'est jamais lu en entier, jamais téléversé, jamais touché (photos.ts:26, 63-86)

**Étant donné** qu'aucune API navigateur ne donne accès à la photothèque, n'y écrit un tag ni ne rouvre un fichier après rechargement  
**Quand** on cherche à « taguer les photos de l'appareil »  
**Alors** on ne stocke AUCUN pointeur : iOS ne rend pas de nom stable (une capture arrive en `image.jpg`), aucune API ne rouvre le fichier sans que l'utilisateur le repointe, et l'album afficherait des cases vides avec un bouton « retrouve-la toi-même »

**Étant donné** un pilote qui ne veut rien envoyer  
**Quand** il ouvre le compte  
**Alors** un réglage coupe l'envoi cloud et les photos restent visibles hors ligne — aujourd'hui il n'existe aucun réglage : dès qu'il y a un compte et du réseau, ça part (photos.ts:269-300, App.tsx:252-266)

**Étant donné** qu'on discute de couper le cloud  
**Quand** on tranche  
**Alors** le coût du stockage est chiffré quelque part : il n'est écrit nulle part dans le dépôt, et c'est ce chiffre qui devrait décider

**Étant donné** que le stockage devienne un jour le problème  
**Quand** on cherche le levier  
**Alors** c'est `COTE_LONG` et la qualité WebP — 1600/0,82 vers 1200/0,75 divise le poids par ~2,2 sans changer une ligne d'architecture — et jamais la pellicule

**Étant donné** la page légale (Legal.tsx)  
**Quand** elle décrit ce qui est envoyé  
**Alors** elle dit la vignette, pas « vos photos »

> *Touche :* src/db/photos.ts, src/ecrans/Compte.tsx, src/ecrans/Legal.tsx, src/App.tsx

## Épique 19 : L'argent — au mois comme à la saison

**Objectif.** Que le budget dise sa période, qu'une dépense porte sa date, qu'on la saisisse d'où on est, et que ce qu'on en montre reste un constat. Le budget n'est pas « faux » : il est ANNUEL et l'a toujours été (`budget_saison`, schema.ts:176-179, une ligne par année). Ce qui est faux, c'est que rien n'a empêché la lecture mensuelle — le libellé « Budget de la saison {annee} » (App.tsx:1258) est loin du champ, le placeholder dit « 0 », et rien ne réaffiche la période une fois le montant posé.

**La porte.** Une dépense existe et son montant est lu quelque part — ouverte depuis le premier jour. Ce qui est fermé, c'est le mois : `depense` n'a AUCUNE date (schema.ts:125-138), et `creerDepense` comme `depenserSur` ne gardent que l'année via `anneeSaison(d.date)` (depot.ts:419). Un total mensuel est aujourd'hui impossible à calculer sur les données existantes.

**Ce qu'elle refuse.** La tendance, la projection, le « à ce rythme », le reste-à-dépenser. Le verdict au dépassement — la jauge ne change pas de couleur en approchant du plafond, délibérément (systeme.css:453-455 : « dépasser son budget n'est pas une faute »). Deux chemins d'écriture qui produisent des lignes incompatibles. Une barre qui se remplit vers un plafond mensuel.

*4 récits · 23 critères · aucun tenu — rien n'est écrit.*


### Récit 19.1 : Le budget dit sa période, à la saisie et à la lecture

En tant que pilote, je veux voir la période à côté du chiffre que je tape et du chiffre que je relis, afin de ne plus saisir 500 en pensant « par mois ».

*Taille : petit.*


**Critères d'acceptation**


**Étant donné** le champ de budget  
**Quand** je tape 500  
**Alors** la période est écrite À CÔTÉ du champ — aujourd'hui elle est dans un `<label>` au-dessus et le placeholder dit « 0 » (App.tsx:1258-1266)

**Étant donné** 500 posés  
**Quand** le chiffre se relit plus tard  
**Alors** sa période est encore là, à l'écran des chiffres comme dans le bilan de saison (App.tsx:1245-1254, Saison.tsx:91-96)

**Étant donné** un consommé de 2180 € sur un budget de 500 €  
**Quand** la jauge s'affiche  
**Alors** le dépassement est dit en clair : la jauge est bornée à 100 % par `Math.min` (App.tsx:1253) et une barre pleine ne distingue pas 501 € de 2180 €

**Étant donné** ce dépassement  
**Quand** il s'affiche  
**Alors** rien ne devient rouge, rien ne dit « dépassé », rien ne reproche — systeme.css:453-455 est une décision écrite, et la lever demande une réponse de Julian, pas une initiative

**Étant donné** une réponse « c'était bien 6000 € pour l'année »  
**Quand** ce récit est fini  
**Alors** il n'a coûté aucune migration : c'est un libellé, et 19.2 reste indépendant

> *Touche :* src/App.tsx, src/ecrans/Saison.tsx, src/styles/systeme.css, src/db/depot.ts, src/db/schema.ts


### Récit 19.2 : Une dépense porte sa date

En tant que pilote, je veux savoir ce que j'ai dépensé en juillet, afin de suivre mon argent au mois et pas seulement à la saison.

*Taille : gros.*


**Critères d'acceptation**


**Étant donné** une dépense saisie le 12 septembre  
**Quand** je regarde septembre  
**Alors** elle y est — aujourd'hui `depense` n'a aucune date et les deux fonctions d'écriture jettent le jour et le mois (depot.ts:421-437, budget.ts:89-105)

**Étant donné** une dépense de cible `machine` ou `saison` — l'assurance, les pneus, la remorque  
**Quand** on cherche son mois  
**Alors** il existe : seules les dépenses de cible `roulage` pourraient être datées indirectement par `roulage.date_jour`, et tout le reste n'a aucun mois, ni stocké ni reconstituable

**Étant donné** les dépenses déjà saisies, qui resteront sans mois pour toujours  
**Quand** elles s'affichent  
**Alors** l'écran le DIT, exactement comme « Sans poste » le dit déjà (Budget.tsx:116-126) — la colonne `poste` a créé le même précédent et remonte à `null` plutôt que d'être rangée d'office (budget.ts:70-76)

**Étant donné** la nouvelle colonne  
**Quand** elle est ajoutée  
**Alors** elle l'est des deux côtés (SQLite + Postgres) et passe par `ORDRE`, `DEPENDANCES` et `DEFAUTS_SERVEUR` (sauvegarde.ts:52, 63, 197-215) — l'ordre d'envoi a déjà été faux quatre fois sur ce produit, deux fois découvert des jours plus tard

**Étant donné** cette colonne oubliée dans l'un des trois  
**Quand** le banc tourne  
**Alors** l'essai unitaire qui confronte la carte à `ORDRE` échoue

**Étant donné** les totaux mensuels  
**Quand** ils s'affichent  
**Alors** aucun mois ne se compare au précédent, aucun « + 40 % », aucune couleur sur un mois cher, aucun reste-à-dépenser

> *Touche :* src/db/schema.ts, src/db/depot.ts, src/db/budget.ts, src/db/sauvegarde.ts, supabase/migrations, banc-rendu/unite/essais.ts


### Récit 19.3 : Un seul chemin d'écriture, et le raccourci depuis l'accueil

En tant que pilote, je veux noter une dépense depuis l'accueil en un tap, afin de ne pas devoir ouvrir une journée pour dire que j'ai payé mes pneus.

*Taille : moyen.*


**Critères d'acceptation**


**Étant donné** les deux saisies existantes  
**Quand** chacune écrit une ligne  
**Alors** elles écrivent la même chose — aujourd'hui `Depense.tsx` est le seul à proposer la cible `roulage` (Depense.tsx:84-87) et appelle `creerDepense`, qui n'écrit JAMAIS de `poste` (depot.ts:429-431), tandis que `Budget.tsx` appelle `depenserSur`, qui écrit le poste mais ne propose que `machine` et `saison` (Budget.tsx:146, 166-173)

**Étant donné** la tâche dérivée « L'engagement », qui cherche `cible='roulage' AND poste='engagement'` (preparation.ts:126-127)  
**Quand** je paie mon engagement dans l'application  
**Alors** la tâche disparaît — aujourd'hui aucune saisie possible dans le produit ne peut produire cette ligne, donc elle ne disparaît jamais de la préparation

**Étant donné** l'accueil  
**Quand** je veux noter une dépense sans roulage ouvert  
**Alors** le raccourci y est en un tap, et n'exige ni journée ni machine — aujourd'hui l'écran `depense` n'est monté que si `courant && bilan` (App.tsx:399-403) et le seul chemin depuis l'accueil est conditionnel à un roulage à venir sans engagement saisi

**Étant donné** ce raccourci  
**Quand** il s'affiche  
**Alors** il ne réclame rien : aucun « tu n'as rien saisi ce mois-ci », aucune pastille, aucun rappel

**Étant donné** une dépense saisie par le raccourci  
**Quand** elle est écrite  
**Alors** elle porte son poste, sa cible et sa date : un raccourci qui produit une ligne incomplète recrée le défaut qu'on vient de corriger

> *Touche :* src/App.tsx, src/ecrans/Depense.tsx, src/ecrans/Budget.tsx, src/db/depot.ts, src/db/budget.ts, src/db/preparation.ts


### Récit 19.4 : Ce que l'argent a le droit de montrer

En tant que pilote, je veux voir où part mon argent, par poste et par mois, afin de comprendre ma saison sans qu'on me dise si j'ai bien fait.

*Taille : moyen.*


**Critères d'acceptation**


**Étant donné** les huit postes déjà calculés par `parPoste` (budget.ts:77-85)  
**Quand** ils s'affichent  
**Alors** c'est un tracé lisible et non une liste de texte repliée derrière un tap (Budget.tsx:60-111)

**Étant donné** les mois de la saison  
**Quand** ils s'affichent  
**Alors** chaque mois porte son total et la part de chaque poste — et ce récit ne peut pas commencer avant 19.2 : la donnée n'existe pas

**Étant donné** le graphe  
**Quand** je le regarde  
**Alors** il ne porte aucune droite de tendance, aucune projection, aucun « à ce rythme », aucune cible — la règle du chrono (epics.md:1815-1834, « une fiction qui fixe un objectif que personne n'a choisi ») s'applique telle quelle à l'argent, ou Julian la lève explicitement

**Étant donné** un mois plus cher que le précédent  
**Quand** il s'affiche  
**Alors** rien ne le colore, rien ne le compare, rien ne le juge : un graphe de coût qui monte est très près d'un verdict

**Étant donné** le tracé  
**Quand** on cherche la bibliothèque qui le dessine  
**Alors** il n'y en a aucune : `Courbe.tsx:46` est un `<svg>` écrit à la main en `crispEdges`, package.json n'a aucune dépendance d'UI, et NFR-4 interdit tout CDN

**Étant donné** la maquette  
**Quand** elle propose une jauge pour l'argent  
**Alors** elle est refusée : le portefeuille énonce, une jauge jugerait

⚠ « Plein d'analytiques intéressantes » n'est pas énumérable en l'état —
**Étant donné** qu'aucune liste n'existe  
**Quand** on cadre ce récit  
**Alors** la liste vient de Julian d'abord, sinon il n'y a rien à mettre en échec et le récit ne vaut rien

> *Touche :* src/ecrans/Budget.tsx, src/ecrans/Courbe.tsx, src/db/budget.ts, src/db/bilan.ts, src/ecrans/Saison.tsx

## Épique 20 : Le produit a une figure — l'ouverture et les icônes

**Objectif.** Qu'on reconnaisse MyPaddock à la première seconde, et qu'un écran d'atelier se lise sans se lire. Aujourd'hui le produit s'ouvre sur deux mots gris de 12 px (App.tsx:289, `.libelle` en --encre-faible, systeme.css:119) sur une page qui n'est même pas peinte, et son écran le plus dense — Entretien / Amélioration / Bricoles — ne se distingue que par un liseré gauche de 3 px (systeme.css:222-225). La chaîne pixel existe et n'est jamais mobilisée à ces deux endroits.

**La porte.** Deux conditions observables, et elles n'ouvrent pas les mêmes récits. ① L'ouverture : au tout premier repaint, le fond est peint — fermée aujourd'hui, index.html:22-24 ne sert qu'un `<div id="root">` vide et le fond --nuit n'arrive qu'avec le bundle (main.tsx:3). ② Les icônes : un écran porte au moins deux entrées de même forme qu'il faut distinguer — ouverte, l'atelier en a trois depuis l'épique 8.

**Ce qu'elle refuse.** L'emoji — rendu par la police du système, doré sur iOS, plat sur Android, absent d'un WebView pauvre (Trophee.tsx ①). Une icône à la place d'un fait mesuré — la courbe du chrono est tracée, elle ne s'illustre pas. Une pastille qui relance sur ce qui attend (FR-48). Une bibliothèque qui apporte son propre langage visuel, ou une fonte d'icônes de 53 Ko pour 1029 glyphes inutilisés alors que NFR-4 interdit tout CDN. La couleur seule pour porter le sens (UX-DR8).

*4 récits · 25 critères · aucun tenu — rien n'est écrit.*


### Récit 20.1 : L'écran de chargement, peint avant React

En tant que pilote qui ouvre l'application, je veux voir tout de suite quelque chose qui ressemble au produit, afin de ne pas croire qu'il est cassé pendant que le worker OPFS démarre.

*Taille : petit.*


**Critères d'acceptation**


**Étant donné** le tout premier repaint, avant que le bundle soit exécuté  
**Quand** la page s'affiche  
**Alors** le fond --nuit est déjà là et rien n'est blanc — aujourd'hui index.html:22-24 ne sert qu'un `<div id="root">` vide et le décor `.sol` (systeme.css:73-84) arrive avec le bundle

**Étant donné** un téléphone lent où SQLite passe par un worker OPFS  
**Quand** j'attends  
**Alors** ce que je vois est dans le thème, en pixels, et pas « chargement… » en 12 px gris (App.tsx:289)

**Étant donné** un ordinateur où tout est prêt en 80 ms  
**Quand** la page s'ouvre  
**Alors** l'écran de chargement ne rallonge pas l'ouverture — sauf si Julian accepte une durée minimale garantie, auquel cas le chiffre est écrit dans le code avec son motif

**Étant donné** `prefers-reduced-motion` actif  
**Quand** l'écran s'affiche  
**Alors** l'animation ne joue pas et le fond reste (UX-DR8, UX-DR11)

**Étant donné** un échec d'ouverture — OPFS refusé, worker interdit, stockage plein  
**Quand** il survient  
**Alors** on tombe sur l'écran de PANNE, qui existe déjà et qui est soigné (App.tsx:272-287), et jamais sur un chargement éternel

⚠ CONTRADICTION AVEC UNE RÈGLE ÉCRITE —
**Étant donné** UX-DR10 (epics.md:161) et EXPERIENCE.md:212 (« Chargement — il n'y en a pas au noyau ; tout est local, un indicateur de chargement au paddock est un aveu »)  
**Quand** on ajoute un écran d'ouverture  
**Alors** la règle est relue et datée : un décor peint n'est pas un spinner, mais la distinction doit être écrite, pas supposée

**Étant donné** le prompt Claude Design demandé par Julian  
**Quand** on le cherche dans le dépôt  
**Alors** il existe, et il nomme la grille (GRILLE=128), le plafond de couleurs (COULEURS_MAX=26) et la palette du produit — pixel/reglages.ts, pixel/spritifier.ts, sprite-cbr83.ts

**Étant donné** cet écran  
**Quand** il s'affiche  
**Alors** il ne porte ni pourcentage, ni barre qui se remplit, ni « préparation de vos données » : il occupe, il ne mesure pas

> *Touche :* index.html, src/App.tsx, src/main.tsx, src/styles/systeme.css, src/pixel/reglages.ts, src/pixel/spritifier.ts


### Récit 20.2 : Un seul jeu d'icônes, une seule grille

En tant que pilote, je veux des icônes qui appartiennent au même dessin que le reste, afin que l'application n'ait pas l'air d'un assemblage.

*Taille : moyen.*


**Critères d'acceptation**


**Étant donné** une icône du produit  
**Quand** elle s'affiche  
**Alors** c'est un tracé SVG en `currentColor`, jamais un emoji — la convention est déjà écrite et argumentée dans Trophee.tsx ①

**Étant donné** Trophee.tsx en `stroke` de 1,8 sur 24×24 et les tracés pixelarticons en `fill` sur une grille de 12×12  
**Quand** les deux cohabitent à l'écran  
**Alors** ils sont sur la MÊME grille : deux registres côte à côte se voient, et convertir Trophee suppose de maîtriser les tracés, donc de les avoir chez soi

**Étant donné** les sept tracés utiles (trash, pencil, calendar, camera, wallet, chart-line, tools)  
**Quand** on choisit la forme d'embarquement  
**Alors** ce sont ~1,2 Ko d'attributs `d` copiés dans un module maison — pas `npm install pixelarticons`, pas une fonte d'icônes (25,7 Ko woff2 + 27,5 Ko CSS pour 1029 glyphes inutilisés, à embarquer en data URI dans un fontes.css qui fait déjà 100 Ko)

**Étant donné** la licence MIT de pixelarticons  
**Quand** un tracé est copié dans un dépôt PUBLIC  
**Alors** la mention « Copyright (c) 2019 Gerrit Halfmann » est présente, en en-tête de module ou dans un LICENCES.md

**Étant donné** qu'aucun jeu d'icônes pixel sous licence permissive ne contient de casque, de combinaison ni de moto — vérifié sur les 4600 de pixelarticons y compris le jeu Pro, et sur les 579 de HackerNoon  
**Quand** ces trois-là sont dessinés à la main  
**Alors** ils le sont sur la même grille 12×12 en `fill`, et pas empruntés à game-icons.net dont le motorcycle-helmet est une silhouette à 22 commandes de Bézier

**Étant donné** qu'un sprite existe pour cette moto ou cet équipement (portrait.ts, sprite-cbr83.ts)  
**Quand** l'écran se rend  
**Alors** c'est le sprite qui s'affiche et jamais l'icône : celle-ci n'est qu'un état vide, une amorce sourde, et si elle est jolie elle concurrence le sprite

**Étant donné** `public/icons.svg` — reliquat du gabarit Vite (bluesky, discord, github, x), référencé nulle part  
**Quand** ce récit est fini  
**Alors** il n'est plus dans le dépôt

> *Touche :* src/ecrans/Trophee.tsx, public/icons.svg, package.json, src/pixel/portrait.ts, src/assets/sprite-cbr83.ts


### Récit 20.3 : L'atelier sous la clé à molette

En tant que pilote, je veux reconnaître d'un coup d'œil ce qui entretient et ce qui améliore, afin que l'atelier cesse d'être trois boutons de texte qu'il faut lire pour distinguer.

*Taille : moyen.*


**Critères d'acceptation**


**Étant donné** l'atelier  
**Quand** je l'ouvre  
**Alors** chaque entrée porte son tracé : la clé pour ce qui entretient, la courbe pour ce qui améliore — aujourd'hui Atelier.tsx:28-40 rend trois boutons pleine largeur avec un titre, un sous-titre et un décompte, rien d'autre

**Étant donné** FR-46, qui est une clause de SÉCURITÉ et non de rangement (atelier.ts:9-18 : « si plaquettes en fin de vie s'affiche à côté de sticker décollé, l'élément de sécurité hérite du caractère repoussable du cosmétique »)  
**Quand** entretien et bricoles passent sous une même icône  
**Alors** les trois listes restent séparées à l'ouverture et aucun écran n'en assemble deux — regrouper sous une icône commune est la première marche, et Julian doit dire que le mur tient

**Étant donné** le seul repère visuel actuel, un liseré de 3 px porté par la couleur (systeme.css:222-225, 592-594)  
**Quand** l'icône arrive  
**Alors** la couleur n'est jamais seule à porter le sens (UX-DR8) : le tracé et le mot restent

**Étant donné** ce qui attend au garage  
**Quand** il s'affiche  
**Alors** aucune pastille, aucun compte à rebours, aucun rouge, aucune échéance — FR-48, et Atelier.tsx le tient déjà : ce qui attend attend, c'est précisément son intérêt

⚠ « ATELIER » N'EST PAS UNE CATÉGORIE —
**Étant donné** qu'« atelier » est aujourd'hui le NOM DU GROUPE des trois (Atelier.tsx:33) et non une quatrième entrée  
**Quand** Julian le place « en sous-partie de la molette » au même rang qu'entretien et bricoles  
**Alors** ce qu'il désigne est à trancher avant d'écrire quoi que ce soit : le carnet daté ? la page d'une catégorie ? un mot à supprimer ?

**Étant donné** une icône choisie pour l'argent  
**Quand** elle est posée  
**Alors** ce n'est pas `chart` : le portefeuille énonce, une jauge ou une courbe de croissance jugerait

> *Touche :* src/ecrans/Atelier.tsx, src/db/atelier.ts, src/styles/systeme.css


### Récit 20.4 : L'équipement porte un casque

En tant que pilote, je veux que mon équipement se reconnaisse à sa figure, afin de le distinguer de ma moto sans lire le titre.

*Taille : petit.*


**Critères d'acceptation**


**Étant donné** l'équipement sans sprite  
**Quand** il s'affiche  
**Alors** un casque ou une combinaison en tracé maison tient sa place — budget.ts:126 range déjà casque, combinaison, dorsale, gants et bottes sous protection

**Étant donné** un équipement dont le sprite existe  
**Quand** l'écran se rend  
**Alors** c'est le sprite qui s'affiche : portrait.ts porte la phrase de Julian en commentaire — « la combinaison c'est comme un skin, et le casque aussi, c'est à pixeliser » — et le type `Sujet` accepte déjà un `equipementId`

**Étant donné** une combinaison rendue à 12×12  
**Quand** elle ne se distingue pas d'un bonhomme  
**Alors** on y renonce et le libellé texte suffit : le produit privilégie déjà le mot partout

**Étant donné** cette icône  
**Quand** elle s'affiche  
**Alors** elle ne porte aucune échéance, aucun âge, aucun compteur — un compteur qui monte sur un équipement de protection est un compte à rebours déguisé (Budget.tsx:186-195), et le schéma n'a délibérément aucune colonne d'échéance

> *Touche :* src/ecrans/Budget.tsx, src/pixel/portrait.ts, src/db/budget.ts

## Épique 21 : Les mots, le rouge, et ce qui se dit deux fois

**Objectif.** Que chaque bouton dise ce qu'il fait, qu'un geste irréversible se voie avant d'être fait, et qu'aucune phrase ne s'écrive deux fois. Ce sont quatre corrections que rien ne relie techniquement et que tout relie du point de vue de Julian : il ouvre l'application, il lit, et le produit lui dit trois mots pour la même chose, un bouton qui ne sert à rien, et un effacement qui n'a pas de couleur.

**La porte.** Ouverte, sans condition. Aucune de ces corrections n'attend une donnée, une migration, un réseau ni une réponse — c'est la seule épique des six qui peut être finie en une passe, et 21.3 doit exister AVANT l'épique 22.

**Ce qu'elle refuse.** Un mot pour deux choses. Le rouge décoratif — il ne sert nulle part ailleurs que sur le destructif. Une confirmation qui disparaît sous prétexte que la couleur suffirait : la couleur n'est jamais seule (UX-DR8). Renommer une table parce qu'un libellé change.

*4 récits · 21 critères · aucun tenu — rien n'est écrit.*


### Récit 21.1 : « Modifier la moto », et le vocabulaire d'un seul écran

En tant que pilote, je veux que le garage m'appelle ma moto une moto, afin de ne pas lire deux mots pour le même objet à trois lignes d'écart.

*Taille : libelle.*


**Critères d'acceptation**


**Étant donné** le bouton de Garage.tsx:244-246  
**Quand** la machine porte une année  
**Alors** il dit « Modifier la moto » — et ses DEUX autres états suivent : le bouton porte trois libellés selon l'état, « Annuler la correction » et « Ajouter l'année », pas un seul

**Étant donné** le formulaire ouvert  
**Quand** je valide  
**Alors** le bouton ne dit plus « Corriger » ni « Déclarer ma machine » (Garage.tsx:496)

**Étant donné** l'écran du garage  
**Quand** je le lis de haut en bas  
**Alors** il ne dit pas « moto » ici et « machine » trois lignes plus bas — « Aucune machine » (Garage.tsx:156), « X machine(s) · équipement › » (Garage.tsx:213), le sélecteur « Machine » du nouveau roulage (App.tsx:1042), face à « SUR LA MOTO » (Budget.tsx:169) et « Photographier la moto » (Garage.tsx:379) : le vocabulaire est déjà mixte, et corriger un seul bouton aggrave le mélange

**Étant donné** la table `machine` (schema.ts:33) et le type `Machine` (depot.ts:19)  
**Quand** le libellé change  
**Alors** le schéma ne bouge pas : ce qui ne se lit pas ne se renomme pas

**Étant donné** le banc de fumée  
**Quand** ce récit est fini  
**Alors** un essai échoue si le mot « machine » réapparaît dans un libellé d'écran

> *Touche :* src/ecrans/Garage.tsx, src/App.tsx, src/ecrans/Budget.tsx, banc-rendu/fumee-machine.mjs


### Récit 21.2 : « Refaire le portrait pixel », et ce qu'il consomme

En tant que pilote, je veux pouvoir refaire un portrait raté depuis l'endroit où je modifie ma moto, afin de ne pas devoir l'effacer d'abord pour avoir le droit de recommencer.

*Taille : petit.*


**Critères d'acceptation**


**Étant donné** une machine avec un sprite  
**Quand** j'ouvre le garage  
**Alors** il y a UN bouton, « Refaire le portrait pixel » — les deux boutons actuels s'excluent l'un l'autre : le retrait n'est visible que si `machine.sprite` (Garage.tsx:386-392) et la fabrication que si `machine.photo_chemin && !machine.sprite` (Garage.tsx:381-385), donc refaire est aujourd'hui impossible sans effacer d'abord

**Étant donné** ce bouton  
**Quand** il est posé  
**Alors** il est à côté de « Modifier la moto » (Garage.tsx:244, dans `.garage-titre`), et non sous la scène et sous les trois chiffres

**Étant donné** qu'une fabrication coûte de l'argent réel — la fonction serveur, le registre `generation` avec `cout_centimes` et son quota (schema.ts:296-307), ≈ 0,16 € par portrait (A-FAIRE §1) — et qu'aucune confirmation n'existe aujourd'hui  
**Quand** je tape « Refaire »  
**Alors** le produit dit ce que ça consomme AVANT d'appeler : un bouton nommé « Refaire », posé en haut d'écran, transforme un tap accidentel en dépense

**Étant donné** le portrait précédent  
**Quand** la nouvelle fabrication est en cours ou refusée  
**Alors** il n'est pas perdu : rien n'a changé tant que le nouveau n'est pas gardé, comme le fait déjà l'équipement (Budget.tsx:365-372)

**Étant donné** « Retirer le portrait pixel »  
**Quand** ce récit est fini  
**Alors** il n'existe plus : retirer n'a aucun intérêt, Julian l'a dit

**Étant donné** le même couple sur l'équipement (Budget.tsx:378-388, « Retirer le portrait »)  
**Quand** la règle change sur la moto  
**Alors** elle change aussi là, ou la différence est écrite et assumée

> *Touche :* src/ecrans/Garage.tsx, src/ecrans/Budget.tsx, src/db/depot.ts, src/pixel/portrait.ts, src/db/schema.ts


### Récit 21.3 : Le rouge du destructif, partout et sans exception

En tant que pilote, je veux voir au premier coup d'œil ce qui détruit, afin de ne pas taper « retirer » en croyant fermer un panneau.

*Taille : petit.*


**Critères d'acceptation**


**Étant donné** n'importe quel geste qui détruit — retirer une journée, une horloge, une ligne de liste, une photo, un équipement, une chute, un compte  
**Quand** il s'affiche  
**Alors** il est en rouge, fond ou texte

**Étant donné** le jeton `--alerte` déjà présent (systeme.css:46) et la classe `.alerte` (systeme.css:282)  
**Quand** le rouge arrive  
**Alors** il vient de ce jeton, jamais d'une valeur écrite à la main

**Étant donné** UX-DR8 (« la couleur n'est jamais seule »)  
**Quand** un bouton devient rouge  
**Alors** le mot dit encore ce qui part, et la confirmation en deux taps ne disparaît pas au motif que la couleur suffirait

**Étant donné** les onze endroits recensés — Checklist.tsx:87, Chute.tsx:150 et 161, Budget.tsx:386 et 390, Compte.tsx:163 et 179, Usure.tsx:93, Preparation.tsx:99, Poste.tsx:300, App.tsx:942 et 949  
**Quand** l'un d'eux est oublié  
**Alors** un essai de fumée le voit et échoue

**Étant donné** tout le reste du produit  
**Quand** on cherche du rouge  
**Alors** il n'y en a pas : ni sur un dépassement de budget (systeme.css:453-455), ni sur une horloge au-delà de son intervalle, ni sur une pastille de ce qui attend (FR-48) — un rouge qui sert à deux choses ne sert plus à rien

**Étant donné** `.bouton.secondaire` (systeme.css:148), utilisé aujourd'hui aussi bien pour « Retirer définitivement » que pour « Ajouter à entretien »  
**Quand** ce récit est fini  
**Alors** le destructif a sa propre forme et ne se confond plus avec le secondaire

> *Touche :* src/styles/systeme.css, src/App.tsx, src/ecrans/Compte.tsx, src/ecrans/Chute.tsx, src/ecrans/Usure.tsx, src/ecrans/Poste.tsx, src/ecrans/Preparation.tsx, src/ecrans/Checklist.tsx, banc-rendu/fumee-confirmation.mjs


### Récit 21.4 : Effacer mon compte ne s'écrit qu'une fois

En tant que pilote, je veux lire une seule fois le nom du geste qui efface mon compte, afin de ne pas croire qu'il y en a deux.

*Taille : libelle.*


**Critères d'acceptation**


**Étant donné** l'écran du compte  
**Quand** j'arrive sur la section d'effacement  
**Alors** « effacer mon compte » n'apparaît qu'UNE fois — Compte.tsx:161 le pose en libellé et Compte.tsx:163 le repose en bouton, deux lignes plus bas

**Étant donné** ce qui reste  
**Quand** je le lis  
**Alors** c'est le bouton qui porte le mot, parce que c'est lui qui agit

**Étant donné** Legal.tsx:101, qui cite « Effacer mon compte » en gras pour désigner ce bouton  
**Quand** le libellé change  
**Alors** la citation dit encore le nom exact du bouton

**Étant donné** la confirmation ouverte  
**Quand** elle énumère ce qui part  
**Alors** elle ne répète pas non plus le titre : « ce qui part, et ne revient pas » suffit, et le bouton final dit « Effacer définitivement »

> *Touche :* src/ecrans/Compte.tsx, src/ecrans/Legal.tsx, banc-rendu/fumee-legal.mjs

## Épique 22 : Le geste sur une journée, et le témoin de sauvegarde

**Objectif.** Pouvoir corriger ou retirer une journée d'un geste, et savoir que ce qu'on saisit est gardé. Les deux demandes n'ont l'air d'avoir aucun rapport et elles ont le même fond : Julian ne fait pas confiance à ce que l'application a fait de sa saisie. Il a de bonnes raisons — il a eu 25 roulages pour 5 saisis (App.tsx:878-882), et le produit ne lui a jamais dit qu'une écriture était partie.

**La porte.** Une liste de roulages contient au moins une journée qu'il faut corriger ou retirer. Porte franchie, et c'est Julian qui l'a franchie pour nous.

**Ce qu'elle refuse.** Un balayage qui détruit — EXPERIENCE.md:202-203 l'écrit nommément sur la carte de roulage. Un geste caché comme seul chemin (EXPERIENCE.md:46). Un témoin qui devient une alarme. Un indicateur qui signale l'absence de réseau — au paddock, hors ligne, rien ne change (EXPERIENCE.md:214, NFR-7).

*3 récits · 21 critères · aucun tenu — rien n'est écrit.*


### Récit 22.1 : Modifier un roulage — l'écran qui n'existe pas

En tant que pilote, je veux corriger la date ou le circuit d'une journée mal saisie, afin de ne pas devoir la supprimer et tout ressaisir.

*Taille : moyen.*


**Critères d'acceptation**


**Étant donné** une journée saisie avec le mauvais circuit ou la mauvaise date  
**Quand** je veux la corriger  
**Alors** il existe un écran pour ça — aujourd'hui il n'y en a AUCUN : la seule écriture sur `roulage` hors création est `chrono_visible` (cercle.ts:149) et deux normalisations d'ouverture (depot.ts:524-544). La languette « modifier » de R9 ouvrirait le vide

**Étant donné** une journée modifiée  
**Quand** elle est enregistrée  
**Alors** ce qu'elle porte ne bouge pas : sessions, tours, photos, gestes, dépenses, checklist

**Étant donné** une date changée d'une journée vécue vers une date à venir, ou l'inverse  
**Quand** elle est enregistrée  
**Alors** les compteurs de l'épique 17 la recomptent correctement — ce récit dépend du prédicat partagé du récit 17.1

**Étant donné** le circuit changé  
**Quand** il est enregistré  
**Alors** le rattachement au référentiel se refait côté serveur comme à la création (migration 20260825000003), et la conformité déjà recopiée ne se réécrit pas en silence

**Étant donné** cet écran  
**Quand** j'y entre par erreur et j'en sors  
**Alors** rien n'a changé

**Étant donné** une journée en cours de modification  
**Quand** je tape deux fois  
**Alors** une seule écriture part (useGeste, geste.ts) — c'est exactement le défaut qui a produit 25 roulages pour 5

> *Touche :* src/App.tsx, src/db/depot.ts, src/ecrans/geste.ts, src/db/cercle.ts


### Récit 22.2 : Le glissement révèle, il ne détruit pas

En tant que pilote, je veux glisser une ligne de roulage pour faire apparaître « modifier » et « supprimer », afin de nettoyer vite une liste que l'application a salie.

*Taille : moyen.*


**Critères d'acceptation**


⚠ CONTRADICTION ÉCRITE, NOMMÉMENT SUR CET ÉLÉMENT —
**Étant donné** EXPERIENCE.md:202-203 (« Aucun balayage n'y supprime quoi que ce soit — avec des gants, un balayage destructeur se déclenche seul »), qui parle de `card.roulage`  
**Quand** Julian demande l'inverse  
**Alors** la règle se lève par une décision datée comme celle du 18 août, pas par oubli — et la forme qui la respecterait est le glissement qui RÉVÈLE sans détruire

**Étant donné** une ligne de roulage  
**Quand** je glisse de droite à gauche  
**Alors** deux languettes apparaissent, « modifier » et « supprimer », et RIEN n'est encore fait

**Étant donné** la languette « supprimer »  
**Quand** je la tape  
**Alors** la phrase qui nomme ce qui part est toujours là (App.tsx:914-928 : « Cette journée part définitivement, avec 2 sessions chronométrées, 4 photos et 1 dépense — 180 € ») : le glissement remplace le premier tap, jamais la confirmation

**Étant donné** un doigt ganté  
**Quand** je fais défiler la liste verticalement  
**Alors** aucune languette ne s'ouvre par accident — `touch-action: pan-y` et un seuil, et jamais de suppression en un seul geste

**Étant donné** un clavier  
**Quand** je navigue dans la liste  
**Alors** les deux actions sont atteignables sans glisser : EXPERIENCE.md:46 interdit tout geste caché comme seul chemin

**Étant donné** une languette affichée  
**Quand** je la vise  
**Alors** elle fait au moins 56 px (NFR-8) et la destructive est en rouge (récit 21.3)

**Étant donné** le choix de la bibliothèque  
**Quand** on cherche  
**Alors** on n'en prend aucune : react-swipeable-list est la seule qui fasse vraiment des languettes et son bundle ESM ne contient AUCUNE occurrence de `aria-`, `role`, `tabindex` ni `onkeydown`, ne déclare ni dependencies ni peerDependencies alors qu'il importe `prop-types` (donc ne résout pas en pnpm strict), et n'a pas publié depuis octobre 2024 ; @dnd-kit est 1,07 Mo de tri, vaul traîne 15 sous-paquets Radix, et react-swipeable n'est qu'un détecteur de geste. Pointer Events + `touch-action: pan-y`, dans un hook posé à côté de geste.ts

**Étant donné** un tap simple sur la ligne  
**Quand** la languette n'est pas ouverte  
**Alors** il ouvre la journée, comme aujourd'hui

> *Touche :* src/App.tsx, src/ecrans/geste.ts, src/styles/systeme.css, _bmad-output/planning-artifacts/ux-designs/ux-MyPaddock-2026-08-18/EXPERIENCE.md


### Récit 22.3 : Le témoin de sauvegarde

En tant que pilote, je veux un signe que ce que je viens de saisir est gardé, afin de cesser de me demander si l'application a fait quelque chose.

*Taille : petit.*


**Critères d'acceptation**


**Étant donné** une saisie quelconque  
**Quand** elle est écrite  
**Alors** je le vois — aujourd'hui rien ne le dit hors de l'écran du compte, où « Changements en attente » vit seul (Compte.tsx:499)

**Étant donné** la toute première sauvegarde, qui part maintenant d'elle-même (App.tsx:186-240)  
**Quand** elle aboutit  
**Alors** elle se dit une fois, en clair, et ne se redit plus

**Étant donné** le paddock sans réseau  
**Quand** je saisis  
**Alors** rien ne signale l'absence de réseau : aucun bandeau, aucune icône barrée, aucune dégradation visible (EXPERIENCE.md:214, NFR-7)

**Étant donné** un témoin qui tourne  
**Quand** une écriture n'est pas encore partie  
**Alors** il ne devient jamais une alarme ni un reproche : ce qui n'est pas parti n'est pas perdu, et le produit le dit ainsi

⚠ CONTRADICTION AVEC DEUX LIGNES DE LA MÊME TABLE —
**Étant donné** EXPERIENCE.md:212 (« Chargement — il n'y en a pas au noyau ; un indicateur de chargement au paddock est un aveu ») et EXPERIENCE.md:216 (« Synchronisation en attente — un liseré discret sur la carte concernée, jamais une modale, jamais un blocage »)  
**Quand** Julian demande un rond qui tourne  
**Alors** la forme déjà décidée est le LISERÉ, et le rond demande de lever la règle : c'est à lui de le dire

**Étant donné** le liseré  
**Quand** il s'affiche  
**Alors** il est sur la carte concernée et pas en haut de l'écran : un témoin global dit « l'application travaille », un liseré dit « cette chose-là n'est pas encore partie »

**Étant donné** `prefers-reduced-motion`  
**Quand** il est actif  
**Alors** rien ne tourne (UX-DR11)

> *Touche :* src/App.tsx, src/ecrans/Compte.tsx, src/db/sauvegarde.ts, src/styles/systeme.css, _bmad-output/planning-artifacts/ux-designs/ux-MyPaddock-2026-08-18/EXPERIENCE.md


## Où en est chaque récit — 26 août 2026

Julian : *« oui fais tout dans cet ordre, push commit et dis-moi quand je peux aller
sur l'app à nouveau ».* L'ordre d'attaque ci-dessous a été suivi de bout en bout.
Ce qui suit est ce que le code fait, pas ce qui était prévu.

### Épique 17 — le roulage à venir

| Récit | État | Ce qui a réellement changé |
|---|---|---|
| 17.1 | **fait** | Le prédicat partagé (`src/db/vecu.ts`). Une journée annoncée cesse d'être comptée comme vécue. |
| 17.2 | **fait** | Le tap ouvre `Journee.tsx`, pas le bilan. Les six portes du jour même y sont, en second rang. |
| 17.3 | **fait** | Le socle de huit postes, posé sur SA moto, **tous sans intervalle**. Et les deux erreurs qui se compensaient exactement — `count(*)` brut contre coefficients pondérés, `n > i` contre `pondérés >= i` — partent ensemble : il n'y a plus de second calcul du tout. FR-40 entre avec elles, par le type. |
| 17.4 | **fait** | Les règles publiées qui redescendent APRÈS la composition ne sont plus perdues, et aucune coche ne bouge. Deux absences, deux phrases. Le rapprochement des tâches tombe l'article de tête. |
| 17.5 | **fait** | Cinquième catégorie `objectif`. Trois règles écrites levées, contrepartie tenue en pied d'application. Rien ne se coche, rien ne remonte sur la courbe. |

**Le chaînon du manuel — fait.** C'est ce que Julian avait nommé, et il manquait
entièrement : le PDF était rapatrié et personne ne le LISAIT. La fonction `manuel`
(v4) le lit maintenant par URL signée et en tire les postes d'entretien de SA moto,
avec leur périodicité **transcrite, jamais convertie** — `intervalle_roulages` reste
nul, l'horloge compte sans jamais échoir, et l'écran dit lui-même que les kilomètres
du manuel et les roulages du compteur ne se parlent pas (FR-44).

### Épique 18 — les photos

| Récit | État | Ce qui a réellement changé |
|---|---|---|
| 18.1 | **fait** | `src/db/coffre.ts`, deux magasins. `createWritable` n'existe pas avant Safari 26. |
| 18.2 | **fait** | L'album est une grille, le plein écran existe, une photo part SEULE. La décision d'origine — « une grille à trous fait vide » — est retournée par écrit, là où elle était écrite. |
| 18.3 | **fait** | `multiple`, versement EN SÉRIE, échec par échec nommé. La bande était la bonne forme pour un défaut. |
| 18.4 | **fait** | L'envoi se coupe, et couper ne casse rien. La page légale dit la vignette. Le volume est chiffré : mille photos font ~300 Mo. |

### Épique 19 — l'argent

| Récit | État | Ce qui a réellement changé |
|---|---|---|
| 19.1 | **fait** | La période voyage avec le chiffre, à la saisie comme à la lecture. |
| 19.2 | **fait** | La dépense porte son JOUR. Le jour est celui du PAIEMENT ; la journée reste sa cible. |
| 19.3 | **fait** | Les deux chemins d'écriture écrivent les mêmes colonnes — un essai les compare INSERT contre INSERT. |
| 19.4 | **fait** | Par poste et par mois, en longueurs. L'échelle est le plus gros poste, **jamais le plafond** : c'est ce qui sépare un tracé d'une jauge. |

### Épique 20 — la figure

| Récit | État | Ce qui a réellement changé |
|---|---|---|
| 20.1 | **fait** | L'écran de chargement, peint avant React, durée minimale garantie. |
| 20.2 | **fait** | Onze tracés en aplats sur 12 × 12, dessinés en ASCII dans la source. Rien n'est emprunté, donc rien n'est à créditer. Le trophée quitte son trait fin et les rejoint. `public/icons.svg` est parti. |
| 20.3 | **fait** | La clé, la courbe, la caisse. Un repère, jamais un regroupement : le mur de FR-46 tient, et un essai refuse que deux catégories partagent une forme. |
| 20.4 | **fait** | Le casque, en QUATRIÈME état : le sprite gagne toujours. La combinaison a été tentée et abandonnée — à 12 × 12 elle ne se distingue pas d'un bonhomme. |

### Épique 21 — les mots, le rouge, le doublon · **entièrement faite**

### Épique 22 — le geste sur une journée

| Récit | État | Ce qui a réellement changé |
|---|---|---|
| 22.1 | **fait** | L'écran de modification existe. Il ne touche rien de ce que la journée porte, et il le DIT. `circuit_id` repart à nul quand le nom change. |
| 22.2 | **fait** | Le glissement RÉVÈLE. La règle du 18 août est levée par écrit, et l'objection qui la fondait est respectée : rien au relâchement du doigt, la confirmation reste le dernier mot, et les languettes sont atteignables au clavier. |
| 22.3 | **fait** | Un LISERÉ sur la carte concernée — la forme était déjà décidée par l'épine (216), et elle répond à la demande sans qu'il faille lever la 212. Il s'allume APRÈS l'écriture. |

### Ce qui reste ouvert

- **Épique 14** : pas de plafond de membres d'un cercle, pas de renouvellement de
  code, pas de moyen d'en retirer un. `anon` garde ses droits DML par défaut sur
  les tables de pilote.
- **`sePrepare` ne bascule jamais sur l'argent**, et c'est une déviation
  DÉCLARÉE : la liste envoie elle-même payer, et compter cette dépense comme une
  trace de vécu ferait disparaître la liste à l'instant où l'on suit sa propre
  consigne.
- **Les analytiques au-delà de « par poste » et « par mois »** attendent la liste
  de Julian : sans liste, il n'y a rien à mettre en échec.

### Trois collisions de sélecteurs CSS, trouvées en deux jours

Aucune ne produisait d'erreur de type ni d'écran cassé — elles produisaient un
écran *presque* juste, et on cherchait ailleurs.

- **`.vignette`** — déclarée pour les photos du roulage (96 px de haut) ET pour
  les pièces d'atelier (84 × 84, rognées). La seconde gagnait par cascade : les
  photos n'avaient pas la taille que leur commentaire annonçait.
- **`.barre`** — c'est la barre de NAVIGATION du bas, en `position: fixed;
  bottom: 0`. Le tracé de l'argent allait la reprendre et plaquer chacune de ses
  barres par-dessus la navigation. Trouvée par une garde qui cherchait autre
  chose et lisait la mauvaise règle.
- **`.garage-tete`** — la correction `align-items: center` vivait quatre cents
  lignes sous une déclaration `baseline` qui restait à lire et à croire.

Un essai unitaire refuse désormais tout sélecteur de classe nu déclaré deux fois
au premier niveau de la feuille — y compris accentué : `\w` est ASCII en
JavaScript, et une classe `.tracé-argent` traversait la garde sans être lue.

## L'ordre d'attaque

1. ① Récit 18.1 — LE VERSEMENT D'IMAGE, D'ABORD ET AVANT TOUT. `createWritable` n'existe pas avant Safari 26 : si l'iPhone de Julian n'est pas à jour, aucune photo, aucun portrait, aucun manuel, aucune facture ne se garde — et rien de ce qui suit ne se vérifie chez lui.

2. ② Épique 21 en entier — les mots, le rouge, le doublon. Zéro migration, zéro donnée, zéro question ouverte : elle se finit en une passe, et 21.3 (le rouge du destructif) doit exister AVANT que l'épique 22 pose des languettes de suppression.

3. ③ Récit 19.1 — le budget dit sa période. C'est un libellé, c'est ce qui l'agace aujourd'hui, et ça ne dépend pas de la réponse à « mensuel ou annuel » : dans les deux cas la période doit être à côté du champ.

4. ④ Épique 17, récits 17.1 puis 17.2 — le roulage à venir cesse de compter comme vécu, puis le tap ouvre la préparation. C'est la demande la plus dense de Julian et elle ne coûte aucune table neuve ; 17.1 avant 17.2 parce que le prédicat partagé sert aussi à 22.1.

5. ⑤ Récits 17.4 et 17.3 — d'abord ce qui existe et qu'il faut seulement rendre atteignable, ensuite les horloges. 17.3 est le plus gros du lot et il attend une réponse : ne pas le commencer avant.

6. ⑥ Épique 20, récits 20.1 puis 20.2 — l'écran de chargement puis le jeu d'icônes. Aucune dépendance de donnée, et ils occupent utilement le temps pendant lequel les questions d'argent attendent une réponse. 20.3 et 20.4 suivent 20.2, qui fixe la grille.

7. ⑦ Récits 18.3 puis 18.2 — verser plusieurs photos AVANT de construire l'album : une grille sur trois photos fait un trou, et c'est exactement ce que systeme.css:503 avait tranché.

8. ⑧ Épique 22, récit 22.1 puis 22.2 — l'écran de modification AVANT la languette, sinon la languette « modifier » ouvre le vide. 22.3 en dernier de l'épique, parce qu'il attend une décision sur EXPERIENCE.md:212.

9. ⑨ Épique 19, récits 19.2 puis 19.3 puis 19.4 — l'argent en dernier. C'est la seule migration de schéma des six épiques, la seule qui laisse des données irrattrapables derrière elle (les dépenses déjà saisies n'auront jamais de mois), et 19.4 ne peut pas commencer avant 19.2.

10. ⑩ Récits 17.5 et 18.4 — hors file, dès que Julian répond. 17.5 (les objectifs) et 18.4 (le réglage de l'envoi cloud) sont entièrement suspendus à une décision de lexique et à un chiffre de coût qui n'existe nulle part.



## Les décisions de Julian, 25 août 2026

Quatre questions bloquantes lui ont été posées. Ses réponses lèvent trois règles
écrites du produit ; elles sont datées ici comme celles du 18 et du 23 août, et
le code doit les citer là où il s'en écarte.

**① LA CHECK-LIST — ni embarquée, ni purement dérivée : DÉRIVÉE D'UN RÉFÉRENTIEL.**
Sa réponse est une troisième voie, et elle est meilleure que les deux proposées :

> « Dans la réalité il y a bien des choses communes à chaque moto, qui doit être
> complété par un websearch vers le manuel d'utilisation. J'ai une moto, je
> cherche le manuel sur internet, je remplis et prépare tout ce qu'il peut
> m'apporter sur la moto, mais c'est transparent pour l'utilisateur. »

La règle du 23 août tient donc : la liste n'est PAS embarquée. Un socle commun à
toute moto (huile, chaîne, freins, pneus) existe comme **référentiel**, et le
manuel de CETTE moto le complète — intervalles réels, pièces réelles. Ce qui
s'affiche reste dérivé de la machine du pilote, jamais d'une liste identique pour
tout le monde.

⚠ **ET IL A RAISON SUR UN POINT QUE PERSONNE N'AVAIT RELEVÉ : « il n'y a pas
d'URL ».** La recherche web EXISTE déjà — `supabase/functions/manuel/index.ts`
utilise le connecteur `web_search` de Mistral, la clé qu'il paie déjà, et la
fonction est déployée et active. Ce qui manque n'est donc pas la recherche, c'est
le **TRAITEMENT** : le PDF est rapatrié dans son espace privé, et rien ne le LIT.
Aucun intervalle n'en sort, aucune horloge ne s'en remplit. C'est ce chaînon-là
qui rend « vérifier l'huile » dérivable, et il n'est écrit nulle part.

**② LE BUDGET — un plafond annuel ET un repère mensuel.** Les deux. La saison
porte le plafond, le mois porte un repère.

**③ LES OBJECTIFS — libres, avec un avertissement en pied d'application.**

> « C'est la pratique d'un sport, un petit disclaimer en bas de l'app devrait
> suffire. Dans les objectifs, on peut imaginer poser le genou à gauche, faire
> 1 min 30, travailler les virages à gauche, etc., soit pas trop strict. »

⚠ Ça lève DEUX règles écrites : le mot « objectif » interdit à l'écran, et
l'interdiction de la cible chiffrée de chrono. Il les lève en connaissance de
cause, et il pose la contrepartie — un avertissement permanent. Le code doit
citer cette décision là où il s'écarte de l'épine UX.

**④ L'ÉCRAN DE CHARGEMENT — durée minimale garantie, ~600 ms.** Ralentir
volontairement l'ouverture est normalement une faute ; c'est ici la condition
pour que l'écran existe. *(Fait le 25 août.)*

## Ce que Julian doit trancher

Vingt-deux questions sont sorties de la relecture. Elles ne se valent pas : la
plupart attendent leur récit, quelques-unes **bloquent** — sans réponse, on
écrirait quelque chose qu'il faudrait défaire.

- ÉCRAN DE CHARGEMENT — Acceptes-tu de RALENTIR volontairement l'ouverture pour que l'écran se voie (une durée minimale garantie, par exemple 600 ms, y compris sur ordinateur où tout est prêt en 80 ms) : oui ou non ?
- ÉCRAN DE CHARGEMENT — L'épine UX écrit « il n'y en a pas au noyau ; un indicateur de chargement au paddock est un aveu » (EXPERIENCE.md:212). On lève cette règle par décision datée, ou on s'en tient à un décor peint sans aucun indicateur de progression ?
- CHECK-LIST DE BASE — On pose des horloges VIDES sur ta moto (vidange, plaquettes, chaîne, liquide de frein, pneus, filtre à air, sans intervalle), pour que « vérifier l'huile » soit dérivé et propre à ta moto — ou tu veux quand même une liste embarquée identique pour tout le monde, en exception assumée à la règle écrite ?
- OBJECTIFS — Une fois la journée passée, ce que tu avais visé se relit SANS case à cocher, sans « atteint », sans « 2 sur 3 » : d'accord, ou tu veux pouvoir le marquer atteint ?
- OBJECTIFS — Le mot « objectif » est interdit à l'écran par l'épine UX (EXPERIENCE.md:114) et cette ligne-là n'est pas tombée le 18 août. On la lève aussi, ou on nomme la chose autrement (« ce que je vais chercher ») ?
- OBJECTIFS — Un objectif chiffré de chrono (« passer sous 1'38 ») : autorisé, ou interdit ? Il fabrique un verdict le soir même et transforme la courbe en écart à combler, ce que courbe.ts refuse explicitement.
- OBJECTIFS — On propose uniquement les caps de `discipline`, jamais ceux de `bravoure` (viser « genou gauche posé » est l'enchaînement de la chute fondatrice) : d'accord, ou tu lèves ça aussi ?
- ROULAGE À VENIR — Une journée annoncée naît-elle en « brouillon » et bascule-t-elle en « usage » toute seule à la première session, photo ou dépense (aucune case, aucune relance), ou reste-t-elle en « usage » dès la saisie ?
- BUDGET — 500 €/mois : est-ce un budget MENSUEL réel à faire entrer au produit (migration des deux côtés), ou un budget ANNUEL de 6000 € mal saisi (un libellé) ?
- BUDGET — La jauge ne change pas de couleur au dépassement, délibérément (« dépasser son budget n'est pas une faute »). Cette règle tient-elle encore quand le consommé fait quatre fois le budget : oui ou non ?
- DÉPENSES — Les dépenses déjà saisies n'auront jamais de mois. Elles restent « sans mois » et l'écran le dit (comme « Sans poste »), ou on leur attribue le mois de leur roulage quand il en ont un ?
- ANALYTIQUES — Le graphe d'argent a-t-il le droit de porter une tendance ou une projection, ou le refus écrit pour le chrono (« aucune tendance, aucune droite, aucun à ce rythme ») s'y applique tel quel ?
- ANALYTIQUES — « Plein d'analytiques » se limite-t-il pour l'instant à : coût par poste, coût par mois, coût par circuit, coût moyen d'une journée — oui ou non ? (si non, nomme celle qui manque : sans liste il n'y a rien à cadrer)
- GARAGE — « Modifier la moto » : ce seul bouton, ou « moto » partout à l'écran (« Aucune moto », « Déclarer ma moto », le sélecteur « Moto » du nouveau roulage), la table `machine` restant inchangée ?
- PORTRAIT — « Refaire le portrait pixel » passe-t-il par une confirmation qui dit ce que ça consomme (≈ 0,16 € et un crédit sur trois), ou relance-t-il la génération directement ?
- PORTRAIT — L'équipement (« Retirer le portrait », Budget.tsx:386) suit-il la même règle que la moto, ou reste-t-il en l'état ?
- ATELIER — Les trois listes (entretien, amélioration, bricoles) restent-elles SÉPARÉES à l'ouverture, la clé à molette n'étant qu'un sommaire et jamais une liste mélangée : oui ou non ?
- ATELIER — « Atelier » est aujourd'hui le NOM DU GROUPE des trois, pas une catégorie. Dans ta proposition, « atelier en sous-partie de la molette » désigne-t-il le carnet daté d'interventions, ou est-ce un mot qui doit disparaître ?
- GLISSEMENT — L'épine UX interdit nommément tout balayage destructeur sur la carte de roulage (« avec des gants, un balayage destructeur se déclenche seul »). On lève l'interdit avec des languettes qui RÉVÈLENT et exigent toujours la confirmation, ou on garde le bouton actuel ?
- PHOTOS — Maintenant que tu sais qu'on n'envoie qu'une vignette de 1600 px / ~300 Ko et que ton original 48 Mpx ne quitte jamais l'iPhone : on ajoute un réglage qui coupe l'envoi cloud, ou on laisse tel quel ?
- TÉMOIN DE SAUVEGARDE — L'épine UX a déjà tranché la forme : « un liseré discret sur la carte concernée, jamais une modale ». Tu veux le liseré, ou tu veux le rond qui tourne (ce qui demande de lever la règle) ?
- DÉMONSTRATION — Le dépôt sème un roulage futur au 19 septembre 2026 (Garage.tsx:146), pas au 12 comme ta journée à Pau-Arnos. On corrige la démo à ta date, ou on la laisse ?
