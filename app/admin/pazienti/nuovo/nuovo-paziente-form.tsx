'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NuovoPazienteForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsingCf, setParsingCf] = useState(false)
  const [pazienteCreato, setPazienteCreato] = useState<string | null>(null)
  const [generandoPrivacy, setGenerandoPrivacy] = useState(false)
  const [generandoCredenziali, setGenerandoCredenziali] = useState(false)
  const [credenziali, setCredenziali] = useState<{
    username: string
    password: string
  } | null>(null)
  const [mostraModalCredenziali, setMostraModalCredenziali] = useState(false)
  const [mostraModalPDF, setMostraModalPDF] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    codice_fiscale: '',
    cognome: '',
    nome: '',
    sesso: '',
    data_nascita: '',
    luogo_nascita_comune: '',
    luogo_nascita_provincia: '',
    email: '',
    cellulare: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Prepara i dati per l'inserimento
      const insertData: any = {
        nome: formData.nome,
        cognome: formData.cognome,
      }

      // Campi opzionali
      if (formData.codice_fiscale) insertData.codice_fiscale = formData.codice_fiscale.toUpperCase()
      if (formData.sesso) insertData.sesso = formData.sesso
      if (formData.data_nascita) insertData.data_nascita = formData.data_nascita
      if (formData.luogo_nascita_comune) insertData.luogo_nascita_comune = formData.luogo_nascita_comune
      if (formData.luogo_nascita_provincia) insertData.luogo_nascita_provincia = formData.luogo_nascita_provincia
      if (formData.email) insertData.email = formData.email
      if (formData.cellulare) insertData.cellulare = formData.cellulare

      // RLS: admin può INSERT
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

  const handleReset = () => {
    setFormData({
      codice_fiscale: '',
      cognome: '',
      nome: '',
      sesso: '',
      data_nascita: '',
      luogo_nascita_comune: '',
      luogo_nascita_provincia: '',
      email: '',
      cellulare: '',
    })
    setError(null)
  }

  const parseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const parseCodiceFiscale = useCallback(async (cf: string) => {
    const codiceFiscale = cf.trim().toUpperCase()
    
    // Valida lunghezza (16 caratteri)
    if (codiceFiscale.length !== 16) {
      // Se il CF non è completo, reset dei campi derivati
      setFormData((prev) => ({
        ...prev,
        data_nascita: '',
        sesso: '',
        luogo_nascita_comune: '',
      luogo_nascita_provincia: '',
      }))
      return
    }

    setParsingCf(true)
    setError(null)

    try {
      const response = await fetch('/api/parse-codice-fiscale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codice_fiscale: codiceFiscale }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Se c'è un errore nel parsing, non blocchiamo l'utente
        console.warn('Errore parsing CF:', result.error)
        setParsingCf(false)
        return
      }

      // Popola i campi automaticamente
      setFormData((prev) => ({
        ...prev,
        data_nascita: result.data_nascita || '',
        sesso: result.sesso || '',
        luogo_nascita_comune: result.luogo_nascita_comune ?? '',
        // Per i codici estero (che iniziano con Z), la provincia deve essere "EE"
        luogo_nascita_provincia: result.luogo_nascita_provincia || '',
      }))

      setParsingCf(false)
    } catch (err) {
      console.error('Errore durante il parsing del codice fiscale:', err)
      setParsingCf(false)
    }
  }, [])

  // Effect per il parsing quando cambia il codice fiscale (con debounce)
  useEffect(() => {
    // Cancella il timeout precedente se esiste
    if (parseTimeoutRef.current) {
      clearTimeout(parseTimeoutRef.current)
    }

    const cf = formData.codice_fiscale.trim().toUpperCase()

    // Se il CF è vuoto, reset dei campi derivati
    if (!cf) {
      setFormData((prev) => ({
        ...prev,
        data_nascita: '',
        sesso: '',
        luogo_nascita_comune: '',
      luogo_nascita_provincia: '',
      }))
      return
    }

    // Aspetta 500ms dopo l'ultima modifica prima di parsare (debounce)
    parseTimeoutRef.current = setTimeout(() => {
      parseCodiceFiscale(cf)
    }, 500)

    // Cleanup del timeout se il componente si smonta o il valore cambia
    return () => {
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current)
      }
    }
  }, [formData.codice_fiscale, parseCodiceFiscale])

  const handleCodiceFiscaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, codice_fiscale: e.target.value.toUpperCase() })
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

  const handleGeneraPrivacy = async () => {
    if (!pazienteCreato) return

    setGenerandoPrivacy(true)
    try {
      const response = await fetch(`/api/pazienti/${pazienteCreato}/genera-privacy`)
      
      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Errore durante la generazione del PDF')
        setGenerandoPrivacy(false)
        return
      }

      // Scarica il PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `privacy_${formData.cognome}_${formData.nome}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Redirect alla lista pazienti
      router.push('/admin/pazienti')
      router.refresh()
    } catch (err) {
      setError('Errore durante la generazione del PDF')
      setGenerandoPrivacy(false)
    }
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
              onClick={handleGeneraPrivacy}
              disabled={generandoPrivacy}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {generandoPrivacy ? 'Generazione PDF...' : 'Genera Privacy'}
            </button>
            <button
              type="button"
              onClick={() => {
                router.push('/admin/pazienti')
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
                  fetch('http://127.0.0.1:7244/ingest/0247e7cd-30b8-41ea-9da5-caa078df417d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/pazienti/nuovo/nuovo-paziente-form.tsx:395',message:'Click Stampa Credenziali',data:{pazienteCreato,hasCredenziali:!!credenziali},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                  // #endregion
                  if (pazienteCreato && credenziali) {
                    const url = `/api/pazienti/${pazienteCreato}/credenziali-pdf?username=${encodeURIComponent(credenziali.username)}&password=${encodeURIComponent(credenziali.password)}`
                    // #region agent log
                    fetch('http://127.0.0.1:7244/ingest/0247e7cd-30b8-41ea-9da5-caa078df417d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/pazienti/nuovo/nuovo-paziente-form.tsx:399',message:'Setting PDF URL and opening modal',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
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
                  router.push('/admin/pazienti')
                  router.refresh()
                }}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
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
                      fetch('http://127.0.0.1:7244/ingest/0247e7cd-30b8-41ea-9da5-caa078df417d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/pazienti/nuovo/nuovo-paziente-form.tsx:445',message:'Click Stampa button',data:{pdfUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
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
                      fetch('http://127.0.0.1:7244/ingest/0247e7cd-30b8-41ea-9da5-caa078df417d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/pazienti/nuovo/nuovo-paziente-form.tsx:457',message:'Closing PDF modal',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
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
                    fetch('http://127.0.0.1:7244/ingest/0247e7cd-30b8-41ea-9da5-caa078df417d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/pazienti/nuovo/nuovo-paziente-form.tsx:470',message:'PDF iframe loaded',data:{pdfUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                    // #endregion
                  }}
                  onError={(e) => {
                    // #region agent log
                    fetch('http://127.0.0.1:7244/ingest/0247e7cd-30b8-41ea-9da5-caa078df417d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/pazienti/nuovo/nuovo-paziente-form.tsx:475',message:'PDF iframe error',data:{error:String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                    // #endregion
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sezione Generalità - Colonna sinistra */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generalità</h2>
          
          <div>
            <label htmlFor="codice_fiscale" className="block text-sm font-medium text-gray-700 mb-1">
              Codice Fiscale <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="codice_fiscale"
                required
                maxLength={16}
                value={formData.codice_fiscale}
                onChange={handleCodiceFiscaleChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500"
                placeholder="Inserisci il codice fiscale per compilare automaticamente i dati"
              />
              {parsingCf && (
                <div className="absolute right-3 top-2.5">
                  <svg className="animate-spin h-5 w-5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              I dati di nascita verranno compilati automaticamente quando il codice fiscale è completo (16 caratteri)
            </p>
          </div>

          <div>
            <label htmlFor="cognome" className="block text-sm font-medium text-gray-700 mb-1">
              Cognome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="cognome"
              required
              value={formData.cognome}
              onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500"
            />
          </div>

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
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500"
            />
          </div>

          <div>
            <label htmlFor="sesso" className="block text-sm font-medium text-gray-700 mb-1">
              Sesso <span className="text-red-500">*</span>
            </label>
            <select
              id="sesso"
              required
              value={formData.sesso}
              onChange={(e) => setFormData({ ...formData, sesso: e.target.value })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500"
            >
              <option value="">Selezionare...</option>
              <option value="M">Maschio</option>
              <option value="F">Femmina</option>
            </select>
          </div>

          <div>
            <label htmlFor="data_nascita" className="block text-sm font-medium text-gray-700 mb-1">
              Nato il <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                id="data_nascita"
                required
                value={formData.data_nascita}
                onChange={(e) => setFormData({ ...formData, data_nascita: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500"
              />
              <svg className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div>
            <label htmlFor="luogo_nascita_comune" className="block text-sm font-medium text-gray-700 mb-1">
              Luogo di nascita <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="luogo_nascita_comune"
              required
              value={formData.luogo_nascita_comune}
              onChange={(e) => setFormData({ ...formData, luogo_nascita_comune: e.target.value })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500"
              placeholder="Nome del comune"
            />
          </div>

          <div>
            <label htmlFor="luogo_nascita_provincia" className="block text-sm font-medium text-gray-700 mb-1">
              Provincia di nascita <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="luogo_nascita_provincia"
              required
              maxLength={2}
              value={formData.luogo_nascita_provincia}
              onChange={(e) => setFormData({ ...formData, luogo_nascita_provincia: e.target.value.toUpperCase() })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500"
              placeholder="ES: PA"
            />
          </div>
        </div>

        {/* Sezione Residenza e Contatti - Colonna destra */}
        <div className="space-y-6">
          {/* Residenza */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Residenza</h2>
            
            <div>
              <label htmlFor="indirizzo" className="block text-sm font-medium text-gray-700 mb-1">
                Indirizzo
              </label>
              <input
                type="text"
                id="indirizzo"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500"
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">Campo non disponibile</p>
            </div>

            <div>
              <label htmlFor="citta" className="block text-sm font-medium text-gray-700 mb-1">
                Città
              </label>
              <input
                type="text"
                id="citta"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500"
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">Campo non disponibile</p>
            </div>

            <div>
              <label htmlFor="provincia_residenza" className="block text-sm font-medium text-gray-700 mb-1">
                Provincia
              </label>
              <input
                type="text"
                id="provincia_residenza"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500"
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">Campo non disponibile</p>
            </div>

            <div>
              <label htmlFor="cap" className="block text-sm font-medium text-gray-700 mb-1">
                CAP
              </label>
              <input
                type="text"
                id="cap"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500"
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">Campo non disponibile</p>
            </div>

            <div>
              <label htmlFor="nazione" className="block text-sm font-medium text-gray-700 mb-1">
                Nazione
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="nazione"
                  value="Italia"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-8 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500"
                  disabled
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  disabled
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Contatti */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contatti</h2>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500"
              />
            </div>

            <div>
              <label htmlFor="cellulare" className="block text-sm font-medium text-gray-700 mb-1">
                Cellulare
              </label>
              <input
                type="tel"
                id="cellulare"
                value={formData.cellulare}
                onChange={(e) => setFormData({ ...formData, cellulare: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Per inviare notifica della disponibilità dei referti, inserire l'indirizzo email e/o il cellulare del paziente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottoni di azione */}
      {!pazienteCreato && (
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Salvataggio...' : 'Inserisci'}
          </button>
          <a
            href="/admin/pazienti"
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Annulla
          </a>
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2 bg-white border border-teal-600 text-teal-600 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            Azzera
          </button>
        </div>
      )}
    </form>
  )
}
