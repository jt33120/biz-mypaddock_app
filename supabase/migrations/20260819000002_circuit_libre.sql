-- Le circuit SE SAISIT — il ne se choisit pas dans une liste qui n'existe pas.
--
-- Défaut révélé par le récit 1.2, et invisible tant que rien ne partait : la PWA
-- écrivait le NOM du circuit (« Pau-Arnos ») dans `circuit_id`, une colonne uuid
-- portant une clé étrangère vers le référentiel. Aucune synchronisation n'aurait
-- jamais pu aboutir : la première ligne envoyée aurait été refusée en 22P02, et
-- la file d'envoi serait restée bloquée dessus pour toujours.
--
-- La correction n'est pas un contournement, c'est le modèle réel : au paddock le
-- pilote nomme son circuit, et le référentiel n'existera qu'après la récolte.
-- Le nom est donc une donnée de premier rang, et `circuit_id` la NORMALISATION
-- qui viendra plus tard — jamais l'inverse.
alter table roulage add column circuit_nom text;

comment on column roulage.circuit_nom is
  'Le circuit tel que le pilote l''a nommé. Fait foi tant que circuit_id est nul.';
comment on column roulage.circuit_id is
  'Rattachement au référentiel, posé par la récolte. Nul tant qu''aucun appariement n''a eu lieu.';

-- Un roulage sans circuit ne veut rien dire : l'un des deux au moins est présent.
alter table roulage add constraint roulage_a_un_circuit
  check (circuit_nom is not null or circuit_id is not null);
