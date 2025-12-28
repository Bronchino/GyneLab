'use client'

import { Prelievo, PazienteDocumento, TipoPrelievo } from '@/lib/supabase/types'
import { format } from 'date-fns'
import { it } from 'date-fns/locale/it'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PrelievoWithTipo extends Prelievo {
  tipo_prelievo?: { nome: string } | null
}

interface RefertiListProps {
  prelievi: PrelievoWithTipo[]
  documenti: PazienteDocumento[]
}

export default function RefertiList({ prelievi, documenti }: RefertiListProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const router = useRouter()

  const toggleRow = (prelievoId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(prelievoId)) {
      newExpanded.delete(prelievoId)
    } else {
      newExpanded.add(prelievoId)
    }
    setExpandedRows(newExpanded)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: it })
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: it })
    } catch {
      return dateString
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    const kb = bytes / 1024
    const mb = kb / 1024
    if (mb >= 1) return `${mb.toFixed(2)} MB`
    return `${kb.toFixed(2)} KB`
  }

  const handleEliminaReferto = async (prelievoId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo referto?')) {
      return
    }

    try {
      const response = await fetch(`/api/paziente/referti/prelievo/${prelievoId}/delete`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`Errore: ${error.error || 'Errore durante l\'eliminazione'}`)
        return
      }

      // Ricarica la pagina per aggiornare la lista
      router.refresh()
    } catch (error) {
      console.error('Errore eliminazione referto:', error)
      alert('Errore durante l\'eliminazione del referto')
    }
  }

  return (
    <div className="space-y-8">
      {/* Sezione Referti (da prelievi) */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Referti</h2>
        {prelievi.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-500">
            Nessun referto disponibile
          </div>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Esame
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <div className="flex items-center">
                      Data Esame
                      <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Descrizione
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Referto dal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {prelievi.map((prelievo) => {
                  const isExpanded = expandedRows.has(prelievo.id)
                  // tipo_prelievo viene restituito come oggetto con solo 'nome' dalla query
                  const nomeEsame = (prelievo.tipo_prelievo as any)?.nome || 'N/A'
                  
                  return (
                    <>
                      <tr key={prelievo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {nomeEsame}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {formatDate(prelievo.data_prelievo)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {prelievo.commento || '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatDate(prelievo.referto_pubblicato_at)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                            Refertato
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <button
                            onClick={() => toggleRow(prelievo.id)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <svg
                              className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${prelievo.id}-expanded`} className="bg-gray-50">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Data Referto:</span>
                                  <span className="ml-2 text-sm text-gray-900">
                                    {formatDateTime(prelievo.referto_pubblicato_at)}
                                  </span>
                                </div>
                                {prelievo.note && (
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">Note:</span>
                                    <span className="ml-2 text-sm text-gray-900">{prelievo.note}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex space-x-3">
                                <a
                                  href={`/paziente/referti/prelievo/${prelievo.id}/download`}
                                  className="inline-flex items-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                                >
                                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  Scarica
                                </a>
                                <button
                                  onClick={() => handleEliminaReferto(prelievo.id)}
                                  className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                                >
                                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Elimina
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Sezione Altri Documenti */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Altri documenti</h2>
        {documenti.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-500">
            Nessun documento disponibile
          </div>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Titolo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Descrizione
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Pubblicato il
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Scade il
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Dimensione
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {documenti.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {doc.titolo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {doc.descrizione || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDateTime(doc.pubblicato_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {doc.scade_at ? (
                        <span className={new Date(doc.scade_at) > new Date() ? 'text-green-600' : 'text-red-600'}>
                          {formatDate(doc.scade_at)}
                        </span>
                      ) : (
                        <span className="text-gray-400">Non scade</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatFileSize(doc.size_bytes)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <a
                        href={`/paziente/referti/documento/${doc.id}/download`}
                        className="text-teal-600 hover:text-teal-900"
                      >
                        Scarica
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  )
}
