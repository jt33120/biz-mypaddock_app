# Épique 23 — Saisir vite, relire net

## 23.1 — Cocher le chargement sans quitter la journée · P0

**Cible:** `src/ecrans/Checklist.tsx`, fonctions `cocher`/`charger`, fumées checklist et journée future.

- Étant donné une journée future et la checklist ouverte, quand deux lignes sont cochées rapidement, alors l'écran, le roulage, l'URL et le panneau ouvert restent inchangés.
- Les deux états et le décompte se mettent à jour immédiatement et persistent après rechargement, y compris hors ligne.
- Si SQLite refuse une coche, l'état canonique est relu sans fermer le panneau ni naviguer ailleurs.
- Les contrôles ne soumettent aucun formulaire et ne créent aucune navigation.

## 23.2 — Objectif, simplement et plusieurs fois · P0

**Cible:** `src/ecrans/Objectifs.tsx`, `src/db/objectifs.ts`, `useGeste`, fumée objectifs.

- Le titre visible est exactement `Objectif` et l'action est `Ajouter un objectif`.
- Deux ajouts successifs ou rapprochés produisent deux lignes stables; aucun appel n'est jeté silencieusement.
- Après rechargement, retirer un objectif ne retire pas l'autre.
- Si l'ajout échoue, la ligne optimiste part, la proposition retirée revient à sa place et un message permet de réessayer; aucun tap n'est perdu silencieusement.
- Un objectif ne devient ni une case à cocher ni un résultat atteint.

## 23.3 — Trois accès Atelier sur une ligne

**Cible:** `src/ecrans/Atelier.tsx`, `src/styles/systeme.css`, fumée Atelier.

- À 375, 390 et 430 px, trois raccourcis compacts restent sur une ligne sans débordement.
- Chaque raccourci conserve une icône, un libellé court, une cible tactile et ouvre la bonne liste.
- Les détails, chiffres et descriptions restent dans la page ouverte plutôt que dans les trois raccourcis.

## 23.4 — Noter une dépense depuis tout accueil

**Cible:** `Accueil` dans `src/App.tsx`, `NoterUneDepense`/`Ajouter` dans `src/ecrans/Budget.tsx`, styles et fumées Accueil/Budget.

- Sur un accueil vide ou rempli, `Noter une dépense` est visible et ouvre une saisie isolée en un geste.
- Le montant est le premier champ; poste, cible, date et libellé suivent sans perdre les règles d'année et de machine.
- Avec plusieurs machines, aucune machine n'est choisie silencieusement.
- Enregistrer ferme la saisie, confirme le montant et relit le total de saison; annuler revient à la lecture sans écrire.

## 23.5 — Aujourd'hui, à venir, passés

**Cible:** `Roulages`/`LigneRoulage` dans `src/App.tsx`, `listerRoulages` dans `src/db/depot.ts`, tests purs et fumée à venir.

- Une journée appartient à une seule section : `Aujourd'hui`, `À venir` ou `Passés`.
- Les futures sont classées de la plus proche à la plus lointaine; les passées de la plus récente à la plus ancienne.
- Chaque section vide s'énonce brièvement et toutes les cartes restent ouvrables, modifiables et supprimables.
- La journée du jour conserve le prédicat existant de préparation ou de bilan.

## 23.6 — Statut et marqueur de crash

**Cible:** modèle `roulage`, migration Supabase, schéma/synchronisation PowerSync, `listerRoulages`, `LigneRoulage`, icône pixel et fumée chute.

- Un roulage neuf commence à `À renseigner`; le pilote peut déclarer `Aucun crash` ou consigner un crash.
- Le choix apparaît dans la lecture du bilan, reste facultatif et ne bloque ni ne relance jamais le pilote.
- Consigner une chute place le roulage en `Crash documenté`; retirer la dernière chute ne transforme pas silencieusement ce fait en `Aucun crash`.
- Le serveur fait converger ce tri-état malgré des écritures PowerSync reçues dans un autre ordre : `Aucun crash` ne peut jamais coexister avec une chute.
- Une carte sans chute ne porte aucun marqueur; une carte avec une ou plusieurs chutes affiche l'icône dédiée et `Crash` ou `N crashs`.
- La création et la synchronisation écrivent explicitement tout champ serveur non nullable.

