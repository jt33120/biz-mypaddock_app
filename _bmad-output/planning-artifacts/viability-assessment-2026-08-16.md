---
title: "Audit de viabilité — projet piste (codename MyPaddock)"
status: complete
verdict: verifier
created: 2026-08-16
updated: 2026-08-16
evidence_base:
  - "planning-artifacts/brownfield-inventory.md"
  - "planning-artifacts/research/market-mypaddock-track-france-2026-08-16/research.md"
  - "planning-artifacts/prfaq-MyPaddock.md"
  - "planning-artifacts/briefs/brief-MyPaddock-2026-08-16/brief.md"
---

# Audit de viabilité — projet piste

## Verdict : VÉRIFIER

Le projet mérite un test sérieux, mais pas encore un développement complet ni un lancement. La catégorie est réelle, les parcours d'usage existent et le patrimoine MyPaddock réduit fortement le coût de prototypage. En revanche, les trois preuves qui transforment une bonne idée en entreprise manquent encore : **usage répété, paiement et canal reproductible**.

La version viable à tester n'est pas « l'application financière des journées piste » ni « le passeport qui augmente la revente ». C'est :

> **Après chaque roulage, confirme ce que ta moto a réellement vécu et vois ce qu'elle demande avant le prochain.**

Le coût de saison est facultatif. Les preuves d'entretien sont conservées, puis partagées sélectivement. Le B2B destiné aux loueurs et aux écoles reste une piste exploratoire subordonnée, et non un second produit minimum viable.

## Pourquoi ce n'est ni un GO ni un abandon

### Ce qui justifie de continuer

- Le fondateur connaît le contexte piste et peut tester sur de vraies machines et sorties.
- Le brownfield contient déjà garage, OCR, factures, coûts, maintenance, documents et visualisations.
- Des produits actifs confirment que sessions, heures, cycles, préparation et historique sont des parcours compréhensibles.
- L'angle « prochaine action à partir d'un usage confirmé » est beaucoup plus précis et testable que l'ancien gestionnaire financier.
- Le produit minimum peut être simulé à coût externe nul avant toute nouvelle architecture.
- Les loueurs/écoles exposent des actifs et consommables dont l'indisponibilité est potentiellement quantifiable.

### Ce qui interdit de conclure maintenant

- Aucun utilisateur français inconnu n'a encore fourni ses vraies traces, répété l'action ou payé.
- Apex Lines recouvre déjà presque toute la proposition fonctionnelle ; la simplicité et la localisation restent des hypothèses.
- Le nombre de pratiquants réguliers et leur fréquence ne sont pas publiquement dimensionnés.
- Les substituts gratuits sont suffisants pour certains pilotes.
- Les rappels mécaniques créent une exigence de confiance et de responsabilité élevée.
- La revente n'est pas un bénéfice uniforme ; divulguer le circuit peut être défavorable.
- Aucun partenaire organisateur, atelier ou loueur n'a pris d'engagement vérifiable.
- Le nom MyPaddock est commercialement encombré et ne doit pas être utilisé publiquement.

## Tableau de viabilité

| Dimension | État | Lecture |
|---|---|---|
| Adéquation fondateur–problème | Plausible, non prouvée | Connaissance du contexte et capacité de test sur ses propres machines ; recrutement de personnes sans lien préalable et d'opérateurs à démontrer. |
| Existence du parcours d'usage | Favorable | Concurrents et solutions de remplacement le confirment. |
| Intensité du problème | Inconnue | Aucun terrain primaire ni fréquence mesurée. |
| Taille atteignable France | Inconnue | Entonnoir FFM visible, personnes uniques et pratiquants réguliers non dédupliqués. |
| Différenciation | Fragile | Écart possible sur l'effort, les intégrations françaises et la confiance ; aucun avantage défendable. |
| Volonté de payer B2C | Absente | Prix concurrents observés, aucun paiement pour ce concept. |
| Économie B2B | Plausible, non prouvée | Actifs coûteux, mais aucun parcours, budget ou achat observé. |
| Canal organique/partenaire | Plausible, non prouvé | Les organisateurs donnent un point d'accès, aucun accord n'est acquis. |
| Acquisition payante | Prématurée | Aucun événement de conversion ni valeur vie client ; NanoCorp est incompatible avec 0 € aujourd'hui. |
| Faisabilité technique | Favorable avec réserves | Composants disponibles ; nouveau schéma, sécurité et règles explicables requis. |
| Conformité | Gérable par le périmètre | Éviter l'extraction automatisée, l'encaissement pour tiers et l'assurance réduit fortement le risque initial. |
| Nom | Bloqué pour exposition publique | Nouveau nom distinctif et vérification de disponibilité requis. |

## Économie : ce que les nombres disent réellement

Les scénarios ci-dessous sont de simples calculs de revenu brut, et non des prévisions ou des calculs de marge.

