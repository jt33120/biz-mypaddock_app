---
title: 'Recherche user-voice : apps de trackday et de suivi moto'
type: 'user-voice'
topic: 'Ce que disent les utilisateurs des apps de chrono, de carnet et de trackday moto'
decision: 'Ce que le PRD doit construire — la these de la combinaison tient-elle face au vecu, et existe-t-il un mecontentement reel exploitable sur les apps existantes'
source: 'run natif, sequentiel, sans sous-agents'
status: complete
preset: 'standard'
validation: 'normal'
created: '2026-08-17'
updated: '2026-08-17'
---

# Recherche user-voice : apps de trackday et de suivi moto

**Décision servie :** ce que le PRD doit construire — la thèse de la combinaison tient-elle face à ce que disent réellement les utilisateurs, et existe-t-il un mécontentement exploitable sur les applications existantes.

---

## Résumé exécutif

**Le champ est nettement plus encombré que ne le suppose le brief — mais il est encombré de tentatives, pas de gagnants.** Une vague d'entrants 2024-2025 occupe le créneau chrono : Trakio, Driver Nation, Pitly, TrackdTimer, xracing, ST1 Track, RaceIQ, CR Moto, Track Day Genius. Aucun n'a assez de notes sur l'App Store pour afficher une moyenne [6][7][10][21]. Ce n'est pas « la place est prise » ; c'est « personne n'arrive à faire décoller ce créneau », ce qui est une information plus lourde et qu'il faut regarder en face.

**Deux affirmations du brief sont renversées.** Le récapitulatif partageable en story Instagram n'est pas une case vide : Trakio expédie des modèles de Story pour les temps au tour depuis avril 2024, à 14,99 $/an [6]. Et l'incrustation vidéo de RaceChrono est déjà louée par ses utilisateurs *précisément pour le partage social* [33] — le partage n'est pas un manque à combler, c'est un motif d'attachement chez le leader. La combinaison chrono plus communauté plus garage existe également, chez Driver Nation depuis janvier 2025 [7].

**Une troisième affirmation a été renversée puis reformulée en plus solide.** Il est faux que personne ne suive les dépenses moto : MotoVault vend un abonnement à 4,99 $/mois là-dessus, aux côtés de RideLog, Bike Kharcha et MyBikes [22]. Mais **tous sont routiers** — leur unité est le kilomètre parcouru et la consommation de carburant, avec détection automatique du trajet [30]. Aucun ne raisonne en journée de roulage, en session, en tour ou en coût au tour, c'est-à-dire dans les unités où le kilométrage ne veut rien dire. **La disposition à payer pour du suivi de dépense moto est donc prouvée par un paiement réel ; c'est l'unité de compte adaptée à la piste qui manque.**

**Ce qui survit, et se précise :** aucun acteur ne franchit la ligne entre les deux moitiés du marché. Les apps de performance et de communauté n'ont ni coût ni entretien ; MotoBook, le carnet le plus abouti et le plus proche — français, PWA, 6 000 motards revendiqués — n'a ni communauté, ni performance, ni chronos, ni coût [18][19]. **La strate argent est le seul territoire réellement vide, et elle se trouve exactement à la jonction des deux moitiés occupées.**

**Le mécontentement exploitable n'est pas là où on l'attendait.** Les plaintes documentées sur les apps de chrono portent presque exclusivement sur la fiabilité de la capture : GPS qui rate la ligne, sessions non enregistrées, crashes, export vidéo défaillant [1][3]. C'est une catégorie entière de risque que la saisie manuelle esquive par construction. En revanche l'attachement à RaceChrono s'accroche à la **granularité par virage** — « seeing exactly where I'm losing time in the corners » [32] — que la saisie manuelle ne produit pas.

**Deux contournements documentés valent comme demande non tarifée.** Pour l'argent, un écosystème éditorial répond à la question à la place d'un outil : au moins cinq publications françaises et quatre anglophones publient des budgets de saison détaillés [23]. Pour l'entretien, les motards français construisent des tableurs Excel, avec fils dédiés sur plusieurs forums [24]. Quelqu'un qui écrit un article ou bricole un tableur a déjà voté.

**Le vocabulaire n'est pas celui du brief.** Le mot du métier en France est **« roulage »**, pas « trackday » [38]. Les groupes sont **Blanc, Jaune, Rouge** [39].

---

## Dimension 1 — plaintes et contournements

### Ce dont les gens se plaignent vraiment

