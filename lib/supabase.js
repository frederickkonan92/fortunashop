import { createClient } from '@supabase/supabase-js'
// createClient : fonction qui ouvre la connexion vers ta base Supabase

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  // L'adresse de ton projet Supabase (lue depuis .env.local)

  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  // La clé publique pour lire/écrire les données
)