| Modèle | Volume | Revenu brut annuel |
|---|---:|---:|
| B2C Pro | 500 × 39 €/an | 19 500 € |
| B2C Pro | 1 000 × 39 €/an | 39 000 € |
| B2C Pro | 3 000 × 39 €/an | 117 000 € |
| B2B | 10 × 99 €/mois | 11 880 € |
| B2B | 50 × 99 €/mois | 59 400 € |
| B2B | 100 × 99 €/mois | 118 800 € |
| Réservation | 1 000 × 200 € × 6 % | 12 000 € |

À 1 000 abonnés, 39 000 € bruts ne suffisent pas à rémunérer le fondateur. La contribution annuelle par abonné doit être calculée comme suit : `prix hors taxes − commission de boutique ou frais de paiement − remboursements − OCR/inférence − stockage − assistance variable`. Le seuil de rentabilité devient : `(coûts fixes + rémunération cible du fondateur) ÷ contribution unitaire`. TVA, attrition, assurance, conformité, acquisition et capacité d'assistance restent inconnues ; aucune conclusion de rentabilité n'est donc possible aujourd'hui.

Un B2C français à bas prix exige une pénétration élevée et un service presque autonome. L'Europe, un B2B répétable ou leur combinaison ne deviennent des options qu'après validation séparée. La réservation rémunérée n'est pas un raccourci démontré.

## Offre et positionnement à tester

### B2C — « Prêt pour la prochaine »

**Promesse :** « Envoie les traces de ta dernière sortie. Confirme ce que la moto a vécu. Repars avec trois opérations à vérifier avant la prochaine. »

**Moment de valeur :** juste après un roulage et avant le suivant.

**Prix test :** 29 € et 39 € par an, proposés au même moment à des cohortes comparables. L'échantillon ne servira pas à déclarer un prix gagnant ; il teste seulement si l'offre standard obtient des paiements aux deux niveaux.

**Ce qui n'est pas vendu :** chrono, certification, sécurité garantie, cote, augmentation de valeur ou comptabilité obligatoire.

### B2B — « Remettre chaque moto disponible pour la prochaine journée »

**Promesse exploratoire :** pour chaque moto, relier la journée ou la session, l'état avant et après, les consommables, les interventions, le responsable et la disponibilité.

**Profil à investiguer d'abord :** opérateur qui loue directement au moins cinq motos de piste et les reconditionne entre deux journées. Une école n'entre dans la cohorte que si elle suit exactement ce flux ; atelier généraliste et équipe de compétition sont exclus.

**Prix de test :** 79 € HT pour trente jours de service pilote, puis 79 € HT par mois en continuation, fixés avant les entretiens. Ce prix est une règle expérimentale issue des repères concurrents, pas une volonté de payer observée.

## Protocole de validation à coût externe nul

Les seuils sont des règles internes d'investissement, jamais des références sectorielles. Avant le premier contact, un registre horodaté fixe la population, les quotas, les scripts, les effets minimaux utiles, les dénominateurs, les intervalles d'incertitude à publier, les exclusions et les dates de clôture. Le plan autorise un pilote exploratoire puis une seule réplication indépendante avec une cohorte entièrement nouvelle. Un changement matériel de proposition exige un nouveau brief ; il ne remet pas les compteurs à zéro.

« Zéro coût externe » signifie zéro média, zéro outil payant et aucun déplacement dédié. Les commissions prélevées sur les paiements sont déduites des recettes. Toutes les heures, les frais déjà engagés, les déplacements mutualisés et l'aide professionnelle gratuite sont néanmoins valorisés dans le registre économique. Le test dispose d'un plafond interne de **160 heures fondateur sur douze semaines actives** pour le B2C et de **40 heures** pour l'exploration B2B. Dépasser un plafond est un résultat négatif, pas une raison de prolonger.

### Étape 0 — accès, sécurité et données

1. **Accès B2C :** journaliser jusqu'à 75 invitations admissibles pendant quatre semaines, leurs canaux, réponses et refus. Constituer un groupe de 15 participants sans lien préalable avec le fondateur, à parts égales selon leur fréquence des douze derniers mois : 1–2, 3–5 et 6 journées ou plus. Diversifier les niveaux d'expérience et les canaux de recrutement ; aucun contact personnel ne compte.
2. **Accès B2B :** identifier un seul profil — opérateur louant directement au moins cinq motos de piste et les reconditionnant entre deux journées — puis journaliser jusqu'à 30 approches pour obtenir cinq observations. L'échec de recrutement est un échec d'accès, pas une absence de problème.
3. **Sécurité avant essai :** utiliser seulement des règles issues de documents du constructeur ou saisies par le propriétaire. Aucun conseil mécanique réel n'est envoyé avant l'examen du corpus et sa validation humaine par un professionnel qualifié. À défaut d'obtenir cette revue sans dépense, tester uniquement le parcours avec des cas fictifs ou sans formuler de recommandation exécutable.
4. **Données avant collecte :** documenter chaque champ, la finalité, la base juridique, les masquages, les personnes autorisées, les éventuels fournisseurs OCR/inférence, le retrait, l'incident et la suppression vérifiable. Les fichiers bruts sont supprimés au plus tard trente jours après l'entretien final ; les sauvegardes le sont sous trente jours supplémentaires.
5. **Nom :** toute interaction avec un participant, une communauté ou un partenaire constitue une exposition externe. Employer une identité neutre telle que « Projet piste » jusqu'au choix et à la vérification du nom.

