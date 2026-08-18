---
name: audit-viabilite
description: Qualifie par élimination si un projet peut rapporter de l'argent, et départage plusieurs projets. Déclencher sur audit de viabilité, ce projet est-il viable, lequel de mes projets je garde.
---

# Audit de viabilité

## Ce que fait ce skill

Il répond à une seule question : **ce projet peut-il rapporter de l'argent, et si j'en ai plusieurs, lequel je garde ?**

Il fonctionne par **élimination**, pas par notation. Un projet ne « marque pas des points » : il franchit des
portes, ou il meurt à l'une d'elles. Un zéro à une porte n'est jamais rattrapable par un excellent score ailleurs.

> **Pourquoi pas un barème pondéré.** Un scorecard laisse un projet compenser un défaut fatal par une force sans
> rapport. Cas réel : un projet notant 15/15 en adéquation fondateur-marché et 5/30 en preuve de demande obtenait
> une note « moyenne » honorable alors qu'il était mort. Trois degrés de liberté (critères, poids, notes) suffisent
> à obtenir n'importe quel résultat souhaité sous apparence quantitative. **Les portes sont conjonctives.**
> Une note n'apparaît qu'à la toute fin, et seulement pour départager des survivants.

Le skill s'arrête sur un verdict, l'objection la plus forte contre ce verdict, et une condition de mort.
**Il ne produit ni PRD, ni roadmap, ni code.**

## Conventions

- Chemins nus → depuis `{skill-root}`. Préfixe `{project-root}` → depuis le répertoire de travail.
- Les `references/*.md` se chargent **à la demande**, jamais toutes d'un coup.
- `{workflow.<nom>}` → champs de `customize.toml` **s'il est lisible**. Sinon, applique ces défauts et continue
  sans jamais bloquer :

| Valeur | Défaut si `customize.toml` est absent |
|---|---|
| `{doc_workspace}` | `{project-root}/_audit/audit-<projet-slug>-<date>/` |
| seuil de pénétration max (P2) | 2 % de l'audience joignable |
| seuil d'heures pour P0 bis | 10 h/semaine |
| clients consécutifs, canal répétable | 3 |
| budget de l'audit | ~10 h pour le tri, +20 h sur le survivant |

*`customize.toml` est un fichier de confort. Le skill est autonome : il fonctionne à l'identique sans lui, sans
BMAD, et sans aucun outillage préalable dans le projet.*

## À l'activation

1. Charge `{project-root}/_bmad/core/config.yaml` (et `config.user.yaml`) : `{user_name}`,
   `{communication_language}`, `{output_folder}`. Absents → défauts neutres, ne bloque jamais.
2. Salue en `{communication_language}` et reste dedans.
3. Cherche un audit en cours : `{workflow.output_dir}/*/.memlog.md` avec `status` ≠ `complete` → propose la reprise.
4. Sinon → `## Phase 0`.

## Règles dures — elles priment sur tout

Ces sept règles viennent de modes d'échec réellement observés. Elles ne sont pas négociables.

1. **DÉCLARÉ ≠ OBSERVÉ.** Tout ce qui vient des fichiers du projet, du porteur ou d'un site tiers entre comme
   **DÉCLARÉ**. N'entre comme **OBSERVÉ** que ce que tu as vérifié toi-même : un domaine qui résout, un service
   qui répond, un commit qui existe, des comptes déposés, une page archivée. Chaque ligne « fait » porte une URL
   ou une commande en clair.

2. **Tu ne résumes jamais un verbatim.** Les paroles de prospects vont **brutes** dans `verbatims.md`. Tu n'as pas
   le droit de les reformuler, de les condenser ni d'en extraire « l'essentiel ». *C'est dans le résumé que
   « on ne compte pas vraiment » disparaît.* Tu peux compter, citer, jamais paraphraser.

3. **« Ça pourrait être utile » est un non.** Idem : « bonne idée », « tiens-moi au courant », « envoie une démo ».
   Tout « oui, mais… » se compte comme un non. Seul compte un engagement qui coûte quelque chose à celui qui le donne.

4. **Une hypothèse portante non vérifiée bloque l'aval.** Une analyse menée sur des prémisses non vérifiées produit
   une conclusion cohérente et fausse — et plus elle est soignée, plus la fausseté est difficile à déloger.

5. **Jamais la même conversation pour générer une hypothèse et l'évaluer.** Quand tu dois contredire une thèse que
   tu as contribué à formuler, délègue à un sous-agent à qui tu donnes la thèse et l'ordre de la réfuter.

6. **Tu ne poses jamais une question dont la réponse est dans le dossier.** Tu la reflètes pour confirmation.
   Poser une question déjà répondue signale que tu n'as pas lu.

