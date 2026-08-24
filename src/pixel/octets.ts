/**
 * DÉCODER UNE URI `data:` SANS PASSER PAR LE RÉSEAU.
 *
 * ⚠ CE FICHIER EXISTE À CAUSE D'UN DÉFAUT QUI N'ÉTAIT VISIBLE QU'EN LIGNE, et
 * qui cassait la vitrine du produit.
 *
 * Deux endroits faisaient `await (await fetch(uri)).blob()` sur une URI `data:`.
 * C'est un idiome répandu et il marche… tant qu'aucune politique de sécurité de
 * contenu ne s'applique. La nôtre dit :
 *
 *     connect-src 'self' https://*.supabase.co https://*.powersync...
 *
 * `fetch` est régi par `connect-src`, et `data:` n'y est pas. En production, le
 * navigateur refuse donc l'appel — « Fetch API cannot load data:image/png… » —
 * et le récapitulatif partageable rendait « L'image n'a pas pu être composée sur
 * ce téléphone ». Sur toute machine ayant un portrait, c'est-à-dire le cas
 * NORMAL. Le banc ne pouvait pas le voir : `vite preview` n'envoie aucun
 * en-tête, donc aucune politique. Il en envoie désormais (vite.config.ts).
 *
 * Le correctif ne desserre pas la politique — il retire l'appel. Une URI `data:`
 * porte déjà ses octets : aller les « chercher » était un aller-retour inutile
 * doublé d'une dépendance à une permission dont on n'a pas besoin.
 */
export const enBlob = async (uri: string): Promise<Blob> => {
  // Une vraie URL (http, blob:) garde le chemin normal : elle, il faut bien
  // l'aller chercher.
  if (!uri.startsWith('data:')) return (await fetch(uri)).blob()

  const virgule = uri.indexOf(',')
  if (virgule < 0) throw new Error('URI data: sans virgule')

  const entete = uri.slice(5, virgule)
  const enBase64 = entete.endsWith(';base64')
  const type = (enBase64 ? entete.slice(0, -';base64'.length) : entete) || 'text/plain'

  const charge = uri.slice(virgule + 1)
  if (!enBase64) return new Blob([decodeURIComponent(charge)], { type })

  const binaire = atob(charge)
  const octets = new Uint8Array(binaire.length)
  for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i)
  return new Blob([octets], { type })
}
