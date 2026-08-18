---
title: "PRFAQ Distillate: MyPaddock"
type: llm-distillate
source: "prfaq-MyPaddock.md"
created: 2026-08-16
purpose: "Token-efficient context for downstream PRD creation"
---

# PRFAQ distillate — projet piste, codename MyPaddock

## Proposition retenue

- Customer hypothétique : propriétaire français d'une moto de piste, roulant plusieurs fois par saison et participant à l'entretien ; taille, répétition et joignabilité non prouvées.
- Job à tester : préparer la prochaine sortie à partir de l'usage réellement confirmé, sans tenir un garage exhaustif.
- Boucle : importer une trace → créer un brouillon → confirmer usage/opérations → voir au plus trois prochaines actions → conserver les preuves.
- Valeur secondaire : coût prévu/réel facultatif ; partage de preuves d'entretien sélectif et révocable.
- Aucun claim de sécurité, certification, durée de vie restante, prime de revente ou historique officiel.

## Framings rejetés

- « Gestion financière complète du hobby » : peut décourager ; coût réservé aux optimiseurs et décisions ponctuelles.
- « Passeport piste qui augmente la revente » : concurrents nombreux, aucune prime mesurée, divulgation circuit potentiellement adverse.
- « Tout-en-un calendrier + chrono + marketplace + garage » : scope occupé et trop réglementé.
- « IA autonome » : extraction et préremplissage seulement ; confirmation humaine requise pour l'usage et les opérations.
- MyPaddock/MyPadock/PaddockPro/ThePaddock comme marque : collisions commerciales motorsport ; codename uniquement.

## Requirements signals

- Première valeur sans configuration exhaustive ; objectif expérimental de confirmation en moins d'une minute.
- Statuts séparés : événement prévu, présence, usage mesuré, donnée déclarée, justificatif, confirmation tierce.
- Chaque rappel expose source, règle, donnée manquante et incertitude ; accès visible à toutes les alertes au-delà des trois mises en avant.
- Mode manuel et import fichier ; géolocalisation/télémétrie jamais requises par défaut.
- Export lisible + structuré, pièces jointes, suppression du compte et partage par élément dès la première version.
- Offline/paddock souhaitable seulement après validation du flux.

## Contexte technique

- Réutilisable : composants garage, reçus/OCR, dépenses, maintenance, documents et visualisations du brownfield React/TypeScript/Vite/Supabase + API Python.
- Non réutilisable comme socle : schémas divergents, migrations non canoniques, sécurité/secrets, fausse IA/simulations, modèle de valorisation, scrapers.
- Nouveau modèle : machine → événement → usage confirmé → composant → intervention/preuve → prochaine action.
- Vertical slice : une moto, un événement, une mesure, un composant, une intervention/preuve et une vue readiness.
- OCR/imports d'abord Wizard of Oz ; aucune architecture native avant preuve de forme d'usage.

## Concurrence

- Apex Lines est le concurrent le plus proche : sessions, heures, cycles pneus, readiness et export à 39,99 $/an.
- MotoBook, LookOver, Bikerflow, MotoVault et EMX couvrent entretien, coûts, heures/jours et transfert.
- RideApp/TrackMate occupent réservation/admin ; RaceChrono occupe chronométrage/télémétrie.
- Notes, Sheets, papier et compteurs sont des substituts à coût monétaire nul.
- Différenciation hypothétique : simplicité mesurée, imports France, frontière de confiance et partage sélectif ; aucune moat actuelle.

## Modèle économique et GTM

- Prix B2C : tester gratuit limité/essai puis 29 € et 39 €/an ; repères concurrents, pas plafond ni prévision.
- Scénario arithmétique : 1 000 abonnés × 39 € = 39 k€ brut/an avant tous coûts ; France-only probablement contraint sans preuve d'échelle.
- Booking : 5–7 % observés, soit 6,45–23,10 € brut sur billets 129–330 € ; économie globale inconnue, deep-link d'abord.
- B2B loueur/école : actifs 420–550 €/jour et cautions 3,5–5 k€ ; aucun budget SaaS, outil ou coût de downtime observé.
- Acquisition initiale 0 € : dogfooding, observation terrain, clubs/circuits/organisateurs, QR/liens autorisés ; mesurer artefact réel et seconde action.
- NanoCorp : 30 $/mois + 15–150 $/jour ads, compte Meta NanoCorp, revue humaine et portabilité inconnue ; uniquement après PMF/attribution, jamais système d'enregistrement.

## Scope

- In : capture assistée, usage confirmé, règles multi-horloges, prochaine action, preuve jointe, coût facultatif, export/suppression.
- Out MVP : chrono, checkout, marketplace, conseil/vente assurance, scraping Leboncoin, cote automatique, réseau social, auto, stock/rôles B2B.
- Maybe later : import RaceChrono/RaceBox, partenaire organisateur, HistoVec fourni par le propriétaire, component ledger, PWA/native, B2B flotte, auto.

## Inconnus et blockers

- Aucun entretien/observation terrain français ni utilisateur inconnu répétiteur/payeur.
- Taille du segment répétiteur et fréquence inconnues.
- Trace réellement fournie, effort acceptable, import autorisé et retour avant prochaine sortie inconnus.
- Effet du partage sur acheteur, prix, délai et garantie inconnu.
- B2B : workflow, décideur, budget, double saisie, downtime et volonté de pilote inconnus.
- Naming : official clearance INPI/TMview/EUIPO et nouveau nom distinctif requis avant campagne/store.

## Verdict actionnable

- Verdict : `needs-heat` — concept prêt pour validation comportementale, pas pour PRD complet ou lancement.
- Passe au PRD seulement si un concept obtient traces réelles, seconde action et engagements financiers hors cercle proche selon seuils préfixés.
- Arrêter ou repositionner B2C si le flux ne bat pas Apex Lines/MotoBook/LookOver/tableur sur effort et répétition.
- Ne retenir le B2B que si un loueur/école montre son flux réel et accepte un pilote engageant.
