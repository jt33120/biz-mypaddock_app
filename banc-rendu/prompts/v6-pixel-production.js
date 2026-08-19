// Le prompt v6 vit désormais dans la fonction serveur, qui est le seul
// endroit d'où il part réellement. Le banc le réexporte pour pouvoir le
// rejouer sur les photos d'essai — jamais pour en tenir une seconde copie.
export { version, modele, entreePx, GRILLE, prompt } from '../../supabase/functions/sprite/v6.ts'
