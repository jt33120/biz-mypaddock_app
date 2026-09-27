-- ═══════════════════════════════════════════════════════════════════════════
-- LE CARNET RELÈVE LE COMPTEUR — retour de Julian du 27 sept. 2026.
--
--   « Nous avons fait aujourd'hui la vidange à 31 737 km. »
--
-- Un carnet d'entretien qui ne dit pas à quel kilométrage le geste a été fait
-- n'est pas un carnet : c'est la première ligne qu'un acheteur, un préparateur
-- ou un contrôleur lit. Jusqu'ici aucun kilométrage n'existait nulle part.
--
-- ⚠ LE RELEVÉ EST UN FAIT DU GESTE, JAMAIS UNE HORLOGE. Il vit sur
-- l'intervention, pas sur la machine, et rien ne le convertit en roulages : le
-- compteur d'une moto de piste ne tourne qu'entre le camion et la pitlane, et
-- l'horloge d'usure compte toujours des roulages (FR-41, FR-44). Les deux se
-- lisent côte à côte ; ils ne se parlent pas.
--
-- NULLABLE ET SANS DÉFAUT, délibérément : un geste consigné au paddock, d'un
-- tap, n'a pas de relevé — et « pas relevé » n'est pas « zéro ». La colonne
-- n'est donc pas une mine pour l'adoption (voir DEFAUTS_SERVEUR).
-- ═══════════════════════════════════════════════════════════════════════════

alter table intervention add column if not exists compteur_km integer;

alter table intervention drop constraint if exists intervention_compteur_plausible;
alter table intervention add constraint intervention_compteur_plausible
  check (compteur_km is null or compteur_km between 0 and 2000000);

comment on column intervention.compteur_km is
  'Le kilométrage lu au compteur le jour du geste. Nul = non relevé, jamais zéro. '
  'Un fait du carnet, jamais converti en roulages ni lu par une horloge d''usure.';
