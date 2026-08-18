---
title: "Addendum — Product Brief application trackday moto"
status: complete
created: 2026-08-17
updated: 2026-08-17
---

# Addendum

Ce qui n'a pas sa place dans le brief mais doit survivre jusqu'au PRD et à l'architecture.

## Décisions écartées, et pourquoi

| Option | Statut | Raison |
|---|---|---|
| Construire son propre chronométrage GPS | Palier 2, non engagé | Frontal avec RaceChrono (>100 000 utilisateurs, 2 600 circuits). Le GPS haute fréquence est le morceau le plus dur du produit, pour un gain que la saisie manuelle couvre déjà en v1. |
| PR par secteur | Reporté au palier 2 | Exige des temps intermédiaires qu'aucune saisie manuelle ne produit. Remplacé en v1 par la courbe de progression et les achievements, qui ne demandent aucun capteur. |
| Application native | Reportée | 99 $/an, cycles de validation, itération ralentie — pour un produit dont l'auteur est le seul utilisateur connu. À reconsidérer dès qu'il y en a d'autres. |
| Sticker Instagram natif | Impossible en PWA | `instagram-stories://` exige un identifiant d'application Facebook enregistré. L'image pré-composée partagée via `navigator.share()` rend d'ailleurs un meilleur résultat, au prix d'un tap. |
| Suite de comptabilité et gestion pour organisateurs | Refusée | Autre produit, en concurrence avec des outils d'event management établis, avec du support et de la continuité qu'un solo à temps partiel ne peut pas tenir. |
| Remplacer les groupes WhatsApp des organisateurs | Refusée | Gratuit, universel, friction nulle, cimetière immense de produits qui ont essayé. Le bon rôle est d'être **ce vers quoi WhatsApp pointe** : la page du jour porte horaires, groupes, météo, règles de contrôle technique, lien du photographe, puis résultats et récapitulatif de coût. |
| Place de marché, vérification d'annonce, logistique partagée | En attente d'une foule | Un écran vide ne sous-délivre pas, il signale l'abandon. |
| Automobile | Différée | Pas assez de recul du porteur, qui n'en serait pas l'utilisateur. Risque de dilution. |
| Simulateur d'achat et de valorisation | Différé | C'est la récolte, pas la semence : il n'a de valeur qu'une fois les carnets accumulés. |
| NanoCorp pour la distribution | Reporté | 30 $/mois plus 15 à 150 $/jour de publicité Meta, prélèvement de 20 % sur les retraits, aucune mesure indépendante du coût d'acquisition, aucune capacité documentée d'exporter campagnes ou audiences. Sans objet tant que l'acquisition n'est pas un sujet. |

## Contraintes techniques pour la suite

### Échelle de capacité des chronos

Trois paliers, du plus simple au plus exigeant. **Seul le palier 1 est engagé en v1.** L'architecture
doit permettre de monter sans réécrire le modèle de session.

1. **Saisie manuelle.** Le pilote entre son meilleur tour du jour. Zéro dépendance. Produit la
   courbe de progression et la comparaison entre potes, pas les secteurs.
2. **GPS et connexion aux organisateurs.** Débloque les temps intermédiaires, donc le record
   personnel par secteur. Candidat naturel à un accès premium. Les organisateurs détiennent déjà
   les chronos et les affectations de groupe — et le groupe de niveau est un proxy du rythme, donc
   l'entrée de l'horloge d'usure.
3. **Analyse vidéo.** Extraction des chronos et du meilleur tour depuis le footage, sur la base de
   l'algorithme Insta360 en cours de développement par le porteur.

Une connexion aux traceurs GPS grand public reste optionnelle à tous les paliers : la majorité des
pilotes n'en a pas.

### Achievements

