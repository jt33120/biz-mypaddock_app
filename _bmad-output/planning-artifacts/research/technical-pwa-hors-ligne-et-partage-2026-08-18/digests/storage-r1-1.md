---
dimension: D1 — durabilité du stockage
round: 1
assistant: 1
date: 2026-08-18
sources_lues: 8
outils: 12
---

## Constats

**1. Le plafond de 7 jours de Safari sur le stockage script-writable existe toujours et couvre IndexedDB, localStorage, sessionStorage, Cache API, OPFS et les enregistrements de Service Worker.**
— source: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria | éditeur: MDN Web Docs (Mozilla) | publié: 2026-01-05 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime
— source: https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/ | éditeur: WebKit (Apple) | publié: 2020-03-24 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**2. Les 7 jours se comptent en « jours d'utilisation de Safari sans interaction utilisateur sur le site », pas en jours calendaires — le compteur n'avance que les jours où le navigateur est utilisé.**
— source: https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/ | éditeur: WebKit (Apple) | publié: 2020-03-24 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**3. Une web app ajoutée à l'écran d'accueil dispose de son propre compteur de jours d'usage, distinct de celui de Safari ; WebKit écrit explicitement que la donnée first-party d'une telle web app ne doit pas être supprimée, et qu'un signalement de suppression serait « un bug sérieux ».**
— source: https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/ | éditeur: WebKit (Apple) | publié: 2020-03-24 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime
— source: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria | éditeur: MDN Web Docs (Mozilla) | publié: 2026-01-05 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime — formulation MDN : « Web apps saved to Home Screen are exempt » de l'éviction proactive à 7 jours.

**4. L'éviction Safari est « tout ou rien » par origine : quand une origine est évincée, l'intégralité de ses données part d'un coup (IndexedDB, Cache API, OPFS…), pour éviter les états incohérents.**
— source: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria | éditeur: MDN Web Docs (Mozilla) | publié: 2026-01-05 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**5. Les cookies posés par le serveur et le cache HTTP échappent à ces politiques — ce ne sont pas du stockage script-writable.**
— source: https://webkit.org/blog/14403/updates-to-storage-policy/ | éditeur: WebKit (Apple) | publié: 2023-08-10 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime
— source: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria | éditeur: MDN Web Docs (Mozilla) | publié: 2026-01-05 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**6. Chrome (et les navigateurs Chromium) n'ont aucune règle d'éviction temporelle : l'éviction ne se déclenche que sous pression disque / dépassement du plafond global, et elle purge l'origine la moins récemment utilisée en premier (LRU).**
— source: https://web.dev/articles/storage-for-the-web | éditeur: Chrome / Google (web.dev) | publié: 2024-09-23 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime
— source: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria | éditeur: MDN Web Docs (Mozilla) | publié: 2026-01-05 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**7. En mode persistant, la donnée n'est évincée que sur choix explicite de l'utilisateur (réglages navigateur) et échappe à l'éviction LRU sous pression disque.**
— source: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria | éditeur: MDN Web Docs (Mozilla) | publié: 2026-01-05 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**8. `navigator.storage.persist()` est accordé sans prompt sur Safari/WebKit comme sur Chrome/Chromium, sur la base d'heuristiques d'historique d'interaction ; Firefox seul affiche une demande de permission.**
— source: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria | éditeur: MDN Web Docs (Mozilla) | publié: 2026-01-05 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**9. WebKit nomme explicitement l'installation sur l'écran d'accueil parmi les heuristiques d'octroi de la persistance : « WebKit currently grants a request based on heuristics like whether the website is opened as a Home Screen Web App ».**
— source: https://webkit.org/blog/14403/updates-to-storage-policy/ | éditeur: WebKit (Apple) | publié: 2023-08-10 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**10. Le Storage API (dont `persist()` / `persisted()`) est pleinement supporté depuis Safari 17 / iOS 17 / iPadOS 17.**
— source: https://webkit.org/blog/14403/updates-to-storage-policy/ | éditeur: WebKit (Apple) | publié: 2023-08-10 | consulté: 2026-08-18 | confiance: moyenne | classe: version-compat — une seule source primaire retrouvée pour la borne de version exacte.

