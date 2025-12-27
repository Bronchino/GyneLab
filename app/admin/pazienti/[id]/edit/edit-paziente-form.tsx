'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Paziente } from '@/lib/supabase/types'

interface EditPazienteFormProps {
  paziente: Paziente
}

export default function EditPazienteForm({ paziente }: EditPazienteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    nome: paziente.nome || '',
    cognome: paziente.cognome || '',
    data_nascita: paziente.data_nascita || '',
    luogo_nascita_codice: paziente.luogo_nascita_codice || '',
    luogo_nascita_comune: paziente.luogo_nascita_comune || '',
    luogo_nascita_provincia: paziente.luogo_nascita_provincia || '',
    cellulare: paziente.cellulare || '',
    email: paziente.email || '',
    codice_fiscale: paziente.codice_fiscale || '',
    sesso: paziente.sesso || '',
    auth_user_id: paziente.auth_user_id || null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Prepara i dati per l'update
      const updateData: any = {
        nome: formData.nome,
        cognome: formData.cognome,
      }

      // Campi opzionali
      if (formData.data_nascita) updateData.data_nascita = formData.data_nascita
      else updateData.data_nascita = null
      
      if (formData.luogo_nascita_codice) updateData.luogo_nascita_codice = formData.luogo_nascita_codice
      else updateData.luogo_nascita_codice = null
      
      if (formData.luogo_nascita_comune) updateData.luogo_nascita_comune = formData.luogo_nascita_comune
      else updateData.luogo_nascita_comune = null
      
      if (formData.luogo_nascita_provincia) updateData.luogo_nascita_provincia = formData.luogo_nascita_provincia
      else updateData.luogo_nascita_provincia = null
      
      if (formData.cellulare) updateData.cellulare = formData.cellulare
      else updateData.cellulare = null
      
      if (formData.email) updateData.email = formData.email
      else updateData.email = null
      
      if (formData.codice_fiscale) updateData.codice_fiscale = formData.codice_fiscale
      else updateData.codice_fiscale = null
      
      if (formData.sesso) updateData.sesso = formData.sesso
      else updateData.sesso = null
      
      if (formData.auth_user_id) updateData.auth_user_id = formData.auth_user_id
      else updateData.auth_user_id = null

      // RLS: admin può UPDATE
      const { error: updateError } = await supabase
        .from('pazienti')
        .update(updateData)
        .eq('id', paziente.id)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      // Redirect al dettaglio
      router.push(`/admin/pazienti/${paziente.id}`)
      router.refresh()
    } catch (err) {
      setError('Errore durante l\'aggiornamento del paziente')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="cognome" className="block text-sm font-medium text-gray-700">
            Cognome *
          </label>
          <input
            type="text"
            id="cognome"
            required
            value={formData.cognome}
            onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
            Nome *
          </label>
          <input
            type="text"
            id="nome"
            required
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="data_nascita" className="block text-sm font-medium text-gray-700">
            Data di Nascita
          </label>
          <input
            type="date"
            id="data_nascita"
            value={formData.data_nascita}
            onChange={(e) => setFormData({ ...formData, data_nascita: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="codice_fiscale" className="block text-sm font-medium text-gray-700">
            Codice Fiscale
          </label>
          <input
            type="text"
            id="codice_fiscale"
            maxLength={16}
            value={formData.codice_fiscale}
            onChange={(e) => setFormData({ ...formData, codice_fiscale: e.target.value.toUpperCase() })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="cellulare" className="block text-sm font-medium text-gray-700">
            Cellulare
          </label>
          <input
            type="tel"
            id="cellulare"
            value={formData.cellulare}
            onChange={(e) => setFormData({ ...formData, cellulare: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <a
          href={`/admin/pazienti/${paziente.id}`}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Annulla
        </a>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Salvataggio...' : 'Salva'}
        </button>
      </div>
    </form>
  )
}



