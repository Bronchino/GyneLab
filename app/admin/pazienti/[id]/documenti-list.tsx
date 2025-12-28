'use client'

import { PazienteDocumento } from '@/lib/supabase/types'
import { format } from 'date-fns'
import { it } from 'date-fns/locale/it'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DocumentiListProps {
  documenti: PazienteDocumento[]
  pazienteId: string
}

export default function DocumentiList({ documenti, pazienteId }: DocumentiListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

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

  const handleDelete = async (documentoId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo documento?')) {
      return
    }

    setDeletingId(documentoId)

    try {
      const response = await fetch(`/api/documento/${documentoId}`, {
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
      console.error('Errore eliminazione documento:', error)
      alert('Errore durante l\'eliminazione del documento')
    } finally {
      setDeletingId(null)
    }
  }

  if (documenti.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-500">
        Nessun documento caricato
      </div>
    )
  }

  return (
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
              Caricato il
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
                {formatDateTime(doc.uploaded_at)}
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
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                >
                  {deletingId === doc.id ? 'Eliminazione...' : 'Elimina'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

