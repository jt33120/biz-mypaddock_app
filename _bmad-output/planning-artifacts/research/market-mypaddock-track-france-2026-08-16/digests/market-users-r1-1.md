# Digest — marché atteignable et jobs utilisateurs (France/Europe, moto d’abord)

## Scope et recherches

- **Décision servie :** délimiter un segment atteignable et identifier les jobs/pains réels pour un produit réunissant entretien lié à l’usage piste, coûts/calendrier de saison et provenance de revente. Aucun verdict global de viabilité n’est formulé ici.
- **Périmètre :** track-days non compétitifs, France en priorité, signaux européens lorsque disponibles; moto d’abord, automobile ensuite.
- **Règle de preuve :** uniquement des sources web récupérées pendant ce run. Les documents projet ne sont pas utilisés comme preuves. Les témoignages communautaires prouvent l’existence d’un comportement ou d’un problème, jamais sa prévalence.
- **Fraîcheur appliquée :** taille/proxy de taille <= 18 mois autant que possible; comportement <= 2 ans. Les données 2024 de la FFM sont retenues car publiées en 2025 et restent le dernier détail public trouvé; les données SDES 2025 servent seulement à montrer pourquoi le parc automobile n’est pas le marché atteignable.
- **Budget :** deux rounds, douze sources retenues. Les résultats trop anciens, commerciaux sans méthodologie ou hors sujet ont été écartés.

**Round 1 — cartographie large**

1. `site:ffmoto.org rapport activité 2024 licences pass circuit moto`
2. `site:ffsa.org chiffres clés 2024 licenciés pass circuit`
3. `site:statistiques.developpement-durable.gouv.fr parc deux-roues motorisés France 2024`
4. `trackday moto entretien budget calendrier forum 2025 France`

**Round 2 — approfondissement des leads**

1. `site:ffsa.org rapport annuel 2024 licences pratiquants chiffres clés`
2. `site:acem.eu 2025 registrations motorcycles France Europe statistics`
3. `site:bmc-moto.com calendrier roulage 2026 prix OR site:box23.fr calendrier 2026 roulage`
4. `trackday motorcycle service history resale maintenance log forum 2025`
5. `site:acem.eu press release motorcycle registrations 2025 France Europe`
6. `site:ffmoto.org rapport activité 2025 licences Pass Circuit`

Les requêtes ACEM n’ont pas livré de source officielle exploitable sur la participation aux track-days. Le round 2 s’est donc arrêté sur ce manque plutôt que de substituer des immatriculations moto à un nombre de pratiquants piste.

## Claims table

