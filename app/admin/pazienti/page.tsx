import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-role'
import { Paziente } from '@/lib/supabase/types'
import PazientiList from './pazienti-list'

export default async function AdminPazientiPage({
  searchParams,
}: {
  searchParams?: { sort?: string; orderBy?: string }
}) {
  await requireAdmin()
  
  const supabase = await createClient()
  const canDelete = true // Admin può sempre eliminare

  // Determina la colonna di ordinamento (default: 'cognome')
  const orderBy = searchParams?.orderBy || 'cognome'
  // Determina l'ordinamento: 'asc' o 'desc' (default: 'asc')
  const sortOrder = searchParams?.sort === 'desc' ? false : true

  // Query tutti i pazienti
  let query = supabase
    .from('pazienti')
    .select('*')

  // Applica l'ordinamento in base alla colonna selezionata
  if (orderBy === 'created_at') {
    query = query.order('created_at', { ascending: sortOrder })
  } else {
    // Default: ordina per cognome
    query = query.order('cognome', { ascending: sortOrder })
    query = query.order('nome', { ascending: true })
  }

  const { data: pazienti, error } = await query

  if (error) {
    return (
      <div className="text-red-600">
        Errore nel caricamento dei pazienti: {error.message}
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb e titolo */}
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-2">
          Amministrazione / Pazienti
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Pazienti</h1>
          <div className="flex items-center space-x-3">
            <a
              href="/admin/pazienti/nuovo"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Aggiungi un Paziente
            </a>
            <button className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filtri e ricerca */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="font-medium text-gray-700">Pazienti</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded">Tutti</button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Ricerca paziente..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>
      </div>

      <PazientiList 
        pazienti={(pazienti || []) as Paziente[]} 
        canDelete={canDelete}
        currentSort={sortOrder ? 'asc' : 'desc'}
        currentOrderBy={orderBy}
      />
    </div>
  )
}
