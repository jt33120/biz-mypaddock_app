---
title: "Recherche marché : MyPaddock Track France"
type: market
topic: "MyPaddock Track France"
decision: "Quel produit dérivé de MyPaddock lancer pour les pratiquants de track day, pour quelle cible, avec quel positionnement et quel modèle économique ?"
source: native-web-research
status: complete
preset: standard
validation: high-red-team
claims_total: 39
verified_claims: 25
unverified_claims: 12
disputed_claims: 2
created: 2026-08-16
updated: 2026-08-16
---

# Recherche marché : MyPaddock Track France

## Décision

**Poursuivre seulement vers un test comportemental B2C « capture + prêt pour la prochaine » ; mener en parallèle une discovery B2B subordonnée auprès des loueurs et écoles.** Ne pas lancer, automatiser l'acquisition, reconstruire un chronomètre ou une place de marché, ni promettre une prime de revente avant d'avoir observé une deuxième utilisation et un paiement.

La recherche écarte l'application « tout-en-un » : Bikerflow, MotoVault, EMX, Apex Lines et LookOver recouvrent déjà entretien, usage, coûts ou transfert, tandis que RideApp, TrackMate et RaceChrono couvrent réservation ou chronométrage.[8][9][10][11][12][13][14][15][16] L'hypothèse qui reste à tester est **un compagnon conçu d'abord pour la France, qui préremplit un relevé d'usage à partir des traces d'un roulage, fait confirmer ce que la machine a réellement vécu, puis montre trois actions au maximum avant la prochaine sortie**. Le coût de la saison reste facultatif et les preuves d'entretien sont partagées sélectivement.

L'utilisateur initial est une hypothèse de recrutement : propriétaire français d'une moto de piste, roulant plusieurs fois par saison et participant à l'entretien. Les sources ne permettent d'établir ni la taille de ce segment, ni la fréquence de la pratique, ni sa joignabilité comparative.[1][2][3] Les prix concurrents, de gratuit à 24,99 $ ou 39,99 $ par an, ne prouvent pas davantage la disposition à payer.[8][9][10]

**MyPaddock reste un nom de code.** Oracle Red Bull Racing exploite exactement MyPaddock ; PaddockPro et ThePaddock ciblent déjà le track-day.[39][40][41] Reporter toute campagne, publication dans une boutique d'applications ou dépôt sous ce nom jusqu'au choix d'un nom distinctif et aux recherches officielles INPI/EUIPO.

## Gates de décision

| Gate | État actuel | Limite ou preuve contraire | Preuve requise |
|---|---|---|---|
| Segment observable | Les titres FFM et les offres organisateurs matérialisent une pratique.[1][2][3] | Personnes uniques, répétition et joignabilité inconnues. | FFM/organisateurs : acheteurs uniques, répartition entre 1, 2–3 et 4 journées ou plus, chevauchement licences/pass. |
| Job B2C | Plusieurs produits utilisent heures, journées, cycles et readiness.[8][9][10][13] | L'offre ne prouve ni besoin principal ni répétition française. | 15 pilotes inconnus, dernière sortie réelle, traces confiées et deuxième action. |
| Différenciation | La continuité événement → usage confirmé → prochaine action reste un angle d'exécution. | Le bundle est occupé et facile à copier.[11][12][13] | Comparaison chronométrée avec outil actuel et concurrents ; accès autorisé à un premier import. |
| Capture fiable | Export ou mesure peuvent confirmer l'usage. | Inscription ou présence ne prouvent pas les sessions ; certains roulages interdisent le chronométrage.[17] | Tester distinctement événement prévu, présence, durée mesurée et déclaration utilisateur. |
| Coût et prix | Certains pratiquants optimisent le coût par heure ; repères annuels publics disponibles.[7][8][10] | D'autres évitent le total ; aucun paiement observé. | Paiement réel après valeur à 29 €, puis test de 39 € sur une autre cohorte. |
| Revente | Les concurrents proposent reçus, PDF et transfert.[9][10][18] | Aucune prime mesurée ; une garantie commerciale précise de Yamaha exclut les avaries liées à tout usage circuit.[19] | Transactions réelles : questions, refus, offre, délai et données masquées. |
| B2B subordonné | Locations, cautions et pneus rendent l'enjeu potentiellement quantifiable.[20][21] | Outil, coût d'indisponibilité, budget et achat inconnus ; substituts 9–199 €/mois.[22][23][24] | Observation du reconditionnement ; coût chiffré ; projet pilote assorti d'un engagement payant. |
| Partenaires et attestations | Organisateurs et ateliers détiennent certaines traces. | L'atelier produit déjà ordre et facture ; aucune incitation supplémentaire observée.[44] | Accord écrit, effort mesuré et fait attesté strictement limité. |
| Nom public | Encombrement commercial établi.[39][40][41][42] | Aucune conclusion juridique de disponibilité. | Nouveau nom distinctif, recherches exactes/fuzzy INPI/TMview/EUIPO, revue professionnelle.[43] |

