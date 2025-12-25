'use client'

import { Prelievo, Paziente, TipoPrelievo } from '@/lib/supabase/types'
import { format } from 'date-fns'
import { it } from 'date-fns/locale/it'

interface PrelievoWithDetails extends Prelievo {
  paziente?: Paziente
  tipo_prelievo?: TipoPrelievo
}

interface PrelieviListProps {
  prelievi: (Prelievo | PrelievoWithDetails)[]
  showPaziente?: boolean
  showTipoEsame?: boolean
  showRefertoPubblicato?: boolean
  currentSort?: 'asc' | 'desc'
  currentOrderBy?: string
}

export default function PrelieviList({ 
  prelievi, 
  showPaziente = false, 
  showTipoEsame = false,
  showRefertoPubblicato = true,
  currentSort = 'desc',
  currentOrderBy = 'data_prelievo'
}: PrelieviListProps) {
  const handleSortClick = (column: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const url = new URL(window.location.href)
    
    // Se si clicca sulla stessa colonna, cambia solo la direzione
    // Altrimenti, cambia colonna e imposta sort a 'asc'
    if (currentOrderBy === column) {
      const newSort = currentSort === 'asc' ? 'desc' : 'asc'
      url.searchParams.set('sort', newSort)
    } else {
      url.searchParams.set('orderBy', column)
      url.searchParams.set('sort', 'asc')
    }
    
    window.location.href = url.toString()
  }
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: it })
    } catch {
      return dateString
    }
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      {prelievi.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-500">
          Nessun prelievo trovato
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              {showPaziente && (
                <th 
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 cursor-pointer hover:bg-gray-100 select-none ${currentOrderBy === 'cognome' ? 'bg-gray-100' : ''}`}
                  onClick={(e) => handleSortClick('cognome', e)}
                >
                  <div className="flex items-center space-x-1">
                    <span>Paziente</span>
                    {currentOrderBy === 'cognome' && (
                      <div className="flex flex-col">
                        <svg 
                          className={`w-3 h-3 ${currentSort === 'asc' ? 'text-gray-900' : 'text-gray-400'}`}
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        <svg 
                          className={`w-3 h-3 -mt-1 ${currentSort === 'desc' ? 'text-gray-900' : 'text-gray-400'}`}
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </th>
              )}
              {showTipoEsame && (
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Tipo Esame
                </th>
              )}
              <th 
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 cursor-pointer hover:bg-gray-100 select-none ${currentOrderBy === 'data_prelievo' ? 'bg-gray-100' : ''}`}
                onClick={(e) => handleSortClick('data_prelievo', e)}
              >
                <div className="flex items-center space-x-1">
                  <span>Data Prelievo</span>
                  {currentOrderBy === 'data_prelievo' ? (
                    <div className="flex flex-col">
                      <svg 
                        className={`w-3 h-3 ${currentSort === 'asc' ? 'text-gray-900' : 'text-gray-400'}`}
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                      <svg 
                        className={`w-3 h-3 -mt-1 ${currentSort === 'desc' ? 'text-gray-900' : 'text-gray-400'}`}
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Note
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Data Stimata Referto
              </th>
              {showRefertoPubblicato && (
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Referto Pubblicato
                </th>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {prelievi.map((prelievo) => {
              const prelievoWithDetails = prelievo as PrelievoWithDetails
              return (
                <tr key={prelievo.id}>
                  {showPaziente && (
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {prelievoWithDetails.paziente 
                        ? `${prelievoWithDetails.paziente.cognome} ${prelievoWithDetails.paziente.nome}`
                        : '-'
                      }
                    </td>
                  )}
                  {showTipoEsame && (
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {prelievoWithDetails.tipo_prelievo?.nome || '-'}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {formatDate(prelievo.data_prelievo)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {prelievo.note || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(prelievo.data_stimata_referto)}
                  </td>
                  {showRefertoPubblicato && (
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {prelievo.referto_pubblicato_at ? formatDate(prelievo.referto_pubblicato_at) : '-'}
                    </td>
                  )}
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
      )}
    </div>
  )
}

