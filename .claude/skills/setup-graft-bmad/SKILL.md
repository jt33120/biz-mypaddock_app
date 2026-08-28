---
name: setup-graft-bmad
description: Câbler graft (graphe de contexte, économie de tokens) et BMad (skills de méthode) sur un projet, en particulier dans une session Claude Code cloud fraîche où le binaire graft n'existe pas. Déclencher quand l'utilisateur dit "installe graft", "setup graft et bmad", "câble graft sur ce projet", "je veux le même outillage que mypaddock", ou signale que graft ne répond pas en cloud (ENOENT, pas de ligne "tokens saved").
---

# Câbler graft + BMad sur un projet

Deux outils de nature opposée. Confondre les deux fait perdre des heures.

| | BMad | graft |
|---|---|---|
| Nature | fichiers markdown | binaire npm + serveur MCP |
| Installation | **aucune** — versionner suffit | npm, et une plomberie non évidente |
| Marche en cloud | dès le clone | seulement si les pièges ci-dessous sont traités |

## BMad — rien à installer

Ce sont des skills, donc des fichiers. Une fois dans le dépôt, ils marchent partout
(local, cloud, mobile) sans binaire ni dépendance. Quatre emplacements :

- `.claude/skills/bmad-*/` — ce que Claude Code charge
- `.agents/skills/bmad-*/` — miroir pour les autres agents (opencode, codex…)
- `_bmad/` — le moteur : `config.toml`, `config.user.toml`, `core/`, `bmm/`, `bmb/`, `cis/`, `custom/`, `scripts/`
- `_bmad-output/` — les artefacts produits (PRD, epics, recherches)

Pour porter BMad sur un nouveau projet : copier ces dossiers, committer, pousser sur la
branche par défaut. Vérifier par `ls -d .claude/skills/bmad-* | wc -l`. C'est tout.

`_bmad/config.user.toml` porte les réglages propres à l'utilisateur — l'adapter au
nouveau projet plutôt que le recopier tel quel.

## graft — quatre pièges, tous rencontrés en vrai

### 1 · Le serveur MCP démarre AVANT tout hook

C'est le piège principal, et il a coûté trois sessions de test. Un `.mcp.json` qui
lance le binaire nu échoue en container frais :

```
graft (ENOENT): "Executable not found in $PATH: graft"
```

Un serveur MCP est lancé à l'**initialisation** de la session, bien avant qu'un hook
`SessionStart` ait pu installer quoi que ce soit. **Aucun hook ne peut corriger ça.**
La seule forme qui marche partout, `npx` allant chercher le paquet lui-même :

```json
{
  "mcpServers": {
    "graft": { "command": "npx", "args": ["-y", "@nanonets/graft", "mcp"] }
  }
}
```

### 2 · graft réécrit sa propre config — ne jamais l'écrire à la main

Au moindre lancement (`graft build`, démarrage MCP…), graft régénère
`.claude/settings.json`, `.claude/skills/graft/SKILL.md` et `.claude/helpers/graft-*.cjs`.
Toute config écrite à la main est écrasée sans avertissement.

Donc : installer graft, le lancer une fois, **committer ce qu'il a généré**. Ne
l'amender qu'à la marge (voir point 3).

Corollaire sur les noms d'arguments — les hooks sont en kebab-case, pas en PascalCase :

| Événement | Argument attendu |
|---|---|
| `SessionStart` | `session-start` |
| `UserPromptSubmit` | `prompt` |
| `PostToolUse` (Write\|Edit\|MultiEdit) | `post-edit` |
| `PostToolUse` (Bash\|mcp__graft__) | `tool-savings` |
| `Stop` | `stop` |

Un mauvais nom ne produit aucune erreur : le hook ne fait simplement rien. Et sans le
hook `tool-savings`, la ligne « 🌱 graft saved ~Xk tokens » n'apparaît jamais.

### 3 · Les helpers gravent un chemin absolu

`.claude/helpers/graft-*.cjs` contient une constante `BAKED` pointant vers le
`dist/claude` de la machine qui a généré le fichier. En cloud, graft y écrit le cache
npx du container (`/root/.npm/_npx/<hash>/…`), valable pour ce seul container.

**Ne pas committer ce chemin.** Le helper retombe sur `npm root -g`, donc une install
globale au démarrage rend la constante sans importance. Ajouter l'install devant le
hook `session-start` que graft a généré :

```
command -v graft >/dev/null 2>&1 || npm install -g @nanonets/graft --silent 2>/dev/null || true; node "${CLAUDE_PROJECT_DIR:-.}/.claude/helpers/graft-hooks.cjs" session-start
```

Le `command -v` évite ~15 s de npm quand le binaire est déjà là ; les `|| true`
garantissent qu'un échec réseau ne bloque jamais le démarrage.

### 4 · `graft/` est un cache, pas une source

Le dossier `graft/` se régénère en quelques secondes (`graft build`, déterministe,
sans clé API). graft l'ajoute lui-même au `.gitignore`. Le versionner produit un
instantané qui dérive du code en silence — exactement ce qu'un agent ne doit pas lire.
Si un dépôt le versionne déjà : `git rm -r --cached graft/`.

## Marche à suivre

1. `npm install -g @nanonets/graft`
2. `graft build` à la racine du projet — génère `graft/`, câble les agents, met à jour `.gitignore`
3. Écrire `.mcp.json` en forme `npx` (point 1) — graft ne le fait pas correctement pour le cloud
4. Ajouter l'install globale devant le hook `session-start` (point 3)
5. `git checkout .claude/helpers/` si graft y a gravé un chemin de container
6. Vérifier que `graft/` n'est pas suivi par git
7. Committer, pousser, **et merger sur la branche par défaut**

L'étape 7 n'est pas une formalité : une session cloud démarre depuis la branche par
défaut. Tant que le correctif dort dans une PR ouverte, aucune nouvelle session n'en
bénéficie — c'est la cause de deux échecs de test consécutifs.

## Vérifier — depuis un état vraiment vierge

Tester avec graft déjà installé ne prouve rien. Repartir de zéro :

```bash
npm uninstall -g @nanonets/graft; rm -rf ~/.npm/_npx
```

Puis contrôler les trois surfaces, séparément :

```bash
# 1 · le hook, commande exacte lue depuis le fichier (pas retapée)
python3 -c "import json;print(json.load(open('.claude/settings.json'))['hooks']['SessionStart'][0]['hooks'][0]['command'])" | sh

# 2 · la statusline doit afficher "graft · N nodes / M edges · ✓ synced"
node .claude/helpers/graft-statusline.cjs

# 3 · le serveur MCP doit répondre au handshake JSON-RPC
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
  | npx -y @nanonets/graft mcp 2>/dev/null | head -c 200
```

Les trois doivent passer. Le point 3 est celui qui échouait, et c'est le seul que ni le
hook ni la statusline ne révèlent.

## Signature d'une panne

| Symptôme | Cause |
|---|---|
| `ENOENT: Executable not found in $PATH: graft` | `.mcp.json` lance le binaire nu → passer à `npx` |
| Outils MCP absents, aucune erreur | serveur MCP non démarré — lire les logs de connexion MCP |
| graft répond mais pas de ligne « tokens saved » | hook `tool-savings` manquant ou mal nommé |
| Statusline vide | helper ne résout pas graft → install globale absente |
| Tout marche ici mais pas en nouvelle session | correctif non mergé sur la branche par défaut |
