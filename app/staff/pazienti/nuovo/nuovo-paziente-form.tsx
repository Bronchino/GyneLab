'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NuovoPazienteForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    data_nascita: '',
    luogo_nascita_codice: '',
    luogo_nascita_comune: '',
    luogo_nascita_provincia: '',
    cellulare: '',
    email: '',
    codice_fiscale: '',
    sesso: '',
    auth_user_id: null as string | null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Prepara i dati per l'inserimento (rimuovi campi vuoti per valori nullable)
      const insertData: any = {
        nome: formData.nome,
        cognome: formData.cognome,
      }

      // Campi opzionali (solo se valorizzati)
      if (formData.data_nascita) insertData.data_nascita = formData.data_nascita
      if (formData.luogo_nascita_codice) insertData.luogo_nascita_codice = formData.luogo_nascita_codice
      if (formData.luogo_nascita_comune) insertData.luogo_nascita_comune = formData.luogo_nascita_comune
      if (formData.luogo_nascita_provincia) insertData.luogo_nascita_provincia = formData.luogo_nascita_provincia
      if (formData.cellulare) insertData.cellulare = formData.cellulare
      if (formData.email) insertData.email = formData.email
      if (formData.codice_fiscale) insertData.codice_fiscale = formData.codice_fiscale
      if (formData.sesso) insertData.sesso = formData.sesso
      if (formData.auth_user_id) insertData.auth_user_id = formData.auth_user_id

      // RLS: staff può INSERT
      const { data, error: insertError } = await supabase
        .from('pazienti')
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      // Redirect al dettaglio
      router.push(`/staff/pazienti/${data.id}`)
      router.refresh()
    } catch (err) {
      setError('Errore durante la creazione del paziente')
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
          <p className="mt-1 text-xs text-gray-500">
            Il codice fiscale viene validato e parsato automaticamente se valido
          </p>
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
          href="/staff/pazienti"
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

