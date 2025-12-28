'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function StampaCredenzialiPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const pazienteId = params.id as string
  const username = searchParams.get('username')
  const password = searchParams.get('password')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!username || !password) {
      setError('Credenziali non disponibili')
      setLoading(false)
      return
    }

    // Genera l'URL del PDF
    const url = `/api/pazienti/${pazienteId}/credenziali-pdf?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    setPdfUrl(url)
    setLoading(false)
  }, [pazienteId, username, password])

  useEffect(() => {
    // Quando il PDF è caricato, apri automaticamente il dialog di stampa
    if (pdfUrl && !loading) {
      // Piccolo delay per assicurarsi che il PDF sia caricato
      const timer = setTimeout(() => {
        window.print()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [pdfUrl, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento PDF...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Chiudi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="print-container">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container,
          .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
        @media screen {
          .print-container {
            padding: 20px;
          }
        }
      `}</style>
      <div className="no-print mb-4 flex justify-between items-center bg-gray-100 p-4 rounded-lg">
        <h1 className="text-xl font-bold">Stampa Credenziali</h1>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Stampa
          </button>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Chiudi
          </button>
        </div>
      </div>
      {pdfUrl && (
        <iframe
          src={pdfUrl}
          className="w-full border-0"
          style={{ height: 'calc(100vh - 120px)', minHeight: '800px' }}
          title="PDF Credenziali"
        />
      )}
    </div>
  )
}


