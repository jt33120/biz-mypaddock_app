# À brancher — ce que le code ne peut pas faire tout seul

Le récit 1.2 est en place côté application : compte, session qui tient hors ligne,
adoption de ce qui a été saisi avant, connecteur PowerSync écrit et câblé.
Ce qui suit se clique dans des consoles, et personne d'autre que toi ne peut le faire.

**Le 2 suffit pour créer ton compte depuis le téléphone.** Le 3 n'est nécessaire
que pour la synchronisation continue — la sauvegarde par geste marche sans lui.

---

## 1 · Vercel — rien à faire ✅

Vérifié le 19 août sur le paquet réellement servi par `mypaddock.vercel.app` :
`VITE_APP_NAME`, `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` sont bien
en place, et le titre servi est le bon. L'onglet COMPTE montre donc un vrai
formulaire sur ton téléphone, pas le message « Sauvegarde non configurée ».

Rappel pour plus tard : ces variables sont figées **au build**, pas lues à
l'exécution. En changer une exige un redéploiement.

## 2 · Supabase — la confirmation d'adresse

Authentication → URL Configuration :

- **Site URL** → `https://mypaddock.vercel.app`
- **Redirect URLs** → la même

Authentication → Emails → *Confirm signup* : **ajouter `{{ .Token }}` au gabarit.**

C'est le point non évident, et il est structurel. Un lien de confirmation s'ouvre
dans Safari, **pas** dans l'application posée sur l'écran d'accueil : les deux ne
partagent pas leur stockage. Le lien authentifierait donc le navigateur et
laisserait l'application dehors. Un code à six chiffres saisi dans l'application
ouvre la session **là où elle sert**. L'écran est déjà prêt à le recevoir.

Repli si tu ne touches pas au gabarit : confirmer par le lien dans Safari, puis
revenir dans l'application et se connecter par mot de passe. Ça marche, c'est
juste un aller-retour de plus.

**Avant toute campagne Meta**, deux choses s'ajoutent ici, et elles rejoignent
QO-11 :
- un **SMTP personnalisé** — le fournisseur par défaut de Supabase n'écrit qu'aux
  membres du projet et plafonne à quelques messages par heure. Avec des inconnus,
  personne ne recevra rien.
- un **quota de génération par compte, côté serveur** — le sprite coûte environ
  0,16 € l'unité ; mille curieux à trois essais font 480 € sans un euro de recette.

## 3 · PowerSync — il manque un projet, pas un jeton

Le jeton du `.env` est bon : il s'authentifie et voit ton organisation `jt33120`.
Il n'y a simplement **rien à l'intérieur** — zéro projet, zéro instance. Un jeton
sert à fabriquer une instance, il n'en est pas une.

Et le CLI (`npx powersync`) sait tout faire **sauf** créer un projet : il crée des
instances *dans* un projet existant. C'est donc le seul clic que je ne peux pas
donner à ta place.

**Ce qu'il te reste à faire, une fois :** sur `dashboard.powersync.com`, créer un
projet dans l'organisation `jt33120`, et me donner son identifiant. Deux minutes.

**Ce qui est déjà prêt**, dans `powersync/` :

- `sync-config.yaml` — ce que chaque pilote reçoit. Six requêtes à plat sur sa
  saison, plus le référentiel. Le barème constructeur en est volontairement
  absent : un flux global le ferait descendre en entier chez quelqu'un qui
  possède une moto. Il lui faudra un flux paramétré par le garage, au mouvement 3.
- `service.yaml` — région Paris, et l'authentification par le **JWKS public** de
  Supabase plutôt que par un secret partagé. Vérifié : ton projet signe en ES256,
  donc aucun secret n'a besoin d'exister des deux côtés.

**Ce que je ferai ensuite**, dès que j'ai l'identifiant du projet :
`powersync link cloud --create` puis `powersync deploy`, et `VITE_POWERSYNC_URL`
se remplit. La synchronisation s'allume alors après ta première sauvegarde.

**Deux valeurs manqueront encore, et une seule vient de toi.**

- Le **rôle de réplication** : je le crée moi-même sur Postgres, avec son propre
  mot de passe, pour que tu n'aies jamais à me confier celui de `postgres`. Il lit
  tout et n'écrit rien — AD-12 vaut aussi pour lui.
- L'**hôte de connexion** : vérifié le 19 août, `db.<ref>.supabase.co` ne publie
  plus d'adresse IPv4, seulement une IPv6. Si le service PowerSync sort en IPv4,
  il faut passer par le bac à sable (Supavisor, mode session). C'est ce que
  `service.yaml` vise par défaut ; le préfixe exact (`aws-0-` ou `aws-1-`) est
  celui affiché dans Supabase → Project Settings → Database.

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
