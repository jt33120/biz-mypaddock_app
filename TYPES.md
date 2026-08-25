# ⚠ `npx tsc --noEmit` NE VÉRIFIE RIEN DANS CE DÉPÔT

Utilise **`npm run types`** (c'est-à-dire `tsc -b`).

## Pourquoi

`tsconfig.json` à la racine est un fichier de *références de projet* : il porte
`"files": []` et deux `references` vers `tsconfig.app.json` et
`tsconfig.node.json`. Sans le drapeau `-b`, TypeScript prend la racine au mot —
zéro fichier à compiler — et **sort en 0 quoi qu'il arrive**.

Vérifié le 25 août 2026, avec un fichier contenant `const x: number = "boum"` :

```
npx tsc --noEmit  →  aucune sortie, code 0
npx tsc -b        →  error TS2322: Type 'string' is not assignable to type 'number'
```

## Ce que ça a coûté

Rien de livré, et par chance seulement : `npm run build` fait `tsc -b && vite
build`, et le banc reconstruit avant chaque passage. C'est le build qui a tenu la
garde tout du long. Mais toute vérification annoncée sur la foi de
`npx tsc --noEmit` — et il y en a eu — ne valait **rien** au moment où elle a été
annoncée.

C'est le même genre de défaut que le banc qui pouvait imprimer « NON » et sortir
en 0 : une garde qu'on croit tenue et qui ne tient pas est pire qu'une garde
absente, parce qu'on cesse de regarder.
