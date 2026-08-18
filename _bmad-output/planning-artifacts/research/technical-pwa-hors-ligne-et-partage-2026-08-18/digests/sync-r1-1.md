---
dimension: D3 — synchronisation et local-first
round: 1
assistant: 1
date: 2026-08-18
sources_lues: 8
outils: 12
---

## Constats

**1. WebKit a explicitement refusé Periodic Background Sync dans son propre traqueur, « We oppose this feature and will not implement it » (Maciej Stachowiak). Bug fermé RESOLVED / WONTFIX.**
— source: https://bugs.webkit.org/show_bug.cgi?id=204117 | éditeur: WebKit (Apple) | publié: 2019-12-10 | consulté: 2026-08-18 | confiance: haute (sur le refus) / moyenne (sur son actualité en 2026) | classe: version-compat

**2. Les motifs du refus sont structurels, pas conjoncturels :** vie privée (traçage par IP, exfiltration), sécurité (botnets, persistance après que l'utilisateur a cessé de visiter le site, domaines rachetables), batterie, absence de section « Security Considerations » dans la spec, statut « Chromium-only ». **Background Fetch est cité par WebKit comme l'alternative plus sûre.**
— source: https://bugs.webkit.org/show_bug.cgi?id=204117 | éditeur: WebKit | publié: 2019-12-10 | consulté: 2026-08-18 | confiance: haute | classe: version-compat

**3. Le même bug indique que WebKit s'oppose aussi à l'API Background Sync de base (one-shot), pas seulement à la variante périodique.**
— source: https://bugs.webkit.org/show_bug.cgi?id=204117 | éditeur: WebKit | publié: 2019-12-10 | consulté: 2026-08-18 | confiance: haute | classe: version-compat

**4. Sur le traqueur officiel des positions WebKit, Web Background Synchronization est toujours « Needs position » : issue ouverte, assignée à annevk, beidson, youennf, étiquetée « battery life » et « privacy ». Aucune position formelle publiée.**
— source: https://github.com/WebKit/standards-positions/issues/14 | éditeur: WebKit | publié: issue ouverte | consulté: 2026-08-18 | confiance: haute | classe: version-compat

**5. La spécification Background Sync n'est pas une norme : filigrane « UNOFFICIAL DRAFT », ni standard W3C ni sur le W3C Standards Track.**
— source: https://wicg.github.io/background-sync/spec/ | éditeur: WICG | publié: brouillon vivant | consulté: 2026-08-18 | confiance: moyenne | classe: version-compat
— source: https://github.com/mdn/browser-compat-data/issues/28155 | éditeur: MDN BCD | consulté: 2026-08-18 | confiance: moyenne | classe: sante-ecosysteme

**6. `workbox-background-sync` a un repli documenté : « In browsers that don't natively support the BackgroundSync API, Workbox Background Sync will automatically attempt a replay whenever your service worker starts up. » File persistée en IndexedDB, `maxRetentionTime` en minutes (exemple documenté : `24 * 60` = 24 h) au-delà duquel les requêtes EXPIRENT.**
— source: https://developer.chrome.com/docs/workbox/modules/workbox-background-sync | éditeur: Google / Chrome for Developers | publié: page datée « Last updated 2017-11-27 » | consulté: 2026-08-18 | confiance: moyenne | classe: comportement-runtime

**7. Ce repli est structurellement plus faible que l'API native : le rejeu se déclenche au démarrage du service worker, pas au retour de la connectivité, ce qui suppose que la page contrôlant le SW soit active. La doc le concède : « it won't be quite as effective ».**
— source: https://developer.chrome.com/docs/workbox/modules/workbox-background-sync | éditeur: Google | publié: 2017-11-27 | consulté: 2026-08-18 | confiance: moyenne | classe: comportement-runtime

**8. Défaut de terrain connu du repli : le SW peut ne pas détecter que le navigateur ne supporte pas l'API, si bien que ni l'API native ni le repli ne fonctionnent ; le listener de sync n'étant appelé que la première fois qu'il est ajouté, rien d'autre que l'installation d'un nouveau SW ne relance la file. L'option `forceSyncFallback: true` a été ajoutée pour forcer le rejeu au démarrage.**
— source: https://github.com/GoogleChrome/workbox/issues/2393 | éditeur: GoogleChrome/workbox | consulté: 2026-08-18 | confiance: basse-moyenne | classe: pratique-terrain
— source: https://developer.chrome.com/docs/workbox/modules/workbox-background-sync | éditeur: Google | publié: 2017-11-27 | consulté: 2026-08-18 | confiance: moyenne | classe: comportement-runtime

**9. Supabase n'a JAMAIS livré de support local-first natif. Dernière prise de position officielle (kiwicopple), juin 2023 : Supabase continuera de s'appuyer sur des outils tiers (Legend-State, Replicache, WatermelonDB, RxDB, PowerSync-Supabase, ElectricSQL). Motif : il faudrait exposer via API un historique horodaté complet de chaque événement (Write Ahead Log), sans solution sur étagère.**
— source: https://github.com/orgs/supabase/discussions/357 | éditeur: Supabase | publié: 2023-06 ; commentaires jusqu'à 2025-01 | consulté: 2026-08-18 | confiance: haute | classe: sante-ecosysteme

**10. Aucune fonctionnalité offline-first officielle Supabase n'est annoncée, ni alpha, ni bêta, ni GA. La discussion #357 est la plus votée de l'org ; sentiment communautaire dégradé (janvier 2025 : des développeurs se disent « trompés » par le positionnement « Open Source Firebase Alternative »).**
— source: https://github.com/orgs/supabase/discussions/357 | éditeur: Supabase | publié: dernière activité 2025-01 | consulté: 2026-08-18 | confiance: haute | classe: sante-ecosysteme

**11. Supabase a acqui-hiré l'équipe Triplit, mais a déclaré que l'objectif n'est PAS d'intégrer Triplit à la plateforme : Matt Linkous étendra les intégrations tierces (ElectricSQL, Zero, PowerSync). Triplit passe en maintenance communautaire.**
— source: https://supabase.com/blog/triplit-joins-supabase | éditeur: Supabase | publié: 2025-10 approx. | consulté: 2026-08-18 | confiance: moyenne | classe: sante-ecosysteme
— source: https://johnny.sh/blog/choosing-a-sync-engine-in-2026/ | éditeur: johnny.sh | publié: 2026-03-09 | consulté: 2026-08-18 | confiance: moyenne | classe: sante-ecosysteme

**12. Retour de terrain 2026 (deux mois d'essais réels, app en production) : Zero (Rocicorp) retenu et « just works », intégration propre avec Drizzle ORM, faible empreinte client, mais sans presence temps réel.**
— source: https://johnny.sh/blog/choosing-a-sync-engine-in-2026/ | éditeur: johnny.sh | publié: 2026-03-09 | consulté: 2026-08-18 | confiance: moyenne (témoignage unique) | classe: pratique-terrain

**13. Même retour : LiveStore loué pour son architecture et dogfoodé en production (Overtone), mais limitation structurelle — « one user must correspond to one sqlite instance » — inadapté au multi-utilisateurs.**
— source: https://johnny.sh/blog/choosing-a-sync-engine-in-2026/ | éditeur: johnny.sh | publié: 2026-03-09 | consulté: 2026-08-18 | confiance: moyenne (témoignage unique) | classe: pratique-terrain

**14. CROYANCE NON VÉRIFIÉE (source unique) : ElectricSQL + TanStack DB jugé inutilisable après deux mois — long polling « extremely slow and brittle », écritures client exigeant des endpoints HTTP sur mesure.** Un seul post-mortem, règle de double source non satisfaite, **à ne pas traiter comme un échec établi**.
— source: https://johnny.sh/blog/choosing-a-sync-engine-in-2026/ | éditeur: johnny.sh | publié: 2026-03-09 | consulté: 2026-08-18 | confiance: basse | classe: pratique-terrain

**15. Sur la résolution de conflits, le consensus des sources secondaires : LWW perd des écritures concurrentes par conception, mais ce coût est acceptable quand le champ est atomique et le remplacement sémantiquement correct, inacceptable pour du texte collaboratif. Les systèmes de production réels sont souvent hybrides.**
— source: https://dzone.com/articles/conflict-resolution-using-last-write-wins-vs-crdts | éditeur: DZone | consulté: 2026-08-18 | confiance: basse | classe: pratique-terrain
— source: https://www.iankduncan.com/engineering/2025-11-27-crdt-dictionary/ | éditeur: Ian Duncan | publié: 2025-11-27 | consulté: 2026-08-18 | confiance: basse | classe: pratique-terrain

**16. Contrepoint sur les CRDT : le ramassage de miettes est cité comme l'un des problèmes pratiques les plus difficiles en production — les CRDT convergent en accumulant l'information de façon monotone.**
— source: https://www.iankduncan.com/engineering/2025-11-27-crdt-dictionary/ | éditeur: Ian Duncan | publié: 2025-11-27 | consulté: 2026-08-18 | confiance: basse | classe: pratique-terrain

## Contradictions

**A. Position WebKit : refus explicite au bug tracker contre « position needed » au traqueur officiel.** Le bug 204117 contient une opposition nominative et sans ambiguïté (2019-12), clos WONTFIX. Mais WebKit/standards-positions#14, canal *officiel* des positions, reste ouvert et « Needs position ». **Non lissé :** le signal opérationnel est le même (rien n'a été implémenté), mais le statut de gouvernance est ambigu, ce qui laisse ouverte la possibilité d'un revirement qu'un WONTFIX de 2019 ne permet pas de préjuger seul.

**B. Fraîcheur invalide sur les deux affirmations les plus portantes.** La preuve WebKit la plus nette date de **décembre 2019** ; la doc `workbox-background-sync` affiche « Last updated **2017-11-27** ». Aucune n'a pu être revérifiée contre Safari 26.x ni contre la version courante de Workbox. **Constats 1-3 et 6-7 : probablement toujours vrais mais formellement non revérifiés.**

**C. Statut de Triplit : « abandonné » contre « davantage open-sourcé ».** johnny.sh le classe parmi les projets abandonnés (équipe acqui-hirée, maintenance communautaire, viabilité douteuse). Le blog Supabase présente le même événement comme une continuité positive. Factuellement compatibles, opposés en implication décisionnelle : un projet dont l'équipe fondatrice travaille désormais sur autre chose n'est pas un projet soutenu, quel que soit l'état de son dépôt.

**D. Date de l'acqui-hire Triplit : août 2025 contre octobre 2025.** johnny.sh écrit « August 2025 » ; les traces de l'annonce (HN 45535375, localfirstnews 2025-10-09) situent la publication en octobre. Écart non résolu.

**E. LWW « suffisant » contre « inacceptable ».** D'un côté « Last Write Wins is fine for hobby projects, but if you value your users' data you must step into CRDTs and Event Sourcing » ; de l'autre, LWW-Register parfaitement acceptable quand la granularité du champ correspond à la sémantique du remplacement. Aucune des deux positions n'est étayée par des chiffres de production. **Le désaccord porte en réalité sur le type de donnée, pas sur le mécanisme** — mais sans source primaire pour l'établir.

## Pistes

- **Background Fetch** — cité par WebKit *dans son propre refus* comme l'alternative plus sûre. Seule alternative nommée positivement par WebKit ; support réel iOS 2026 non vérifié. **Première requête du prochain tour.**
- **Safari 26.x release notes sur webkit.org/blog** — vérifier un éventuel revirement 2025-2026. Lacune de fraîcheur n°1.
- **`forceSyncFallback`** — comportement exact dans la version courante ; lire `packages/workbox-background-sync/src/Queue.ts` plutôt que la doc de 2017.
- **Zero / Rocicorp** — seul moteur retenu par un praticien après essai comparatif ; licence, modèle économique et statut GA non couverts. Rocicorp a déjà pivoté une fois (Replicache → Zero) : contrôle d'historique nécessaire.
- **PowerSync** — cité par Supabase comme partenaire visé et comme voie plug-and-play Supabase + offline. **Candidat le plus directement pertinent, aucune vérification indépendante dans ce tour.**
- **Legend-State** — dans la liste officielle Supabase (2023), absent de toute comparaison 2026 lue. Angle mort.
- **OPFS (Origin Private File System)** — un résultat affirme un support cross-browser complet en 2026, ce qui changerait les options de stockage local sur iOS ; **non vérifié, piste et non fait**.
- **`fetch` interception + file IndexedDB maison** — la question 3 mérite un tour dédié ; seule la voie Workbox a été trouvée.

## Ce que j'ai cherché et pas trouvé

- **Aucune position WebKit datée de 2025 ou 2026 sur Background Sync.** Le seul document formel est ouvert et sans position ; la seule déclaration explicite a près de sept ans. L'absence d'activité récente sur l'issue est elle-même un signal : le sujet n'est pas en mouvement côté Apple.
- **Aucune note de version Safari lue.** Aucune page webkit.org/blog récupérée. **La vérification de fraîcheur exigée n'a donc PAS été effectuée — faiblesse principale de ce digest.**
- **Aucune métrique de dépôt dans le temps.** Budget épuisé avant. Les jugements de santé sur ElectricSQL, LiveStore, Zero et Triplit reposent sur **un seul billet de blog**, pas sur des données de dépôt.
- **Rien de vérifié sur RxDB, Yjs, Automerge, WatermelonDB, TinyBase, Dexie Cloud, Jazz, Evolu.** Huit bibliothèques de la liste demandée sans aucune source. Leur absence des comparatifs 2026 lus n'est **pas** une preuve d'abandon.
- **Aucun changement de licence ou de modèle économique confirmé** pour aucun projet, ni preuve qu'il n'y en ait pas eu.
- **Aucun retour de terrain à 6-12 mois sur LWW contre CRDT avec chiffres de production.** Échec le plus net du run : la question demandait des regrets, les résultats sont des tutoriels. **Aucun post-mortem de quelqu'un ayant choisi LWW puis constaté des pertes, ni l'inverse.**
- **Rien sur le cas d'usage saisonnier** — quelques dizaines de sessions par an, changement d'appareil entre deux usages. Aucune source ne traite de la **rétention longue durée** des données locales. Ni l'éviction iOS après des semaines, ni l'expiration de `maxRetentionTime` de Workbox (**seul exemple documenté : 24 h, très en deçà d'un cycle saisonnier**). **Priorité n°1 du prochain tour, avant tout choix de bibliothèque.**
