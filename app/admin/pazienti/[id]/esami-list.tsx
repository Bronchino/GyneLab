'use client'

import { Prelievo, StatoPrelievo, TipoPrelievo } from '@/lib/supabase/types'
import { format } from 'date-fns'
import { it } from 'date-fns/locale/it'

interface PrelievoWithDetails extends Prelievo {
  stato?: StatoPrelievo
  tipo_prelievo?: TipoPrelievo
}

interface EsamiListProps {
  prelievi: PrelievoWithDetails[]
}

export default function EsamiList({ prelievi }: EsamiListProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: it })
    } catch {
      return dateString
    }
  }

  if (!prelievi || prelievi.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">😢</div>
        <p className="text-gray-500">Nessuna occorrenza...</p>
      </div>
    )
  }

  return (
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
              <div className="flex items-center space-x-1">
                <span>Eseguito il</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Referto il
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Tipo Esame
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Descrizione
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {prelievi.map((prelievo) => (
            <tr key={prelievo.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {prelievo.stato?.nome || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {prelievo.note || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(prelievo.data_prelievo)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(prelievo.referto_pubblicato_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {prelievo.tipo_prelievo?.nome || '-'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {prelievo.tipo_prelievo?.descrizione || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