La plainte dominante, sur les deux leaders, est **la fiabilité de la capture**. Chez RaceChrono : échecs d'export vidéo liés aux codecs matériels, arrêt de l'enregistrement quand l'application passe en arrière-plan, GPS externe Qstarz qui ne trouve pas la ligne de départ-arrivée d'où des tours incomplets, permission de localisation en arrière-plan refusée [1]. Chez TrackAddict : crashes après mise à jour, perte du marqueur GPS, sessions non enregistrées, mode paysage cassé en v4.0.3, détection de rapport engagé « extrêmement inexacte », GoPro 8 non détectée, appairage OBD difficile [3].

S'ajoutent des irritants d'interface : chez RaceChrono, manque d'options de design des cadrans, mode paysage jugé pénible, export vers la pellicule défaillant [2].

**Conséquence pour le produit.** Le palier 1 retenu au brief — saisie manuelle, aucun GPS — **esquive par construction la totalité de cette catégorie**. C'est un avantage de fiabilité obtenu sans effort d'ingénierie. Il faut cependant le lire honnêtement : ces plaintes visent des fonctions qu'on ne rend pas, pas des besoins qu'on satisfait mieux.

Côté carnets d'entretien, les plaintes trouvées sont d'un tout autre ordre — ergonomie basique (une barre « next » qui masque les champs), absence de bascule métrique-impérial, et une remarque récurrente qu'« il existe plein d'apps gratuites qui font la même chose en mieux » [5]. **La banalisation est le risque de cette couche, pas la fiabilité.**

### Les contournements, qui valent comme demande

Pour l'argent, un écosystème éditorial français et anglophone publie des budgets de saison détaillés : accessoirement.fr, MotoAIN (« budget détaillé 2026 »), GoPilotes, lyonmotard, des fils sur emoto ; côté anglophone evolvegt, motogladiator, Lockton Motorsports, Bennetts BikeSocial, et des fils sur GTAMotorcycle, 1000rr.net, 600rr.net [23]. Ces articles existent parce que la question est posée en permanence et qu'aucun outil n'y répond.

Pour l'entretien, les motards français construisent des tableurs Excel — fils dédiés sur ZephyrClub, le forum Royal Enfield, excel-pratique — avec des colonnes date, kilométrage, entretien, prix, et pour certains une coloration en rouge des entretiens en retard [24].

### Repères de coût, utilisables pour le modèle de budget

Une journée de roulage en France coûte **99 à 360 €** selon circuit, organisateur et formule [25]. L'équipement pilote complet représente **1 000 à 2 500 €, amortis sur 3 à 5 ans** [26]. Un train de pneus piste tient **3 à 5 journées** pour **350 à 500 €**, soit **30 à 70 € par journée** [27]. Les dates en semaine sont **15 à 30 % moins chères** que les week-ends [28]. Aux États-Unis, l'entrée va de 150 à plus de 400 $ la journée, avec 500 à 1 000 $ par an conseillés pour pneus et entretien [29].

Ces chiffres proviennent de blogs spécialisés, pas de sources primaires : ils servent à calibrer des ordres de grandeur et des valeurs par défaut, jamais à être affichés comme des faits.

---

## Dimension 2 — attachement et bascule

Ce qui attache les utilisateurs à RaceChrono, dans leurs mots : les outils d'analyse, décrits comme « the best and most simplest and reliable functionality », produisant des données « simple to interpret and consume and an invaluable post race tool » [31]. Le chrono prédictif est loué comme « incredibly accurate, helping me shave seconds off my personal bests by **seeing exactly where I'm losing time in the corners** » [32]. La bibliothèque de circuits est un motif d'attachement à part entière — « massive, I've never been to a road course that wasn't already in the database » — et l'usage par des pilotes d'essai constructeur et des instructeurs fait autorité [34].

**Et l'incrustation vidéo est louée explicitement pour le partage social** : « seamless and looks professional when I **share my hot laps on social media** » [33].

**Deux conséquences directes, toutes deux inconfortables.**

D'abord, le partage n'est pas un territoire vierge : c'est déjà une des raisons pour lesquelles les gens aiment le leader, et Trakio expédie des modèles de Story Instagram depuis avril 2024 [6]. Notre image composée reste défendable, mais **comme une exécution supérieure sur un terrain occupé, pas comme une invention**.

Ensuite, la valeur perçue s'accroche à la **granularité par virage** — exactement ce que le palier 1 ne produit pas. Le brief a remplacé le record par secteur par la courbe de progression et les achievements ; cette recherche confirme que le remplacement se fait au prix de ce que les utilisateurs actuels valorisent le plus. Les achievements sont un pari, pas un équivalent.

---

## Dimension 3 — demandes non satisfaites

**La ligne que personne ne franchit.** Les apps de performance et de communauté n'ont ni coût ni entretien : Trakio fait chronos, secteurs, classements, Story Instagram, export PDF/CSV — rien sur l'argent ni la machine [6]. Driver Nation fait chronos avec secteurs, garage multi-véhicules, canaux de discussion, comparaison entre pilotes, classement mondial, partage de tour avec fond personnalisé, carte de membre avec check-in trackday — rien sur l'argent ni l'entretien [7]. Pitly enregistre les réglages, pressions de pneus, suspension, températures — rien sur le coût ni l'entretien [21].

