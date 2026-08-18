# Viabilité opérationnelle

**Uniquement pour les projets ayant franchi P0 à P3.** Inutile sur un projet déjà mort.

Les portes établissent qu'une demande existe et qu'elle est atteignable. Elles ne disent rien de ce qui décide
de la survie **après le premier euro**. Un projet peut franchir toutes les portes commerciales et mourir sur
l'arithmétique des heures — la seule ressource qu'un solo ne peut pas augmenter.

## 1. Budget d'heures : capacité contre charge

Le seul calcul qui manque partout. L'argent est chiffré cinq fois, les heures jamais.

```
capacité  = heures réellement disponibles/semaine × 52 − entretien de l'existant
charge    = dev + prospection + support + contenu + admin + comptabilité + conformité
ratio     = charge / capacité
```

**Un ratio > 1 est un verdict d'arrêt aussi net qu'un CAC supérieur à la marge, et il est bien plus fréquent.**
Piège quasi universel : compter les heures de dev et oublier vente et administration — typiquement 40 à 60 % du
total chez un solo. Sortie complémentaire utile : **heures par euro de chiffre d'affaires**.

## 2. Plafond structurel de revenu

Le point mort dit le plancher. Personne ne calcule le **plafond**.

Pour tout modèle à composante humaine — concierge, service, expertise du porteur — le revenu maximal est
`heures disponibles × taux réalisable`. **Compare ce plafond au seuil de subsistance avant de tester la demande.**
Un modèle qui plafonne sous le seuil est mort même si toute la demande est prouvée.

## 3. Arithmétique du pipeline et longueur de cycle

`contacts → conversations qualifiées → propositions → signatures`, avec la durée médiane du cycle.

**Test de mort spécifique** : si le cycle médian est de 5 mois et le runway de 9, le nombre de cycles disponibles
est 1. Aucun apprentissage n'est possible — le projet est arithmétiquement condamné avant d'avoir commencé.

Calcule aussi la **décroissance de la liste** : on épuise son marché joignable en N mois, et N est calculable
à partir de P0.

## 4. Canal répétable

**3 clients payants consécutifs, même canal identifié, aucune relation personnelle impliquée, coût mesuré.**
Tant que ce n'est pas atteint, l'acquisition n'est pas prouvée — la prévente à un inconnu ne prouve qu'un
événement isolé, pas un canal.

## 5. Structure temporelle de la demande

Absent de presque tous les corpus, et structurant sur les marchés de passion et saisonniers.

Instruments : courbe de recherche sur 5 ans, calendrier événementiel du secteur, saisonnalité observée de l'occasion.

Trois corollaires opérationnels :
- **Un test lancé en creux de saison produit un faux négatif ; en pic, un faux positif.** La **date** du test
  s'annote sur chaque livrable, au même titre que le segment.
- Les critères d'arrêt datés doivent tomber **après un cycle saisonnier complet**, sinon le dispositif d'arrêt
  devient nuisible.
- Un chiffre d'affaires concentré sur 3 mois face à 12 mois de charges est un problème de trésorerie distinct
  du besoin en fonds de roulement.

Ajoute la **sensibilité au cycle économique** : classe la dépense en contrainte / discrétionnaire / statutaire.
Un achat de passion est le premier poste coupé. Traite −30 % de demande comme scénario **central**, pas comme
pire cas.

## 6. Fréquence naturelle du job — marché de stock ou de flux

Combien de fois par an, ou par décennie, ce besoin survient-il pour **une même personne** ?

Si le besoin est traversant — acheter ou revendre un véhicule, déménager, se marier — le client **sort du marché
après usage**. Conséquences : la LTV vaut une transaction, le CAC doit être remboursé au premier achat, et
l'entreprise est une machine à acquisition perpétuelle.

**La vraie taille annuelle du marché est alors le taux de renouvellement de la population, pas la population.**

## 7. Coût de service et charge de support

`tickets/client/mois × minutes × coût horaire du porteur`, et la courbe en fonction du nombre de clients.

