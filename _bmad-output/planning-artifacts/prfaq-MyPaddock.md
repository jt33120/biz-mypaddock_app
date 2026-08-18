---
title: "PRFAQ : projet piste — codename MyPaddock"
status: complete
created: 2026-08-16
updated: 2026-08-16
stage: 5
mode: headless-first-draft
public_name: "À définir — MyPaddock est un codename uniquement"
inputs:
  - "planning-artifacts/brownfield-inventory.md"
  - "planning-artifacts/research/market-mypaddock-track-france-2026-08-16/research.md"
  - "../design-thinking-2026-08-16.md"
  - "../innovation-strategy-2026-08-16.md"
---

# Avant le prochain roulage, trois choses à préparer — pas un nouveau carnet à remplir

## Un compagnon pour les propriétaires de motos de piste qui transforme leurs traces de roulage en prochaines actions explicables

_Annonce hypothétique Working Backwards. Le produit n'est pas lancé et son nom public reste à définir._

**Paris, 16 août 2026** — Le projet au codename MyPaddock annonce un pilote privé pour les amateurs réguliers de track day moto en France. Après une sortie, le pilote importe les traces qu'il possède déjà — réservation, reçu, photo ou export de session — confirme ce que sa machine a réellement vécu, puis voit les opérations à vérifier avant le roulage suivant.

Aujourd'hui, la préparation vit entre la mémoire, le manuel, les notes, les factures et parfois un tableur ou une application de chrono. Une réservation prouve qu'une journée était prévue, pas que toutes les sessions ont été roulées. À l'approche de la date suivante, reconstituer heures, pneus, plaquettes, vidange, incidents et pièces déplacées prend du temps et peut laisser des angles morts.

Le compagnon ne remplace ni le chronomètre ni le mécanicien. Il rapproche les traces existantes, demande confirmation lorsque l'usage réel est inconnu et présente les actions avec leur source, leur règle et leur incertitude. Le coût prévu/réel reste facultatif. Les preuves d'entretien peuvent être conservées puis partagées une par une ; l'usage piste détaillé n'est jamais transmis par défaut.

> **Proposition de citation fondateur — à valider :** « Je ne veux pas transformer une journée piste en saisie administrative. Le produit doit m'aider à préparer la suivante avec ce que j'ai déjà produit, et me dire honnêtement ce qu'il ne sait pas. »
> — Julian, porteur du projet

### Comment cela fonctionne

1. Le pilote ajoute sa prochaine journée ou transfère une confirmation de réservation.
2. Après le roulage, il importe un export de session, un reçu ou une photo, ou saisit seulement la mesure utile.
3. Le produit préremplit un brouillon ; le pilote confirme sessions, heures, interventions et composants réellement concernés.
4. L'écran « prochaine sortie » montre au plus trois actions prioritaires et un accès visible aux autres alertes, avec source et incertitude.
5. À la demande, le pilote consulte son coût de saison ou compose un partage limité de ses preuves d'entretien.

_Aucune citation client n'est incluse : aucun test terrain n'a encore produit de témoignage réel._

### Commencer

Le pilote privé commence avec une moto et une sortie récente réelle. La première valeur doit apparaître sans reconstituer tout le garage et en moins d'une minute de confirmation côté utilisateur. Le pilote n'est ouvert qu'après validation du nom public, des règles de données et du protocole de sécurité des rappels.

<!-- coaching-notes-stage-1
Concept commercial, fondateur solo. Le customer initial est une hypothèse de recrutement, pas un segment quantifié. Le concept a été recentré de finance/calendrier/revente vers préparation de la prochaine sortie. Artifact Analyzer : actifs OCR/coûts/maintenance réutilisables, mais nouveau schéma requis. Web Researcher : Apex Lines chevauche fortement la proposition ; aucune WTP française trouvée. MyPaddock est rejeté comme marque publique.
-->

<!-- coaching-notes-stage-2
Rejetés : « passeport qui augmente la valeur », « moto toujours prête », « tout ton paddock dans une app ». Headline retenu sur une conséquence observable et sans claim de sécurité. La citation fondateur est explicitement une proposition ; aucun faux témoignage utilisateur.
-->

---

## FAQ client

