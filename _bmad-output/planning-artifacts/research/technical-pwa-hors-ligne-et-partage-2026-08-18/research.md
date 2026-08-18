---
title: 'Recherche technique — PWA hors-ligne et partage'
type: 'technical'
topic: 'PWA hors-ligne et partage (MyPaddock, application de roulage moto)'
decision: 'Quelles exigences non fonctionnelles ecrire dans le PRD MyPaddock, et quelles hypotheses techniques sont fausses avant de coder le noyau de premier roulage livrable au 1er decembre 2026.'
source: 'run natif, fan-out 3 assistants'
status: complete
preset: 'standard'
validation: 'high'
created: '2026-08-18'
updated: '2026-08-18'
claims_verified: 8
claims_disputed: 1
claims_overturned: 1
---

# Recherche technique — PWA hors-ligne et partage

**Décision servie :** Quelles exigences non fonctionnelles ecrire dans le PRD MyPaddock, et quelles hypotheses techniques sont fausses avant de coder le noyau de premier roulage livrable au 1er decembre 2026.

## Résumé exécutif

**Verdict : la PWA tient. Aucune des trois hypothèses techniques portantes n'est fausse — mais deux tiennent
pour d'autres raisons que celles qu'on croyait, et une exigence du PRD change.**

**1. La continuité des données est acquise, par un mécanisme qui n'était pas celui du brief.** L'idée
qu'une PWA installée échappe au plafond des sept jours de Safari n'est écrite nulle part chez Apple, et
le billet WebKit *dédié* à la politique de stockage, publié en 2023, ne mentionne aucun délai de sept
jours [1]. Ce qui protège réellement est une phrase primaire et sans ambiguïté : « Origin might be
excluded from eviction if it has active page at the time of eviction, **or its storage is in persistent
mode** » [1]. Et `navigator.storage.persist()` est accordé **sans invite** sur WebKit comme sur Chromium,
WebKit nommant l'installation sur l'écran d'accueil parmi ses critères [1][3]. **Appeler `persist()` n'est
donc pas une optimisation, c'est le mécanisme de continuité lui-même.**

**2. Le partage vers Instagram ne peut pas être une exigence.** L'API `navigator.share()` avec fichiers
fonctionne et n'est pas le risque. Le risque est que **Meta ne documente aucun chemin web vers Instagram
Stories — ni vers Facebook Stories** [18][19], que les cibles de la feuille de partage iOS ne sont pas un
contrat stable (« Save to Photos » a disparu pour les images `jpeg` en iOS 16.4.1 avant d'être rétablie
par correctif) [28], et qu'aucune API web ne permet d'énumérer les cibles [15]. Après deux tours, **aucune
preuve empirique récente** que le chemin fonctionne jusque dans Stories. Le PRD doit écrire « produire une
image que le pilote peut poster », jamais « partager vers Instagram ».

**3. Rien ne se synchronisera pendant que l'application dort, sur iOS, jamais.** WebKit a refusé Background
Sync et sa variante périodique [30] ; le cycle Safari 26.0→26.6 ne contient **aucune** mention d'un
revirement, sur texte intégral [41] ; et **l'alternative que WebKit recommandait — Background Fetch — n'est
pas implémentée chez WebKit**, sa demande stagnant au statut `NEW` depuis novembre 2021 [38][39]. Pour ce
produit, la nouvelle est bénigne : la saisie a lieu application ouverte, au paddock.

**Le caveat le plus lourd n'est pas une incertitude technique, c'est une absence de terrain.** Six
assistants n'ont trouvé **aucun** témoignage récent exploitable — ni sur la perte de données en PWA
installée, ni sur le partage vers Instagram, ni sur « last-write-wins » contre CRDT en production. Ce qui
n'est pas dans la documentation primaire ne s'obtiendra que par prototype.

---

## D1 — Durabilité du stockage

**Question servie :** une PWA ouverte environ onze fois par an peut-elle garantir que des données saisies en mars soient encore là en octobre ? Le mode de panne redouté n'est pas l'absence de réseau au paddock, c'est « j'ouvre en mars et ma saison a disparu ».

### Le verdict : l'hypothèse tient, mais pas par le mécanisme qu'on croyait

Le raisonnement courant — et celui qui circulait avant cette recherche — est qu'une PWA installée sur l'écran d'accueil échappe au plafond des sept jours d'inactivité de Safari. **Cette exemption n'est documentée par aucune source primaire d'Apple.** Le billet WebKit de 2020 dit qu'une web app installée a « son propre compteur de jours d'usage » [2] ; MDN, en janvier 2026, écrit qu'elle est « exempte » [3]. Ce ne sont pas la même affirmation, et Apple n'a jamais publié la seconde.

Pire pour cette thèse : **le billet WebKit dédié à la politique de stockage, publié en août 2023 — trois ans après celui de 2020 — ne mentionne aucun délai de sept jours** [1]. Il décrit l'éviction comme survenant « when exceeding the overall quota, when the system is under storage pressure, or when the site has not been interacted with by the user for some time », et précise que WebKit « normally evicts data on an origin basis » selon une politique LRU. Aucun chiffre. Le même billet met explicitement les web apps installées sur le **même plan** que le navigateur pour les quotas, sans leur accorder la moindre exemption d'éviction.

Ce qui protège réellement est ailleurs, et c'est une phrase primaire, citable, non ambiguë :

> « Origin might be excluded from eviction if it has active page at the time of eviction, **or its storage is in persistent mode**. » [1]

**Le mode persistant sort l'origine du mécanisme d'éviction.** Et `navigator.storage.persist()` est accordé **sans invite à l'utilisateur** sur WebKit comme sur Chromium [3] — WebKit nommant explicitement l'installation sur l'écran d'accueil parmi ses critères d'octroi : « WebKit currently grants a request based on heuristics like whether the website is opened as a Home Screen Web App » [1].

Deux éléments de terrain complètent le tableau sans le trancher : un fil de développeurs rattache la règle des sept jours à l'ITP plutôt qu'à la politique de stockage, et l'un d'eux y affirme que « Home Screen apps don't have this limitation » [8] — affirmation de développeur, jamais d'Apple. Le désaccord reste ouvert et **sans effet sur la décision** : que la règle des sept jours existe encore ou non, le mode persistant en exempte [1].

