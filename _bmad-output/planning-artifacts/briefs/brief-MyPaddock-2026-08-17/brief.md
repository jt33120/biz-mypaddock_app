---
title: "Product Brief — application de roulage moto (nom de code MyPaddock)"
status: complete
created: 2026-08-17
updated: 2026-08-18
supersedes: brief-MyPaddock-2026-08-16
---

# Product Brief — application de roulage moto

_MyPaddock est un nom de code interne. Le nom public reste à trouver : le nom exact est utilisé par
Oracle Red Bull Racing, PaddockPro et ThePaddock sont pris._

> Ce brief remplace celui du 2026-08-16, dont la décision de tête — ne rien construire avant
> validation comportementale — est renversée par le recadrage du 2026-08-17.
> Source amont : [`brainstorm-intent.md`](../../../brainstorming/brainstorm-mypaddock-trackday-2026-08-17/brainstorm-intent.md).

## Résumé exécutif

Une application pour le pilote amateur qui fait des roulages moto. Elle tient ensemble deux choses
que personne ne réunit aujourd'hui : **ce qui fait plaisir** — les chronos, la progression, les
photos, les caps franchis, la comparaison avec les potes — et **ce qui est une corvée mais coûte
cher quand on ne le fait pas** : l'entretien, le budget réel de la saison, la traçabilité à la
revente.

Le mécanisme central est que **l'ennuyeux voyage avec le satisfaisant**. On saisit son meilleur
tour par plaisir ; l'application en déduit un roulage de plus, donc une usure de plus. L'entretien
se suit sans que le mot entretien soit prononcé. Et lorsque la corvée doit apparaître en clair, elle
apparaît sous forme de fierté : « saison complète sans échéance dépassée » est un cap franchi, pas
un rappel.

Le projet est mené comme un bac à sable. Son critère n'est pas le revenu mais l'utilité : le porteur
roule, code, et a l'audience — il est l'utilisateur numéro un, et l'application doit d'abord servir
sa saison 2027.

## Le problème

Sur un vélo ou une voiture de route, il existe un compteur, un carnet, un contrôle technique, une
cote. Sur une moto de piste, rien de tout ça ne fonctionne. Le kilométrage décrit mal une machine
qui vit en sessions, en heures et en cycles thermiques. La vie de la machine se disperse entre des
réservations, des reçus, des photos, des messages WhatsApp et de la mémoire.

Trois conséquences, dans l'ordre où elles font mal :

**On ne sait pas où en est la machine.** Et le danger n'apparaît pas avec le temps : il apparaît
quand on progresse. Un pilote à 70 % ne découvre jamais que son liquide de frein est fatigué ; le
même à 90 % trois mois plus tard, si. C'est le vécu qui a fait naître ce projet — chronos qui
descendaient, confiance qui montait, freinages de plus en plus tardifs, liquide qui datait, fading,
chute.

**On ne sait pas ce que ça coûte.** Circuit, essence, Airbnb, bouffe, pneus, plaquettes, sliders,
combinaison. Le chiffre n'existe nulle part, et personne ne tient une comptabilité continue — ce
n'est pas ce qu'on vient chercher dans une passion.

**On ne peut rien prouver à la revente.** Une moto de piste bien entretenue et une moto martyrisée
se ressemblent sur une annonce. Le vendeur sérieux n'a aucun moyen de le montrer ; l'acheteur aucun
moyen de le vérifier. Avec une limite qu'il faut énoncer plutôt que la laisser croire : **un carnet
auto-déclaré atteste ce que le propriétaire a consigné, pas un historique certifié.** MotoBook
répond à cette faiblesse en se connectant au concessionnaire ; ce brief ne le fait pas. Le carnet
sert d'abord le vendeur de bonne foi ; il ne remplace pas une attestation tierce, et ne doit jamais
être présenté comme telle.

Le champ existant se coupe en deux, et ce n'est pas un hasard : la couche **performance** est
saturée — RaceChrono compte plus de 100 000 utilisateurs actifs — quand la couche **argent et
machine** reste mince. *Le fun est ce que les passionnés demandent ; l'ennuyeux est ce dont ils ont
besoin.* Le détail du paysage figure en addendum.

## La solution

Une PWA installable, utilisable hors ligne — il n'y a pas de réseau dans un paddock.

Elle s'articule autour de trois moments, et un seul geste alimente les trois.

