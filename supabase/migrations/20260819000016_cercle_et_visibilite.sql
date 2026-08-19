-- ─── ÉPIQUE 14 : LE CERCLE, ET CE QUI LE REND SÛR ───────────────────────
--
-- FR-19 — LA VISIBILITÉ DU CHRONO EST UN INTERRUPTEUR, ROULAGE PAR ROULAGE,
-- réglé sur MASQUÉ par défaut. « Une comparaison imposée fait cesser la saisie
-- de celui qui en a le plus besoin. » Le défaut est donc faux, et c'est LE
-- DÉFAUT QUI PROTÈGE : un pilote qui ne fait rien ne partage rien.
alter table roulage add column if not exists chrono_visible boolean not null default false;

-- FR-39bis — UN CAP DE BRAVOURE NE SE PARTAGE JAMAIS AUTOMATIQUEMENT.
-- C'est le mécanisme le mieux établi de toute la recherche du 18 août : la
-- présence de pairs augmente la prise de risque en augmentant la sensibilité à
-- la récompense du choix risqué — trois essais randomisés convergents, avec
-- substrat neuro-imagé, et le signe s'INVERSE pour une audience passive.
--
-- Le danger n'est ni dans le catalogue ni dans le cercle pris seuls. Il est
-- dans leur CONJONCTION. Et le produit est né d'une chute causée par la
-- recherche d'un geste.
alter table geste add column if not exists partage boolean not null default false;

-- ─── LE CERCLE ───────────────────────────────────────────────────────────
-- Fermé, de l'ordre de quelques personnes. Il n'existe AUCUN classement global,
-- et aucune table de ce schéma ne pourrait en porter un.
create table if not exists cercle (
  id        uuid primary key,
  nom       text not null check (length(btrim(nom)) > 0),
  code      text not null unique check (length(code) between 6 and 12),
  cree_par  uuid not null references pilote(id) on delete cascade,
  cree_le   timestamptz not null default now()
);

create table if not exists membre_cercle (
  cercle_id  uuid not null references cercle(id) on delete cascade,
  pilote_id  uuid not null references pilote(id) on delete cascade,
  pseudo     text not null check (length(btrim(pseudo)) > 0),
  rejoint_le timestamptz not null default now(),
  primary key (cercle_id, pilote_id)
);

alter table cercle enable row level security;
alter table membre_cercle enable row level security;

-- La fonction évite la récursion : sans elle, la politique de `membre_cercle`
-- se lirait elle-même.
create or replace function est_membre(p_cercle uuid, p_pilote uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from membre_cercle where cercle_id = p_cercle and pilote_id = p_pilote)
$$;

create policy "cercle de ses membres" on cercle
  for select using (est_membre(id, (select auth.uid())));
create policy "un pilote cree un cercle" on cercle
  for insert with check (cree_par = (select auth.uid()));

create policy "membres visibles entre membres" on membre_cercle
  for select using (est_membre(cercle_id, (select auth.uid())));
create policy "on rejoint pour soi" on membre_cercle
  for insert with check (pilote_id = (select auth.uid()));
create policy "on quitte pour soi" on membre_cercle
  for delete using (pilote_id = (select auth.uid()));

-- ─── CE QUE LE CERCLE VOIT, ET RIEN D'AUTRE ──────────────────────────────
-- Une VUE, jamais un accès direct aux roulages. C'est elle qui décide, et le
-- chrono n'en sort QUE si `chrono_visible` est vrai — un pilote invisible
-- apparaît dans le cercle SANS son chrono, jamais en creux ni en dernier
-- (FR-19, FR-39). Aucune colonne de rang, aucun tri imposé : le classement
-- n'existe pas, donc il ne peut pas fuir.
create or replace view roulage_du_cercle
with (security_invoker = true) as
select r.id, r.pilote_id, m.cercle_id, m.pseudo,
       r.circuit_nom, r.date_jour,
       case when r.chrono_visible then
         (select min(t.temps_ms) from tour t
            join session s on s.id = t.session_id where s.roulage_id = r.id)
       end as meilleur_ms
  from roulage r
  join membre_cercle m on m.pilote_id = r.pilote_id
 where r.etat = 'usage'
   and est_membre(m.cercle_id, (select auth.uid()));

grant select on roulage_du_cercle to authenticated;

-- On ne peut pas LIRE un cercle dont on n'est pas membre — la politique
-- l'interdit, et c'est exactement ce qui le rend fermé. Le serveur résout donc
-- le code lui-même, sans jamais rendre le contenu du cercle à qui ne l'a pas
-- rejoint : la fonction ne renvoie qu'un identifiant, ou lève « introuvable ».
create or replace function rejoindre_cercle(p_code text, p_pseudo text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_pilote uuid := auth.uid();
  v_cercle uuid;
begin
  if v_pilote is null then raise exception 'sans_compte'; end if;
  if length(btrim(p_pseudo)) = 0 then raise exception 'pseudo_vide'; end if;

  select id into v_cercle from cercle where code = upper(btrim(p_code));
  if v_cercle is null then raise exception 'introuvable'; end if;

  insert into membre_cercle (cercle_id, pilote_id, pseudo)
  values (v_cercle, v_pilote, btrim(p_pseudo))
  on conflict (cercle_id, pilote_id) do update set pseudo = excluded.pseudo;

  return v_cercle;
end $$;

revoke all on function rejoindre_cercle(text, text) from public, anon;
grant execute on function rejoindre_cercle(text, text) to authenticated;
