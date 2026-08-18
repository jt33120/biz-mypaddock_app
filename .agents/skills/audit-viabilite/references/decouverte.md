# Découverte automatique du projet

Objectif : reconstituer ce qu'est le projet **sans rien exiger du porteur**, et sans jamais confondre ce que le
projet dit de lui-même avec ce qui est vrai. Fonctionne à l'identique sur un dossier vide contenant une idée en
une phrase et sur six mois de code.

## Tout ce qui est lu entre en DÉCLARÉ

Un README est un document marketing. Un deck ment, y compris le sien. Une landing page décrit une intention.
Rien de ce qui est *écrit par le projet sur le projet* n'est un fait.

Balaye, dans cet ordre, en t'arrêtant sans erreur sur ce qui manque :

| Source | Ce qu'on en tire |
|---|---|
| `README*`, `CLAUDE.md`, `docs/`, wiki | promesse revendiquée, cible revendiquée, état revendiqué |
| Manifestes (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Gemfile`…) | stack, dépendances payantes, intégrations, âge |
| `git log` | dernier commit, fréquence, trous d'inactivité, contributeurs et leur part |
| PDF, decks, business plans | chiffres revendiqués — **à traiter comme suspects par défaut** |
| `_bmad-output/`, notes, TODO | historique de décision, pivots antérieurs |
| Fichiers de déploiement (`Dockerfile`, `*.toml`, CI) | ce qui est censé tourner |

## Puis vérifie toi-même — seul l'OBSERVÉ compte

C'est ici que tu as un avantage qu'un humain avec un carnet n'a pas : **tu exécutes**. La preuve non déclarative
est immédiate et quasi gratuite. Fais-la systématiquement, sur tous les projets, sans arbitrage.

Sur le projet :
- Le domaine résout-il ? `host <domaine>` — un NXDOMAIN dit plus qu'un README
- Le service répond-il ? un `curl` sur un health endpoint
- La base répond-elle ? une pause ou une suppression est invisible dans le code
- Le dernier commit date de quand, et l'activité s'est-elle arrêtée net ?
- Les dépendances déclarées sont-elles **réellement importées** dans le code ?
- Combien de lignes réellement écrites, hors généré et hors dépendances ?

Sur les concurrents (voir `portes.md` P1) :
- Domaine vivant, dernier commit public, comptes déposés, page de prix sur Wayback,
  application encore présente sur les stores, date de la dernière mise à jour.

## Déduire l'archétype, jamais le demander

Range le projet dans un archétype à partir de ce que tu as trouvé — B2C grand public, B2B PME, B2B grand compte,
marketplace, outil interne, infrastructure/dev-tool, contenu/média, place de marché de services.
L'archétype détermine quelles portes sont bloquantes (`portes.md`), pas l'inverse.

Signaux utiles : présence d'un système de paiement, d'un back-office, d'une notion de rôles, d'un moteur de
recherche, d'un flux d'annonces, d'une intégration à un SI tiers, d'une documentation d'API publique.

## Table des affirmations portantes

Sortie obligatoire de cette phase. **3 à 5 lignes, pas 30.** Une affirmation est portante si sa fausseté tue ou
transforme le projet.

| Affirmation | Statut | Source + date | Coût de vérification |
|---|---|---|---|
| ex. « personne ne fait ça » | SUPPOSÉ | aucune | 45 min, agent seul |
| ex. « 120 utilisateurs actifs » | SUPPOSÉ | deck, non daté | 10 min, requête base |

Une affirmation `SUPPOSÉ` dont la vérification coûte moins d'une heure **se vérifie immédiatement** : il est
absurde de la traîner dans tout l'audit. Celles qui coûtent cher restent `SUPPOSÉ` et bloquent l'aval qui en dépend.

## Ce que tu reflètes au lieu de le demander

Tout ce que tu as trouvé se **reflète pour confirmation**, jamais ne se redemande :

> « D'après le README, la cible est <X> et la promesse est <Y>. Le dernier commit date du <date> et le domaine
> ne résout plus. C'est bien ça, ou j'ai raté quelque chose ? »

Une seule question, elle porte sur ce que tu as établi, et elle laisse la porte ouverte à la correction.
