# Les portes

Conjonctives. Un échec à une porte tue le projet — aucune compensation, aucune moyenne, aucun rattrapage.
Une porte franchie « de justesse » est une porte échouée.

**Ordonnancement.** Ne trie jamais par effort. Trie par *qui exécute* et par *latence*.
Tout ce qui exige un tiers humain a une latence de plusieurs semaines et **se lance le jour 1**, en parallèle
du reste. Tout ce qu'un agent fait seul est quasi gratuit et se fait sur **tous** les projets, sans arbitrage.

---

## Constantes du porteur — une seule fois, pour tous les projets

Six éléments valent pour l'ensemble du portefeuille. Les refaire par projet est du travail multiplié pour rien,
et ils éliminent des projets **sans avoir à les étudier**.

1. **Actifs de distribution** — nominatifs et chiffrés. Pas « je ferai du contenu » : quelles listes, quels
   groupes, quelles personnes, combien, et joignables comment. Une audience qu'on ne peut pas joindre gratuitement
   demain matin n'existe pas.
2. **Heures réellement disponibles** par semaine, déduction faite de l'entretien de l'existant.
3. **Titularité** — clause d'exclusivité, contrat de travail, droits cédés par un prestataire.
   Deux heures qui peuvent annuler rétroactivement la propriété de tout ce qui a été produit.
4. **Runway personnel** — et en France, les paramètres qui le changent d'un facteur 2 : maintien d'allocation,
   ARE/ARCE/ACRE, date de fin de droits, effet du premier euro encaissé. À vérifier en source primaire.
5. **Perte acceptable** — en euros ET en mois, écrite et datée.
6. **Goût pour les gestes quotidiens** du modèle. Chez un solo à temps partiel ayant déjà échoué une fois,
   le mode de mort le plus fréquent n'est pas le mauvais marché : c'est l'abandon au mois neuf.

---

## P0 — Joignabilité × logique d'achat

*Une fois par audience, ~2 h, porteur.*

Croise **les actifs de distribution** avec **la logique d'achat de l'audience** :

|  | Audience utilitaire (achète pour gagner ou éviter de perdre) | Audience hédonique (achète par plaisir) |
|---|---|---|
| **Atout du porteur : rigueur analytique** | croisement fertile | **croisement vide** |
| **Atout du porteur : goût, esthétique, communauté** | croisement faible | croisement fertile |

**Si le croisement est vide, on change d'audience — pas de produit.** C'est une décision impossible à prendre
une fois six mois de développement engagés.

Test complémentaire, décisif et souvent omis : **la douleur est-elle désirée ?**
Une douleur que la cible évite activement de connaître n'est pas vendable. Cherche une **preuve de comportement
de recherche préexistant** : quelqu'un cherche-t-il déjà cette information, sur un forum, dans un moteur, auprès
d'un pro ? Sans ce comportement, verdict d'arrêt.

**Échoue si** : l'audience n'est pas joignable gratuitement dès demain · le croisement est vide · aucun
comportement de recherche préexistant.

## P0 bis — Opérabilité à temps partiel

*Binaire, immédiat.*

Le modèle exige-t-il une présence quotidienne ou une réactivité contrainte ? Marketplace à amorcer des deux côtés,
service sous SLA, produit à modérer, communauté à animer, support en heures ouvrées.
**Structurellement impossibles sous ~10 h/semaine, indépendamment de la demande.**

Corollaire souvent ignoré : un solo ne peut pas signer une continuité. Cela **exclut mécaniquement** le B2B
moyen et grand compte. C'est un choix de marché, pas un détail d'exploitation.

## P1 — Recensement nominatif, vivants ET morts

*~45 min/projet, agent seul. À faire sur tous les projets.*

Recherche **avec le vocabulaire du client**, pas le tien, en français **et** en anglais. Balaye : moteurs,
annuaires sectoriels, stores d'applications, forums de la niche, registres d'entreprises, Wayback.

**Critère d'admission d'un nom** — sans lui, tout seuil est arbitraire : même job, même payeur, transaction
observable. Ne gonfle pas la liste pour atteindre un quota, et ne l'expurge pas pour se croire seul.

Trois configurations, trois verdicts :

- **Zéro nom admissible** → recherche incomplète. Tu n'as **pas le droit** de conclure à une rareté. Recommence
  avec un autre vocabulaire. Si après un second passage il n'y a toujours personne, traite l'espace vide comme
  un signal négatif : sur un marché de passion, un maillon vide signifie généralement que personne n'a réussi
  à y faire payer.
