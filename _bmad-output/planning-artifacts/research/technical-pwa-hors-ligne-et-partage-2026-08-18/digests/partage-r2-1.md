---
dimension: D2 — partage
round: 2
assistant: 1
date: 2026-08-18
outils: 14
---

## Constats

**Bug WebKit 289603 (`navigator.share()` renverrait `undefined` au lieu d'une Promise sans activation utilisateur sur localhost non-SSL) est OUVERT et non corrigé, mais le rapporteur lui-même doute qu'il s'agisse d'un bug WebKit.** `Status NEW, Resolution (none)` ; rapporté 2025-03-12, dernier commentaire 2025-03-19 où le rapporteur indique avoir trouvé la cause racine et suggère la fermeture.
— source: https://bugs.webkit.org/show_bug.cgi?id=289603 | éditeur: WebKit (Apple) | publié: 2025-03-12 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**Bug WebKit 243652 (mauvaise exception sur appels multiples) est CORRIGÉ depuis 2022.** `RESOLVED / FIXED`, commit `253419@main` le 2022-08-15 ; renvoyait `NotAllowedError` au lieu d'`InvalidStateError`.
— source: https://bugs.webkit.org/show_bug.cgi?id=243652 | éditeur: WebKit (Apple) | publié: 2022-08-07, corrigé 2022-08-15 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**Seconde source primaire hors browser-compat-data : le blog WebKit situe le partage de fichiers (Web Share Level 2) à Safari 15.** « Web Share level 2 enhancements to Web Share enable sharing files from a web page to an app. »
— source: https://webkit.org/blog/11989/new-webkit-features-in-safari-15/ | éditeur: WebKit (Apple), Jen Simmons | publié: 2021-10-26 | consulté: 2026-08-18 | confiance: haute | classe: version-compat

**`FontFaceSet` EST exposé aux workers : la spec CSS Font Loading inclut `FontFaceSource` dans `WorkerGlobalScope`, donc `self.fonts` existe.** IDL : `interface mixin FontFaceSource { readonly attribute FontFaceSet fonts; }; Document includes FontFaceSource; WorkerGlobalScope includes FontFaceSource;`
— source: https://drafts.csswg.org/css-font-loading/ | éditeur: W3C CSS WG (Editor's Draft) | publié: draft vivant | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**La spec établit explicitement le lien police-en-worker → `OffscreenCanvas` : dans un worker la source de polices est initialement VIDE, et les `FontFace` construits puis ajoutés affectent le font-matching du worker, « such as, for example, drawing text into an `OffscreenCanvas` ».** Recette : `new FontFace(...)` + `self.fonts.add(...)` + `.load()`.
— source: https://drafts.csswg.org/css-font-loading/ | éditeur: W3C CSS WG | publié: draft vivant | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**Meta ne documente le partage vers FACEBOOK Stories QUE pour les applications natives — le web et les PWA ne sont pas mentionnés du tout.** « By using Android Implicit Intents and iOS Custom URL Schemes, your app can pass photos, videos, and stickers to the Facebook app. » Aucune mention de navigateur, web, PWA, ni schéma utilisable depuis une page.
— source: https://developers.facebook.com/docs/sharing/sharing-to-stories/ | éditeur: Meta | publié: non daté | consulté: 2026-08-18 | confiance: haute | classe: pratique-terrain

**La section « text styles » de la spec HTML canvas ne dit RIEN d'explicite sur `fillText` avec une police déclarée mais pas chargée.** Elle définit l'algorithme de « font source » et renvoie à `[CSSFONTLOAD]`, sans décrire de repli, d'attente ou de rendu différé. **Le lien de causalité police-non-chargée → texte-en-repli n'est PAS normativement établi dans cette section** ; il découle du chaînage font source → CSS Font Loading.
— source: https://html.spec.whatwg.org/multipage/canvas.html#text-styles | éditeur: WHATWG | publié: standard vivant | consulté: 2026-08-18 | confiance: moyenne (négatif prouvé sur la section lue) | classe: comportement-runtime

**Le contenu de la feuille de partage iOS a DÉJÀ RÉGRESSÉ entre versions — preuve que les cibles offertes ne sont pas un contrat stable.** Sur iOS 16.4.1, « Save to photos » disparaissait de la feuille pour une image `image/jpeg`, ne laissant que « Save to files » ; la même API fonctionnait sur iOS 15.7 et fonctionnait pour les vidéos sur iOS 16. Correctif WebKit PR #13111, bug #231995 ; aucune réponse Apple dans le fil.
— source: https://developer.apple.com/forums/thread/729782 | éditeur: Apple Developer Forums | publié: 2023-05 | consulté: 2026-08-18 | confiance: moyenne | classe: pratique-terrain

**Témoignages : le partage d'image via `navigator.share` vers Instagram/Facebook fonctionnait sur Android mais ÉCHOUAIT sur Safari iOS.** « It works totally fine on Android, but it doesn't work on Safari, iOS. On iOS, it looks like I was sharing text instead of an image. » (2020-11) ; « It works on android but ios safari doesn't. » (2021-04) ; contournement rapporté en 2022-08 : passer un `title` vide (`{ title: '', files: [file] }`). Aucune réponse Apple.
— source: https://developer.apple.com/forums/thread/665812 | éditeur: Apple Developer Forums | publié: 2020-11 à 2022-08 | consulté: 2026-08-18 | confiance: moyenne (antérieurs à 2025, non revérifiés) | classe: pratique-terrain

**CROYANCE NON VÉRIFIÉE sur `OffscreenCanvas` dans Safari iOS.** Des agrégateurs dérivés situent le support à Safari 16.4+ / iOS 16.4, une variante dit 17+. **Aucune source primaire récupérée. À traiter comme non établi.**
— source: aucune source primaire | confiance: basse | classe: version-compat

## Contradictions

**A. Le partage web vers Instagram : « ça apparaît dans la feuille » contre « ça n'arrive pas ».**
- Côté positif — sudolabs (Oliver Dendis, 2023-09-19) montre une capture : « the share interface offers multiple ways to share the image, including messaging apps and social media platforms like Instagram, Twitter, and Facebook. » Mais **aucun test confirmant que l'image arrive dans Stories**, aucune distinction iOS/Android.
- Côté négatif — les développeurs du fil Apple 665812 rapportent l'inverse sur iOS : Android OK, Safari iOS non, « it looks like I was sharing text instead of an image ».
**Irréconciliables :** l'un observe la *présence de l'icône* dans la feuille, l'autre l'*échec du transfert du fichier*. **Voir une icône Instagram dans la feuille ne prouve pas que l'image atteint Stories.**

**B. Stabilité des cibles de partage.** La documentation implique une feuille native homogène ; le terrain montre une régression iOS 16 supprimant une cible présente en 15.7 et rétablie par correctif. **Le jeu de cibles offert est une propriété de la version d'OS, pas une garantie d'API.**

**C. Version d'introduction du partage de fichiers (non signalée par l'assistant, relevée à la synthèse).** caniuse/BCD dit Safari iOS 14 ; le blog WebKit dit Safari 15. Écart non tranché — **sans effet sur la décision**, les deux bornes ayant plus de cinq ans.