Le catalogue est de la **donnée, pas du code** : on doit pouvoir en ajouter sans redéploiement.
Chaque achievement porte une condition (déclarative, ou dérivée d'une donnée déjà présente) et une
preuve facultative — la photo. Familles identifiées : posture (coude au sol), symétrie (genou posé
à gauche *et* à droite), vitesse (palier de chrono par circuit), conditions (premier roulage sous la
pluie), progression (passage au groupe supérieur, dépassement), collection (circuits visités),
assiduité (journée complète sans session sautée), entretien (saison sans échéance dépassée, train de
pneus mené au bout), argent (meilleur coût au tour de la saison).

Les deux dernières familles sont le mécanisme par lequel la corvée entre dans la couche
satisfaisante — et la famille « argent » résout la tension de fond du produit : un budget circuit
descend, alors que ce qui rend une application satisfaisante est un chiffre qui monte. Transformé en
cap franchi, un coût qui descend devient une victoire.

### Partage

Composition de l'image côté client — photo du roulage, stats incrustées, achievement débloqué, marque
discrète — puis `navigator.share()` avec le fichier, qui ouvre la feuille de partage iOS et Android.
Supporté par Safari iOS et Chrome Android. **Le gabarit de cette image est la vitrine publique du
produit** : c'est la seule chose que verront les 6 000 abonnés Instagram. Il relève du même niveau
d'exigence que l'interface.

### PWA et hors-ligne

Il n'y a pas de réseau dans un paddock. Saisie de chrono, prise de photo, saisie de coût et
consultation de l'album doivent fonctionner hors ligne et se synchroniser ensuite. Conséquence :
modèle de données conçu pour l'écriture locale d'abord et la résolution de conflits, pas pour un
aller-retour serveur à chaque geste.

### Réemploi de l'existant

- Conserver les anciens ensembles comme **sources de composants, jamais comme architecture cible**.
- Nouveau schéma canonique. Réutiliser sélectivement : garage, reçus et OCR, coûts, maintenance,
  documents, visualisations. Les services existent en variantes multiples (véhicule ×4, maintenance
  ×5) — signe de logique éprouvée, mais à consolider avant réemploi.
- **Rotation de tous les secrets historiques** avant toute réutilisation.
- Dépôts Git neufs, sans l'ancien co-fondateur.
- Ne pas présenter des simulations ou des heuristiques existantes comme de l'IA.
- Ne pas remettre en production valorisation ou scraping sans données licenciées et validation
  reproductible.

## Conformité et responsabilité

- **Aucune recommandation ne certifie la sécurité d'un véhicule** ni la durée de vie restante d'une
  pièce. On transcrit le barème constructeur et on affiche l'état ; on ne conseille pas. Tout corpus
  mécanique doit être borné et revu par un professionnel avant d'être exposé.
- Une réservation ou une présence sur place ne prouve pas que les sessions ont été roulées.
- Le partage se fait preuve par preuve, révocable, et masque les données privées. Événements,
  incidents, trajets et géolocalisation ne sont jamais transmis automatiquement.
- Une autorisation du système d'exploitation ne vaut pas consentement : traitements minimaux et liés
  à leur contexte.
- **Aucun scraper Leboncoin sans autorisation écrite.** Le rapport HistoVec est transmis par le
  titulaire, il n'est pas librement consultable.
- Tout encaissement pour compte de tiers exige une qualification du flux et, le cas échéant, un
  prestataire de services de paiement. Toute assurance intégrée reste hors périmètre.
- Les photos de circuit appartiennent au photographe : tout affichage suppose son accord, et le
  modèle doit le servir plutôt que le contourner.

## Nom

Précondition commerciale non levée. Le brief utilise « MyPaddock » comme nom de code interne.

- Le nom exact est utilisé par **Oracle Red Bull Racing**.
- **PaddockPro** et **ThePaddock** sont déjà employés pour des offres liées aux journées piste ;
  ThePaddock est distribué en France.
- La graphie « MyPadock » n'élimine ni les collisions phonétiques, ni typographiques, ni celles des
  résultats de recherche.
- Prochaine étape : une liste restreinte dont « Paddock » n'est pas l'élément dominant, puis
  recherches exactes et par similarité dans INPI, TMview, EUIPO et WIPO, vérification des classes,
  et conseil professionnel avant tout dépôt ou toute dépense.

## Paysage concurrentiel

**Couche performance, saturée.** RaceChrono (plus de 100 000 utilisateurs actifs, 2 600 circuits
préconfigurés), TrackAddict (télémétrie et incrustation vidéo), LapTrophy (français : chronos live,
classements, suivi d'amis en temps réel, analyse d'angle d'inclinaison virage par virage), Lap
Tracker, ST1 Track, Harry's LapTimer.

**Couche carnet et entretien, mince.** MotoBook, MotoLog, Veydi, RideApp, Apex Lines, LookOver.

**Lecture.** Aucun acteur ne réunit stats et progression, cercle de pairs, carnet d'entretien et
revente. La raison est structurelle : les applications de chrono sont bâties par des ingénieurs
télémétrie, les carnets par des gens de l'entretien, les places de marché par des commerçants.
Personne n'a le pied dans les trois mondes.

**Colonne libre.** Aucun concurrent n'occupe le territoire du geste nul. RaceChrono exige de lancer
une session, MotoBook de remplir un carnet, les applications de budget de saisir des tickets.

## Chiffres à ne pas surinterpréter

Hérités de la recherche du 2026-08-16, conservés parce que la tentation de les citer reviendra.

- **19 168 Pass Circuit FFM 2024** = titres et journées de plusieurs types, ni personnes uniques ni
  Pass Vitesse seulement.
- **10 473 licences annuelles Vitesse 2024** = indicateur fédéral, pas un décompte des pratiquants
  de loisir ni une estimation dédupliquée de la cible.
- Prix de journées, de locations et prix concurrents = offres publiées, pas des achats répétés ni
  une disposition à payer.
- Notes et fils communautaires = existence d'un comportement, pas prévalence française.
- **Aucun jeu de données ne démontre une prime de revente.** Une garantie commerciale Yamaha
  consultée exclut même les avaries liées à tout usage sur circuit.

## Registre des hypothèses

Établi le 2026-08-18 par un audit d'hypothèses (`bmad-advanced-elicitation`, méthode
*Assumption Audit*) sur le brief. **Confiance** = ce que les sources permettent d'affirmer
aujourd'hui. **Impact** = ce qui casse si l'hypothèse est fausse. Les cinq paris de tête
sont repris dans le brief ; le registre entier vit ici.

| # | Hypothèse | Confiance | Impact |
|---|---|---|---|
| A1 | Le porteur roule une saison 2027 complète, environ onze roulages | moyenne | total |
| A2 | Il saisit le soir même, pas « plus tard » | faible | total |
| A3 | Il poste un récapitulatif spontanément | faible | fort |
| A4 | Il construit l'application pendant la saison qu'il documente | non énoncée au brief | fort |
| A5 | « La saisie se rembourse dans le même geste » suffit contre la lassitude | faible | fort |
| A6 | Un cap franchi peut être rattaché à une photo sans reconnaissance automatique | moyenne après correctif | fort |
| A7 | La comparaison a du contenu dès mars | faible avant correctif | moyen |
| A8 | La strate argent est un territoire vide | moyenne | fort |
| A9 | La disposition à payer est transférable du routier au pistard | faible | moyen |
| A10 | L'audience Instagram existante convertit | faible | fort |
| A11 | Le coût marginal du projet est proche de zéro | partielle — vrai en euros, faux en temps | fort |
| A12 | Une PWA hors ligne suffit à tenir la promesse de continuité | moyenne | fort |
| A13 | Le barème constructeur est récupérable et transcriptible | moyenne | moyen |
| A14 | Un coefficient d'usure par groupe de niveau est calibrable | aucune source | moyen |
| A15 | Sept domaines sur dix sont livrables pour mars | faible | fort |
| A16 | Un domaine doit avoir du contenu dès le premier jour, à un seul utilisateur | haute | fort |
| A17 | Un nom public sera trouvé | moyenne | faible |

### Ce que le test sous contrainte a cassé, et comment c'est réparé

- **A7 violait A16.** Le « cercle de potes » n'a aucun contenu tant qu'un pote n'a pas rejoint, or
  l'arrivée d'un pote est un critère de succès pour octobre : le brief programmait pour mars une
  fonction dont il attendait la condition sept mois plus tard. **Réparé par dégradation gracieuse :**
  la comparaison v1 est *toi contre toi* au même circuit, et s'allume socialement quand un pote roule.
- **A11 comptait les euros et ignorait la seule ressource rare.** Les soirées de code sont les
  soirées de saisie. **Réparé :** le développement doit être fini avant le début de la saison.
- **A6 n'avait pas de mécanisme.** « Si la photo montre un cap franchi, elle débloque cet
  achievement » — sans sujet au verbe. **Réparé :** le geste est déclaré, la photo l'atteste ;
  aucune vision automatique en v1.
- **A12 avait un mode de panne non nommé.** Une app utilisée une fois par mois se fait purger son
  stockage. **Réparé :** rien ne vit uniquement dans le navigateur, contrainte de tête pour le PRD.
- **A14 n'a aucune source.** **Réparé :** paramètre à calibrer, jamais constante affichée.

### Ce qui reste ouvert et ne sera tranché que par l'usage

A1, A2, A3, A5, A10 et A15. Ce sont des paris comportementaux ou de charge : aucune recherche
documentaire ne peut les résoudre, seule la saison 2027 le peut. Le PRD doit donc les
**instrumenter** — un échec doit se constater en mai, pas en octobre.

## Rotation des parties prenantes

Établie le 2026-08-18 (`bmad-advanced-elicitation`, *Stakeholder Lens Rotation*). Le brief était
écrit d'un seul point de vue. Voici ce que voient les autres.

**Le pote (Kévin, groupe rouge).** Il installe parce qu'on le lui a demandé, et il ouvre sur du
vide : sa courbe attend ses roulages, la comparaison attend les deux. Il n'a pas d'audience à
nourrir et le coût au tour ne le concerne pas — ce n'est pas lui qui parle budget en public. Ce qui
l'attire réellement : voir les temps de l'autre et essayer de les battre. Deux exigences en
découlent, désormais au brief : valeur en solitaire dès le jour 1, et visibilité des chronos
optionnelle roulage par roulage. Le plus lent d'un groupe ne veut pas être classé, et c'est lui qui
arrête de saisir en premier.

**L'acheteur à la revente.** Il veut savoir si la machine a chuté, combien d'heures moteur elle a,
si elle a été refaite. Le carnet enregistre l'entretien et la dépense — c'est-à-dire ce qu'un
*vendeur* veut montrer. Un carnet auto-déclaré, ni horodaté par un tiers ni attesté, ne le
convainc pas. MotoBook a répondu par la connexion concessionnaire ; ce projet ne le fait pas. La
promesse a donc été redescendue à son niveau réel dans le brief.

**L'organisateur.** Hors périmètre, décision tenue. Mais la checklist de conformité publie *ses*
règles : si elles changent et que la liste est périmée, un pilote se présente non conforme. La règle
de sécurité du brief couvre le conseil mécanique, pas la conformité administrative. À traiter au
PRD : la liste reflète ce que l'organisateur a publié à une date donnée et ne certifie pas
l'admission.

**Le pilote de juin.** Dimanche soir, quatre heures de route, épuisé — et l'application lui demande
trois champs. Le brief avait placé la saisie au pire moment possible. Le bon moment était déjà écrit
ailleurs dans le même document : entre deux sessions, quand la photo est prise. Corrigé au brief.

## Panel sceptique

Établi le 2026-08-18 (*Shark Tank Pitch*). Seules figurent ici les objections auxquelles le brief
n'avait pas déjà de réponse.

| Objection | Réponse retenue |
|---|---|
| La Vision réclame des milliers de carnets ; le Périmètre refuse la foule. Contradiction. | Acceptée. La base de cotes est requalifiée en **option**, pas en plan. Aucun arbitrage de v1 ne peut s'en réclamer. Inscrit au brief. |
| MotoBook a cinq ans d'avance sur la couche machine. Votre défense est qu'ils n'ont pas bougé. | Objection non levée. Ce n'est pas une défense, c'est un pari. Le cadrage bac à sable l'absorbe sans l'annuler. |
| MotoVault se vend à des routiers qui ouvrent l'app chaque semaine. Un pistard roule onze jours par an. | Acceptée, et c'est la trouvaille du panel. **La cadence d'environ onze usages par an** est désormais nommée au brief comme contrainte structurelle. Elle explique d'un coup la purge de stockage, l'inadéquation d'un abonnement, et la promotion du mode hors-saison. |
| Le canal, ce sont 6 000 abonnés sans ligne éditoriale — une liste de contacts, pas un canal. | Déjà admise au brief (« potentiel, pas actuel »). Sans changement. |

## Chaînes de second ordre

Établies le 2026-08-18 (*Second-Order Thinking*). Chaque mécanisme plaisant du produit, suivi d'un
cran, produit un effet indésirable. Les parades sont passées en clauses de sécurité au brief.

| Mécanisme | 1er ordre | 2e ordre | 3e ordre |
|---|---|---|---|
| Coût au tour | on voit ce que ça coûte | il descend quand on roule **plus** : la victoire s'obtient en dépensant davantage | l'app devient un accélérateur de dépense sous vernis budgétaire |
| Horloge d'usure | l'entretien se suit sans y penser | elle hérite de la qualité d'une saisie faite par plaisir ; une session écourtée non signalée la fait avancer faux | on lui fait confiance, on ne vérifie pas le liquide de frein, l'accident fondateur se répète — avec l'app comme facteur contributif |
| Achievements de geste | la fierté se consigne | « coude au sol » devient quelque chose qu'on va chercher | progression qui dépasse la préparation — exactement l'histoire qui a fait naître le projet |
| Comparaison au cercle | émulation entre potes | le plus lent cesse de saisir | la comparaison érode sa propre donnée |
| Récapitulatif partagé | du contenu qui recrute | publier son chrono, c'est s'exposer au jugement | le premier commentaire désagréable arrête le partage, donc le canal |

**Parade du dernier point, à trancher au PRD :** le récapitulatif doit laisser choisir ce qu'il
montre. Le geste et le coût peuvent porter la publication sans le chrono.
