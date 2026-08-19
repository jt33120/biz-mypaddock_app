-- Rectification d'un commentaire devenu FAUX, et c'est un commentaire qui portait une
-- affirmation d'architecture — donc il ne pouvait pas rester.
--
-- 20260818000004 écrivait : « Le sprite est produit DANS LE TÉLÉPHONE […] aucun appel réseau,
-- aucun coût, aucune hallucination possible ». Les trois clauses sont tombées le 19 août :
-- la voie déterministe locale a échoué sur photo réelle (cinq approches de détourage, deux
-- rendus sur vingt-quatre avec les deux pneus entiers), et le sprite vient désormais d'un
-- modèle d'image appelé UNE FOIS par machine, puis ramené à une vraie grille par du code local.
--
-- Trois conséquences qui vivent maintenant dans la colonne elle-même :
--   1. le sprite a un COÛT MARGINAL — c'est le premier poste du produit dans ce cas ;
--   2. il est donc produit une seule fois et CONSERVÉ, jamais recalculé à l'affichage ;
--   3. il peut se tromper : c'est une reconstruction, pas une transcription, et le pilote doit
--      pouvoir le refuser sans perdre sa photo d'origine.
comment on column machine.sprite is
  'Portrait pixel 16 bits, PNG détouré en data URI. Produit UNE FOIS par machine : un appel à '
  'un modèle d''image (coût marginal réel), puis mise à la grille et quantification en local. '
  'Conservé, jamais recalculé à l''affichage. Nullable : une machine sans sprite reste valide '
  '(AD-2), le garage affiche alors sa silhouette.';
