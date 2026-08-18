---
title: "Addendum — Product Brief projet piste"
status: complete
created: 2026-08-16
updated: 2026-08-16
---

# Addendum

Cet addendum complète le Product Brief sans modifier le verdict « vérifier ». La [recherche de marché](../../research/market-mypaddock-track-france-2026-08-16/research.md) regroupe les sources ; l'audit de viabilité reste la source unique du protocole et des règles d'arrêt.

## Décision

### Options considérées

| Option | Statut | Raison |
|---|---|---|
| B2C préparation/capture | À valider en priorité | Boucle étroite ; réemploi des actifs existants ; valeur potentielle entre deux sorties |
| Passeport de revente | Secondaire et sélectif | Marché déjà occupé ; bénéfice commercial inconnu, voire négatif |
| Coût de saison | Facultatif | Utile aux utilisateurs qui optimisent, potentiellement anxiogène pour d'autres |
| Calendrier/réservation | Lien direct/import seulement | Offre déjà présente en France ; économie et obligations non démontrées |
| B2B loueur/école | Exploration parallèle | Enjeu économique observable ; processus d'achat et parcours opérationnel inconnus |
| Atelier/équipe | Différé | Substituts bon marché ou extension importante du périmètre produit |
| Auto | Différé | Segment non dimensionné ; risque de dilution |

### Frontière avec le protocole

Seul l'[audit de viabilité](../../viability-assessment-2026-08-16.md) fixe les populations, seuils B2C et B2B, expériences côté vendeur et côté acheteur, budgets et règles d'arrêt. Cet addendum ne les résume pas afin d'éviter deux versions divergentes.

## Preuves et économie

### Éléments de preuve à ne pas surinterpréter

- 19 168 Pass Circuit FFM 2024 = titres/journées de plusieurs types, pas personnes uniques ni Pass Vitesse uniquement.
- Les 10 473 licences annuelles Vitesse 2024 constituent un indicateur fédéral, pas un décompte des pratiquants de loisir ni une estimation dédupliquée de la cible.
- Prix de journées et locations = offres publiées, pas achats répétés, marges ou coût d'immobilisation.
- Prix concurrents = repères d'offre, pas plafond de marché ni disposition à payer.
- Notes et fils communautaires = existence d'un comportement, pas prévalence française.
- Aucun jeu de données ne démontre une prime de revente ; une offre de garantie commerciale Yamaha consultée exclut les avaries liées à tout usage sur circuit.

### Repères économiques, sans prévision

| Hypothèse | Arithmétique brute |
|---|---:|
| 500 abonnés à 39 €/an | 19 500 €/an |
| 1 000 abonnés à 39 €/an | 39 000 €/an |
| 3 000 abonnés à 39 €/an | 117 000 €/an |
| 10 clients B2B à 99 €/mois | 11 880 €/an |
| 50 clients B2B à 99 €/mois | 59 400 €/an |
| 1 000 réservations à 200 € × 6 % | 12 000 € brut |

Ces lignes ignorent la TVA, les commissions et frais de paiement, l'assistance, le stockage, l'OCR ou l'IA, l'effort commercial, l'attrition et l'acquisition. Elles montrent seulement qu'un B2C français à bas prix exige une forte pénétration et qu'un niveau de revenu significatif peut nécessiter l'Europe, le B2B ou les deux — après validation, pas par présomption.

## Contraintes de livraison

### Confiance et conformité

- Une réservation ou une présence sur place ne certifie pas que les sessions ont été roulées.
- Une recommandation d'entretien ne certifie ni la sécurité du véhicule ni la durée de vie restante d'une pièce.
- Une autorisation du système d'exploitation ne vaut pas automatiquement consentement ; les traitements doivent rester minimaux et liés à leur contexte.
- Le rapport HistoVec est transmis par le titulaire du véhicule ; il n'est pas librement consultable.
- Aucun scraper Leboncoin sans autorisation écrite.
- Tout encaissement pour le compte de tiers nécessite une qualification du flux et, selon le cas, un montage avec un prestataire de services de paiement adapté.
- Toute assurance intégrée reste hors périmètre sans revue de la frontière entre partenaire et distributeur.
- Le partage se fait preuve par preuve ; il est révocable et masque les données privées.

### Réemploi de l'existant

- Conserver les trois anciens ensembles comme sources de composants, pas comme architecture cible.
- Si le projet passe en développement, utiliser un nouveau schéma canonique et ne réutiliser que les composants pertinents de l'existant : garage, reçus/OCR, coûts, maintenance, documents et visualisations.
- Garantir la cohérence entre le nouveau schéma canonique, les migrations et les types générés.
- Rotation de tous les secrets historiques avant réutilisation.
- Ne pas réutiliser les simulations ou heuristiques existantes en les présentant comme de l'IA.
- Ne pas remettre en production valorisation/scraping sans données licenciées et validation reproductible.
- Tester d'abord avec un service opéré manuellement afin d'éviter de résoudre techniquement un comportement inexistant.

## Préconditions commerciales

### Nom

- Le nom exact « MyPaddock » est actuellement utilisé par Oracle Red Bull Racing.
- PaddockPro et ThePaddock sont déjà utilisés pour des offres directement liées aux journées piste ; ThePaddock est distribué en France.
- La graphie « MyPadock » n'élimine pas les collisions phonétiques, typographiques ou dans les résultats de recherche.
- Prochaine étape : établir une liste restreinte dont « Paddock » n'est pas l'élément dominant. Effectuer ensuite des recherches exactes et par similarité dans les bases INPI, TMview, EUIPO et WIPO, vérifier les classes et libellés, puis obtenir un conseil professionnel avant tout dépôt ou toute dépense.

### NanoCorp

- Le forfait public Founder coûte 30 $ par mois ; les publicités Meta ajoutent 15 à 150 $ par jour ; NanoCorp prélève 20 % sur les retraits.
- NanoCorp agit comme annonceur officiel (« advertiser of record ») depuis sa propre infrastructure Meta.
- La revue n'a trouvé ni mesure indépendante du coût d'acquisition ou du rendement publicitaire, ni capacité documentée d'exporter les campagnes ou audiences, ni détail sur le suivi des conversions.
- Les CGU exigent une revue humaine des sorties produites par l'IA.
- Si NanoCorp est testé plus tard : conserver les actifs et l'attribution hors de l'outil ; fixer un plafond de carte ; limiter le test à une création publicitaire et à une audience ou proposition ; ne transmettre aucune liste contenant des données personnelles avant d'avoir vérifié l'accord de traitement, les transferts et les sous-traitants.
