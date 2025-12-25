import { createClient } from '@/lib/supabase/server'

/**
 * Ottiene l'utente autenticato corrente (da Supabase Auth)
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

