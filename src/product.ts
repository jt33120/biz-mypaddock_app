/**
 * LA CONSTANTE UNIQUE DU NOM DE PRODUIT — critère d'acceptation du récit 0.3.
 *
 * MyPaddock est le nom du produit, arrêté par Julian. La constante reste parce
 * qu'elle vaut par elle-même : rien n'écrit le nom en dur, ni ici, ni dans un
 * composant, ni dans le manifeste, ni dans un gabarit de partage.
 */
export const PRODUCT_NAME = import.meta.env.VITE_APP_NAME ?? 'MyPaddock'

/**
 * L'IDENTITÉ LÉGALE — et pourquoi elle n'a AUCUNE valeur par défaut.
 *
 * Publier une adresse de contact ou un nom d'éditeur est une décision qui
 * engage une personne réelle, pas un réglage technique. Inventer une adresse
 * qui ne répond pas serait pire que n'en afficher aucune : le §7 du PRD demande
 * « au minimum une adresse QUI RÉPOND ».
 *
 * Absentes, les mentions légales le DISENT au lieu de mentir, et l'application
 * continue de fonctionner. Deux variables d'environnement les remplissent, et
 * c'est un geste de trente secondes côté Vercel.
 */
export const CONTACT: string | null = import.meta.env.VITE_CONTACT?.trim() || null
export const EDITEUR: string | null = import.meta.env.VITE_EDITEUR?.trim() || null

/** Où vivent réellement les données. Vérifié, pas supposé : le projet Supabase
 *  est en `eu-west-3`, c'est-à-dire Paris, et l'instance de synchronisation
 *  aussi. Une politique de confidentialité qui se trompe là-dessus est fausse
 *  sur le seul point que la réglementation regarde en premier. */
export const REGION = 'Paris (eu-west-3), Union européenne'
