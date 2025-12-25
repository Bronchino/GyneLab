'use client'

import { Laboratorio } from '@/lib/supabase/types'

interface LaboratoriListProps {
  laboratori: Laboratorio[]
}

export default function LaboratoriList({ laboratori }: LaboratoriListProps) {
  const handleDelete = (laboratorio: Laboratorio, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Sei sicuro di voler eliminare il laboratorio "${laboratorio.nome}"?`)) {
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = `/admin/laboratori/${laboratorio.id}/delete`
      document.body.appendChild(form)
      form.submit()
    }
  }

  if (!laboratori || laboratori.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-500">
        Nessun laboratorio trovato
      </div>
    )
  }

  return (
    <table className="min-w-full divide-y divide-gray-300">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            <div className="flex items-center space-x-1">
              <span>Nome</span>
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </div>
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            Indirizzo
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            Telefono
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            Email
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
            Azioni
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {laboratori.map((laboratorio) => (
          <tr key={laboratorio.id}>
            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
              {laboratorio.nome}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500">
              {laboratorio.indirizzo || '-'}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
              {laboratorio.telefono || '-'}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500">
              {laboratorio.email || '-'}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              <div className="flex items-center justify-end space-x-2">
                <a
                  href={`/admin/laboratori/${laboratorio.id}/edit`}
                  className="p-1 text-orange-500 hover:text-orange-700"
                  title="Modifica laboratorio"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </a>
                <button
                  onClick={(e) => handleDelete(laboratorio, e)}
                  className="p-1 text-red-600 hover:text-red-700"
                  title="Elimina laboratorio"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}


