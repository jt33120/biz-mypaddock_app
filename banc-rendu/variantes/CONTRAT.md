# Contrat d'une variante de détourage

Un fichier, aucune dépendance, aucun réglage par photo.

```js
export const nom = 'mon-approche'
export const description = 'une phrase : le principe, pas le code'

// px : Uint8ClampedArray RGBA de l'image DÉJÀ RECADRÉE sur la machine (longueur w*h*4)
// retourne : Uint8Array de longueur w*h — 1 = machine, 0 = fond
export function masque(px, w, h) { … }
```

## Ce qui est déjà fait pour toi

Le recadrage sur la machine est **déjà appliqué** quand `masque` est appelé : une boîte
englobante rendue par un modèle de vision, mise en cache. Tu reçois donc une image où la moto
occupe l'essentiel du cadre, avec du décor dans les marges et les coins.

En aval, ta décision est ramenée à la grille pixel par **vote majoritaire par bloc**, la teinte
dominante est mesurée **sur les seuls blocs de machine**, et le fond devient **transparent**.

## Règles dures

- **Déterministe.** Même entrée, même sortie. Pas de `Math.random`, pas de `Date`.
- **Aucun réglage par photo.** Les constantes sont globales et figées. Si une photo demande un
  ajustement à la main, la variante est en échec — pas la photo.
- **Aucune dépendance, aucun réseau, aucun modèle téléchargé.** Du JS pur.
- **Budget : viser sous 150 ms** sur une image d'environ 1024 px d'arête.
- **Aucune interaction.** Le pilote ne peint rien : c'est le sens de cette étape.

## Comment juger ton propre travail

```
node banc-rendu/essai.mjs variantes/<ton-fichier>.js
```

Puis **ouvre l'image** `banc-rendu/sorties/<ton-fichier>.png` et regarde-la. Elle montre, par
photo : le recadré, ton masque en noir et blanc, et le rendu détouré posé sur un damier.

Les six photos du jeu ne sont pas choisies pour t'arranger : trois portraits verticaux où la
moto est loin, avec fleurs, gravier, maison, arbres et remorque ; trois photos de piste où un
pilote est **sur** la machine, avec bas-côté, vibreurs et bitume.

Critères, dans cet ordre :

1. **La silhouette est-elle juste ?** Roues rondes, carénage entier, pas de trou dans le
   réservoir, pas de morceau de bitume collé sous les pneus.
2. **Le décor est-il parti ?** Le gravier, les fleurs, les arbres, la remorque, le vibreur.
3. **Le pilote.** Sur les photos de piste il est sur la moto : le garder est acceptable, le
   couper en deux ne l'est pas. Dis ce que ta variante fait et pourquoi.
4. **Robustesse.** Les six passent-elles avec les mêmes constantes ? C'est le critère qui
   élimine.

**Rends un verdict honnête, photo par photo.** Une variante qui marche sur trois et rate trois
est plus utile décrite comme telle qu'annoncée comme réussie.