Ce qui survit au red-team est étroit : entretien par usage, readiness à très faible saisie, analyse de coût facultative et possible qualité d'exécution locale. Le produit n'est validé que si cette combinaison provoque un comportement répété et un paiement.

## Recommandations et handoffs

1. **Product Brief :** centrer le problème sur la préparation de la prochaine sortie à partir de l'usage confirmé. Confiance faible à moyenne : les workflows existent, leur importance ne l'est pas.
2. **Prototype :** tester séparément capture, readiness et coût facultatif avec de vrais emails, reçus et exports. Mesurer la baseline, l'effort de confirmation, la deuxième action et le coût caché du Wizard of Oz.
3. **Architecture :** événement importé = brouillon ; mesure ou confirmation = usage ; règle = recommandation explicable ; fichier/source = preuve. L'IA extrait et propose, l'humain confirme ce qui déclenche une opération.
4. **PRFAQ :** interdire les claims « valeur augmentée », « entretien certifié » et « moto sûre ». Stocker richement, partager preuve par preuve et mesurer les effets adverses.[19]
5. **B2B :** observer d'abord loueurs/écoles ; n'ouvrir un brief séparé qu'après coût quantifié et engagement payant. Les besoins de rôles, stock et état départ/retour restent hors du MVP B2C.
6. **GTM :** commencer par dogfooding, partenaires et contenu autorisé. Le calendrier sert d'import ou de lien direct avant toute place de marché ; le taux de réachat et l'économie transactionnelle restent inconnus.[14][15][25][26]
7. **Scope :** ne pas reconstruire le chronométrage, extraire Leboncoin sans autorisation ni encaisser pour des tiers sans montage qualifié.[16][30][31] Place de marché, fonctions sociales, cote automatique et automobile restent des choix de périmètre différés.
8. **Brand :** conserver MyPaddock comme nom de code ; établir une liste sans « Paddock » dominant, effectuer les recherches officielles et demander une revue professionnelle avant exposition publique.[39][40][41][43]

## 1. Marché atteignable et comportement

### Une porte d'entrée existe, pas un décompte de personnes

La FFM a publié pour 2024 un total de 100 164 licences et titres, dont 19 168 Pass Circuit. Un Pass Circuit Vitesse 2026 est nominatif, non cessible et valable une journée ; un même pilote peut donc en acheter plusieurs. Le rapport 2024 agrège en outre les différents Pass Circuit.[1][3] Le projet sportif fédéral recense 10 473 licences annuelles Vitesse en 2024, mais cette discipline inclut plus que le roulage loisir et omet les pratiquants uniquement couverts à la journée.[2]

Ces deux nombres matérialisent un entonnoir de recrutement, pas le marché total adressable. Il serait faux de les additionner, de les dédupliquer sans données FFM ou de les extrapoler au parc des motos. L'automobile n'a pas été dimensionnée dans cette analyse et reste hors du segment initial.

