import { v7 as uuidv7 } from 'uuid'

/**
 * AD-14 — Les identifiants sont générés CÔTÉ CLIENT.
 *
 * Au paddock il n'y a pas de réseau, donc pas de serveur pour attribuer un
 * identifiant. Une entité qui attendrait un id du serveur serait inutilisable
 * exactement au moment où toute la saisie a lieu.
 *
 * UUID v7 et non v4 : les 48 premiers bits portent l'horodatage en
 * millisecondes, donc l'ordre chronologique est dans la clé elle-même. Aucun
 * `order by cree_le` n'est requis pour retrouver une séquence, et l'insertion
 * reste localement ordonnée côté index — ce qu'un v4 aléatoire ne donne pas.
 *
 * `crypto.randomUUID()` produit du v4 : ne pas l'utiliser pour une clé primaire.
 */
export const nouvelId = (): string => uuidv7()