7. **Une porte franchie « de justesse » est une porte échouée.** Il n'y a pas de demi-passage.

**Si le porteur propose un cadre classique** (SWOT, Océan Bleu, Porter, personas, business model canvas,
matrice de risques, RICE…), ou si tu es toi-même tenté d'en produire un : charge `references/theatre.md` avant
de répondre. La plupart de ces outils produisent du faux confort sur un projet pré-revenu porté seul, et
`theatre.md` dit lesquels, pourquoi, et le peu qu'on en garde.

## Phase 0 — Avant de regarder quoi que ce soit

Trois écrits, dans cet ordre, avant toute lecture du projet. Ils ne coûtent rien et sans eux l'audit s'auto-annule.

**0.a — Le budget de l'audit.** Demande un plafond global en **heures** et en **euros**, pour l'ensemble des projets,
écrit et daté. Ordre de grandeur à proposer si le porteur n'en a pas : ~10 h pour trier N projets jusqu'au premier
tri, +20 h sur le survivant jusqu'au premier euro demandé. *Le coût de l'audit doit rester une fraction de ce qu'il
économise.*

**0.b — Le classement de préférence, daté.** Si plusieurs projets : fais-lui écrire **maintenant** son classement
intuitif, et date-le. À la fin, compare. **Si le classement final est identique au classement initial, déclare
l'audit non concluant** — il a servi à habiller un favori, pas à décider.

**0.c — La perte acceptable.** Combien de mois et combien d'euros il accepte de perdre. Écrit avant, jamais après :
un seuil calibré sur ce qui a déjà été obtenu ne coupe jamais.

Puis crée le memlog. **Ce qui n'est pas dans le memlog est perdu.**

*Si `{project-root}/_bmad/scripts/memlog.py` existe* :
```
uv run {project-root}/_bmad/scripts/memlog.py init --workspace {doc_workspace} \
  --field topic="Audit de viabilité — <projet>" --field mode="portes"
```
puis `append --type insight|question|decision|direction` au fil de l'eau.

*Sinon — et c'est le cas le plus fréquent, BMAD n'étant pas installé partout* : crée toi-même
`{doc_workspace}/.memlog.md` avec un frontmatter `topic`, `mode`, `status: en_cours`, et ajoute une ligne
horodatée par entrée, en **append seul**. Ne réécris jamais une ligne existante, ne réordonne jamais.
Le skill ne dépend de BMAD pour rien d'autre : son absence ne doit jamais interrompre un audit.

## Phase 1 — Découverte automatique

Tu lis ce que tu trouves. **Tu n'exiges rien.** Le skill doit fonctionner à l'identique sur un dossier vide
contenant une idée en une phrase et sur six mois de code.

Charge `references/decouverte.md` et suis-le. En résumé : README, AGENTS.md, manifestes, historique git, docs,
PDF et decks, sorties `_bmad-output/` antérieures — le tout en **DÉCLARÉ**. Puis vérifie toi-même ce qui est
vérifiable (DNS, services, commits, dépendances réellement importées) — en **OBSERVÉ**.

**Déduis l'archétype** (B2C, B2B, marketplace, outil interne, infra, contenu…) de ce que tu trouves.
Ne le demande jamais comme une case à cocher. Puis charge la section correspondante de `references/portes.md`.

Produis la **table des affirmations portantes** : chaque affirmation dont la fausseté tue ou transforme le projet,
avec son statut `OBSERVÉ` / `SUPPOSÉ`, sa source datée, et le coût de sa vérification. Vise 3 à 5 lignes, pas 30.

## Phase 2 — Les questions

À la manière BMAD : **une question par message, jamais de mur, jamais de menu** sauf pour un choix de processus.
Ne demande que ce que la Phase 1 n'a pas pu établir. Ordre imposé — ce qui peut tuer l'audit tout de suite d'abord :

1. Heures réellement disponibles par semaine (pas souhaitées : disponibles)
2. Seul ou accompagné
3. Est-il lui-même la cible, et **qui connaît-il nominativement** dans l'audience
4. À quoi ressemble le revenu qui rendrait ce projet « réussi »

## Phase 3 — Les portes

Charge `references/portes.md`. Ordre imposé, et il compte.

**Deux axes gouvernent l'ordonnancement**, et ce ne sont pas les heures du porteur :

- **Qui exécute** — *agent seul* (quasi gratuit, à faire sur TOUS les projets sans arbitrage) · *porteur seul* ·
  *exige un tiers humain* (la ressource rare : un seul projet à la fois).
- **La latence** — recruter huit interlocuteurs d'une niche prend trois semaines quel que soit « l'effort ».
  **Tout ce qui a une longue latence se lance le jour 1, en parallèle du reste.** Trier par effort met en dernier
  ce qui aurait dû partir en premier.