### Les dépenses liées à la pratique sont observables ; celles du logiciel ne le sont pas

Les calendriers 2026 montrent des journées moto offertes autour de 129 à 245 € chez Activbike et jusqu'à 280 à 330 € chez BMW, avant transport, pneus, carburant, hôtel ou entretien.[4][5] Ces tarifs attestent seulement les prix proposés par journée ; ils ne prouvent ni la fréquence d'achat par pilote ni la volonté d'ajouter un abonnement logiciel.

Dans un fil récent, certains motards déclarent utiliser Notes, Sheets, du papier ou le manuel ; ce témoignage ne permet d'estimer ni la répartition de ces pratiques ni leur prévalence en France.[6] Dans un autre fil, certains pratiquants déclarent utiliser le coût par heure de piste pour optimiser leur saison, tandis que d'autres disent en plaisantant préférer ne jamais calculer le coût total de leur pratique.[7] L'hypothèse produit consiste donc à afficher le coût lorsqu'il éclaire une décision — budget restant, coût par heure, comparaison prévu/réel — plutôt que sur l'accueil par défaut.

### Hypothèses de jobs les mieux étayées par l'offre

1. **Préparer la prochaine sortie.** Apex Lines et les offres de location/assistance rendent visible la préparation mécanique ; son poids pour l'utilisateur français reste à mesurer.[8][20]
2. **Compter selon l'usage sévère réel.** Heures moteur, journées, sessions, cycles thermiques et consommables existent déjà comme unités produit.[8][9][10][13]
3. **Reconstituer ce qui s'est passé avec moins de saisie.** Emails, factures, photos et exports sont des entrées techniquement plausibles ; le gain utilisateur du rapprochement n'est pas encore observé.
4. **Optimiser la saison si on le souhaite.** Le coût par heure aide certains pratiquants, pas nécessairement tous.[7]
5. **Conserver des preuves d'entretien.** Plusieurs concurrents proposent reçus, PDF ou transfert ; l'effet commercial à la revente reste inconnu.[9][10][18][19]

## 2. Paysage concurrentiel

### Le terrain fonctionnel est occupé

- **Apex Lines** relie déjà jours, sessions et tours aux heures moteur, cycles de pneus, maintenance/readiness et exports, avec une offre à 39,99 $/an.[8]
- **MotoBook** est français, gratuit côté pilote, raisonne en kilomètres, jours de roulage ou heures, conserve les factures et permet le transfert du dossier ; Google Play affiche 10 000+ téléchargements.[9]
- **LookOver** couvre intervalles combinés par miles/heures/nombre de courses/date, coûts, reçus, PDF et transfert QR pour 24,99 $/an.[10]
- **Bikerflow**, **MotoVault** et **EMX** recouvrent déjà entretien, sorties ou capture de trajets, coûts, pièces justificatives et transfert à des degrés différents.[11][12][13]
- **RideApp** et **TrackMate** occupent le calendrier, la réservation, les documents et le check-in français.[14][15]
- **RaceChrono** est un chronomètre/télémétrie établi, à 22,99 €, avec 2 600+ circuits, 10 000+ téléchargements Pro et environ 1 000 avis publics.[16]

Les substituts à coût monétaire nul — Sheets, Notes, papier, compteur d'heures — sont susceptibles d'être difficiles à déplacer ; cette inertie doit être mesurée, pas présumée.[6]

### Hypothèses de différenciation à tester

La cartographie des concurrents laisse entrevoir une exécution adaptée au marché français ; elle ne prouve ni la demande pour cette combinaison, ni l'accès aux imports, ni sa défendabilité :

