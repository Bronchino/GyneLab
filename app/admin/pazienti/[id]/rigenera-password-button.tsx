'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RigeneraPasswordButtonProps {
  pazienteId: string
  pazienteNome: string
  pazienteCognome: string
}

export default function RigeneraPasswordButton({
  pazienteId,
  pazienteNome,
  pazienteCognome,
}: RigeneraPasswordButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [credenziali, setCredenziali] = useState<{
    username: string
    password: string
  } | null>(null)
  const [mostraModal, setMostraModal] = useState(false)
  const [mostraModalPDF, setMostraModalPDF] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const router = useRouter()

  const handleRigeneraPassword = async () => {
    if (!confirm('Sei sicuro di voler rigenerare la password? La password attuale non sarà più valida.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/pazienti/${pazienteId}/rigenera-password`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Errore durante la rigenerazione della password')
        setLoading(false)
        return
      }

      const data = await response.json()
      setCredenziali({
        username: data.username,
        password: data.password,
      })
      setMostraModal(true)
      setLoading(false)

      // Scarica automaticamente il PDF
      await scaricaPDFCredenziali(pazienteId, data.username, data.password)
    } catch (err) {
      setError('Errore durante la rigenerazione della password')
      setLoading(false)
    }
  }

  const scaricaPDFCredenziali = async (
    pazienteId: string,
    username: string,
    password: string
  ) => {
    try {
      const response = await fetch(
        `/api/pazienti/${pazienteId}/credenziali-pdf?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
      )

      if (!response.ok) {
        console.error('Errore durante il download del PDF')
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `credenziali_${pazienteCognome}_${pazienteNome}_${new Date().toISOString().split('T')[0]}.pdf`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Errore durante il download del PDF:', err)
    }
  }

  const copiaCredenziali = (tipo: 'username' | 'password') => {
    if (!credenziali) return

    const testo = tipo === 'username' ? credenziali.username : credenziali.password
    navigator.clipboard.writeText(testo)
    alert(`${tipo === 'username' ? 'Username' : 'Password'} copiato negli appunti!`)
  }

  return (
    <>
      {error && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}
      <button
        onClick={handleRigeneraPassword}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
        title="Rigenera Password"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Rigenerazione...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Rigenera Password
          </>
        )}
      </button>

      {/* Modal Credenziali */}
      {mostraModal && credenziali && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Password Rigenerata</h3>
            <p className="text-sm text-gray-600 mb-4">
              La nuova password è stata generata e il PDF è stato scaricato automaticamente.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={credenziali.username}
                    readOnly
                    className="flex-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => copiaCredenziali('username')}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    title="Copia username"
                  >
                    📋
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nuova Password:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={credenziali.password}
                    readOnly
                    className="flex-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => copiaCredenziali('password')}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    title="Copia password"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  // #region agent log
                  fetch('http://127.0.0.1:7244/ingest/0247e7cd-30b8-41ea-9da5-caa078df417d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/pazienti/[id]/rigenera-password-button.tsx:189',message:'Click Stampa Credenziali',data:{hasCredenziali:!!credenziali},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                  // #endregion
                  if (credenziali) {
                    const url = `/api/pazienti/${pazienteId}/credenziali-pdf?username=${encodeURIComponent(credenziali.username)}&password=${encodeURIComponent(credenziali.password)}`
                    // #region agent log
                    fetch('http://127.0.0.1:7244/ingest/0247e7cd-30b8-41ea-9da5-caa078df417d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/pazienti/[id]/rigenera-password-button.tsx:193',message:'Setting PDF URL and opening modal',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                    // #endregion
                    setPdfUrl(url)
                    setMostraModalPDF(true)
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Stampa Credenziali
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostraModal(false)
                  router.refresh()
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal PDF Viewer */}
      {mostraModalPDF && pdfUrl && (
        <>
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .pdf-modal-iframe,
              .pdf-modal-iframe * {
                visibility: visible;
              }
              .pdf-modal-iframe {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
              }
              .no-print-pdf {
                display: none !important;
              }
            }
          `}</style>
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-[90vw] h-[90vh] max-w-5xl flex flex-col">
            {/* Header con controlli */}
            <div className="no-print-pdf flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold">Stampa Credenziali</h3>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    // #region agent log
                    fetch('http://127.0.0.1:7244/ingest/0247e7cd-30b8-41ea-9da5-caa078df417d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/pazienti/[id]/rigenera-password-button.tsx:215',message:'Click Stampa button',data:{pdfUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                    // #endregion
                    window.print()
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Stampa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // #region agent log
                    fetch('http://127.0.0.1:7244/ingest/0247e7cd-30b8-41ea-9da5-caa078df417d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/pazienti/[id]/rigenera-password-button.tsx:227',message:'Closing PDF modal',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion
                    setMostraModalPDF(false)
                    setPdfUrl(null)
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Chiudi
                </button>
              </div>
            </div>
            {/* Iframe con PDF */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={pdfUrl}
                className="pdf-modal-iframe w-full h-full border-0"
                title="PDF Credenziali"
                onLoad={() => {
                  // #region agent log
                  fetch('http://127.0.0.1:7244/ingest/0247e7cd-30b8-41ea-9da5-caa078df417d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/pazienti/[id]/rigenera-password-button.tsx:240',message:'PDF iframe loaded',data:{pdfUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                  // #endregion
                }}
                onError={(e) => {
                  // #region agent log
                  fetch('http://127.0.0.1:7244/ingest/0247e7cd-30b8-41ea-9da5-caa078df417d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/pazienti/[id]/rigenera-password-button.tsx:245',message:'PDF iframe error',data:{error:String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                  // #endregion
                }}
              />
            </div>
          </div>
        </div>
        </>
      )}
    </>
  )
}

