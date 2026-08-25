# À faire — ce qui n'attend que toi

Liste vivante. **Rien ici ne bloque le développement** : j'ai contourné ou mis de côté,
et je continue. Chaque entrée dit ce qui est bloqué, par quoi, et ce que ça débloque.

---

## 1 · `GEMINI_IMAGE` — bloqué par les crédits Gemini

**Ce qui attend :** poser le secret `GEMINI_IMAGE` dans Supabase → Project Settings →
Edge Functions → Secrets.

**Pourquoi c'est bloqué :** les crédits ont été épuisés le 19 août 2026
(`429 · prepayment credits are depleted`). Tant qu'ils ne sont pas rechargés, poser la clé
ne servirait à rien — la fonction appellerait et recevrait un refus.

**Ce que ça débloque :** la fabrique de portraits pixel (récit 3bis.3). Tout le reste est
en place et vérifié : fonction déployée, quota de 3 par compte, réservation avant appel,
spritification déterministe. Il ne manque que la clé.

**Ce que ça coûtera :** ≈ 0,16 € par portrait. Le premier sera aussi **le premier essai réel
du prompt v6**, qui n'a jamais tourné. Ce qu'il faudra regarder, dans cet ordre : la livrée
est-elle la vraie · l'orientation est-elle le profil du bon flanc · reste-t-il des lettres
inventées · le fond vert se détache-t-il sans frange.

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
contenu. C'est pour ça qu'**aucune source de barème constructeur n'est proposée** : une
documentation d'atelier est de la propriété intellectuelle protégée, et proposer de l'extraire
serait proposer de recopier un manuel. Les trois sources de règles sont des circuits qui
publient leurs propres règles — la source primaire, celle qui pose le moins de question.

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

## 6 · Le système de crédit — ta décision de monétisation à écrire

**Ton idée, du 19 août :** « On va avoir pas mal de fonctionnalités IA : analyse de vidéo,
génération d'image. Penser à un système de crédit pour ceux qui veulent ces fonctionnalités
ou pas. Ne pas l'inclure dans un premium qui pourrait déborder, et quand plus de crédit, ça
s'arrête. À la place ou au-dessus d'un freemium ? »

**Ce que le code fait DÉJÀ, et qui va dans ton sens.** Le mécanisme existe, il n'est
simplement pas achetable :

- `pilote.quota_sprites` — un solde, par compte, défaut 3.
- `generation` — un registre : une ligne par appel, avec son coût réel en centimes. **Aucune
  politique d'insertion** : seule la fonction serveur y écrit. Un compteur que le compté peut
  écrire ne compte rien.
- `plafond` — un plafond global sur 24 h, en base et non compilé, plus le prix unitaire.
- `reserver_generation()` — réserve **avant** d'appeler, sous verrou consultatif, et refuse
  si le solde ou le plafond est atteint. « Quand plus de crédit, ça s'arrête » est déjà vrai.

**Ce qui manque, et c'est exactement ce que tu décris :**

1. **Un solde générique au lieu d'un quota par fonctionnalité.** `quota_sprites` est nommé
   d'après une seule fonctionnalité. L'analyse de vidéo arriverait avec `quota_videos`, et on
   aurait deux portefeuilles là où le pilote en voit un. À renommer en un solde unique, avec
   un prix en crédits par acte — une génération d'image n'a aucune raison de coûter autant
   qu'une minute de vidéo analysée.
2. **De quoi en acheter.** C'est la seule vraie brique manquante, et elle demande un compte
   marchand.
3. **Le prix.** Le coût réel est connu et déjà écrit ligne par ligne dans `generation` : c'est
   la seule base honnête pour fixer un tarif, et elle sera mesurée avant d'être devinée.

**⚠ CORRECTION — L'ARGUMENT QUI ÉTAIT ÉCRIT ICI ÉTAIT PÉRIMÉ, ET IL VENAIT DE MOI.**

Cette entrée disait : « le produit s'ouvre onze fois par an, donc l'abonnement mensuel est une
machine à résiliation ». C'est faux depuis le 18 août 2026, et la rétractation est écrite noir
sur blanc dans `_bmad/custom/mypaddock-contraintes.md` §3 : **onze est le nombre de ROULAGES,
pas le nombre d'ouvertures.** On en avait tiré un rythme d'usage qui n'a jamais été mesuré.
« Aucun nombre ne remplace celui-là, et c'est délibéré. »

Conséquence directe : **l'abonnement n'est plus disqualifié d'office.** Je l'avais pourtant
répété comme un acquis, ici et de vive voix — c'est le genre d'argument qui s'installe parce
qu'il sonne bien, et qui survit à sa propre réfutation.

Ce qui reste vrai, et qui est plus étroit : **le moment de saisie au paddock** est rare —
gants aux mains, plein soleil, sans réseau. C'est une contrainte d'interface, pas un argument
de tarification.

**Ce qui est vraiment écarté, et pour un tout autre motif : le pass saison.** La revue produit
lui reproche de fabriquer un coût échoué — « j'ai payé, il faut que ça serve » — c'est-à-dire
exactement la pression à rouler que l'interdit n°4 proscrit. Et le PRD juge ce défaut PIRE
qu'une mécanique de jeu, parce qu'il est invisible dans l'interface : rien à l'écran ne le
montre, il n'agit que dans la tête du pilote.

**Ma recommandation, à confirmer par toi**, débarrassée de l'argument mort : crédit prépayé
pour tout ce qui appelle une IA, noyau gratuit et sans limite. Deux raisons qui tiennent
toutes seules — il **facture exactement ce qui coûte**, et il ne crée aucun coût échoué. À
trancher quand un vrai utilisateur aura demandé une de ces fonctionnalités : c'est le seul
moment où la réponse coûte moins qu'elle ne rapporte.

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
