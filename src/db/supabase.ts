import { createClient } from '@supabase/supabase-js'

/**
 * AD-15 — Le paquet client ne contient QUE la clé publiable.
 * Aucune clé de service, aucune clé de fournisseur d'IA ne porte le préfixe
 * VITE_, parce que tout ce qui le porte part dans le bundle et devient public.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const cle = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabaseConfigure = Boolean(url && cle)

export const supabase = supabaseConfigure
  ? createClient(url, cle, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null
