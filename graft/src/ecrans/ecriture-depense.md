# src/ecrans/ecriture-depense.ts

- VerrouEcritureDepense · type · L1-L1 — type VerrouEcritureDepense = { enregistree: boolean; enVol: boolean }
- ecrireDepenseUneFois · function · L7-L28 — async function ecrireDepenseUneFois( verrou: VerrouEcritureDepense, ecrire: () => Promise<unknown>, relire: () => void | Promise<void>, surEcrite?: () => void, ): Promise<'ignoree' | 'relue' | 'a_relire'>
