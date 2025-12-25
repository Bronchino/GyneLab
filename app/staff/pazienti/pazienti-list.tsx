'use client'

import { Paziente } from '@/lib/supabase/types'
import { format } from 'date-fns'
import { it } from 'date-fns/locale/it'

interface PazientiListProps {
  pazienti: Paziente[]
  canDelete: boolean
}

export default function PazientiList({ pazienti, canDelete }: PazientiListProps) {
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
      {pazienti.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-500">
          Nessun paziente trovato
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Cognome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Data Nascita
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Codice Fiscale
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Cellulare
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {pazienti.map((paziente) => (
              <tr key={paziente.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {paziente.cognome}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {paziente.nome}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(paziente.data_nascita)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {paziente.codice_fiscale || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {paziente.email || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {paziente.cellulare || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <a
                    href={`/staff/pazienti/${paziente.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Dettaglio
                  </a>
                  <a
                    href={`/staff/pazienti/${paziente.id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Modifica
                  </a>
                  {canDelete && (
                    <form
                      action={`/staff/pazienti/${paziente.id}/delete`}
                      method="post"
                      className="inline"
                      onSubmit={(e) => {
                        if (!confirm(`Sei sicuro di voler eliminare ${paziente.nome} ${paziente.cognome}?`)) {
                          e.preventDefault()
                        }
                      }}
                    >
                      <button
                        type="submit"
                        className="text-red-600 hover:text-red-900"
                      >
                        Elimina
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