**Pendant le roulage.** Une photo prise entre deux sessions, pleine d'adrénaline. Elle atterrit dans
l'album de la saison. Si un cap a été franchi ce jour-là — le coude au sol, le genou posé du côté
faible — **on le déclare, et la photo lui sert de preuve**. Le sens de lecture compte : le geste est
déclaré, la photo l'atteste. Aucune reconnaissance automatique d'image en v1 — ce serait un chantier
non chiffré au cœur du seul vrai différenciateur. On ne coche pas une case : on verse une fierté, et
on garde l'image qui la porte.

**Au paddock, entre deux sessions — et non le soir.** C'est la correction qu'a produite le passage
par les yeux du pilote de juin : le soir, après quatre heures de route, est le pire moment possible
pour demander quoi que ce soit. Entre deux sessions il y a du temps mort, de la fierté, les potes
autour, et le chrono est déjà connu — feuille de temps, écran de l'organisateur, montre. La photo y
est déjà prise ; le chrono et la dépense y sont saisis aussi. **Le soir devient le repli, pas la
règle.** On saisit son meilleur tour de la journée et ce que la journée a coûté. En échange
immédiat : la courbe de progression avance d'un point, la comparaison avance — **d'abord toi contre toi**, ton meilleur tour au même
circuit la fois d'avant, puis contre les potes du groupe dès qu'un pote roule aussi, le coût au tour s'affiche, et un récapitulatif partageable se génère tout seul —
*11 sessions, 4 h 20 en piste, meilleur tour 1'47, 612 €, 3,27 € le tour*. **L'application fabrique
le contenu qui recrute les suivants.**

**Entre deux roulages, et pendant l'hiver.** Le roulage saisi a fait tourner l'horloge d'usure — à
la vitesse du pilote, pas du calendrier. L'entretien se consigne au moment où on le fait, très
assisté. L'hiver n'est pas un trou mais l'autre mode du produit : bilan de saison, budget
prévisionnel, grosse maintenance, achat-revente.

Deux règles de conception gouvernent tout :

1. **Une saisie ne promet jamais une utilité future, elle se rembourse dans le même geste.** Avec
   une réserve mise au jour par le pre-mortem : c'est **faux pour les toutes premières saisies**.
   Une courbe à deux points ne récompense rien, et c'est exactement là qu'on abandonne. Ce qui doit
   payer dès la saisie n°1, c'est le récapitulatif partageable — il doit donc fonctionner sur **un
   seul roulage, sans courbe**.
2. **On ne conseille pas mécaniquement.** Contrainte de sécurité ferme : on transcrit le barème
   constructeur et on affiche où en est la machine. Aucune recommandation ne certifie la sécurité
   d'un véhicule ni la durée de vie restante d'une pièce.
3. **Trois clauses issues de l'analyse des effets de second ordre**, parce que chacun des mécanismes
   plaisants du produit produit un effet indésirable une fois qu'on le suit d'un cran :
   - **L'horloge d'usure affiche la complétude des données qui la portent** — « sur 7 roulages
     saisis sur 9 ». Elle hérite de la qualité d'une saisie faite par plaisir ; un chiffre adjacent
     à la sécurité ne peut pas prétendre à une précision que sa source n'a pas.
   - **Le coût au tour ne s'affiche jamais seul, toujours contre le budget de saison consommé.**
     Isolé, il récompense le fait de rouler plus : plus de tours font un tour moins cher. Le produit
     célébrerait alors une victoire qui s'obtient en dépensant davantage.
   - **Le catalogue d'achievements équilibre la bravoure et la discipline, et aucun n'est à durée
     limitée ni à série.** Récompenser le coude au sol pousse à aller le chercher — or l'histoire
     qui a fait naître ce projet est précisément une progression qui dépasse la préparation. Les
     séries et les compteurs à échéance fabriquent la pression du « encore une session » ; ils sont
     exclus.

Le positionnement qui évite le paternalisme : pas une nounou qui interdit, un **chef d'équipe**. En
course, quand le pilote va plus vite, le team renforce la préparation. L'amateur solo n'a pas de
team.

## Ce qui rend ça différent

_Cette section a été révisée après la [recherche user-voice du 2026-08-17](../../research/user-voice-apps-trackday-moto-2026-08-17/research.md), qui en a renversé trois affirmations. Ce qui suit est ce qui a survécu._

