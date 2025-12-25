import { createClient } from '@/lib/supabase/server'
import { UserRole } from '@/lib/supabase/types'

/**
 * Determina il ruolo dell'utente autenticato usando la funzione/profilo_utenti
 * Restituisce null se non autenticato o ruolo non valido
 */
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return null
  }

  // Usa le funzioni RPC invece di leggere direttamente la tabella
  // Le funzioni RPC devono essere SECURITY DEFINER per bypassare RLS
  // Verifica nell'ordine: admin (che è anche staff), segretaria (staff), paziente
  
  // Admin è anche staff, quindi controllo prima is_admin
  const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin')
  if (!adminError && isAdminResult === true) {
    return 'admin' // Admin è anche staff, ma ritorniamo 'admin'
  }

  // Se non è admin, controllo se è staff (segretaria)
  const { data: isStaffResult, error: staffError } = await supabase.rpc('is_staff')
  if (!staffError && isStaffResult === true) {
    // Se è staff ma non admin (dato che is_admin() è false), è segretaria
    return 'segretaria'
  }

  // Se non è né admin né staff, controllo se è paziente
  const { data: isPazienteResult, error: pazienteError } = await supabase.rpc('is_paziente')
  if (!pazienteError && isPazienteResult === true) {
    return 'paziente'
  }

  return null
}

/**
 * Verifica se l'utente è admin (usando la funzione is_admin() del DB)
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('is_admin')
  
  if (error || !data) {
    return false
  }
  
  return data === true
}

/**
 * Verifica se l'utente è staff (admin o segretaria)
 * Usa la funzione is_staff() del database
 */
export async function isStaff(): Promise<boolean> {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('is_staff')
  
  if (error || !data) {
    return false
  }
  
  return data === true
}

/**
 * Verifica se l'utente è paziente
 */
export async function isPaziente(): Promise<boolean> {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('is_paziente')
  
  if (error || !data) {
    return false
  }
  
  return data === true
}

