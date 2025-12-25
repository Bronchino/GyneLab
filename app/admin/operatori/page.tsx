import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'
import OperatoriList from './operatori-list'

interface Operatore {
  id: string
  nome: string
  cognome: string
  email: string
  ruolo: 'admin' | 'segretaria'
  attivo: boolean
  created_at: string | null
}

export default async function OperatoriPage() {
  await requireAdmin()
  
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  // Recupera i profili staff dalla tabella profili_utenti
  const { data: profili, error: profiliError } = await supabase
    .from('profili_utenti')
    .select('*')
    .in('ruolo', ['admin', 'segretaria'])
    .order('cognome', { ascending: true })
    .order('nome', { ascending: true })

  if (profiliError) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="rounded-md bg-red-50 p-4">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Errore nel caricamento degli operatori
          </h3>
          <p className="text-red-700">{profiliError.message}</p>
        </div>
      </div>
    )
  }

  // Recupera le email dagli utenti auth
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
  const usersMap = new Map(
    usersData?.users?.map((u) => [u.id, u.email || '']) || []
  )

  // Combina profili con email
  const operatori: Operatore[] = (profili || []).map((profilo) => ({
    id: profilo.id,
    nome: profilo.nome,
    cognome: profilo.cognome,
    email: usersMap.get(profilo.id) || '-',
    ruolo: profilo.ruolo as 'admin' | 'segretaria',
    attivo: profilo.attivo,
    created_at: profilo.created_at,
  }))

  return (
    <div>
      {/* Breadcrumb e titolo */}
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-2">
          Amministrazione / Operatori
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Operatori</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <a
              href="/admin/operatori/nuovo"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              + Aggiungi un Operatore
            </a>
            <a
              href="/admin/operatori"
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              title="Aggiorna"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="ml-2">Aggiorna</span>
            </a>
          </div>
        </div>
      </div>

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <OperatoriList operatori={operatori} />
      </div>
    </div>
  )
}


