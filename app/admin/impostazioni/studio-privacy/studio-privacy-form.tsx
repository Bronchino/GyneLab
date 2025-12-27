'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StudioImpostazioni, PrivacyTesto } from '@/lib/supabase/types'
import dynamic from 'next/dynamic'

// Import dinamico di ReactQuill per evitare problemi SSR
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

interface StudioPrivacyFormProps {
  studio: StudioImpostazioni | null
  privacy: PrivacyTesto | null
}

export default function StudioPrivacyForm({ studio, privacy }: StudioPrivacyFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [studioData, setStudioData] = useState({
    studio_denominazione: studio?.studio_denominazione || '',
    studio_indirizzo: studio?.studio_indirizzo || '',
    studio_cap: studio?.studio_cap || '',
    studio_comune: studio?.studio_comune || '',
    studio_provincia: studio?.studio_provincia || '',
    studio_telefono: studio?.studio_telefono || '',
    studio_email: studio?.studio_email || '',
    studio_pec: studio?.studio_pec || '',
    studio_portale_referti_url: studio?.studio_portale_referti_url || '',
    titolare_cf: studio?.titolare_cf || '',
    titolare_piva: studio?.titolare_piva || '',
    titolare_qualifica: studio?.titolare_qualifica || '',
  })

  const [privacyTesto, setPrivacyTesto] = useState(privacy?.testo || '')
  
  // Estrae font-size e line-height dal testo HTML se presenti, altrimenti usa default
  const extractStyleFromHtml = (html: string) => {
    const fontSizeMatch = html.match(/font-size:\s*(\d+(?:\.\d+)?)px/i)
    const lineHeightMatch = html.match(/line-height:\s*(\d+(?:\.\d+)?)/i)
    return {
      fontSize: fontSizeMatch ? fontSizeMatch[1] : '14',
      lineHeight: lineHeightMatch ? lineHeightMatch[1] : '1.6'
    }
  }
  
  const initialStyles = extractStyleFromHtml(privacy?.testo || '')
  const [fontSize, setFontSize] = useState(initialStyles.fontSize)
  const [lineHeight, setLineHeight] = useState(initialStyles.lineHeight)

  // Applica gli stili quando cambiano fontSize o lineHeight (solo se c'è contenuto)
  useEffect(() => {
    if (privacyTesto && privacyTesto.trim() !== '') {
      let updatedText = privacyTesto
      let hasChanges = false
      
      // Se il testo non ha già stili inline, aggiungili
      if (!updatedText.includes('style=')) {
        const before = updatedText
        updatedText = updatedText.replace(
          /<p([^>]*)>/g,
          `<p$1 style="font-size: ${fontSize}px; line-height: ${lineHeight};">`
        )
        updatedText = updatedText.replace(
          /<div([^>]*)>/g,
          `<div$1 style="font-size: ${fontSize}px; line-height: ${lineHeight};">`
        )
        hasChanges = before !== updatedText
      } else {
        // Aggiorna gli stili esistenti
        const before = updatedText
        updatedText = updatedText.replace(
          /style="([^"]*)font-size:[^;"]*;?([^"]*)"/g,
          `style="$1font-size: ${fontSize}px; $2"`
        )
        updatedText = updatedText.replace(
          /style="([^"]*)line-height:[^;"]*;?([^"]*)"/g,
          `style="$1line-height: ${lineHeight}; $2"`
        )
        hasChanges = before !== updatedText
      }
      
      if (hasChanges) {
        setPrivacyTesto(updatedText)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontSize, lineHeight]) // Solo quando cambiano fontSize o lineHeight

  // Configurazione moduli ReactQuill con dimensioni font
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  }

  const quillFormats = [
    'header',
    'size',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'link',
    'color', 'background'
  ]

  const handleStudioSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Ottieni l'utente corrente per titolare_user_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Utente non autenticato')
        setLoading(false)
        return
      }

      const updateData: any = {
        titolare_user_id: user.id,
        studio_denominazione: studioData.studio_denominazione,
        studio_indirizzo: studioData.studio_indirizzo,
        studio_telefono: studioData.studio_telefono,
        studio_cap: studioData.studio_cap || null,
        studio_comune: studioData.studio_comune || null,
        studio_provincia: studioData.studio_provincia || null,
        studio_email: studioData.studio_email || null,
        studio_pec: studioData.studio_pec || null,
        portale_referti_url: studioData.studio_portale_referti_url || null, // Mappa al nome corretto del database
        titolare_cf: studioData.titolare_cf || null,
        titolare_piva: studioData.titolare_piva || null,
        titolare_qualifica: studioData.titolare_qualifica || null,
        updated_at: new Date().toISOString(),
      }

      if (studio) {
        // Update esistente
        const { error: updateError } = await supabase
          .from('studio_impostazioni')
          .update(updateData)
          .eq('id', studio.id)

        if (updateError) {
          setError(updateError.message)
          setLoading(false)
          return
        }
      } else {
        // Insert nuovo
        const { error: insertError } = await supabase
          .from('studio_impostazioni')
          .insert(updateData)

        if (insertError) {
          setError(insertError.message)
          setLoading(false)
          return
        }
      }

      setSuccess('Dati dello studio salvati con successo')
      setLoading(false)
      router.refresh()
    } catch (err) {
      setError('Errore durante il salvataggio dei dati dello studio')
      setLoading(false)
    }
  }

  const handlePrivacySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    // Validazione: verifica che ci sia contenuto (rimuovendo i tag HTML)
    const textContent = privacyTesto.replace(/<[^>]*>/g, '').trim()
    if (!textContent) {
      setError('Il testo della privacy è obbligatorio')
      return
    }
    
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Applica font-size e line-height al testo prima di salvarlo
      let testoConStili = privacyTesto
      
      // Se il testo non ha già stili inline, aggiungili ai paragrafi principali
      if (!testoConStili.includes('style=')) {
        testoConStili = testoConStili.replace(
          /<p([^>]*)>/g,
          `<p$1 style="font-size: ${fontSize}px; line-height: ${lineHeight};">`
        )
        // Applica anche a div e altri elementi
        testoConStili = testoConStili.replace(
          /<div([^>]*)>/g,
          `<div$1 style="font-size: ${fontSize}px; line-height: ${lineHeight};">`
        )
      } else {
        // Aggiorna gli stili esistenti
        testoConStili = testoConStili.replace(
          /style="([^"]*)font-size:[^;"]*;?([^"]*)"/g,
          `style="$1font-size: ${fontSize}px; $2"`
        )
        testoConStili = testoConStili.replace(
          /style="([^"]*)line-height:[^;"]*;?([^"]*)"/g,
          `style="$1line-height: ${lineHeight}; $2"`
        )
      }
      
      const updateData: any = {
        testo: testoConStili, // Salva come HTML formattato con stili
        updated_at: new Date().toISOString(),
      }

      if (privacy) {
        // Update esistente
        const { error: updateError } = await supabase
          .from('privacy_testo')
          .update(updateData)
          .eq('id', privacy.id)

        if (updateError) {
          setError(updateError.message)
          setLoading(false)
          return
        }
      } else {
        // Insert nuovo
        const { error: insertError } = await supabase
          .from('privacy_testo')
          .insert(updateData)

        if (insertError) {
          setError(insertError.message)
          setLoading(false)
          return
        }
      }

      setSuccess('Testo della privacy salvato con successo')
      setLoading(false)
      router.refresh()
    } catch (err) {
      setError('Errore durante il salvataggio del testo della privacy')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-4 text-green-800">
          {success}
        </div>
      )}

      {/* Form Dati Studio */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Dati Studio e Titolare</h2>
          <p className="text-sm text-gray-500 mt-1">
            Configura i dati dello studio medico e del titolare
          </p>
        </div>
        <form onSubmit={handleStudioSubmit} className="px-6 py-5">
          <div className="space-y-6">
            {/* Sezione Studio */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Dati Studio</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="studio_denominazione" className="block text-sm font-medium text-gray-700">
                    Denominazione Studio *
                  </label>
                  <input
                    type="text"
                    id="studio_denominazione"
                    required
                    value={studioData.studio_denominazione}
                    onChange={(e) => setStudioData({ ...studioData, studio_denominazione: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="studio_indirizzo" className="block text-sm font-medium text-gray-700">
                    Indirizzo Studio *
                  </label>
                  <input
                    type="text"
                    id="studio_indirizzo"
                    required
                    value={studioData.studio_indirizzo}
                    onChange={(e) => setStudioData({ ...studioData, studio_indirizzo: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="studio_cap" className="block text-sm font-medium text-gray-700">
                    CAP
                  </label>
                  <input
                    type="text"
                    id="studio_cap"
                    value={studioData.studio_cap}
                    onChange={(e) => setStudioData({ ...studioData, studio_cap: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="studio_comune" className="block text-sm font-medium text-gray-700">
                    Comune
                  </label>
                  <input
                    type="text"
                    id="studio_comune"
                    value={studioData.studio_comune}
                    onChange={(e) => setStudioData({ ...studioData, studio_comune: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="studio_provincia" className="block text-sm font-medium text-gray-700">
                    Provincia
                  </label>
                  <input
                    type="text"
                    id="studio_provincia"
                    value={studioData.studio_provincia}
                    onChange={(e) => setStudioData({ ...studioData, studio_provincia: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="studio_telefono" className="block text-sm font-medium text-gray-700">
                    Telefono Studio *
                  </label>
                  <input
                    type="tel"
                    id="studio_telefono"
                    required
                    value={studioData.studio_telefono}
                    onChange={(e) => setStudioData({ ...studioData, studio_telefono: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="studio_email" className="block text-sm font-medium text-gray-700">
                    Email Studio
                  </label>
                  <input
                    type="email"
                    id="studio_email"
                    value={studioData.studio_email}
                    onChange={(e) => setStudioData({ ...studioData, studio_email: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="studio_pec" className="block text-sm font-medium text-gray-700">
                    PEC Studio
                  </label>
                  <input
                    type="email"
                    id="studio_pec"
                    value={studioData.studio_pec}
                    onChange={(e) => setStudioData({ ...studioData, studio_pec: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="studio_portale_referti_url" className="block text-sm font-medium text-gray-700">
                    URL Portale Referti
                  </label>
                  <input
                    type="url"
                    id="studio_portale_referti_url"
                    value={studioData.studio_portale_referti_url}
                    onChange={(e) => setStudioData({ ...studioData, studio_portale_referti_url: e.target.value })}
                    placeholder="https://..."
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Sezione Titolare */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Dati Titolare</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="titolare_cf" className="block text-sm font-medium text-gray-700">
                    Codice Fiscale
                  </label>
                  <input
                    type="text"
                    id="titolare_cf"
                    value={studioData.titolare_cf}
                    onChange={(e) => setStudioData({ ...studioData, titolare_cf: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="titolare_piva" className="block text-sm font-medium text-gray-700">
                    Partita IVA
                  </label>
                  <input
                    type="text"
                    id="titolare_piva"
                    value={studioData.titolare_piva}
                    onChange={(e) => setStudioData({ ...studioData, titolare_piva: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="titolare_qualifica" className="block text-sm font-medium text-gray-700">
                    Qualifica
                  </label>
                  <input
                    type="text"
                    id="titolare_qualifica"
                    value={studioData.titolare_qualifica}
                    onChange={(e) => setStudioData({ ...studioData, titolare_qualifica: e.target.value })}
                    placeholder="Es: Dott. Medico, Dott.ssa, ecc."
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Salvataggio...' : 'Salva Dati Studio'}
            </button>
          </div>
        </form>
      </div>

      {/* Form Testo Privacy */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Testo Privacy</h2>
          <p className="text-sm text-gray-500 mt-1">
            Configura il testo della privacy. Puoi usare placeholder dinamici come {'{'}studio_denominazione{'}'}, {'{'}studio_indirizzo{'}'}, {'{'}titolare_qualifica{'}'}, ecc.
          </p>
        </div>
        <form onSubmit={handlePrivacySubmit} className="px-6 py-5">
          <div>
            <label htmlFor="privacy_testo" className="block text-sm font-medium text-gray-700 mb-2">
              Testo Privacy *
            </label>
            
            {/* Controlli Font e Interlinea */}
            <div className="mb-3 flex gap-4 items-end">
              <div className="flex-1">
                <label htmlFor="font_size" className="block text-xs font-medium text-gray-600 mb-1">
                  Dimensione Font (px)
                </label>
                <input
                  type="number"
                  id="font_size"
                  min="8"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="line_height" className="block text-xs font-medium text-gray-600 mb-1">
                  Interlinea
                </label>
                <input
                  type="number"
                  id="line_height"
                  min="1"
                  max="3"
                  step="0.1"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-2">
              <div className="quill-editor-privacy">
                <ReactQuill
                  theme="snow"
                  value={privacyTesto}
                  onChange={setPrivacyTesto}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Inserisci il testo della privacy. Puoi formattare il testo e usare placeholder come {studio_denominazione}, {studio_indirizzo}, {titolare_qualifica}, ecc."
                  style={{ minHeight: '300px' }}
                  className="bg-white"
                />
              </div>
              {/* Applica stili dinamicamente */}
              <style dangerouslySetInnerHTML={{
                __html: `
                  .quill-editor-privacy .ql-editor {
                    font-size: ${fontSize}px !important;
                    line-height: ${lineHeight} !important;
                  }
                  .quill-editor-privacy .ql-editor p,
                  .quill-editor-privacy .ql-editor div,
                  .quill-editor-privacy .ql-editor span,
                  .quill-editor-privacy .ql-editor li {
                    font-size: ${fontSize}px !important;
                    line-height: ${lineHeight} !important;
                  }
                `
              }} />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Placeholder disponibili: {'{'}studio_denominazione{'}'}, {'{'}studio_indirizzo{'}'}, {'{'}studio_cap{'}'}, {'{'}studio_comune{'}'}, {'{'}studio_provincia{'}'}, {'{'}studio_telefono{'}'}, {'{'}studio_email{'}'}, {'{'}studio_pec{'}'}, {'{'}titolare_cf{'}'}, {'{'}titolare_piva{'}'}, {'{'}titolare_qualifica{'}'}
            </p>
            {/* Validazione: il campo deve contenere testo (anche se formattato) */}
            {!privacyTesto || privacyTesto.replace(/<[^>]*>/g, '').trim() === '' ? (
              <p className="mt-1 text-xs text-red-600">Il testo della privacy è obbligatorio</p>
            ) : null}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Salvataggio...' : 'Salva Testo Privacy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

