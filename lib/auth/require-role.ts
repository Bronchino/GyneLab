import { redirect } from 'next/navigation'
import { getUserRole, isAdmin, isStaff, isPaziente } from './get-user-role'
import { UserRole } from '@/lib/supabase/types'

/**
 * Verifica che l'utente abbia il ruolo richiesto
 * Redirecta a /login se non autenticato
 * Redirecta a /unauthorized se ruolo non autorizzato
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<UserRole> {
  const role = await getUserRole()
  
  if (!role) {
    redirect('/login')
  }
  
  if (!allowedRoles.includes(role)) {
    redirect('/unauthorized')
  }
  
  return role
}

/**
 * Verifica che l'utente sia admin
 */
export async function requireAdmin() {
  const role = await getUserRole()
  if (!role || role !== 'admin') {
    redirect('/unauthorized')
  }
}

/**
 * Verifica che l'utente sia staff (admin o segretaria)
 */
export async function requireStaff() {
  const role = await getUserRole()
  if (!role || (role !== 'admin' && role !== 'segretaria')) {
    redirect('/unauthorized')
  }
}

/**
 * Verifica che l'utente sia paziente
 */
export async function requirePaziente() {
  const role = await getUserRole()
  if (!role || role !== 'paziente') {
    redirect('/unauthorized')
  }
}
