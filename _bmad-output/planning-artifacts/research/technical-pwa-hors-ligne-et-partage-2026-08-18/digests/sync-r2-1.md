---
dimension: D3 — synchronisation et local-first
round: 2
assistant: 1
date: 2026-08-18
outils: 15
---

## Constats

### Q1 — Background Fetch sur iOS

**Background Fetch n'est implémentée ni dans Safari desktop ni dans Safari iOS** : `version_added: false` pour `safari`, `safari_ios` en `mirror` (donc false), contre `chrome: 74`.
— source: https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/BackgroundFetchManager.json | éditeur: MDN browser-compat-data | publié: branche main au 2026-08-18 | consulté: 2026-08-18 | confiance: haute | classe: version-compat

**La demande chez WebKit est morte sur pied** : bug 214548 « Feature Request: Implement the Background Fetch API », statut `NEW`, dernière modification **2021-11-03**, près de cinq ans sans mouvement.
— source: https://bugs.webkit.org/show_bug.cgi?id=214548 | éditeur: Apple / WebKit Bugzilla | publié: dernière activité 2021-11-03 | consulté: 2026-08-18 | confiance: haute | classe: sante-ecosysteme

**Le fichier de statut des fonctionnalités WebKit ne contient AUCUNE entrée « Background Fetch » ni « Background Sync »** — la fonctionnalité que WebKit désigne comme l'alternative sûre n'est pas même inscrite à son propre suivi.
— source: https://raw.githubusercontent.com/WebKit/WebKit/main/Source/WebCore/features.json | éditeur: Apple / WebKit | publié: branche main au 2026-08-18 | consulté: 2026-08-18 | confiance: moyenne (une absence est un signal, pas une preuve formelle) | classe: version-compat

L'API reste marquée expérimentale et hors Baseline, Firefox également à `false`.
— source: https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/BackgroundFetchManager.json | éditeur: MDN | consulté: 2026-08-18 | confiance: haute | classe: version-compat

### Q2 — Aucun revirement Safari 26.x

**Texte intégral des sept notes de version Safari 26.0 à 26.6 extrait : ZÉRO occurrence** de « background sync », « background fetch » ou « periodic background ».
— source: webkit.org/blog/17333 (26.0), /17541 (26.1), /17640 (26.2), /17798 (26.3), /17862 (26.4), /17938 (26.5), /18178 (26.6) | éditeur: Apple / WebKit | publié: cycle 26.0→26.6 | consulté: 2026-08-18 | confiance: haute pour 26.0/26.2/26.4/26.6 (52–60 k caractères) ; moyenne pour 26.1/26.3/26.5 (extraction courte 6–17 k, possiblement partielle) | classe: version-compat

Seules mentions de Service Worker sur tout le cycle : plomberie — inspection auto dans Web Inspector (26.0), erreurs d'URL asynchrones et bug de téléchargement (26.2), trois correctifs de désenregistrement de registrations orphelines (26.6).
— source: webkit.org/blog/17640 et /18178 | éditeur: Apple / WebKit | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

Le seul mouvement PWA notable de Safari 26.0 va dans l'autre sens : « there are now zero requirements for "installability" in Safari », les Service Workers y étant explicitement présentés comme **facultatifs** sur iOS.
— source: https://webkit.org/blog/17333/webkit-features-in-safari-26-0/ | éditeur: Apple / WebKit | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

### Q3 — `forceSyncFallback` dans le code actuel

**La branche par défaut de Workbox est `v7`, pas `main`** : `main` contient encore `workbox-background-sync` **5.1.3**, sans aucune trace de `forceSyncFallback`. **Lire `main` donne une image fausse et périmée.**
— source: https://api.github.com/repos/GoogleChrome/workbox (`default_branch: v7`) + raw main package.json | éditeur: Google / Workbox | publié: dépôt poussé 2026-08-04 | consulté: 2026-08-18 | confiance: haute | classe: sante-ecosysteme

