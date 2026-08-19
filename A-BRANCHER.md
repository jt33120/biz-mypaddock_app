# À brancher — ce que le code ne peut pas faire tout seul

Le récit 1.2 est en place côté application : compte, session qui tient hors ligne,
adoption de ce qui a été saisi avant, connecteur PowerSync écrit et câblé.
Ce qui suit se clique dans des consoles, et personne d'autre que toi ne peut le faire.

**Pour créer ton compte sur ton téléphone : rien à faire, c'est déjà en place.**
Seul le 3 attend encore un geste, et il ne concerne que la synchronisation
continue — la sauvegarde par geste marche sans lui.

---

## 1 · Vercel — rien à faire ✅

Vérifié le 19 août sur le paquet réellement servi par `mypaddock.vercel.app` :
`VITE_APP_NAME`, `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` sont bien
en place, et le titre servi est le bon. L'onglet COMPTE montre donc un vrai
formulaire sur ton téléphone, pas le message « Sauvegarde non configurée ».

Rappel pour plus tard : ces variables sont figées **au build**, pas lues à
l'exécution. En changer une exige un redéploiement.

## 2 · Supabase — rien à faire non plus ✅

Tu peux créer ton compte **maintenant**, sans toucher à aucune console.

Le déroulé : *Créer mon compte* → un e-mail arrive → tu cliques le lien → il ouvre
Safari sur une page qui peut sembler vide ou cassée, **aucune importance, la
confirmation a eu lieu au clic** → tu reviens dans l'application → *J'ai confirmé
— me connecter*. L'écran le dit mot pour mot, il n'y a rien à retenir.

**Un seul piège, et il n'a rien d'évident.** Le fournisseur d'e-mail par défaut de
Supabase n'écrit qu'aux adresses rattachées au projet. Inscris-toi avec **l'adresse
de ton compte Supabase** : avec une autre, rien n'arrivera, et ça ressemblera à une
panne alors que c'est une règle d'expédition.

### Deux améliorations facultatives, quand tu voudras

- Authentication → Emails → *Confirm signup* : ajouter `{{ .Token }}` au gabarit.
  L'e-mail portera alors un code à six chiffres, et l'application a déjà le champ
  pour le recevoir — la session s'ouvre **sans quitter l'application**, ce qui est
  plus propre qu'un aller-retour par Safari. Purement du confort.
- **Avant toute campagne Meta**, deux choses deviennent obligatoires, et elles
  rejoignent QO-11 : un **SMTP personnalisé** (sinon aucun inconnu ne recevra quoi
  que ce soit, voir le piège ci-dessus), et un **quota de génération par compte
  côté serveur** — le sprite coûte environ 0,16 € l'unité, mille curieux à trois
  essais font 480 € sans un euro de recette.

## 3 · PowerSync — branché ✅

Fait le 19 août, de bout en bout, avec ton jeton.

- Instance **`mypaddock`** déployée dans le projet `MyPaddock_app`, région Paris.
  Elle répond : `{"ready":true,"started":true}`.
- `VITE_POWERSYNC_URL` posée dans `.env.local` **et** dans les trois
  environnements Vercel. La synchronisation continue est donc active en
  production dès le prochain déploiement.
- Rôle Postgres dédié **`powersync_role`** : `REPLICATION` + `BYPASSRLS` pour
  répliquer, et les droits d'écriture explicitement retirés. AD-12 vaut aussi
  pour lui. Son mot de passe est dans `.env.local`, jamais dans le dépôt.
- Publication `powersync` sur exactement les 9 tables des flux. Le barème
  constructeur en est absent : il n'est pas synchronisé, son WAL ne servirait à
  rien.

**Un point tranché par la validation, et il vaut la peine d'être retenu :** le bac
à sable de Supabase (Supavisor) **ne supporte pas la réplication logique** — un
multiplexeur de sessions ne peut pas porter un flux de réplication. La connexion
est donc directe sur `db.<ref>.supabase.co`, qui ne publie plus qu'une adresse
IPv6. Ça fonctionne : PowerSync en sort.

Rappel du garde-fou côté application : la synchronisation continue ne s'allume
qu'**après ta première sauvegarde** depuis l'écran Compte. Le journal des
changements écrit avant le compte ne décrit le passé de personne, et le rejouer
échouerait — l'adoption pose l'état, puis le suivi prend le relais.

---

## Correction — le motif de la migration du 19 août était faux

J'ai ajouté `pilote_id` sur `session`, `tour` et `intervention` en invoquant une
contrainte du moteur : « une règle PowerSync ne fait pas de jointure ». **C'est
faux.** Vrai des anciens `bucket_definitions`, faux des Sync Streams en édition 3,
qui acceptent les sous-requêtes, les `INNER JOIN` et les CTE.

Les colonnes restent, sur un motif plus faible mais réel : le flux descendant
s'écrit à plat, le connecteur n'a aucun cas particulier, et les politiques RLS
exigent toujours la cohérence avec le parent — la dénormalisation ne peut pas
diverger de l'ascendance. Ce n'est plus une nécessité, c'est une simplification
assumée. Le modèle strictement normalisé reste atteignable, au prix d'une
migration ; dis-le si tu le préfères.
