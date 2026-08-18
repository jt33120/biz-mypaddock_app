---
title: "Design Thinking — MyPaddock Track"
status: complete-first-draft
mode: autonomous-first-draft
evidence_note: "Les comportements utilisateurs restent à valider par observation et entretiens ; aucune hypothèse n'est présentée comme feedback réel."
created: 2026-08-16
updated: 2026-08-16
---

# Design Thinking : MyPaddock Track

**Date :** 16 août 2026  
**Facilitateur :** Julian avec BMAD/Codex  
**Design Challenge :** rendre la gestion d'une machine de piste utile au pilote sans transformer sa passion en travail administratif.

---

## 🎯 Design Challenge

### Formulation du défi

Concevoir pour le pratiquant français de track day moto — puis auto — une expérience qui transforme presque sans saisie chaque roulage, reçu et intervention en trois résultats utiles : **machine prête**, **saison lisible à la demande** et **preuves d'entretien partageables sélectivement**.

Le produit doit résoudre la tension centrale observée dans le cadrage : le pilote a besoin de suivre l'usure et les opérations coûteuses, mais peut refuser un outil qui lui rappelle constamment combien coûte sa passion. La valeur ne peut donc pas dépendre d'un journal comptable laborieux. Elle doit apparaître dans le flux naturel du roulage : importer, scanner, confirmer, recevoir une alerte ou partager un récapitulatif.

### Utilisateurs et parties prenantes

- Utilisateur primaire initial : amateur régulier de piste moto qui possède et entretient sa machine, transporte son matériel et revend périodiquement motos ou pièces.
- Utilisateurs secondaires à étudier séparément : novice préparant ses premières journées, pratiquant auto, atelier spécialisé, loueur ou école disposant d'un parc.
- Tiers de confiance potentiels : organisateur de roulage, atelier, vendeur de pièces ou acheteur d'occasion.

### Contraintes de conception

- France d'abord, moto d'abord ; auto seulement si le même noyau de données et d'usage tient.
- Fondateur solo assisté par IA, zéro dépense externe imposée pour le cadrage actuel.
- Réutiliser les actifs brownfield sans hériter de leur schéma, de leur sécurité ou de leurs scrapers non licenciés.
- Ne pas refaire en V1 un chronomètre, un réseau social, un agrégateur de dates ou une marketplace complète.
- Ne pas prétendre qu'un dossier auto-déclaré est « officiel » ou qu'une recommandation IA garantit la sécurité mécanique.
- Ne jamais convertir une inscription ou une présence en usure certifiée : elle préremplit un brouillon que le pilote confirme avec une mesure adaptée.
- Ne pas transférer par défaut le détail de l'usage piste, de la géolocalisation ou des incidents ; le propriétaire choisit chaque preuve divulguée.
- Respecter la minimisation des données et rendre toute géolocalisation ou télémétrie optionnelle.
- Traiter « MyPaddock » comme codename uniquement : Red Bull Racing utilise exactement ce nom et plusieurs produits track-day sont dominés par « Paddock ».

### Ce que « réussir » veut dire pour l'utilisateur

Après une journée piste, le pilote peut mettre à jour sa machine en moins d'une minute ou sans saisie manuelle, savoir l'action réellement due avant la prochaine sortie, comprendre son coût de saison lorsqu'il le souhaite et transmettre un historique intelligible lors de la vente. Le produit ne sera considéré comme utile qu'après observation de comportements réels ; une opinion positive ou un clic publicitaire ne suffira pas.

---

## 👥 EMPATHIZE: Understanding Users

### Méthodes retenues

Les méthodes les plus adaptées sont :

1. **Entretiens sur preuves** : faire raconter la dernière sortie en manipulant factures, captures, notes et pièces, sans demander si « l'idée est bonne ».
2. **Shadowing** : observer chargement, arrivée au circuit, changements de pneus/plaquettes, retour et préparation suivante.
3. **Diary study courte** : pendant deux sorties consécutives, capturer les événements au moment où ils surviennent plutôt qu'après coup.
4. **Journey mapping** : suivre une saison depuis le choix des dates jusqu'à la revente de la machine.
5. **Empathy mapping** : consolider seulement après les observations, en séparant paroles, comportements et inférences.

### User Insights

La recherche secondaire soutient cinq signaux, sans en mesurer encore la prévalence :

- l'offre d'un organisateur combine dates, formats, prix, options, restrictions et parfois transport ; préparer une saison dépasse donc la simple recherche d'une date ;
- l'usage piste/intensif pousse certains pratiquants à raisonner en heures, sorties et consommables plutôt qu'en kilométrage routier ;
- notes téléphone, carnets, reçus, manuels, classeurs, tableurs et applications coexistent ; la fragmentation est un comportement observable ;
- certains vendeurs/acheteurs valorisent un dossier d'entretien, d'autres déclarent n'y accorder aucune valeur : le bénéfice de revente est **disputé** ;
- plusieurs utilisateurs veulent suivre l'entretien sans suivre tous leurs trajets ou leur carburant : le produit ne doit pas imposer un quantified-self généraliste.