La conséquence pour le PRD est nette, et elle inverse la priorité : **appeler `persist()` n'est pas une optimisation, c'est le mécanisme de continuité lui-même.** Un témoignage de terrain, à confiance basse, ajoute que la demande « has to be requested every time your app is opened » [8] — non confirmé, mais assez peu coûteux pour être honoré par précaution.

### Chrome Android n'a pas le problème

Aucune règle d'éviction temporelle sur Chromium : l'éviction ne se déclenche que sous pression disque ou dépassement du plafond global, et purge l'origine la moins récemment utilisée [4][3]. En mode persistant, la donnée n'est évincée que sur choix explicite de l'utilisateur dans les réglages [3].

Une inquiétude a été examinée et écartée faute de preuve : l'hibernation des applications inutilisées d'Android 11+ vise les applications natives et son effet de stockage annoncé se limite au cache et aux artefacts de compilation [11] (confiance basse, page non ouverte). Surtout, **le maillon décisif n'a pas pu être établi** : le stockage web d'un WebAPK ne réside pas dans le WebAPK mais dans le profil de Chrome — or Chrome est utilisé quotidiennement et n'hiberne donc jamais. L'hypothèse est plausible, elle n'est **pas vérifiée**.

### Les quotas ne sont pas un sujet

Depuis iOS 17 / macOS 14, le quota par origine est d'environ **60 % du disque total**, avec un plafond global à 80 % ; une web app de l'écran d'accueil bénéficie du même niveau qu'une application navigateur [1][3]. Le vieux plafond de 1 Gio avec invite de permission au-delà appartient aux versions antérieures — il n'y a plus d'invite [3]. Chrome applique les mêmes ordres de grandeur [4][3].

Un billet tiers affirmant « Safari caps storage at 50MB » a été rencontré et **écarté** : il est frontalement contredit par la source primaire. C'est un exemple typique du bruit de 2019-2023 qui pollue ce sujet.

Deux réserves d'usage, en revanche : `navigator.storage.estimate()` renvoie des valeurs **volontairement approximatives**, le quota étant calculé sur la taille totale du disque et non sur l'espace libre, pour éviter le *fingerprinting* [3][4]. Et `localStorage` reste plafonné en dur à 5 Mio [3] — il ne peut pas porter les données métier.

### Une porte fermée : Storage Buckets

L'API Storage Buckets permettrait de marquer un sous-ensemble de données comme persistant indépendamment du reste — exactement ce qu'on voudrait pour protéger les saisies sans protéger le cache d'images. **Elle n'est implémentée sur aucune version de Safari ni de Safari iOS** : Chrome 122+, Chrome for Android 151+, Edge, Opera, Samsung Internet ; Safari non supporté jusqu'à 26.5 incluse et sur Technology Preview [6]. La persistance sélective n'est pas une option sur iOS. **Tout ou rien par origine** — ce que confirme d'ailleurs le fait que l'éviction Safari soit elle-même « tout ou rien » : quand une origine est évincée, l'intégralité de ses données part d'un coup [3].

### L'épisode DMA est clos

Apple a annoncé la suppression des web apps sur l'écran d'accueil dans l'Union européenne, puis a fait machine arrière : « We have received requests to continue to offer support for Home Screen web apps in iOS and iPadOS, therefore we will continue to offer the existing Home Screen web apps capability in the EU » [5]. Elles sont maintenues depuis iOS 17.4 (mars 2024), bâties exclusivement sur WebKit. Aucun développement postérieur à 2024 n'a été trouvé — absence de preuve, pas preuve d'absence.

Deux capacités confirmées au passage : le Web Push sur iOS n'existe **que** pour les web apps installées, jamais dans un onglet Safari [12] (confiance moyenne) ; et Safari 26.0 a introduit « every site can be a web app on iOS and iPadOS », sans exigence de manifest [13] (confiance moyenne).

### Ce qui reste inconnu — et pourquoi ça ne change rien

Un seul témoignage de perte réelle a été trouvé — des entrées IndexedDB disparaissant aléatoirement sur iOS 17.4.x — mais il concerne une WKWebView Cordova et non une web app de l'écran d'accueil, donc il n'est pas transposable [9]. Le seuil de deux témoignages indépendants n'est atteint dans aucun sens.

Deux questions ont résisté à deux tours de recherche :

1. **Que deviennent IndexedDB et Cache Storage à la désinstallation d'une web app sur iOS ?** Aucune source, primaire ou secondaire. MDN documente le geste de suppression sans un mot sur les données [7]. Sur Chrome desktop, une case « Also delete data from Chrome » est proposée [10] (confiance moyenne, page non ouverte) ; sur **Android**, où la désinstallation d'un WebAPK passe par le gestionnaire d'applications du système et non par Chrome, rien.
2. **Le stockage survit-il à une sauvegarde iCloud puis restauration sur un nouvel appareil ?** Les seules sources remontées sont des sites d'éditeurs de logiciels de récupération de données — des fermes de contenu, sans valeur probante. Elles n'ont pas été reprises.

**Ces inconnus ne modifient aucune exigence.** Le brief impose déjà que toute donnée saisie survive à la désinstallation, par synchronisation serveur et export récupérable. Une recherche qui ne peut pas établir le comportement oblige à supposer le pire — c'est-à-dire exactement ce que la contrainte prescrivait. **L'inconnu confirme la contrainte au lieu de la lever.** C'est la raison pour laquelle cette dimension s'arrête sur *couverture pour la décision*, et non sur épuisement de la nouveauté : un troisième tour coûterait des soirées de décembre sans déplacer une seule exigence.

## D2 — Partage

**Question servie :** composer une image côté client et la partager vers Instagram Stories depuis une PWA. Le partage est le moteur d'acquisition ; s'il ne fonctionne pas, le domaine récapitulatif tombe.

### L'API n'est pas le risque

`navigator.share()` avec des fichiers est disponible sur Safari iOS depuis longtemps — le blog WebKit l'annonce avec Safari 15 [23], la base de compatibilité dit iOS 14 [16]. Une troisième source, web.dev, disait « Safari 12.1+ » — elle date de 2019, confond les niveaux 1 et 2 de la spec, et a été écartée [17]. L'écart n'a pas été tranché et **n'a aucune importance** : les deux bornes ont plus de cinq ans. Sur Chrome Android c'est supporté aussi [16]. Les types d'images acceptés couvrent largement ce qui est nécessaire — png, jpeg, webp, avif [14].

