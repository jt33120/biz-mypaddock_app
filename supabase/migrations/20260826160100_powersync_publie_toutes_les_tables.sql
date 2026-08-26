-- ═══════════════════════════════════════════════════════════════════════════
-- LA CONFIGURATION DE SYNCHRONISATION NE SUFFIT PAS À PUBLIER UNE TABLE.
--
-- Ces tables sont déjà demandées par `powersync/sync-config.yaml`, mais une
-- table absente de la publication PostgreSQL ne produit aucun changement dans
-- le flux logique : elle reste donc vide sur le second appareil, sans erreur.
-- La reprise est idempotente et n'ajoute que les absentes.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  nom_table text;
begin
  foreach nom_table in array array[
    'evenement_vise',
    'horloge',
    'checklist_ligne',
    'equipement',
    'chute',
    'document',
    'generation',
    'virage',
    'coefficient_usure',
    'regle_organisateur'
  ]
  loop
    if to_regclass(format('public.%I', nom_table)) is not null
       and not exists (
         select 1
           from pg_publication_tables
          where pubname = 'powersync'
            and schemaname = 'public'
            and tablename = nom_table
       ) then
      execute format('alter publication powersync add table public.%I', nom_table);
    end if;
  end loop;
end
$$;