- import autorisé des événements et exports de session déjà utilisés en France ;
- confirmation minimale de l'usage réel, au lieu d'une nouvelle saisie exhaustive ;
- règles multi-horloges explicables, avec données manquantes et incertitude visibles ;
- passage direct de « ce qui s'est passé » à « ce qu'il faut préparer ensuite » ;
- preuves attachées aux interventions et composants, avec export ouvert et divulgation sélective.

Cet assemblage reste facile à copier. Les intégrations, le modèle de données, l'historique et la distribution par des partenaires ne sont que des avantages défendables potentiels à valider ; la simple mention « IA » n'en est pas un.

### Le nom de travail est commercialement encombré

MyPaddock est le nom exact d'une plateforme fan actuelle d'Oracle Red Bull Racing.[39] Dans le même marché fonctionnel, PaddockPro propose setup, GPS, sessions et analyse, tandis que ThePaddock propose track days, chronos, garages, événements et communauté jusque dans l'App Store français.[40][41] D'autres logiciels moto/motorsport utilisent encore le mot Paddock comme élément dominant.[42]

Ce constat ne prouve pas qu'une marque France/UE est juridiquement indisponible. L'INPI précise d'ailleurs qu'une recherche de nom identique n'est qu'un premier niveau et recommande l'analyse des similarités orthographiques, phonétiques et conceptuelles.[43] Il suffit néanmoins à une décision de produit : **ne pas investir dans le nom MyPaddock/MyPadock/PaddockPro/ThePaddock** et rechercher un noyau verbal distinctif avant toute exposition publique.

## 3. Produit et modèle économique

### Boucle produit à tester

> **Importer une sortie → confirmer l'usage et les opérations → voir les prochaines actions → conserver les preuves utiles.**

Une réservation ou un check-in crée un brouillon ; il ne certifie ni les sessions roulées ni l'usure. Certains roulages loisir interdisent même tout chronométrage, ce qui invalide toute règle universelle fondée sur les données de l'organisateur.[17] La durée réellement roulée doit être confirmée par l'utilisateur, un export de session ou une mesure adaptée. Chaque rappel indique la règle qui l'a déclenché et son degré d'incertitude ; il recommande une inspection ou une opération sans déclarer la machine « sûre ».

### Monétisation à tester, pas à prévoir

| Moment de valeur | Cellule de test | Pourquoi ce n'est pas encore un prix |
|---|---:|---|
| Core | Gratuit, une moto | Variante à comparer à un essai limité ou payant ; la gratuité concurrente ne dicte pas le modèle. |
| Pro saison | 29–39 €/an | Aligné sur Apex Lines, MotoVault et LookOver ; aucune conversion observée.[8][10][12] |
| Partage vente | 9–19 € ponctuels | Plage expérimentale arbitraire ; seul le repère MotoStack à 9,99 $ est observé.[18] |
| Loueur/école | À découvrir | Substituts publiés 9–199 €/mois ; aucune volonté de payer observée.[22][23][24] |

WELYGO publie une commission de 5 % et Tarmago de 7 % ; pour des billets observés de 129 à 330 €, cela représente environ 6,45 à 23,10 € de commission brute par réservation, avant les coûts de support, de remboursement, de fiscalité et de paiement.[25][26] Le taux de réachat, les coûts réels et les revenus annexes restent inconnus : avec pour seul revenu observé celui de la première réservation, la viabilité économique n'est pas démontrée. Un lien direct vers la réservation constitue donc le test initial le moins engageant, sans préjuger du modèle de place de marché.

### Piste B2B subordonnée : loueurs et écoles

Dans ce corpus, les loueurs et écoles sont la piste B2B prioritaire à étudier. Activbike publie un parc de 10 motos à partir de 450 €/jour, assistance et consommables compris ; H2S affiche des locations de 420 à 550 €/jour, des cautions de 3 500 à 5 000 € et des trains de pneus de 355 à 540 €.[20][21] Les états avant et après location, la disponibilité et le reconditionnement font donc apparaître un enjeu économique observable, sans urgence d'achat démontrée.