Identifie le point où le support consomme toutes les heures disponibles — il arrive souvent **avant** le point
mort. C'est ce coût qui rend faux le « coût marginal nul » du logiciel chez un solo, et **il croît exactement
avec le succès**.

## 8. Activation et temps jusqu'à la première valeur

Trou classique entre acquisition et rétention. Compte les étapes avant la première valeur, et surtout le
**démarrage à froid côté client** : données à saisir, historique à importer, intégration à faire.

Un produit qui exige 40 minutes de saisie avant sa première valeur a un plafond d'activation qui **invalide
rétroactivement** tous les taux de conversion utilisés en amont.

## 9. Solvabilité et ligne budgétaire de l'acheteur

Vérifier la volonté de payer ne suffit pas. Quel poste de dépense existant je remplace ? Qui signe ? Quel budget
annuel le foyer ou l'entreprise consacre déjà à cette catégorie, et cette dépense est-elle **observable** ?

Sur un marché de passion, l'écart entre « concerné » et « solvable sur cette ligne » est exactement là où les
projets meurent.

## 10. Concentration et dépendance

- **Client** : part du CA du premier client et des trois premiers, seuil d'alerte écrit. Versant français :
  dépendance économique et risque de requalification quand un solo tire l'essentiel de son revenu d'un donneur
  d'ordre unique.
- **Canal** : part de l'acquisition passant par un compte, une plateforme ou une communauté unique. Existe-t-il
  un actif possédé et exportable ? Question à poser telle quelle : **« si ce compte disparaît ce soir, que
  reste-t-il et en combien de jours ? »** Cas particulier fréquent : le modérateur unique d'une communauté de
  niche, personne physique capable de supprimer 100 % du canal en un clic.

## 11. Frictions d'encaissement

- **Échec de paiement involontaire** : carte expirée, plafond, authentification forte. Sans relance automatique,
  c'est du churn pur, et une fraction importante du churn total en B2C.
- **Remboursements, rétractation, litiges** — versant économique, pas seulement conformité. Effet sur le CA net
  et sur le CAC déjà dépensé. Un taux de litige élevé fait fermer un compte de paiement : mort opérationnelle
  instantanée pour un solo. *Seuils à vérifier auprès du prestataire retenu.*
- **B2B** : délai de paiement, impayés, et l'incapacité matérielle d'un solo à recouvrer.

## 12. Seuils de croissance — ce sont des marches, pas des pentes

Chacun avec le CA ou la date qui le déclenche, et le coût du franchissement : plafonds de régime simplifié,
bascule TVA, TVA des services numériques intra-UE et guichet unique, facturation électronique, obligations
déclaratives des plateformes d'intermédiation.

*Ces seuils et calendriers ont fait l'objet de réformes et de reports successifs. **À vérifier en source primaire
avant tout calcul** — ne jamais les citer de mémoire.*

## 13. Capacité à absorber le succès

Tout le reste mesure l'échec. L'asymétrie inverse existe : si la prévente convertit dix fois la prévision,
combien de clients peut-on servir sans dégrader la promesse ?

Sortie : plafond de service hebdomadaire, file d'attente assumée, prix de rationnement. C'est le scénario où un
solo grille sa réputation en un mois, et le seul que les critères d'arrêt ne couvrent jamais.

## 14. Coût et faisabilité de l'arrêt

Les critères d'arrêt disent quand arrêter, jamais ce que l'arrêt coûte : remboursement des abonnements annuels
en cours, engagements contractuels, portabilité des données, radiation.

**Un solo qui a vendu de l'annuel ne peut pas s'arrêter** — son critère d'arrêt est inapplicable au moment où il
se déclenche. À chiffrer avant de vendre la première formule annuelle, et à borner par le choix des formules :
mensuel sans engagement = liberté d'arrêt conservée.

## 15. Vitesse d'apprentissage

Le seul indicateur de pilotage qui fonctionne **avant** d'avoir des clients, et la seule défendabilité réellement
actionnable en solo : être **inrattrapable** plutôt qu'incopiable.

Mesure : délai médian entre un signal utilisateur et le changement livré · nombre de tests décisifs par mois ·
coût moyen d'un test.
