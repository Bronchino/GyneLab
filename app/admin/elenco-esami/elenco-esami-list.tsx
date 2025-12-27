'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  searchQuery?: string
}

export default function ElencoEsamiList({ prelievi, stati, statoSelezionato, searchQuery }: ElencoEsamiListProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(searchQuery || '')
  const [itemsToShow, setItemsToShow] = useState(20) // Mostra inizialmente 20 elementi
  const ITEMS_PER_PAGE = 20
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
    if (searchTerm) {
      url.searchParams.set('search', searchTerm)
    } else {
      url.searchParams.delete('search')
    }
    window.location.href = url.toString()
  }

  const handleDaRefertareFilter = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('stato', 'da_refertare')
    if (searchTerm) {
      url.searchParams.set('search', searchTerm)
    } else {
      url.searchParams.delete('search')
    }
    window.location.href = url.toString()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const url = new URL(window.location.href)
    if (searchTerm.trim()) {
      url.searchParams.set('search', searchTerm.trim())
    } else {
      url.searchParams.delete('search')
    }
    // Mantieni il filtro stato se presente
    if (statoSelezionato) {
      url.searchParams.set('stato', statoSelezionato)
    }
    window.location.href = url.toString()
  }

  const handleClearFilters = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('stato')
    url.searchParams.delete('search')
    setSearchTerm('')
    window.location.href = url.toString()
  }

  const handleRowClick = (prelievoId: string) => {
    router.push(`/admin/esami/${prelievoId}`)
  }

  const handleLoadMore = () => {
    setItemsToShow(prev => prev + ITEMS_PER_PAGE)
  }

  // Reset itemsToShow quando cambiano i filtri o la ricerca
  useEffect(() => {
    setItemsToShow(20)
  }, [statoSelezionato, searchQuery])

  const prelieviToShow = prelievi.slice(0, itemsToShow)
  const hasMore = prelievi.length > itemsToShow

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

  const isDaRefertareSelected = statoSelezionato === 'da_refertare'
  // Mostra "Filtro: X" solo se c'è una ricerca attiva, non per i filtri di stato alternativi
  const showFilterX = !!searchQuery

  return (
    <div>
      {/* Filtri e ricerca */}
      <div className="mb-6 space-y-4">
        {/* Filtri per stato */}
        <div className="flex flex-wrap gap-2 items-center">
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
          <button
            onClick={handleDaRefertareFilter}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDaRefertareSelected
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Da Refertare
          </button>
          {showFilterX && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center"
            >
              <span className="mr-1">Filtro:</span>
              <span className="text-white font-bold">X</span>
            </button>
          )}
        </div>

        {/* Barra di ricerca */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ricerca per riferimento/pa"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </form>
        </div>
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
                {prelieviToShow.map((prelievo) => {
                  const prelievoWithDetails = prelievo as PrelievoWithDetails
                  return (
                    <tr 
                      key={prelievo.id} 
                      onClick={() => handleRowClick(prelievo.id)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
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
                        {prelievo.rif_interno || prelievo.commento || '------'}
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
                        {prelievo.descrizione || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
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
                            onClick={(e) => {
                              e.stopPropagation()
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
        
        {/* Footer con "Carica ulteriori" */}
        {hasMore && (
          <div className="px-6 py-4 border-t border-gray-200 text-center">
            <button
              onClick={handleLoadMore}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Carica ulteriori
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