Dans le code réel (`v7`, `v6`, tag `v7.3.0`, identiques), **`forceSyncFallback` vaut `false` par défaut et agit comme une NÉGATION du chemin Background Sync** : les deux points d'entrée sont gardés par `if ('sync' in self.registration && !this._forceSyncFallback)`. À `true`, ni `registerSync()` ni l'écouteur `sync` ne sont installés.
— source: https://raw.githubusercontent.com/GoogleChrome/workbox/v7/packages/workbox-background-sync/src/Queue.ts (lignes 30, 105, 126, 395, 420) | éditeur: Google / Workbox | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

Commentaire du code : « In non-sync-supporting browsers, or if `_forceSyncFallback` is true, this will retry the queue on service worker startup » — **le rejeu est lié au démarrage du Service Worker, jamais au retour de connectivité.**
— source: idem, lignes 411-414 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

**La valeur par défaut réelle de `maxRetentionTime` est de 7 JOURS (10 080 minutes), pas 24 h** : `const MAX_RETENTION_TIME = 60 * 24 * 7;`
— source: idem, lignes 41/45 et 125 | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

Les deux gardes renvoient au même ticket fondateur (`issues/2393`) : le repli forcé répond à un problème de terrain, pas à un confort d'API.
— source: idem, lignes 394 et 419 | consulté: 2026-08-18 | confiance: haute | classe: pratique-terrain

Workbox vivant mais à cadence lente : `workbox-background-sync` 7.4.1 le 2026-05-04, précédé de 7.4.0 (2025-11-19) et 7.3.0 (2024-10-29), licence MIT.
— source: https://registry.npmjs.org/workbox-background-sync | consulté: 2026-08-18 | confiance: haute | classe: sante-ecosysteme

### Q4 — PowerSync

Dépôt très actif dans la durée : plus de 100 commits sur 120 jours, dernier commit 2026-08-13, push 2026-08-18, **Apache-2.0**, non archivé, créé en octobre 2023.
— source: https://api.github.com/repos/powersync-ja/powersync-js | consulté: 2026-08-18 | confiance: haute | classe: sante-ecosysteme

Le SDK web est un produit de première classe, pas un dérivé du natif : `@powersync/web` **2.2.0** le 2026-08-13 sous Apache-2.0, avec maintien parallèle de la ligne 1.x (1.39.1 le 2026-08-04) — transition de majeure gérée.
— source: https://registry.npmjs.org/@powersync/web | consulté: 2026-08-18 | confiance: haute | classe: version-compat

SQLite compilé en WASM, choix de système de fichiers virtuel (`IDBBatchAtomicVFS` par défaut, variantes OPFS), multi-onglet via shared workers, **consigne Safari explicite** : « For Safari, use the OPFSCoopSyncVFS virtual file system to ensure stable multi-tab functionality ».
— source: https://docs.powersync.com/client-sdk-references/javascript-web | consulté: 2026-08-18 | confiance: haute | classe: comportement-runtime

SaaS à paliers avec socle gratuit non trivial : Free 0 $/mois (2 Go synchronisés/mois, 500 Mo hébergés, 50 connexions concurrentes de pointe), Pro à partir de 49 $/mois, Team à partir de 599 $/mois ; dépassements 1 $/Go et 30 $ / 1 000 connexions. Porte de sortie : « Open Edition » source-available gratuite, et Enterprise Self-Hosted.
— source: https://www.powersync.com/pricing | consulté: 2026-08-18 | confiance: haute (paliers) / moyenne (licence exacte de l'Open Edition non nommée) | classe: pratique-terrain

### Q5 — Zero (Rocicorp)

**Zero est GA** : « As of March 2026, Zero is generally available and fully-supported », suivi d'une politique de dépréciation explicite.
— source: https://zero.rocicorp.dev/docs/status | éditeur: Rocicorp | publié: déclaration de 2026-03 | consulté: 2026-08-18 | confiance: haute | classe: sante-ecosysteme

`@rocicorp/zero` **1.9.0** le 2026-08-14 sous Apache-2.0, builds `head` quotidiens. Monorepo `rocicorp/mono` Apache-2.0, non archivé, 100+ commits sur 120 jours, dernier commit 2026-08-18.
— source: https://registry.npmjs.org/@rocicorp/zero + https://api.github.com/repos/rocicorp/mono | consulté: 2026-08-18 | confiance: haute | classe: sante-ecosysteme

