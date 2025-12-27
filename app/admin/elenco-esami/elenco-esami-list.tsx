'use client'

import { Prelievo, Paziente, TipoPrelievo, StatoPrelievo } from '@/lib/supabase/types'
import { format } from 'date-fns'
import { it } from 'date-fns/locale/it'

interface PrelievoWithDetails extends Prelievo {
  paziente?: Paziente
  tipo_prelievo?: TipoPrelievo
  stato?: StatoPrelievo
}

interface ElencoEsamiListProps {
  prelievi: PrelievoWithDetails[]
  stati: StatoPrelievo[]
  statoSelezionato?: string
}

export default function ElencoEsamiList({ prelievi, stati, statoSelezionato }: ElencoEsamiListProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: it })
    } catch {
      return dateString
    }
  }

  const handleStatoFilter = (statoNome: string | null) => {
    const url = new URL(window.location.href)
    if (statoNome) {
      url.searchParams.set('stato', statoNome)
    } else {
      url.searchParams.delete('stato')
    }
    window.location.href = url.toString()
  }

  const getStatoColor = (colore: string | null) => {
    if (!colore) return 'bg-gray-100 text-gray-800'
    
    const coloreLower = colore.toLowerCase().trim()
    
    // Mappa colori comuni
    const colorMap: { [key: string]: string } = {
      'green': 'bg-green-100 text-green-800',
      'blue': 'bg-blue-100 text-blue-800',
      'yellow': 'bg-yellow-100 text-yellow-800',
      'orange': 'bg-orange-100 text-orange-800',
      'red': 'bg-red-100 text-red-800',
      'purple': 'bg-purple-100 text-purple-800',
      'gray': 'bg-gray-100 text-gray-800',
      'grey': 'bg-gray-100 text-gray-800',
      'teal': 'bg-teal-100 text-teal-800',
      'indigo': 'bg-indigo-100 text-indigo-800',
    }
    
    // Se è un codice esadecimale o un colore personalizzato, usa uno stile generico
    if (coloreLower.startsWith('#') || coloreLower.length > 10) {
      return 'bg-gray-100 text-gray-800'
    }
    
    return colorMap[coloreLower] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      {/* Filtri per stato */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => handleStatoFilter(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !statoSelezionato
              ? 'bg-teal-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Tutti
        </button>
        {stati.map((stato) => (
          <button
            key={stato.id}
            onClick={() => handleStatoFilter(stato.nome)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statoSelezionato === stato.nome
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {stato.nome}
          </button>
        ))}
      </div>

      {/* Tabella */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {prelievi.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-500">
            Nessun esame trovato
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Rif.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Eseguito il
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Referto il
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Paziente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipo Esame
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Descrizione
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prelievi.map((prelievo) => {
                  const prelievoWithDetails = prelievo as PrelievoWithDetails
                  return (
                    <tr key={prelievo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {prelievoWithDetails.stato ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatoColor(prelievoWithDetails.stato.colore)}`}>
                            {prelievoWithDetails.stato.nome}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {prelievo.commento || '------'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {formatDate(prelievo.data_prelievo)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {prelievo.referto_pubblicato_at ? formatDate(prelievo.referto_pubblicato_at) : 'n.d.'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {prelievoWithDetails.paziente 
                          ? `${prelievoWithDetails.paziente.cognome} ${prelievoWithDetails.paziente.nome}`
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {prelievoWithDetails.tipo_prelievo?.nome || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {prelievoWithDetails.tipo_prelievo?.descrizione || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <a
                            href={`/admin/prelievi/${prelievo.id}/edit`}
                            className="group relative inline-flex items-center justify-center w-8 h-8 rounded bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
                            title="Modifica esame"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              Modifica esame
                            </span>
                          </a>
                          <button
                            onClick={() => {
                              if (confirm('Sei sicuro di voler eliminare questo esame?')) {
                                // TODO: Implementare eliminazione
                                console.log('Elimina prelievo:', prelievo.id)
                              }
                            }}
                            className="group relative inline-flex items-center justify-center w-8 h-8 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                            title="Elimina esame"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              Elimina esame
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

