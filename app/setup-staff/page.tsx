'use client'

import { useState } from 'react'

export default function SetupStaffPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCreateStaff = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/create-staff-users', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Errore durante la creazione degli utenti')
        setLoading(false)
        return
      }

      setResult(data)
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Errore durante la richiesta')
      setLoading(false)
    }
  }

  const handleCheckStaff = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/create-staff-users', {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Errore durante la verifica')
        setLoading(false)
        return
      }

      setResult(data)
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Errore durante la richiesta')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Setup Utenti Staff
          </h1>

          <div className="space-y-4 mb-6">
            <p className="text-gray-600">
              Questa pagina permette di sincronizzare i profili degli utenti staff:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>
                <strong>Admin:</strong> claudio.rossi@me.com / admin
              </li>
              <li>
                <strong>Segretaria:</strong> rossiginecologo@gmail.com / segretaria
              </li>
            </ul>
            <p className="text-sm text-gray-500 mt-2">
              Gli utenti dovrebbero già esistere nel backend. Questa funzione sincronizza
              i loro profili nella tabella <code className="bg-gray-100 px-1 rounded">profili_utenti</code>.
            </p>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={handleCreateStaff}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sincronizzazione in corso...' : 'Sincronizza Profili Staff'}
            </button>
            <button
              onClick={handleCheckStaff}
              disabled={loading}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifica in corso...' : 'Verifica Utenti'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {result && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <h2 className="font-semibold text-green-900 mb-2">Risultato:</h2>
              <pre className="text-sm text-green-800 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Assicurati di aver configurato{' '}
              <code className="bg-yellow-100 px-1 rounded">
                SUPABASE_SERVICE_ROLE_KEY
              </code>{' '}
              nel file <code className="bg-yellow-100 px-1 rounded">.env.local</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