Symétriquement, **MotoBook**, le carnet le plus abouti du marché francophone, va loin sur la machine : intervalles adaptés au style de conduite, préconisations constructeur intégrées automatiquement, système de prédiction, tâches adaptées à la machine, factures conservées, historique valorisable à la revente, et surtout **paramétrage de la moto en journées de roulage** — la journée de piste est déjà une unité d'usage reconnue [15][16]. Il se présente comme le premier carnet connectable au concessionnaire pour un historique certifié, et cible explicitement les pistards [17]. **Il ne fait ni coût, ni budget, ni dépenses [18], ni communauté, ni performance, ni chronos [19].**

MotoBook est en outre distribué comme Trusted Web Activity sur le Play Store [20] — une PWA empaquetée, exactement le choix technique retenu au brief. Et il revendique 6 000 motards et 35 000 historiques atteints « après quelques mois » en 2021-2022 [12][13] : **la couche entretien recrute là où les entrants chrono récents n'y arrivent pas.** Ce chiffre est communiqué par l'éditeur, non audité et daté ; il indique un ordre de grandeur, pas un fait établi. L'application était alors gratuite [14], ce qui ne prouve aucune disposition à payer.

**Le besoin communautaire moto est servi ailleurs**, hors contexte circuit, par des réseaux sociaux moto établis — TONIT, MOTOSPOT, RocKr, rBiker [35]. La couche calendrier française est également tenue, par TrackMate et GoPilotes [42].

Une seule demande explicitement non couverte a été trouvée, et elle ne vaut pas prévalence : un mode de **suivi du pilote en cas de chute** sur circuit [37].

---

## Dimension 4 — leur vocabulaire

Le mot du métier en France est **« roulage »**, pas « trackday » : il structure les URL et les titres de tous les acteurs français examinés [38]. Les groupes de niveau sont **Blanc (débutants), Jaune (intermédiaires), Rouge (confirmés)** [39].

La journée a une structure stable, utilisable telle quelle comme squelette d'écran : **briefing obligatoire vers 8 h 30**, de 15 à 30 minutes, couvrant les drapeaux et le plan du circuit avec les points de freinage ; roulage à partir de 8 h 45 ; **pause repas de 12 h à 14 h** ; fin vers 17 h 30 ; des **pilotes-conseils** présents sur place [40]. Les codes drapeaux enseignés au briefing : **jaune = ralentir, rouge = arrêt** [41].

**Conséquence pour l'interface** : les textes doivent dire « roulage », « session », « groupe rouge », « pilote-conseil », « briefing ». Le brief et l'addendum emploient « trackday » ; c'est le mot des éditeurs, pas celui des pratiquants.

---

## Ce que cette recherche change pour le brief

| Affirmation du brief | Statut | Ce qu'il faut écrire à la place |
|---|---|---|
| Le récapitulatif partageable en story est une case vide | **Renversée** [6][33] | Terrain occupé par Trakio, et le partage est déjà un motif d'attachement chez RaceChrono. Se défendre par l'exécution, pas par la nouveauté. |
| Personne ne combine stats, communauté, carnet et revente | **Affaiblie** [7] | Driver Nation combine stats, communauté et garage. Ce qui reste vrai : personne ne franchit la ligne vers l'argent et l'entretien. |
| Aucune app ne suit le coût | **Renversée puis reformulée** [22][30] | MotoVault vend ça 4,99 $/mois. Mais tous sont routiers, en coût au kilomètre. Le coût au tour et à la journée reste inoccupé — et l'appétit est prouvé par un paiement. |
| Le territoire du geste nul est libre | **Non vérifiée** | Aucune donnée trouvée pour l'étayer ni la contredire. À ne pas citer comme un fait. |
| Le champ se coupe en deux moitiés dont l'une est mince | **Confirmée et précisée** [18][19][21] | La ligne existe et personne ne la franchit. C'est la thèse à conserver. |

**La lecture la plus importante, et la plus dérangeante :** aucun des entrants 2024-2025 n'a de traction [10][21]. Un créneau où neuf produits sont sortis en deux ans sans qu'aucun décolle n'est pas un créneau qui attend le bon produit — c'est un créneau où il faut expliquer pourquoi les autres ont échoué avant de croire qu'on réussira. Le cadrage bac à sable du brief absorbe ce risque, puisque le critère est l'utilité personnelle et le coût marginal nul. Il ne l'annule pas.

---

## Questions ouvertes