| Claim | Exact URL | Publisher | Publication date | Accessed | Confidence | Class |
|---|---|---|---|---|---|---|
| En 2024, la FFM a délivré **100 164 titres** : 66 179 licences annuelles, 14 817 licences « une manifestation » et 19 168 Pass Circuit. Ce sont des titres délivrés, pas un décompte de personnes uniques; le rapport ne ventile pas les Pass Circuit « vitesse » des autres usages. | <https://www.ffmoto.org/sites/default/files/documents/pdf/2025/08/WEB_FF%20moto%20RA-24-25.pdf> | Fédération Française de Motocyclisme (FFM) | 2025-08 (mois de dépôt; jour non indiqué) | 2026-08-16 | Élevée sur les volumes; faible comme proxy de personnes uniques ou de vitesse seule | quant-market-proxy |
| Au 1er décembre 2025, la FFM annonçait **101 243 licences et titres de pratique** et une « hausse sensible » des Pass Circuit, sans publier leur nombre exact. | <https://www.ffmoto.org/actualite/conference-de-presse-ffm-ce-quil-faut-retenir> | FFM | 2025-12-17 | 2026-08-16 | Élevée sur le total; moyenne sur la tendance Pass faute de valeur | trend-market-proxy |
| Le Pass Circuit Vitesse 2026 couvre uniquement le roulage loisir non compétitif sur circuit de vitesse homologué en France; il est nominatif, non cessible et valable **une seule journée**. Tarifs affichés : 47 € ou 25 € en version Eco, avec frais organisateur possibles. | <https://pratiquer.ffmoto.org/sites/default/files/documents/pdf/2025/12/DESCRIPTIF_PASS%20CIRCUIT_VITESSE_PILOTE_2026.pdf> | FFM | 2025-12 (jour non indiqué) | 2026-08-16 | Élevée | operating-rule / pricing |
| La FFSA publie **70 000 licences et titres de participation en 2025**, agrégés sur automobile et karting et huit disciplines. Ce chiffre ne mesure ni les personnes uniques ni les seuls track-days circuit auto. | <https://backoffice.ffsa.org/uploads/documents/medias/chiffres-cles-ffsa-2026.pdf> | Fédération Française du Sport Automobile (FFSA) | 2026 (date exacte non indiquée) | 2026-08-16 | Élevée sur l’agrégat; faible comme proxy track-day auto | quant-market-proxy |
| La France comptait 39,7 M de voitures particulières en circulation au 1er janvier 2025. C’est un univers de véhicules, pas un marché atteignable de pistards; l’utiliser comme TAM track-day créerait plusieurs ordres de grandeur de surestimation. | <https://www.statistiques.developpement-durable.gouv.fr/donnees-sur-le-parc-automobile-francais-au-1er-janvier-2025> | SDES, ministère de la Transition écologique | 2025-09-19 | 2026-08-16 | Élevée sur le parc; faible pertinence pour le segment | market-context / anti-proxy |
| Le calendrier 2026 d’un organisateur français (Box23) combine France, Portugal et Espagne, journées et packs, options d’assurance/annulation, restrictions de pneus ou de marque et transport. Exemples observés : journée française de 99 à 255 €, packs européens de 550 à 750 €, transport Portimão affiché à 500 €. Ce sont les prix d’un seul organisateur, pas une moyenne de marché. | <https://www.box23.fr/calendrier.php> | Box23 Organisation | n.d. — calendrier dynamique saison 2026 | 2026-08-16 | Élevée sur l’offre affichée; moyenne pour généraliser | pricing-calendar / channel |
| Dans un fil français consacré aux track-days, un pratiquant indique que la piste implique déjà des entretiens rapprochés et qu’il vidange annuellement malgré une périodicité routière de deux ans. Une voix seulement : existence du besoin, pas fréquence dans le marché. | <https://forum.hardware.fr/hfr/Discussions/Auto-Moto/trackdays-sorties-preparations-sujet_93228_1140.htm> | Forum Hardware.fr, communauté Auto/Moto | 2025-04-21 (messages cités) | 2026-08-16 | Faible à moyenne; page accessible seulement via extrait indexé pendant le run | user-voice / track-maintenance |
| Des motards décrivent un patchwork de notes téléphone, carnet fait maison, manuel d’entretien, reçus annotés et application; plusieurs relient explicitement le journal d’entretien à l’information du prochain propriétaire. | <https://www.reddit.com/r/motorcycles/comments/1tx3pue/time_for_an_oil_change_how_does_everyone_keep/> | Reddit, r/motorcycles | 2026-06-04 | 2026-08-16 | Moyenne sur l’existence et la diversité des workarounds; aucune prévalence | user-voice / workaround |
| Dans une communauté dirt-bike, les réponses utilisent heures, nombre de sorties, carnet, classeur ou tableur; un vendeur rapporte qu’un acheteur est parti faute de dossier, et plusieurs expliquent que l’usage sévère rend les intervalles routiers inadaptés. C’est un analogue d’usage intensif, pas une preuve directe pour la vitesse sur asphalte. | <https://www.reddit.com/r/Dirtbikes/comments/1hx0v77/what_is_your_favorite_way_of_tracking_maintenance/> | Reddit, r/Dirtbikes | 2025-01-09 | 2026-08-16 | Moyenne sur l’existence; faible à moyenne pour transfert au track-day vitesse | user-voice / severe-use-analogue |
| Un fil récent montre simultanément des tableurs avec rappels, des carnets/reçus et des apps transférables; un vendeur associe son historique imprimé à une vente proche du prix demandé, tandis qu’un autre dit que ses acheteurs n’ont jamais accordé d’importance aux preuves. | <https://www.reddit.com/r/motorcycles/comments/1jcskak/how_do_you_folks_keep_track_of_maintenance_or_do/> | Reddit, r/motorcycles | 2025-03-16 | 2026-08-16 | Moyenne sur la contradiction; faible sur tout effet prix | user-voice / resale-contradiction |
| Un propriétaire européen qui passe de l’entretien garage au DIY demande s’il peut encore revendiquer un historique complet. Les réponses distinguent carnet tamponné et dossier honnête de reçus, révélant un problème de preuve et de vocabulaire à la revente. | <https://themotorbikeforum.co.uk/topic/53490-service-history/> | The Motorbike Forum (R.-U.) | 2025-06-17 | 2026-08-16 | Moyenne sur l’existence du problème; aucune prévalence | user-voice / trust-provenance |
| Un autre fil oppose les usages : certains consignent service et reçus dans un livre ou un tableur, tandis que d’autres refusent de suivre trajets et carburant ou s’en remettent au compteur/manuel. Le besoin « entretien » ne permet donc pas de supposer un intérêt pour un tracker généraliste de conduite. | <https://www.reddit.com/r/motorcycles/comments/1poau0m/how_do_you_track_your_bikes_rides_fuel_and/> | Reddit, r/motorcycles | 2025-12-16 | 2026-08-16 | Faible à moyenne; petit échantillon auto-sélectionné | user-voice / scope-contradiction |

