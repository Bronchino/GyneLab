'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UploadDocumentoFormProps {
  pazienteId: string
}

export default function UploadDocumentoForm({ pazienteId }: UploadDocumentoFormProps) {
  const [titolo, setTitolo] = useState('')
  const [descrizione, setDescrizione] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Solo file PDF sono consentiti')
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File troppo grande. Dimensione massima: 10MB')
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!file) {
      setError('Seleziona un file')
      return
    }

    if (!titolo.trim()) {
      setError('Il titolo è obbligatorio')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('titolo', titolo.trim())
      if (descrizione.trim()) {
        formData.append('descrizione', descrizione.trim())
      }

      const response = await fetch(`/api/upload-documento/${pazienteId}`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante l\'upload')
      }

      setSuccess(true)
      setTitolo('')
      setDescrizione('')
      setFile(null)
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }

      // Refresh pagina dopo 1 secondo
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'upload del documento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-4 text-green-800">
          Documento caricato con successo!
        </div>
      )}

      <div>
        <label htmlFor="titolo" className="block text-sm font-medium text-gray-700 mb-1">
          Titolo <span className="text-red-500">*</span>
        </label>
        <input
          id="titolo"
          type="text"
          required
          value={titolo}
          onChange={(e) => setTitolo(e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Es. Certificato medico"
        />
      </div>

      <div>
        <label htmlFor="descrizione" className="block text-sm font-medium text-gray-700 mb-1">
          Descrizione
        </label>
        <textarea
          id="descrizione"
          rows={3}
          value={descrizione}
          onChange={(e) => setDescrizione(e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Descrizione opzionale del documento"
        />
      </div>

      <div>
        <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-1">
          File PDF <span className="text-red-500">*</span>
        </label>
        <input
          id="file-input"
          type="file"
          accept="application/pdf"
          required
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {file && (
          <p className="mt-1 text-xs text-gray-500">
            File selezionato: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Caricamento...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Carica Documento
            </>
          )}
        </button>
      </div>
    </form>
  )
}

