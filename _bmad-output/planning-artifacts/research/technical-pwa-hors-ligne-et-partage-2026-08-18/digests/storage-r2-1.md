---
dimension: D1 — durabilité du stockage
round: 2
assistant: 1
date: 2026-08-18
sources_ouvertes: 5 sur 10 prevues
outils: 14 (plafond atteint — a mordu avant le plafond de sources)
---

## Constats

**Q3 — Il existe une source primaire Apple postérieure à 2020 sur la politique de stockage, et elle ne mentionne AUCUN délai de 7 jours.** Le billet WebKit « Updates to Storage Policy » décrit l'éviction comme pouvant survenir « when exceeding the overall quota, when the system is under storage pressure, or when the site has not been interacted with by the user for some time » — formule vague, aucun nombre de jours.
— source: https://webkit.org/blog/14403/updates-to-storage-policy/ | éditeur: WebKit (Apple), auteur Sihui Liu | publié: 2023-08-10 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**Q3 — LE CONSTAT PORTANT : le mode persistant accordé exempte explicitement de l'éviction.** « Origin might be excluded from eviction if it has active page at the time of eviction, **or its storage is in persistent mode**. » Confirmation primaire que `navigator.storage.persist()` accordé sort l'origine du mécanisme d'éviction. Le billet ne dit toutefois pas nommément « y compris du plafond de 7 jours », puisqu'il ne nomme jamais ce plafond.
— source: https://webkit.org/blog/14403/updates-to-storage-policy/ | éditeur: WebKit (Apple) | publié: 2023-08-10 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**Q3 — WebKit place les web apps installées sur le même plan que le navigateur pour les QUOTAS, sans rien dire d'un traitement d'éviction distinct.** « When a web app is running standalone (as Home Screen Web App on iOS or Web App added to dock on macOS), it has the same origin quota and overall quota as when it is opened in a browser app. » L'affirmation du tour 1 (« compteur propre ») n'est ni réaffirmée ni contredite par cette source de 2023.
— source: https://webkit.org/blog/14403/updates-to-storage-policy/ | éditeur: WebKit (Apple) | publié: 2023-08-10 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**Q3 — L'éviction WebKit est LRU par origine.** WebKit « normally evicts data on an origin basis » selon une politique least-recently-used — modèle plus proche de Chromium que d'un couperet temporel fixe.
— source: https://webkit.org/blog/14403/updates-to-storage-policy/ | éditeur: WebKit (Apple) | publié: 2023-08-10 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**Q1 — MDN documente le geste de désinstallation d'une PWA sur iOS et desktop mais ne dit RIEN du sort des données.** « Long tapping an icon surfaces the delete bookmark UI; removing the icon from the home screen deletes the PWA ». Aucune phrase sur IndexedDB, Cache Storage ou localStorage, aucune mention de choix offert.
— source: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing | éditeur: MDN | publié: 2026-05-15 | consulté: 2026-08-18 | confiance: haute (sur l'absence de doc, pas sur le comportement) | classe: version-compat

**Q1 — Sur Chrome DESKTOP, la désinstallation propose une case séparée « Also delete data from Chrome » ; par défaut elle n'efface donc pas.** **Réserve : page non ouverte, extrait de moteur de recherche uniquement, sans date.**
— source: https://support.google.com/chrome/answer/9658361 | éditeur: Google Chrome Help | publié: date non affichée | consulté: 2026-08-18 (extrait, page non lue) | confiance: moyenne | classe: comportement-runtime

**Q5 — Storage Buckets n'existe que sur Chromium ; ni Safari ni Safari iOS ne l'implémentent.** Chrome 122+, Edge 122+, Opera 108+, Samsung Internet 26+, Chrome for Android 151 ; Safari **non supporté** sur toutes versions jusqu'à 26.5 et sur Technology Preview ; Safari iOS non supporté ; Firefox non supporté jusqu'à 156. Usage global 70,96 %.
— source: https://caniuse.com/wf-storage-buckets | éditeur: caniuse.com | publié: données d'usage 2026-07 | consulté: 2026-08-18 | confiance: haute | classe: version-compat

**Q5 — Conséquence : l'API ne peut pas servir de levier de persistance sélective sur iOS.** Marquer un sous-ensemble de données comme persistant indépendamment du reste est impossible sur Safari iOS. (Déduction stricte du tableau ; la sémantique exacte de `durability`/`persisted` par bucket reste non vérifiée.)
— source: https://caniuse.com/wf-storage-buckets | éditeur: caniuse.com | publié: 2026-07 | consulté: 2026-08-18 | confiance: moyenne | classe: version-compat

**Q6 — Premier témoignage : fil Apple Developer Forums 2022-2023, sans réponse d'ingénieur Apple.** Développeurs entre eux. Un contributeur affirme en février 2023 « Yes, Home Screen apps don't have this limitation ». Un participant rapporte que `persist()` « does protect data from being deleted. However […] **it has to be requested every time your app is opened.** »
— source: https://developer.apple.com/forums/thread/710157 | éditeur: Apple Developer Forums (contenu utilisateur) | publié: 2022-07 à 2023-02 | consulté: 2026-08-18 | confiance: basse | classe: pratique-terrain

**Q6 — Deuxième témoignage : perte d'entrées IndexedDB ALÉATOIRES sur iOS 17.4.x (avril 2024, confirmé octobre 2024).** « random data entries are missing / deleted […] sometimes one, sometimes also multiples », erreur « UnknownError: Connection to Indexed Database server lost ». Renvoie à bugs.webkit.org/show_bug.cgi?id=197050. **ATTENTION : app Cordova (WKWebView), PAS une web app de l'écran d'accueil — non transposable tel quel.**
— source: https://developer.apple.com/forums/thread/750122 | éditeur: Apple Developer Forums (contenu utilisateur) | publié: 2024-04, relance 2024-10 | consulté: 2026-08-18 | confiance: basse | classe: pratique-terrain

**Q4 — L'hibernation Android vise les apps natives ciblant l'API 30+ après « a few months » sans interaction ; effet de stockage limité au cache et aux artefacts de compilation.** **Réserve : extrait de recherche, page non ouverte. Aucune source n'établit si un WebAPK Chrome entre dans le périmètre de l'hibernation, ni ce qu'il adviendrait du profil de stockage web, qui vit dans Chrome et non dans le WebAPK.**
— source: https://developer.android.com/topic/performance/app-hibernation | éditeur: Android Developers | publié: date non relevée | consulté: 2026-08-18 (extrait, page non lue) | confiance: basse | classe: comportement-runtime

## Contradictions

**A. Le plafond de 7 jours : nommé au tour 1, ABSENT de la source primaire WebKit la plus récente lue.**
- Côté A — le tour 1 et le folklore développeur tiennent la règle pour acquise ; le fil Apple Forums de 2022 la rattache à l'**ITP** (tracking prevention), pas à la politique de stockage.
- Côté B — le billet WebKit du 2023-08-10, *le* billet dédié à la politique de stockage et postérieur de trois ans à celui de 2020, ne dit ni « 7 days » ni aucun nombre : « has not been interacted with by the user for some time », et décrit une éviction LRU.
**Non lissé :** soit la règle vit dans la doc ITP et non dans la doc stockage, soit elle a été reformulée en critère flou. Non tranché.

**B. Exemption des web apps installées : affirmée par des développeurs, jamais par Apple dans ce qui a été lu.**
- Côté A — « Home Screen apps don't have this limitation » (développeur tiers, 2023-02) ; MDN (2026-01) parle d'exemption.
- Côté B — le billet WebKit 2023 met les web apps standalone sur le **même** plan que le navigateur pour les quotas, et ne leur accorde **aucune** exemption d'éviction.
L'absence n'est pas une négation, mais elle empêche de traiter l'exemption comme documentée par le primaire.

**C. Le quota iOS.** Un billet tiers (magicbell.com, « PWA iOS Limitations [2026] ») affirme « Safari caps storage at 50MB ». **Frontalement contredit par la source primaire** : le quota d'origine est calculé sur l'espace disque total et les anciens 1 Go ont été abandonnés (WebKit, 2023-08-10). Signalé comme agrégateur non fiable.

**D. Version Chrome Android pour Storage Buckets.** Un billet tiers annonce « 145+ » ; caniuse, lu, indique 151. On retient 151.

## Pistes

- **La page WebKit « Tracking Prevention Policy »** (webkit.org/tracking-prevention/) — c'est là que le fil Apple situe la règle des 7 jours et l'exemption des Home Screen apps. **Cible primaire n°1** pour clore Q3.
- **Les billets « WebKit Features in Safari 26.x »** (26.0 à 26.6), non ouverts faute de budget.
- **bugs.webkit.org/show_bug.cgi?id=197050**, cité comme cause racine des pertes IndexedDB aléatoires. Son état dirait beaucoup sur la fiabilité réelle d'IndexedDB sur WebKit en 2026.
- **issues.chromium.org** sur la suppression de données à la désinstallation d'un WebAPK Android : requête à retenter avec des termes internes (« WebAPK », « ClearDataOnUninstall »).
- **La liste Apple officielle du contenu d'une sauvegarde iCloud** (support.apple.com) — seule façon propre de trancher Q2.
- **Chrome Android à la désinstallation** : la case « Also delete data from Chrome » est documentée pour le desktop ; savoir si l'équivalent existe sur Android, où la désinstallation passe par le gestionnaire d'applications du système, reste ouvert — **et c'est le cas qui compte**.

## Ce que j'ai cherché et pas trouvé

**Q1 — iOS : RIEN.** Aucune source, primaire ou secondaire, ne dit ce qu'il advient d'IndexedDB et du Cache Storage quand une web app est retirée de l'écran d'accueil sur iOS. Le billet WebKit ne traite pas la désinstallation ; MDN décrit le geste sans un mot sur les données ; les recherches ne renvoient que des fils d'assistance grand public. **Le trou n'est pas comblé avec la croyance courante** — l'existence d'un stockage partitionné par web app depuis iOS 17.4 rendrait l'intuition dangereuse. **C'est un inconnu, pas un connu.**

**Q1 — Android : partiel, et seulement desktop.** Pour Android, où la désinstallation d'un WebAPK passe par le système et non par Chrome, aucune source. Aucun ticket Chromium trouvé malgré recherche restreinte.

**Q2 — non résolue dans les deux sens.** Sur iOS, seuls des sites d'éditeurs de logiciels de récupération de données sont remontés — fermes SEO, inutilisables. L'un affirme que les « website data » ne reviennent pas d'une restauration iCloud ; **affirmation non reprise, sans valeur probante, non confirmée par Apple.** Sur Android, rien cherché faute de budget.

**Q4 — insuffisant.** Le principe de l'hibernation est là, mais **rien ne relie l'hibernation Android à une PWA installée**. Le maillon manquant est décisif : le stockage web d'un WebAPK réside dans le profil de Chrome, or Chrome est utilisé quotidiennement et n'hiberne donc jamais. Hypothèse plausible mais **non vérifiée**.

**Q6 — le seuil de deux témoignages indépendants n'est PAS atteint.** Aucun témoignage 2025-2026 de perte de données dans une PWA **installée** sur iOS après plusieurs semaines. Les deux fils lus datent de 2022-2023 et 2024, et le plus circonstancié concerne une WKWebView Cordova. Symétriquement, pas non plus deux témoignages attestant que ça tient. **Rien ne peut être affirmé dans un sens ni dans l'autre.**

**Budget :** 14 appels (plafond atteint), 5 sources réellement ouvertes sur 10 prévues — le plafond d'appels a mordu avant celui des sources.