### Pourquoi ne pas garder mon tableur, MotoBook, Apex Lines ou LookOver ?

Vous devriez les garder si leur effort vous convient. Le projet n'a de raison d'exister que s'il réduit réellement la saisie entre une sortie et la suivante et s'intègre aux traces déjà utilisées. Apex Lines couvre déjà une grande partie du workflow piste ; MotoBook et LookOver couvrent entretien et preuves. Le pilote comparera ces alternatives sur ses propres données. Si le nouveau flux n'est pas plus rapide ou ne provoque pas une seconde utilisation, il ne sera pas construit.

### Est-ce que l'application me garantit que la moto est sûre ?

Non. Elle ne certifie ni sécurité, ni état mécanique, ni durée de vie restante. Elle affiche des rappels et inspections à partir de règles et de données connues, signale ce qui manque et laisse visibles toutes les alertes critiques. Une décision de sécurité reste celle du pilote et du professionnel compétent.

### Comment peut-elle connaître l'usure si elle ne chronomètre pas mes tours ?

Elle ne la devine pas. Une réservation crée seulement un brouillon. Un export de session, un compteur d'heures, une mesure adaptée ou votre confirmation établit l'usage. Les règles distinguent journée prévue, présence, temps mesuré et donnée déclarée. Une donnée insuffisante ne devient jamais une certitude mécanique.

### Cela va-t-il afficher en permanence combien me coûte la piste ?

Non. Le coût est facultatif et sert une décision précise : budget restant, prévu/réel ou coût par heure. L'accueil reste centré sur la prochaine préparation. Le pilote peut ne jamais activer la vue financière.

### Que partagez-vous lorsque je vends la moto ?

Rien automatiquement. Vous sélectionnez les factures, interventions ou éléments à partager et pouvez masquer données personnelles, événements, incidents ou géolocalisation. Le produit ne promet ni prime de prix ni vente plus rapide. Il ne remplace pas HistoVec, le contrôle technique ou les documents de cession.

### Qu'advient-il de mes données si le service s'arrête ?

Le lancement exige un export lisible de la chronologie, des données structurées et des pièces jointes, ainsi qu'une suppression du compte. La portabilité est une exigence de première version, pas une promesse reportée à plus tard.

### Dois-je activer ma localisation ou partager tous mes trajets ?

Non par défaut. La saisie manuelle et l'import de fichier restent possibles. Une permission ou un traitement de localisation n'est demandé que dans le contexte d'une fonction qui en a besoin, avec la précision minimale. La base juridique, la conservation et le retrait doivent être documentés avant cette fonction.

### Combien cela coûtera-t-il ?

Le prix n'est pas validé. Le test comparera gratuit limité, essai puis paiement, et une offre annuelle à 29 € puis 39 €. Ces montants sont des cellules expérimentales inspirées de prix concurrents, pas une grille annoncée. Aucun abonnement ne sera fixé sans usage répété et paiement réel hors cercle proche.

### Est-ce disponible pour l'auto, les teams ou les loueurs ?

Pas dans le pilote B2C. L'auto viendra seulement si le même noyau de données fonctionne sans diluer le produit. Loueurs et écoles font l'objet d'une discovery séparée, car leurs besoins d'état départ/retour, rôles, stock et disponibilité créeraient un autre produit.

### Sur quels téléphones et avec quels chronos cela fonctionne-t-il ?

La première expérience sera mobile-first et choisira le format le moins coûteux à tester, probablement web/PWA. Un seul format d'import de session sera retenu après observation des outils réels. Android, iOS natif et intégrations supplémentaires restent des décisions post-validation.

<!-- coaching-notes-stage-3
Launch blockers : frontière explicite entre brouillon/usage/preuve ; visibilité des alertes non retenues dans les « trois actions » ; export/suppression ; aucune transmission automatique. Faible confiance : prix, formats d'import, forme PWA/native, valeur du partage vente. Accepted trade-off : coût et revente secondaires, auto hors pilote.
-->

---

## FAQ interne

### Pourquoi ce produit devrait-il exister alors qu'Apex Lines couvre presque la proposition ?

