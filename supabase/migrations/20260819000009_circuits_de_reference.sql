-- ─── LE RÉFÉRENTIEL DES CIRCUITS ──────────────────────────────────────────
--
-- Julian : « quand j'entre un roulage, liste déroulante des circuits les plus
-- connus en france (pau, nugaro, etc) mais ce serait une table de donnée à
-- remplir et améliorer ». La table existait depuis le récit 1.1 et n'avait
-- jamais reçu une ligne — le sélecteur n'avait donc rien à proposer.
--
-- TROIS RÈGLES GOUVERNENT CE CONTENU, et elles se voient dans les données :
--
--   ① `nom` est LE NOM QUE LES PILOTES DISENT, pas la raison sociale. On roule
--     « à Nogaro », pas « au circuit Paul Armagnac » ; « au Vigeant », pas « au
--     Val de Vienne ». Le champ est cherché en tapant : un nom officiel que
--     personne n'emploie est un nom introuvable. Les autres appellations sont
--     des ALIAS DE RECHERCHE, tenus côté application (src/db/corpus.ts) — elles
--     ne s'écrivent jamais dans un roulage.
--
--   ② `longueur_m` est INDICATIF et souvent NUL. Plusieurs circuits ont des
--     configurations variables (Le Castellet en compte une douzaine) et une
--     longueur fausse est pire qu'une longueur absente : elle sera lue comme
--     une mesure. Le nul est ici une réponse, pas un trou à combler.
--
--   ③ CE RÉFÉRENTIEL N'EST JAMAIS LA VÉRITÉ D'UN ROULAGE. Le roulage porte
--     `circuit_nom` en clair, saisi par le pilote, et rien ici ne peut le
--     contredire ni le remplacer. La liste est une AIDE À LA SAISIE ; un
--     circuit absent de la liste reste saisissable et se conserve mot pour mot.
--
-- L'index unique sur `lower(nom)` sert la suite : cette table est destinée à
-- grossir — par la récolte, par correction manuelle — et deux « Lédenon » qui
-- ne diffèrent que par une majuscule produiraient deux entrées jumelles dans le
-- sélecteur, ce qui est exactement ce qu'un sélecteur doit empêcher.

create unique index if not exists circuit_nom_unique on circuit (lower(nom));

insert into circuit (nom, pays, longueur_m) values
  -- France — les circuits où se tiennent les roulages moto ouverts.
  ('Pau-Arnos',          'FR', 3030),
  ('Nogaro',             'FR', 3636),
  ('Le Vigeant',         'FR', 3792),
  ('Lédenon',            'FR', 3150),
  ('Albi',               'FR', null),
  ('Magny-Cours',        'FR', 4411),
  ('Le Castellet',       'FR', null),
  ('Dijon-Prenois',      'FR', 3801),
  ('Charade',            'FR', 3975),
  ('Croix-en-Ternois',   'FR', 2300),
  ('Carole',             'FR', 2060),
  ('Bresse',             'FR', 3048),
  ('Le Mans',            'FR', 4185),
  ('Folembray',          'FR', null),
  ('Le Luc',             'FR', null),
  ('Haute Saintonge',    'FR', null),
  ('Fontenay-le-Comte',  'FR', null),
  ('Lohéac',             'FR', null),
  ('Alès',               'FR', null),
  ('Issoire',            'FR', null),
  ('Clastres',           'FR', null),
  ('Mornay',             'FR', null),
  ('Le Grand Sambuc',    'FR', null),
  ('La Ferté-Gaucher',   'FR', null),
  -- Hors de France, mais dans la saison réelle d'un pilote français : les
  -- stages d'hiver se font au sud, et un roulage saisi là-bas est un roulage.
  ('Motorland Aragón',   'ES', 5345),
  ('Jerez',              'ES', 4428),
  ('Valence',            'ES', 4005),
  ('Barcelona-Catalunya','ES', 4657),
  ('Navarra',            'ES', 3933),
  ('Portimão',           'PT', 4592),
  ('Mettet',             'BE', 2280),
  ('Spa-Francorchamps',  'BE', 7004)
on conflict (lower(nom)) do nothing;

comment on table circuit is
  'Référentiel des circuits. `nom` porte le nom parlé, pas la raison sociale ; '
  '`longueur_m` est indicatif et nul quand la configuration varie. Aide à la '
  'saisie uniquement : le roulage fait foi par son `circuit_nom` en clair.';