Open-source + service géré optionnel, tarifé à l'infrastructure et non à l'usager : Hobby **30 $/mois** (10 Go, 3 vCPU partagés, support Discord), Professional **300 $/mois** (100 Go, 7 vCPU dédiés, SLA), stockage additionnel 0,20 $/Go, offre BYOC « Runs in your AWS account ».
— source: https://zero.rocicorp.dev/cloud | consulté: 2026-08-18 | confiance: haute | classe: pratique-terrain

**Replicache est officiellement gelé, avec chemin de sortie nommé** : « After five years […] Replicache is now in maintenance mode », « won't add new features », « Existing users should migrate to Zero as they are able ».
— source: https://replicache.dev/ | consulté: 2026-08-18 | confiance: haute | classe: sante-ecosysteme

Deuxième source indépendante par les artefacts : dépôt `rocicorp/replicache` **archivé**, dernier push 2022-05-07 ; paquet npm resté à 15.3.0 publié le **2025-07-02**.
— source: https://api.github.com/repos/rocicorp/replicache + https://registry.npmjs.org/replicache | consulté: 2026-08-18 | confiance: haute | classe: sante-ecosysteme

**Nuance de lecture importante** : entre 2022 et 2025 le développement s'est poursuivi **dans `rocicorp/mono`** (releases `v12.2.1-source` et `v12.2.2-source`, nov.-déc. 2023). « Archivé en 2022 » ne signifie pas « abandonné en 2022 ».
— source: https://api.github.com/repos/rocicorp/mono/releases | consulté: 2026-08-18 | confiance: haute | classe: sante-ecosysteme

### Q6 — Balayage des angles morts

**RxDB — vivant.** Apache-2.0 côté cœur, 23 351 étoiles, 100+ commits sur 120 jours, dernier commit 2026-08-17, npm 17.4.0 le 2026-07-13. Open-core, et **la réplication reste dans le palier gratuit** : « INCLUDES RxDB core (schemas, queries, hooks), Replication & realtime sync, Default RxStorage ». Licences premium annuelles, sans essai ni mensualisation.
— source: https://api.github.com/repos/pubkey/rxdb + https://rxdb.info/premium/ | consulté: 2026-08-18 | confiance: haute (dépôt) / moyenne (montants Pro absents de l'extrait) | classe: sante-ecosysteme

**Dexie / Dexie Cloud — vivant, cadence plus calme.** Dexie.js Apache-2.0, 14 536 étoiles, **32 commits sur 120 jours** (contre 100+ pour RxDB et PowerSync), v4.4.5 le 2026-08-14 ; `dexie-cloud-addon` 4.4.14 le 2026-08-14, Apache-2.0. **Vise explicitement « quelques utilisateurs, plusieurs appareils »** : Free 0 € (3 production users, 10 bases, 100 Mo), puis 3 €/mois par 25 sièges ; édition On-Premises illimitée.
— source: https://api.github.com/repos/dexie/Dexie.js + https://dexie.org/cloud/pricing | consulté: 2026-08-18 | confiance: haute | classe: sante-ecosysteme

**Legend-State — vivant mais BLOQUÉ EN BÊTA.** Dépôt actif (MIT, 4 188 étoiles, 36 commits sur 120 jours), mais le canal `latest` npm est figé sur **2.1.15 publiée le 2024-08-30**, la v3 traînant en bêta depuis des années (`3.0.0-beta.48` le 2026-07-12, beta.45 en février, .46 en mars, .47 en avril 2026). **Et la brique Supabase visée est précisément celle de la v3 bêta** : « sync plugins for Keel, Supabase, TanStack Query, and fetch », doc en `state/v3/usage/persist-sync/`.
— source: https://api.github.com/repos/LegendApp/legend-state + https://registry.npmjs.org/@legendapp/state + README main | consulté: 2026-08-18 | confiance: haute | classe: version-compat

## Contradictions

**A. Background Fetch sur Safari — résumé de moteur contre sources primaires.** Le résumé généré affirmait « implemented in Safari but not yet functional », « partial implementation ». **Les trois sources primaires disent l'inverse et concordent** : `version_added: false`, bug 214548 encore `NEW` sans mouvement depuis 2021, aucune entrée dans `features.json`. Page d'origine du résumé non ouverte ; signalé sans être tranché, mais le faisceau primaire est univoque.

