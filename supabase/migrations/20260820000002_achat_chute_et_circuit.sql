-- ═══════════════════════════════════════════════════════════════════════════
-- LE PRIX D'ACHAT, LA CHUTE, ET CE QU'UN CIRCUIT SAIT DE LUI-MÊME.
-- Retours de Julian du 20 août 2026.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── ① LE PRIX D'ACHAT DE LA MOTO ──────────────────────────────────────────
-- « Ajouter le prix d'achat de la moto quelque part. »
--
-- Il ne rejoint PAS la table `depense`, et c'est un choix de fond. Une dépense
-- appartient à une saison (`saison_annee`) et entre dans le budget de l'année ;
-- l'achat d'une moto conservée cinq ans écraserait le budget de la première
-- saison et disparaîtrait des quatre suivantes. C'est une donnée d'IDENTITÉ de
-- la machine — ce qu'elle a coûté à entrer au garage — pas une ligne de saison.
alter table machine add column if not exists prix_achat_centimes integer;
alter table machine add column if not exists achetee_le text;

alter table machine drop constraint if exists machine_achat_est_un_mois;
alter table machine add constraint machine_achat_est_un_mois
  check (achetee_le is null or achetee_le ~ '^\d{4}-\d{2}$');

comment on column machine.prix_achat_centimes is
  'Ce que la moto a coûté à entrer au garage. PAS une `depense` : celle-ci '
  'appartient à une saison, et un achat conservé cinq ans écraserait le budget '
  'de la première année pour disparaître des quatre suivantes.';

-- ─── ② LA CHUTE ────────────────────────────────────────────────────────────
-- « Renseigner sur un roulage s'il y a eu une chute, et des infos sur la chute. »
--
-- ⚠ CE QUE CETTE TABLE N'AURA JAMAIS, ET C'EST LA CLAUSE LA PLUS IMPORTANTE DU
-- SCHÉMA ENTIER.
--
-- Aucun compteur de chutes. Aucune série « sans chute ». Aucune gravité, aucune
-- responsabilité, aucun classement. Le produit est né d'une chute causée par la
-- recherche d'un geste ; il n'a pas le droit d'en faire un score.
--
-- La série « X roulages sans chute » est la pire mécanique imaginable ici, et
-- elle serait la plus tentante : elle crée une pression à ne pas la rompre,
-- donc à NE PAS DÉCLARER une chute. Un carnet qu'on n'ose pas remplir ne vaut
-- rien, et sur ce sujet-là il vaut moins que rien. Ce qui n'existe pas dans le
-- schéma ne s'affiche pas par accident : il n'y a donc ici ni `gravite`, ni
-- `faute`, ni `evitable`, ni le moindre entier qui puisse se sommer.
--
-- Ce qu'elle porte est un RÉCIT et un ENDROIT, tous deux libres et facultatifs.
-- Une chute qu'on ne veut pas raconter reste une chute consignée.
create table if not exists chute (
  id uuid primary key,
  pilote_id uuid not null references pilote(id) on delete cascade,
  roulage_id uuid not null references roulage(id) on delete cascade,
  -- « virage 3 », « l'épingle », « la ligne droite » : ce que le pilote dit,
  -- jamais une coordonnée. Le téléphone n'est pas en piste (AD-3).
  endroit text,
  recit text,
  cree_le timestamptz not null default now()
);

comment on table chute is
  'Une chute consignée sur une journée. AUCUN compteur, AUCUNE série « sans '
  'chute », AUCUNE gravité : une série sur ce sujet crée une pression à ne pas '
  'la rompre, donc à ne pas déclarer. Un carnet qu''on n''ose pas remplir ne '
  'vaut rien.';

alter table chute enable row level security;
drop policy if exists "un pilote ne voit que ses chutes" on chute;
create policy "un pilote ne voit que ses chutes" on chute
  for all using (pilote_id = (select auth.uid()))
  with check (pilote_id = (select auth.uid()));

create index if not exists chute_par_roulage on chute (roulage_id);

