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

**L'argument qui tranche ton « à la place ou au-dessus d'un freemium ? »** — et c'est déjà
écrit dans le PRD, section monétisation : le produit s'ouvre **onze fois par an**. Facturer au
mois un produit ouvert onze fois l'an est une machine à résiliation : chaque prélèvement
tombe un mois où il ne s'est rien passé. Le crédit n'a pas ce défaut — il ne se consomme que
quand on s'en sert, donc il ne se remarque jamais au mauvais moment. Il est aussi le seul
modèle qui **facture exactement ce qui coûte**, ce qui est déjà la position retenue pour les
styles de portrait.

**Ma recommandation, à confirmer par toi :** crédit **au lieu** d'un abonnement pour tout ce
qui appelle une IA, et le noyau reste gratuit et sans limite. Un pass saison reste possible
par-dessus pour ce qui ne coûte rien à l'usage — l'import de chrono, le cercle partagé — parce
que l'unité de compte du produit est déjà la saison. À ne trancher que quand un vrai
utilisateur aura demandé une de ces fonctionnalités : c'est le seul moment où la réponse coûte
moins qu'elle ne rapporte.

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

## 8 · Ce qui demandera ta relecture, pas ton action

- **Le contenu des conseils** (récit 6.3). Six conseils embarqués tiennent la clause de forme
  — chacun énonce une technique, aucun ne fixe une performance — mais ils sont provisoires et
  attendent ta relecture de pilote.
- **Le catalogue de caps.** Sept caps embarqués, dont quatre de bravoure. La liste est une
  proposition, pas une décision.

*(Les dates de la saison 2026 sont sorties de cette liste : tu les saisis dans l'application.
Le bouton « Reprendre la saison 2026 » du garage reste, comme raccourci d'essai.)*
