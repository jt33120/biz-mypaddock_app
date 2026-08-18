---
title: "Parcours BMAD — MyPaddock"
created: 2026-08-18
updated: 2026-08-18
---

# Parcours BMAD — ce qui est fait, ce qui reste, dans quel ordre

## L'arithmétique qui commande tout

**18 août 2026 → 1er décembre 2026 = 105 jours.**

Le brief nomme quatre morts possibles. La première est « mars n'arrive jamais », et son signal le
plus précoce est daté : *si le trio roulage + chrono + coût ne tourne pas de bout en bout au
1er décembre 2026, mars n'arrivera pas.* Le brief nomme aussi la ressource rare : **les soirées**,
et le fait que les soirées de planification sont les mêmes que les soirées de code.

Conséquence directe sur ce document : **un skill n'entre dans la séquence que s'il résout une
hypothèse notée faible ou moyenne au registre, ou s'il rend tous les suivants meilleurs.** Le reste
attend. Enchaîner douze skills de planification avant d'écrire une ligne de code serait la façon
la plus BMAD-compatible possible de rater décembre.

---

## 1. Ce qui est déjà fait

| Skill | Artefact | Ce qu'il a produit |
|---|---|---|
| `bmad-brainstorming` ×2 | `brainstorming/brainstorm-relance-…-08-13/`, `…-trackday-2026-08-17/` | Le recadrage bac à sable, les achievements, la comparaison entre potes |
| `bmad-cis-design-thinking` | `design-thinking-2026-08-16.md` | Le point de vue utilisateur |
| `bmad-cis-innovation-strategy` | `innovation-strategy-2026-08-16.md` | La lecture du modèle |
| `bmad-deep-recon` (market) | `research/market-mypaddock-track-france-2026-08-16/` | Paysage FR, chiffres fédéraux, naming, NanoCorp, audit de citations |
| `bmad-deep-recon` (user-voice) | `research/user-voice-apps-trackday-moto-2026-08-17/` | **A renversé 3 affirmations du brief** — le récap partageable n'est pas neuf, Driver Nation existe, le « geste nul » n'est pas vérifié |
| `bmad-prfaq` | `prfaq-MyPaddock.md` + distillat | Le passage Working Backwards |
| `bmad-document-project` | `brownfield-inventory.md` | L'inventaire du code MyPaddock 2.0 réutilisable |
| `audit-viabilite` *(custom)* | `viability-assessment-2026-08-16.md` | L'évaluation de viabilité |
| `bmad-forge-idea` | `forge/mypaddock-trackday/` | L'idée durcie, `forged-idea.md` + rapport HTML scellé |
| `bmad-product-brief` ×2 | `briefs/brief-…-08-16/`, `…-08-17/` | Le brief du 17 **remplace** celui du 16 (renversement de la décision de tête) |
| `bmad-review` | 21 constats appliqués au brief | Les lentilles adversariale, cas-limites, écarts de vérification, structure, prose |
| `bmad-advanced-elicitation` | brief 2 554 → 4 292 mots | 5 méthodes : audit d'hypothèses, pre-mortem, rotation des parties prenantes, panel sceptique, second ordre |
| `ui-ux-pro-max` *(hors BMAD)* | `design/01→04.html` + `DIRECTION.md` | Direction de design verrouillée (Attract Mode) |
| `bmad-help` | — | Routage |
| `bmad-prd` | `prds/prd-MyPaddock-2026-08-18/` | **Brouillon complet** — §0 à §13, 60 FR / 18 NFR / 9 QO. Reste le Reviewer Gate et le polissage. |

**Onze skills BMAD terminés, le douzième en cours** — une vingtaine de passages en comptant les répétitions. C'est déjà une chaîne longue.

---

## 2. Avant le PRD — trois qui paient, un optionnel

### 2.1 `bmad-customize` — ✅ FAIT le 18 août 2026

> 16 overrides écrits dans `_bmad/custom/`, tous pointant vers `mypaddock-contraintes.md`.
> Merges vérifiés au résolveur. Voir le memlog du PRD pour le détail.

#### Pourquoi il fallait le faire d'abord

Le seul skill dont le retour est multiplicatif. Il écrit des `persistent_facts` dans
`_bmad/custom/` que **tous les skills aval chargent automatiquement à l'activation**.

À y injecter :
- le vocabulaire — **roulage** jamais « trackday », groupes **Blanc / Jaune / Rouge**, la structure
  de journée (briefing 8 h 30, pause 12 h–14 h, fin 17 h 30) comme squelette d'écran ;
- les trois clauses de sécurité de second ordre ;
- la règle de coupe inversée — *on coupe la corvée, jamais le plaisir* ;
- « rien ne vit uniquement dans le navigateur » ;
- la date du noyau — 1er décembre 2026 ;
- `DIRECTION.md` comme `file:` référencé.

