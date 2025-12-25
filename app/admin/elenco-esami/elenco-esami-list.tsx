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
                    Data Esecuzione
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Paziente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipologia Esame
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
                {prelievi.map((prelievo) => {
                  const prelievoWithDetails = prelievo as PrelievoWithDetails
                  return (
                    <tr key={prelievo.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {formatDate(prelievo.data_prelievo)}
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
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <a
                          href={`/admin/prelievi/${prelievo.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Dettaglio
                        </a>
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

