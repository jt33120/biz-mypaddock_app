---
title: "Product Brief — projet piste (nom de code MyPaddock)"
status: complete
created: 2026-08-16
updated: 2026-08-16
---

# Product Brief — projet piste

_MyPaddock est un codename interne. Le nom public reste à créer et à vérifier._

## Décision actuelle

**Valider le concept « prêt pour la prochaine » et le comparer au cas B2B des loueurs et des écoles ; ne pas lancer le produit, acheter du trafic ni rédiger de PRD complet avant que les critères comportementaux soient remplis.**

## Résumé exécutif

Le produit candidat est un compagnon mobile pour les propriétaires français de motos de piste qui participent à l'entretien de leur machine. Après chaque roulage, il rapproche les traces disponibles, fait confirmer l'usage réel et présente les prochaines opérations à vérifier, avec leur source et leur incertitude. Plusieurs concurrents couvrent déjà une grande partie de ce parcours ; le projet doit donc prouver la répétition et le paiement, pas seulement l'intérêt déclaré.

## Pour qui

**Utilisateur initial :** propriétaire en France d'une moto de piste, roulant plusieurs fois par saison, impliqué dans sa préparation et utilisant déjà au moins une trace ou un système de suivi.

Novices, pratiquants réguliers et vendeurs ou acheteurs seront comparés séparément. L'automobile reste hors du premier test. Loueurs et écoles font l'objet d'une exploration B2B distincte ; leurs besoins ne doivent pas modifier le produit B2C avant observation.

## Le problème

La vie d'une moto de piste est dispersée entre réservations, exports de session, compteur, notes, factures, photos, pièces et mémoire. Le kilométrage routier décrit mal une machine utilisée en sessions, heures et cycles thermiques. Avant la prochaine journée, le propriétaire doit reconstruire ce que la moto et chaque consommable ont vécu, puis décider quoi inspecter ou remplacer.

RaceChrono couvre la session, RideApp et TrackMate l'événement, Apex Lines le journal piste, et MotoBook ou LookOver l'entretien et les preuves. Le problème candidat n'est donc pas l'absence de fonctions : c'est l'effort nécessaire pour faire circuler une information fiable du roulage vers la prochaine préparation.

## La solution candidate

La boucle comporte quatre étapes :

1. importer une réservation, un reçu, une photo ou un export de session ;
2. en faire un brouillon, jamais une usure certifiée ;
3. faire confirmer l'usage et les opérations réellement effectués ;
4. présenter les prochaines actions, puis conserver les preuves utiles.

L'accueil met en avant trois actions au maximum ; toutes les alertes critiques restent visibles. Chaque recommandation indique la règle, la source, les données manquantes et l'incertitude. Le coût prévu et réel est facultatif. Les preuves d'entretien se partagent une par une ; événements, incidents, trajets et géolocalisation ne sont jamais transmis automatiquement.

## Périmètre de la première tranche fonctionnelle

**Inclus :** une moto, un événement, une mesure d'usage confirmée, un composant, une intervention avec preuve, des règles fondées sur plusieurs horloges, les prochaines actions, l'export et la suppression.

**Exclus :** chronométrage, réservation et paiement, place de marché, conseil ou vente d'assurance, extraction de Leboncoin, cote automatique, réseau social, automobile, stock et rôles de flotte.

Le prototype peut être opéré manuellement : OCR, imports et règles ne seront automatisés que si le comportement est d'abord démontré.

## Hypothèses à valider et critères de décision

| Hypothèse | Signal observable requis |
|---|---|
| La première valeur apparaît sans configurer tout le garage. | Une trace réelle permet de produire un brouillon utile avec moins d'effort que le système actuel. |
| La confirmation reste assez légère. | L'utilisateur termine seul, plus vite que sa méthode habituelle, avec une assistance standardisée. |
| Les prochaines actions apportent de la valeur sans créer de fausse assurance. | Les décisions sont comprises dans plusieurs scénarios ; les alertes critiques restent visibles et le corpus mécanique a été revu. |
| La boucle se répète. | L'utilisateur revient de lui-même lors d'un second moment admissible de la saison, dans une fenêtre fixée avant le test. |
| La valeur justifie un prix. | Un paiement réel porte sur une offre standard, livrée et comparable, pas sur une faveur ou un dépôt sans risque. |

Le produit doit aussi être comparé directement à Apex Lines, MotoBook, LookOver et au tableur sur les mêmes tâches. Les seuils, quotas, fenêtres, conditions d'arrêt et effets minimaux utiles sont pré-enregistrés dans le protocole de validation.

L'adaptation à la France — formats d'événements, vocabulaire, imports et partenaires — est une hypothèse d'exécution, pas un avantage acquis. Les intégrations autorisées, le modèle piste/composant, l'historique portable et la distribution partenaire ne constitueront un avantage durable que s'ils sont utilisés et difficiles à reproduire.

## Piste parallèle B2B — hors produit initial B2C

Loueurs et écoles peuvent avoir un problème plus directement chiffrable : état départ/retour, affectation des machines, consommables, disponibilité et reconditionnement. L'exploration choisira d'abord un seul profil d'entreprise et vérifiera le décideur, le budget, le flux réel et son coût. Elle n'ouvre un brief B2B séparé qu'après usage d'un pilote, paiement net et accord de continuation aux mêmes conditions. Aucun de ces éléments n'est établi aujourd'hui.

## Hypothèse économique

Les prix publics concurrents donnent des repères d'offre, pas un plafond : gratuit, 24,99 $ par an et 39,99 $ par an. Des cohortes comparables testeront séparément 29 € et 39 € par an. À 39 €, 1 000 abonnés représenteraient 39 000 € de revenu annuel brut avant TVA, commissions, remboursements, stockage, OCR, support, acquisition et travail du fondateur. Cette arithmétique illustre la contrainte d'échelle ; ce n'est pas une prévision.

Commission de réservation et affiliation restent hors du premier modèle. Le cas B2B aura sa propre économie après validation de son profil client et de son usage.

## Risques principaux

- le parcours est utile mais pas assez important pour être payé ;
- Apex Lines ou un acteur français ferme rapidement l'écart ;
- la saisie minimale reste trop lourde entre deux événements ;
- les rappels créent une confiance mécanique impossible à assumer ;
- le coût complet diminue l'usage ;
- le partage de l'usage piste dessert la revente ;
- les imports ou partenaires ne sont pas accessibles ;
- aucun canal n'acquiert des clients hors du réseau personnel ;
- le nom public reste indisponible.

## Vision conditionnelle

Si la boucle est prouvée, le produit devient le système de continuité de la machine de piste : chaque usage confirmé alimente les horloges pertinentes, chaque opération conserve sa source et chaque composant garde son histoire lorsqu'il change de configuration. Ce même noyau ne servira des professionnels ou des pratiquants automobiles en Europe que si des validations séparées montrent que cette extension reste cohérente.