Ce signal ne prouve ni un besoin logiciel urgent ni une intention d'achat. Epsylon vend déjà un ERP atelier/location à 9–89 € HT/mois, FleetMoto un outil loueur à 19,90–99,90 €/mois et RaceWise une suite adjacente pour les écuries automobiles à 29–199 €/mois.[22][23][24] Le bon test B2B n'est pas une page de présentation générique : c'est l'observation du reconditionnement entre deux journées, suivie d'une demande de projet pilote payant ou d'un engagement sur un flux précis.

## 4. Acquisition

### Ordre des canaux

1. **Dogfooding réel** sur les motos et sorties du fondateur, pour mesurer temps de capture et erreurs.
2. **Partenaires organisateurs/ateliers** avec liens, QR ou imports autorisés ; mesurer seconde action et sortie suivante, pas le nombre d'inscrits.
3. **Pages organiques à forte intention** sur circuits, événements et checklists, seulement avec données fraîches et autorisées.
4. **Publicité Meta ou agent d'acquisition** uniquement après définition d'un événement de valeur en aval de l'installation, attribution et marge. La capacité d'automatiser une campagne ne constitue pas une preuve de CAC rentable.[27]

NanoCorp est reporté : plan Founder à 30 $/mois, publicité à 15–150 $/jour via sa propre infrastructure Meta, 20 % sur les retraits et revue humaine requise.[33][34][35][36][38] Aucun résultat d'acquisition indépendant ni portabilité complète n'est documenté. Tout essai futur conservera actifs, attribution et leads hors de l'outil, après vérification des traitements de données.[37]

## 5. Frontières de confiance et de périmètre

- **Vie privée :** une autorisation du système d'exploitation ne vaut pas automatiquement consentement. Les traitements doivent être minimaux, contextuels et facultatifs, sauf s'ils sont nécessaires au service et reposent sur une base juridique appropriée.[28]
- **Revente :** HistoVec reste généré et partagé par le titulaire ; le produit peut joindre le lien fourni, pas interroger librement une base officielle.[29]
- **Données d'annonces :** les CGU Leboncoin interdisent extraction, indexation et robots sans autorisation expresse. Les anciens scrapers ne doivent pas revenir en production sans licence écrite.[30]
- **Paiement :** encaisser puis reverser à un organisateur peut relever d'un ou plusieurs services de paiement selon le montage. Faire qualifier le flux et, si nécessaire, recourir à un prestataire de services de paiement ou à un agent autorisé. Le produit minimum viable redirige vers la page de paiement de l'organisateur.[31]
- **Assurance :** une mise en relation bornée peut rester distincte de la distribution ; comparaison, conseil ou aide à la conclusion nécessitent une architecture partenaire et potentiellement ORIAS.[32]
- **Partage :** un dossier de circuit complet ne doit jamais être transféré par défaut. Une garantie commerciale Yamaha Selected Occasion 2026 exclut les avaries résultant de tout usage circuit ; l'effet sur la perception ou le prix d'un acheteur n'est pas mesuré.[19]

## 6. Sources

