'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UploadRefertoFormProps {
  prelievoId: string
  onClose?: () => void
}

export default function UploadRefertoForm({ prelievoId, onClose }: UploadRefertoFormProps) {
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
      setError('Seleziona un file PDF')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/upload-referto/${prelievoId}`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante l\'upload')
      }

      setSuccess(true)
      setFile(null)
      // Reset file input
      const fileInput = document.getElementById('referto-file-input') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }

      // Refresh pagina dopo 1.5 secondi per vedere il referto caricato
      setTimeout(() => {
        router.refresh()
        if (onClose) {
          onClose()
        }
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'upload del referto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-800 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-4 text-green-800 text-sm">
          Referto caricato con successo! La pagina si aggiornerà automaticamente...
        </div>
      )}

      <div>
        <label htmlFor="referto-file-input" className="block text-sm font-medium text-gray-700 mb-1">
          File PDF Referto <span className="text-red-500">*</span>
        </label>
        <input
          id="referto-file-input"
          type="file"
          accept="application/pdf"
          required
          onChange={handleFileChange}
          disabled={loading || success}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {file && (
          <p className="mt-1 text-xs text-gray-500">
            File selezionato: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      <div className="flex items-center justify-end space-x-3">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={loading || success}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annulla
          </button>
        )}
        <button
          type="submit"
          disabled={loading || success || !file}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
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
              Carica Referto
            </>
          )}
        </button>
      </div>
    </form>
  )
}