## Findings

### 1. Segment atteignable : une porte d’entrée identifiable, mais pas encore un headcount

Le segment le plus directement observable est : **les pratiquants moto de roulage loisir vitesse en France qui réservent auprès d’organisateurs et utilisent soit un Pass Circuit Vitesse à la journée, soit une licence annuelle FFM**. La distribution est concrète : le Pass peut être acheté sur la plateforme FFM ou via l’organisateur, puis présenté au roulage; les organisateurs exposent calendriers, comptes et inscriptions en ligne.

Le meilleur ancrage quantitatif trouvé est **19 168 titres Pass Circuit délivrés en 2024**, mais il ne faut pas le transformer en « 19 168 utilisateurs » :

- un Pass Vitesse vaut une journée, donc un même pilote peut en acheter plusieurs;
- le rapport agrège les Pass Circuit sans publier le sous-total vitesse;
- des pilotes de roulage utilisent une licence annuelle et ne figurent donc pas dans ce sous-total;
- les 66 179 licences annuelles couvrent toutes les disciplines FFM, pas seulement la vitesse.

Conclusion de délimitation, pas de viabilité : **19 168 est un volume annuel de titres Pass Circuit tous types, utile pour matérialiser un funnel, mais ni un plancher ni un plafond fiable de personnes uniques pratiquant le track-day vitesse.** Le total FFM 2025 monte à 101 243 titres et la Fédération signale une hausse des Pass, ce qui confirme l’activité du funnel sans permettre de le dimensionner précisément.

Le **wedge utilisateur à valider en premier** est donc qualitatif : pratiquant moto répétitif, souvent impliqué dans l’entretien, qui réserve plusieurs journées, arbitre un budget saison et veut conserver des preuves pour lui-même ou un futur acheteur. C’est une inférence croisant le funnel FFM/organisateur et les workarounds observés; sa taille et sa volonté de payer restent inconnues.

### 2. Automobile en second : le proxy public est encore moins exploitable