| # | Affirmation ou constat étayé | Éditeur | Publication | Consulté | Confiance |
|---|---|---|---|---|---|
| [1] | Volumes FFM 2024 ; Pass Circuit non dédupliqués et non ventilés vitesse | [FFM — rapport d'activité 2024](https://www.ffmoto.org/sites/default/files/documents/pdf/2025/08/WEB_FF%20moto%20RA-24-25.pdf) | 2025-08 | 2026-08-16 | Élevée sur les titres, faible comme décompte de personnes |
| [2] | 10 473 licences annuelles Vitesse en 2024 | [FFM — projet sportif fédéral 2025](https://www.ffmoto.org/sites/default/files/documents/pdf/2025/04/Projet%20sportif%20fe%CC%81de%CC%81ral%202025.pdf) | 2025-04 | 2026-08-16 | Élevée sur le tableau, faible comme marché loisir |
| [3] | Pass Circuit Vitesse 2026 : une journée, nominatif, 25/47 € | [FFM — descriptif Pass Circuit](https://pratiquer.ffmoto.org/sites/default/files/documents/pdf/2025/12/DESCRIPTIF_PASS%20CIRCUIT_VITESSE_PILOTE_2026.pdf) | 2025-12 | 2026-08-16 | Élevée |
| [4] | Exemples de prix journées et packs 2026 | [Activbike — calendrier](https://activbike.net/calendrier) | s.d., calendrier 2026 | 2026-08-16 | Élevée sur l'offre affichée |
| [5] | Track days premium à 280–330 € | [BMW Motorrad France](https://www.bmw-motorrad.fr/fr/experience/overview/training/trackdays-roulage.html) | s.d., saison 2026 | 2026-08-16 | Élevée |
| [6] | Workarounds Notes, Sheets, papier, manuel | [Reddit — r/Motorrad](https://www.reddit.com/r/Motorrad/comments/1tphz5q/what_do_you_use_to_track_maintenance_on_your_bike/) | 2026-05-27 | 2026-08-16 | Moyenne sur l'existence, faible sur la prévalence |
| [7] | Optimisation coût/heure et évitement du total | [Reddit — r/Trackdays](https://www.reddit.com/r/Trackdays/comments/1nk9dwd/costs_ytd_and_what_ive_learned/) | 2025-09-18 | 2026-08-16 | Moyenne-faible |
| [8] | Sessions, heures moteur, cycles pneus, readiness et prix | [Apex Lines](https://apexlines.app/) | s.d., page active | 2026-08-16 | Élevée sur l'offre, faible sur l'adoption |
| [9] | Jours/heures, factures, transfert et 10K+ téléchargements | [Google Play — MotoBook](https://play.google.com/store/apps/details?hl=fr&id=app.motobook.twa) | 2025-02-11 | 2026-08-16 | Élevée sur la fiche store |
| [10] | Intervalles composés, coûts, preuves, transfert et prix | [LookOver](https://lookover.app/features/) | 2026-07 | 2026-08-16 | Élevée sur l'offre |
| [11] | Entretien, sorties, GPS, coûts et transfert | [App Store France — Bikerflow](https://apps.apple.com/fr/app/bikerflow/id6478007077) | 2024-07-07, dernière MAJ listée | 2026-08-16 | Élevée sur les fonctions, faible sur la trajectoire |
| [12] | Capture automatique, entretien, reçus, coûts et prix | [App Store France — MotoVault](https://apps.apple.com/fr/app/motovault-garage-moto/id6760291360) | 2026-08-12 | 2026-08-16 | Élevée sur l'offre, adoption inconnue |
| [13] | Heures par session, service clocks, coûts, factures et transfert | [App Store France — EMX](https://apps.apple.com/fr/app/emx-entretien-motocross-quad/id1621554220) | 2025-11-11 | 2026-08-16 | Élevée, segment adjacent |
| [14] | Réservation, documents, check-in et chronos en France | [App Store France — RideApp](https://apps.apple.com/fr/app/rideapp/id6758402198) | 2026-07-09 | 2026-08-16 | Élevée sur la fiche store |
| [15] | Calendrier, booking, justificatifs et partenaires publiés | [TrackMate](https://www.trackmate.fr/) | s.d., page active | 2026-08-16 | Moyenne, volumes auto-déclarés |
| [16] | Chrono/télémétrie mature, prix et signaux store | [Google Play — RaceChrono Pro](https://play.google.com/store/apps/details?hl=fr&id=com.racechrono.pro) | 2026-07-08 | 2026-08-16 | Élevée sur la fiche store |
| [17] | Exemple de roulage loisir interdisant tout chronométrage | [TZ Club France — Bourbonnais 2026](https://www.tzclubfrance.fr/wp-content/uploads/2025/12/Dossier-Bourbonnais-2026.pdf) | 2025-12 | 2026-08-16 | Élevée pour ce contre-exemple |
| [18] | Sale Passport et transfert à 9,99 $ par moto | [MotoStack](https://motostack.app/) | s.d., page active | 2026-08-16 | Moyenne, offre vendeur |
| [19] | Exclusion de garantie commerciale pour tout usage circuit | [Yamaha Motor France — garantie Selected Occasion](https://www.yamaha-motor.eu/content/dam/yme/fr/services/you-services/garanties/2026-selected-occasion-CG_YAMAHA_GARANTIE%20VO_EXCELLENCE_10032026%20VF.pdf) | 2026-03-10 | 2026-08-16 | Élevée pour cette garantie uniquement |
| [20] | Parc de 10 motos et location à partir de 450 €/jour | [Activbike — location moto](https://www.activbike.net/info/8_location-moto-roulage-sur-circuit) | s.d., offre 2025/2026 | 2026-08-16 | Élevée sur l'offre publiée |
| [21] | Locations, cautions, pneus et stages | [H2S Moto — tarifs](https://h2smoto.com/tarifs-h2s-moto) | s.d., page active | 2026-08-16 | Élevée sur l'offre publiée |
| [22] | ERP atelier/location à 9–89 € HT/mois | [Epsylon](https://epsylon-cie.fr/en) | 2026, page active | 2026-08-16 | Élevée sur prix, faible sur traction |
| [23] | Logiciel loueur moto à 19,90–99,90 €/mois | [FleetMoto](https://fleetmoto.com/) | 2026, page active | 2026-08-16 | Moyenne, offre vendeur |
| [24] | Suite team auto adjacente à 29–199 €/mois | [RaceWise](https://racewise.ai/) | 2026, page active | 2026-08-16 | Élevée sur prix, faible pour adoption moto |
| [25] | Listing/redirection gratuits et commission intégrée de 5 % | [WELYGO — CGU](https://welygo.com/legal/cgu) | 2026-04 | 2026-08-16 | Élevée |
| [26] | Commission publiée de 7 % | [Tarmago — guide prix](https://tarmago.com/fr/guides/prix-trackday-moto) | s.d., page active | 2026-08-16 | Moyenne, contenu vendeur |
| [27] | Capacité technique des campagnes automatisées, pas CAC piste | [Meta for Business — Advantage+ app campaigns](https://www.facebook.com/business/ads/meta-advantage-plus/app-campaigns) | s.d., page active | 2026-08-16 | Moyenne |
| [28] | Permission OS, consentement et minimisation | [CNIL — permissions des applications mobiles](https://www.cnil.fr/fr/permissions-applications-mobiles-recommandations-de-la-cnil-pour-respecter-la-vie-privee) | 2025-01-14 | 2026-08-16 | Élevée |
| [29] | Rapport HistoVec généré et partagé par le titulaire | [HistoVec — FAQ](https://histovec.interieur.gouv.fr/histovec/faq-comment-utiliser-histovec) | s.d., page active | 2026-08-16 | Élevée |
| [30] | Interdiction d'extraction/indexation/robots sans autorisation | [Leboncoin — CGU](https://www.leboncoin.fr/dc/cgu) | s.d., CGU actives | 2026-08-16 | Élevée |
| [31] | Encaissement-reversement et statut de prestataire de paiement | [ACPR — fonds reçus pour compte de tiers](https://acpr.banque-france.fr/fr/professionnels/lacpr-vous-accompagne/parcours-fintech/contenus-pedagogiques/de-quel-statut-releve-mon-activite/jencaisse-des-fonds-et-les-reverse-une-tierce-personne) | 2025-01-13 | 2026-08-16 | Élevée |
| [32] | Frontière indicateur/distribution d'assurance | [ACPR — intermédiaires d'assurance](https://acpr.banque-france.fr/fr/professionnels/lacpr-vous-accompagne/intermediaires/intermediaires-dassurance) | 2025-06-12 | 2026-08-16 | Élevée |
| [33] | Founder à 30 $/mois, crédits et 20 % sur retraits | [NanoCorp — pricing](https://www.nanocorp.so/pricing) | s.d., page active | 2026-08-16 | Élevée sur le prix affiché |
| [34] | Ads Meta via infrastructure NanoCorp, budget 15–150 $/jour | [NanoCorp — advertising](https://www.nanocorp.so/advertising) | s.d., page active | 2026-08-16 | Élevée sur le fonctionnement revendiqué |
| [35] | Offre d'agents et claims de traction auto-déclarés | [NanoCorp — accueil](https://www.nanocorp.so/) | s.d., page active | 2026-08-16 | Élevée sur l'offre, faible sur la traction |
| [36] | PHOSPHO INC., revue humaine des sorties IA et conditions | [NanoCorp — terms](https://www.nanocorp.so/terms) | 2026-05-04 | 2026-08-16 | Élevée |
| [37] | Catégories de données, Meta/Stripe/fournisseurs et rétention | [NanoCorp — privacy](https://www.nanocorp.so/privacy) | 2026-03-02 | 2026-08-16 | Élevée sur la politique publiée |
| [38] | Statut Active, W24, équipe déclarée de 1 | [Y Combinator — NanoCorp](https://www.ycombinator.com/companies/nanocorp) | s.d., fiche active | 2026-08-16 | Élevée sur la fiche, faible sur la santé du produit |
| [39] | Usage commercial exact et actuel de MyPaddock | [Oracle Red Bull Racing — MyPaddock](https://www.redbullracing.com/int-en/my-paddock) | s.d., page active | 2026-08-16 | Élevée sur l'usage, aucune conclusion de marque |
| [40] | Produit track-day PaddockPro : setup, GPS, sessions, analyse | [PaddockPro](https://paddock-pro.com/) | 2026-03, dernière MAJ indiquée | 2026-08-16 | Élevée sur l'usage commercial |
| [41] | Produit track-day ThePaddock et présence App Store France | [App Store France — ThePaddock](https://apps.apple.com/fr/app/thepaddock/id6757203697) | 2026, fiche active | 2026-08-16 | Élevée sur la distribution française |
| [42] | Usage du mot Paddock par un service moto track-day | [Paddock moto](https://paddockmoto.io/) | s.d., événements 2026 | 2026-08-16 | Élevée sur l'usage commercial |
| [43] | Couverture et méthode officielle de recherche de marque | [INPI — rechercher une marque](https://www.inpi.fr/ressources/propriete-intellectuelle/rechercher-une-marque-base-marques) | s.d., page active | 2026-08-16 | Élevée sur la méthode, aucun résultat candidat |
| [44] | Ordres de réparation, factures et responsabilité du garage | [FFMC — relations avec le garagiste](https://ffmc.asso.fr/les-relations-avec-le-garagiste) | 2025-07-04 | 2026-08-16 | Moyenne ; source juridique associative |

## 7. Carte de fraîcheur

Le calcul mécanique BMAD sur 26 affirmations signale sept éléments au-delà de la fenêtre définie depuis leur date de publication. Tous ont été relus comme documents actifs le 16 août 2026 : ce drapeau décrit l'ancienneté de publication, pas une absence de vérification. Les prochaines échéances futures sont le 1er octobre 2026 pour LookOver et le tableau FFM Vitesse, puis le 8 octobre pour RaceChrono. Les CGU et règles relatives aux paiements, assurances et données personnelles devront être contrôlées au moment de toute implémentation. Le registre reproductible reste dans `claims-staleness.json`.

_Recherche réalisée avec BMAD Deep Recon. Les pages des vendeurs attestent uniquement les offres qu'ils publient, pas leur adoption. Les témoignages attestent l'existence d'un comportement, pas sa prévalence._
