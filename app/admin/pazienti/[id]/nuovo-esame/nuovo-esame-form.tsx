'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Laboratorio, TipoPrelievo } from '@/lib/supabase/types'

interface NuovoEsameFormProps {
  pazienteId: string
  pazienteNome: string
  laboratori: Laboratorio[]
  tipiPrelievo: TipoPrelievo[]
}

export default function NuovoEsameForm({
  pazienteId,
  pazienteNome,
  laboratori,
  tipiPrelievo,
}: NuovoEsameFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data corrente (oggi) - viene impostata automaticamente come default
  const dataCorrenteDefault = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    tipo_prelievo_id: '',
    data_prelievo: dataCorrenteDefault, // Precompilata con data corrente
    data_consegna: '',
    rif_interno: '',
    descrizione: '',
    report_medico: '',
    laboratorio_id: '',
  })

  // Auto-calcola data_consegna quando si seleziona un tipo prelievo o cambia la data_prelievo
  useEffect(() => {
    if (formData.tipo_prelievo_id && formData.data_prelievo) {
      const tipoSelezionato = tipiPrelievo.find(t => t.id === formData.tipo_prelievo_id)
      if (tipoSelezionato?.tempo_refertazione_giorni) {
        const dataPrelievo = new Date(formData.data_prelievo)
        const dataConsegna = new Date(dataPrelievo)
        dataConsegna.setDate(dataConsegna.getDate() + tipoSelezionato.tempo_refertazione_giorni)
        setFormData(prev => ({
          ...prev,
          data_consegna: dataConsegna.toISOString().split('T')[0],
        }))
      }
    }
  }, [formData.tipo_prelievo_id, formData.data_prelievo, tipiPrelievo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/create-prelievo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paziente_id: pazienteId,
          laboratorio_id: formData.laboratorio_id,
          tipo_prelievo_id: formData.tipo_prelievo_id || undefined,
          data_prelievo: formData.data_prelievo, // Data modificabile dall'utente (default: oggi)
          data_stimata_referto: formData.data_consegna || undefined,
          note: formData.rif_interno || formData.descrizione || formData.report_medico
            ? `${formData.rif_interno ? `Rif: ${formData.rif_interno}` : ''}${formData.descrizione ? ` ${formData.descrizione}` : ''}${formData.report_medico ? ` ${formData.report_medico}` : ''}`.trim()
            : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Errore durante la creazione dell\'esame')
        setLoading(false)
        return
      }

      // Redirect alla pagina dettaglio paziente
      router.push(`/admin/pazienti/${pazienteId}`)
      router.refresh()
    } catch (err) {
      setError('Errore durante la creazione dell\'esame')
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      tipo_prelievo_id: '',
      data_prelievo: dataCorrenteDefault, // Reset alla data corrente
      data_consegna: '',
      rif_interno: '',
      descrizione: '',
      report_medico: '',
      laboratorio_id: '',
    })
    setError(null)
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center">
        <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h2 className="text-lg font-semibold text-gray-900">Nuovo Esame</h2>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-5">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label htmlFor="paziente" className="block text-sm font-medium text-gray-700 mb-1">
              Paziente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="paziente"
              value={pazienteNome}
              readOnly
              className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
            />
          </div>

          <div>
            <label htmlFor="tipo_prelievo" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo d'Esame
            </label>
            <select
              id="tipo_prelievo"
              value={formData.tipo_prelievo_id}
              onChange={(e) => setFormData({ ...formData, tipo_prelievo_id: e.target.value })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-teal-500"
            >
              <option value="">Selezionare...</option>
              {tipiPrelievo.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Se non selezionato, verrà utilizzato in automatico il tipo "Generico".
            </p>
          </div>

          <div>
            <label htmlFor="laboratorio" className="block text-sm font-medium text-gray-700 mb-1">
              Laboratorio <span className="text-red-500">*</span>
            </label>
            <select
              id="laboratorio"
              required
              value={formData.laboratorio_id}
              onChange={(e) => setFormData({ ...formData, laboratorio_id: e.target.value })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-teal-500"
            >
              <option value="">Selezionare...</option>
              {laboratori.map((lab) => (
                <option key={lab.id} value={lab.id}>
                  {lab.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="data_prelievo" className="block text-sm font-medium text-gray-700 mb-1">
              Data Esame <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                id="data_prelievo"
                required
                value={formData.data_prelievo}
                onChange={(e) => setFormData({ ...formData, data_prelievo: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 pl-10 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-teal-500"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Data in cui l'esame viene assegnato al paziente (precompilata con la data odierna)
            </p>
          </div>

          <div>
            <label htmlFor="data_consegna" className="block text-sm font-medium text-gray-700 mb-1">
              Data Consegna
            </label>
            <div className="relative">
              <input
                type="date"
                id="data_consegna"
                value={formData.data_consegna}
                onChange={(e) => setFormData({ ...formData, data_consegna: e.target.value })}
                placeholder="GG/MM/AAAA"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 pl-10 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-teal-500"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Data stimata di consegna del referto (autocalcolata se il tipo d'esame prevede un tempo di consegna).
            </p>
          </div>

          <div>
            <label htmlFor="rif_interno" className="block text-sm font-medium text-gray-700 mb-1">
              Rif. Interno
            </label>
            <input
              type="text"
              id="rif_interno"
              value={formData.rif_interno}
              onChange={(e) => setFormData({ ...formData, rif_interno: e.target.value })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-teal-500"
            />
          </div>

          <div>
            <label htmlFor="descrizione" className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione
            </label>
            <input
              type="text"
              id="descrizione"
              value={formData.descrizione}
              onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-teal-500"
            />
          </div>

          <div>
            <label htmlFor="report_medico" className="block text-sm font-medium text-gray-700 mb-1">
              Report Medico
            </label>
            <textarea
              id="report_medico"
              rows={4}
              value={formData.report_medico}
              onChange={(e) => setFormData({ ...formData, report_medico: e.target.value })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-teal-600 bg-white px-4 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            Azzera
          </button>
          <a
            href={`/admin/pazienti/${pazienteId}`}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            Annulla
          </a>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Inserimento...' : 'Inserisci'}
          </button>
        </div>
      </form>
    </div>
  )
}

