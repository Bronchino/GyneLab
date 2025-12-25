import { createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/auth/require-role'
import { isAdmin } from '@/lib/auth/get-user-role'
import { Paziente } from '@/lib/supabase/types'
import PazientiList from './pazienti-list'

export default async function PazientiPage() {
  await requireStaff()
  
  const supabase = await createClient()
  const canDelete = await isAdmin() // Solo admin può eliminare

  // Query tutti i pazienti - RLS permette SELECT a staff
  const { data: pazienti, error } = await supabase
    .from('pazienti')
    .select('*')
    .order('cognome', { ascending: true })
    .order('nome', { ascending: true })

  if (error) {
    return (
      <div className="text-red-600">
        Errore nel caricamento dei pazienti: {error.message}
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pazienti</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestione anagrafica pazienti
          </p>
        </div>
        <a
          href="/staff/pazienti/nuovo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Nuovo Paziente
        </a>
      </div>

      <PazientiList pazienti={(pazienti || []) as Paziente[]} canDelete={canDelete} />
    </div>
  )
}

