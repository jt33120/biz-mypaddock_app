# À faire — ce qui n'attend que toi

Liste vivante. **Rien ici ne bloque le développement** : j'ai contourné ou mis de côté,
et je continue. Chaque entrée dit ce qui est bloqué, par quoi, et ce que ça débloque.

---

## 1 · `GEMINI_IMAGE` — bloqué par les crédits Gemini

**Ce qui attend :** poser le secret `GEMINI_IMAGE` dans Supabase → Project Settings →
Edge Functions → Secrets.

**Pourquoi c'est bloqué — et ce point a changé le 3 septembre 2026.** Tu as écrit « je
pense avoir des crédits clé Gemini ». C'est possible, et ça ne change rien : **le secret
n'est pas posé sur le projet**. Ce n'est plus une hypothèse, c'est lu dans les journaux.

La fonction n'a qu'une seule branche qui lise `pilote.quota_sprites` puis compte
`generation` : celle qui s'exécute quand `GEMINI_IMAGE` est absent. Ces deux requêtes
apparaissent dans les journaux à chaque fois que tu as tapé « En faire un portrait »
(2 sept. 06:36, 3 sept. 05:06 et 05:34), à 500 ms du démarrage de la fonction. Aucun appel
n'est jamais parti chez Gemini — donc aucun crédit n'a jamais été consommé, ni le 19 août
ni depuis.

Le refus du 19 août (`429 · prepayment credits are depleted`) reste vrai pour ce jour-là.
Mais la panne d'aujourd'hui est en amont : pas de clé, pas d'appel.

**Ce qu'il faut faire, dans cet ordre :**

1. Poser le secret (Supabase → Project Settings → Edge Functions → Secrets), ou en ligne
   de commande : `supabase secrets set GEMINI_IMAGE=… --project-ref oghmwkiklwaptjfouprx`.
2. Retaper « En faire un portrait ». Si les crédits sont bien là, le portrait sort. S'ils
   ne le sont pas, tu liras **« Le modèle d'image a refusé la demande »** avec le code
   exact — plus jamais « le serveur est resté injoignable », qui était faux et t'a coûté
   deux semaines de diagnostic (voir § 14).

**Ton compte ne compte plus ses crédits** depuis le 3 septembre (§ 6) : il est en illimité,
et le compteur en haut à gauche affiche ∞. Rien ne t'arrêtera au troisième essai — sauf le
plafond global des 24 h, qui protège ta facture et pas ton quota.

**Ce que ça débloque :** la fabrique de portraits pixel (récit 3bis.3). Tout le reste est
en place et vérifié : fonction déployée, quota de 3 par compte, réservation avant appel,
spritification déterministe. Il ne manque que la clé.

**Ce que ça coûtera :** ≈ 0,16 € par portrait. Le premier sera aussi **le premier essai réel
du prompt v6**, qui n'a jamais tourné. Ce qu'il faudra regarder, dans cet ordre : la livrée
est-elle la vraie · l'orientation est-elle le profil du bon flanc · reste-t-il des lettres
inventées · le fond vert se détache-t-il sans frange.

---

## 1bis · Le premier rendu du CASQUE et de la COMBINAISON — la manip est prête

**Ce qui attend :** trois générations réelles, à lancer **le jour où les crédits sont
rechargés**, et pas avant. Le prompt de la tenue (`supabase/functions/sprite/tenue.ts`,
version `v7-tenue`) **n'a jamais tourné**, exactement comme v6 en son temps : il est écrit,
relu et déployable, il n'est pas éprouvé. Aucun appel n'a été fait pour l'écrire — ni depuis
le banc, ni depuis la fonction.

**Pourquoi c'est bloqué :** les mêmes crédits que le §1, épuisés le 19 août 2026
(`429 · prepayment credits are depleted`).

**Ce que ça débloque :** le casque et la combinaison en portrait pixel — « la combinaison
c'est comme un skin, et le casque aussi ». Jusqu'ici un casque partait avec le prompt de la
MOTO : il recevait littéralement « c'est CETTE moto » et « l'angle est un PROFIL STRICT ».
Le serveur choisit désormais son prompt d'après un champ `sujet`, et l'angle de la tenue est
l'INVERSE de celui de la moto — trois-quarts, pour montrer l'écran et la mentonnière.

**Ce que ça coûtera :** ≈ 0,16 € la pièce, ≈ 0,48 € pour les trois. C'est exactement le quota
par défaut : ces trois-là le consomment en entier. Relève-le d'abord si tu veux pouvoir
recommencer (`update pilote set quota_sprites = 10 …`, A-BRANCHER §4).

