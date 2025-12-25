'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TipoPrelievo } from '@/lib/supabase/types'

interface EditTipoPrelievoFormProps {
  tipoPrelievo: TipoPrelievo
}

export default function EditTipoPrelievoForm({ tipoPrelievo }: EditTipoPrelievoFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    nome: tipoPrelievo.nome || '',
    descrizione: tipoPrelievo.descrizione || '',
    tempo_refertazione_giorni: tipoPrelievo.tempo_refertazione_giorni?.toString() || '',
    attivo: tipoPrelievo.attivo ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Prepara i dati per l'aggiornamento
      const updateData: any = {
        nome: formData.nome.trim(),
        attivo: formData.attivo,
      }

      // Campi opzionali
      if (formData.descrizione.trim()) {
        updateData.descrizione = formData.descrizione.trim()
      } else {
        updateData.descrizione = null
      }
      
      if (formData.tempo_refertazione_giorni) {
        const giorni = parseInt(formData.tempo_refertazione_giorni)
        if (!isNaN(giorni) && giorni > 0) {
          updateData.tempo_refertazione_giorni = giorni
        } else {
          updateData.tempo_refertazione_giorni = null
        }
      } else {
        updateData.tempo_refertazione_giorni = null
      }

      // RLS: admin può UPDATE
      const { error: updateError } = await supabase
        .from('tipi_prelievo')
        .update(updateData)
        .eq('id', tipoPrelievo.id)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      // Redirect alla lista tipologie
      router.push('/admin/tipi-prelievo')
      router.refresh()
    } catch (err) {
      setError('Errore durante la modifica della tipologia')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nome"
            required
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Es: Pap Test"
          />
        </div>

        <div>
          <label htmlFor="descrizione" className="block text-sm font-medium text-gray-700 mb-1">
            Descrizione
          </label>
          <textarea
            id="descrizione"
            rows={4}
            value={formData.descrizione}
            onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Descrizione dettagliata della tipologia di esame"
          />
        </div>

        <div>
          <label htmlFor="tempo_refertazione_giorni" className="block text-sm font-medium text-gray-700 mb-1">
            Tempo di Consegna (giorni)
          </label>
          <input
            type="number"
            id="tempo_refertazione_giorni"
            min="1"
            value={formData.tempo_refertazione_giorni}
            onChange={(e) => setFormData({ ...formData, tempo_refertazione_giorni: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Es: 7"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="attivo"
            checked={formData.attivo}
            onChange={(e) => setFormData({ ...formData, attivo: e.target.checked })}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="attivo" className="ml-2 block text-sm text-gray-700">
            Tipologia attiva
          </label>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
          <a
            href="/admin/tipi-prelievo"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Annulla
          </a>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
        </div>
      </form>
    </div>
  )
}

