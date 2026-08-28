-- ═══════════════════════════════════════════════════════════════════════════
-- LA VIDÉO DE CRASH — récit 23.10, tenu à distance jusqu'ici et pour une raison.
--
-- Le lot 23 l'a explicitement REPORTÉE : « attacher une vidéo au crash » était
-- un non-objectif, et l'hypothèse écrite disait pourquoi — il fallait un
-- versement REPRENABLE, un stockage privé, un quota dit à voix haute, une
-- suppression et un export, puis une lecture sur un second appareil. Une URL
-- externe ou un fichier qui ne vit que dans le navigateur n'est pas une pièce
-- jointe durable, et le carnet n'a pas le droit de faire semblant.
--
-- ⚠ CE QUI SÉPARE UNE VIDÉO D'UNE PHOTO ICI N'EST PAS SA NATURE, C'EST SON POIDS.
-- Une vignette pèse 300 Ko et part en un seul HTTP : si l'envoi casse, on le
-- refait en entier et personne ne le remarque. Une minute filmée au paddock
-- pèse cent fois plus. Recommencer de zéro à chaque coupure de 4G, c'est ne
-- jamais finir — et un versement qui ne finit jamais produit exactement ce que
-- le lot 23 refuse : une pièce que le carnet montre et que le serveur n'a pas.
-- D'où `octets` NOT NULL dès l'écriture locale : la reprise a besoin de savoir
-- ce qu'elle doit atteindre avant d'avoir atteint quoi que ce soit.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── ① LA TABLE ────────────────────────────────────────────────────────────
-- Comme la photo et le document : SEULES LES MÉTADONNÉES passent par la
-- synchronisation. Les octets vont en HTTP direct vers le stockage objet
-- (AD-4). Un clip de 20 Mo en base64 dans la file d'envoi la ferait exploser
-- au premier crash filmé, et c'est précisément le jour où le pilote a le plus
-- besoin que le reste de sa journée parte.
create table if not exists video (
  id uuid primary key,
  pilote_id uuid not null references pilote(id) on delete cascade,

  -- ⚠ DEUX PORTEURS, ET LE JOUR EST LE PLUS SOLIDE DES DEUX.
  -- Une vidéo de crash est AUSSI une vidéo de la journée. C'est la même clause
  -- que la photo de chute, et elle existe pour la même raison : retirer le
  -- RÉCIT d'un crash ne doit pas détruire la PREUVE. `on delete set null` sur
  -- la chute, `on delete cascade` sur le roulage — la journée disparue, la
  -- vidéo n'a plus de carnet où figurer.
  roulage_id uuid references roulage(id) on delete cascade,
  chute_id uuid references chute(id) on delete set null,

  chemin_objet text not null,
  -- Ce que le fichier pèse RÉELLEMENT après compression, arrêté à l'écriture
  -- locale. C'est la cible que la reprise compare à l'offset du serveur.
  octets bigint not null,
  duree_ms integer,
  largeur integer,
  hauteur integer,
  type_mime text,

  -- `a_supprimer` est un tombstone synchronisé, exactement comme pour la photo :
  -- la vidéo quitte les lectures tout de suite, mais son chemin reste
  -- disponible tant que le stockage n'a pas confirmé le retrait.
  etat text not null default 'locale',

  cree_le timestamptz not null default now(),

  constraint video_a_un_etat_connu
    check (etat in ('locale', 'montee', 'a_supprimer')),

  -- ⚠ LA MÊME EXCEPTION QUE LA PHOTO, ET ELLE N'EST PAS UN RELÂCHEMENT.
  -- Un tombstone est délibérément DÉTACHÉ de ses porteurs : la journée qu'il
  -- référençait peut déjà être supprimée quand la reprise de stockage le
  -- rejoue. Lui réimposer un porteur transformerait un nettoyage sûr en
  -- violation de clé étrangère (23503), c'est-à-dire en objet orphelin que
  -- plus rien ne viendra jamais effacer.
  constraint video_porte_son_jour
    check (etat = 'a_supprimer' or roulage_id is not null)
);