1. **La voix Reddit n'a pas été atteinte**, après quatre formulations : les moteurs renvoient des fiches App Store. C'est la source qui aurait donné le plus de vécu brut.
2. **Aucun avis verbatim négatif n'a été récupéré directement** : les deux agrégateurs sont hors service (DNS mort pour appgrooves, 403 pour appsupports) et les pages App Store ne rendent pas leur corps d'avis. Les citations de la dimension 2 proviennent de résumés de moteur, d'où une confiance moyenne et non haute.
3. **Aucune affirmation de prévalence n'est émise dans ce rapport.** Le pack en exige deux communautés indépendantes ; cette condition n'a jamais été réunie. Aucune phrase du type « la plainte numéro un est… » ne doit être tirée d'ici.
4. **Le modèle économique actuel de MotoBook est inconnu** — gratuit en 2021, aucun tarif publié aujourd'hui. C'est le concurrent le plus proche : savoir s'il monétise, et comment, changerait la lecture.
5. **Aucun avis d'utilisateur de MotoBook n'a été trouvé**, seulement de la couverture presse et des pages éditeur.
6. **La traction réelle de Trakio et Driver Nation n'est connue que par l'absence de notes** — un signal faible. Des chiffres de téléchargement changeraient la conclusion.

Route pour lever ces points : une passe **Deepen** ciblée sur Reddit et les avis verbatim par un autre chemin d'accès, ou un prompt rédigé pour un outil de deep research disposant d'un meilleur accès aux communautés.

---

## Sources

| [n] | Source | Éditeur | Date | Consulté |
|---|---|---|---|---|
| [1][2] | racechrono.com/support et FAQ (Android, iOS, all issues) | RaceChrono | — | 2026-08-17 |
| [3][4] | appsupports.co et appgrooves TrackAddict (via résumé de moteur), forums Mopar et Shelby GT500 | agrégateurs d'avis | — | 2026-08-17 |
| [5] | Fiches App Store et Google Play d'apps de carnet d'entretien moto | Apple / Google | — | 2026-08-17 |
| [6] | apps.apple.com/app/trakio/id6760278416 | Apple App Store | 2024-04 | 2026-08-17 |
| [7] | apps.apple.com/us/app/-/id6752714597 (Driver Nation) | Apple App Store | 2025-01 | 2026-08-17 |
| [8][21] | apps.apple.com/mx/app/pitly/id6745170626 | Apple App Store | 2025 | 2026-08-17 |
| [9] | Fiches App Store : TrackdTimer, xracing, ST1 Track, RaceIQ, CR Moto, Track Day Genius, DIABLO Super Biker | Apple | 2024-2026 | 2026-08-17 |
| [10] | Absence de moyenne affichée sur les fiches Trakio et Driver Nation | Apple | — | 2026-08-17 |
| [11][37] | Avis sur DIABLO Super Biker | Apple | — | 2026-08-17 |
| [12][13][14] | neozone.org et motoplanete.com sur MotoBook | NeozOne / Motoplanete | 2021-2022 | 2026-08-17 |
| [15]-[19] | motobook.app/rider | MotoBook | — | 2026-08-17 |
| [20] | play.google.com/store/apps/details?id=app.motobook.twa | Google Play | — | 2026-08-17 |
| [22][30] | motovault.app/features/expense-tracking, fiches RideLog, Bike Kharcha, MyBikes.App | éditeurs / stores | 2026 | 2026-08-17 |
| [23] | accessoirement.fr, motoain.fr, gopilotes.fr, lyonmotard.com, emoto.com, evolvegt.com, motogladiator.com, locktonmotorsports.com, bennetts.co.uk, gtamotorcycle.com, 1000rr.net, 600rr.net | divers | 2024-2026 | 2026-08-17 |
| [24] | zephyrclub.fr, royalenfieldlesite.fr, forum.excel-pratique.com | forums | — | 2026-08-17 |
| [25]-[28] | accessoirement.fr, motoain.fr | blogs spécialisés FR | 2026 | 2026-08-17 |
| [29] | evolvegt.com, motogladiator.com | blogs spécialisés US | 2024-2026 | 2026-08-17 |
| [31]-[34] | Avis RaceChrono Pro agrégés (App Store, MWM) | Apple / MWM | 2024-2026 | 2026-08-17 |
| [35] | Fiches App Store TONIT, MOTOSPOT, RocKr, rBiker | Apple | 2024-2026 | 2026-08-17 |
| [36] | apps.apple.com/lt/app/cr-moto-lap-by-lap/id6502582416 | Apple | 2024 | 2026-08-17 |
| [38]-[42] | trackmate.fr, gopilotes.fr, welygo.com, 4gmoto.com, icasque.com | acteurs FR | 2024-2026 | 2026-08-17 |