### La manip, dans l'ordre

**① Le secret.** `GEMINI_IMAGE` dans Supabase → Project Settings → Edge Functions → Secrets
(§1 ci-dessus). S'il est déjà posé, rien à faire.

**② Redéployer la fonction.** Elle porte maintenant deux fichiers de prompt, et la version
actuellement en ligne ignore le champ `sujet` — elle dessinerait une moto :

    supabase functions deploy sprite --no-verify-jwt

`--no-verify-jwt` n'est pas un confort : l'authentification est faite **dans le corps** de la
fonction pour distinguer « sans compte » de « quota atteint » et le dire au pilote. Sans ce
drapeau, la porte de plateforme rejette avec un corps opaque et le produit n'a plus rien à
dire.

**③ Vérifier les refus AVANT de dépenser.** Ces deux appels ne coûtent rien, et ce sont eux
qui protègent la suite. Sans jeton :

    curl -s -X POST "$SUPABASE_URL/functions/v1/sprite"      → {"refus":"sans_compte"}

Avec ton jeton, mais un sujet que la fonction ne connaît pas — le refus doit tomber **avant**
la réservation, donc sans consommer de créneau :

    curl -s -X POST "$SUPABASE_URL/functions/v1/sprite" \
      -H "Authorization: Bearer <ton jeton>" -H 'Content-Type: application/json' \
      -d '{"photo":"AAAA","sujet":"gants"}'                  → {"refus":"sujet_inconnu"}

Si cette seconde ligne répond autre chose que `sujet_inconnu`, **arrête-toi là** : la garde ne
tient pas, et tout ce qui suit dépense. (Ne remplace pas `"gants"` par `"machine"` pour
« voir » : celui-là, lui, part et se paie.)

**④ Les trois pièces, dans cet ordre : casque, combinaison NOIRE, combinaison colorée.**
L'ordre n'est pas arbitraire. Le casque porte la demande — c'est son angle qui est en jeu. La
combinaison noire est le cas le plus facile à rater : sans les trois gris froids, elle revient
en silhouette pleine, illisible. La colorée vient en dernier et ne sert qu'à confirmer que ses
bandes passent le budget de 3 carrés.

Pour chacune : **Garage → Équipement → la pièce** — elle doit porter son **genre**
(casque ou combinaison), sinon l'écran le dit et **n'appelle pas** → « Photographier » →
« En faire un portrait pixel » → « Lancer la fabrication ».

**⑤ Le verdict, dans cet ordre. Ce qui fait REFUSER :**

