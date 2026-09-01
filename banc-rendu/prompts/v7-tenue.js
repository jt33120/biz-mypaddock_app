// Les prompts de la TENUE — casque et combinaison — vivent dans la fonction
// serveur, qui est le seul endroit d'où ils partent réellement. Le banc les
// RÉEXPORTE pour pouvoir les rejouer sur les photos d'essai — jamais pour en
// tenir une seconde copie. Même motif que `v6-pixel-production.js`.
export { version, modele, entreePx, GRILLE } from '../../supabase/functions/sprite/tenue.ts'
import { prompt as consigne } from '../../supabase/functions/sprite/tenue.ts'

// ⚠ LA SEULE CHOSE QUI N'EST PAS UNE RÉEXPORTATION, et c'est un ADAPTATEUR de
// signature, pas une copie de prompt : `generer.mjs` appelle `P.prompt(cadre)`
// avec le contenu de `banc-rendu/photos/<photo>.cadre.json`, là où `tenue.ts`
// attend le sujet lui-même. Le corps du prompt reste dans `tenue.ts`.
//
// ⚠ ET IL LÈVE AU LIEU DE CHOISIR UN DÉFAUT. Une photo sans `genre` déclaré
// serait rendue avec le prompt de l'autre pièce, et le banc la PAIERAIT — c'est
// exactement le défaut qu'on répare côté produit. `generer.mjs` attrape et
// affiche « ÉCHEC : … » pour cette photo, après l'autorisation de dépense mais
// AVANT le `fetch` : rien n'est appelé, rien n'est facturé, et le message dit
// quoi écrire.
//
// Le fichier de cadre tient en une ligne, à côté de la photo :
//     banc-rendu/photos/casque-julian.jpg.cadre.json   → {"genre":"casque"}
//     banc-rendu/photos/combi-noire.jpg.cadre.json     → {"genre":"combinaison"}
export const prompt = (cadre) => {
  const genre = cadre?.genre
  if (genre !== 'casque' && genre !== 'combinaison') {
    throw new Error('genre absent du .cadre.json — attendu {"genre":"casque"} '
      + 'ou {"genre":"combinaison"} ; rien n\'a été appelé')
  }
  return consigne(genre)
}
