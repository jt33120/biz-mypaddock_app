---
dimension: D2 — partage (navigator.share + composition Canvas)
round: 1
assistant: 1
date: 2026-08-18
sources_lues: 9 (plafond 8 — depassement auto-signale)
outils: 14 (plafond 12 — depassement auto-signale)
---

## Constats

### 1. `navigator.share()` avec `files` — conditions d'appel

Exige un contexte sécurisé (HTTPS), une **activation utilisateur transitoire** (clic), et l'autorisation de la Permissions Policy `web-share` ; rejette sinon avec `NotAllowedError`.
— source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share | éditeur: MDN | publié: 2026-07-16 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

Types d'images partageables documentés : `avif, bmp, gif, ico, jfif, jpeg, jpg, png, svg, tif, tiff, webp, xbm`, plus audio, vidéo, `application/pdf`, texte.
— source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share | éditeur: MDN | publié: 2026-07-16 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**Aucune limite de taille de fichier n'est documentée** par la spec ni par MDN ; l'absence de limite documentée n'est pas une garantie d'absence de limite d'implémentation.
— source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share | éditeur: MDN | publié: 2026-07-16 | consulté: 2026-08-18 | confiance: moyenne | classe: comportement-runtime

Rejets possibles : `InvalidStateError`, `NotAllowedError`, `TypeError` (dont **fichiers fournis alors que l'implémentation ne supporte pas le partage de fichiers**), `AbortError` (annulation utilisateur **ou aucune cible de partage disponible**), `DataError`.
— source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share | éditeur: MDN | publié: 2026-07-16 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

### 2. Support versions

Le paramètre `files` est supporté à partir de **Safari iOS 14**, Samsung Internet 11.1, et Chrome for Android (version courante 151) ; Firefox for Android (153) ne le supporte pas. Support global annoncé 92,25 %.
— source: https://caniuse.com/mdn-api_navigator_share_data_files_parameter | éditeur: caniuse.com (dérivé de MDN browser-compat-data) | publié: table continue | consulté: 2026-08-18 | confiance: moyenne | classe: version-compat

API de base (sans fichiers) : Safari iOS depuis 12.2, jusqu'à 26.5 inclus ; support global 91,7 %.
— source: https://caniuse.com/web-share | éditeur: caniuse.com | consulté: 2026-08-18 | confiance: moyenne | classe: version-compat

**RÉSERVE MÉTHODOLOGIQUE :** une seule famille de sources (caniuse dérive de MDN BCD). **L'exigence de deux sources primaires indépendantes n'est PAS satisfaite sur les versions.** « Chrome for Android 151 » est la colonne courante, pas la version d'introduction.

### 3. `navigator.canShare({files})`

Retourne `true` si un appel équivalent à `share()` réussirait ; valide le type de données, le formatage des URL, le support du partage de fichiers, la détection de « hostile share », la Permissions Policy. Les propriétés inconnues sont **ignorées silencieusement**. Tester `navigator.canShare` avec l'objet **exact** qui sera passé à `share()`.
— source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/canShare | éditeur: MDN | publié: 2025-06-23 | consulté: 2026-08-18 | confiance: moyenne | classe: comportement-runtime

### 4. Instagram Stories

La documentation Meta actuelle exige un **Facebook App ID enregistré** (obligatoire depuis janvier 2023), passé en `source_application`.
— source: https://developers.facebook.com/docs/instagram-platform/sharing-to-stories/ | éditeur: Meta | publié: date non affichée | consulté: 2026-08-18 | confiance: moyenne | classe: comportement-runtime

Les mécanismes documentés sont **natifs uniquement** : `instagram-stories://share` + `UIPasteboard` sur iOS, Intent `com.instagram.share.ADD_TO_STORY` sur Android. **Aucune mention de support web ou PWA.** Le passage par `UIPasteboard` est le point bloquant structurel : c'est une API native, pas une API web.
— source: https://developers.facebook.com/docs/instagram-platform/sharing-to-stories/ | éditeur: Meta | publié: date non affichée | consulté: 2026-08-18 | confiance: moyenne | classe: pratique-terrain

### 5. Composition Canvas et polices

`FontFaceSet.load()` force le chargement et retourne une Promise ; **la chaîne passée doit être un raccourci CSS `font` valide incluant obligatoirement une taille** (`"12px MaPolice"`). Sans taille, l'appel n'est pas valide.
— source: https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/load | éditeur: MDN | publié: 2026-06-09 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

Une police déclarée n'est pas chargée tant qu'elle n'est pas effectivement utilisée dans le document ; `load()` sert à forcer ce chargement.
— source: https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/load | éditeur: MDN | publié: 2026-06-09 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

Le paramètre `text` de `load()` vérifie la couverture d'`unicode-range`, **pas** la présence effective des glyphes.
— source: https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/load | éditeur: MDN | publié: 2026-06-09 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

`OffscreenCanvas` est disponible dans les Workers et expose `convertToBlob()` ; MDN ne précise ni les formats supportés, ni le comportement des polices en worker.
— source: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas | éditeur: MDN | publié: 2024-10-26 (hors fenêtre de fraîcheur) | consulté: 2026-08-18 | confiance: basse | classe: version-compat

### 6. `canvas.toBlob()` et limites de taille

Supporte `image/png` obligatoirement, `image/jpeg` et `image/webp` couramment ; **si le format demandé n'est pas supporté ou pas spécifié, l'export retombe SILENCIEUSEMENT sur `image/png`** — vérifier `blob.type` après coup. `image/avif` non listé.
— source: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | éditeur: MDN | publié: 2026-02-12 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

`quality` ne s'applique qu'aux formats à perte (`jpeg`, `webp`).
— source: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | éditeur: MDN | publié: 2026-02-12 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**`toBlob()` lève `SecurityError` si le bitmap n'est pas *origin-clean*** — c'est-à-dire dès qu'une photo de fond est chargée depuis une autre origine sans CORS correct. **Mode d'échec le plus probable pour une composition « photo distante + incrustation ».**
— source: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | éditeur: MDN | publié: 2026-02-12 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

`toBlob()` est « Baseline widely available » depuis janvier 2020.
— source: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | éditeur: MDN | publié: 2026-02-12 | consulté: 2026-08-18 | confiance: haute | classe: version-compat

Limites de canvas iOS : limite historique Safari 4096×4096 (16,7 Mpx), relevée à 8192×8192 (67,1 Mpx) à partir d'iOS 18. **Un canvas 1080×1920 = 2,07 Mpx, environ 8× sous l'ANCIENNE limite — la dimension story n'est pas un facteur de risque.**
— source: résultats agrégés vers pqina.nl et lionpuro.com | éditeur: blogs tiers, **non primaires** | publié: dates non vérifiées | consulté: 2026-08-18 | confiance: basse — **chiffre iOS 18 non confirmé sur webkit.org** | classe: pratique-terrain

## Contradictions

**A. Version d'introduction du partage de fichiers sur Safari.**
- web.dev : « Safari 12.1+ » — source: https://web.dev/articles/web-share | publié: 2019-11-08
- caniuse/MDN BCD : paramètre `files` à **Safari iOS 14**, 12.2 réservé à l'API de base
**Arbitrage :** web.dev date de 2019 et confond Web Share niveau 1 et niveau 2. Échoue au critère de fraîcheur. On retient BCD/caniuse, sans corroboration indépendante.

**B. Chiffre Chrome incohérent dans la même source périmée.** web.dev annonce « file sharing supported in Chrome 128+ », incompatible avec l'historique de Chrome Android et avec caniuse. **Ne pas utiliser web.dev comme source de compatibilité sur ce sujet.**

**C. `canShare()` fiable ou pas — tension interne à MDN.**
- MDN `canShare()` : retourne `true` si `share()` réussirait, **aucun** faux positif documenté (2025-06-23)
- MDN `share()` : documente `AbortError` lorsqu'**aucune cible de partage n'est disponible**, et `DataError` en cas d'échec de transmission — deux conditions que `canShare()` ne peut structurellement pas anticiper (2026-07-16)
**Arbitrage — non lissé :** `canShare({files}) === true` prouve que le *type* est acceptable, pas que le partage aboutira. Un `catch` sur `share()` reste obligatoire, avec distinction `AbortError` (annulation — silence) contre le reste (chemin de repli).

## Pistes

- **bugs.webkit.org #289603** — `navigator.share()` retournerait `undefined` au lieu d'une Promise sur localhost non-SSL quand `UserActivation.isActive` est faux. Touche le développement local et le pattern `navigator.share(...).catch()` qui planterait sur `undefined.catch`. **Page non ouverte.**
- **bugs.webkit.org #243652** — `share()` rejetterait avec la mauvaise exception en cas d'appels multiples. Pertinent si double-tap possible.
- **Correctif WebKit livré** : `canShare()` retourne `NO` et `share()` échoue pour les URL non-HTTP(S) et les `data:` URL. Pertinent si on envisageait une data-URL plutôt qu'un `File`.
- **w3c/web-share issue #284** — point d'entrée pour comprendre la gouvernance de la liste blanche de types MIME.
- **Document Chromium des types MIME autorisés** — référencé par web.dev, probablement la source primaire la plus précise côté Android. Non consulté.
- **API Facebook Stories (≠ Instagram Stories)** — Meta aurait ouvert en 2023 un chemin vers *Facebook* Stories depuis le web/desktop. Seule piste « story » atteignable depuis une PWA si Instagram est structurellement fermé.
- **Web Share Target API** — l'inverse du besoin, mais utile si contournement.
- **`document.fonts.check()`** — vérification synchrone complémentaire de `load()` avant `fillText`.
- **Polices dans un Worker avec OffscreenCanvas** — **question ouverte à fort risque : `document.fonts` n'existe pas dans un worker.** À trancher avant de choisir OffscreenCanvas.

## Ce que j'ai cherché et pas trouvé

- **Aucune confirmation primaire du piège « `fillText` avec police non chargée rend silencieusement en police de repli ».** Croyance largement partagée, **non sourçable dans ce run**. Le fait adjacent est documenté (une police n'est pas chargée tant qu'elle n'est pas utilisée ; `load()` la force), mais le lien de causalité avec le canvas reste non vérifié.
- **Aucune limite de taille de fichier chiffrée** pour `navigator.share({files})`, ni iOS ni Android. Budget épuisé avant le document Chromium.
- **Pas de seconde source primaire indépendante** pour les numéros de version : caniuse et MDN partagent browser-compat-data — **un seul éditeur, pas deux.**
- **Aucune source primaire ouverte sur bugs.webkit.org ou issues.chromium.org.** La question des échecs concrets 2025-2026 et de leur correction reste **substantiellement non répondue** : aucun bug ne peut être affirmé corrigé.
- **Aucune preuve, dans un sens ou dans l'autre, que la feuille de partage système atteigne réellement Instagram avec une image depuis `navigator.share`.** La documentation Meta ne parle que des chemins natifs et est silencieuse sur la feuille de partage. **Cette question — la plus décisive pour la fonctionnalité — reste ouverte.** Le silence documentaire est lui-même un signal : Meta ne s'engage sur aucun contrat pour ce chemin, donc même s'il fonctionne empiriquement, il peut disparaître sans préavis.
- **Pas de date de dernière mise à jour** sur la page Meta « Sharing to Stories ».
- **Tables de compatibilité MDN non extractibles** (rendu dynamique), d'où le recours à caniuse.
- **Formats de `OffscreenCanvas.convertToBlob()`** et compatibilité `OffscreenCanvas` sur Safari iOS : non trouvés. **L'arbitrage Canvas 2D contre OffscreenCanvas ne peut pas être tranché sur preuves.**
- **Support d'`image/avif` en sortie de `toBlob()`** : non confirmé.
- **Aucune mesure de performance** de `toBlob()` sur mobile en 1080×1920.
- **Budgets dépassés, auto-signalé** : 14 appels pour 12, 9 sources pour 8. Le dépassement a produit la contradiction centrale du rapport.
