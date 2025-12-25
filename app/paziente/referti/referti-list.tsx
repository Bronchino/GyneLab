'use client'

import { Prelievo, PazienteDocumento } from '@/lib/supabase/types'
import { format } from 'date-fns'
import { it } from 'date-fns/locale/it'

interface RefertiListProps {
  prelievi: Prelievo[]
  documenti: PazienteDocumento[]
}

export default function RefertiList({ prelievi, documenti }: RefertiListProps) {
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
                    Data Prelievo
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
                {prelievi.map((prelievo) => (
                  <tr key={prelievo.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {formatDate(prelievo.data_prelievo)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDateTime(prelievo.referto_pubblicato_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {prelievo.referto_scade_at ? (
                        <span className={new Date(prelievo.referto_scade_at) > new Date() ? 'text-green-600' : 'text-red-600'}>
                          {formatDate(prelievo.referto_scade_at)}
                        </span>
                      ) : (
                        <span className="text-gray-400">Non scade</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatFileSize(prelievo.esito_pdf_size_bytes)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <a
                        href={`/paziente/referti/prelievo/${prelievo.id}/download`}
                        className="text-blue-600 hover:text-blue-900"
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

      {/* Sezione Documenti */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Documenti</h2>
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
                        className="text-blue-600 hover:text-blue-900"
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