Il ne le devrait pas si « France + Android + interface plus simple » reste le seul écart. L'hypothèse testable est plus exigeante : importer les traces réellement utilisées en France, confirmer l'usage en moins d'une minute et transformer ce flux en prochaine action explicable. Le test doit battre Apex Lines, MotoBook, LookOver et un tableur sur effort et seconde action. Sinon, le concept B2C est arrêté ou repositionné.

### Quel est le problème le plus difficile : la technique ou le comportement ?

Le comportement. OCR, chronologie, règles et graphiques existent en partie dans le brownfield. Ce qui manque est la preuve qu'un pilote confiera ses traces, confirmera l'usage puis reviendra avant la sortie suivante. La technique difficile arrive ensuite : règles multi-horloges sûres, provenance, données locales et imports robustes.

### Que réutilise-t-on de l'ancien MyPaddock ?

Des composants et savoir-faire : garage, reçus/OCR, coûts, maintenance, documents et visualisations. On ne reprend pas l'architecture comme base canonique : schémas divergents, migrations incomplètes, simulations présentées comme IA, risques de secrets et scrapers non licenciés imposent un nouveau schéma et une application isolée. Les secrets historiques sont renouvelés.

### Quelle est la première version réellement construisible ?

Un vertical slice : une moto, un événement, un usage confirmé, un composant, une intervention/preuve et une vue de prochaine action. OCR et imports peuvent être opérés manuellement en Wizard of Oz. Aucun chrono, checkout, marketplace, réseau social, cote, scraping, assurance ou auto.

### Comment obtient-on les premiers utilisateurs sans publicité ?

Par dogfooding réel, observation de pilotes inconnus recrutés via circuits, clubs ou organisateurs, puis liens/QR partenaires autorisés. Le signal demandé est un artefact réel puis une seconde action, pas une inscription. Aucun partenaire n'est considéré acquis : les échanges polis antérieurs ne valent pas validation.

### NanoCorp peut-il rendre le produit « full IA » et résoudre l'acquisition ?

Non. NanoCorp peut automatiser une exécution marketing, mais l'offre publique coûte 30 $/mois et les ads 15–150 $/jour en plus ; elle est incompatible avec le plafond externe actuel de 0 €. Le service utilise sa propre infrastructure Meta, ne publie pas de CAC/ROAS indépendant et impose contractuellement une revue humaine. Il ne sera testé qu'après activation, répétition, paiement et attribution mesurés hors de sa plateforme.

### À quoi ressemblent les unit economics possibles ?

Ils sont inconnus. À 39 €/an, 1 000 abonnés produiraient 39 000 € de revenu brut annuel avant taxes, frais, support, stockage, OCR et acquisition ; ce calcul n'est pas une prévision. Une commission booking de 5–7 % ne produit que 6,45–23,10 € brut sur les billets observés de 129–330 € avant autres coûts. Le France-only B2C doit donc prouver une distribution très efficace ou être complété plus tard par Europe/B2B, sans présumer l'un ou l'autre.

### Le B2B loueur/école est-il une meilleure entreprise ?

Peut-être, pas encore. Locations à 420–550 €/jour, cautions et pneus rendent disponibilité et état potentiellement quantifiables. Mais aucun budget, outil actuel, coût d'immobilisation ou volonté de payer n'a été observé. Il faut suivre le reconditionnement de deux types d'opérateurs et demander un pilote engageant avant de concevoir stock, rôles ou flotte.

### Quelle est la moat ?

Il n'y en a aucune aujourd'hui. Les candidats futurs sont les intégrations autorisées, un modèle de données piste/composant bien exécuté, l'historique portable et une distribution partenaire active. Tous sont copiables et non validés. L'IA n'est pas une moat.

### Quelles contraintes juridiques changent le scope ?

Pas de scraping Leboncoin sans autorisation écrite. HistoVec reste partagé par le titulaire. Les flux de paiement sont qualifiés avant encaissement pour tiers et passent par un PSP adapté. L'assurance reste une mise en relation strictement bornée tant qu'aucun partenaire/régime approprié n'est en place. Géolocalisation et SDK non essentiels exigent minimisation, information et base juridique adaptées.

### Pourquoi ne pas publier sous MyPaddock ou MyPadock ?

