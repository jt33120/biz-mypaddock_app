-- ═══════════════════════════════════════════════════════════════════════════
-- UNE SUPPRESSION DE PHOTO SE REPREND APRÈS LE HORS-LIGNE.
--
-- Les octets ne vivent pas dans Postgres : supprimer la ligne avant que
-- Storage ait répondu ferait perdre le seul chemin permettant de reprendre.
-- `a_supprimer` est donc un tombstone synchronisé, masqué de toutes les
-- lectures produit, puis retiré seulement après confirmation de Storage.
-- ═══════════════════════════════════════════════════════════════════════════

alter type etat_photo add value if not exists 'a_supprimer';

comment on type etat_photo is
  'locale = octets dans le coffre ; montee = objet Storage confirmé ; '
  'a_supprimer = retrait demandé, objet Storage à supprimer avant la ligne.';

-- Un tombstone doit survivre à la suppression de son porteur : son chemin est
-- le seul moyen de retirer ensuite l'objet Storage. Le cast texte permet
-- d'utiliser la nouvelle valeur dans la même migration PostgreSQL sans emploi
-- prématuré de la valeur enum ajoutée plus haut.
alter table public.photo drop constraint if exists photo_roulage_id_fkey;
alter table public.photo add constraint photo_roulage_id_fkey
  foreign key (roulage_id) references public.roulage(id) on delete set null;

alter table public.photo drop constraint if exists photo_a_un_porteur;
alter table public.photo add constraint photo_a_un_porteur check (
  etat::text = 'a_supprimer'
  or roulage_id is not null or machine_id is not null
  or intervention_id is not null or chute_id is not null
);
