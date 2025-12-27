import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-role'
import { format } from 'date-fns'
import { it } from 'date-fns/locale/it'
import { notFound } from 'next/navigation'
import EsamiList from './esami-list'
import { Prelievo, StatoPrelievo, TipoPrelievo } from '@/lib/supabase/types'

interface PrelievoWithDetails extends Prelievo {
  stato?: StatoPrelievo
  tipo_prelievo?: TipoPrelievo
}

export default async function PazienteDetailPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdmin()
  
  const supabase = await createClient()

  // RLS: admin può SELECT tutti i pazienti
  const { data: paziente, error } = await supabase
    .from('pazienti')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !paziente) {
    notFound()
  }

  // Carica i prelievi del paziente con join su stati e tipi
  const { data: prelievi, error: prelieviError } = await supabase
    .from('prelievi')
    .select('*')
    .eq('paziente_id', params.id)
    .order('data_prelievo', { ascending: false })

  // Carica stati prelievo
  let statiMap = new Map<string, StatoPrelievo>()
  if (prelievi && prelievi.length > 0) {
    const statoIds = prelievi.map(p => p.stato_id).filter(Boolean) as string[]
    if (statoIds.length > 0) {
      const { data: stati } = await supabase
        .from('stati_prelievo')
        .select('*')
        .in('id', [...new Set(statoIds)])
      stati?.forEach(stato => statiMap.set(stato.id, stato))
    }
  }

  // Carica tipi prelievo
  let tipiMap = new Map<string, TipoPrelievo>()
  if (prelievi && prelievi.length > 0) {
    const tipoIds = prelievi.map(p => p.tipo_prelievo_id).filter(Boolean) as string[]
    if (tipoIds.length > 0) {
      const { data: tipi } = await supabase
        .from('tipi_prelievo')
        .select('*')
        .in('id', [...new Set(tipoIds)])
      tipi?.forEach(tipo => tipiMap.set(tipo.id, tipo))
    }
  }

  // Combina i dati
  const prelieviWithDetails: PrelievoWithDetails[] = (prelievi || []).map(prelievo => ({
    ...prelievo,
    stato: statiMap.get(prelievo.stato_id),
    tipo_prelievo: tipiMap.get(prelievo.tipo_prelievo_id),
  }))

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: it })
    } catch {
      return dateString
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Breadcrumb e header */}
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-2">
          Amministrazione / Pazienti / Visualizza
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dettaglio Paziente</h1>
          <a
            href="/admin/pazienti"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Torna indietro
          </a>
        </div>
      </div>

      {/* Sezione Dettagli Paziente */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center">
          <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Dettagli Paziente</h2>
          <div className="ml-auto flex space-x-3">
            {paziente.auth_user_id && (
              <button
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                title="Resetta Password"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Resetta Password
              </button>
            )}
            <a
              href={`/admin/pazienti/${params.id}/edit`}
              className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
            >
              Modifica
            </a>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Nome</label>
              <input
                type="text"
                value={paziente.nome || ''}
                readOnly
                className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Cognome</label>
              <input
                type="text"
                value={paziente.cognome || ''}
                readOnly
                className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Sesso</label>
              <input
                type="text"
                value={paziente.sesso || '-'}
                readOnly
                className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Nato il</label>
              <input
                type="text"
                value={formatDate(paziente.data_nascita)}
                readOnly
                className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Luogo di nascita</label>
              <input
                type="text"
                value={`${paziente.luogo_nascita_comune || ''}${paziente.luogo_nascita_provincia ? ` (${paziente.luogo_nascita_provincia})` : ''}` || '-'}
                readOnly
                className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Codice Fiscale</label>
              <input
                type="text"
                value={paziente.codice_fiscale || '-'}
                readOnly
                className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Residente in</label>
              <input
                type="text"
                value="-"
                readOnly
                className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">CAP</label>
              <input
                type="text"
                value="-"
                readOnly
                className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Nazione</label>
              <input
                type="text"
                value="Italia"
                readOnly
                className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Contatti</label>
              <input
                type="text"
                value={paziente.email || paziente.cellulare || '-'}
                readOnly
                className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sezione Esami */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Esami</h2>
          </div>
          <div className="flex space-x-3">
            <a
              href={`/admin/pazienti/${params.id}/nuovo-esame`}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Aggiungi
            </a>
            <a
              href={`/admin/pazienti/${params.id}`}
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="ml-2">Aggiorna</span>
            </a>
          </div>
        </div>
        <div className="px-6 py-5">
          <EsamiList prelievi={prelieviWithDetails} />
        </div>
      </div>
    </div>
  )
}
