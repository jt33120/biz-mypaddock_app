-- ─── LE FILET MONÉTAIRE ──────────────────────────────────────────────────
--
-- Trois trous trouvés par une passe adverse sur le code du récit 3bis.3.
-- Aucun ne se voyait à la relecture, et les trois portaient sur de l'argent.
--
-- ① LE QUOTA SE RELEVAIT PAR CELUI QU'IL BORNE. La politique de `pilote` était
--    `for all` : un simple `PATCH /rest/v1/pilote` suffisait à porter
--    `quota_sprites` à 32767, soit 5 242 € en un appel — et relevable autant de
--    fois qu'on veut. Un `DELETE` de sa propre ligne remettait même le compteur
--    à zéro par cascade. Le pilote garde la LECTURE de lui-même, et rien d'autre.
--
-- ② LIRE PUIS ÉCRIRE laissait passer N appels simultanés. Le comptage et
--    l'insertion étaient deux requêtes distinctes, et `generation` n'avait
--    aucune contrainte pour les départager : dix appuis rapprochés payaient dix
--    fois pour un quota de trois. Tout se fait désormais dans UNE transaction,
--    sous verrou consultatif posé sur le pilote — deux appels du même compte se
--    sérialisent, deux comptes différents ne s'attendent pas.
--
-- ③ AUCUN TOTAL. Le seul plafond portait sur un pilote, et `cout_centimes`
--    n'avait aucun lecteur dans tout le dépôt : la somme montait sans que rien
--    ne la borne ni ne la montre. Le plafond est désormais GLOBAL et glissant
--    sur vingt-quatre heures — le seul garde-fou qui tienne le jour où mille
--    inconnus arrivent en même temps. Il vit en base, donc il se relève sans
--    redéploiement, comme le quota et le catalogue (AD-10).

drop policy if exists "un pilote ne voit que lui" on pilote;
create policy "un pilote se lit lui-meme" on pilote
  for select using (id = (select auth.uid()));

create table if not exists plafond (
  id                     boolean primary key default true check (id),
  par_jour_centimes      integer not null default 500,
  cout_unitaire_centimes integer not null default 16
);
insert into plafond (id) values (true) on conflict (id) do nothing;
alter table plafond enable row level security;
-- Aucune politique : personne ne le lit par l'API. Seule la fonction
-- `security definer` y accède, et c'est ce qui le rend infranchissable.

-- Le pilote voyage EN PARAMÈTRE et la fonction n'appelle pas `auth.uid()` :
-- la fonction Edge se connecte avec la clé de service, où `auth.uid()` est nul.
-- La faire dépendre du jeton obligerait à ouvrir l'appel au rôle `authenticated`,
-- et un client pourrait alors brûler ses propres créneaux sans recevoir d'image.
create or replace function reserver_generation(p_pilote uuid, p_machine uuid)
returns table (reservation uuid, reste integer, quota integer)
language plpgsql security definer set search_path = public as $$
declare
  v_quota    integer;
  v_faites   integer;
  v_cout     integer;
  v_jour     integer;
  v_plafond  integer;
  v_id       uuid;
begin
  if p_pilote is null then raise exception 'sans_compte'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_pilote::text, 0));

  select par_jour_centimes, cout_unitaire_centimes into v_plafond, v_cout from plafond;
  select quota_sprites into v_quota from pilote where id = p_pilote;
  if v_quota is null then raise exception 'sans_compte'; end if;

  select count(*) into v_faites from generation where pilote_id = p_pilote;
  if v_faites >= v_quota then raise exception 'quota'; end if;

  select coalesce(sum(cout_centimes), 0) into v_jour
    from generation where cree_le > now() - interval '24 hours';
  if v_jour + v_cout > v_plafond then raise exception 'plafond_global'; end if;

  insert into generation (pilote_id, machine_id, version, modele, cout_centimes)
    values (p_pilote, p_machine, 'v6', 'gemini-3-pro-image', v_cout)
    returning id into v_id;

  return query select v_id, v_quota - v_faites - 1, v_quota;
end $$;

revoke all on function reserver_generation(uuid, uuid) from public, anon, authenticated;

comment on function reserver_generation is
  'Compte, teste le quota du pilote, teste le plafond global sur 24 h et insère '
  'la réservation dans UNE seule transaction, sous verrou. Réservée au rôle de '
  'service : la fonction serveur est le seul appelant légitime.';
