---
title: "Innovation Strategy — MyPaddock Track"
status: complete-first-draft
mode: autonomous-yolo
created: 2026-08-16
updated: 2026-08-16
evidence_note: "Stratégie fondée sur la recherche disponible ; demande, disposition à payer et modèle B2B restent à valider."
---

# Innovation Strategy: MyPaddock Track

**Date :** 16 août 2026  
**Strategist :** Julian avec BMAD/Codex  
**Strategic Focus :** transformer les actifs de MyPaddock en un produit track-day moto France-first, sans reconstruire un gestionnaire de véhicules générique.

---

## 🎯 Strategic Context

### Current Situation

MyPaddock dispose d'un patrimoine de code conséquent — garage, reçus/OCR, coûts, maintenance, documents, courbes TCO et vente — mais pas d'un produit track-day, d'un schéma reproductible ni d'une traction active exploitable. L'ancien modèle mêlait abonnement B2C, valorisation, marketplace et affiliation. Il dépendait d'une saisie importante, de données externes et d'une promesse financière peu différenciée.

Le pivot bénéficie d'un bon founder–problem fit : le fondateur pratique lui-même la piste et possède les machines permettant de tester le flux. Ce fit donne un laboratoire, pas une preuve de demande.

### Strategic Challenge

Trouver une entrée assez utile pour provoquer un comportement récurrent chez des passionnés qui peuvent refuser de « compter », assez étroite pour un fondateur solo et assez distincte de produits déjà gratuits ou vendus 25–40 € par an.

La question n'est donc pas « quelles features peut-on recycler ? », mais : **quelle information impossible ou pénible à reconstruire vaut qu'un pilote connecte ses traces de roulage tout au long de la saison ?**

### Frameworks sélectionnés

- **Competitive Positioning Map** et **Market Timing Assessment** : le nombre de pratiquants n'est pas mesuré honnêtement, mais l'occupation des jobs et la fenêtre d'intégration peuvent l'être.
- **Jobs to be Done** et **Crossing the Chasm** : partir d'un job précis et d'un beachhead moto France, pas d'un « garage pour tous ».
- **Revenue Model Innovation** : distinguer utilité récurrente, transaction de vente et logiciel professionnel.
- **Unbundling**, **Make vs Buy** et **Partnership Strategy** : posséder le ledger/provenance, intégrer plutôt que reconstruire réservation et chronométrage.
- **Lean Startup** : comparer les engagements sur trois concepts avant de coder la combinaison.

---

## 📊 MARKET ANALYSIS

### Market Landscape

- Le funnel FFM/organisateurs est observable, mais aucun nombre public récent ne permet de dédupliquer les pratiquants track-day moto. Les 19 168 Pass Circuit 2024 sont des titres/journées de plusieurs types, pas des utilisateurs uniques.
- Les prix de journée observés montrent une dépense réelle et répétable, mais ne prouvent pas qu'un pilote paiera un logiciel en plus.
- Les jobs sont déjà décomposés entre réservation (RideApp, TrackMate, WELYGO/Tarmago), chronométrage (RaceChrono), maintenance liée à la piste (Apex Lines), garage/preuves/transfert (MotoBook, LookOver, MotoHist, MotoStack) et tableurs. Bikerflow, MotoVault et EMX montrent en outre qu'une grande partie du bundle existe déjà dans des produits moto proches.
- Le marché n'est pas vide ; les acteurs proches sont toutefois jeunes, peu évalués publiquement ou faiblement localisés en France.

### Competitive Dynamics

| Axe | Occupants forts | Conséquence |
|---|---|---|
| Dates, réservation, check-in | RideApp, TrackMate, WELYGO, Tarmago | Deep-link/import/partenariat ; pas de troisième marketplace en V1 |
| Chrono et télémétrie | RaceChrono et outils spécialisés | Importer les exports ; ne pas reconstruire le timer |
| Entretien piste | Apex Lines, MotoBook | « heures/jours/cycles » seul n'est pas différenciant |
| Documents et transfert | LookOver, MotoHist, MotoStack, MotoBook | « passeport PDF » seul n'est pas différenciant |
| Substitut | Notes, papier, Sheets, mémoire | L'automatisation ou la preuve doit battre un outil gratuit et flexible |