1. **l'angle** — trois-quarts avant, ouverture d'écran vers la gauche. Un casque de profil
   strict (une forme d'œuf) ou vu de face est à refuser : c'est l'exigence même de la demande.
2. **la stabilité** — pose les deux premiers casques côte à côte. S'ils ne sont pas sous le
   même angle, à la même hauteur d'écran et à la même taille, le prompt a échoué **même si
   chaque image est jolie prise seule**. C'est le critère qui compte, et c'est le seul qui ne
   se voit pas sur une image isolée.
3. **les lettres** — la marque au front, sur la platine d'écran, sur la jugulaire, sur la
   poitrine. Une seule lettre inventée = refus. Une suite de petits blocs alignés comme un mot
   = refus aussi, c'est encore du faux texte.
4. **le noir** — la combinaison noire garde ses arêtes et reste FROIDE. Silhouette pleine, ou
   noir viré violet, ou noir éclairci en gris moyen = refus.
5. **le fond vert** — aucune frange verte au contour, et aucun vert dans les creux : col,
   poignets, bas de jambes, intérieur de l'ouverture d'écran. C'est ce qui se voit après
   spritification, pas avant.
6. **personne dedans** — aucune tête, aucun visage, aucune main, aucun mannequin, aucun
   cintre, aucun socle, aucune ombre portée.

**⑥ Ce qu'on fait d'un refus.** On ne relance pas au hasard : chaque relance se paie et
consomme un créneau. Le prompt se corrige dans `supabase/functions/sprite/tenue.ts`, il se
rejoue **au banc** sur les mêmes photos, et seulement ensuite on redéploie :

    node banc-rendu/generer.mjs prompts/v7-tenue.js

Le banc lit le sujet dans un fichier posé à côté de la photo — `casque.jpg.cadre.json`
contenant `{"genre":"casque"}`. Sans lui il refuse la photo au lieu de deviner, et il refuse
**avant** l'appel : une photo mal étiquetée ne coûte rien.

---

## 2 · SMTP personnalisé — bloqué par le domaine

**Ce qui attend :** la checklist complète est dans `A-BRANCHER.md` §2. En résumé : un domaine
que tu contrôles, un compte Resend, trois enregistrements DNS (SPF, DKIM, DMARC), les
identifiants collés dans Supabase, et le *rate limit* relevé au-dessus de 30/heure.

**Pourquoi c'est bloqué :** il faut un domaine d'expédition et un accès DNS. Je ne peux ni
acheter, ni vérifier un domaine.

**Ce que ça débloque :** l'inscription d'un inconnu. Le fournisseur par défaut de Supabase
n'écrit qu'aux adresses rattachées au projet — sans SMTP, la première campagne enverra des
gens vers un e-mail qui n'arrivera jamais.

---

## 3 · `{{ .Token }}` dans le gabarit de confirmation — confort

**Ce qui attend :** Supabase → Authentication → Emails → *Confirm signup* → ajouter
`{{ .Token }}`.

**Ce que ça débloque :** un code à six chiffres dans l'e-mail. L'application a déjà le champ
qui l'accueille, et la session s'ouvrirait sans passer par Safari. Purement du confort — le
chemin par le lien fonctionne.

---

## 4 · `VITE_CONTACT` et `VITE_EDITEUR` — deux variables, trente secondes

**Ce qui attend :** deux variables d'environnement sur Vercel (les trois environnements) :

- `VITE_CONTACT` — l'adresse qui répond. Le §7 du PRD dit « au minimum une adresse **qui
  répond** », donc ce ne peut pas être une adresse inventée.
- `VITE_EDITEUR` — ton nom ou ta raison sociale, tel que tu veux qu'il apparaisse.

**Pourquoi je ne l'ai pas fait :** publier une adresse de contact et un nom d'éditeur engage
une personne réelle. Ce n'est pas un réglage technique et ce n'est pas à moi de le trancher —
en particulier, je ne publie pas ton adresse personnelle sans que tu le décides.

**Ce que ça débloque :** la campagne. C'est la seule phrase qui reste entre le produit et sa
première publicité.

---

## 5 · La récolte — DÉPLOYÉE, et volontairement muette

**Fait le 19 août 2026.** Le service tourne sur Railway, projet `mypaddock-recolte`, service
`recolte`, racine `recolte/`, sonde de santé sur `/sante` :

    https://recolte-production.up.railway.app/sante

**Deux interrupteurs, indépendants, tous les deux fermés — vérifié en ligne :**

| requête | réponse |
|---|---|
| `GET /sante` | `{"pret":false,"refus":"base non configurée"}` |
| `POST /recolter` sans jeton | `401 {"refus":"jeton"}` |
| `POST /recolter` avec le bon jeton | `503 {"refus":"base non configurée"}` |

**Ce qui attend toi, et rien d'autre :**

1. `SUPABASE_SERVICE_ROLE_KEY` dans les variables Railway du service. Je ne l'ai pas : elle
   n'est ni dans `.env.local`, ni exposée par le connecteur Supabase, et c'est très bien
   ainsi — une clé de service qui traîne dans un fichier de développement est une clé qui
   finit dans un dépôt.
2. `MISTRAL_API_KEY` — **c'est elle, le premier euro.** Elle est dans ton `.env.local` et je
   ne l'ai délibérément PAS posée : le service est conçu pour être déployable sans qu'un
   centime puisse partir, et allumer la dépense est un geste humain. Une seule ligne à coller
   dans Railway quand tu le décides.
3. **Activer des sources.** La table `source_recolte` est remplie de cinq candidates,
   **toutes `actif = false`**. Le service ne lit que les actives : en l'état, un tour de
   récolte ne lit rien et n'appelle rien.

**Ce que je n'ai pas tranché, et pourquoi :** les conditions d'utilisation de chaque site.
Lire une page publique n'est pas la même chose que la réextraire par IA et en republier le
contenu. C'est pour ça qu'**aucune source de barème constructeur n'est proposée à la
RÉCOLTE** : une documentation d'atelier est de la propriété intellectuelle protégée, et une
récolte mutualisée qui l'extrairait la republierait pour tout le monde. Les trois sources de
règles sont des circuits qui publient leurs propres règles — la source primaire, celle qui
pose le moins de question.

> ⚠ **Et c'est exactement pour ça que le manuel prend l'autre chemin** — le seul qui tienne,
> et il est en place depuis le 26 août 2026. La fonction `manuel` cherche le PDF, le rapatrie
> **dans l'espace privé du pilote qui le demande**, et le LIT pour en tirer les postes
> d'entretien de SA moto. Rien n'est mutualisé, rien n'est indexé, rien n'est servi à un
> second pilote : ce n'est pas une bibliothèque, c'est une copie privée faite pour son
> détenteur.
>
> Ce qu'elle en tire est **transcrit et jamais converti** : « tous les 6 000 km ou 12 mois »
> s'affiche tel quel, à côté d'un compteur qui compte des roulages, et les deux ne se parlent
> pas. Une journée de piste vaut 200 à 300 km selon le circuit, le groupe et la météo —
> traduire l'un dans l'autre serait une interprétation portant sur la sécurité d'une machine,
> et FR-44 l'interdit nommément.

**Le jeton de déclenchement** (`RECOLTE_JETON`) est posé et lisible dans les variables Railway.
Je l'ai généré, donc je l'ai vu : si tu préfères un secret que je n'aie jamais eu sous les yeux,
remplace-le d'un clic dans le tableau de bord — rien d'autre n'en dépend.

**Déclencher un tour, une fois les clés posées :**

    curl -X POST -H "Authorization: Bearer <RECOLTE_JETON>" \
      https://recolte-production.up.railway.app/recolter

**Ce qu'il ne fera jamais :** écraser une correction du pilote. Une ligne marquée
`corrige_par_pilote` n'est pas réécrite — une extraction par IA est une reconstruction, pas
une transcription, et c'est le seul endroit du produit où l'erreur touche la sécurité d'une
machine.

---

## 5bis · `MISTRAL_API_KEY` — un secret, deux fonctions

**Ce qui attend :** poser `MISTRAL_API_KEY` à DEUX endroits, qui sont deux
services distincts et n'ont pas la même conséquence :

1. **Supabase → Edge Functions → Secrets.** Débloque la fonction `manuel` : la
   recherche automatique du manuel d'atelier et son rapatriement dans ton espace.
2. **Railway → service `recolte` → Variables.** Débloque la récolte (§5).

**Ce que ça coûtera :** un appel de recherche web par manuel cherché, plus le
téléchargement du PDF. Quelques centimes l'unité. Deux plafonds tiennent déjà :
25 Mo par fichier, et **un seul manuel par machine** — le second appel remplace
le premier au lieu d'empiler, sans quoi un tap répété serait une facture répétée.

**⚠ CE CHEMIN N'A JAMAIS TOURNÉ EN ENTIER.** Sans la clé, la fonction refuse en
`cle_absente` — c'est vérifié en ligne, comme le refus sans compte. Mais la
recherche elle-même, l'extraction de l'URL et le téléchargement n'ont jamais été
éprouvés sur un vrai manuel. **Attends-toi à ce que le premier essai échoue** :
trouver le PDF exact d'un manuel d'atelier est difficile, et les refus prévus
(`introuvable`, `pas_un_pdf`, `url_refusee`) sont des issues normales, pas des
bugs. L'écran les dit en clair et propose les deux secours — chercher soi-même,
verser un fichier.

**Le point juridique, en une phrase :** j'avais refusé le rapatriement au motif
du droit d'auteur, tu as tranché l'inverse. Ce qui reste de la précaution est le
seul point qui change quelque chose en droit — la copie va dans TON espace privé,
elle n'est jamais servie à un autre pilote. C'est une copie privée, pas une
bibliothèque.

---

## 6 · Le système de crédit — ✅ TRANCHÉ ET EN LIGNE le 3 septembre 2026

**Ta décision, mot pour mot :** « Ne pas marquer 16 cts, faire un système de crédit et ce
compte test en illimité, avec un compteur en haut à gauche qui peut se faire rajouter. Un
crédit couvre un appel IA en gros sur la clé Gemini, la clé Mistral gratuite pour le moment. »

Elle referme les deux premiers manques que cette entrée décrivait depuis le 19 août — un
solde générique au lieu d'un quota par fonctionnalité, et un prix en crédits par acte.

**Ce qui est en place** (migration `20260903000001`, appliquée et vérifiée) :

| | |
|---|---|
| Un seul solde | Fini `quota_sprites` (3) et `quota_manuels` (5) : deux portefeuilles pour un pilote qui n'en voit qu'un. Les deux colonnes sont supprimées. |
| Le solde se **dérive** | Accueil + accordés − consommés. Aucune colonne ne le stocke : un solde stocké et un registre finissent par se contredire, et c'est le registre qui a raison. |
| Un portrait | **1 crédit** (`plafond.credits_sprite`) |
| Une recherche de manuel | **0 crédit** (`plafond.credits_manuel`) — la clé Mistral est gratuite pour le moment |
| Crédits d'accueil | **3** par compte (`plafond.credits_accueil`) |
| Ton compte | **illimité** (`pilote.credits_illimites`) |
| Le compteur | En haut à gauche, sur tous les écrans. Absent sans compte. |

**Les trois prix sont des DONNÉES, pas du code.** Le jour où Mistral se met à facturer, tu
passes `credits_manuel` à 1 — sans redéploiement, sans PR, sans moi :

```sql
update plafond set credits_manuel = 1;
```

**Pour te rajouter des crédits** (ou en donner à quelqu'un). Chaque ajout laisse une trace
avec son motif, parce qu'un solde que personne ne peut expliquer est un solde auquel personne
ne croit :

```sql
select crediter('4ab5b551-e695-41f9-9f90-8009887574e2', 20, 'test de recette');
```

Elle rend le nouveau solde. Un montant **négatif** est accepté — c'est ainsi qu'on reprend un
geste commercial ou qu'on corrige une erreur, et le registre garde la trace des deux sens.
`crediter` est retirée à tous les rôles joignables depuis un navigateur : c'est la leçon du
19 août, où un `PATCH /rest/v1/pilote` portait un quota à 32767, soit 5 242 € en un appel.

**⚠ « ILLIMITÉ » PORTE SUR LE SOLDE, PAS SUR LA FACTURE.** Ton compte ne consomme aucun
crédit, mais il reste sous le plafond global des 24 h — 5 € par jour, tous comptes confondus,
soit une trentaine de portraits. C'est le seul garde-fou contre une boucle qui partirait en
vrille sur ta vraie clé, et le retirer pour un compte de test serait le retirer précisément
là où on fait des bêtises. Il se relève en base si la recette l'exige :

```sql
update plafond set par_jour_centimes = 2000;
```

**Le centime n'a pas disparu, il a quitté l'écran.** `generation.cout_centimes` enregistre
toujours le coût réel, acte par acte. C'est délibéré et c'est le point ③ ci-dessous : le prix
de vente se fixera sur des relevés, pas sur une intuition.

**Ce qui reste, et c'est toujours ta décision : VENDRE.** Il n'y a aucun moyen d'acheter des
crédits — il faut un compte marchand, et c'est le seul point de cette entrée que le code ne
peut pas trancher à ta place. Ma recommandation n'a pas bougé : crédit prépayé pour tout ce
qui appelle une IA, noyau gratuit et sans limite. Il facture exactement ce qui coûte, et il ne
crée aucun coût échoué — contrairement au pass saison, que la revue produit écarte parce qu'il
fabrique une pression à rouler (« j'ai payé, il faut que ça serve »), invisible dans
l'interface et donc impossible à corriger par elle.

**⚠ Rappel de l'argument mort, pour qu'il ne revienne pas.** Cette entrée a longtemps dit
« le produit s'ouvre onze fois par an, donc l'abonnement est une machine à résiliation ».
C'est faux : **onze est le nombre de ROULAGES, pas d'ouvertures**
(`_bmad/custom/mypaddock-contraintes.md` §3). L'abonnement n'est donc pas disqualifié
d'office. Ce qui reste vrai, et qui est plus étroit : le moment de saisie **au paddock** est
rare, gants aux mains et sans réseau — une contrainte d'interface, pas de tarification.

---

## 7 · Les liens affiliés et les recommandations — pas simulés, délibérément

**Ce que tu as demandé** dans la page d'un poste d'atelier : « des recommandations, liens vers
des produits affiliés, etc. »

**Ce que j'ai fait :** la page existe, avec la preuve (photos et factures), la recherche du
manuel et les horloges d'usure. **Les liens affiliés n'y sont pas, et je n'ai pas mis de bloc
« bientôt ».**

**Pourquoi :** un lien affilié engage un contrat avec un marchand et impose une mention légale
d'affiliation visible. Le poser sans les deux serait une infraction, pas un raccourci. Et un
bloc « bientôt » sur un écran est une promesse que l'écran ne tient pas.

**Ce qu'il faut de ta part :** choisir un programme (Amazon Partenaires, Motoblouz, Dafy…),
et la mention légale suivra dans l'écran « à propos », qui la porte déjà pour les
sous-traitants. Une recommandation, elle, demande autre chose : soit un avis de pilote assumé
comme tel, soit rien — le produit énonce, il ne conseille pas d'acheter.

---

## 7bis · Les mots de passe déjà fuités — ⚠ CE N'EST PAS UN CLIC, C'EST UN PLAN

**Je me suis trompé une fois sur cette entrée, et la correction change la décision.** Je
l'avais écrite comme « un clic de trente secondes ». C'est faux : **la protection contre les
mots de passe fuités est réservée au plan Pro.** L'organisation `DEV` est en plan **`free`** —
vérifié en ligne. Le réglage n'existe pas dans ton tableau de bord ; cliquer ne donnerait rien.

**Ce que ça ferait, si tu passais Pro (≈ 25 $/mois) :** Supabase compare le mot de passe
choisi à la base HaveIBeenPwned au moment de l'inscription et refuse ceux qui ont déjà fuité
ailleurs. Rien ne remonte en clair — seuls les cinq premiers caractères de l'empreinte
partent. Un compte MyPaddock ne garde ni carte ni adresse, mais il garde la saison entière
d'un pilote et les photos de sa moto ; le mot de passe réutilisé d'un forum percé en 2019 est
la seule porte réaliste vers ça.

**Ce qui est GRATUIT et va dans le même sens**, et que je te recommande à la place tant que le
plan ne bouge pas : Supabase → Authentication → Sign In / Providers → *Password* → relever la
**longueur minimale** (elle est à 6, le défaut) et exiger des **classes de caractères**.
L'écran d'inscription annonce déjà « 6 caractères minimum » ; le libellé suivra le réglage
d'une ligne de code, dis-moi le chiffre que tu retiens.

**Pourquoi je ne le fais pas moi-même :** c'est un réglage du projet Auth, ni SQL ni code. Le
connecteur Supabase ne l'expose pas, et il n'y a aucun jeton d'API de gestion (`sbp_…`) sur ce
poste — je l'ai vérifié plutôt que de le supposer.

---

## 9 · La recette — EN LIGNE, et elle dit ce qu'elle est

**Fait le 24 août 2026.** https://mypaddock-recette.vercel.app

**Comment y entrer :** l'URL est derrière l'authentification Vercel (réglage `ssoProtection`
du projet, mode « tout sauf les domaines personnalisés »). Connecte-toi une fois avec ton
compte Vercel dans le navigateur du téléphone, et elle s'ouvre ensuite normalement, y compris
installée sur l'écran d'accueil. Je n'ai pas touché à ce réglage : le désactiver ouvrirait
aussi toutes les prévisualisations à qui devine une URL.

**⚠ DEUX ADRESSES, ET UNE SEULE SE MET À JOUR TOUTE SEULE.** Depuis que le webhook est
réparé, chaque push sur `dev` construit une recette et Vercel la publie sur son alias de
branche :

    https://mypaddock-git-dev-julian-talous-projects.vercel.app   ← toujours la dernière

`mypaddock-recette.vercel.app` est un alias que j'ai posé à la main : il est plus court, mais
il reste sur la version que je lui ai désignée. Le plus propre serait de rattacher ce nom à la
branche `dev` dans Vercel → projet → Domains → *assign to git branch* — trente secondes, et
les deux adresses deviennent la même chose.

**⚠ ELLE PARLE À LA VRAIE BASE.** Un seul projet Supabase, une seule instance PowerSync, un
seul seau de photos. Une base isolée demanderait une branche Supabase — c'est payant, donc
c'est ta décision, pas la mienne.

**Ce qui te protège désormais, et qui n'existait pas ce matin** — une passe adverse à seize
agents a trouvé l'enchaînement, un sceptique l'a confirmé après cinq tentatives de le casser :

- Hors production, **l'adoption ne part plus toute seule**. Elle partait sans bouton et sans
  question, retenue par un drapeau qui vit dans le `localStorage` — donc PAR ORIGINE, donc
  absent sur la recette. Trois journées bidon saisies en recette, une connexion pour éprouver
  l'authentification, et elles atterrissaient dans ta vraie saison avant de redescendre sur
  ton vrai téléphone. Le bouton manuel reste, et il montre ce qu'il enverrait.
- **Un bandeau jaune permanent** dit où tu es et ce que ça touche. Sans lui, les deux
  interfaces sont identiques au pixel près.

**Ce qui reste vrai malgré tout :** si tu appuies sur « Sauvegarder maintenant » depuis la
recette, ça part pour de bon. Et une suppression de journée faite en recette après ce
bouton-là supprime la vraie ligne.

---

## 10 · Vercel et GitHub — RÉPARÉ PAR TOI le 24 août

**Ce qui s'était passé :** le dépôt a été renommé et déplacé. Le projet Vercel restait lié à
l'ancien chemin, l'App GitHub n'avait plus accès, et **plus aucun déploiement ne partait
depuis le 23 août** — sans qu'aucune erreur ne s'affiche nulle part. Ça se taisait, ce qui est
pire qu'échouer.

**Réparé.** Le dépôt vit maintenant à `jt33120/biz-mypaddock_app` et le webhook fonctionne :
vérifié, un seul push a produit **une production depuis `main` et une recette depuis `dev`**,
les deux en `READY`.

**Une ligne pour toi, quand tu veux** — mon dépôt local pointe encore l'ancien chemin et passe
par la redirection de GitHub, qui affiche un avertissement à chaque push. Le classifieur de
permissions m'a refusé la commande deux fois, elle est à toi :

    git remote set-url origin https://github.com/jt33120/biz-mypaddock_app.git

**⚠ ET UN FAIT QUE TU N'AS PEUT-ÊTRE PAS VOULU : le dépôt est PUBLIC.** Vérifié sans jeton —
l'API GitHub le rend à un anonyme. Aucun secret n'est dedans, c'est vérifié aussi (`.env` et
`.env.*` sont ignorés depuis le début, et le `.vercelignore` les exclut désormais lui aussi).
Mais tout le reste se lit : le code, les migrations, les prompts, le PRD, les épiques, et les
commentaires qui expliquent chaque arbitrage du produit. Si c'était volontaire, tant mieux.
Sinon, c'est un bouton dans Settings → General → Change visibility.

---

## 11 · Ce qui demandera ta relecture, pas ton action

- **Le contenu des conseils** (récit 6.3). Six conseils embarqués tiennent la clause de forme
  — chacun énonce une technique, aucun ne fixe une performance — mais ils sont provisoires et
  attendent ta relecture de pilote.
- **Le catalogue de caps.** Sept caps embarqués, dont quatre de bravoure. La liste est une
  proposition, pas une décision.

*(Les dates de la saison 2026 sont sorties de cette liste : tu les saisis dans l'application.
Le bouton « Reprendre la saison 2026 » du garage reste, comme raccourci d'essai.)*

---

## 12 · Une perte assumée du 1er septembre 2026, à trancher quand tu l'auras vue

**La composition d'un mois ne se lit plus dès qu'il y a trois mois.** Le tracé des mois a
quitté le budget pour l'écran d'analyse — il y gagne une rangée de périodes, alors qu'il était
verrouillé sur l'année courante et donc muet sur toute saison passée. Mais il y devient une
**suite** (des points reliés, la forme que tu as choisie pour les évolutions), et douze points
reliés n'ont aucun endroit où écrire douze compositions.

Concrètement : « septembre 2026 · 716,30 € · pneus · engagement · essence » se lit encore sous
trois mois, où la forme reste une composition ; au-delà, il ne reste que le montant du mois.
La moitié « de quoi il était fait » du récit 19.2 est donc **rendue par intermittence**.

Ce n'est pas un oubli, c'est un arbitrage entre deux clauses qui se contredisent ici, et il
t'appartient : soit la suite gagne une manière de dire la composition d'un point (une ligne
sous le tracé, qui suivrait le point touché), soit FINANCE · MOIS redevient une composition et
perd sa ligne continue, soit on s'en tient à ce qu'il y a. Rien ne presse — mais rien ne doit
non plus l'oublier, d'où cette ligne.

---

## 13 · Le serveur avait CINQ JOURS de retard, et rien ne le disait

**Rattrapé le 2 septembre 2026, depuis la session cloud.** Ce paragraphe existe pour que
la panne se reconnaisse la prochaine fois, parce qu'elle ne ressemblait pas à une panne.

**Ce qui s'était passé.** Fusionner une PR déploie Vercel, et Vercel ne déploie que le
*paquet servi au navigateur*. Ni les migrations, ni les fonctions de bord ne partent avec.
Deux lots avaient donc été livrés, testés au banc, mergés — et n'existaient que côté client :

| | appliqué le | manquait |
|---|---|---|
| `20260828000001` la vidéo de crash | 2 sept. | table `video`, bucket `videos`, 4 politiques RLS |
| `20260901000001` la tenue du jour | 2 sept. | `equipement.genre`, `roulage.casque_id`, `roulage.combinaison_id` |
| fonction `sprite` | 2 sept. (v4) | elle datait du 19 août et ignorait le champ `sujet` |

**Pourquoi c'était invisible.** Le schéma PowerSync local, lui, déclarait bien `genre`.
Taper « Casque » écrivait donc en base LOCALE, la puce s'allumait, et tout paraissait
marcher — jusqu'à ce que l'envoi au serveur soit refusé (colonne inconnue) et que la
valeur revienne. Le symptôme lu par le pilote était « le bouton ne marche pas ». Le vrai
symptôme était plus grave : **une opération d'envoi qui échoue en boucle bloque la file
d'envoi**, donc tout ce qui suit cesse aussi de remonter.

Même mécanique pour les skins : la fonction en ligne ne connaissait pas `sujet`, donc
l'appel n'atteignait jamais Gemini. La clé et ses crédits n'y étaient pour rien.

**Ce qui reste à ta main — et c'est le même piège, un cran plus loin.**
Les règles de synchronisation vivent sur l'instance PowerSync **cloud**, pas dans Supabase :
je n'y ai aucun accès depuis ici. `powersync/sync-config.yaml:37` fait descendre `video`,
et cette ligne n'a jamais été déployée. Tant qu'elle ne l'est pas, la table existe des deux
côtés et **ne descend sur aucun second appareil** — exactement la panne silencieuse que la
migration elle-même décrit en son ③.

    powersync deploy

Les colonnes de la tenue, elles, n'ont besoin de rien : toutes les règles sont en
`SELECT *`, donc une colonne nouvelle descend d'elle-même.

**La leçon, en une ligne :** un lot qui touche `supabase/` n'est pas livré quand la PR est
mergée. Il est livré quand la migration est appliquée ET la fonction redéployée.

---

## 14 · Pourquoi « le serveur est resté injoignable » était faux — corrigé le 3 septembre 2026

**Tu n'as rien à faire ici.** C'est le compte rendu de la panne que ton code d'erreur a
permis de trouver, et il vaut d'être gardé parce que la leçon se reproduira.

**Ce que tu voyais :** un témoin qui tourne pendant une minute, puis *« Le serveur est
resté injoignable. Rien n'a été décompté, et la photo est intacte. (Load failed) »*.

**Ce qui se passait vraiment.** Le serveur répondait — deux fois, en 500 ms. Puis il se
taisait 150 secondes et le runtime le tuait. La trace, relevée trois fois à l'identique :

    booted (30 ms)
    GET  /auth/v1/user                        200
    GET  /rest/v1/pilote?select=quota_sprites 200   ← résolu
    HEAD /rest/v1/generation?select=id        200   ← la passerelle répond…
    … 150 s de silence …                            ← … mais la promesse, jamais
    shutdown

La branche « la fabrique n'est pas ouverte » ornait son refus de deux nombres, lus en deux
allers-retours. Le second était une requête **HEAD** — et une réponse HEAD n'a pas de corps,
là où le client Deno en attend un. La promesse ne se réglait jamais. Safari, lui, abandonne
à 60 s avec `TypeError: Load failed`, que le client traduisait en « injoignable ».

Donc : **la branche chargée de dire poliment « rien n'est branché » était précisément celle
qui ne pouvait pas répondre.** Et c'est la seule que tu pouvais atteindre, faute de clé.

**Ce qui a été corrigé** (fonction redéployée en v5, elle répond aujourd'hui en 0,4 s) :

- la branche ne lit plus rien du tout — zéro `await` entre le jeton et la réponse ;
- l'appel au modèle est borné à 100 s, sous la limite du runtime : un modèle lent rend
  désormais ton créneau au lieu de le brûler ;
- le téléphone attend 120 s, donc plus longtemps que le serveur — celui qui renonce en
  premier doit être celui qui peut rembourser ;
- une attente qui expire ne se dit plus « injoignable » : elle a son propre message, qui
  ne promet pas ce qu'on ne sait pas ;
- le type de l'image part avec elle. Il était écrit en dur à `image/jpeg` alors que le
  téléphone envoie du **WebP**. Ce défaut n'avait jamais pu se montrer — aucun appel n'est
  allé jusqu'au modèle — donc c'est ton premier portrait payant qui l'aurait découvert.

**La leçon, en une ligne :** le chemin le plus dégradé d'un service doit être le moins cher
et le plus sûr, pas celui qui fait du réseau pour orner un refus.