- **Que des morts** → le cimetière est l'information la plus précieuse du recensement. Les vivants disent qu'un
  marché existe ; **les morts disent pourquoi personne n'y gagne d'argent**. Cherche les causes de décès.
- **Vivants et rentables** → la seule configuration exploitable. Comptes déposés, prix publics, croissance.

**Échoue si** : un acteur dominant délivre gratuitement la valeur centrale · le cimetière révèle une cause de
mort structurelle non levée.

## P2 — Rentabilité inverse

*~30 min/projet, arithmétique pure. Tue la majorité des projets.*

Calcule **N clients nécessaires au point mort, rémunération du porteur incluse**, puis divise par l'audience
**réellement joignable** établie en P0 — jamais par un TAM.

Fais impérativement descendre le prix jusqu'au revenu disponible :

```
prix affiché → HT → marge de contribution (coût complet par tâche, inférence incluse)
             → net de cotisations sociales → net d'impôt → revenu disponible
```

L'écart entre le chiffre d'affaires nécessaire et le revenu perçu est d'un **facteur 1,5 à 2**. Ne pas le
modéliser fausse le seul chiffre censé trancher. *Taux à vérifier en source primaire (URSSAF, impots.gouv.fr) —
ne jamais les citer de mémoire.*

**Échoue si** : la pénétration implicite dépasse 1 à 2 % de l'audience joignable · la marge de contribution est
négative ou inconnue · le CAC plafond admissible (fonction de la **marge**, pas du CA) est inférieur au CAC réel
du canal le moins cher accessible seul.

## P3 — L'argent d'un inconnu

*Survivant unique. **Lancé le jour 1**, en parallèle, car sa latence est de ~3 semaines.*

Demander de l'argent à quelqu'un qui ne connaît pas le porteur. Précommande, acompte, pilote payant,
lettre d'intention signée. **Seuil de succès écrit et daté avant.**

Protocole : `entretien.md`. Ne le lance jamais après les autres portes sous prétexte qu'il est « plus lourd » —
sa latence en fait le premier à partir, et le dernier à répondre.

**Échoue si** : personne ne paie · seuls des proches paient (voir la règle des 3 clients consécutifs hors réseau).

---

## Portes conditionnelles à l'archétype

Charge **uniquement** celles qui s'appliquent.

**Produit d'information, d'estimation ou de comparaison**
- *Conflit d'intérêts* : le mode de monétisation (affiliation, mise en avant payante, commission) détruit-il la
  neutralité qui fonde la valeur ? Beaucoup de modèles « évidents » sont incompatibles avec le produit qu'ils financent.
- *Coût d'une erreur* : le dommage maximal qu'une sortie fausse cause au client, comparé au prix payé. Si le
  dommage dépasse d'un ordre de grandeur le prix, aucun modèle ne tient et aucune clause limitative ne sauve.
- *Treadmill de fraîcheur* : heures/mois de maintien de la donnée. Ce coût existe **à zéro client**.

**Produit agrégeant de la donnée tierce**
- *Licéité* avant le premier crawl, jamais six mois après : un scraping effectué ne se défait pas.
- Un accès dépendant d'une plateforme unique est une dépendance d'acquisition **et** de production.

**Activité potentiellement réglementée** (finance, assurance, santé, transport, intermédiation)
- Seul verdict vraiment binaire du dossier : agrément, statut ORIAS/ACPR, certification, licence.
  Un solo sous 500 €/mois ne peut pas les obtenir. **Mieux vaut le savoir la première semaine que la soixantième.**

**Produit à composante IA**
- *Test de substitution* : l'assistant grand public fait-il déjà la tâche, gratuitement, dans sa fenêtre ?
- *Test du wrapper mince + horloge de clonage* : si le produit s'assemble en un week-end, la barrière est nulle
  **pour tous** — et cette conclusion doit remonter alimenter P1.
- *Conformité* : obligations de transparence (informer qu'on interagit avec une IA, marquer les contenus générés).
  La mention obligatoire modifie le taux de conversion d'un produit d'information payant : c'est une hypothèse
  portante, pas une ligne de CGU. *Calendrier à vérifier en source primaire.*
- *Marge* : l'inférence fait tomber la marge brute bien en dessous des repères logiciels habituels.

**Marketplace ou plateforme hébergeant du contenu tiers**
- Amorçage biface, charge de modération non bornée, responsabilité éditoriale dès qu'on classe ou recommande,
  obligations déclaratives des plateformes d'intermédiation. Croise systématiquement avec **P0 bis**.
