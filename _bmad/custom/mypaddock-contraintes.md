# Contraintes permanentes — projet MyPaddock (application de roulage moto)

Ces contraintes sont **acquises**. Elles ont été tranchées en amont — brief du 17 août 2026 durci
par cinq méthodes d'élicitation avancée, direction de design verrouillée le 18 août. Un skill aval
les **applique**, il ne les redébat pas. S'il pense devoir en contredire une, il le dit
explicitement à Julian plutôt que de la contourner en silence.

## 1. Vocabulaire — mot pour mot, sans synonyme

- On dit **roulage**, jamais « trackday ». C'est le mot des pratiquants français.
- **Le groupe de niveau est défini par l'organisateur, en nombre comme en nom.** Blanc / Jaune /
  Rouge est une convention répandue, pas la seule : Pau-Arnos annonce 2 à 4 groupes selon la sortie
  et les nomme Initiation / Intermédiaire / Confirmé / Expert (relevé le 18 août 2026). Ce que le
  produit conserve est le **rang du groupe sur l'échelle de son organisateur** — seule chose
  comparable d'une sortie à l'autre, et seule entrée possible du coefficient d'usure.
- La journée a une structure connue qui sert de **squelette par défaut** aux écrans et qu'on ne
  réinvente pas : briefing obligatoire vers 8 h 30, roulage à 8 h 45, pause de 12 h à 14 h, fin
  vers 17 h 30, pilotes-conseils sur place. **C'est un défaut, jamais une contrainte** : Pau-Arnos
  annonce 8 h 30 → 12 h 30 puis 14 h → 18 h, en six séries de vingt minutes. Un roulage qui ne
  ressemble pas au squelette doit se saisir sans friction.
- Termes cadrés : Roulage, Session, Circuit, Organisateur, Groupe, Meilleur tour, Machine,
  Équipement, Geste, Achievement, Photo, Album de saison, Récapitulatif, Gabarit, Dépense,
  Coût de la journée, Coût au tour, Budget de saison, Intervention, Barème constructeur,
  Horloge d'usure, Coefficient d'usure, Complétude, Échéance, Checklist de chargement,
  Conformité organisateur, Cercle, Visibilité du chrono, Saison, Mode hors-saison.
  Le glossaire du PRD fait foi.

## 2. Sécurité et responsabilité — interdictions fermes

1. **On ne conseille jamais mécaniquement.** On transcrit le barème constructeur et on affiche où
   en est la machine. Aucune sortie du produit ne certifie la sécurité d'un véhicule ni la durée de
   vie restante d'une pièce.
2. **L'horloge d'usure affiche toujours sa complétude** — « sur 7 roulages saisis sur 9 ». Elle
   hérite de la qualité d'une saisie faite par plaisir ; un chiffre adjacent à la sécurité ne peut
   pas prétendre à une précision que sa source n'a pas.
3. **Le coût au tour ne s'affiche jamais seul**, toujours contre le budget de saison consommé.
   Isolé, il récompense le fait de rouler plus : plus de tours font un tour moins cher, et le
   produit célébrerait une victoire qui s'obtient en dépensant davantage.
4. **Le catalogue d'achievements équilibre bravoure et discipline, et aucun n'est à série ni à
   durée limitée.** Récompenser le coude au sol pousse à aller le chercher — c'est exactement
   l'enchaînement qui a causé la chute fondatrice. Les séries et les compteurs à échéance
   fabriquent la pression du « encore une session » ; ils sont exclus.
5. **Le coefficient d'usure est un paramètre à calibrer, jamais une constante affichée.** Aucune
   source ne l'étaye à ce jour.
6. **La conformité organisateur porte sa source et sa date, et ne certifie pas l'admission.**
7. **Le carnet est auto-déclaré** : il atteste ce que le propriétaire a consigné, jamais un
   historique certifié. Ne jamais le présenter comme une attestation tierce.
8. **La visibilité du chrono est un choix, roulage par roulage**, masqué par défaut sur un compte
   neuf. Une comparaison imposée fait cesser la saisie de celui qui en a le plus besoin.

