'use client'

import { Prelievo } from '@/lib/supabase/types'
import { format } from 'date-fns'
import { it } from 'date-fns/locale/it'

interface PrelieviListProps {
  prelievi: Prelievo[]
}

export default function PrelieviList({ prelievi }: PrelieviListProps) {
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
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Data Prelievo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Note
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Data Stimata Referto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Referto Pubblicato
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
                <td className="px-6 py-4 text-sm text-gray-500">
                  {prelievo.note || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(prelievo.data_stimata_referto)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {prelievo.referto_pubblicato_at ? formatDate(prelievo.referto_pubblicato_at) : '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <a
                    href={`/staff/prelievi/${prelievo.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Dettaglio
                  </a>
                  <a
                    href={`/staff/prelievi/${prelievo.id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Modifica
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}



