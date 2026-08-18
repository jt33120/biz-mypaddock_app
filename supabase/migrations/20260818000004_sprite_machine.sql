-- Le garage prend son portrait. La machine devient une PRÉSENCE et non une
-- ligne de texte — c'est l'axe machine d'AD-2 qui gagne enfin une surface.
--
-- Le sprite est produit DANS LE TÉLÉPHONE : sous-échantillonnage de la photo
-- puis quantification sur la palette du produit. Aucun appel réseau, aucun
-- coût, aucune hallucination possible, et ça marche au paddock.
alter table machine add column sprite text;
comment on column machine.sprite is
  'Portrait pixel, PNG en data URI, produit localement depuis une photo. Jamais généré côté serveur.';