**11. Quotas Safari depuis macOS 14 / iOS 17 : ~60 % du disque total par origine pour une app navigateur, plafond global 80 % du disque ; une web app sur l'écran d'accueil bénéficie du même niveau qu'une app navigateur ; les apps embarquant WebKit (WKWebView tierce) sont limitées à ~15 % par origine et 20 % global ; les iframes cross-origin à 1/10 du quota du frame parent.**
— source: https://webkit.org/blog/14403/updates-to-storage-policy/ | éditeur: WebKit (Apple) | publié: 2023-08-10 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime
— source: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria | éditeur: MDN Web Docs (Mozilla) | publié: 2026-01-05 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**12. Le vieux quota Safari de 1 Gio avec prompt de permission au-delà appartient aux versions antérieures à iOS 17 / macOS 14 — il n'y a plus de prompt aujourd'hui.**
— source: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria | éditeur: MDN Web Docs (Mozilla) | publié: 2026-01-05 | consulté: 2026-08-18 | confiance: haute | classe: version-compat

**13. Quotas Chrome : jusqu'à 60 % du disque total par origine, en mode best-effort comme en mode persistant, et jusqu'à 80 % du disque pour le navigateur entier ; ~5 % en navigation privée et ~300 Mo si « effacer les données à la fermeture » est activé.**
— source: https://web.dev/articles/storage-for-the-web | éditeur: Chrome / Google (web.dev) | publié: 2024-09-23 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime
— source: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria | éditeur: MDN Web Docs (Mozilla) | publié: 2026-01-05 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**14. `navigator.storage.estimate()` renvoie des valeurs volontairement approximatives : le quota est calculé sur la taille totale du disque (pas l'espace libre) pour éviter le fingerprinting, et les ressources cross-origin sont gonflées artificiellement dans `usage`.**
— source: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria | éditeur: MDN Web Docs (Mozilla) | publié: 2026-01-05 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime
— source: https://web.dev/articles/storage-for-the-web | éditeur: Chrome / Google (web.dev) | publié: 2024-09-23 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**15. `localStorage` reste plafonné en dur à 5 Mio par origine (10 Mio en incluant sessionStorage), tous navigateurs — donc inutilisable comme conteneur principal de données métier.**
— source: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria | éditeur: MDN Web Docs (Mozilla) | publié: 2026-01-05 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**16. Épisode DMA : Apple a annoncé la suppression des web apps sur l'écran d'accueil dans l'UE, puis a fait machine arrière et les a maintenues à partir d'iOS/iPadOS 17.4 (mars 2024), en les gardant bâties sur WebKit exclusivement.**
— source: https://developer.apple.com/support/dma-and-apps-in-the-eu/ | éditeur: Apple Developer | publié: annonce datée de 2024-03, page sans date de dernière mise à jour | consulté: 2026-08-18 | confiance: haute | classe: pratique-terrain — citation : « We have received requests to continue to offer support for Home Screen web apps in iOS and iPadOS, therefore we will continue to offer the existing Home Screen web apps capability in the EU. »

**17. Le Web Push sur iOS n'existe que pour les web apps ajoutées à l'écran d'accueil (depuis iOS/iPadOS 16.4), jamais dans un onglet Safari ; Declarative Web Push est arrivé en Safari 18.4.**
— source: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ | éditeur: WebKit (Apple) | publié: 2023-02 | consulté: 2026-08-18 | confiance: moyenne | classe: version-compat — lu via extrait de moteur de recherche, page non récupérée intégralement.

**18. Safari 26.0 introduit « every site can be a web app on iOS and iPadOS » (mode web app par défaut, sans exigence de manifest) ; la série Safari 26 est allée au moins jusqu'à 26.6.**
— source: https://webkit.org/blog/17333/webkit-features-in-safari-26-0/ | éditeur: WebKit (Apple) | publié: 2025-09 | consulté: 2026-08-18 | confiance: moyenne | classe: version-compat — lu via extrait, page non récupérée intégralement.
— source: https://webkit.org/blog/18178/webkit-features-for-safari-26-6/ | éditeur: WebKit (Apple) | publié: 2026 | consulté: 2026-08-18 | confiance: basse | classe: version-compat — seul le titre observé.

## Contradictions

**A. « Compteur propre » (WebKit) contre « exemption » (MDN) pour les web apps de l'écran d'accueil.**
- WebKit (2020-03-24) : les web apps installées « ont leur propre compteur de jours d'usage », séparé de celui de Safari. C'est un compteur distinct, pas une exemption.
- MDN (2026-01-05) : « Web apps saved to Home Screen are exempt » — formulation d'exemption pure.
Même résultat pratique en usage saisonnier (l'app n'étant pas ouverte, son compteur n'avance pas), mais ce ne sont pas la même affirmation. La formulation de 2020 laisse ouvert le cas où le compteur avancerait pour une raison indirecte — activation en arrière-plan par un push, par exemple.

**B. Le billet WebKit de 2023 ne redit rien du plafond de 7 jours.**
« Updates to Storage Policy » (2023-08-10) réécrit la politique de quota et de mode persistant sans jamais mentionner la règle des 7 jours ni son exemption. Le seul énoncé primaire Apple reste celui de mars 2020 ; MDN de janvier 2026 la donne toujours en vigueur. Six ans entre l'énoncé primaire et la confirmation tierce la plus récente, sans réaffirmation primaire intermédiaire.

**C. Restriction WebKit dans l'UE : conformité contestée.**
- Apple : les web apps restent supportées dans l'UE, « built directly on WebKit », présenté comme une décision de sécurité.
- Presse spécialisée (gamesfray.com, theregister.com, 2024-02/03) : cette limitation au seul moteur WebKit est décrite comme contraire à l'esprit du DMA. Sources secondaires de 2024 ; aucune décision réglementaire postérieure récupérée.

**D. Heuristiques d'octroi de `persist()` sur Chrome.**
MDN (2026-01) dit « automatique selon l'historique d'interaction, sans prompt ». La source primaire Chrome lue (web.dev, 2024-09) ne documente **aucune** heuristique — ni favori, ni installation PWA, ni permission notification, ni score d'engagement. La liste largement recopiée sur le web ne repose, dans ce run, sur aucune source primaire vérifiée.

## Pistes

- **Storage Buckets API** : marquer un sous-ensemble de données comme persistant indépendamment du reste. Vérifier le support réel Safari 26 / Chrome Android.
- **`navigator.storage.persisted()` comme sonde au démarrage** : à vérifier sur un vrai appareil iOS 26, dans une web app installée contre un onglet Safari. Seul test décisif pour le cas d'usage.
- **Récupérer intégralement** les billets WebKit Safari 26.0 à 26.6 pour chercher toute mention de storage policy, éviction, ou changement du mode web app par défaut.
- **Badging API (`navigator.setAppBadge`)** sur iOS : non vérifié, à traiter comme inconnu.
- **Effet du push en arrière-plan sur le compteur de jours d'usage** (piste ouverte par la contradiction A).
- **Sauvegarde iCloud / restauration d'appareil** : le stockage WebKit d'une web app installée survit-il à une restauration ? Aucune source touchée.
- **caniuse.com** non consulté ; utile pour croiser le support de `StorageManager` par version.

## Ce que j'ai cherché et pas trouvé

- **Question 5 (désinstallation) : aucune preuve, ni iOS ni Android.** Aucune source ne décrit ce qu'il advient d'IndexedDB / Cache Storage quand une web app est retirée de l'écran d'accueil iOS, ni quand une PWA est désinstallée sur Android. La croyance courante n'est **pas vérifiée** et ne doit pas être traitée comme un fait. **Trou le plus grave du digest au regard de la décision.**
- **Aucune source spécifique à Chrome sur Android.** MDN et web.dev décrivent « Chrome / Chromium » sans distinguer la plateforme. Les constats 6 et 13 sont établis pour Chromium en général, seulement inférés pour Android. Rien sur l'éviction liée à la pression mémoire Android, au « hibernate unused apps » d'Android 11+, ni au Data Saver.
- **Aucune confirmation primaire Apple postérieure à 2020** du plafond de 7 jours ni de son exemption. L'exigence de deux sources primaires indépendantes n'est **pas** satisfaite pour le constat central : une primaire de 2020 et une tierce de 2026, pas deux primaires.
- **Aucune source ne dit explicitement que le mode persistant exempte du plafond de 7 jours sur Safari.** MDN range la règle sous « best-effort mode », ce qui l'implique par construction, mais c'est une inférence, pas une phrase citable.
- **Aucun chiffre de quota mesuré sur appareil réel.** Tous les quotas cités sont des pourcentages documentaires.
- **Aucun développement DMA postérieur à 2024.** Absence de preuve, pas preuve d'absence — les requêtes ciblaient l'épisode de 2024.