La pression prix est forte : gratuit chez MotoBook, 24,99 $/an chez LookOver, 39,99 $/an chez Apex Lines, 9,99 $ par pass de vente chez MotoStack. Une offre B2C générique au-dessus de cette zone exigerait une preuve de valeur nettement supérieure.

### Market Opportunities

1. **Couture inter-outils à prouver** : événement/session → usage confirmé → composant → intervention/preuve → partage sélectif. Ce n'est plus une revendication de nouveauté fonctionnelle, seulement une hypothèse d'exécution France-first plus fluide.
2. **Expérience France-first** : circuits, formats, justificatifs et vocabulaire piste locaux, sans devenir opérateur de paiement.
3. **Readiness explicable** : dire ce qui est dû selon les données connues et montrer l'incertitude.
4. **Coût facultatif mais complet** : prévision/réel par événement et saison, présenté quand l'utilisateur le demande.
5. **Provenance granulaire** : preuve au niveau du composant et de l'intervention plutôt qu'un score ou un PDF opaque.

### Critical Insights

- Il n'existe plus de white space fonctionnel défendable au vu des concurrents directs et adjacents. L'opportunité restante est un **écart d'exécution localisé** : continuité de données, intégrations françaises et charge de saisie réellement plus faible.
- Cette continuité est copiable. La défense éventuelle viendra des intégrations, du modèle de données, de l'historique accumulé et de partenaires qui confirment des événements — pas de l'IA seule.
- Le calendrier peut faciliter l'acquisition mais sa transaction est déjà occupée et peu rémunératrice au premier achat.
- Le plus grand concurrent reste le non-usage : si connecter une trace demande plus de travail qu'un tableur occasionnel, le produit perd.

---

## 💼 BUSINESS MODEL ANALYSIS

### Current Business Model

Il n'existe plus de modèle actif à optimiser. L'ancien freemium automobile + marketplace + affiliation doit être traité comme une hypothèse historique invalidée par l'absence de rétention/paiement démontré, pas comme une base commerciale.

### Value Proposition Assessment

**Ancienne promesse :** comprendre la valeur et le coût d'un véhicule.  
**Promesse candidate :** chaque roulage confirmé prépare le suivant ; les preuves d'entretien restent partageables au choix du propriétaire.

La seconde promesse relie un bénéfice immédiat — readiness — à un actif différé — provenance. Le coût devient une vue optionnelle et une donnée sous-jacente, pas la morale du produit.

### Revenue and Cost Structure

Les prix suivants sont des **cellules de test**, pas une grille validée :

- Gratuit : une machine, capture manuelle/assistée, timeline et rappels essentiels.
- Pro saison : 29–39 €/an pour multi-machine, imports, multi-horloges, coûts complets, exports et automatisations.
- Pack transmission : 9–19 € par machine/vente comme cellule de test pour sélection, lien temporaire et transfert ; il doit être abandonné si la divulgation détériore la négociation.
- Professionnel : le marché affiche des substituts de 9 à 199 €/mois selon atelier, location ou team. Cette enveloppe décrit la concurrence, pas la disposition à payer des opérateurs piste ; le prix reste à découvrir.
- Affiliation pièces/services : seulement après usage et avec transparence, jamais au prix de la neutralité des recommandations.

Les coûts structurels à contenir sont le support, le stockage de preuves, l'OCR/inférence, les intégrations et la fraîcheur des calendriers. Le MVP doit éviter paiements marketplace, assurance distribuée, modération et scraping.

### Business Model Weaknesses

- Aucune disposition à payer observée dans ce nouveau segment.
- Prix B2C plafonné par des substituts gratuits ou peu chers.
- Bénéfice de revente disputé et potentiellement négatif si l'usage piste inquiète l'acheteur.
- Readiness mécanique à fort coût de confiance : une erreur peut coûter bien plus que l'abonnement.
- Intégrations tierces susceptibles de casser ou d'être refusées.
- Saisonnalité et faible fréquence naturelle entre les roulages.
- « MyPaddock » est déjà exploité par Oracle Red Bull Racing et plusieurs concurrents track-day utilisent Paddock ; le nom reste un codename et aucune disponibilité juridique n'est présumée.