**La ligne que personne ne franchit.** Le marché est coupé en deux et aucun acteur ne passe d'un
côté à l'autre. Les applications de performance et de communauté — Trakio, Driver Nation, Pitly,
RaceChrono — n'ont ni coût ni entretien. MotoBook, le carnet le plus abouti du marché francophone,
qui compte déjà en **journées de roulage** et se connecte au concessionnaire pour certifier
l'historique, n'a ni communauté, ni performance, ni chronos, ni coût. **La strate argent est le seul
territoire vide, et elle se trouve exactement à la jonction des deux moitiés occupées.**

**L'unité de compte, pas la fonction.** Des traqueurs de dépenses moto existent et se vendent —
MotoVault facture 4,99 $/mois. La disposition à payer pour suivre l'argent de sa moto est donc
**prouvée par un paiement réel**. Mais tous raisonnent en kilomètres parcourus et en consommation de
carburant, c'est-à-dire dans une unité qui ne veut rien dire en piste. **Le coût à la journée et le
coût au tour n'appartiennent à personne.**

**L'audience**, qui manquait totalement à la version précédente — morte avec dix abonnés. Ce n'est
pas un avantage technique et il ne faut pas le maquiller en moat : c'est un canal gratuit vers
exactement la bonne cible, disponible dès demain matin.

**Ce qui n'est pas un avantage** — et il faut se le dire, parce que trois de ces points étaient
revendiqués ici avant vérification :

- **Le récapitulatif partageable n'est pas une invention.** Trakio livre des modèles de Story
  Instagram depuis avril 2024, et l'incrustation vidéo de RaceChrono est louée par ses utilisateurs
  précisément pour le partage social. On se défend par l'exécution, pas par la nouveauté.
- **La combinaison stats + communauté + garage existe déjà**, chez Driver Nation depuis janvier
  2025. Ce qui reste vrai est plus étroit : personne ne franchit la ligne vers l'argent et la machine.
- **Le « territoire du geste nul » n'est pas vérifié.** Aucune donnée ne l'étaye ni ne le contredit.
  À ne pas citer comme un fait.
- L'adaptation à la France, le réemploi du code existant, la vitesse d'exécution avec l'IA. Tout le
  monde a les mêmes outils.

**Et l'avertissement qui va avec.** Neuf produits sont sortis sur ce créneau en deux ans ; aucun n'a
assez de notes sur l'App Store pour afficher une moyenne. Ce n'est pas un créneau qui attend le bon
produit — c'est un créneau où il faut expliquer les échecs précédents avant de croire au sien. Le
cadrage bac à sable absorbe ce risque, puisque le critère est l'utilité personnelle et le coût
marginal nul. Il ne l'annule pas.

## Pour qui

**L'utilisateur numéro un est le porteur.** Ce n'est pas une formule : il roule plusieurs fois par
saison, il a vécu la chute qui a fait naître le projet, et il utilisera l'application pour sa saison
2027. Toute décision de périmètre se tranche sur : *de quoi ai-je besoin pour ma prochaine saison.*

**Le cercle immédiat ensuite** — les potes avec qui on roule en groupe rouge. Un cercle fermé
fonctionne à quatre, pas à quatre cents. Mais le brief a longtemps décrit ce cercle du seul point de
vue de celui qui l'ouvre. Vu du pote, deux exigences en découlent : **il doit trouver de la valeur
seul** — sa propre journée, sa propre courbe, ses propres gestes, sans dépendre de personne — et
**la visibilité de ses chronos est un choix, roulage par roulage.** Le plus lent d'un groupe n'a
aucune envie d'être classé, et une comparaison imposée fait cesser la saisie de celui qui en a le
plus besoin.

**Puis le pistard français amateur** : il roule quelques fois par an, participe à l'entretien de sa
machine sans être mécanicien, n'est pas particulièrement porté sur la technologie, et tient son
budget dans sa tête ou dans un tableur. C'est l'audience Instagram existante.

**Hors périmètre initial :** l'automobile — pas assez de recul, et le porteur n'en serait pas
l'utilisateur. Les organisateurs de roulages forment un second marché, délibérément mis de côté :
le rôle envisagé et ce qui a été refusé figurent en addendum.

## Critères de succès

Le critère est l'utilité personnelle, pas le revenu. Mais « utile à moi » ne peut pas renvoyer non,
donc ce n'est pas un critère. Ce qui suit est mesurable et peut échouer.