## 3. Règles de conception

- **S'il faut couper, on coupe la corvée, jamais le plaisir.** Règle la plus importante du projet,
  et contre-intuitive. La pente naturelle d'un chantier solo sous pression est de livrer ce qui est
  simple à coder — entretien, budget — et de repousser la photo, le geste et le récapitulatif. Or
  c'est le plaisir qui transporte la corvée, jamais l'inverse. Un mois de retard sur le carnet
  d'entretien est rattrapable ; un mois sans le geste ni le récapitulatif, et il n'y a plus de
  raison d'ouvrir l'application.
- **Rien ne vit uniquement dans le navigateur.** Le mode de panne à craindre n'est pas « pas de
  réseau au paddock » mais « j'ouvre en mars et ma saison a disparu ». Toute donnée saisie survit à
  la désinstallation : synchronisation dès le retour du réseau, export récupérable par le pilote.
- **Une saisie ne promet jamais une utilité future, elle se rembourse dans le même geste** — sauf
  pour les toutes premières, où c'est faux. Une courbe à deux points ne récompense rien.
  Conséquence : le récapitulatif partageable doit fonctionner sur **un seul roulage, sans courbe**.
- **Un écran, une fonction.** Navigation simple, mais la densité est là.
- **Le moment de saisie est le paddock, entre deux sessions** — pas le soir. Conséquences directes :
  gants aux mains, plein soleil, aucun réseau, cibles tactiles généreuses, un minimum de taps, des
  sélecteurs plutôt qu'un clavier.
- **La cadence est d'environ onze usages par an.** Un produit ouvert onze fois par an ne se retient
  pas ; il doit fabriquer lui-même ses occasions d'ouverture. Cette contrainte explique d'un coup la
  purge du stockage navigateur, l'inadéquation d'un abonnement, et le fait que le mode hors-saison
  soit un organe et non une queue de feuille de route.
- **Le catalogue d'achievements est de la donnée, pas du code** : on doit pouvoir en ajouter sans
  redéploiement.
- **Le téléphone n'est jamais le capteur du chrono.** Le pilote n'a pas son téléphone sur lui en
  piste — il est resté au camion. Tout chronométrage par le GPS du téléphone est **faux dès le
  départ**, pas seulement repoussé. Échelle de capacité relue en conséquence : palier 1, la saisie
  manuelle, qui est la **base permanente** et non une béquille ; palier 2, **l'import** depuis un
  chronomètre embarqué dédié ou le chronométrage par transpondeur de l'organisateur ; palier 3,
  l'analyse vidéo. Le modèle de session doit accueillir **plusieurs tours par session** et **une
  provenance par chrono** sans réécriture.

## 4. Le calendrier commande

- **Noyau de premier roulage, à livrer pour le 1er décembre 2026** : le roulage, le meilleur tour du
  jour, le coût de la journée et le coût au tour, la photo avec le geste déclaré, et le
  récapitulatif partageable sur un seul roulage. **La courbe de progression en est délibérément
  exclue** — elle n'a pas encore les points pour dire quoi que ce soit.
- Le reste arrive pendant la saison 2027, à mesure que chaque domaine devient utile. L'ordre de
  livraison n'est pas un arbitrage de priorités, c'est une conséquence de dates.
- **Le développement doit être fini avant que la saison commence** (mars 2027). Les soirées qui
  servent à construire sont exactement celles qui serviront à remplir : un chantier qui déborde sur
  avril ne retarde pas une livraison, il mange la saisie, et la saisie conditionne tout le reste.

## 5. Les deux instruments de bord — à prévoir dès la v1

1. **Délai roulage → saisie.** Dès qu'il dépasse 48 heures une seule fois, la sortie de route a
   commencé.
2. **Récapitulatifs générés contre récapitulatifs postés.** Un grand écart désigne le déclencheur,
   pas l'image.

Ce ne sont pas des métriques produit, ce sont les capteurs du projet lui-même. Sans elles, l'échec
ne se constate qu'en octobre 2027, quand il est trop tard pour corriger la saison.

