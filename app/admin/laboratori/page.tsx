import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-role'
import { Laboratorio } from '@/lib/supabase/types'
import LaboratoriList from './laboratori-list'

export default async function LaboratoriPage() {
  await requireAdmin()
  
  const supabase = await createClient()

  // RLS: solo admin può SELECT laboratori
  const { data: laboratori, error } = await supabase
    .from('laboratori')
    .select('*')
    .order('nome', { ascending: true })

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="rounded-md bg-red-50 p-4">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Errore nel caricamento dei laboratori
          </h3>
          <p className="text-red-700">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb e titolo */}
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-2">
          Amministrazione / Laboratori
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Laboratori</h1>
            <p className="mt-2 text-sm text-gray-600">
              Gestione laboratori
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <a
              href="/admin/laboratori/nuovo"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Aggiungi Laboratorio
            </a>
            <a
              href="/admin/laboratori"
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              title="Aggiorna"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Filtri e ricerca */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded">Tutti</button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Ricerca laboratorio"
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <LaboratoriList laboratori={(laboratori || []) as Laboratorio[]} />
      </div>
    </div>
  )
}


