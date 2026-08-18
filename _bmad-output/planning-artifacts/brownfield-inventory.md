---
title: "Inventaire brownfield — MyPaddock vers Track Day"
status: complete
created: 2026-08-16
updated: 2026-08-16
evidence_scope: local-static-audit
---

# Inventaire brownfield — MyPaddock vers Track Day

## Lecture rapide

Le dépôt contient bien trois produits historiques distincts : une application de gestion de véhicules, un site marketing et une API/data platform avec scrapers et moteurs de valorisation. Le bon point de départ n'est cependant **pas** de remettre l'ensemble en production. Le patrimoine réutilisable est surtout fonctionnel et visuel : garage auto/moto, reçus, coûts, maintenance, documents, graphiques TCO et parcours de revente. Le schéma de données, la sécurité et les pipelines de valorisation doivent être reconstruits sur une base canonique.

Cet inventaire décrit ce qui est observé dans les fichiers locaux. Les promesses des README, du site et des decks restent des éléments déclaratifs tant qu'elles ne sont pas confirmées par une application ou une base vivante.

## Périmètre observé

| Brique | État local | Dernier commit observé | Rôle historique |
|---|---|---:|---|
| `context/MyPaddock2.0/` | 270 fichiers sous `src`, React/TypeScript/Vite/Supabase | 2026-02-16 | Application de garage, coûts, maintenance, valorisation et marketplace |
| `context/MyPaddock-Website/` | 75 fichiers sous `src`, React/TypeScript/Vite | 2026-02-16 | Site bilingue, narration, acquisition et présentation produit |
| `context/mypaddock_api/` | 220 fichiers, Python/FastAPI, notebooks et crawlers | 2026-02-25 | Valorisation, TCO, simulateurs, extraction de maintenance et collecte d'annonces |
| `context/MP - PitchDeck - V3-7.pdf` | 15 pages | non applicable | Hypothèses produit et traction déclarée |
| `context/Business Plan - FR.pdf` | 35 pages | non applicable | Principalement un projet BHCar en Floride, pas le business plan du SaaS |

Aucun test automatisé actif n'a été trouvé pour l'application, le site ou l'API. Aucun build n'a été utilisé comme preuve dans cet audit ; le cache TypeScript existant indique des erreurs et plusieurs incompatibilités sont visibles statiquement.

## Actifs à conserver

| Actif | Preuve locale | Réemploi track-day |
|---|---|---|
| Garage auto/moto, photos et propriété | `context/MyPaddock2.0/src/components/contexts/VehicleContext.tsx`, `.../forms/AddVehicleForm.tsx` | Fiche moto/auto de piste, configuration, photos et statut de propriété |
| Reçus, pièces jointes et OCR | `.../contexts/InvoiceContext.tsx`, `.../forms/AddReceiptForm.tsx`, `supabase/functions/receipt-autofill/index.ts` | Saisie quasi automatique des pneus, pièces, carburant, transport, hôtel et droits de piste |
| Visualisations de coûts | `.../features/budget/`, `.../features/summary/` | Coût par journée, circuit, saison, véhicule, heure moteur ou tour |
| Maintenance planifiée et clôturée | `.../forms/ScheduleMaintenanceForm.tsx`, `.../contexts/MaintenanceContext.tsx` | Préparation avant roulage, opérations après roulage et échéances par usage piste |
| Planning constructeur | `.../features/paddock/components/PaddockMaintenanceDemo.tsx`, `context/mypaddock_api/src/core/tasks_catalog.py` | Base de règles par moto/auto à compléter par heures, sessions et cycles |
| Documents et coffre VIN | `.../contexts/DocumentContext.tsx`, `supabase/functions/vehicle-set-vin/`, `vehicle-get-vin/`, `context/mypaddock_api/src/data/vault_crypto.py` | Dossier privé, factures, contrôle technique, lien HistoVec et transfert à la vente |
| Parcours de mise en vente | `.../features/marketplace/`, `.../lib/services/marketplace.service.ts` | Génération d'une fiche vendeur et transfert du dossier ; pas nécessairement une marketplace en V1 |
| Courbes TCO et dépréciation | `.../features/TCOcalculator/`, `.../features/asset/`, `context/mypaddock_api/regret_simulator/` | Composants et formules de coût complet, à recalibrer pour une saison piste |
| Site bilingue et récit fondateur | `context/MyPaddock-Website/src/` | Landing pages de validation, contenu et identité passionnée |
| Normalisation de données | `context/mypaddock_api/crawler/normalize.py`, `validate.py`, `persist.py` | Pipeline générique uniquement pour des sources autorisées |

