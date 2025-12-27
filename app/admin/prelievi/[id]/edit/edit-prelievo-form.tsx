'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Prelievo, Laboratorio, TipoPrelievo, StatoPrelievo, Paziente } from '@/lib/supabase/types'

interface EditPrelievoFormProps {
  prelievo: Prelievo
  paziente: Paziente | null
  laboratori: Laboratorio[]
  tipiPrelievo: TipoPrelievo[]
  stati: StatoPrelievo[]
}

export default function EditPrelievoForm({ prelievo, paziente, laboratori, tipiPrelievo, stati }: EditPrelievoFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    rif_interno: prelievo.rif_interno || '',
    descrizione: prelievo.descrizione || '',
    report_medico: prelievo.report_medico || '',
    data_prelievo: prelievo.data_prelievo || '',
    data_stimata_referto: prelievo.data_stimata_referto || '',
    laboratorio_id: prelievo.laboratorio_id || '',
    tipo_prelievo_id: prelievo.tipo_prelievo_id || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Prepara i dati per l'update
      const updateData: any = {
        laboratorio_id: formData.laboratorio_id,
        tipo_prelievo_id: formData.tipo_prelievo_id,
        data_prelievo: formData.data_prelievo,
      }

      // Campi opzionali
      if (formData.rif_interno.trim()) {
        updateData.rif_interno = formData.rif_interno.trim()
      } else {
        updateData.rif_interno = null
      }
      
      if (formData.descrizione.trim()) {
        updateData.descrizione = formData.descrizione.trim()
      } else {
        updateData.descrizione = null
      }
      
      if (formData.report_medico.trim()) {
        updateData.report_medico = formData.report_medico.trim()
      } else {
        updateData.report_medico = null
      }
      
      if (formData.data_stimata_referto) {
        updateData.data_stimata_referto = formData.data_stimata_referto
      } else {
        updateData.data_stimata_referto = null
      }

      // RLS: admin può UPDATE
      const { error: updateError } = await supabase
        .from('prelievi')
        .update(updateData)
        .eq('id', prelievo.id)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      // Redirect alla lista esami
      router.push('/admin/elenco-esami')
      router.refresh()
    } catch (err) {
      setError('Errore durante l\'aggiornamento dell\'esame')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center">
        <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <h2 className="text-lg font-semibold text-gray-900">Modifica Esame</h2>
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
              value={paziente ? `${paziente.cognome} ${paziente.nome}` : ''}
              readOnly
              className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
            />
          </div>

          <div>
            <label htmlFor="tipo_prelievo_id" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo d'Esame
            </label>
            <select
              id="tipo_prelievo_id"
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
          </div>

          <div>
            <label htmlFor="data_stimata_referto" className="block text-sm font-medium text-gray-700 mb-1">
              Data Consegna
            </label>
            <div className="relative">
              <input
                type="date"
                id="data_stimata_referto"
                value={formData.data_stimata_referto}
                onChange={(e) => setFormData({ ...formData, data_stimata_referto: e.target.value })}
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
            <label htmlFor="laboratorio_id" className="block text-sm font-medium text-gray-700 mb-1">
              Laboratorio <span className="text-red-500">*</span>
            </label>
            <select
              id="laboratorio_id"
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
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-teal-500 resize-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/admin/elenco-esami')}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Salvataggio...' : 'Modifica'}
          </button>
        </div>
      </form>
    </div>
  )
}

