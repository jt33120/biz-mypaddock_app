-- ═══════════════════════════════════════════════════════════════════════════
-- UN CRASH EST QUALIFIÉ, JAMAIS DÉDUIT D'UN SILENCE.
--
-- L'absence de ligne `chute` ne signifie pas « aucun crash » : elle signifie
-- seulement que le pilote ne l'a pas encore renseigné. `aucun` est donc une
-- déclaration explicite ; `documente` correspond à au moins une chute écrite.
-- ═══════════════════════════════════════════════════════════════════════════

alter table roulage
  add column if not exists crash_statut text not null default 'a_renseigner';

-- Rend la migration rejouable sur un environnement qui aurait reçu une version
-- intermédiaire nullable de la colonne.
update roulage
   set crash_statut = 'a_renseigner'
 where crash_statut is null
    or crash_statut not in ('a_renseigner', 'aucun', 'documente');

update roulage r
   set crash_statut = 'a_renseigner'
 where crash_statut = 'documente'
   and not exists (select 1 from chute c where c.roulage_id = r.id);

-- Les seules anciennes journées que l'on sait qualifier sont celles qui ont
-- déjà une chute : tout le reste demeure inconnu, jamais « aucun » par défaut.
update roulage r
   set crash_statut = 'documente'
 where exists (select 1 from chute c where c.roulage_id = r.id);

alter table roulage alter column crash_statut set default 'a_renseigner';
alter table roulage alter column crash_statut set not null;

alter table roulage drop constraint if exists roulage_crash_statut_connu;
alter table roulage add constraint roulage_crash_statut_connu
  check (crash_statut in ('a_renseigner', 'aucun', 'documente'));

comment on column roulage.crash_statut is
  'a_renseigner = aucune déclaration ; aucun = le pilote déclare aucun crash ; '
  'documente = au moins un crash est consigné. Jamais déduit d''une absence.';