### Key Observations

- L'unité naturelle d'usage est probablement la **sortie** : elle déclenche coûts, usure, preuves et prochaine préparation.
- La fréquence d'ouverture ne doit pas dépendre d'une saisie quotidienne ; le produit doit pouvoir rester silencieux entre deux sorties.
- Le pilote dispose déjà de preuves brutes — email de réservation, facture, photo, reçu, chrono exporté — mais pas d'un récit structuré de la vie de la machine.
- Une attestation tierce peut augmenter la crédibilité, mais un organisateur ne connaît pas forcément les sessions réellement roulées et un atelier produit déjà devis, ordre de réparation et facture. L'incrément de confiance reste non prouvé.
- Montrer l'usage piste à un acheteur peut rassurer sur l'entretien ou l'inquiéter sur l'usure. Cette contradiction doit être testée avant toute promesse commerciale.

### Empathy Map Summary — hypothèses à confronter

| Dimension | Hypothèse actuelle | Preuve à rechercher |
|---|---|---|
| Dit | « Je sais globalement ce que je dois faire » ou « je garde les factures » | Verbatim brut pendant entretien sur la dernière sortie |
| Pense | Une panne ou un oubli ruinerait la prochaine journée ; compter tout le hobby peut enlever du plaisir | Décisions et arbitrages réels observés, pas opinion abstraite |
| Fait | Réserve chez plusieurs organisateurs, stocke des preuves dispersées, entretient selon expérience/manuel/conseils | Capture d'écran, facture, carnet, checklists, séquence filmée/observée |
| Ressent | Excitation avant la sortie, stress logistique/mécanique, fierté du setup, ambivalence face au coût | Journal émotionnel aux moments clés |

**Limite actuelle :** aucune de ces lignes ne constitue encore un verbatim utilisateur français recueilli dans ce workflow.

---

## 🎨 DEFINE: Frame the Problem

### Point of View Statement

Le pistard moto amateur qui roule plusieurs fois par saison a besoin que la vie mécanique et financière de sa machine se reconstruise à partir des traces qu'il produit déjà, parce qu'il ne veut ni oublier une opération critique ni tenir une comptabilité qui transforme sa passion en corvée.

### How Might We Questions

- Comment pourrions-nous transformer une réservation, un reçu et une session en historique utile avec une seule confirmation ?
- Comment pourrions-nous dire « prêt pour la prochaine sortie » sans prétendre certifier la sécurité de la machine ?
- Comment pourrions-nous compter pour le pilote uniquement lorsqu'il veut connaître ou partager le coût, sans moraliser sa dépense ?
- Comment pourrions-nous rendre l'entretien DIY crédible sans présenter l'auto-déclaration comme une preuve officielle ?
- Comment pourrions-nous faire du dossier de revente un sous-produit naturel de l'usage, et non une tâche créée au moment de vendre ?
- Comment pourrions-nous obtenir une attestation d'organisateur ou d'atelier sans leur imposer un back-office supplémentaire ?
- Comment pourrions-nous intégrer les outils déjà adoptés — réservation, chrono, email, photo — au lieu de les remplacer ?

### Key Insights

1. **Le vrai adversaire est la saisie**, plus que l'absence de fonctionnalité.
2. **Readiness est une valeur immédiate ; provenance est une valeur différée.** La première peut créer l'habitude qui alimente la seconde.
3. **Le coût doit être révélable, pas omniprésent.** Un récapitulatif volontaire et partageable peut être plus désirable qu'un dashboard anxiogène.
4. **La crédibilité a des degrés.** Déclaration, preuve jointe, confirmation d'un professionnel et transfert doivent rester visuellement distincts.
5. **Le bundle reste une hypothèse.** Maintenance, saison/coût et revente doivent être testés séparément avant d'être vendus ensemble.

---

## 💡 IDEATE: Generate Solutions

### Selected Methods

- **SCAMPER** pour retirer la saisie et recombiner les traces déjà disponibles.
- **Analogous Inspiration** en empruntant au carnet de santé, au journal Git et aux récapitulatifs annuels partageables.
- **Provotype Sketching** pour tester les versions extrêmes : tout compter, ne rien compter, tout certifier, ne rien montrer.
- **Crazy 8s** pour varier l'écran de première valeur avant de figer une architecture.

### Generated Ideas

