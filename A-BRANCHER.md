# À brancher — ce que le code ne peut pas faire tout seul

Le récit 1.2 est en place côté application : compte, session qui tient hors ligne,
adoption de ce qui a été saisi avant, connecteur PowerSync écrit et câblé.
Ce qui suit se clique dans des consoles, et personne d'autre que toi ne peut le faire.

L'ordre compte : **1 puis 2 suffisent pour tester le compte sur ton téléphone.**
Le 3 n'est nécessaire que pour la synchronisation continue.

---

## 1 · Vercel — les trois variables du client

Projet `mypaddock` → Settings → Environment Variables → *Production* et *Preview* :

| Variable | Valeur | Pourquoi |
|---|---|---|
| `VITE_APP_NAME` | `MyPaddock` | nom de code, une seule constante (récit 0.3) |
| `VITE_SUPABASE_URL` | l'URL du projet | sinon l'écran Compte annonce « Sauvegarde non configurée » |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | la clé `sb_publishable_…` | **jamais** la `service_role` (AD-15) |

Elles sont dans ton `.env.local`. Un redéploiement est nécessaire après : elles sont
figées **au build**, pas lues à l'exécution.

Pour vérifier sans ouvrir le téléphone : l'onglet COMPTE doit montrer un formulaire,
pas le message « Sauvegarde non configurée ».

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

## 3 · PowerSync — l'instance

`VITE_POWERSYNC_URL` est vide, donc la synchronisation continue est éteinte et
l'application le dit en clair. En attendant, la sauvegarde est un geste : le
bouton dépose l'état sur le serveur, et c'est déjà la promesse tenue.

Pour l'allumer : créer l'instance, la connecter au Postgres Supabase, publier les
tables, puis coller ces règles.

```yaml
bucket_definitions:
  saison_du_pilote:
    parameters: select request.user_id() as pilote_id
    data:
      - select * from machine      where pilote_id = bucket.pilote_id
      - select * from roulage      where pilote_id = bucket.pilote_id
      - select * from session      where pilote_id = bucket.pilote_id
      - select * from tour         where pilote_id = bucket.pilote_id
      - select * from depense      where pilote_id = bucket.pilote_id
      - select * from intervention where pilote_id = bucket.pilote_id

  referentiel:
    data:
      - select * from circuit
      - select * from organisateur
      - select * from roulage_publie
```

Trois remarques qui valent mieux qu'une découverte plus tard :

- **Le barème n'est pas dans les règles, et c'est volontaire.** Un seau global le
  ferait descendre en entier chez un pilote qui possède une moto. Il lui faudra un
  seau paramétré par les machines du garage, au mouvement 3 — pas avant.
- **`session`, `tour` et `intervention` portent désormais `pilote_id`** (migration
  du 19 août). Sans ça elles étaient insynchronisables : une règle PowerSync ne
  fait pas de jointure. Les politiques RLS exigent toujours la cohérence avec le
  parent, la frontière n'a pas bougé.
- **Le palier gratuit désactive une instance après une semaine d'inactivité.** Pour
  un produit ouvert onze fois par an, ce n'est pas un détail de facturation, c'est
  un défaut de conception du palier. À trancher avant décembre : palier payant, ou
  réveil programmé, ou un autre moteur.

Une fois l'URL posée, la synchronisation ne s'allume qu'après **une première
sauvegarde** depuis l'écran Compte. C'est voulu : le journal des changements écrit
avant le compte ne décrit le passé de personne, et le rejouer échouerait.
