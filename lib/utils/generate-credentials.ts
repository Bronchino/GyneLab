import { randomBytes } from 'crypto'

/**
 * Genera username dal codice fiscale o fallback
 * @param codiceFiscale Codice fiscale del paziente (può essere null)
 * @param pazienteId ID del paziente per fallback
 * @returns Username generato
 */
export function generateUsername(
  codiceFiscale: string | null,
  pazienteId: string
): string {
  if (codiceFiscale && codiceFiscale.trim()) {
    return codiceFiscale.trim().toUpperCase()
  }
  return `paziente_${pazienteId}`
}

/**
 * Genera password random sicura
 * @param length Lunghezza della password (default: 12)
 * @returns Password alfanumerica
 */
export function generatePassword(length: number = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(length)
  let password = ''
  
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length]
  }
  
  return password
}

/**
 * Converte username in email fittizia per Supabase Auth
 * @param username Username (codice fiscale o paziente_id)
 * @returns Email fittizia nel formato username@gynelab.local
 */
export function generatePatientEmail(username: string): string {
  return `${username}@gynelab.local`
}

/**
 * Converte username/input in email per il login
 * Se l'input è già un'email (contiene @), lo usa direttamente
 * Altrimenti lo converte in email fittizia
 * @param input Input dell'utente (username o email)
 * @returns Email da usare per Supabase Auth
 */
export function usernameToEmail(input: string): string {
  // Se contiene @, è già un'email (per staff/admin)
  if (input.includes('@')) {
    return input
  }
  // Altrimenti è uno username (codice fiscale) e lo convertiamo
  return generatePatientEmail(input)
}


