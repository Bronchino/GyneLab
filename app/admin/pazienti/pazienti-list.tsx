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

const ITEMS_PER_PAGE = 20

export default function PazientiList({ pazienti, canDelete, currentSort = 'asc', currentOrderBy = 'cognome' }: PazientiListProps) {
  const [generandoPrivacy, setGenerandoPrivacy] = useState<string | null>(null)
  const [generandoCredenziali, setGenerandoCredenziali] = useState<string | null>(null)
  const [itemsToShow, setItemsToShow] = useState(20) // Mostra inizialmente 20 elementi
  const [mostraModalPDF, setMostraModalPDF] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pazienteIdPerPDF, setPazienteIdPerPDF] = useState<string | null>(null)
  const [credenzialiGenerate, setCredenzialiGenerate] = useState<{ username: string; password: string } | null>(null)
  const [mostraModalConfermaRigenera, setMostraModalConfermaRigenera] = useState(false)
  const [pazienteIdPerRigenera, setPazienteIdPerRigenera] = useState<string | null>(null)
  const [pazienteNomePerRigenera, setPazienteNomePerRigenera] = useState<string>('')
  
  const pazientiToShow = pazienti.slice(0, itemsToShow)
  const hasMore = pazienti.length > itemsToShow

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

  const handleLoadMore = () => {
    setItemsToShow(prev => prev + ITEMS_PER_PAGE)
  }

  const handleClickChiave = (paziente: Paziente, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    // Se le credenziali non esistono, genera direttamente
    if (!paziente.auth_user_id) {
      handleGeneraCredenziali(paziente.id, e)
      return
    }
    
    // Se le credenziali esistono, chiedi conferma per rigenerare
    setPazienteIdPerRigenera(paziente.id)
    setPazienteNomePerRigenera(`${paziente.nome} ${paziente.cognome}`)
    setMostraModalConfermaRigenera(true)
  }

  const handleConfermaRigenera = async () => {
    if (!pazienteIdPerRigenera) return
    
    setMostraModalConfermaRigenera(false)
    setGenerandoCredenziali(pazienteIdPerRigenera)
    
    try {
      const response = await fetch(`/api/pazienti/${pazienteIdPerRigenera}/rigenera-password`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || 'Errore durante la rigenerazione delle credenziali')
        setGenerandoCredenziali(null)
        setPazienteIdPerRigenera(null)
        setPazienteNomePerRigenera('')
        return
      }

      const data = await response.json()
      
      // Salva le credenziali e apri il modal PDF
      setCredenzialiGenerate({
        username: data.username,
        password: data.password,
      })
      setPazienteIdPerPDF(pazienteIdPerRigenera)
      
      // Costruisci l'URL del PDF
      const url = `/api/pazienti/${pazienteIdPerRigenera}/credenziali-pdf?username=${encodeURIComponent(data.username)}&password=${encodeURIComponent(data.password)}`
      setPdfUrl(url)
      setMostraModalPDF(true)
      setGenerandoCredenziali(null)
      setPazienteIdPerRigenera(null)
      setPazienteNomePerRigenera('')
    } catch (err) {
      alert('Errore durante la rigenerazione delle credenziali')
      setGenerandoCredenziali(null)
      setPazienteIdPerRigenera(null)
      setPazienteNomePerRigenera('')
    }
  }

  const handleGeneraCredenziali = async (pazienteId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    setGenerandoCredenziali(pazienteId)
    try {
      const response = await fetch(`/api/pazienti/${pazienteId}/genera-credenziali`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || 'Errore durante la generazione delle credenziali')
        setGenerandoCredenziali(null)
        return
      }

      const data = await response.json()
      
      // Salva le credenziali e apri il modal PDF
      setCredenzialiGenerate({
        username: data.username,
        password: data.password,
      })
      setPazienteIdPerPDF(pazienteId)
      
      // Costruisci l'URL del PDF
      const url = `/api/pazienti/${pazienteId}/credenziali-pdf?username=${encodeURIComponent(data.username)}&password=${encodeURIComponent(data.password)}`
      setPdfUrl(url)
      setMostraModalPDF(true)
      setGenerandoCredenziali(null)
    } catch (err) {
      alert('Errore durante la generazione delle credenziali')
      setGenerandoCredenziali(null)
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
              {pazientiToShow.map((paziente) => (
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
                      {/* Icona 1 - Chiave (lampeggia se credenziali non generate) */}
                      <button
                        onClick={(e) => handleClickChiave(paziente, e)}
                        disabled={generandoCredenziali === paziente.id}
                        className={`p-1 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed ${
                          !paziente.auth_user_id 
                            ? 'text-yellow-600 hover:text-yellow-700 animate-key-blink' 
                            : 'text-green-600 hover:text-green-700'
                        }`}
                        title={!paziente.auth_user_id ? "Genera credenziali (non ancora generate)" : "Rigenera credenziali"}
                      >
                        {generandoCredenziali === paziente.id ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        )}
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
      {hasMore && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <button
            onClick={handleLoadMore}
            className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center cursor-pointer"
          >
            Carica ulteriori
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      )}

      {/* Modal Conferma Rigenera Credenziali */}
      {mostraModalConfermaRigenera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Rigenera Credenziali</h3>
            <p className="text-sm text-gray-600 mb-4">
              Sei sicuro di voler rigenerare le credenziali per <strong>{pazienteNomePerRigenera}</strong>?
            </p>
            <p className="text-xs text-yellow-600 mb-6 bg-yellow-50 p-3 rounded border border-yellow-200">
              ⚠️ Attenzione: La password verrà rigenerata. Il paziente dovrà usare la nuova password per accedere.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setMostraModalConfermaRigenera(false)
                  setPazienteIdPerRigenera(null)
                  setPazienteNomePerRigenera('')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfermaRigenera}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Rigenera Credenziali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal PDF Viewer */}
      {mostraModalPDF && pdfUrl && (
        <>
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .pdf-modal-iframe,
              .pdf-modal-iframe * {
                visibility: visible;
              }
              .pdf-modal-iframe {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
              }
              .no-print-pdf {
                display: none !important;
              }
            }
          `}</style>
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-[90vw] h-[90vh] max-w-5xl flex flex-col">
              {/* Header con controlli */}
              <div className="no-print-pdf flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-xl font-bold">Credenziali Generate</h3>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMostraModalPDF(false)
                      setPdfUrl(null)
                      setPazienteIdPerPDF(null)
                      setCredenzialiGenerate(null)
                      // Ricarica la pagina per aggiornare lo stato dell'icona
                      window.location.reload()
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
              {/* Iframe con PDF */}
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={pdfUrl}
                  className="pdf-modal-iframe w-full h-full border-0"
                  title="PDF Credenziali"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