---

## ⚡ DISRUPTION OPPORTUNITIES

### Disruption Vectors

1. **Zéro journal à tenir** : produire le ledger à partir des traces existantes.
2. **Événement comme unité pivot, non comme mesure d'usure** : l'inscription peut amorcer une fiche, mais le pilote ou une source adaptée confirme le temps et l'usage réels.
3. **Preuve graduée** : rendre l'origine de chaque donnée lisible, sans faux label officiel.
4. **Complément plutôt que remplacement** : laisser RaceChrono et les plateformes de réservation faire leur métier.
5. **Local-first/opt-in** : minimiser télémétrie et géolocalisation, et permettre un partage par preuve plutôt qu'un transfert indiscriminé du dossier.

### Unmet Customer Jobs

- Ne pas rater une opération qui compromettrait la prochaine sortie.
- Savoir ce qu'une pièce a réellement vécu quand elle change de moto ou de configuration.
- Reconstituer une saison sans recoller emails, photos, reçus et exports.
- Montrer un historique honnête et compréhensible à un acheteur.
- Pour un professionnel potentiel : connaître disponibilité, coût et prochaine intervention de chaque machine sans dépendre de la mémoire d'une personne.

### Technology Enablers

- OCR de reçus et extraction structurée, déjà esquissés dans le brownfield.
- Import email/calendrier et fichiers de session avec consentement utilisateur.
- Moteur de règles multi-horloges explicable.
- Journal append-only et empreintes de fichiers pour tracer l'origine, sans prétendre empêcher toute fraude.
- Traitement local lorsque possible ; OEM/Data Act seulement comme extension future validée constructeur par constructeur.

### Strategic White Space

> **Le système de preuve d'usage de la machine de piste : une chronologie où chaque session peut alimenter l'usure, chaque opération peut porter sa preuve et chaque composant peut conserver son histoire.**

Cette formulation est plus défendable que « carnet d'entretien track-day » ou « passeport de revente », déjà occupés. Elle reste une hypothèse de désirabilité et non une moat acquise.

---

## 🚀 INNOVATION OPPORTUNITIES

### Innovation Initiatives

1. Import d'événement par email et création d'une sortie en une confirmation.
2. Import RaceChrono/CSV ou saisie minimale de sessions.
3. Ledger de composants déplacés entre machines.
4. Readiness à trois actions avec données et limites visibles.
5. Coût prévu/réel par sortie et saison, affichage facultatif.
6. Dossier de transmission à niveaux de preuve.
7. Confirmation atelier/organisateur limitée au fait réellement connu — facture émise, intervention ou check-in — d'abord en Wizard of Oz, sans en déduire l'usure.
8. Season Wrapped partageable comme boucle d'acquisition, non comme produit payant présumé.

### Business Model Innovation

Séparer trois moments de valeur au lieu d'enfermer tout dans un abonnement :

- usage récurrent gratuit ou peu cher pour construire l'historique ;
- automatisations/analyses payées par le propriétaire régulier ;
- action de transmission payée au moment où la valeur est la plus tangible ;
- logiciel ou service partenaire payé par un professionnel si son workflow le justifie.

### Value Chain Opportunities

**À posséder :** modèle track-day, ledger de preuves, moteur multi-horloges, readiness explicable, expérience de partage/transfert.  
**À intégrer :** réservation, chrono/télémétrie, HistoVec fourni par le propriétaire, paiement futur via PSP.  
**À éviter :** scraping sans autorisation, conseil d'assurance, certification mécanique, place de marché complète.

### Partnership and Ecosystem Plays

- Organisateurs : événements autorisés, présence confirmée, co-marketing.
- Ateliers : intervention confirmée et préparation avant sortie.
- Outils chrono : import/export plutôt que concurrence.
- Vendeurs de pièces : références et affiliation transparente après validation.
- Plateformes de vente : export ou lien partenaire seulement avec accord.

