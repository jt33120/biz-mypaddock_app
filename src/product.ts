/**
 * LA CONSTANTE UNIQUE DU NOM DE PRODUIT — critère d'acceptation du récit 0.3.
 *
 * MyPaddock est un NOM DE CODE, pas le nom public. QO-1 est ouverte :
 * le nom exact est exploité par Oracle Red Bull Racing (750 000 membres) et
 * ThePaddock est déjà le même produit sur l'App Store.
 *
 * Rien de public sous ce nom : ni campagne, ni boutique, ni dépôt de marque.
 * Renommer le produit = changer VITE_APP_NAME dans l'environnement. Une ligne.
 * Ne jamais écrire le nom en dur ailleurs — ni ici, ni dans un composant,
 * ni dans le manifeste, ni dans un gabarit de partage.
 */
export const PRODUCT_NAME = import.meta.env.VITE_APP_NAME ?? 'MyPaddock'