## 23.7 — Dossier de crash relié

**Cible:** `src/ecrans/Chute.tsx`, `src/db/chute.ts`, `src/db/photos.ts`, `src/db/atelier.ts`, `src/db/budget.ts`, `src/db/emporter.ts`, schéma/sauvegarde et fumées Chute/Atelier/Budget/Emport.

- Une photo ajoutée depuis une chute porte `chute_id` et reste lisible après rechargement et sur un second appareil.
- Écrire une photo puis échouer à rafraîchir l'écran ne la classe pas comme versement raté et ne propose jamais de la téléverser une seconde fois.
- Retirer une photo écrit d'abord une demande durable; l'écran distingue un refus SQLite, une suppression distante différée et un nettoyage local à reprendre. Les tombstones restent invisibles dans le carnet et l'export.
- Une réparation créée depuis la chute porte `intervention.chute_id`, apparaît aussi dans l'Atelier et explique l'absence de machine plutôt que de créer un lien incomplet.
- La dépense associée alimente une fois le budget; la fiche affiche le total des réparations liées sans créer un second coût.
- L'export conserve les relations et mentionne `historique auto-déclaré`.

## 23.8 — Compte conventionnel

**Cible:** `src/ecrans/Compte.tsx`, styles, fumées Compte/Confirmation/Emport/Coffre/Légal.

- L'écran regroupe `Connexion`, `Sauvegarde`, `Données et confidentialité`, `Diagnostic`; la zone sensible reste en dernier.
- Un pilote connecté voit en premier son email et l'état de sauvegarde.
- Export, photos, mesures, légal, diagnostic, déconnexion et suppression restent accessibles.
- Aucun avatar, pseudo ou modèle de profil fictif n'est ajouté.

## 23.9 — Lecture par défaut, actions directes

**Cible:** surfaces modifiées des stories 23.2 à 23.8, règles éditoriales et revue visuelle/clavier.

- Un écran de lecture n'affiche pas de formulaire complet avant une action explicite.
- Enregistrer ou annuler restaure le mode lecture.
- Les titres font un à trois mots; les boutons suivent `verbe + objet`.
- Les mentions de sûreté, sauvegarde, provenance et incertitude restent intactes.

## 23.10 — Vidéo durable · différée

Le spike doit éprouver MP4 et MOV/HEVC réels sur l'iPhone cible, hors ligne puis au retour du réseau. Le passage en implémentation exige un upload reprenable, stockage privé, quota explicite, suppression/export et lecture sur un second appareil. Une URL externe ou une vidéo uniquement locale n'est pas une pièce jointe durable.

## Gate de livraison

- `npm run types`, `npm run lint`, `npm run essais:unite`, `npm run build`.
- Fumées ciblées Objectif, Checklist, Accueil/Budget, Roulages, Chute, Atelier, Compte et Emport.
- Deux boucles visuelles aux largeurs 375, 390 et 430 px, puis revue fonctionnelle, accessibilité, persistance et synchronisation.
- Commits atomiques sur branche isolée; push, fusion rapide dans `main`, contrôle de `origin/main` et du build déployé.

## Verdict d’implémentation · 2026-08-26

- `npm run types`, `npm run lint`, `npm run build` et `git diff --check` : verts.
- Tests unitaires : 160 / 160.
- Banc navigateur : 29 / 29 parcours, soit 30 suites vertes avec les unitaires.
- Revue visuelle et tactile : 375, 390 et 430 px, sans débordement ; cibles critiques à 44 px minimum et parcours clavier vérifiés.
- Les cinq migrations `160000` à `160400` passent ensemble sur la base liée dans une transaction annulée.
- La vidéo durable reste explicitement différée au spike 23.10 ; elle ne fait pas partie de ce verdict.
