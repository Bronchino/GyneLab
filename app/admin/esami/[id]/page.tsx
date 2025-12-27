import { requireAdmin } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { it } from 'date-fns/locale/it'
import { Prelievo, Paziente, TipoPrelievo, StatoPrelievo, Laboratorio } from '@/lib/supabase/types'

interface PrelievoWithDetails extends Prelievo {
  paziente?: Paziente
  tipo_prelievo?: TipoPrelievo
  stato?: StatoPrelievo
  laboratorio?: Laboratorio
}

export default async function EsameDetailPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdmin()
  
  const supabase = await createClient()

  // Carica il prelievo
  const { data: prelievo, error: prelievoError } = await supabase
    .from('prelievi')
    .select('*')
    .eq('id', params.id)
    .single()

  if (prelievoError || !prelievo) {
    notFound()
  }

  // Carica dati correlati
  const [pazienteResult, tipoResult, statoResult, laboratorioResult] = await Promise.all([
    supabase.from('pazienti').select('*').eq('id', prelievo.paziente_id).single(),
    supabase.from('tipi_prelievo').select('*').eq('id', prelievo.tipo_prelievo_id).single(),
    supabase.from('stati_prelievo').select('*').eq('id', prelievo.stato_id).single(),
    supabase.from('laboratori').select('*').eq('id', prelievo.laboratorio_id).single(),
  ])

  const prelievoWithDetails: PrelievoWithDetails = {
    ...prelievo,
    paziente: pazienteResult.data || undefined,
    tipo_prelievo: tipoResult.data || undefined,
    stato: statoResult.data || undefined,
    laboratorio: laboratorioResult.data || undefined,
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: it })
    } catch {
      return dateString
    }
  }

  // Determina se ci sono referti (basato su esito_pdf_uploaded_at)
  const hasReferto = !!prelievo.esito_pdf_uploaded_at
  const refertoStato = prelievo.referto_ultimo_download_at ? 'Scaricato' : 'Disponibile'

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Breadcrumb e header */}
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-2">
          Amministrazione / Esami / Visualizza
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dettaglio Esame</h1>
          <a
            href="/admin/esami-in-attesa"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ← Torna indietro
          </a>
        </div>
      </div>

      {/* Grid layout: 2 colonne per le prime due sezioni */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Sezione 1: Dettagli Esame */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Dettagli Esame</h2>
            </div>
            <button
              className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
              disabled
              title="Funzionalità in arrivo"
            >
              Modifica
            </button>
          </div>
          <div className="px-6 py-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Rif. Interno</label>
                <input
                  type="text"
                  value={prelievo.commento || ''}
                  readOnly
                  className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Paziente</label>
                <input
                  type="text"
                  value={prelievoWithDetails.paziente 
                    ? `${prelievoWithDetails.paziente.cognome} ${prelievoWithDetails.paziente.nome}`
                    : '-'
                  }
                  readOnly
                  className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Tipo Esame</label>
                <input
                  type="text"
                  value={prelievoWithDetails.tipo_prelievo?.nome || '-'}
                  readOnly
                  className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Eseguito il</label>
                <input
                  type="text"
                  value={formatDate(prelievo.data_prelievo)}
                  readOnly
                  className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Referto il</label>
                <input
                  type="text"
                  value={prelievo.referto_pubblicato_at 
                    ? formatDate(prelievo.referto_pubblicato_at)
                    : formatDate(prelievo.data_stimata_referto)
                  }
                  readOnly
                  className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Descrizione</label>
                <input
                  type="text"
                  value={prelievoWithDetails.tipo_prelievo?.descrizione || 'n.d.'}
                  readOnly
                  className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sezione 2: Report Medico */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Report Medico</h2>
            </div>
            <button
              className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
              disabled
              title="Funzionalità in arrivo"
            >
              Modifica
            </button>
          </div>
          <div className="px-6 py-5">
            <textarea
              readOnly
              rows={12}
              placeholder="Report non compilato..."
              className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 resize-none"
              value=""
            />
          </div>
        </div>
      </div>

      {/* Sezione 3: Referti (full-width) */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Referti</h2>
          </div>
          <button
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            disabled
            title="Funzionalità in arrivo"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            + Aggiungi Referto
          </button>
        </div>
        <div className="px-6 py-5">
          {!hasReferto ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">😢</div>
              <p className="text-gray-500">Nessun referto caricato...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      <div className="flex items-center space-x-1">
                        <span>Caricato il</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Commento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Stato
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(prelievo.esito_pdf_uploaded_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {prelievo.commento || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {refertoStato}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          className="p-1 text-yellow-500 hover:text-yellow-700"
                          disabled
                          title="Funzionalità in arrivo"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          className="p-1 text-red-600 hover:text-red-700"
                          disabled
                          title="Funzionalità in arrivo"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

