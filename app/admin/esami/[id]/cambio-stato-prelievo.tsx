'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StatoPrelievo } from '@/lib/supabase/types'
import { getAvailableNextStates } from '@/lib/utils/validate-stato-transition'

interface CambioStatoPrelievoProps {
  prelievoId: string
  statoCorrente: StatoPrelievo
  statiDisponibili: StatoPrelievo[]
}

export default function CambioStatoPrelievo({
  prelievoId,
  statoCorrente,
  statiDisponibili,
}: CambioStatoPrelievoProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtra gli stati raggiungibili da quello corrente
  const statiRaggiungibili = getAvailableNextStates(statoCorrente.nome)
  const statiDisponibiliFiltrati = statiDisponibili.filter((stato) =>
    statiRaggiungibili.includes(stato.nome)
  )

  // Aggiungi anche lo stato corrente (per mostrarlo nel dropdown anche se non cambia)
  const statiPerDropdown = [
    statoCorrente,
    ...statiDisponibiliFiltrati.filter((s) => s.id !== statoCorrente.id),
  ]

  const handleChange = async (nuovoStatoId: string) => {
    if (nuovoStatoId === statoCorrente.id) {
      return // Nessun cambiamento
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/prelievi/${prelievoId}/update-stato`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nuovo_stato_id: nuovoStatoId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante l\'aggiornamento dello stato')
      }

      // Refresh pagina per mostrare il nuovo stato
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'aggiornamento dello stato')
      setLoading(false)
    }
  }

  return (
    <div>
      <label htmlFor="stato-select" className="block text-sm font-medium text-gray-700 mb-1">
        Stato
      </label>
      <select
        id="stato-select"
        value={statoCorrente.id}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {statiPerDropdown.map((stato) => (
          <option key={stato.id} value={stato.id}>
            {stato.nome}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      {loading && (
        <p className="mt-1 text-xs text-gray-500">Aggiornamento in corso...</p>
      )}
    </div>
  )
}