## 6. Design — direction verrouillée

La direction retenue est **Attract Mode** : arcade assumée, référencée sur Hang-On (Sega, 1985) et
Out Run (Sega, 1986), appliquée aux six écrans. Acquis qui ne se rouvrent pas :

- Le violet `#B026FF` **ne s'allume que sur un record** — meilleur tour, meilleur coût au tour,
  geste débloqué. Vert = record personnel, jaune = plus lent.
- Le violet est **le pont du dégradé** : un orange vif posé sur un bleu profond donne un gris
  brunâtre, il faut un magenta ou un violet saturé entre les deux. Structurel, pas décoratif.
- **Le fond n'est jamais noir plat** : dégradé vertical multi-arrêts + tramage + scanlines.
- **Biseaux pixel, pas d'ombres douces.** Aucun coin arrondi, aucun flou.
- Le budget de saison est un **compteur de crédits** ; le coût au tour est un score qui descend.
- Aucun drapeau à damier comme signe de marque.
- `#B026FF` échoue le contraste AA en petit texte (4,1:1) : réservé aux tracés, remplissages et
  gros chiffres ; le petit texte violet utilise une version éclaircie.

Quatre correctifs restent à appliquer : palette décalée vers un bleu ciel « Miami », plus épuré,
deux polices (Press Start 2P pour le HUD et les chiffres, plus une script racing pour les titres et
les moments d'émotion), et moins d'effets — le pixel doit rester un accent, pas une texture
générale. Détail dans `DIRECTION.md`.

**Piège de licence à ne pas oublier :** Racing Catalogue (Octotype / Thomas Boucherie) est gratuite
pour usage **personnel uniquement**. Toute diffusion publique de l'application exige une licence
commerciale. Prévoir une alternative sous licence libre si le produit sort du bac à sable.

## 7. Cadrage du projet

Le projet est un **bac à sable** : le critère est l'utilité personnelle, pas le revenu. Julian est
l'utilisateur numéro un — il roule, il code, il a l'audience — et l'application doit d'abord servir
sa saison 2027. Toute décision de périmètre se tranche sur *de quoi ai-je besoin pour ma prochaine
saison*. Aucun modèle de revenu n'est arrêté, et en trancher un maintenant reviendrait à concevoir
pour un client qu'on n'a pas.

**Hors périmètre, décisions fermes :** l'automobile ; l'application native ; toute suite de
comptabilité ou de gestion pour les organisateurs ; tout remplacement de leurs groupes WhatsApp.

**Un service serveur est entré au périmètre le 18 août 2026.** Le barème constructeur et les
calendriers d'organisateurs ne se saisissent pas : ils se récoltent, par recherche web et
extraction assistée par IA, sur un service asynchrone (Railway) exécuté hors du temps de
l'utilisateur. Conséquence de sécurité à ne jamais perdre de vue : **une extraction par IA n'est pas
une transcription, c'est une reconstruction.** Tout barème récolté porte sa source, sa date de
récolte et la mention qu'il a été extrait automatiquement, et reste corrigeable par le pilote, dont
la correction prime.

**Hors périmètre, en attente d'une foule et non d'un budget :** place de marché, vérification
d'annonce, logistique partagée, « qui roule aujourd'hui ». L'architecture les prévoit ; le planning
ne les contient pas. Un écran vide ne sous-délivre pas, il signale l'abandon.

**Nom : MyPaddock est un nom de code de travail. Corrigé le 18 août 2026 après réconciliation.**
Une version antérieure de ce fichier affirmait que le nom était tranché et qu'il ne restait qu'« une
formalité à lever ». C'était faux, et l'information contraire était déjà dans l'en-tête du brief du
17 août : **le nom exact est exploité par Oracle Red Bull Racing**, PaddockPro et ThePaddock sont
déjà des produits de roulage, et « Paddock » est encombré en motorsport. La graphie « MyPadock »
n'élimine ni les collisions phonétiques, ni typographiques, ni celles des résultats de recherche.
Julian détient le nom de domaine — **un domaine n'est pas une marque.**

Conséquences opérationnelles, à appliquer sans les redébattre :

- **Les artefacts gardent le nom.** Interfaces, maquettes, épiques, code, dossiers : on ne renomme
  rien. MyPaddock est le nom de code de travail et il fait le travail.
- **Le nom du produit vit derrière une seule constante.** Aucun skill ne code en dur un nom
  d'affichage dispersé dans les écrans, le manifeste, les icônes ou les cartes de partage. C'est ce
  qui rend le renommage tenable au lieu de coûteux.
- **Rien ne sort en public sous ce nom** : ni campagne payante, ni publication en boutique, ni dépôt
  de marque. Levée par une liste restreinte dont « Paddock » n'est pas l'élément dominant, puis
  recherche à l'identique sur `data.inpi.fr` — gratuite et instantanée — puis recherche en
  similarité, **payante et faite par des documentalistes INPI**, donc lancée sur un seul nom. C'est
  QO-1 au PRD, rouverte.
- **Le choix du nom public est différé, et c'est une décision datée du 18 août 2026, pas un oubli.**
  Julian construit sous le nom de code et choisira devant le produit qui tourne. Un skill aval ne
  rouvre pas ce débat et ne propose pas de nom : il applique la constante unique et continue.
  Marché vérifié le 18 août, et pire que le dossier du 16 ne l'écrivait — MyPaddock est le
  programme de fidélité d'Oracle Red Bull Racing (750 000 membres, points et paliers), et
  ThePaddock est **le même produit** sur l'App Store, chronos et photos de sessions comprises.

**La ligne qui gouverne les deux : construire n'est pas lancer.** L'audit de viabilité du 16 août
rendait VÉRIFIER et demandait de ne rien construire avant validation comportementale ; le brief du
17 a renversé cette décision de tête et le renversement tient — l'audit gradue trois ambitions et le
bac à sable ne vise que la première (« niche autofinancée : plausible sous conditions »), et son
propre protocole de validation exige un objet qui fonctionne. Donc **on construit librement**. En
revanche tout ce qui expose le produit à des inconnus — campagne, boutique, dépôt — passe par les
préconditions de QO-11 : nom, politique de confidentialité, base légale RGPD, CGU, suppression et
export, licence de fonte, plafond de dépense publicitaire, et attribution mesurée hors de la
plateforme du prestataire.

**Monétisation : à tester, pas à prévoir.** Règle reprise de la recherche marché du 16 août et
conservée mot pour mot. Aucun modèle n'est arrêté et aucune conversion n'a été observée. Quatre
cellules d'essai existent (noyau gratuit une machine ; pass saison 29–39 € ; partage revente
9–19 € ; loueur-école à découvrir) et un candidat de forme est écrit au §9 du PRD : la cadence
d'environ onze usages par an rend l'abonnement mal ajusté, alors que le **pass saison** est natif à
un produit dont l'unité de compte est déjà la saison. **Candidat, pas décision** — et il ne coûte
aucune soirée au noyau, ce qui est la raison pour laquelle il peut rester ouvert. Aucun skill de
construction n'implémente de paiement, de péage ou de palier payant sans décision explicite de
Julian.

## 8. Pour aller plus loin

Ne pas recharger ces documents sauf besoin réel — ils sont volumineux :

- `_bmad-output/planning-artifacts/briefs/brief-MyPaddock-2026-08-17/brief.md` — le brief (4 292
  mots) : problème, solution, différenciation, cinq paris de tête, quatre modes d'échec, périmètre.
- `_bmad-output/planning-artifacts/briefs/brief-MyPaddock-2026-08-17/addendum.md` — registre des 17
  hypothèses, décisions écartées, contraintes techniques, conformité, paysage concurrentiel,
  chaînes de second ordre.
- `_bmad-output/design/DIRECTION.md` — la direction de design en détail.
- `_bmad-output/PARCOURS-BMAD.md` — où on en est dans la chaîne BMAD et ce qui reste.