### Étape 1 — comparaison directe

Comparer le concept au système actuel et à Apex Lines sur le même cas standardisé, auprès d'utilisateurs et de non-utilisateurs du concurrent. Attribuer aléatoirement l'ordre des outils et figer le script d'aide. Un observateur qui ne manipule pas le prototype relève le temps, les erreurs, les champs saisis, l'abandon et le choix face à une offre payante. Sur les données réelles, utiliser des tâches comparables contrebalancées ou des groupes appariés afin de distinguer l'effet du produit, l'apprentissage et l'effet de nouveauté.

L'effet minimal utile — réduction de temps et d'erreurs sans perte de compréhension — est fixé après trois essais internes et avant le premier participant. Le résultat est rapporté avec son intervalle d'incertitude ; le pilote de quinze personnes ne permet aucune affirmation de supériorité marché.

### Étape 2 — pilote exploratoire B2C, 15 propriétaires

La dernière sortie réelle sert au premier passage. Le suivi dure huit semaines calendaires pour tous, sans extension individuelle. Une sortie, une préparation planifiée ou une intervention liée à l'usage constituent les seules occasions admissibles pour observer une seconde action ; une personne qui n'en rencontre aucune reste dans le dénominateur et est signalée séparément.

**Critères cumulatifs pour ouvrir la réplication :**

1. **Transmission :** au moins 10/15 envoient un élément après la même invitation, sans relance personnalisée.
2. **Authenticité :** pour ces mêmes personnes, la date, la machine et la réalité de l'événement sont recoupables avec une source définie avant le test.
3. **Suffisance :** au moins 10/15 dossiers contiennent les champs minimaux définis à l'avance pour produire une prochaine action ; deux évaluateurs indépendants appliquent la même grille.
4. **Effort :** au moins 8/15 terminent seuls en moins de deux minutes et plus vite que la comparaison contrebalancée, sans erreur critique.
5. **Automatisabilité :** le traitement manuel médian reste sous dix minutes par événement. Les règles sont figées, un lot hors échantillon est évalué en aveugle par deux personnes, les exceptions sont comptées et l'accord inter-évaluateurs est publié.
6. **Répétition :** au moins 6/15 effectuent une seconde action dans la fenêtre de huit semaines, après un unique rappel standard au maximum.
7. **Confiance :** au moins 14/15 réussissent plusieurs exercices de reformulation non annoncés, dont tous les cas critiques. Le comportement observé face à une alerte ambiguë compte davantage que la répétition d'un avertissement.

Ces proportions expriment le minimum choisi par le projet pour financer une réplication. Leur justification et leurs intervalles de Wilson sont publiés ; une seule réponse proche du seuil est traitée comme une zone d'incertitude, jamais comme une rupture scientifique.

### Étape 3 — réplication B2C et paiement, 30 nouveaux propriétaires

Répéter le protocole avec les mêmes quotas et trente personnes nouvelles. Les critères de transmission, suffisance, effort, automatisabilité, répétition et confiance doivent atteindre au moins les mêmes proportions que lors du pilote, avec leurs intervalles publiés. Aucun développement n'est autorisé si un critère critique de sécurité, de données ou d'automatisabilité échoue, même si répétition et paiement réussissent.

Les participants reçoivent aléatoirement, au même moment et par le même canal, une offre à **29 €** ou **39 € par an**. Le bien vendu est un abonnement annuel au service privé standardisé, activé immédiatement et maintenu pendant douze mois, au besoin par une opération manuelle. La fenêtre de mesure reste de huit semaines. Les deux groupes reçoivent les mêmes fonctions, sans aide personnalisée ni cadeau, et sans promesse de remboursement autre que celles découlant des droits applicables ou d'un défaut de livraison. Paiement net, délivrance, usage répété, demandes de remboursement et contestations sont enregistrés. Le seuil exploratoire est de six paiements conservés sur trente, dont au moins deux dans chaque groupe ; il ne permet pas de déclarer qu'un prix convertit mieux que l'autre.