Sans ça, il faudra re-expliquer ces contraintes à `bmad-ux`, puis à `bmad-architecture`, puis à
`bmad-create-epics-and-stories`, et chaque oubli est un écart silencieux.

### 2.2 `bmad-deep-recon --type technical` — ✅ FAIT le 18 août 2026

> **A12 validée, mais par un autre mécanisme que prévu** : ce n'est pas l'exemption des web apps
> installées (non documentée par Apple) mais `navigator.storage.persist()`, qui sort l'origine de
> l'éviction — phrase primaire WebKit. Deux hypothèses retournées : Meta ne documente aucun chemin
> web vers Instagram **ni Facebook** Stories, et WebKit n'a jamais implémenté Background Fetch,
> l'alternative qu'il recommandait lui-même.
>
> Rapport : `planning-artifacts/research/technical-pwa-hors-ligne-et-partage-2026-08-18/`
> — 7 900 mots, 52 sources, 6 digests, briefing HTML. Citations vérifiées 10/10.

#### Ce qu'il devait résoudre

**A12 : « Une PWA hors ligne suffit à tenir la promesse de continuité » — confiance moyenne,
impact fort.** C'est une contrainte de tête du brief, et elle n'a aucune source. Le PRD va écrire
des exigences non fonctionnelles dessus ; sans recherche, ce sont des articles de foi.

Ce qu'il faut vérifier, avec des sources datées de 2026 :
- la politique d'éviction du stockage sur **Safari iOS** pour une PWA ouverte onze fois par an —
  c'est le mode de panne exact que le brief redoute (« j'ouvre en mars et ma saison a disparu ») ;
- `navigator.share()` **avec fichier** sur Safari iOS et Chrome Android — le partage est le moteur
  d'acquisition, s'il ne marche pas le domaine 6 tombe ;
- Background Sync et son absence sur iOS — quelle stratégie de rattrapage ;
- composition d'image côté client (Canvas) et polices embarquées, pour le gabarit de partage ;
- OCR de reçus embarqué contre API — et ce que ça coûte hors ligne.

C'est le **type de recon jamais utilisé** sur ce projet, et le seul qui touche une hypothèse de
tête non résolue.

### 2.3 `bmad-cis-problem-solving` — ✅ FAIT le 18 août 2026

> **Deux causes racines, pas une.** (1) Le produit est un système fermé à un seul scripteur —
> il ne peut pas surprendre son scripteur. (2) Le roulage est la seule unité de compte, et il
> n'existe pas quatre mois par an.
>
> **Recommandation : deux mécanismes et une suppression.** Accueil temporel pour le vide
> inter-roulage (dans le noyau de décembre, presque gratuit) ; la machine comme seconde unité
> de compte pour le vide saisonnier ; **le mode hors-saison disparaît du périmètre** — un
> domaine en moins, pas un de plus.
>
> Rapport : `problem-solution-2026-08-18.md` — 7 700 mots.

#### Le problème d'origine

Le panel sceptique a produit une trouvaille que le brief a inscrite sans y répondre :

> **La cadence naturelle du produit est d'environ onze usages par an.** Un produit ouvert onze fois
> par an ne se retient pas ; il doit fabriquer lui-même ses occasions d'ouverture.

Aucun des dix domaines n'y répond, sauf le mode hors-saison — livré en novembre, c'est-à-dire
onze mois après le premier roulage. C'est un vrai problème de conception, et
`bmad-cis-problem-solving` est fait exactement pour ça. Jamais utilisé sur ce projet.

### 2.4 *(optionnel)* `bmad-party-mode` — sur la coupe de décembre

L'élicitation avancée a fait tourner les parties prenantes **externes** (le pote, l'acheteur,
l'organisateur, le pilote de juin). Ce qui manque est la rotation **interne** : faire trancher
Winston (architecte), Sally (UX) et John (PM) sur *ce qui tombe si décembre glisse de trois
semaines.* Le PRD contient déjà la règle de coupe ; le party mode dirait si elle tient sous
contrainte réelle.

À faire seulement si le PRD laisse le noyau flou. Sinon, sauter.

---

## 3. Après le PRD — la chaîne, dans l'ordre