## Modèle métier track-day encore absent

Le code actuel ne modélise pas les objets qui feront la valeur du produit dérivé :

- circuit, organisateur, événement et réservation ;
- session ou stint, tours et temps, sans nécessairement refaire un chronomètre GPS ;
- compteur d'heures moteur et de journées piste ;
- jeu de pneus, cycles thermiques, pressions et usure ;
- plaquettes, chaîne, huile, carburant et autres consommables affectés à une sortie ;
- réglages de suspension et configuration de la machine ;
- checklist avant/après roulage, incident et réparation ;
- transport, hébergement, assurance et coût total de l'événement ;
- attestation tierce d'une présence ou d'une intervention ;
- export/transfert d'un dossier de provenance à la revente.

Ces objets doivent être le centre du nouveau schéma. Le kilométrage routier ne peut plus être la seule horloge de maintenance.

## Éléments à ne pas reprendre tels quels

### Schéma et services

Le fichier `context/MyPaddock2.0/shemaSQL` se déclare lui-même documentaire. Le code actif utilise plusieurs contrats incompatibles : `receipts` contre `invoices`, variantes de tables marketplace, plusieurs identifiants véhicule, ainsi que des tables et RPC absents des migrations versionnées. Il n'existe pas de dossier de migrations canonique permettant de reconstruire la base et ses règles RLS.

Conséquence : conserver les concepts et certains composants, mais redéfinir une source de vérité de données avant toute migration.

### Sécurité

Plusieurs patterns imposent une reprise avant exposition publique : variables privilégiées préfixées `VITE_`, endpoint de kilométrage fondé sur un `user_id` fourni par le client, accès direct aux coordonnées vendeur et fonctions OCR dont l'autorisation doit être resserrée. Des identifiants historiques existent aussi dans le code frontend/API ; leurs valeurs ne sont pas reproduites ici et doivent être considérées comme exposées puis renouvelées.

### IA et valorisation

L'OCR des reçus constitue un usage IA concret. L'assistant général de l'application est en revanche simulé. Les modèles de valorisation ne sont pas reproductibles à partir du dépôt : aucun dataset ni poids de modèle complet n'est présent, le vocabulaire de gammes est vide et les notebooks montrent une couverture minuscule ou des erreurs de schéma. Les courbes d'interface utilisent parfois des points interpolés/bruités qui ne doivent pas être présentés comme des observations de marché.

### Scrapers

Les scrapers Leboncoin, La Centrale et Facebook sont des prototypes hétérogènes : CAPTCHA et contournement anti-bot, schémas divergents, faux VIN dérivés des annonces, absence d'historique de runs, de gestion du retrait et de preuve de licence. La structure de normalisation peut être réutilisée ; les collecteurs eux-mêmes ne doivent pas être relancés sans droit écrit ou source autorisée.

## Décision technique préparatoire

Le scénario brownfield le plus sain à challenger dans le futur PRD est :

1. créer une nouvelle base applicative et un schéma track-day canonique ;
2. extraire uniquement les composants éprouvables : garage, reçus/OCR, coûts, maintenance, documents, courbes et fiche de vente ;
3. conserver l'ancien code en référence, sans en faire la fondation de production ;
4. reporter le chronométrage, la marketplace, la cote automatisée et le scraping à des décisions séparées ;
5. brancher ultérieurement les intégrations partenaires sur des contrats explicites.

Ce document ne décide pas si le produit doit être lancé. Il fixe seulement le patrimoine réellement disponible et les dettes qui pèseraient sur son exécution.

## Sources locales principales

- `context/MyPaddock2.0/package.json`, `README.md`, `src/README.md`, `shemaSQL`
- `context/MyPaddock2.0/src/components/contexts/`
- `context/MyPaddock2.0/src/components/features/`
- `context/MyPaddock2.0/src/lib/services/`
- `context/MyPaddock2.0/supabase/functions/`
- `context/mypaddock_api/crawler/`
- `context/mypaddock_api/regret_simulator/`
- `context/mypaddock_api/src/`
- `context/MyPaddock-Website/src/`