**En octobre 2027, ça a marché si :**

- **La saison est consignée en entier** — tous les roulages, pas les trois premiers. C'est la
  condition de tout le reste : une courbe de progression à trois points ne raconte rien.
- **La saisie s'est faite le soir même**, pas « plus tard ». « Plus tard » n'arrive jamais, et c'est
  comme ça que meurent tous les carnets d'entretien.
- **Au moins un récapitulatif a été posté** sans que ce soit un effort de communication — juste
  parce que le chiffre rendait fier.
- **Un pote l'utilise sans avoir été supplié.** Un seul. C'est le plus petit signal externe qui
  existe, et c'est toute la différence entre « utile à moi » et « utile ».

**Ça a échoué si :**

- **La saison est consignée à 30 %** et ça s'est arrêté en juin — lassitude, le risque numéro un
  dès lors qu'il n'y a plus de contrainte de marché.
- **Aucun récapitulatif posté en sept mois.** Ce qui devait être satisfaisant ne l'était pas.
- **L'application s'ouvre pour être remplie, jamais pour être regardée.** C'est le mode d'échec que
  le porteur a nommé lui-même : *« si c'est juste un Excel amélioré avec une UI de merde, j'y crois
  pas et je désinstalle. »*

## Ce sur quoi le brief parie

Dix-sept hypothèses portantes ont été recensées et notées en confiance croisée avec l'impact ; le
registre complet figure en addendum. Cinq portent le projet à elles seules, et aucune n'est vérifiée :

1. **Le porteur roule une saison entière et saisit le soir même.** Toute la valeur en dépend, et
   c'est précisément le comportement qui a tué tous les carnets d'entretien avant celui-ci.
2. **La saisie qui se rembourse dans le même geste suffit contre la lassitude.** C'est un principe
   de conception, pas un mécanisme démontré. La lassitude reste le risque numéro un.
3. **Un récapitulatif sera posté sans effort de communication**, et l'audience existante convertira.
   Le canal est potentiel, pas actuel : le compte n'a aucune ligne éditoriale à ce jour.
4. **Le temps du porteur suffit pour construire et pour rouler la même année** — voir plus bas.
5. **Une horloge d'usure à la vitesse du pilote est calibrable.** Le principe tient ; le coefficient
   qui traduit un groupe de niveau en usure n'a aujourd'hui aucune source. Il se pose donc comme un
   paramètre à calibrer sur les roulages réels, **jamais comme une constante affichée** — la règle
   de sécurité du brief l'interdit.

Ces paris ne sont pas des faiblesses à masquer : ce sont les points que le PRD doit instrumenter pour
qu'un échec soit constatable en cours de saison, et pas seulement en octobre.

## Comment ça peut échouer

Le brief sait à quoi ressemble l'échec en octobre. Ce qui manquait, c'est **comment le voir venir en
mai**. Quatre morts possibles, chacune avec son signal le plus précoce.

**Mars n'arrive jamais.** Sept domaines en six mois, en solo, avec les soirées qui servent aussi à
rouler. En février quatre domaines sont à moitié faits, la saison démarre quand même, et chaque
roulage se remet à « quand l'app sera prête ».
→ *Signal : le 1er décembre 2026.* Si le trio roulage + chrono + coût ne tourne pas de bout en bout à
cette date, mars n'arrivera pas.

**Le troisième roulage.** Les deux premiers sont consignés avec entrain. Le troisième tombe un
dimanche de mai après quatre heures de route : rien n'est saisi. Le quatrième trouve un trou, et un
carnet troué vaut moins qu'un carnet vide.
→ *Signal : le délai entre la date du roulage et la date de saisie.* Dès qu'il dépasse 48 heures une
seule fois, la sortie de route a commencé.

**Ça marche et personne ne le sait.** Saison consignée en entier, aucun récapitulatif posté — non
parce qu'ils sont ratés, mais parce que poster demande de *décider* de poster, et que le porteur est
un pilote, pas un créateur de contenu.
→ *Signal : récapitulatifs générés contre récapitulatifs postés.* Un grand écart désigne le
déclencheur, pas l'image.