La FFSA annonce 70 000 licences et titres de participation en 2025, mais agrège automobile, karting, licences et titres ponctuels, circuit et sept autres disciplines. Le chiffre ne permet pas d’isoler le loisir circuit. À l’autre extrême, les 39,7 M de voitures en circulation mesurent le parc, pas l’intention piste.

La recherche soutient donc seulement un **ordre d’investigation** : traiter l’auto après obtention de données organisateur/FFSA spécifiques au roulage circuit, sans supposer que le parc automobile ou le total fédéral soit adressable.

### 3. Le comportement est déjà franco-européen chez un organisateur français

Box23 vend dans un même calendrier 2026 des journées françaises et des packs à Portimão, Valencia, Catalunya et MotorLand Aragón, avec transport depuis plusieurs villes françaises. Cela établit l’existence d’un parcours cross-border accessible depuis la France, mais pas sa fréquence ni le nombre de clients européens.

Implication de recherche : l’unité utile n’est pas seulement « un circuit » ou « une date », mais une combinaison **date + pays + organisateur + éligibilité machine/pneus + couverture/option + transport + pack**.

### 4. Jobs utilisateurs soutenus par les preuves

1. **Construire une saison faisable, pas seulement trouver une date.** Le pilote doit comparer des journées et packs dont le prix, le pays, les restrictions pneus/marque, les options et le transport diffèrent. Un calendrier unifié aurait donc besoin de filtres d’éligibilité et de coût total. Le job est structurellement prouvé par l’offre; la frustration et la volonté de payer pour le résoudre ne le sont pas encore.

2. **Prévoir le cash de saison au-delà du prix d’inscription.** Sur le seul exemple Box23, les montants affichés vont de 99 € pour une journée française à 750 € pour un pack européen, auxquels peuvent s’ajouter option, transport et Pass FFM de 25/47 €. Cela justifie un budget par événement puis consolidé par saison; aucune moyenne de dépense utilisateur ne peut être calculée à partir de cette source.

3. **Déclencher l’entretien selon l’usage sévère réel.** Les voix piste/intensif parlent de cadence rapprochée, d’heures, de sorties et de consommables. Le job probable est « savoir quoi faire avant/après la prochaine journée et combien de journées/heures une pièce a tenu », plutôt qu’un simple rappel kilométrique routier. La preuve directe vitesse reste mince et doit être approfondie.

4. **Capturer vite ce qui a été fait et ce qui vient ensuite.** Notes, trip meters, carnet, manuel, reçus, classeur, tableur et apps coexistent. Le pain observable est la fragmentation et l’oubli; les champs récurrents sont date, kilométrage/heures, intervention, fluide/pièce, reçu et prochain intervalle.

5. **Transformer l’entretien DIY en dossier transmissible.** Plusieurs utilisateurs veulent imprimer ou transférer l’historique au futur propriétaire; les propriétaires DIY cherchent comment rendre leurs preuves lisibles quand il n’existe pas de tampon garage. Le job n’est pas seulement « stocker », mais **présenter un historique compréhensible et crédible**.

6. **Ne pas être forcé dans un tracker généraliste.** Certains utilisateurs veulent le service et les reçus mais rejettent le suivi des trajets ou du carburant. Le cœur testé devrait donc rester piste/entretien/coûts/provenance, avec le reste optionnel jusqu’à preuve contraire.

### 5. Provenance de revente : valeur plausible, confiance non résolue

Les témoignages convergent sur l’utilité personnelle d’un historique, mais divergent nettement sur son effet commercial : certains rapportent un acheteur rassuré ou une vente proche du prix demandé; d’autres disent que les acheteurs ne demandent rien ou qu’un journal auto-déclaré peut être falsifié.

Conséquences de cadrage :

