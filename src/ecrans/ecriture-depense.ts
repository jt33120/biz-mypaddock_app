export type VerrouEcritureDepense = { enregistree: boolean; enVol: boolean }

/** Le verrou porte la vérité durable hors du rendu React. Deux taps dans la
 * même image ne voient pas encore le prochain state, mais ils voient ce ref.
 * Une relecture refusée est un résultat distinct : elle ne réarme jamais
 * l'écriture qui vient de réussir. */
export async function ecrireDepenseUneFois(
  verrou: VerrouEcritureDepense,
  ecrire: () => Promise<unknown>,
  relire: () => void | Promise<void>,
  surEcrite?: () => void,
): Promise<'ignoree' | 'relue' | 'a_relire'> {
  if (verrou.enVol || verrou.enregistree) return 'ignoree'
  verrou.enVol = true
  try {
    await ecrire()
    verrou.enregistree = true
    try { surEcrite?.() } catch { /* le fait durable reste acquis */ }
    try {
      await relire()
      return 'relue'
    } catch {
      return 'a_relire'
    }
  } finally {
    verrou.enVol = false
  }
}