| # | Skill | Ce qu'il résout | Quand |
|---|---|---|---|
| 1 | `bmad-review` sur le PRD | Les 5 lentilles sur un document neuf. A trouvé 21 constats sur le brief. | dans la foulée |
| 2 | `bmad-advanced-elicitation` sur le PRD | Méthodes non encore employées — le catalogue en contient bien plus que 5 | dans la foulée |
| 3 | `bmad-validate-prd` | Le gate rubric officiel, rapport HTML | avant de figer |
| 4 | `bmad-cis-storytelling` | **Instrumente A3 et A10**, deux paris de tête à confiance faible : la voix du produit, le gabarit de partage, et la ligne éditoriale que les 6 000 abonnés n'ont pas | avant l'UX |
| 5 | `bmad-ux` | Formalise les 4 correctifs de `DIRECTION.md` — bleu ciel Miami, plus épuré, deux polices, moins d'effets | septembre |
| 6 | `bmad-architecture` | Local-first, résolution de conflits, catalogue-donnée sans redéploiement, échelle de capacité des chronos sans réécriture | septembre |
| 7 | `bmad-spec` *(optionnel)* | Distille PRD + UX + archi en un `SPEC.md` court — le contrat que lisent les agents de code. Recouvre partiellement les épiques ; à prendre si le PRD reste long | septembre |
| 8 | `bmad-create-epics-and-stories` | Découpe en épiques, avec le noyau de décembre comme épique 1 | octobre |
| 9 | `bmad-project-context` | `AGENTS.md` — commandes vérifiées, conventions, pièges. **Exige que les dépôts existent** (neufs, sans l'ancien co-fondateur, tous secrets tournés) | à la création des dépôts |
| 10 | `bmad-sprint-planning` | Le gate PASS / CONCERNS / FAIL avant la première ligne | octobre |
| 11 | `bmad-build` / `bmad-dev-story` | La boucle d'implémentation | octobre → décembre |
| 12 | `bmad-code-review`, `bmad-qa-generate-e2e-tests`, `bmad-checkpoint-preview` | Les couches de contrôle | en continu |
| 13 | `bmad-retrospective` | En fin d'épique | après le noyau |
| 14 | `bmad-correct-course` | Si le périmètre dérive — et il dérivera | quand le signal se déclenche |

---

## 4. Ce qui attend, avec la raison

| Skill | Pourquoi pas maintenant |
|---|---|
| `bmad-deep-recon --type domain` (barème constructeur) | Résout **A13**, mais le domaine 8 est livré en **mai 2027**. Le faire en août, c'est de la recherche qui aura vieilli avant d'être lue. |
| `bmad-deep-recon` forme *select* (le nom) | Précondition **commerciale**, pas précondition de code. Le nom bloque une sortie publique, pas décembre. À faire avant de sortir du bac à sable. |
| `bmad-deep-recon --type competitive` | Le paysage a déjà été couvert deux fois — market le 16, user-voice le 17. Un troisième passage rapporterait des redites. |
| `bmad-cis-agent-presentation-master` | Utile pour pitcher. Il n'y a personne à qui pitcher. |
| `bmad-agent-builder`, `bmad-module-builder`, `bmad-workflow-builder` | Construire des skills BMAD au lieu de construire l'application. `bmad-customize` couvre 90 % du besoin réel pour 5 % du coût. |
| `bmad-eval-runner` | Aucun composant IA au périmètre v1. L'OCR n'est pas de l'IA à évaluer, et l'addendum interdit explicitement de présenter des heuristiques comme telles. |

---

## 5. Ce qui n'est pas une étape

Sur les ~65 skills installés, une partie n'est pas une étape de parcours :

- **Des redirections** vers `bmad-deep-recon` — `bmad-market-research`, `bmad-domain-research`,
  `bmad-technical-research`. Même moteur, entrée différente.
- **Des redirections** vers `bmad-prd` — `bmad-create-prd`, `bmad-edit-prd`, `bmad-validate-prd`.
- **Des lentilles** de `bmad-review`, pas des skills autonomes — `bmad-review-adversarial-general`,
  `bmad-review-edge-case-hunter`, `bmad-review-verification-gap`, `bmad-editorial-review`,
  `-prose`, `-structure`.
- **Des personas** convoquées par `bmad-party-mode` et les autres — `bmad-agent-analyst` (Mary),
  `bmad-agent-pm` (John), `bmad-agent-ux-designer` (Sally), `bmad-agent-architect` (Winston),
  `bmad-agent-dev` (Amelia), et les six coachs CIS.
- **Des variantes automatisées** — `bmad-build-auto`, `bmad-dev-auto`, `bmad-quick-dev`,
  `bmad-create-story`, `bmad-sprint-status`, `bmad-generate-project-context`.

Le compte de skills BMAD **réellement distincts et pertinents pour ce projet** est d'environ
une trentaine. Onze sont faits, le PRD est le douzième.

---

## 6. Le chemin recommandé, en une ligne

`bmad-customize` → `bmad-deep-recon --type technical` → `bmad-cis-problem-solving` →
**finir le PRD** → `bmad-review` → `bmad-advanced-elicitation` → `bmad-cis-storytelling` →
`bmad-ux` → `bmad-architecture` → `bmad-create-epics-and-stories` → `bmad-project-context` →
`bmad-sprint-planning` → `bmad-build`.

**Treize étapes, dont trois avant le PRD.** Compter environ deux semaines pour les trois premières
et la reprise du PRD, ce qui laisse **90 jours pour le noyau de décembre.**
