# Contraintes de conception — skill d'audit de viabilité

Fixées par Julian le 14/08/2026. Elles priment sur toute proposition d'architecture.

## Principe

> « Il faut vraiment que le skill soit agnostique au projet : il regarde le contexte qu'il peut avoir
> dans les fichiers du projet, il me pose des questions à la manière de BMAD, et c'est tout. »

## Traduction concrète

### 1. Auto-découverte, aucune entrée obligatoire
Le skill s'auto-alimente depuis ce qu'il trouve, dans cet ordre de priorité, et n'échoue jamais sur une absence :
`README` · `CLAUDE.md` · manifestes (`package.json`, `pyproject.toml`, `go.mod`, `Gemfile`…) · historique git
(dernier commit, fréquence, contributeurs, âge) · services déployés et leur état réel · `docs/` · PDF et decks
présents · sorties `_bmad-output/` de sessions antérieures.

**Il doit fonctionner à l'identique sur un projet vide contenant une idée en une phrase, et sur six mois de code.**
Greenfield et brownfield entrent par la même porte.

### 2. DÉCLARÉ ≠ OBSERVÉ, dès la lecture
Tout ce qui est lu dans les fichiers du projet entre comme **DÉCLARÉ** — un README est un document marketing,
un deck ment, y compris le sien. N'entre comme **OBSERVÉ** que ce que le skill vérifie lui-même : un domaine
qui résout, un service qui répond, un commit qui existe, une dépendance réellement importée.

*Origine : un deck annonçait une levée de 46 000 $ qui n'avait jamais eu lieu.*

### 3. Questions à la manière BMAD
- **Une question par message.** Jamais de mur de questions.
- **Pas de menu à choix multiples**, sauf pour un vrai choix de *processus* (profondeur de l'audit, par exemple).
- **Ne demander que ce qui n'a pas pu être trouvé.** Si le README nomme la cible, ne pas la redemander —
  la refléter pour confirmation, ce qui n'est pas la même chose.
- Poser d'abord ce qui peut faire échouer l'audit tout de suite (budget réel, temps réel, seul ou non,
  est-il lui-même la cible).

### 4. Aucune hypothèse de domaine ni de stack
Zéro vocabulaire sectoriel en dur. L'archétype du projet (B2B, B2C, marketplace, outil interne, infra…)
est **déduit** de ce qui est trouvé, jamais demandé comme une case à cocher. Les gates spécifiques à
l'archétype se chargent ensuite depuis `references/`.

### 5. « Et c'est tout »
Le skill s'arrête sur **une note chiffrée, un verdict, une objection contre son propre verdict, et une
condition de mort**. Il ne produit ni PRD, ni roadmap, ni code, ni plan d'action détaillé. Il passe la main
à `bmad-product-brief` si et seulement si le verdict le justifie.

*Origine : la sur-ingénierie en amont de la validation est le mode d'échec principal du porteur.*

### 6. Comparabilité entre projets
La note suit un barème pondéré explicite, identique d'un projet à l'autre, avec pénalité par hypothèse
portante non vérifiée. Une note calculée, jamais ressentie.