comment on table video is
  'Une vidéo attachée à une journée, et le plus souvent à un crash. SEULES ses '
  'métadonnées sont ici : les octets vivent dans le bucket privé `videos`, hors '
  'synchronisation. `etat = a_supprimer` est un tombstone dont les porteurs '
  'sont volontairement nuls — la reprise de stockage doit survivre à la '
  'disparition de la journée qu''il référençait.';

comment on column video.octets is
  'Le poids réel après compression, connu dès l''écriture locale. C''est la '
  'cible que le versement reprenable compare à l''offset rendu par le serveur : '
  'sans elle, une reprise ne sait pas si elle a fini.';

alter table video enable row level security;
drop policy if exists "un pilote ne voit que ses videos" on video;
create policy "un pilote ne voit que ses videos" on video
  for all using (pilote_id = (select auth.uid()))
  with check (pilote_id = (select auth.uid()));

create index if not exists video_par_roulage on video (roulage_id);
create index if not exists video_par_chute on video (chute_id)
  where chute_id is not null;
-- La reprise balaye les versements inachevés au retour de l'application. Sans
-- cet index elle lit toute la table pour trouver deux lignes.
create index if not exists video_a_verser on video (pilote_id)
  where etat <> 'montee';

-- ─── ② LE BUCKET, PRIVÉ, ET SÉPARÉ DES PHOTOS ──────────────────────────────
-- Séparé et non partagé avec `photos`, pour une raison opérationnelle : les
-- deux n'ont ni le même poids unitaire, ni la même limite, ni la même durée de
-- vie utile. Un bucket commun obligerait à régler la limite du plus gros pour
-- tout le monde — c'est-à-dire à ne plus avoir de limite du tout sur les
-- vignettes.
--
-- Le chemin écrit par l'application commence toujours par l'UUID du pilote :
--   <auth.uid()>/<chute-ou-roulage>/<video>.<ext>
-- Les quatre gestes portent exactement cette frontière, comme pour les photos.
insert into storage.buckets (id, name, public)
values ('videos', 'videos', false)
on conflict (id) do update set public = false;

drop policy if exists "videos_lire_son_prefixe" on storage.objects;
create policy "videos_lire_son_prefixe"
on storage.objects for select to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "videos_creer_sous_son_prefixe" on storage.objects;
create policy "videos_creer_sous_son_prefixe"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- ⚠ L'UPDATE N'EST PAS DÉCORATIF ICI, IL EST LE VERSEMENT REPRENABLE LUI-MÊME.
-- Le protocole d'envoi par morceaux écrit l'objet en plusieurs passes : chaque
-- PATCH qui ajoute un morceau est un UPDATE sur l'objet en cours. Sans cette
-- politique, une reprise après coupure échoue en 403 — et échoue SILENCIEUSEMENT
-- du point de vue du pilote, qui voit seulement une vidéo qui ne monte jamais.
drop policy if exists "videos_modifier_sous_son_prefixe" on storage.objects;
create policy "videos_modifier_sous_son_prefixe"
on storage.objects for update to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "videos_supprimer_sous_son_prefixe" on storage.objects;
create policy "videos_supprimer_sous_son_prefixe"
on storage.objects for delete to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- ─── ③ LA PUBLICATION ──────────────────────────────────────────────────────
-- Une table demandée par les règles de synchronisation mais absente de la
-- publication PostgreSQL ne produit AUCUN changement dans le flux logique :
-- elle reste vide sur le second appareil, sans la moindre erreur. C'est la
-- panne la plus silencieuse du dispositif, et la clause « lecture sur un
-- second appareil » du récit 23.10 tombe entièrement dedans.
--
-- La liste de reprise du 26 août est FIGÉE par un essai unitaire qui la compare
-- mot pour mot : `video` ne s'y ajoute pas, elle se publie ici.
do $$
begin
  if to_regclass('public.video') is not null
     and not exists (
       select 1
         from pg_publication_tables
        where pubname = 'powersync'
          and schemaname = 'public'
          and tablename = 'video'
     ) then
    alter publication powersync add table public.video;
  end if;
end
$$;