Un partenariat ne vaut que s'il apporte une donnée, un canal ou une preuve mesurable ; un logo partenaire n'est pas un avantage.

---

## 🎲 STRATEGIC OPTIONS

### Option A: Companion « Prêt pour la prochaine »

Produit B2C centré sur capture automatique, usage multi-horloges et readiness. Le coût et le dossier de transmission sont des vues secondaires alimentées par le même ledger.

**Pros :** testable par le fondateur, valeur après chaque sortie, réemploie directement les actifs, crée l'historique nécessaire aux autres modèles.  
**Cons :** abonnement plafonné, concurrence Apex/MotoBook/LookOver, responsabilité perçue des alertes, rétention saisonnière.

### Option B: Provenance transactionnelle

Expérience optionnelle centrée sur la vente : sélection de preuves d'entretien, lien HistoVec fourni par le propriétaire et transfert contrôlé ; paiement au pack plutôt qu'abonnement.

**Pros :** moment de valeur monétisable, message simple, pas besoin d'ouvrir l'app toutes les semaines.  
**Cons :** valeur faible si l'historique ne s'est pas construit avant la vente, concurrence de plusieurs « passports », effet sur prix/délai non prouvé ; documenter l'usage piste peut réduire le bassin d'acheteurs, le prix négocié ou l'accès à certaines garanties commerciales.

### Option C: Operating system de flotte piste

Produit B2B pour écoles, loueurs, ateliers ou petites équipes : disponibilité, heures/sorties, consommables, interventions, coûts et preuves par machine.

**Pros :** chez les loueurs/écoles, des actifs facturés 420–550 €/jour, des cautions de 3 500–5 000 € et des consommables chers rendent disponibilité et état avant/après économiquement observables ; fréquence et payeur sont potentiellement meilleurs.  
**Cons :** workflow, coût d'immobilisation, budget et achat logiciel restent inconnus ; des substituts atelier/flotte/team sont déjà affichés entre 9 et 199 €/mois ; attentes de fiabilité/support supérieures et risque de construire un autre produit.

---

## 🏆 RECOMMENDED STRATEGY

### Strategic Direction

Poursuivre **A comme couche de collecte/readiness**, tester **B seulement comme partage sélectif et réversible**, et mener **C en discovery parallèle auprès des loueurs/écoles**, sans bâtir de logiciel B2B avant observation du workflow et engagement d'achat.

La proposition de travail devient :

> **Après chaque roulage, confirme ce que ta machine a réellement vécu et vois ce qu'elle demande avant le prochain.**

Le MVP ne sera pas un gestionnaire financier, une marketplace, un chrono ou un certificat de revente. Il sera une boucle étroite : **importer une sortie → confirmer usage/opérations → voir la prochaine action → conserver les preuves utiles**.

### Key Hypotheses to Validate

1. Les pilotes connectent réellement une réservation, un reçu ou un export de session.
2. La readiness provoque un retour avant la prochaine sortie.
3. L'usage multi-horloges est compréhensible et préférable au kilométrage seul.
4. Le coût facultatif est consulté sans réduire l'usage.
5. Un dossier à preuves change les questions, l'offre ou le délai d'un acheteur.
6. Un organisateur ou atelier confirme une entrée avec un effort quasi nul et un bénéfice clair.
7. Au moins un moment de valeur obtient un engagement financier au prix testé.
8. L'accès/import aux outils tiers peut être obtenu légalement et durablement.

### Critical Success Factors

- Première valeur en moins d'une minute et sans configuration de garage exhaustive.
- Données et limites visibles derrière chaque rappel.
- Interopérabilité plutôt que duplication des outils dominants.
- Consentement et minimisation par défaut.
- Historique portable : export et suppression possibles dès le début.
- Discipline de scope : aucun checkout, marketplace, réseau social ou prédiction mécanique au MVP.

---

## 📋 EXECUTION ROADMAP

### Phase 1: Immediate Impact

- Prototyper séparément capture, readiness et transmission.
- Opérer OCR/import/attestation manuellement en Wizard of Oz.
- Observer des utilisateurs sur leurs dernières sorties et ventes réelles.
- Demander des engagements plutôt que des avis.
- Cartographier le workflow B2B d'au moins deux types d'opérateurs sans présumer Excel.