1. Transférer l'email de réservation pour créer automatiquement la sortie.
2. Scanner le QR de check-in organisateur pour confirmer la présence.
3. Importer une session RaceChrono/GPX/CSV au lieu de refaire le chronomètre.
4. Scanner un reçu et proposer pièce, montant, date, véhicule et événement à confirmer.
5. Dicter une note vocale dans le paddock ; l'IA la transforme en intervention structurée.
6. Photographier une pièce montée/démontée pour horodater son cycle de vie.
7. Déplacer en un geste un jeu de pneus ou une pièce d'une moto à une autre.
8. Compter automatiquement journées, sessions, heures moteur et cycles thermiques à partir des événements importés.
9. Présenter une carte « prêt pour la prochaine sortie » avec actions dues et incertitudes visibles.
10. Créer une checklist véhicule + remorque + équipement, clonable par circuit ou météo.
11. Fonctionner hors connexion dans le paddock et synchroniser plus tard.
12. Envoyer un rappel seulement lorsqu'une prochaine date rend une opération pertinente.
13. Calculer un budget prévisionnel d'événement : entrée, assurance, pneus, carburant, transport et hôtel.
14. Afficher le coût réalisé seulement sur demande, jamais comme écran d'accueil imposé.
15. Produire un « Season Wrapped » ludique : journées, circuits, meilleurs souvenirs, pièces consommées et coût facultatif.
16. Générer une carte partageable « coût par journée » ou « coût par tour » avec contrôle de confidentialité.
17. Comparer budget prévu et réel sans jugement ni objectifs financiers moralisateurs.
18. Permettre à un atelier de tamponner numériquement une intervention sans créer de compte complet.
19. Permettre à un organisateur de confirmer une présence par lot ou webhook, sans gérer la maintenance.
20. Distinguer visuellement quatre niveaux : déclaré, justificatif joint, tiers confirmé, source officielle liée.
21. Générer un pack de vente PDF/web : chronologie, interventions, factures choisies, CT et lien HistoVec.
22. Transférer le dossier au nouvel acheteur tout en masquant les données personnelles du vendeur.
23. Offrir une vue acheteur centrée sur les trous, incohérences et preuves, sans « score magique ».
24. Créer une carte publique temporaire de la machine, révocable après la vente.
25. Laisser essayer une moto locale sans compte avant de synchroniser.
26. Fournir aux loueurs/écoles un tableau de flotte par heures, sorties, consommables et indisponibilité.
27. Grouper les dépenses partagées d'un paddock — box, transport, hébergement — sans devenir une app bancaire.
28. Générer une liste d'achat de consommables puis rediriger vers des partenaires clairement identifiés.
29. Importer volontairement un rapport HistoVec fourni par le propriétaire sans automatiser son accès.
30. Proposer un mode « preuves seulement » pour l'utilisateur qui refuse tout suivi financier.

### Top Concepts to Prototype Separately

#### Concept A — Capture de sortie quasi automatique

L'utilisateur transfère une réservation ou choisit un circuit, puis confirme après la journée les sessions et dépenses préremplies. Hypothèse testée : la réduction de saisie suffit à créer une habitude.

#### Concept B — Prêt pour la prochaine

Une vue unique relie prochaine date, usage accumulé, consommables et actions dues, en signalant ce qui manque au lieu de prétendre certifier la sécurité. Hypothèse testée : la readiness déclenche une valeur récurrente plus forte que le dashboard financier.

#### Concept C — Partage sélectif de preuves d'entretien

La chronologie se construit pendant l'usage, puis le propriétaire compose un pack où chaque entrée indique sa source et son niveau de preuve. Les événements, incidents, trajets et données privées ne sont jamais transmis automatiquement. Hypothèse testée : le partage de preuves d'entretien change réellement le comportement du vendeur ou de l'acheteur sans créer une décote liée à la divulgation de l'usage piste.

Le « Season Wrapped » sera testé comme **mécanisme d'acquisition/réactivation**, pas présumé comme produit payant.

---

## 🛠️ PROTOTYPE: Make Ideas Tangible

### Prototype Approach

Combiner **storyboard**, **prototype papier/cliquable** et **Wizard of Oz**. L'objectif n'est pas de prouver que l'équipe sait coder, mais d'observer si un pilote donne spontanément les traces nécessaires et revient chercher une décision.

### Prototype Description

Un prototype mobile de cinq écrans, alimenté manuellement en coulisses à partir des documents réels du testeur :

1. **Prochaine sortie** — événement importé depuis un email ou saisi en quelques champs.
2. **Machine prête ?** — trois actions maximum, sources et incertitudes visibles.
3. **Ajouter ce qui s'est passé** — suggestions issues des reçus/photos/notes, confirmées en un geste.
4. **Ma saison** — chronologie et coût facultatif, avec une carte partageable.
5. **Partager pour vendre** — aperçu des preuves sélectionnées, des éléments masqués et des niveaux de confiance.

