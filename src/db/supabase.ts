import { createClient } from '@supabase/supabase-js'

/**
 * AD-15 — Le paquet client ne contient QUE la clé publiable.
 * Aucune clé de service, aucune clé de fournisseur d'IA ne porte le préfixe
 * VITE_, parce que tout ce qui le porte part dans le bundle et devient public.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const cle = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabaseConfigure = Boolean(url && cle)

/** ⚠ RENDUE PARCE QU'UN VERSEMENT REPRENABLE NE PASSE PAS PAR LE CLIENT.
 *  Le client `storage` ne sait faire qu'un envoi en un seul HTTP. Le protocole
 *  par morceaux se parle à la main, sur `/storage/v1/upload/resumable`, et il
 *  lui faut donc l'origine — pas pour contourner le client, mais parce que ce
 *  chemin-là n'existe pas dans son API. Voir `src/db/video.ts`. */
export const supabaseUrl: string | null = url ?? null

export const supabase = supabaseConfigure
  ? createClient(url, cle, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null
