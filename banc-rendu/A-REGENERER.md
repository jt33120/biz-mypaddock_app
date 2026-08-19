# À régénérer quand les crédits Gemini reviennent

Les crédits ont été épuisés le 19 août 2026 (`429 · prepayment credits are depleted`). Rien
n'est perdu : les 107 images produites sont conservées, et le sprite en production vient de
l'une d'elles. Cette liste existe pour que la reprise soit une commande, pas une enquête.

**Règle qui ne change pas :** aucune génération sans accord explicite de Julian, et le
garde-fou `depense.mjs` refuse tout appel sans `--confirme=<n>` où *n* est exactement le nombre
d'appels prévus.

## 1. Essayer v6, le prompt de production — 2 appels, ≈ 0,32 €

```
node banc-rendu/generer.mjs prompts/v6-pixel-production.js 9144 9245 --confirme=2
node banc-rendu/spritifier.mjs sorties/gemini/v6--IMG_9144.png 256
```

`v6-pixel-production.js` n'a **jamais tourné** : il a été composé puis bloqué par l'épuisement
des crédits. Il reprend le corps de `d2f` — six itérations mesurées — et change deux choses :

- **le fond passe en aplat vert détachable**, parce que la scène appartient à l'application ;
  `d2f` rendait son propre ciel violet et son horizon, d'où un carré collé sur l'écran avec deux
  horizons contradictoires ;
- **les deux correctifs de Julian**, vérifiés sur la photo d'origine : cache noir opaque sur
  l'optique, silencieux sombre et jamais doré.

**Ce qu'il faut vérifier sur la sortie**, dans cet ordre : la livrée est-elle la vraie
(rouge/blanc/noir, pas la HRC bleue de catalogue) · l'orientation est-elle le profil gauche,
avant à droite · reste-t-il des lettres inventées · le fond vert est-il assez plat pour se
détacher sans frange.

## 2. Ce qui reste ouvert, et n'a pas de solution connue

**Les faux textes de sponsors.** Trois formulations essayées, toutes contournées : interdiction
générale, interdiction de l'alphabet, remplacement prescrit par des barres pleines. `d2f` est le
seul état où ils ont disparu — sur trois photos seulement, donc ce n'est pas encore une preuve.

## 3. Ce qu'il ne faut PAS refaire, et pourquoi

- **Les références multiples** (`generer2.mjs`, `v4`). Mesuré : envoyer quatre photos de la même
  machine **dégrade** la fidélité — livrée dérivée vers le bleu de catalogue, pose ignorée, faux
  textes multipliés. Une seule image contraint le modèle ; plusieurs l'autorisent à synthétiser.
  Le fichier est conservé comme trace de la mesure, pas comme voie.
- **Les photos d'action où le pilote couvre le carénage** (IMG_9239, IMG_9243). Le modèle rend
  alors une autre moto. C'est une contrainte de source, pas de prompt.
- **Générer depuis un workflow ou un sous-agent.** C'est ce qui a vidé les crédits : un plancher
  d'itérations sans plafond, et une dépense invisible pendant qu'elle avait lieu.

## 4. Le jour où il y aura d'autres pilotes

Le sprite est le premier poste du produit à **coût marginal réel** (~0,16 €/image, chiffre
dérivé et à vérifier). Avant toute campagne : un **quota par compte, côté serveur**. Le
garde-fou local protège le banc, pas la production.
