-- ═══════════════════════════════════════════════════════════════════════════
-- LE BUCKET PHOTO EXISTE PAR MIGRATION ET RESTE PRIVÉ.
--
-- Le chemin écrit par l'application commence toujours par l'UUID du pilote :
--   <auth.uid()>/<roulage-ou-porteur>/<photo>.webp
-- Les quatre gestes Storage portent exactement cette frontière. La reprise ne
-- touche ni limite de taille ni types MIME éventuellement réglés à la main.
-- ═══════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do update set public = false;

drop policy if exists "photos_lire_son_prefixe" on storage.objects;
create policy "photos_lire_son_prefixe"
on storage.objects for select to authenticated
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "photos_creer_sous_son_prefixe" on storage.objects;
create policy "photos_creer_sous_son_prefixe"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "photos_modifier_sous_son_prefixe" on storage.objects;
create policy "photos_modifier_sous_son_prefixe"
on storage.objects for update to authenticated
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "photos_supprimer_sous_son_prefixe" on storage.objects;
create policy "photos_supprimer_sous_son_prefixe"
on storage.objects for delete to authenticated
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
