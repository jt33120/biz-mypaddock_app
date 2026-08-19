// Témoin : aucun détourage. Sert à vérifier le banc et à donner la référence contre
// laquelle toute variante doit être meilleure.
export const nom = 'témoin — aucun détourage'
export const description = 'masque plein. La référence : tout ce qui est en dessous est inutile.'
export function masque(px, w, h) { return new Uint8Array(w * h).fill(1) }
