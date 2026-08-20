-- ═══════════════════════════════════════════════════════════════════════════
-- LE MANUEL RESTE AU GARAGE — retour de Julian du 20 août 2026 :
--
--   « un websearch une fois puis sauvegarde dans le Supabase Storage le manuel
--     d'entretien »
--
-- ⚠ UN ARBITRAGE JURIDIQUE EST FAIT ICI, ET IL CHANGE LE MÉCANISME.
--
-- La lecture littérale serait : le serveur va chercher l'URL trouvée et en
-- dépose une copie. Je ne l'ai pas fait, et le motif n'est pas technique — un
-- manuel d'atelier est une œuvre protégée. Aller la chercher et l'héberger, ce
-- serait en distribuer une copie depuis notre infrastructure, pour tous les
-- pilotes qui ont la même moto. Ce n'est plus « garder mon manuel », c'est
-- devenir une bibliothèque de manuels.
--
-- CE QUI EST FAIT À LA PLACE, et qui rend le même service : le pilote VERSE son
-- document, exactement comme il verse une facture. C'est son fichier, dans son
-- espace, sous sa politique — et le résultat pour lui est identique : le manuel
-- est là au paddock, sans réseau, à côté de la moto qu'il concerne.
--
-- La recherche web reste ce qu'elle est : elle l'aide à le TROUVER. Le pas
-- entre trouver et garder est le sien, et c'est le seul qui engage quelqu'un.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists document (
  id uuid primary key,
  pilote_id uuid not null references pilote(id) on delete cascade,
  -- Un document appartient à une MACHINE : le manuel de la CBR n'est pas celui
  -- de la R6, et c'est la seule chose qui les distingue à l'écran.
  machine_id uuid not null references machine(id) on delete cascade,
  nom text not null,
  genre text not null default 'manuel',
  chemin_objet text not null,
  octets integer,
  type_mime text,
  cree_le timestamptz not null default now()
);

alter table document drop constraint if exists document_genre_connu;
alter table document add constraint document_genre_connu
  check (genre in ('manuel', 'carte_grise', 'assurance', 'facture', 'autre'));

comment on table document is
  'Un document VERSÉ PAR LE PILOTE et rattaché à une machine. Le serveur ne va '
  'jamais chercher un document tiers : un manuel d''atelier est une œuvre '
  'protégée, et en héberger une copie pour tous ceux qui ont la même moto n''est '
  'plus « garder mon manuel », c''est devenir une bibliothèque de manuels.';

alter table document enable row level security;
drop policy if exists "un pilote ne voit que ses documents" on document;
create policy "un pilote ne voit que ses documents" on document
  for all using (pilote_id = (select auth.uid()))
  with check (pilote_id = (select auth.uid()));

create index if not exists document_par_machine on document (machine_id);

-- ─── LE STOCKAGE ───────────────────────────────────────────────────────────
-- Un bucket SÉPARÉ de `photos`, et privé comme lui. Les mélanger obligerait à
-- distinguer une image d'un PDF par son extension au moment de l'afficher, et
-- ferait porter au bucket un nom qui ment sur son contenu.
--
-- 25 Mio : un manuel d'atelier scanné dépasse allègrement les 5 Mio par défaut,
-- et un plafond trop bas produit un échec au moment précis où le pilote fait
-- l'effort de verser le document.
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 26214400)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

-- Les quatre politiques, sur le MÊME motif que les photos : le premier segment
-- du chemin est l'identifiant du pilote, et c'est lui qu'on compare à auth.uid().
drop policy if exists "document pose par son pilote"     on storage.objects;
drop policy if exists "document lu par son pilote"       on storage.objects;
drop policy if exists "document remplace par son pilote" on storage.objects;
drop policy if exists "document retire par son pilote"   on storage.objects;

create policy "document pose par son pilote" on storage.objects for insert
  to authenticated with check (
    bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "document lu par son pilote" on storage.objects for select
  to authenticated using (
    bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "document remplace par son pilote" on storage.objects for update
  to authenticated using (
    bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "document retire par son pilote" on storage.objects for delete
  to authenticated using (
    bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