-- CE QUE LA CHUTE A CASSÉ. Le lien est sur l'intervention et non l'inverse :
-- une chute produit zéro, une ou dix réparations, et chacune reste une
-- intervention ordinaire — même carnet, même preuve, même horloge. Rattacher
-- les réparations À la chute plutôt que de dupliquer un carnet évite d'avoir
-- deux endroits où lire ce que la moto a subi.
alter table intervention add column if not exists chute_id uuid
  references chute(id) on delete set null;
create index if not exists intervention_par_chute on intervention (chute_id)
  where chute_id is not null;

-- Et la photo aussi : l'état d'une moto après une chute est une preuve, au même
-- titre qu'une facture. `on delete set null` et non `cascade` — retirer une
-- chute ne doit pas détruire les photos de la journée.
alter table photo add column if not exists chute_id uuid
  references chute(id) on delete set null;
create index if not exists photo_par_chute on photo (chute_id) where chute_id is not null;

alter table photo drop constraint if exists photo_a_un_porteur;
alter table photo add constraint photo_a_un_porteur
  check (roulage_id is not null or machine_id is not null
      or intervention_id is not null or chute_id is not null);

-- ─── ③ CE QU'UN CIRCUIT SAIT DE LUI-MÊME ───────────────────────────────────
-- « Pour chaque circuit : le plan du circuit, les virages principaux, la
--   longueur, bon à savoir, lien vers le site du circuit. »
--
-- Le référentiel est en LECTURE SEULE pour la PWA (AD-12) : ces colonnes se
-- remplissent par la récolte ou à la main en base, jamais depuis l'application.
--
-- ⚠ CHAQUE CHAMP RÉCOLTÉ PORTE SA SOURCE, comme le barème. Un « bon à savoir »
-- extrait par IA est une reconstruction, pas une transcription — et sur un
-- circuit, « le virage 3 se prend en aveugle » est une phrase qui engage la
-- sécurité de quelqu'un.
alter table circuit add column if not exists site_web text;
alter table circuit add column if not exists plan_url text;
alter table circuit add column if not exists nb_virages integer;
alter table circuit add column if not exists sens text;
alter table circuit add column if not exists bon_a_savoir text;
alter table circuit add column if not exists source_url text;
alter table circuit add column if not exists recolte_le timestamptz;
alter table circuit add column if not exists extrait_par_ia boolean not null default false;

alter table circuit drop constraint if exists circuit_sens_connu;
alter table circuit add constraint circuit_sens_connu
  check (sens is null or sens in ('horaire', 'antihoraire'));

-- La même clause que pour le barème, à la lettre : ce qui vient d'une
-- extraction dit d'où il vient et quand, ou il n'est pas écrit.
alter table circuit drop constraint if exists circuit_extraction_porte_sa_source;
alter table circuit add constraint circuit_extraction_porte_sa_source
  check (not extrait_par_ia or (source_url is not null and recolte_le is not null));

-- LES VIRAGES, un par ligne. Une liste dans une colonne texte ne se lit pas, ne
-- se corrige pas et ne se traduit pas — et c'est exactement ce qu'on voudrait
-- afficher un par un à l'écran.
create table if not exists virage (
  id uuid primary key,
  circuit_id uuid not null references circuit(id) on delete cascade,
  numero integer,
  nom text,
  note text,
  source_url text,
  recolte_le timestamptz,
  extrait_par_ia boolean not null default false,
  unique (circuit_id, numero)
);

alter table virage drop constraint if exists virage_extraction_porte_sa_source;
alter table virage add constraint virage_extraction_porte_sa_source
  check (not extrait_par_ia or (source_url is not null and recolte_le is not null));

comment on table virage is
  'Un virage par ligne, jamais une liste dans une colonne texte : une liste ne '
  'se lit pas, ne se corrige pas, et c''est pourtant un par un qu''on veut les '
  'afficher. Référentiel — la PWA le lit et ne l''écrit jamais (AD-12).';

alter table virage enable row level security;
drop policy if exists "le referentiel se lit" on virage;
create policy "le referentiel se lit" on virage for select using (true);
grant select on virage to authenticated, anon;