Le traitement OCR, l'import calendrier et la génération des alertes peuvent être opérés manuellement pendant le test. Aucun compte, paiement, marketplace, scraping ou chronomètre n'est nécessaire.

### Key Features to Test

- compréhension immédiate des trois concepts sans explication ;
- acceptation de transférer un email, scanner un reçu ou importer une session ;
- temps et erreurs pour confirmer une sortie ;
- confiance dans une alerte qui expose ses données et ses limites ;
- désir réel d'ouvrir la vue coût/saison ;
- réaction vendeur et acheteur aux niveaux de preuve ;
- valeur perçue d'une confirmation atelier/organisateur ;
- préférence entre paiement annuel, pack de vente, offre atelier ou absence de paiement.

---

## ✅ TEST: Validate with Users

### Testing Plan

Tester séparément, sans mélanger les rôles :

- 5 à 7 pistards moto réguliers ;
- 5 novices ayant une première ou deuxième journée prévue ;
- 5 vendeurs récents et 5 acheteurs potentiels de motos piste ;
- 3 à 5 ateliers spécialisés ;
- 3 à 5 organisateurs ;
- un échantillon exploratoire de loueurs/écoles, uniquement après vérification de leur workflow réel.

Chaque séance utilise le dernier roulage ou la dernière vente réelle de la personne. Les tâches : importer une sortie, faire entrer une intervention, décider quoi préparer, consulter ou ignorer le coût, puis partager/évaluer un dossier de vente. Le facilitateur observe sans aider et enregistre hésitations, abandons, éléments refusés et preuves réellement fournies.

Les tests de prix demandent un engagement : précommande remboursable, réservation de pilote, import de données ou accord écrit de pilote partenaire. « Ça pourrait être utile » est enregistré comme absence d'engagement.

### User Feedback

**Non acquis à ce jour.** Les avis d'organisateurs déjà rapportés — utilité possible mais refus de « compter » une passion — sont un signal de cadrage, pas une validation. Aucun faux verbatim ni résultat de test n'est ajouté.

### Key Learnings attendus

Le test doit permettre de répondre, sans score composite :

1. Quel concept provoque une action sans incitation : capture, readiness ou transmission ?
2. Quelle trace les utilisateurs acceptent-ils réellement de connecter ?
3. La vue coût crée-t-elle curiosité, évitement ou rétention ?
4. Quels niveaux de preuve changent une décision d'achat ?
5. Quel tiers accepte de confirmer quoi, avec quel effort et quel bénéfice ?
6. Qui est le payeur naturel : pilote, vendeur, atelier, organisateur ou opérateur de flotte ?

---

## 🚀 Next Steps

### Refinements Needed

- Remplacer les intervalles routiers par un modèle multi-horloges : date, kilomètres, heures, sessions, journées et cycles.
- Faire de la provenance un graphe de preuves, pas un score opaque.
- Rendre le coût optionnel dans l'expérience tout en le conservant comme donnée exploitable.
- Définir précisément ce que « prêt » veut dire : rappel fondé sur données connues, jamais certificat mécanique.
- Garder calendrier/booking en deep-link ou import autorisé tant qu'une valeur propre n'est pas démontrée.

### Action Items

1. Recruter les cohortes avec un dernier événement ou une vente réelle.
2. Construire le prototype cinq écrans avec trois propositions testées séparément.
3. Préparer le protocole anti-politesse et les formulaires de consentement/minimisation.
4. Opérer manuellement les imports et alertes pendant les tests.
5. Archiver les verbatims bruts, les comportements et les engagements sans reformulation.
6. Choisir le wedge uniquement après comparaison des comportements observés.

### Success Metrics

- majorité des testeurs cible atteignant la première valeur sans assistance ;
- confirmation d'une sortie en moins d'une minute dans le prototype ;
- retour spontané ou second import sans relance ;
- pièces justificatives réellement connectées, pas seulement intention déclarée ;
- décision de maintenance influencée par la vue readiness sans confusion sur sa portée ;
- preuves consultées par des acheteurs et information utilisée dans leurs questions/offres, en mesurant aussi refus, décote ou inquiétude déclenchés ;
- au moins un type de payeur acceptant un engagement monétaire ou contractuel ;
- zéro donnée obligatoire qui ne soit nécessaire au job testé.

### Décision de cycle

Le workflow n'autorise pas encore la convergence vers un MVP unique. La prochaine itération est un **test comparatif de trois concepts**, suivi du PRFAQ sur le concept qui provoque le comportement le plus fort. En attendant, le PRFAQ produit dans ce dossier sera explicitement une première version à hypothèses, pas une validation utilisateur.

---

_Generated using BMAD Creative Intelligence Suite — Design Thinking Workflow_
