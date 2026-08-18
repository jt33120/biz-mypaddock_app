# Intention produit — MyPaddock Trackday

> Sortie de la session de brainstorming du 2026-08-17 (mode Partenaire créatif, 8 techniques).
> Source canonique : `.memlog.md` (134 entrées). Ce document ne garde que ce qui engage la suite.

---

## 1. Ce qu'on construit

Une application **moto de piste**, pour le pilote amateur qui roule en trackday.

Elle tient ensemble deux choses que personne ne réunit aujourd'hui : **ce qui est satisfaisant**
(les chronos, la progression, les photos, le partage) et **ce qui est une corvée mais qui coûte
cher quand on ne le fait pas** (l'entretien, le budget réel, la traçabilité à la revente).

**Décision de périmètre : moto uniquement.** L'auto est explicitement écartée de la v1 —
pas assez de recul du porteur, et sur la moto il est utilisateur numéro un.

## 2. Le critère de succès, et il a changé

Le projet n'est plus jugé sur « revenu rapide et viable ». Le porteur l'a recadré en fin de
session : **bac à sable, rien à perdre, il veut d'abord une app qui lui soit utile à lui.**

Conséquences directes sur tout ce qui suit :

- Le dogfooding est garanti, l'utilisateur numéro un est le développeur.
- La pression de monétisation immédiate est nulle. Aucune décision produit ne doit être prise
  pour un revenu qu'on ne cherche pas encore.
- Le terrain encombré des apps de chrono cesse d'être disqualifiant, puisqu'on ne cherche pas à
  battre RaceChrono.
- **Le risque se déplace** : il n'est plus l'absence de marché, il est de construire un truc que
  seul lui utilise et de s'en lasser. Le critère de scope devient donc littéralement :
  *de quoi ai-je besoin pour ma prochaine saison.*

## 3. Le mécanisme central du produit

**L'ennuyeux voyage clandestinement avec le satisfaisant.**

On saisit son chrono par plaisir. L'app en déduit un roulage de plus, donc une usure de plus.
La maintenance se suit **sans que le mot maintenance soit prononcé**, et sans dépendre ni des
organisateurs ni de RaceChrono pour la donnée.

Deux règles de conception non négociables en découlent :

1. **Une saisie ne promet jamais une utilité future, elle se rembourse dans le même geste.**
   Chrono saisi = courbe qui monte + post prêt à partir. Entretien coché = compteur d'usure remis
   à zéro sous les yeux.
2. **L'horloge d'entretien tourne à la vitesse du pilote, pas au calendrier.** Le danger
   n'apparaît pas avec le temps, il apparaît quand on progresse : un pilote à 70 % ne découvre
   jamais son liquide fatigué ; le même à 90 % trois mois plus tard, si. C'est le vécu fondateur —
   fading des freins, chute, liquide trop vieux — et c'est ce qui distingue ce carnet de tous les
   carnets d'entretien existants.

**Positionnement qui évite le paternalisme** : pas une nounou qui interdit, un **chef d'équipe**.
En course, quand le pilote va plus vite, le team upgrade la prépa. L'amateur solo n'a pas de team.

## 4. Ce que la v1 contient — neuf domaines

Le critère de découpe n'est **pas la quantité de features**, c'est la **dépendance au réseau**.
La v1 de 2025 est morte avec douze domaines dont la moitié affichaient du vide ; le nombre
n'était pas le problème, l'écran vide l'était.

Ces neuf-là ont tous du contenu **dès le premier jour, avec un seul utilisateur** :

| # | Domaine | Ce qu'il fait |
|---|---|---|
| 1 | **Maintenance à deux étages** | L'étage facile (chaîne, plaquettes, liquide) avec tuto, lien produit et consignation. L'étage lourd (bougies, pneus, fourche) : savoir que c'est dû et où le faire faire. |
| 2 | **Chronos et PR par secteur** | La magie de Strava n'est pas le classement — démoralisant en sport méca — c'est le **record personnel par segment**. Un circuit est déjà découpé en secteurs : ça se transpose sans rien inventer, et ça marche pour le débutant comme pour le rapide. |
| 3 | **Coût de la journée et coût au tour** | Circuit, Airbnb, essence, bouffe, consommables. Sorti **à posteriori, une fois**, comme une histoire — pas une comptabilité continue, que les pistards refusent. |
| 4 | **Photos et album de saison** | La photo prise pendant le roulage, pleine d'adrénaline, atterrit dans l'album de l'année. |
| 5 | **Récap du soir partageable** | *11 sessions, 4 h 20 en piste, meilleur tour 1'47, 612 €, 3,27 € le tour.* Auto-généré, postable en story. **L'app fabrique le contenu qui recrute les suivants.** |
| 6 | **Barème constructeur et horloge d'usure** | On ne conseille pas mécaniquement — contrainte de sécurité actée : aucun conseil sans corpus borné validé par un pro. On **transcrit le barème** et on affiche où en est la machine, à la vitesse du pilote. |
| 7 | **Mode off-saison** | L'hiver n'est pas un trou, c'est l'autre mode du produit : bilan de saison, budget prévisionnel, grosse maintenance, achat-revente. Le porteur a nommé l'off-saison comme un vrai moment de saisie. |
| 8 | **Checklist de chargement** | Circuit, météo, groupe et état machine connus → voilà ce que tu charges dans le camion. Le truc qu'on oublie à 400 km de chez soi. |
| 9 | **Conformité par organisateur** | Décibels, lockwire, carénage, pneus autorisés. Chaque orga a ses règles, personne ne centralise. Évite le refus au portail et la journée perdue à 250 €. |

## 5. Ce qui attend une foule, pas un budget

Ces domaines ne sont pas coupés parce qu'ils coûtent cher à construire. Ils sont coupés parce
qu'ils **naissent morts sans utilisateurs**, et qu'un écran vide signale l'abandon à quiconque
découvre l'app :

- **Marketplace** (avec questions adaptées aux machines de circuit) — tombe naturellement en hiver
- **Communauté** : groupes, partage, « qui roule aujourd'hui »
- **Vérification d'annonce** : photographier une annonce LeBonCoin, savoir si la machine a un carnet
- **Logistique partagée** : camion, remorque, box, covoiturage
- **Suite B2B organisateurs**

Ils s'allumeront quand l'Instagram aura amené du monde. **L'architecture doit les prévoir ; le
planning de livraison ne les contient pas.**

## 6. La contrainte de design, qui est une condition de survie

Formulée par le porteur, et non négociable : **un écran, une feature, navigation simple, mais la
densité est là.** C'est ce qui rend neuf domaines légers là où douze mal rangés étaient lourds.

Le mode d'échec qu'il a lui-même nommé : *« si c'est juste un Excel amélioré vibecodé avec une UI
de merde, je n'y crois pas et je désinstalle. »*

Tension à tenir explicitement dans l'architecture : le **banger** (le Strava du chrono) est sur
terrain encombré ; la **valeur durable** (entretien, coût, revente) est le territoire « Excel
amélioré ». Il faut les deux, donc **la partie ennuyeuse ne doit jamais avoir l'air ennuyeuse**.
L'UI passe du statut de finition à celui de condition de survie.

## 7. Ce qui a été vérifié, et qui contraint

**Le champ de la performance est occupé.** RaceChrono (>100 000 utilisateurs actifs, 2 600
circuits préconfigurés), TrackAddict, **LapTrophy** (français : chronos live, classements, suivi
d'amis en temps réel, et analyse d'angle d'inclinaison virage par virage), Lap Tracker, ST1 Track,
Harry's LapTimer. Côté carnet : MotoBook, MotoLog, Veydi, RideApp.

**Lecture structurelle :** le champ se coupe en deux. La couche **performance** est commoditisée.
La couche **argent et machine** (coût réel de la saison, entretien piste, revente, conformité,
logistique) reste mince. Ce n'est pas un hasard : *le fun est ce que les passionnés demandent,
l'ennuyeux est ce dont ils ont besoin.*

**La case réellement vide, et c'est la combinaison :** stats et progression façon Strava
+ espace communautaire trackday + vente + carnet numérique de maintenance. Personne ne fait les
quatre ensemble — parce que les apps de chrono sont bâties par des ingénieurs télémétrie, les
carnets par des gens de l'entretien, les marketplaces par des commerçants. Personne n'a le pied
dans les trois mondes.

**Territoire libre identifié :** la colonne *« geste = rien du tout »* est vide chez tous les
concurrents. RaceChrono exige de lancer une session, MotoBook de remplir le carnet, les apps de
budget de saisir les tickets.

## 8. Les actifs réels

- **6 000 abonnés Instagram pistard** — audience exactement ciblée, déjà constituée, gratuite.
  C'est le facteur qui manquait totalement à la v1 et qui l'a tuée. Compte perso plaisir : le
  porteur y fait ce qu'il veut. *Utile pour sonder un vécu ou un état ; inexploitable pour une
  intention d'achat.*
- **Le porteur roule, code, et a l'audience** — le pied dans les trois mondes.
- **Le code MyPaddock 2.0** : 12 domaines front React/Vite/TS, 12 contextes dont AIContext,
  services en variantes multiples (véhicule ×4, maintenance ×5) — logique éprouvée à récupérer.
- **L'API Railway** : 8 moteurs bilingues (prix marché, TCO, risque via rappels NHTSA, timing,
  dépréciation, verdict, alternatives, décodage VIN), crawlers FR jamais déployés.
- **Un algo d'analyse de footage Insta360** en cours de développement par le porteur.

## 9. Réserve stratégique — à ne pas construire maintenant, à ne pas oublier

- **La feature du turfu** : balancer son footage 360, récupérer son meilleur tour monté, chronos
  incrustés, superposé en fantôme au tour précédent. Partageable, alimente l'Instagram, assez dur
  à faire pour constituer une barrière.
- **Le dossier de revente** : personne ne tient un carnet, mais tout le monde en fabrique un quand
  il y a 8 000 € en jeu. Reconstituer l'historique à posteriori depuis reçus, photos et calendrier —
  et après avoir vécu la douleur de la reconstitution, on se met à logger en direct.
- **Le payoff du carnet** : après N saisons, la seule base en France de ce que vaut une machine
  préparée compte tenu de son historique. Personne d'autre ne peut la construire — personne d'autre
  n'a les carnets. *(« La récolte, pas la semence. »)*
- **Le verrou B2B** : ne jamais remplacer le WhatsApp des organisateurs (gratuit, universel, friction
  nulle, cimetière immense). Être ce vers quoi WhatsApp **pointe** : la page du jour porte horaires,
  groupes, météo, règles de contrôle technique, lien du photographe, puis résultats et récap de coût.
  WhatsApp reste la couche notification, l'app est la couche contenu. **Refus explicite** de la
  suite compta/gestion pour orgas : autre produit, concurrence établie, support intenable en solo.
- **Le photographe** comme troisième face du système : il a un intérêt direct à pousser l'app
  puisqu'elle lui amène ses ventes.
- **Le casque après un choc** — même mécanisme que le liquide de frein : ça doit être changé, et
  personne ne le change.

---

## Ce que la suite doit trancher

1. Le découpage en épics couvrant les 9 domaines, plus l'ossature architecturale des 5 domaines
   en attente (prévus, pas livrés).
2. L'ordre de livraison, dont le critère est : *ce dont le porteur a besoin pour sa prochaine saison.*
3. Le modèle de données du carnet — c'est lui qui porte la valeur long terme (revente, comparables).
4. La direction artistique, traitée comme une condition de survie et non comme une finition.