**B. Replicache — trois dates incompatibles, une seule histoire.** GitHub : archivé, dernier push 2022-05-07. npm : 15.3.0 publiée 2025-07-02. `rocicorp/mono` : releases Replicache fin 2023. replicache.dev : « maintenance mode » au présent. **Aucune n'est fausse** : le code a migré de dépôt en 2022, a continué d'être publié jusqu'à mi-2025, puis a été gelé. Conclure « mort depuis 2022 » du seul badge d'archivage serait une erreur de lecture.

**C. Replicache — licence.** replicache.dev annonce une ouverture « with no licensing charges » ; les métadonnées npm déclarent toujours `"license": "https://roci.dev/terms.html"` — une URL de conditions propriétaires, pas un identifiant SPDX. Non réconcilié.

**D. Workbox — quelle branche est la vérité.** `main` contient 5.1.3 sans `forceSyncFallback` ; la branche par défaut déclarée est `v7`, où l'option existe. **Quiconque lit `main` — le réflexe par défaut — conclura que l'option n'existe pas.**

**E. Workbox — rétention.** La doc de 2017 met en avant un exemple à 24 h ; le code actuel fixe le défaut à 7 jours. Décalage jamais résorbé entre deux artefacts encore en ligne.

**F. WebKit — la recommandation contre l'implémentation.** WebKit a refusé Background Sync **en désignant Background Fetch comme l'alternative plus sûre**, mais ne l'a jamais implémentée, a laissé la demande sans assignation depuis 2021, et ne l'inscrit pas à son fichier de statut. **L'alternative recommandée n'existe pas chez celui qui la recommande.**

## Pistes

- Notes Safari **18.5** et **18.6** non ouvertes (18.0 à 18.4 non localisées) — fenêtre 18.x non fermée.
- Confirmer « Chrome 74 » par une source indépendante de MDN (fil blink-dev « Intent to Implement », chromestatus).
- Chercher une déclaration de maturité explicite chez PowerSync : la page tarifaire ne dit ni bêta ni GA ; l'inférence de production repose sur le versionnage npm.
- Zero Cloud affiche un « ? » sur la ligne vCPU du palier Hobby. **Vérifier les prérequis Postgres de `zero-cache` (réplication logique) au regard d'un Supabase managé — point de friction probable.**
- Clarifier la sémantique « seat » chez Dexie Cloud : si un siège = un utilisateur et non un appareil, le palier gratuit couvre déjà « un utilisateur, plusieurs appareils ».
- Montants réels des paliers RxDB Pro / Pro Plus, absents de l'extrait.
- Échéance annoncée pour une v3 stable de Legend-State.
- Lire https://github.com/GoogleChrome/workbox/issues/2393, cité deux fois dans le code.

## Ce que j'ai cherché et pas trouvé

- **Aucune mention** de background sync/fetch dans les sept notes 26.0→26.6, sur texte complet. Pas de revirement sur ce cycle.
- Extractions de 26.1, 26.3 et 26.5 courtes (6 951 / 6 243 / 16 988 caractères contre 52–60 k ailleurs) : plausible pour de petites versions, **extraction partielle non exclue**.
- Notes Safari 18.x **non lues** (budget épuisé après localisation de 18.5 et 18.6 seulement).
- **Aucune déclaration explicite « GA », « beta » ou « production-ready » trouvée pour PowerSync** — le jugement de maturité repose sur le versionnage et l'activité, pas sur une affirmation de l'éditeur.
- `zero.rocicorp.dev/docs/introduction` et `/llms.txt` sans rendu exploitable ; `/docs/zero-cloud`, `/docs/cloud`, `/docs/pricing`, `rocicorp.dev/pricing` renvoient 404.
- Pas de montants RxDB Pro / Pro Plus.
- **Pas de second post-mortem indépendant sur Replicache** : déclaration officielle + métadonnées de dépôt et de registre, factuelles et concordantes, mais aucune source tierce (retour d'utilisateur migré, rétrospective externe).
