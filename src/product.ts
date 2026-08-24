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

/**
 * QUEL EXEMPLAIRE DU PRODUIT EST-CE ?
 *
 * ⚠ CETTE CONSTANTE EXISTE À CAUSE D'UN DÉFAUT QUI SE DÉCLENCHAIT TOUT SEUL, sur
 * le geste même qu'une recette existe pour éprouver : se connecter.
 *
 * L'adoption — le dépôt sur le serveur de ce qui a été saisi avant le compte —
 * part automatiquement dès qu'une identité apparaît, sans bouton et sans
 * question. Elle ne se rejoue pas, parce qu'un drapeau la retient… et ce drapeau
 * vit dans le `localStorage`, donc PAR ORIGINE. Une recette est une autre
 * origine : le drapeau y est absent, quel que soit le compte.
 *
 * Enchaînement, avec un seul compte dans tout le projet : on ouvre la recette,
 * on saisit trois journées bidon (le produit s'ouvre sans compte, c'est une
 * règle de fond), on se connecte pour éprouver l'authentification — et les trois
 * journées bidon atterrissent dans la vraie saison, estampillées du vrai pilote,
 * puis redescendent sur le vrai téléphone. Rien ne les distingue : le ménage se
 * ferait ligne par ligne, en SQL. Et ensuite la synchronisation continue reste
 * allumée depuis l'origine de test.
 *
 * Pire, et plus discret : `ouverture()` écrit une ligne de `mesure` à chaque
 * démarrage, et `mesure` monte avec le reste. Vingt ouvertures de recette
 * suffisent à fausser le seul instrument qui dise si le produit est utilisé.
 *
 * LE DÉFAUT PAR DÉFAUT EST « PAS LA PRODUCTION ». Un hôte inconnu — une
 * prévisualisation, un domaine neuf, un poste de développement — est traité
 * comme une recette. Se tromper dans ce sens fait apparaître un bandeau de trop ;
 * se tromper dans l'autre déverse des données de test dans une vraie saison.
 */
export type Environnement = 'production' | 'recette' | 'local'

/** L'hôte de production, et lui seul. Le jour où un vrai domaine arrive, il
 *  s'ajoute ICI — ou se pose dans `VITE_ENVIRONNEMENT`, qui prime. */
const HOTES_DE_PRODUCTION = ['mypaddock.vercel.app']
const HOTES_LOCAUX = ['localhost', '127.0.0.1', '[::1]', '::1']

export const lireEnvironnement = (declare: string | undefined, hote: string): Environnement => {
  const d = declare?.trim().toLowerCase()
  if (d === 'production' || d === 'recette' || d === 'local') return d
  if (HOTES_LOCAUX.includes(hote)) return 'local'
  if (HOTES_DE_PRODUCTION.includes(hote)) return 'production'
  return 'recette'
}

export const ENVIRONNEMENT: Environnement = lireEnvironnement(
  import.meta.env.VITE_ENVIRONNEMENT,
  typeof location === 'undefined' ? '' : location.hostname)

export const EST_PRODUCTION = ENVIRONNEMENT === 'production'

/** Ce que le bandeau dit, et pourquoi il le dit. Les deux interfaces sont
 *  identiques au pixel près : sans ces mots, rien ne distingue la copie de
 *  l'original, et c'est comme ça qu'on efface une vraie journée en croyant
 *  éprouver un bouton. */
export const MOT_ENVIRONNEMENT: Record<Exclude<Environnement, 'production'>, string> = {
  recette: 'RECETTE · ce que tu fais ici touche la vraie base',
  local: 'LOCAL · ce que tu fais ici touche la vraie base',
}
