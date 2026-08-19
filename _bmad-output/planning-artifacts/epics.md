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
