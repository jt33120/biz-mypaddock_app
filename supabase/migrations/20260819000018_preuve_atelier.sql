-- ═══════════════════════════════════════════════════════════════════════════
-- LA PREUVE D'UN GESTE D'ATELIER — retour de Julian du 19 août 2026.
--
--   « Entretien : ajouter des photos et des factures, pour constituer une
--     preuve. »
--
-- Le mot qui compte est PREUVE, et il change la nature de l'objet. Une photo de
-- roulage est un souvenir : elle peut manquer sans que rien ne soit faux. Une
-- facture de plaquettes est une pièce : à la revente, c'est elle qui distingue
-- « entretenue » de « on me dit qu'elle est entretenue ». C'est la seule donnée
-- du produit qui ait une valeur devant un tiers.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── ① UNE INTERVENTION PORTE PLUSIEURS PIÈCES ─────────────────────────────
-- `intervention.photo_id` existait déjà et pointait UNE photo — celle du chemin
-- « le photographier, c'est tout », où une bricole se déclare depuis le paddock.
-- Elle reste. Mais une preuve n'est pas une photo : c'est un dossier — la pièce
-- montée, la facture, parfois le compteur. Le lien s'inverse donc, et c'est la
-- photo qui désigne son intervention.
alter table photo add column if not exists intervention_id uuid
  references intervention(id) on delete cascade;

create index if not exists photo_par_intervention on photo (intervention_id)
  where intervention_id is not null;

-- La contrainte de porteur s'élargit d'un troisième cas. Elle reste une
-- contrainte : une photo sans porteur est une photo que rien ne fera jamais
-- descendre chez son pilote, donc une photo perdue.
alter table photo drop constraint if exists photo_a_un_porteur;
alter table photo add constraint photo_a_un_porteur
  check (roulage_id is not null or machine_id is not null or intervention_id is not null);

comment on constraint photo_a_un_porteur on photo is
  'Une photo appartient à un roulage (la journée), à une machine (son portrait, '
  'une pièce à regarder) ou à une intervention (la preuve d''un geste). '
  'Plusieurs à la fois est permis, aucun ne l''est.';

-- ─── ② PHOTO OU FACTURE ────────────────────────────────────────────────────
-- Julian a nommé les deux séparément, et ils ne servent pas à la même chose :
-- la photo montre l'état, la facture prouve la dépense. Les confondre ferait
-- annoncer « 3 preuves » là où il y a trois clichés du même disque et aucun
-- justificatif.
--
-- Défaut à 'photo' : c'est ce qu'était toute ligne existante, donc la valeur
-- n'invente rien sur le passé.
alter table photo add column if not exists genre text not null default 'photo';

alter table photo drop constraint if exists photo_genre_connu;
alter table photo add constraint photo_genre_connu check (genre in ('photo', 'facture'));

comment on column photo.genre is
  'La photo montre un état, la facture prouve une dépense. Les compter ensemble '
  'annoncerait « 3 preuves » là où il y a trois clichés du même disque.';
