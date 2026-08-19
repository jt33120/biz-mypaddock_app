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

## 4 · Ce qui demandera ta relecture, pas ton action

- **Le contenu des conseils** (récit 6.3). Six conseils embarqués tiennent la clause de forme
  — chacun énonce une technique, aucun ne fixe une performance — mais ils sont provisoires et
  attendent ta relecture de pilote.
- **Les dates de la saison 2026.** Tu as donné les mois (avril, juin, juillet, août, septembre) ;
  j'ai choisi les jours, des samedis. À corriger d'un mot si l'un est faux.
- **Le catalogue de caps.** Sept caps embarqués, dont quatre de bravoure. La liste est une
  proposition, pas une décision.