Un développement limité n'est envisagé que si **tous** les critères passent lors du pilote et de la réplication, si la contribution variable projetée reste positive et si aucune comparaison directe ne montre une alternative supérieure sur l'ensemble effort, exactitude, répétition et préférence payante.

### Exploration B2B — cinq opérateurs d'un même profil

Pour chaque opérateur, vérifier décideur, budget, taille de parc et système actuel ; observer réellement au moins deux reconditionnements. Le service pilote a le même périmètre et le même prix de 79 € HT pour trente jours.

**Critères pour ouvrir un brief B2B de confirmation, jamais un pivot direct :**

1. au moins 3/5 montrent le flux complet et quantifient une erreur, une double saisie, un consommable ou une indisponibilité ;
2. au moins 2/5 paient le pilote standard avec de vraies motos et l'utilisent lors de deux cycles de retour-remise à disposition ;
3. ces deux opérateurs constatent un résultat opérationnel défini à l'avance ;
4. au moins 2/5 paient effectivement un mois de continuation aux mêmes conditions.

Si ces critères passent, recruter une cohorte de confirmation du même profil dans un brief séparé. Si le besoin impose dès le départ réservation, facturation, ressources humaines, stock complet ou support de course, parquer cette voie.

### Acquisition et partenaires

Le recrutement mesure aussi le canal direct : nombre de personnes approchées, éligibilité, réponse, activation, seconde action et paiement sont consignés par source. Après le pilote, contacter au maximum douze organisateurs ou ateliers avec la même offre partenaire. Au moins deux partenaires indépendants doivent accepter les mêmes conditions et produire chacun cinq utilisateurs activés ; chaque source doit conduire à au moins un paiement, pour trois paiements au total. Le canal direct hors réseau personnel doit, lui, remplir la cohorte de quinze personnes dans la limite des 75 invitations. Un accord verbal ou une liste d'attente ne compte pas.

NanoCorp et Meta restent exclus tant que l'action de valeur, la conversion payante, la contribution unitaire et le parcours d'acquisition organique n'ont pas été mesurés. Tout test futur conserve hors de NanoCorp les données d'attribution, les actifs associés, les contacts et les conversions, avec plafond de dépense et revue humaine.

### Revente — expérience secondaire

Sur des ventes réelles, comparer le partage de preuves d'entretien sélectionnées à un dossier plus complet. Mesurer questions, refus, informations masquées, délai et offre ; ne jamais chercher seulement une hausse de prix. Ce test peut supprimer le partage sans invalider la préparation de la prochaine sortie.

### Règles d'arrêt et décision

Le registre conserve tous les abandons, incidents, remboursements et échecs. Le pilote exploratoire autorise une seule correction causale pré-enregistrée avant la réplication ; aucun participant n'est réutilisé. Si la réplication échoue, le concept est archivé. Une nouvelle proposition exige un nouveau brief et un nouveau protocole, pas une troisième cohorte opportuniste.

```text
Tous les critères B2C passent deux fois + économie variable + canal passent
└── Construire uniquement la première tranche fonctionnelle B2C

Un critère B2C échoue
└── Ne pas construire ; archiver ou reformuler dans un nouveau brief

Les critères B2B exploratoires passent
└── Ouvrir un brief et une cohorte B2B de confirmation séparés

B2C et B2B échouent
└── Archiver le pivot piste ; conserver les composants réutilisables
```

## Conditions avant tout essai réel ou développement public

1. identité de test neutre pour tout contact externe ; nom distinctif et recherches INPI/TMview/EUIPO avant toute marque publique ;
2. corpus mécanique borné, revu et validé avant toute recommandation réelle ; procédure d'escalade et journal des faux positifs, faux négatifs et incidents ;
3. inventaire des données, accès, fournisseurs, retrait, incident, durée et suppression vérifiable en place avant le premier fichier réel ;
4. nouveau schéma canonique et frontières `brouillon / usage / preuve / recommandation` avant tout développement ;
5. secrets historiques renouvelés et aucun ancien extracteur réactivé ;
6. premier format d'import choisi d'après les utilisateurs observés ;
7. effets minimaux, quotas, budgets, seuils et arrêts enregistrés avant observation, sans déplacement ultérieur.

## Conclusion

**Viabilité comme activité de niche autofinancée : plausible sous conditions.**  
**Viabilité comme produit France B2C établi : non démontrée.**  
**Viabilité comme grande entreprise : impossible à soutenir aujourd'hui sans Europe/B2B validés.**

Le prochain investissement utile n'est ni du code ni du média : c'est la comparaison directe, un pilote B2C de 15 personnes, sa réplication auprès de 30 personnes et l'observation de cinq opérateurs B2B, avec des règles d'arrêt définies à l'avance. Le projet gagne le droit à un développement limité seulement si tous les critères B2C passent lors du pilote et de la réplication, puis si l'économie variable et au moins un canal franchissent leurs propres seuils.