Oracle Red Bull Racing exploite exactement MyPaddock ; PaddockPro et ThePaddock sont déjà des produits track-day et « Paddock » est encombré en motorsport. Ce constat suffit à garder MyPaddock comme codename. Une shortlist avec un élément dominant distinctif devra passer les recherches officielles INPI/TMview/EUIPO et une revue professionnelle avant exposition publique.

### Qu'est-ce qui tue le concept ?

Un des signaux suivants : les pilotes refusent de fournir une trace réelle ; le flux prend autant de temps que leur système actuel ; aucune seconde action n'a lieu ; personne ne paie après avoir reçu la valeur ; les imports autorisés sont indisponibles ; les rappels ne peuvent être formulés sans risque de fausse assurance ; ou le B2B exige un produit sans noyau commun. Les seuils exacts sont fixés dans le plan de validation, pas inventés après les résultats.

<!-- coaching-notes-stage-4
Plus grand inconnu : comportement répété et paiement, non faisabilité. Aucun moat actuel. Scénarios économiques arithmétiques seulement. Priorité technique : nouveau schéma canonique et frontière de confiance. Priorité commerciale : comparer B2C readiness et B2B loueur/école. Naming et dépendances NanoCorp sont des blockers avant campagne, pas avant prototype privé.
-->

---

## Le verdict

### Concept strength : needs more heat

Le concept est devenu précis et falsifiable. Sa partie la plus solide n'est ni la finance, ni le calendrier, ni la revente : c'est **préparer la prochaine sortie à partir d'un usage confirmé, avec moins d'une minute de saisie et sans prétendre certifier la sécurité**. Cette formulation mérite un prototype.

Elle ne mérite pas encore un PRD de construction complète. Le marché valide l'existence des workflows et de nombreux concurrents, mais pas le choix du job dominant, la répétition, le prix ou une défense. Le produit est donc prêt pour une validation comportementale, pas pour un lancement.

### Forgé dans l'acier

- frontière claire entre réservation, usage confirmé, recommandation et preuve ;
- exclusions de scope cohérentes avec concurrence, risque et capacité d'un fondateur solo ;
- coût facultatif et partage sélectif, qui respectent les contradictions observées ;
- patrimoine brownfield utile à un prototype, sans obligation d'hériter de l'ancienne architecture ;
- critères honnêtes : seconde action et paiement, pas clic ou compliment.

### Besoin de plus de chauffe

- comparer capture, readiness et coût au lieu de supposer qu'ils forment déjà un produit ;
- mesurer le temps de confirmation acceptable et le type de trace réellement fourni ;
- choisir PWA/native et un premier import seulement après observation ;
- tester 29 € puis 39 € avec argent réel ;
- comparer B2C propriétaire et B2B loueur/école sur le même noyau de données.

### Fissures dans les fondations

- Apex Lines et d'autres produits rendent l'écart fonctionnel étroit et temporaire ;
- aucune donnée ne dimensionne honnêtement les pilotes français répétiteurs ;
- aucun utilisateur inconnu n'a encore répété ni payé ;
- les rappels mécaniques créent une attente de confiance disproportionnée au prix ;
- le bénéfice de revente peut être nul ou adverse selon l'information divulguée ;
- MyPaddock n'est pas un nom public exploitable sans risque commercial manifeste et clearance juridique.

### Ce qu'il faut pour passer au PRD

Un concept seulement passe : celui qui obtient, hors cercle proche, des traces réelles, une seconde action à la sortie suivante et des engagements financiers selon des seuils fixés avant le test. En parallèle, au moins un loueur/école doit accepter de montrer son flux réel avant qu'une option B2B soit retenue. Sans cela, le bon résultat est d'arrêter avant de reconstruire l'application.

<!-- coaching-notes-stage-5
Verdict needs-heat. Le PRFAQ remplace l'ancien concept tout-en-un par une hypothèse de readiness. Ne pas confondre document achevé et validation produit. Prochaine consommation recommandée : plan de validation puis product brief de décision ; PRD seulement après gates comportementaux.
-->

_Généré avec BMAD Working Backwards PRFAQ. Première version autonome : toutes les hypothèses et citations proposées exigent revue du porteur, et aucun témoignage utilisateur n'a été fabriqué._