Les contraintes d'appel sont connues et faciles à respecter : contexte sécurisé, **activation utilisateur transitoire** (donc un vrai clic, pas un appel différé), et la Permissions Policy `web-share` [14].

Les deux bugs WebKit suspects ont été ouverts et lus : celui sur les appels multiples est **corrigé depuis août 2022** [27] ; celui sur le retour `undefined` en localhost non-SSL est ouvert mais **le rapporteur lui-même doute qu'il s'agisse d'un bug WebKit** et suggère sa fermeture [26]. Ni l'un ni l'autre n'est un risque produit.

### La composition : deux échecs silencieux et un faux risque

**`toBlob()` retombe silencieusement sur PNG** si le format demandé n'est pas supporté ou pas spécifié — il faut vérifier `blob.type` après coup plutôt que faire confiance au paramètre [21]. **`toBlob()` lève `SecurityError` si le bitmap n'est pas *origin-clean*** [21] : c'est le mode d'échec le plus probable d'une composition « photo de fond + incrustations » dès que la photo vient d'une autre origine sans CORS correct.

Le faux risque est la dimension : un canvas 1080×1920 fait 2,07 mégapixels, soit environ **huit fois moins que l'ancienne limite Safari** de 4096×4096. Le format story n'est pas un facteur de risque.

**Les polices en worker sont résolues, et la réponse est nette.** `FontFaceSet` est bien exposé aux workers — la spec CSS Font Loading inclut `FontFaceSource` dans `WorkerGlobalScope`, donc `self.fonts` existe [24]. Mieux : la spec nomme explicitement le cas d'usage, les `FontFace` ajoutés affectant le font-matching du worker « such as, for example, drawing text into an `OffscreenCanvas` » [24]. La recette est `new FontFace(...)` puis `self.fonts.add(...)` puis `.load()`. **Le piège est que la source de polices d'un worker démarre vide : rien n'est hérité du document** [24].

En revanche, le support d'`OffscreenCanvas` sur Safari iOS n'a **pas** pu être confirmé sur source primaire — MDN ne précise ni les formats de `convertToBlob()` ni le comportement des polices en worker [22] — les agrégateurs disent 16.4 ou 17 selon les versions, ce qui n'est pas une preuve. L'arbitrage Canvas 2D contre OffscreenCanvas reste ouvert.

Enfin, la croyance courante selon laquelle `fillText` rendrait silencieusement en police de repli quand la police n'est pas encore chargée **n'a pas pu être sourcée** : la section « text styles » de la spec HTML canvas ne décrit aucun comportement de repli, d'attente ou de rendu différé [25]. Ce qui est documenté, c'est le fait adjacent — une police déclarée n'est pas chargée tant qu'elle n'est pas utilisée, et `load()` force ce chargement [20]. Le lien de causalité est probable mais non établi. La précaution reste bon marché : attendre `load()` avant tout `fillText`.

### Le risque est Instagram, et il est structurel

Trois constats se recoupent, et ils vont tous dans le même sens.

**Meta ne documente aucun chemin web.** La page « Sharing to Stories » d'Instagram ne décrit que des mécanismes natifs — `instagram-stories://share` avec `UIPasteboard` sur iOS, un Intent implicite sur Android — et exige un identifiant d'application Facebook enregistré depuis janvier 2023 [18]. La page équivalente pour **Facebook** Stories, examinée comme repli possible, dit exactement la même chose : « By using Android Implicit Intents and iOS Custom URL Schemes, your app can pass photos, videos, and stickers to the Facebook app » [19]. **Aucune mention de navigateur, de web ou de PWA sur ni l'une ni l'autre.** Les deux portes sont fermées côté Meta.

**Les cibles de la feuille de partage ne sont pas un contrat.** Ce constat est documenté par une régression réelle : sur iOS 16.4.1, « Save to photos » a **disparu** de la feuille pour une image `image/jpeg`, ne laissant que « Save to files », alors que la même API fonctionnait sur iOS 15.7 ; il a fallu un correctif WebKit pour la rétablir [28]. Le jeu de cibles offert est une propriété de la version du système, pas une garantie d'API.

**Aucune API web ne permet d'énumérer les cibles.** `canShare({files})` retourne `true` dès que le *type* de donnée est partageable — il ne dit rien des applications installées ni de ce qu'elles feront du fichier [15]. C'est une limite structurelle, pas un défaut d'implémentation. Et `share()` peut rejeter avec `AbortError` **lorsqu'aucune cible n'est disponible**, condition que `canShare()` ne peut structurellement pas anticiper [14][15] — donc un `catch` reste obligatoire, en distinguant l'annulation utilisateur (silence) du reste (repli).

### Ce qui n'a pas pu être établi, après deux tours

**Aucune preuve empirique 2025-2026 que le chemin fonctionne jusque dans Stories.** Ce qui a été trouvé : un article de blog de 2023 affirmant qu'Instagram figure parmi les cibles, sans preuve de test et sans rien dire de Stories ; et, à l'inverse, des témoignages de développeurs de 2020 à 2022 rapportant que le partage d'image vers Instagram **fonctionnait sur Android et échouait sur Safari iOS** — « on iOS, it looks like I was sharing text instead of an image » [29]. Un contournement circulait en 2022 : passer un `title` vide. Aucune réponse d'Apple dans ces fils. Zéro témoignage récent, dans un sens ou dans l'autre.

Voir une icône Instagram dans une feuille de partage ne prouve pas que l'image atteint Stories. Les deux camps observent des choses différentes et ne se réconcilient pas.

**Le maximum sourçable est donc :** le partage de fichier fonctionne ; les cibles offertes dépendent de la version du système et des applications installées ; et le comportement d'Instagram à réception n'est documenté nulle part côté web.

### La conséquence, qui est une exigence et non un constat

Contrairement à D1, cet inconnu **change ce que le PRD doit demander**. Puisqu'aucune garantie n'existe et qu'aucune ne peut être obtenue par la recherche documentaire, **le récapitulatif ne doit dépendre d'aucune cible de partage nommée.** La formulation « partager vers Instagram » ne peut pas être une exigence ; « produire une image que le pilote peut poster » le peut.