Distingue aussi **ce qui est constant au porteur** (actifs de distribution, logique d'achat vs compétence,
titularité vis-à-vis de l'employeur, runway personnel, heures disponibles, perte acceptable) — fait **une seule
fois** pour tous les projets — de **ce qui est par projet**. Cette seule séparation divise la charge par deux,
et elle passe en premier parce qu'elle élimine des projets sans avoir à les étudier.

**P0 — Joignabilité × logique d'achat** *(une fois, ~2 h, porteur)*
Actifs de distribution nominatifs et chiffrés, croisés avec la logique d'achat de chaque audience
(hédonique / utilitaire). **Un projet dont l'audience n'est pas joignable gratuitement dès demain matin est mort,
sans étude de marché.** Et si l'audience achète par plaisir alors que l'atout du porteur est la rigueur analytique,
la conclusion correcte est de changer d'audience, pas de produit.

**P0 bis — Opérabilité à temps partiel** *(binaire, immédiat)*
Le modèle exige-t-il une présence quotidienne ? Marketplace à amorcer, service sous SLA, produit à modérer,
communauté à animer : structurellement impossibles sous ~10 h/semaine, **indépendamment de la demande**.

**P1 — Recensement nominatif, vivants ET morts** *(~45 min/projet, agent seul)*
Recherche multilingue avec **le vocabulaire du client**, pas le tien. Comptes déposés, dernier commit public,
domaine qui résout, page de prix sur Wayback.
- *Zéro nom* → recherche incomplète, tu n'as pas le droit de conclure à une rareté.
- *Que des morts* → maillon sans argent. Le cimetière dit **pourquoi** personne n'y gagne.
- *Vivants et rentables* → la seule configuration exploitable.

**P2 — Rentabilité inverse** *(~30 min/projet, arithmétique)*
N clients au point mort, **rémunération du porteur incluse**, divisé par l'audience joignable de P0.
Fais descendre le prix jusqu'au revenu disponible : affiché → HT → marge de contribution → net de cotisations →
net d'impôt. L'écart est d'un facteur 1,5 à 2 et il fausse le seul chiffre censé tuer la majorité des projets.
**Au-delà de 1 à 2 % de pénétration implicite, mort.**

**P3 — L'argent d'un inconnu** *(survivant unique, lancé le JOUR 1 car latence ~3 semaines)*
Demander de l'argent à quelqu'un qui ne te connaît pas, seuil de succès **écrit et daté avant**.
Charge `references/entretien.md` pour le protocole anti-politesse.

## Phase 4 — Viabilité opérationnelle

**Uniquement pour les projets ayant franchi P0 à P3.** Charge `references/operationnel.md`.

Un projet peut passer toutes les portes commerciales et mourir sur l'arithmétique des heures. On y traite :
budget d'heures capacité/charge, plafond structurel de revenu, longueur de cycle vs runway, canal répétable
(3 clients consécutifs hors réseau), saisonnalité et datation des tests, fréquence naturelle du job
(marché de stock vs de flux), coût de support, solvabilité de l'acheteur, coût de l'arrêt.

## Phase 5 — Verdict

Un verdict par projet, dans ce format et pas un autre :

```
PROJET · <nom>
Verdict     : POURSUIVRE | VÉRIFIER | RÉORIENTER | ABANDONNER
Mort à      : <la porte échouée, ou "aucune">
Preuve      : <le fait OBSERVÉ qui fonde le verdict, avec sa source>
Objection   : <l'argument le plus fort CONTRE ce verdict, non atténué>
Hypothèses  : <affirmations encore SUPPOSÉES, et le coût de leur vérification>
Condition de mort : <falsifiable, datée, < 2 semaines, < 500 €>
Péremption  : <date après laquelle rejouer cet audit>
```

**Départage entre survivants seulement.** Si plusieurs projets franchissent toutes les portes, alors seulement,
charge `references/comparaison.md` pour les classer. Tant qu'ils ne sont pas tous passés, comparer n'a aucun sens :
on ne classe pas des morts.

Puis compare au classement daté de la Phase 0.b, et dis-le franchement s'il est identique.

## Phase 6 — Clôture

`memlog.py set --key status --value complete`, puis écris `verdict.md` dans `{doc_workspace}`.

**Rituel des perdants.** Pour chaque projet abandonné, écris une date d'archivage et **ce qui devrait devenir vrai
pour le rouvrir**. Sans cet écrit, ils reviennent dans six semaines et tout le tri est à refaire.

Passe la main à `bmad-product-brief` **si et seulement si** un projet est en POURSUIVRE. Sinon, arrête-toi.
