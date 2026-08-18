---
title: "Dossier de décision — projet piste"
status: complete
updated: 2026-08-16
---

# Dossier de décision — projet piste

## Verdict actuel

**VÉRIFIER — ni lancement, ni abandon.** La niche et les parcours existent, mais le projet ne dispose encore d'aucune preuve primaire d'usage répété, de paiement ou de canal reproductible en France.

La proposition à tester est :

> Après chaque roulage, confirme ce que ta moto a réellement vécu et vois ce qu'elle demande avant le prochain.

Le coût de saison reste facultatif. Les preuves d'entretien sont partagées sélectivement. Les loueurs de motos piste forment une exploration B2B séparée. « MyPaddock » reste un nom de code interne.

## Ordre de lecture

| Livrable | Rôle |
|---|---|
| [Audit de viabilité](viability-assessment-2026-08-16.md) | Verdict, économie et protocole pré-enregistrable avec règles d'arrêt |
| [Product Brief](briefs/brief-MyPaddock-2026-08-16/brief.md) | Décision produit, cible, boucle, périmètre et critères |
| [Addendum du Product Brief](briefs/brief-MyPaddock-2026-08-16/addendum.md) | Limites de preuve, contraintes techniques, nom et NanoCorp |
| [PRFAQ](prfaq-MyPaddock.md) | Promesse client, objections et verdict de préparation « needs more heat » |
| [Recherche marché](research/market-mypaddock-track-france-2026-08-16/research.md) | 44 sources, concurrence, marché, B2B, acquisition, conformité et marque |
| [Inventaire brownfield](brownfield-inventory.md) | Actifs réutilisables, risques et périmètre de migration |
| [Design Thinking](../design-thinking-2026-08-16.md) | Expérience cible et principes de confiance |
| [Stratégie d'innovation](../innovation-strategy-2026-08-16.md) | Options, assemblage différenciant et limites défendables |

## Décisions de périmètre

- Moto piste en France d'abord ; automobile différée.
- Importer une trace crée un brouillon ; seul l'usage confirmé alimente les règles.
- Trois prochaines actions au maximum, avec toutes les alertes critiques accessibles.
- Pas de chronométrage, réservation avec encaissement, place de marché, assurance, extraction Leboncoin, cote automatique ou réseau social dans la première tranche.
- Réemploi sélectif du garage, de l'OCR, des factures, coûts, documents et visualisations ; nouveau schéma canonique.
- Aucun bénéfice de revente, niveau de sécurité ou entretien « certifié » promis.
- NanoCorp/Meta seulement après répétition, paiement, contribution unitaire et attribution ; son offre actuelle n'est pas compatible avec un test à 0 €.

## Prochaine porte BMAD

Ne pas lancer le prochain jalon requis, `[PRD] Create Edit and Review PRD` avec `bmad-prd`, maintenant. Exécuter d'abord l'étape d'accès et de sécurité, la comparaison directe, le pilote B2C de 15 personnes, sa réplication auprès de 30 personnes, l'expérience de canal et l'exploration B2B décrits dans l'audit de viabilité.

Si tous les critères B2C sont répétés et que l'économie variable ainsi qu'un canal franchissent leurs seuils, ouvrir un contexte neuf et lancer `bmad-prd` en création. La suite sera `[CU] Create UX` avec `bmad-ux`, fortement recommandé pour cette application, puis `[CA] Architecture` avec `bmad-architecture`. Un résultat B2B positif ouvre un brief distinct ; il ne déclenche pas automatiquement un pivot.