Raisonnement, pas constat sourcé : le repli évident — enregistrer l'image dans la photothèque et laisser le pilote la poster lui-même — **passe lui aussi par la feuille de partage sur iOS**, où « Save to Photos » est précisément la cible qui a régressé [28]. Le repli n'est donc pas entièrement indépendant du mécanisme qu'il est censé secourir. C'est un point à trancher à l'architecture, pas ici.

## D3 — Synchronisation et local-first

**Question servie :** accepter des saisies hors réseau au paddock et les synchroniser sans jamais perdre de données, sur iOS comme sur Android, pour un produit à cadence saisonnière.

### La synchronisation en arrière-plan n'existera pas sur iOS

WebKit a refusé Background Sync — et pas seulement sa variante périodique, l'API de base aussi. Le bug est clos `WONTFIX` avec une déclaration nominative : « We oppose this feature and will not implement it » [30]. Une ambiguïté de gouvernance subsiste et mérite d'être notée : sur le traqueur *officiel* des positions WebKit, la question reste ouverte au statut « Needs position » [31] — le signal opérationnel est identique (rien n'a été implémenté), mais un refus d'ingénieur de 2019 ne vaut pas position institutionnelle. Les motifs sont structurels, pas conjoncturels : traçage par IP, création de botnets, persistance de la menace après que l'utilisateur a cessé de visiter le site, domaines rachetables, batterie. La spécification elle-même n'aide pas : un « UNOFFICIAL DRAFT » du WICG, sans section « Security Considerations », hors standard W3C et hors Standards Track [32].

Trois vérifications ont été menées pour s'assurer que cette position de 2019 tenait toujours, et les trois convergent.

**Aucun revirement sur le cycle Safari 26.** Le texte intégral des sept notes de version, de 26.0 à 26.6, a été extrait : **zéro occurrence** de « background sync », « background fetch » ou « periodic background » [41]. Les seules mentions de Service Worker sur tout le cycle sont de la plomberie — inspection dans Web Inspector, correctifs de registrations orphelines. Le seul mouvement PWA notable va dans l'autre sens : Safari 26.0 annonce « there are now zero requirements for "installability" in Safari », les Service Workers y étant explicitement **facultatifs** sur iOS [41].

**L'alternative que WebKit recommandait n'existe pas chez WebKit.** En refusant Background Sync, WebKit citait Background Fetch comme la solution plus sûre qu'il préférait [30]. Or Background Fetch porte `version_added: false` pour Safari comme pour Safari iOS [38] ; la demande d'implémentation, bug 214548, est au statut `NEW` **sans mouvement depuis novembre 2021** [39] ; et le fichier de statut des fonctionnalités de WebKit ne contient **aucune entrée** ni pour Background Fetch ni pour Background Sync [40] (confiance moyenne — une absence est un signal, pas une preuve formelle). La recommandation n'a jamais été suivie d'effet par celui qui la formulait.

**Conclusion opérationnelle :** sur iOS, rien ne se synchronisera pendant que l'application est fermée. Ce n'est pas une lacune temporaire à contourner en attendant, c'est une propriété permanente de la plateforme.

Pour ce produit, la nouvelle est moins grave qu'il n'y paraît. La saisie a lieu **au paddock, entre deux sessions**, application ouverte, et la synchronisation peut se faire au retour du réseau sur la route ou à la prochaine ouverture. Il n'existe aucun besoin de synchroniser pendant que l'application dort.

### Le piège Workbox, et pourquoi c'est la mauvaise abstraction

Le repli de `workbox-background-sync` existe bien, mais deux détails changent son évaluation, et tous deux ont exigé de lire le **code** plutôt que la documentation.

Premier détail, et c'est un piège pour quiconque irait vérifier : **la branche par défaut du dépôt est `v7`, pas `main`.** La branche `main` contient encore la version 5.1.3, sans aucune trace de `forceSyncFallback` [42]. Lire `main` — le réflexe par défaut — donne une image fausse et périmée du code.

Second détail, et il **renverse le tour 1** : la valeur par défaut réelle de `maxRetentionTime` est de **sept jours** (`60 * 24 * 7` minutes), et non les 24 heures que suggérait l'exemple de la documentation — une page datée de 2017, encore en ligne, jamais réconciliée avec le code [42][33]. Par ailleurs `forceSyncFallback` vaut `false` par défaut et agit comme une **négation** du chemin Background Sync : les deux points d'entrée sont gardés par `if ('sync' in self.registration && !this._forceSyncFallback)`, si bien qu'à `true`, ni l'enregistrement ni l'écouteur ne sont installés [42]. Ce n'est pas un renfort, c'est un interrupteur qui débranche. Les deux gardes renvoient au même ticket fondateur [34] : l'option répond à un problème de terrain, pas à un confort d'API.

Le rejeu, lui, est confirmé par le commentaire du code : « this will retry the queue on service worker startup » — **au démarrage du Service Worker, jamais au retour de la connectivité** [42]. La bibliothèque elle-même est vivante mais à cadence lente — 7.4.1 publiée en mai 2026, sous licence MIT [43].

Reste que sept jours demeurent très en deçà d'un cycle saisonnier. Et cela conduit à une observation — raisonnement, pas constat de recherche : **`workbox-background-sync` met en file d'attente des requêtes HTTP, et c'est la mauvaise abstraction pour ce produit.** Une requête POST en attente qui expire perd la donnée silencieusement ; un enregistrement local pas encore synchronisé reste un enregistrement. Pour un carnet dont la promesse est la continuité, la source de vérité doit être une base locale durable, et la synchronisation doit être une **réconciliation**, pas le rejeu d'une file de requêtes périssables. C'est un arbitrage d'architecture, mais le PRD peut en tirer une exigence : *aucune donnée saisie ne doit exister uniquement sous forme de requête en attente.*

### Côté serveur : Supabase ne fera pas le travail

Supabase n'a jamais livré de support local-first natif, et ne prévoit pas de le faire. La position officielle de juin 2023 est de s'appuyer sur des outils tiers, le motif technique invoqué étant qu'il faudrait exposer par API un historique horodaté complet de chaque événement, sans solution sur étagère [35]. La discussion est la plus votée de l'organisation, et le sentiment s'y est dégradé jusqu'en janvier 2025 [35].

L'acqui-hire de l'équipe Triplit, en octobre 2025, n'y change rien — Supabase a explicitement déclaré que l'objectif n'était **pas** d'intégrer Triplit à la plateforme, mais d'étendre les intégrations tierces ; Triplit passe en maintenance communautaire [36]. Deux lectures du même événement coexistent : celle du blog Supabase, qui parle de continuité positive, et celle d'un praticien qui classe Triplit parmi les projets abandonnés [37]. Elles sont factuellement compatibles et opposées en implication : un projet dont l'équipe fondatrice travaille désormais sur autre chose n'est pas un projet soutenu.

### L'état réel des moteurs, mesuré et non raconté

| Moteur | Santé | Licence | Modèle | Verdict pour ce cas |
|---|---|---|---|---|
| **PowerSync** | 100+ commits / 120 j, dernier 2026-08-13 [44] | Apache-2.0 | Gratuit 2 Go/mois synchronisés, 500 Mo hébergés ; Pro dès 49 $/mois ; « Open Edition » source-available [46] | SQLite en WASM, SDK web de première classe (`@powersync/web` 2.2.0), **consigne Safari explicite** : utiliser `OPFSCoopSyncVFS` [45] |
| **Zero** (Rocicorp) | **GA depuis mars 2026** [47] ; 100+ commits / 120 j [48] | Apache-2.0 | Auto-hébergeable ; géré à l'infrastructure : Hobby 30 $/mois, Pro 300 $/mois, BYOC [47] | Crédible. **Point de friction probable non vérifié** : les prérequis Postgres de `zero-cache` (réplication logique) face à un Supabase managé |
| **Dexie Cloud** | Vivant, cadence calme — 32 commits / 120 j contre 100+ ailleurs [51] | Apache-2.0 | Gratuit 3 utilisateurs de production, 100 Mo ; puis 3 €/mois par 25 sièges ; On-Premises illimité [51] | **Vise explicitement « quelques utilisateurs, plusieurs appareils »** — le cas exact |
| **RxDB** | 100+ commits / 120 j, npm 17.4.0 [50] | Apache-2.0 (cœur) | Open-core, **la réplication reste dans le palier gratuit** [50] | Crédible ; montants Pro non récupérés |
| **Legend-State** | Dépôt actif mais **canal `latest` figé sur 2.1.15 depuis août 2024** ; v3 en bêta depuis des années [52] | MIT | — | **Non** pour une échéance de décembre : la brique Supabase visée est précisément celle de la v3 bêta [52] |
| **Replicache** | Gelé — « maintenance mode », « migrate to Zero » [49] | Ambiguë : le site annonce une ouverture, npm déclare toujours une URL de conditions propriétaires [49] | — | Écarté |

Une nuance de lecture mérite d'être conservée, parce qu'elle invalide un raccourci tentant : le dépôt `rocicorp/replicache` est archivé depuis mai 2022, **mais le développement s'est poursuivi dans `rocicorp/mono` jusqu'en 2025** [49]. Conclure « mort depuis 2022 » d'un simple badge d'archivage aurait été faux.

### Ce qui n'a pas pu être établi

- **Aucune déclaration explicite de maturité chez PowerSync** — ni « GA », ni « bêta », ni « production-ready » sur les pages consultées. Le jugement repose sur le versionnage et l'activité du dépôt, pas sur une affirmation de l'éditeur.
- **Aucun retour de terrain à 6-12 mois sur LWW contre CRDT avec des chiffres de production.** Deux tours n'ont produit que des tutoriels. Aucun post-mortem de quelqu'un ayant choisi l'un puis constaté des pertes. La question reste ouverte — mais pour un utilisateur unique sur quelques appareils, avec des écritures rarement concurrentes, elle est probablement mal posée.
- Les notes Safari 18.x n'ont pas été lues ; les extractions de 26.1, 26.3 et 26.5 étaient courtes et une extraction partielle ne peut être exclue.

## Ce que seule la combinaison montre

Quatre choses ne se voient qu'en regardant les trois dimensions ensemble.

**1. Le même motif se répète trois fois : la plateforme ne garantit rien en dehors de l'application ouverte.** Éviction du stockage hors mode persistant, aucune synchronisation en arrière-plan sur iOS, aucun contrat sur les cibles de partage. Le seul moment garanti est *l'application est ouverte, l'utilisateur est là*. Or c'est exactement le moment de saisie que l'élicitation avancée avait déjà arrêté pour d'autres raisons — **au paddock, entre deux sessions**, et non le soir. La correction produite par la rotation des parties prenantes se trouve techniquement confirmée. Ce n'est pas une coïncidence utile, c'est une convergence : le bon moment produit est aussi le seul moment techniquement fiable.

**2. Deux inconnus, deux statuts opposés.** L'inconnu de D1 (que deviennent les données à la désinstallation) **ne change aucune exigence** : le brief imposait déjà la survie par synchronisation serveur, donc ne pas pouvoir établir le comportement oblige à supposer le pire, c'est-à-dire ce qui était prescrit. L'inconnu de D2 (le partage atteint-il Stories) **change une exigence** : faute de garantie obtenable, le récapitulatif ne peut dépendre d'aucune cible nommée. Un inconnu qui confirme une contrainte n'a pas la même valeur qu'un inconnu qui en impose une nouvelle, et les distinguer évite de dépenser des tours de recherche sur le premier.

**3. La documentation ment plus souvent que le code — trois fois dans ce seul run.** La documentation Workbox de 2017 annonce une rétention de 24 heures là où le code fixe sept jours [33][42]. La branche `main` du dépôt Workbox contient une version périmée sans l'option cherchée, alors que la branche par défaut est `v7` [42]. Et le billet WebKit de 2020 est encore cité partout alors que le billet dédié de 2023 le reformule sans reprendre son chiffre [1][2]. **Les trois corrections sont venues d'aller au code source ou à la source primaire la plus récente.** C'est une consigne de méthode transmissible à `bmad-architecture` : sur ce domaine, vérifier au code.

**4. Le budget s'est épuisé au même endroit sur les trois dimensions.** Les six assistants ont couvert la documentation primaire sans difficulté et ont tous buté sur la même chose : **les preuves de terrain**. Aucun témoignage récent de perte de données en PWA installée, aucun retour empirique sur le partage vers Instagram, aucun post-mortem chiffré sur la résolution de conflits. Ce n'est pas un défaut de méthode — c'est un constat sur le domaine : **les retours de terrain sur les PWA ne sont pas publiés.** Conséquence directe : ce qui n'est pas dans la documentation primaire ne s'obtiendra que par prototype.

---

## Recommandations

Chacune est liée à ce qui la consomme en aval, et nomme la base de confiance sur laquelle elle repose.

### Pour le PRD — exigences non fonctionnelles

**R1. Appeler `navigator.storage.persist()` à chaque ouverture et exposer `persisted()` au pilote.** Base : confiance haute, source primaire WebKit [1], corroborée par MDN [3]. Un témoignage de terrain à confiance basse suggère que la demande doit être renouvelée à chaque ouverture [8] — non confirmé, mais assez peu coûteux pour être honoré. **L'état de persistance doit être visible** : si elle n'est pas accordée, la promesse de continuité n'est pas tenue et le pilote doit pouvoir le savoir.

**R2. Le récapitulatif ne dépend d'aucune cible de partage nommée.** Base : confiance haute sur l'absence de documentation Meta [18][19] et sur l'instabilité prouvée des cibles [28] ; confiance basse sur le fonctionnement réel, faute de preuve dans un sens ou dans l'autre. La formulation « partager vers Instagram » ne peut pas être une exigence. En pratique : tester `canShare` avec l'objet **exact** qui sera passé à `share()`, toujours attraper le rejet en distinguant `AbortError` (annulation utilisateur, silence) du reste (chemin de repli visible), et prévoir un chemin de récupération de l'image qui ne suppose aucune cible précise.

**R3. Aucune donnée saisie ne doit exister uniquement sous forme de requête en attente.** Base : raisonnement, pas constat de recherche — appuyé sur la rétention par défaut de sept jours et le rejeu lié au démarrage du Service Worker [42]. La base locale est la source de vérité ; la synchronisation est une réconciliation. Si une file de requêtes est malgré tout utilisée, **fixer explicitement sa rétention** : le défaut de sept jours est très en deçà du cycle du produit.

**R4. Ne rien attendre d'une synchronisation en arrière-plan sur iOS**, ni maintenant ni plus tard : la synchronisation se déclenche à l'ouverture de l'application et au retour du réseau, pas autrement. Base : confiance haute, faisceau de trois sources primaires concordantes [30][38][41].

**R5. Traiter la désinstallation comme destructrice.** Base : absence totale de preuve après deux tours [7]. Confirme la contrainte existante du brief plutôt qu'elle ne l'amende.

**R6. Ne pas utiliser `localStorage` pour les données métier** (plafond dur de 5 Mio) [3], **et ne pas afficher les chiffres de `estimate()` comme des mesures** (approximatifs par conception, pour empêcher le *fingerprinting*) [3][4]. **Ne rien faire reposer sur Storage Buckets**, indisponible sur iOS [6].

### Pour l'architecture

**R7. Le choix du moteur de synchronisation est ouvert entre quatre candidats vivants** — PowerSync [44][45][46], Zero [47][48], Dexie Cloud [51], RxDB [50]. **Legend-State est écarté pour l'échéance de décembre** : son canal stable est figé depuis août 2024 et la brique Supabase visée est précisément celle de la v3 en bêta [52]. Base : confiance haute, mesurée sur l'activité des dépôts et les registres de paquets, pas sur les pages d'accueil.

**R8. Ne pas compter sur Supabase pour le hors-ligne.** Position officielle tenue depuis 2023, non démentie [35], et l'acqui-hire de Triplit s'est accompagné de la déclaration explicite qu'il ne serait pas intégré [36]. Base : confiance haute.

**R9. Servir la photo de fond depuis la même origine, ou avec CORS correct**, sinon `toBlob()` lève `SecurityError` [21]. **Vérifier `blob.type` après coup** plutôt que faire confiance au paramètre de format [21]. En Worker, **ajouter explicitement les polices à `self.fonts`** : rien n'est hérité du document [24].


### Pour la feuille de route

**R10. Construire une sonde de stockage tôt, avant décembre.** C'est la conséquence directe du constat n°4 : les retours de terrain sur les PWA n'existent pas publiquement, donc les deux questions restées ouvertes — survie à la désinstallation, et partage réel vers Instagram — ne se règlent que par un test sur appareil réel. Deux prototypes d'une soirée chacun remplacent des heures de recherche documentaire qui ne donneront rien.

---

## Questions ouvertes

| # | Question | Ce qu'il faudrait pour y répondre |
|---|---|---|
| QO-1 | Que deviennent IndexedDB et Cache Storage à la désinstallation d'une web app sur iOS, et d'un WebAPK sur Android ? | Test sur appareil réel. Deux tours de recherche n'ont produit aucune source, primaire ou secondaire [7]. |
| QO-2 | Le stockage survit-il à une sauvegarde iCloud puis restauration ? | La liste Apple officielle du contenu d'une sauvegarde, non remontée ; ou un test sur appareil. Les seules sources trouvées étaient des fermes de contenu, écartées. |
| QO-3 | `navigator.share({files})` atteint-il réellement Instagram Stories depuis une PWA en 2026 ? | Test sur iPhone et Android avec Instagram installé. Aucune preuve documentaire n'existe et Meta ne s'engage sur rien [18]. |
| QO-4 | La règle des sept jours de Safari est-elle encore en vigueur, et sous quelle forme ? | La page WebKit « Tracking Prevention Policy », non ouverte. **Sans effet sur la décision** : le mode persistant exempte de l'éviction quoi qu'il en soit [1]. |
| QO-5 | `OffscreenCanvas` est-il supporté sur Safari iOS ? | Source primaire WebKit ; les agrégateurs disent 16.4 ou 17 sans concorder. Arbitre le choix Canvas 2D contre OffscreenCanvas. |
| QO-6 | Les prérequis Postgres de `zero-cache` sont-ils satisfaits par un Supabase managé ? | Documentation Zero et Supabase, ou un essai. Conditionne R7. |
| QO-7 | « Last-write-wins » suffit-il pour un utilisateur unique sur plusieurs appareils ? | Aucun retour de terrain chiffré n'existe. La question est probablement mal posée à cette échelle — à trancher par le choix de moteur, qui l'encapsule. |

---

## Annexe des sources

| # | Ce qu'elle étaye | Éditeur | Publié | Consulté | Confiance |
|---|---|---|---|---|---|
| [1] | Politique de stockage WebKit, exemption du mode persistant, quotas, LRU | [WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/) | 2023-08-10 | 2026-08-18 | haute |
| [2] | Plafond de 7 jours, compteur propre des web apps installées | [WebKit](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/) | 2020-03-24 | 2026-08-18 | haute |
| [3] | Quotas et critères d'éviction, `persist()`, `localStorage` 5 Mio | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) | 2026-01-05 | 2026-08-18 | haute |
| [4] | Quotas Chrome, absence d'éviction temporelle, `estimate()` | [web.dev](https://web.dev/articles/storage-for-the-web) | 2024-09-23 | 2026-08-18 | haute |
| [5] | Maintien des web apps sur l'écran d'accueil dans l'UE | [Apple Developer](https://developer.apple.com/support/dma-and-apps-in-the-eu/) | 2024-03 | 2026-08-18 | haute |
| [6] | Storage Buckets absent de toutes les versions de Safari | [caniuse](https://caniuse.com/wf-storage-buckets) | 2026-07 | 2026-08-18 | haute |
| [7] | Procédure de désinstallation d'une PWA, sans mention du sort des données | [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing) | 2026-05-15 | 2026-08-18 | haute |
| [8] | Témoignage : `persist()` à redemander à chaque ouverture | [Apple Developer Forums](https://developer.apple.com/forums/thread/710157) | 2022-07 → 2023-02 | 2026-08-18 | basse |
| [9] | Témoignage : pertes IndexedDB aléatoires sur iOS 17.4.x (contexte Cordova) | [Apple Developer Forums](https://developer.apple.com/forums/thread/750122) | 2024-04 | 2026-08-18 | basse |
| [10] | Case « Also delete data from Chrome » à la désinstallation (desktop) | [Google Chrome Help](https://support.google.com/chrome/answer/9658361) | n/d | 2026-08-18 | moyenne — page non ouverte |
| [11] | Hibernation Android : cache et artefacts de compilation | [Android Developers](https://developer.android.com/topic/performance/app-hibernation) | n/d | 2026-08-18 | basse — page non ouverte |
| [12] | Web Push réservé aux web apps installées sur iOS | [WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) | 2023-02 | 2026-08-18 | moyenne |
| [13] | Safari 26.0 : « every site can be a web app on iOS » | [WebKit](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) | 2025-09 | 2026-08-18 | moyenne |
| [14] | `navigator.share()` : conditions d'appel, types, rejets | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) | 2026-07-16 | 2026-08-18 | haute |
| [15] | `canShare()` : ce qu'il valide et ce qu'il ne peut pas anticiper | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/canShare) | 2025-06-23 | 2026-08-18 | moyenne |
| [16] | Versions de support de Web Share et du paramètre `files` | [caniuse](https://caniuse.com/mdn-api_navigator_share_data_files_parameter) | 2026 | 2026-08-18 | moyenne |
| [17] | Source périmée, écartée pour les affirmations de compatibilité | [web.dev](https://web.dev/articles/web-share) | 2019-11-08 | 2026-08-18 | basse |
| [18] | Instagram Stories : chemins natifs uniquement, App ID requis | [Meta](https://developers.facebook.com/docs/instagram-platform/sharing-to-stories/) | n/d | 2026-08-18 | moyenne |
| [19] | Facebook Stories : chemins natifs uniquement, aucune mention du web | [Meta](https://developers.facebook.com/docs/sharing/sharing-to-stories/) | n/d | 2026-08-18 | haute |
| [20] | `FontFaceSet.load()` : raccourci CSS avec taille obligatoire | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/load) | 2026-06-09 | 2026-08-18 | haute |
| [21] | `toBlob()` : repli PNG silencieux, `SecurityError` si non origin-clean | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) | 2026-02-12 | 2026-08-18 | haute |
| [22] | `OffscreenCanvas` : `convertToBlob()`, formats non précisés | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) | 2024-10-26 | 2026-08-18 | basse |
| [23] | Web Share Level 2 (partage de fichiers) annoncé avec Safari 15 | [WebKit](https://webkit.org/blog/11989/new-webkit-features-in-safari-15/) | 2021-10-26 | 2026-08-18 | haute |
| [24] | `FontFaceSource` inclus dans `WorkerGlobalScope` ; cas `OffscreenCanvas` nommé | [W3C CSS WG](https://drafts.csswg.org/css-font-loading/) | draft vivant | 2026-08-18 | haute |
| [25] | La spec canvas ne décrit aucun repli pour une police non chargée | [WHATWG](https://html.spec.whatwg.org/multipage/canvas.html#text-styles) | standard vivant | 2026-08-18 | moyenne |
| [26] | Bug `share()` → `undefined` : ouvert, mais douteux selon son rapporteur | [bugs.webkit.org](https://bugs.webkit.org/show_bug.cgi?id=289603) | 2025-03 | 2026-08-18 | haute |
| [27] | Bug exception sur appels multiples : corrigé en 2022 | [bugs.webkit.org](https://bugs.webkit.org/show_bug.cgi?id=243652) | 2022-08 | 2026-08-18 | haute |
| [28] | Régression iOS 16.4.1 : « Save to photos » disparue de la feuille | [Apple Developer Forums](https://developer.apple.com/forums/thread/729782) | 2023-05 | 2026-08-18 | moyenne |
| [29] | Partage image vers Instagram : OK Android, échec Safari iOS | [Apple Developer Forums](https://developer.apple.com/forums/thread/665812) | 2020-11 → 2022-08 | 2026-08-18 | moyenne |
| [30] | Refus WebKit de Background Sync et de sa variante périodique | [bugs.webkit.org](https://bugs.webkit.org/show_bug.cgi?id=204117) | 2019-12-10 | 2026-08-18 | haute |
| [31] | Position officielle WebKit toujours « Needs position » | [GitHub WebKit](https://github.com/WebKit/standards-positions/issues/14) | ouverte | 2026-08-18 | haute |
| [32] | La spec Background Sync est un « UNOFFICIAL DRAFT » | [WICG](https://wicg.github.io/background-sync/spec/) | draft vivant | 2026-08-18 | moyenne |
| [33] | Doc Workbox de 2017 : exemple de rétention à 24 h | [Chrome for Developers](https://developer.chrome.com/docs/workbox/modules/workbox-background-sync) | 2017-11-27 | 2026-08-18 | moyenne |
| [34] | Ticket fondateur de `forceSyncFallback` | [GitHub Workbox](https://github.com/GoogleChrome/workbox/issues/2393) | n/d | 2026-08-18 | basse |
| [35] | Supabase : pas de local-first natif, position tenue depuis 2023 | [GitHub Supabase](https://github.com/orgs/supabase/discussions/357) | 2023-06 → 2025-01 | 2026-08-18 | haute |
| [36] | Triplit acqui-hiré sans être intégré à la plateforme | [Supabase](https://supabase.com/blog/triplit-joins-supabase) | 2025-10 | 2026-08-18 | moyenne |
| [37] | Retour de terrain 2026 sur Zero, LiveStore, ElectricSQL, Triplit | [johnny.sh](https://johnny.sh/blog/choosing-a-sync-engine-in-2026/) | 2026-03-09 | 2026-08-18 | moyenne |
| [38] | Background Fetch : `version_added: false` pour Safari et Safari iOS | [MDN browser-compat-data](https://github.com/mdn/browser-compat-data/blob/main/api/BackgroundFetchManager.json) | 2026-08 | 2026-08-18 | haute |
| [39] | Demande d'implémentation Background Fetch : `NEW`, inerte depuis 2021 | [bugs.webkit.org](https://bugs.webkit.org/show_bug.cgi?id=214548) | 2021-11-03 | 2026-08-18 | haute |
| [40] | Aucune entrée Background Fetch ni Background Sync au suivi WebKit | [WebKit](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/features.json) | 2026-08 | 2026-08-18 | moyenne |
| [41] | Sept notes Safari 26.0 → 26.6 : zéro mention de synchronisation en arrière-plan | [WebKit](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) | 2025-09 → 2026 | 2026-08-18 | haute / moyenne selon les billets |
| [42] | Code Workbox v7 : `forceSyncFallback`, rétention 7 jours, rejeu au démarrage | [GitHub Workbox](https://github.com/GoogleChrome/workbox/blob/v7/packages/workbox-background-sync/src/Queue.ts) | 2026-08 | 2026-08-18 | haute |
| [43] | Cadence de publication de Workbox, licence MIT | [npm](https://registry.npmjs.org/workbox-background-sync) | 2026-05-04 | 2026-08-18 | haute |
| [44] | Santé du dépôt PowerSync, `@powersync/web` 2.2.0, Apache-2.0 | [GitHub](https://github.com/powersync-ja/powersync-js) | 2026-08 | 2026-08-18 | haute |
| [45] | SQLite WASM, VFS, consigne Safari `OPFSCoopSyncVFS` | [PowerSync](https://docs.powersync.com/client-sdk-references/javascript-web) | courante | 2026-08-18 | haute |
| [46] | Paliers tarifaires PowerSync et « Open Edition » | [PowerSync](https://www.powersync.com/pricing) | courante | 2026-08-18 | haute / moyenne sur la licence |
| [47] | Zero GA depuis mars 2026 ; tarifs Hobby et Professional | [Rocicorp](https://zero.rocicorp.dev/docs/status) | 2026-03 | 2026-08-18 | haute |
| [48] | Activité de `rocicorp/mono`, `@rocicorp/zero` 1.9.0, Apache-2.0 | [GitHub](https://github.com/rocicorp/mono) | 2026-08 | 2026-08-18 | haute |
| [49] | Replicache en mode maintenance ; nuance sur l'archivage de 2022 | [Rocicorp](https://replicache.dev/) | 2026-08 | 2026-08-18 | haute |
| [50] | RxDB vivant, réplication dans le palier gratuit | [GitHub](https://github.com/pubkey/rxdb) | 2026-08 | 2026-08-18 | haute / moyenne sur les montants |
| [51] | Dexie Cloud : cadence, tarifs, cible « quelques utilisateurs, plusieurs appareils » | [GitHub](https://github.com/dexie/Dexie.js) | 2026-08 | 2026-08-18 | haute |
| [52] | Legend-State : canal stable figé depuis 2024-08, v3 en bêta | [GitHub](https://github.com/LegendApp/legend-state) | 2026-08 | 2026-08-18 | haute |

---

## Carte de péremption

Calculée par `recon_kit.py staleness` sur le registre du memlog, avec les fenêtres du pack technique — compatibilité 1 mois, écosystème 6 mois, comportement d'exécution 12 mois, pratique de terrain 6 mois. **Quatre affirmations sur dix sont déjà périmées au sens de ces fenêtres.**

| Réf. | Affirmation | Classe | Publié | À revérifier | Périmée ? |
|---|---|---|---|---|---|
| S2 · [2] | La règle des 7 jours de Safari — **déjà disputée** | comportement-runtime | 2020-03 | 2021-03 | **oui** |
| S1 · [1] | Le mode persistant exempte de l'éviction | comportement-runtime | 2023-08 | 2024-08 | **oui** |
| P1 · [28] | Les cibles de la feuille de partage ne sont pas un contrat | comportement-runtime | 2023-05 | 2024-05 | **oui** |
| S3 · [6] | Storage Buckets absent de Safari | version-compat | 2026-07 | 2026-08 | **oui** |
| Y1 · [38] | Background Fetch non implémentée sur Safari | version-compat | 2026-08 | 2026-09 | non |
| Y2 · [41] | Aucun revirement dans Safari 26.0 → 26.6 | version-compat | 2026-08 | 2026-09 | non |
| P2 · [18] | Meta ne documente aucun chemin web vers Stories | pratique-terrain | 2026-08 | 2027-02 | non |
| Y4 · [44] | Santé des moteurs de synchronisation | sante-ecosysteme | 2026-08 | 2027-02 | non |
| P3 · [24] | `FontFaceSet` exposé aux Workers, source vide | comportement-runtime | 2026-08 | 2027-08 | non |
| Y3 · [42] | Rétention Workbox : 7 jours, pas 24 h | comportement-runtime | 2026-08 | 2027-08 | non |

**Lecture.** Les quatre périmées le sont parce qu'elles reposent sur des publications anciennes qui décrivent un comportement encore courant — c'est une alerte sur l'âge de la preuve, pas sur sa fausseté. Deux d'entre elles portent le cœur du rapport : **S1, le mécanisme de continuité [1], mérite d'être revérifié avant de coder le noyau**, et **S2 est déjà signalée comme disputée**. La plus proche échéance réelle est **septembre 2026** pour les deux affirmations de compatibilité liées à Safari — soit avant l'échéance de décembre.

`bmad-deep-recon` en mode Refresh reprend cette table comme ordre de travail.