**Gate :** aucun build produit tant qu'un concept ne provoque pas une deuxième action ou un engagement coûteux.

### Phase 2: Foundation Building

- Construire un vertical slice : une moto, un événement, sessions, un composant, une intervention/preuve, readiness et partage.
- Définir le schéma canonique et la provenance des données.
- Intégrer une source de calendrier autorisée et un format de session, si les tests l'exigent.
- Piloter une confirmation tiers avec un seul partenaire.
- Tester Pro saison et pack transmission séparément.

**Gate :** répétition d'usage et paiement/engagement hors cercle proche, avec coût de support compatible avec un fondateur solo.

### Phase 3: Scale & Optimization

- Étendre France moto par intégrations et partenaires seulement après répétabilité.
- Ajouter auto si le même noyau événement/composant/preuve fonctionne sans diluer le produit.
- Ouvrir B2B uniquement si la discovery révèle un job identique et un cycle de vente supportable.
- Automatiser acquisition Meta/nanocorp seulement avec événement de conversion, attribution et marge démontrés.

**Gate :** canal répétable et valeur conservée après une saison complète.

---

## 📈 SUCCESS METRICS

### Leading Indicators

- première sortie importée et confirmée ;
- seconde trace connectée sans relance ;
- prochaine action consultée avant le roulage ;
- justificatif ou composant réellement rattaché ;
- dossier partagé à un acheteur ou tiers réel ;
- confirmation partenaire effectuée avec très peu d'interaction ;
- engagement financier ou contractuel explicite.

### Lagging Indicators

- rétention entre deux événements puis entre deux saisons ;
- proportion de machines avec historique assez complet pour être transféré ;
- conversion et marge Pro/pack vente ;
- revenu et support par machine active ;
- effet observé sur délai, négociation ou confiance à la vente — sans promettre une prime de prix avant preuve ;
- acquisition répétable hors réseau personnel.

### Decision Gates

- **Gate problème :** les utilisateurs montrent leurs workarounds et reviennent, au lieu d'approuver poliment.
- **Gate collecte :** l'import assisté bat le tableur sur effort et exactitude.
- **Gate confiance :** un acheteur ou professionnel agit différemment selon le niveau de preuve.
- **Gate monétisation :** argent ou engagement d'un inconnu pour un moment précis de valeur.
- **Gate canal :** partenaires ou contenu apportent des utilisateurs attribuables avant ads automatisées.
- **Gate expansion :** auto ou B2B ne sont ajoutés que si le même ledger résout leur job.

---

## ⚠️ RISKS AND MITIGATION

### Key Risks

1. La cible ne veut pas enregistrer ni regarder le coût.
2. Apex Lines/LookOver/MotoBook ferment rapidement le white space.
3. La provenance ne change aucune décision d'achat.
4. L'usage piste rend le dossier plus inquiétant que rassurant.
5. Une alerte de maintenance est comprise comme garantie.
6. Les partenaires refusent l'intégration ou l'attestation.
7. La saisonnalité détruit la rétention et l'abonnement.
8. Les anciens schémas, secrets et scrapers contaminent la nouvelle base.
9. La marque choisie entre en collision avec des usages existants.

### Mitigation Strategies

- Tester chaque valeur séparément et mesurer le comportement.
- Automatiser la collecte avant d'ajouter des dashboards.
- Montrer sources, règles et incertitudes ; faire valider le langage sécurité.
- Construire export/import ouvert afin de réduire la dépendance partenaires.
- Préférer pack transactionnel ou saisonnier si l'abonnement mensuel ne tient pas.
- Isoler le nouveau code et le nouveau schéma ; renouveler tous secrets historiques.
- Créer un nom dont l'élément dominant n'est pas « Paddock », puis lancer recherche d'antériorité officielle et revue professionnelle avant campagne publique.
- Surveiller trimestriellement prix, features et traction des concurrents proches.

---

_Generated using BMAD Creative Intelligence Suite — Innovation Strategy Workflow_