## Pistes

- **Bug WebKit #231995 et PR #13111** : la trace la plus directe sur la façon dont WebKit décide des cibles offertes selon le type MIME. Non ouverts.
- **La question décisive se déplace côté Instagram, pas côté navigateur** : ce qui détermine si Instagram apparaît, c'est l'`Info.plist` / les intent-filters de l'application Instagram installée. Chercher la déclaration de types documents d'Instagram iOS.
- **`navigator.canShare({files})` renvoie `true` dès que le type est partageable en général** — il ne dit rien sur les applications installées ni sur ce qu'elles feront du fichier. **Aucune API web ne permet d'énumérer les cibles : limite structurelle, pas défaut d'implémentation.**
- **Pour Facebook Stories comme pour Instagram Stories, le seul chemin documenté par Meta reste natif.** Le repli web réaliste n'est donc pas « partager vers Stories » mais **« enregistrer l'image, l'utilisateur la poste lui-même »** — chemin sans dépendance à la feuille de partage.
- **Polices en worker** : `new FontFace(name, url).load()` puis `self.fonts.add()` avant tout `fillText` sur l'`OffscreenCanvas`. Contrairement au thread principal, **rien n'est hérité du document** : la source de polices du worker démarre vide.

## Ce que j'ai cherché et pas trouvé

**Question 1 — la plus décisive — reste SANS PREUVE.** Aucun des deux témoignages empiriques indépendants exigés confirmant que `navigator.share({files:[image]})` depuis une PWA fait apparaître Instagram dans la feuille **et** que l'image arrive effectivement dans Stories. Ce qui a été trouvé :
- un article de blog (2023) affirmant qu'Instagram figure parmi les cibles, sans preuve de test et sans rien dire sur Stories ;
- des témoignages développeurs (2020-2022) affirmant l'**échec** sur Safari iOS et le succès sur Android ;
- **zéro témoignage 2025-2026**, zéro issue GitHub, zéro retour de produit en production.

**Formulation honnête : le maximum sourçable est que le partage de fichier fonctionne, que les cibles offertes dépendent de l'OS et des applications installées, et que le comportement d'Instagram à réception n'est documenté nulle part côté web.**

Autres lacunes :
- **Aucune source primaire sur `OffscreenCanvas` dans Safari iOS.**
- **La spec HTML canvas ne fournit pas la phrase de causalité recherchée** ; seule la section `#text-styles` a été lue, pas `#drawing-text-to-the-bitmap`.
- **Aucune trace d'un chemin web/PWA vers Facebook Stories** — absence constatée sur la page « Sharing to Stories », pas preuve d'absence sur tout le site Meta.