- ne pas promettre de hausse de prix de revente sur la base de ces sources;
- positionner d’abord la provenance comme réduction de l’incertitude et continuité d’entretien;
- distinguer **entrée propriétaire**, **preuve jointe** (facture/photo/référence pièce), **attestation professionnelle** et **transfert de propriété**;
- tester si exposer l’usage piste rassure par la rigueur d’entretien ou inquiète par l’intensité d’usage — aucune source récupérée ne tranche ce point.

## Contradictions et gaps

- **Titres vs personnes :** ni la FFM ni la FFSA ne publient ici des personnes uniques. Les Pass à la journée peuvent être répétés; les licences annuelles couvrent plusieurs disciplines.
- **Vitesse non isolée :** le détail FFM 2024 donne 19 168 Pass Circuit, mais pas le sous-total Pass Circuit Vitesse. Le total 2025 n’est pas ventilé.
- **Vérification indépendante :** les chiffres FFM détaillés et leur tendance proviennent du même éditeur primaire. Aucune publication indépendante fraîche donnant la même ventilation n’a été trouvée dans le budget.
- **Auto non isolée :** les 70 000 titres FFSA mélangent automobile/karting, annuel/ponctuel et toutes disciplines. Aucun compteur public de track-days auto loisir ou de participants uniques n’a été trouvé.
- **Europe non dimensionnée :** Box23 prouve une offre transfrontalière, pas un marché européen. Les recherches ACEM n’ont fourni aucun indicateur officiel de participation piste; des immatriculations seraient de toute façon un proxy trop éloigné.
- **Offre ≠ demande :** calendrier et prix officiels montrent la complexité de l’achat, pas les réservations, présences, répétitions ou dépenses réelles.
- **User voice mince et biaisée :** les témoignages sont auto-sélectionnés, surtout anglophones; l’un des fils concerne le dirt-bike, utilisé seulement comme analogue d’usage sévère. Aucune prévalence n’est revendiquée.
- **Revente disputée :** bénéfice perçu chez certains vendeurs, absence d’effet chez d’autres; aucune donnée de prix ou délai de vente contrôlée.
- **Authenticité :** un log auto-déclaré peut être falsifié. Les sources ne démontrent pas quel niveau de preuve acheteurs, garages ou plateformes accepteraient.
- **Bundle non validé :** aucun signal direct ne prouve que les mêmes utilisateurs veulent les trois fonctions dans une seule application, ni qu’ils paieraient pour elles. Le recouvrement est une hypothèse à tester.

## Leads à poursuivre

1. **FFM / Pass Circuit :** demander pour 2024-2025 le nombre de Pass Circuit Vitesse, d’acheteurs uniques, la distribution de répétition (1, 2-3, 4+ jours), la région/circuit et le recouvrement avec les licences annuelles.
2. **Organisateurs moto :** obtenir auprès de Box23, BMC, De Radiguès et autres les réservations réellement consommées, repeat rate, annulations, pays de résidence, panier journée/pack et capacité à exporter calendriers/prix.
3. **FFSA / organisateurs auto :** isoler les titres de participation circuit loisir, personnes uniques, journées par personne, en excluant karting et compétition.
4. **Recherche utilisateur France :** recruter séparément primo-pistards, répétiteurs et vendeurs/acheteurs de motos de piste; demander leurs vrais calendriers, tableurs, factures et carnets plutôt que des opinions abstraites.
5. **Test de concept :** comparer trois propositions indépendantes puis combinées — plan saison/coût, maintenance par journée/heure, dossier de revente — pour vérifier quel job déclenche l’usage et lequel crée seulement de l’intérêt déclaratif.
6. **Test de confiance :** montrer aux acheteurs et professionnels quatre niveaux de provenance (auto-déclaration, reçu/photo, attestation garage, transfert signé) et mesurer ce qui change réellement confiance, délai et offre d’achat.
7. **Europe :** répéter le comptage organisme/organisateur en Espagne, Portugal, Belgique, Italie et Allemagne; conserver séparément résidents, réservations et day-passes afin d’éviter le même piège de déduplication.

