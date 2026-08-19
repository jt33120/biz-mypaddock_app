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

**Ce que ça débloque :** la campagne. L'écran « à propos » existe, il est atteignable sans
compte depuis l'accueil, et il est exact — il nomme les sous-traitants réels, la région des
données, la base légale et les trois mesures. Tant que les deux variables manquent, il le dit
honnêtement : *« Aucune adresse de contact n'est encore publiée. Tant qu'elle manque, cette
application ne devrait être partagée avec personne. »* C'est la seule phrase qui reste entre le
produit et sa première publicité.

**Ce que ça ne débloque pas :** rien d'autre. Le reste du texte est déjà juste, et il ne
demande aucune relecture juridique tant que le service reste gratuit et sans traceur.

---

## 5 · Le service de récolte — écrit, jamais déployé

**Ce qui attend :** déployer `recolte/` sur Railway, y poser `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` et `MISTRAL_API_KEY`, puis remplir la table `source_recolte`
avec les pages à lire.

**Pourquoi je ne l'ai pas fait :** un service déployé qui tourne coûte de l'argent en
continu, et celui-ci appelle une API d'extraction à chaque tour. Ce n'est pas à moi de
l'allumer. Il est écrit, testé à vide, et **il refuse tout tant que `MISTRAL_API_KEY` est
absente** — même interrupteur que la fabrique d'images : déployable sans qu'un euro puisse
partir.

**Ce que ça débloque :** les barèmes constructeur (donc les horloges d'usure avec un vrai
intervalle au lieu d'un compteur sans échéance) et les calendriers d'organisateurs (donc les
roulages proposés en brouillon, et les règles de conformité de la checklist).

**Ce qu'il ne fera jamais :** écraser une correction du pilote. Une ligne marquée
`corrige_par_pilote` n'est pas réécrite — une extraction par IA est une reconstruction, pas
une transcription, et c'est le seul endroit du produit où l'erreur touche la sécurité d'une
machine. Le déclenchement est un appel HTTP, pas une horloge interne : un service qui tourne
tout seul est un service dont on ne voit pas la dépense.

**Précaution :** il n'y a **aucune source dans la table**. Tant qu'elle est vide, un tour de
récolte ne lit rien et n'appelle rien. C'est à toi de décider quelles pages sont lisibles et
si leurs conditions d'utilisation le permettent.

---

## 6 · Ce qui demandera ta relecture, pas ton action

- **Le contenu des conseils** (récit 6.3). Six conseils embarqués tiennent la clause de forme
  — chacun énonce une technique, aucun ne fixe une performance — mais ils sont provisoires et
  attendent ta relecture de pilote.
- **Les dates de la saison 2026.** Tu as donné les mois (avril, juin, juillet, août, septembre) ;
  j'ai choisi les jours, des samedis. À corriger d'un mot si l'un est faux.
- **Le catalogue de caps.** Sept caps embarqués, dont quatre de bravoure. La liste est une
  proposition, pas une décision.
