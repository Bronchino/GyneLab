'use client'

import { format } from 'date-fns'
import { it } from 'date-fns/locale/it'

interface Operatore {
  id: string
  nome: string
  cognome: string
  email: string
  ruolo: 'admin' | 'segretaria'
  attivo: boolean
  created_at: string | null
}

interface OperatoriListProps {
  operatori: Operatore[]
}

export default function OperatoriList({ operatori }: OperatoriListProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: it })
    } catch {
      return dateString
    }
  }

  const handleDelete = (operatore: Operatore, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Sei sicuro di voler eliminare ${operatore.nome} ${operatore.cognome}?`)) {
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = `/admin/operatori/${operatore.id}/delete`
      document.body.appendChild(form)
      form.submit()
    }
  }

  if (!operatori || operatori.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-500">
        Nessun operatore trovato
      </div>
    )
  }

  return (
    <table className="min-w-full divide-y divide-gray-300">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            Nome Completo
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            Email
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            Ruolo
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            Inserito il
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
            Azioni
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {operatori.map((operatore) => (
          <tr key={operatore.id}>
            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
              {operatore.nome} {operatore.cognome}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500">
              {operatore.email}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-sm">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                operatore.ruolo === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {operatore.ruolo === 'admin' ? 'Admin' : 'Segretaria'}
              </span>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
              {formatDate(operatore.created_at)}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              <div className="flex items-center justify-end space-x-2">
                <a
                  href={`/admin/operatori/${operatore.id}/edit`}
                  className="p-1 text-yellow-500 hover:text-yellow-700"
                  title="Modifica operatore"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </a>
                <button
                  onClick={(e) => handleDelete(operatore, e)}
                  className="p-1 text-red-600 hover:text-red-700"
                  title="Elimina operatore"
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

