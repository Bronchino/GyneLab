'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NuovoPazienteForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pazienteCreato, setPazienteCreato] = useState<string | null>(null)
  const [generandoCredenziali, setGenerandoCredenziali] = useState(false)
  const [credenziali, setCredenziali] = useState<{
    username: string
    password: string
  } | null>(null)
  const [mostraModalCredenziali, setMostraModalCredenziali] = useState(false)
  const [mostraModalPDF, setMostraModalPDF] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  
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

      // Salva l'ID del paziente creato
      setPazienteCreato(data.id)
      setLoading(false)

      // Genera automaticamente le credenziali
      await generaCredenziali(data.id)
    } catch (err) {
      setError('Errore durante la creazione del paziente')
      setLoading(false)
    }
  }

  const generaCredenziali = async (pazienteId: string) => {
    setGenerandoCredenziali(true)
    setError(null)

    try {
      const response = await fetch(`/api/pazienti/${pazienteId}/genera-credenziali`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Errore durante la generazione delle credenziali')
        setGenerandoCredenziali(false)
        return
      }

      const data = await response.json()
      setCredenziali({
        username: data.username,
        password: data.password,
      })
      setMostraModalCredenziali(true)
      setGenerandoCredenziali(false)

      // Scarica automaticamente il PDF
      await scaricaPDFCredenziali(pazienteId, data.username, data.password)
    } catch (err) {
      setError('Errore durante la generazione delle credenziali')
      setGenerandoCredenziali(false)
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
        : `credenziali_${formData.cognome}_${formData.nome}_${new Date().toISOString().split('T')[0]}.pdf`
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {pazienteCreato && (
        <div className="rounded-md bg-green-50 p-4 text-green-800">
          <p className="font-medium mb-3">Paziente creato con successo!</p>
          {generandoCredenziali && (
            <p className="text-sm mb-3">Generazione credenziali in corso...</p>
          )}
          {credenziali && (
            <p className="text-sm mb-3 text-green-700">
              ✓ Credenziali generate. Il PDF è stato scaricato automaticamente.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                router.push(`/staff/pazienti/${pazienteCreato}`)
                router.refresh()
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Vai al Dettaglio
            </button>
            <button
              type="button"
              onClick={() => {
                router.push('/staff/pazienti')
                router.refresh()
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Vai alla Lista
            </button>
          </div>
        </div>
      )}

      {/* Modal Credenziali */}
      {mostraModalCredenziali && credenziali && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Credenziali Generate</h3>
            <p className="text-sm text-gray-600 mb-4">
              Le credenziali sono state generate e il PDF è stato scaricato automaticamente.
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
                  Password:
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
                  fetch('http://127.0.0.1:7244/ingest/0247e7cd-30b8-41ea-9da5-caa078df417d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/staff/pazienti/nuovo/nuovo-paziente-form.tsx:256',message:'Click Stampa Credenziali',data:{pazienteCreato,hasCredenziali:!!credenziali},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                  // #endregion
                  if (pazienteCreato && credenziali) {
                    const url = `/api/pazienti/${pazienteCreato}/credenziali-pdf?username=${encodeURIComponent(credenziali.username)}&password=${encodeURIComponent(credenziali.password)}`
                    // #region agent log
                    fetch('http://127.0.0.1:7244/ingest/0247e7cd-30b8-41ea-9da5-caa078df417d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/staff/pazienti/nuovo/nuovo-paziente-form.tsx:260',message:'Setting PDF URL and opening modal',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
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
                  setMostraModalCredenziali(false)
                  router.push(`/staff/pazienti/${pazienteCreato}`)
                  router.refresh()
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                    fetch('http://127.0.0.1:7244/ingest/0247e7cd-30b8-41ea-9da5-caa078df417d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/staff/pazienti/nuovo/nuovo-paziente-form.tsx:280',message:'Click Stampa button',data:{pdfUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
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
                    fetch('http://127.0.0.1:7244/ingest/0247e7cd-30b8-41ea-9da5-caa078df417d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/staff/pazienti/nuovo/nuovo-paziente-form.tsx:292',message:'Closing PDF modal',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
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
                  fetch('http://127.0.0.1:7244/ingest/0247e7cd-30b8-41ea-9da5-caa078df417d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/staff/pazienti/nuovo/nuovo-paziente-form.tsx:305',message:'PDF iframe loaded',data:{pdfUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                  // #endregion
                }}
                onError={(e) => {
                  // #region agent log
                  fetch('http://127.0.0.1:7244/ingest/0247e7cd-30b8-41ea-9da5-caa078df417d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/staff/pazienti/nuovo/nuovo-paziente-form.tsx:310',message:'PDF iframe error',data:{error:String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                  // #endregion
                }}
              />
            </div>
          </div>
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

      {!pazienteCreato && (
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
      )}
    </form>
  )
}

