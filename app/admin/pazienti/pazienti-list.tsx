'use client'

import { Paziente } from '@/lib/supabase/types'
import { format } from 'date-fns'
import { it } from 'date-fns/locale/it'
import { useState } from 'react'

interface PazientiListProps {
  pazienti: Paziente[]
  canDelete: boolean
  currentSort?: 'asc' | 'desc'
  currentOrderBy?: string
}

export default function PazientiList({ pazienti, canDelete, currentSort = 'asc', currentOrderBy = 'cognome' }: PazientiListProps) {
  const [generandoPrivacy, setGenerandoPrivacy] = useState<string | null>(null)

  const handleGeneraPrivacy = async (pazienteId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    setGenerandoPrivacy(pazienteId)
    try {
      const response = await fetch(`/api/pazienti/${pazienteId}/genera-privacy`)
      
      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || 'Errore durante la generazione del PDF')
        setGenerandoPrivacy(null)
        return
      }

      // Scarica il PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : `privacy_${new Date().toISOString().split('T')[0]}.pdf`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setGenerandoPrivacy(null)
    } catch (err) {
      alert('Errore durante la generazione del PDF')
      setGenerandoPrivacy(null)
    }
  }

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

  const formatLuogoNascita = (paziente: Paziente) => {
    if (paziente.luogo_nascita_comune && paziente.luogo_nascita_provincia) {
      return `${paziente.luogo_nascita_comune} (${paziente.luogo_nascita_provincia})`
    }
    if (paziente.luogo_nascita_comune) {
      return paziente.luogo_nascita_comune
    }
    return '-'
  }

  const handleRowClick = (pazienteId: string, e: React.MouseEvent) => {
    // Non aprire il dettaglio se si clicca sulle icone di azione o sui link
    if ((e.target as HTMLElement).closest('.action-icons') || (e.target as HTMLElement).tagName === 'A' || (e.target as HTMLElement).tagName === 'BUTTON') {
      return
    }
    window.location.href = `/admin/pazienti/${pazienteId}`
  }

  const handleDelete = (paziente: Paziente, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Sei sicuro di voler eliminare ${paziente.nome} ${paziente.cognome}?`)) {
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = `/admin/pazienti/${paziente.id}/delete`
      document.body.appendChild(form)
      form.submit()
    }
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {pazienti.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-500">
          Nessun paziente trovato
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100 select-none ${currentOrderBy === 'cognome' ? 'bg-gray-100' : ''}`}
                  onClick={(e) => handleSortClick('cognome', e)}
                >
                  <div className="flex items-center space-x-1">
                    <span>Cognome</span>
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nato il
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Luogo di Nascita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Codice Fiscale
                </th>
                <th 
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100 select-none ${currentOrderBy === 'created_at' ? 'bg-gray-100' : ''}`}
                  onClick={(e) => handleSortClick('created_at', e)}
                >
                  <div className="flex items-center space-x-1">
                    <span>Inserito il</span>
                    {currentOrderBy === 'created_at' ? (
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
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pazienti.map((paziente) => (
                <tr
                  key={paziente.id}
                  onClick={(e) => handleRowClick(paziente.id, e)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {paziente.cognome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {paziente.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(paziente.data_nascita)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatLuogoNascita(paziente)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {paziente.codice_fiscale || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(paziente.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium action-icons">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Icona 1 - Verde (non attiva per ora) */}
                      <button
                        className="p-1 text-green-600 opacity-30 cursor-not-allowed"
                        disabled
                        title="Non disponibile"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>

                      {/* Icona 2 - Download PDF Privacy */}
                      <button
                        onClick={(e) => handleGeneraPrivacy(paziente.id, e)}
                        disabled={generandoPrivacy === paziente.id}
                        className="p-1 text-blue-500 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Genera PDF Privacy"
                      >
                        {generandoPrivacy === paziente.id ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 3v6h6" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-4m0 0l3 3m-3-3l-3 3" />
                          </svg>
                        )}
                      </button>

                      {/* Icona 3 - Arancione/Matita (modifica) */}
                      <a
                        href={`/admin/pazienti/${paziente.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-orange-500 hover:text-orange-700"
                        title="Modifica paziente"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </a>

                      {/* Icona 4 - Rosso/Cestino (elimina) */}
                      {canDelete && (
                        <button
                          onClick={(e) => handleDelete(paziente, e)}
                          className="p-1 text-red-600 hover:text-red-700"
                          title="Elimina paziente"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pazienti.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <a
            href="#"
            className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center"
            onClick={(e) => {
              e.preventDefault()
              // TODO: Implementare caricamento di ulteriori risultati
            }}
          >
            Carica ulteriori
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </a>
        </div>
      )}
    </div>
  )
}
