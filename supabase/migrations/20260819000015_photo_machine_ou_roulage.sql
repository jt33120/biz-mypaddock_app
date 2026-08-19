-- Une photo appartient à un ROULAGE ou à une MACHINE, jamais à rien.
--
-- Défaut trouvé par une passe adverse sur l'épique 8 : la photo d'une
-- réparation non vitale partait avec un identifiant de MACHINE dans
-- `roulage_id`. Côté serveur, la clé étrangère levait un 23503, que le
-- connecteur traite comme définitif — la ligne était ÉCARTÉE, et l'intervention
-- qui la référence avec elle. La réparation existait à l'écran de ce téléphone
-- et NULLE PART AILLEURS, sans qu'aucune erreur ne s'affiche jamais.
alter table photo alter column roulage_id drop not null;
alter table photo add column if not exists machine_id uuid references machine(id) on delete cascade;
alter table photo drop constraint if exists photo_a_un_porteur;
alter table photo add constraint photo_a_un_porteur
  check (roulage_id is not null or machine_id is not null);
create index if not exists photo_par_machine on photo (machine_id) where machine_id is not null;

comment on constraint photo_a_un_porteur on photo is
  'Une photo appartient à un roulage (la journée) ou à une machine (une pièce à '
  'regarder). Les deux à la fois est permis, aucun des deux ne l''est.';