**Ça devient un Excel amélioré.** Le mode d'échec que le porteur a nommé lui-même. Il arrive par un
chemin précis : sous la pression de décembre, on coupe la photo, le geste et le récapitulatif —
l'agréable — et on livre l'entretien et le budget, parce que c'est plus simple à coder. **La thèse
du produit s'inverse alors** : ce n'est plus l'ennuyeux qui voyage avec le satisfaisant, c'est
l'ennuyeux tout seul.
→ *Signal : la liste de ce qui a été coupé en décembre.*

Ces deux mesures — **délai roulage → saisie**, et **récapitulatifs générés contre postés** — sont les
deux instruments de bord du projet. Le PRD doit les prévoir dès la première version : sans elles,
l'échec ne se constate qu'en octobre, quand il est trop tard pour corriger la saison.

## Ce que ça coûte

**Le coût marginal du projet est proche de zéro** : les abonnements Claude et Codex sont payés de
toute façon, Railway est partagé avec d'autres projets, et une PWA n'a ni frais de store ni délai de
validation. C'est ce qui rend le cadrage « bac à sable » défendable plutôt que complaisant. Les
comptes développeur ne seront payés qu'en cas de passage au natif, donc seulement si le produit a
d'autres utilisateurs que son auteur.

Aucun modèle de revenu n'est arrêté. Les pistes existent — accès premium sur les paliers coûteux du
chronométrage, affiliation sur les produits d'entretien, commission sur la revente — mais les
trancher maintenant reviendrait à concevoir pour un client qu'on n'a pas.

**La cadence naturelle du produit est d'environ onze usages par an**, et c'est une contrainte
structurelle plus qu'un détail. Elle explique trois choses d'un coup : pourquoi le stockage du
navigateur ne suffit pas, pourquoi un modèle par abonnement serait mal ajusté à ce rythme, et
pourquoi le **mode hors-saison** n'est pas une queue de feuille de route mais le seul organe qui
crée de l'usage en hiver. Un produit ouvert onze fois par an ne se retient pas ; il doit fabriquer
lui-même ses occasions d'ouverture.

**Le vrai coût n'est pas en euros, il est en soirées.** C'est le point que ce brief avait manqué :
les soirées qui servent à construire l'application sont exactement celles qui serviront à la
remplir. Les deux paris les plus portants du projet — livrer pour mars, saisir le soir même — se
disputent la même ressource. D'où une contrainte de tête : **le développement doit être fini avant
que la saison commence.** Un chantier qui déborde sur avril ne retarde pas une livraison, il mange
la saisie, et la saisie conditionne tout le reste.

**À ne pas confondre :** le budget que l'application suit est celui du pilote, pas celui du projet.
Référence du porteur, **500 € par mois de hobby et moins en hors-saison**, soit une saison autour de
5 à 6 000 €. Il se modélise donc par saison avec une distribution irrégulière, jamais comme un
montant mensuel constant.

## Périmètre

Dix domaines en v1. Le nombre n'est pas le sujet : la version précédente est morte avec douze
domaines dont la moitié affichaient du vide. **Le critère de sélection est qu'un domaine ait du
contenu dès le premier jour, avec un seul utilisateur.** Ces dix-là l'ont.

L'ordre de livraison n'est pas un arbitrage de priorités : c'est une conséquence de la date à
laquelle chaque chose devient utile. Le calendrier de la saison séquence le chantier tout seul.

**Le noyau de premier roulage, à livrer pour décembre 2026 et non pour mars.** Six domaines
affichaient « mars », ce qui décrivait un souhait plutôt qu'un plan. Le strict minimum qui doit
exister le jour du premier roulage de la saison est plus étroit : **le roulage, le meilleur tour du
jour, le coût de la journée et le coût au tour, la photo avec le geste déclaré, et le récapitulatif
partageable sur un seul roulage.** Le reste arrive pendant la saison, au fur et à mesure qu'il
devient utile. Noter ce qui n'est délibérément pas dans le noyau : **la courbe de progression**, qui
n'a pas encore les points pour dire quoi que ce soit — c'est la démonstration même que la
récompense du produit est différée, et donc qu'elle ne peut pas porter le premier roulage.

| Domaine | Prêt pour |
|---|---|
| Le roulage — date, circuit, organisateur, groupe, sessions | mars |
| Chronos — meilleur tour du jour, courbe de progression, comparaison à soi puis au cercle | mars |
| Achievements — catalogue extensible, débloqués par la photo | mars |
| Coût de la journée et coût au tour, contre budget de saison | mars |
| Photos et album de saison | mars |
| Récapitulatif partageable — image composée, partage Instagram | mars |
| Maintenance à deux étages, saisie assistée au moment du geste | mars, avril au plus tard |
| Barème constructeur et horloge d'usure à la vitesse du pilote | mai — l'usure a besoin de roulages avant de dire quoi que ce soit |
| Checklist de chargement, conformité par organisateur | avant le premier roulage |
| Mode off-saison — bilan de saison et à-faire | novembre |

