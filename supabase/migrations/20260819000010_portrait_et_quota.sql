-- ─── LE PORTRAIT DE MACHINE ET LE QUOTA DE GÉNÉRATION — récit 3bis.3 ──────
--
-- Deux ajouts, et le second est le seul poste du produit qui coûte de l'argent.
--
-- ① `machine.photo_chemin` — LA PHOTO RÉELLE de la moto, distincte du sprite.
--   Sans elle, le quatrième critère du récit — « un rendu refusé, la photo
--   réelle reprend sa place » — serait invérifiable : il n'y aurait rien à quoi
--   revenir. Le pixel est une PRÉSENTATION, jamais un remplacement destructif,
--   et cette colonne est ce qui rend la phrase vraie plutôt que rassurante.
--
-- ② `generation` — une ligne par appel au modèle d'image, écrite PAR LE SERVEUR
--   SEUL. C'est le compteur qui tient le quota, et il ne tiendrait rien s'il
--   était écrit par le client : n'importe qui pourrait s'en fabriquer un vide.
--   D'où l'absence délibérée de politique d'insertion — seule la clé de service,
--   côté fonction, y écrit.
--
-- Le quota vit sur le pilote et non dans le code : on le relève pour quelqu'un
-- sans redéployer, comme le catalogue et les conseils (AD-10). Trois par défaut,
-- soit ≈ 0,48 € par compte — le chiffre qui empêche mille curieux à trois essais
-- de coûter 480 € sans une recette.

alter table machine add column if not exists photo_chemin text;

comment on column machine.photo_chemin is
  'Photo réelle de la machine, dans le stockage objet. Indépendante de `sprite` : '
  'un sprite refusé se retire sans rien détruire, et la photo reprend sa place.';

alter table pilote add column if not exists quota_sprites smallint not null default 3;

comment on column pilote.quota_sprites is
  'Nombre de générations d''image autorisées pour ce pilote. Donnée et non '
  'constante compilée : se relève sans redéploiement.';

create table if not exists generation (
  id              uuid primary key default gen_random_uuid(),
  pilote_id       uuid not null references pilote(id) on delete cascade,
  machine_id      uuid,
  version         text not null,
  modele          text not null,
  -- Le coût est ÉCRIT, pas déduit d'un tarif au moment de la lecture : un tarif
  -- change, et une facture passée ne doit pas changer avec lui.
  cout_centimes   integer not null check (cout_centimes >= 0),
  -- Une réservation devient une production quand l'image est revenue. Réserver
  -- AVANT d'appeler est ce qui empêche un double appui de payer deux fois ; et
  -- un échec efface la réservation, donc l'erreur penche du côté qui ne dépense pas.
  etat            text not null default 'reservee' check (etat in ('reservee', 'produite')),
  cree_le         timestamptz not null default now()
);

create index if not exists generation_par_pilote on generation (pilote_id, cree_le desc);

alter table generation enable row level security;

-- Lecture de ses propres lignes : le pilote doit pouvoir voir ce qui lui reste.
create policy "generation lisible par son pilote" on generation
  for select using (pilote_id = (select auth.uid()));

-- AUCUNE politique d'insertion, de mise à jour ni de suppression. Ce n'est pas
-- un oubli : un compteur de quota que le compté peut écrire ne compte rien.