**Hors périmètre, en attente d'une foule et non d'un budget :** place de marché, vérification
d'annonce, logistique partagée, « qui roule aujourd'hui », suite de gestion pour organisateurs. Ces
domaines ne sont pas coupés parce qu'ils coûtent cher — ils sont coupés parce qu'un écran vide ne
sous-délivre pas, il signale l'abandon. Ils s'allumeront quand l'audience Instagram aura amené du
monde. **L'architecture les prévoit ; le planning ne les contient pas.**

**Hors périmètre, décisions fermes :** l'automobile ; l'application native ; toute suite de
comptabilité ou de gestion pour les organisateurs ; tout remplacement de leurs groupes WhatsApp.

**Contraintes de conception non négociables :**

- Un écran, une fonction, navigation simple, mais la densité est là. C'est ce qui rend dix domaines
  légers là où douze mal rangés étaient lourds.
- **S'il faut couper, on coupe la corvée, jamais le plaisir.** C'est contre-intuitif et c'est la
  règle la plus importante du projet. La pente naturelle d'un chantier solo sous pression est de
  livrer ce qui est simple à coder — l'entretien, le budget — et de repousser la photo, le geste et
  le récapitulatif. Or c'est le plaisir qui transporte la corvée, jamais l'inverse. Un mois de
  retard sur le carnet d'entretien est rattrapable ; un mois sans le geste ni le récapitulatif, et
  il n'y a plus de raison d'ouvrir l'application.
- **Rien ne vit uniquement dans le navigateur.** Une application de roulage sert environ une fois
  par mois, et les navigateurs mobiles purgent le stockage des sites peu visités. Le mode de panne à
  craindre n'est donc pas « pas de réseau au paddock », c'est **« j'ouvre en mars et ma saison a
  disparu »**. Sur un produit dont la promesse est la continuité, c'est fatal. Toute donnée saisie
  doit survivre à la désinstallation : synchronisation dès que le réseau revient, et export
  récupérable par le pilote.
- **Le vocabulaire est celui des pratiquants, pas celui des éditeurs.** En France on dit
  **« roulage »**, pas « trackday ». Les groupes sont **Blanc, Jaune, Rouge**. La journée a une
  structure stable — briefing obligatoire vers 8 h 30, roulage à 8 h 45, pause de 12 h à 14 h, fin
  vers 17 h 30, pilotes-conseils sur place — et elle sert de squelette aux écrans plutôt que d'être
  réinventée.

## Vision

Si la boucle tient, le produit devient **le système de continuité de la machine de piste** : chaque
roulage consigné fait tourner les bonnes horloges, chaque intervention garde sa source, et
l'historique reste attaché à la machine quand elle change de mains.

Le vrai gisement est plus loin et il ne se sème qu'aujourd'hui. Après plusieurs saisons de carnets
accumulés, ce serait **la seule base en France de ce que vaut une moto de piste préparée compte tenu
de son historique** — sur un marché qui n'a ni cote, ni contrôle technique, ni Argus. Personne
d'autre ne peut la construire, parce que personne d'autre n'a les carnets. C'est la récolte ; le
carnet est la semence.

**Et il faut dire tout de suite ce que cette phrase n'est pas.** Cette base réclame des milliers de
carnets sur plusieurs saisons, quand le périmètre refuse explicitement la foule : la Vision et le
Périmètre se contrediraient si l'on prenait la première pour un plan. Ce n'en est pas un. **C'est
une option, qui n'existe que si l'audience amène du monde, et rien du périmètre actuel ne se
justifie par elle.** Aucun arbitrage de v1 ne doit être défendu au motif qu'il prépare la cote.

Trois extensions restent en réserve, et aucune n'est engagée : l'analyse du footage 360 pour
produire automatiquement le meilleur tour monté et partageable ; le rôle de couche de contenu vers
laquelle pointent les organisateurs, sans jamais remplacer leur WhatsApp ; et l'automobile, si
jamais quelqu'un d'autre que l'auteur la réclame.
