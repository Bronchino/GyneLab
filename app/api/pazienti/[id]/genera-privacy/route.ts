import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  // Verifica autenticazione
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  // Verifica permessi (solo admin/staff)
  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  const pazienteId = params.id

  // Recupera dati paziente
  const { data: paziente, error: pazienteError } = await supabase
    .from('pazienti')
    .select('*')
    .eq('id', pazienteId)
    .single()

  if (pazienteError || !paziente) {
    return NextResponse.json({ error: 'Paziente non trovato' }, { status: 404 })
  }

  // Recupera testo privacy
  const { data: privacyTesto, error: privacyError } = await supabase
    .from('privacy_testo')
    .select('testo')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (privacyError || !privacyTesto) {
    return NextResponse.json({ error: 'Testo privacy non trovato' }, { status: 404 })
  }

  // Recupera dati studio
  const { data: studio, error: studioError } = await supabase
    .from('studio_impostazioni')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (studioError || !studio) {
    return NextResponse.json({ error: 'Impostazioni studio non trovate' }, { status: 404 })
  }

  // Sostituisce placeholder nel testo privacy
  let testoPrivacy = privacyTesto.testo

  // #region agent log
  const allPlaceholdersInText = testoPrivacy.match(/\{\{?[^}]+\}?\}/g) || []
  fetch('http://127.0.0.1:7243/ingest/7daa28b3-5a96-4a27-9829-ccaafb6fb3de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:61',message:'Testo privacy originale',data:{testoLength:testoPrivacy.length,testoPreview:testoPrivacy.substring(0,200),hasDoubleBraces:testoPrivacy.includes('{{'),hasSingleBraces:testoPrivacy.includes('{'),allPlaceholdersFound:allPlaceholdersInText.slice(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
  // #endregion

  // Placeholder paziente
  const dataNascitaFormatted = paziente.data_nascita 
    ? new Date(paziente.data_nascita).toLocaleDateString('it-IT')
    : ''
  const placeholderPaziente: Record<string, string> = {
    '{nome_paziente}': paziente.nome || '',
    '{paziente_nome}': paziente.nome || '', // Alias per compatibilità
    '{cognome_paziente}': paziente.cognome || '',
    '{paziente_cognome}': paziente.cognome || '', // Alias per compatibilità
    '{nome_cognome_paziente}': `${paziente.nome || ''} ${paziente.cognome || ''}`.trim(),
    '{codice_fiscale}': paziente.codice_fiscale || '',
    '{data_nascita}': dataNascitaFormatted,
    '{paziente_data_nascita}': dataNascitaFormatted, // Alias per compatibilità
    '{luogo_nascita}': paziente.luogo_nascita_comune 
      ? `${paziente.luogo_nascita_comune}${paziente.luogo_nascita_provincia ? ` (${paziente.luogo_nascita_provincia})` : ''}`
      : '',
    '{email}': paziente.email || '',
    '{cellulare}': paziente.cellulare || '',
  }

  // Placeholder studio
  const studioIndirizzoCompleto = [
    studio.studio_indirizzo,
    studio.studio_cap,
    studio.studio_comune,
    studio.studio_provincia
  ].filter(Boolean).join(' ')
  const studioCittaProvincia = [
    studio.studio_comune,
    studio.studio_provincia
  ].filter(Boolean).join(' ')
  
  // Recupera nome completo titolare dal profilo utente se disponibile
  let titolareNomeCompleto = ''
  if (studio.titolare_user_id) {
    const { data: profiloTitolare } = await supabase
      .from('profili_utenti')
      .select('nome, cognome')
      .eq('id', studio.titolare_user_id)
      .single()
    if (profiloTitolare) {
      titolareNomeCompleto = `${profiloTitolare.nome || ''} ${profiloTitolare.cognome || ''}`.trim()
    }
  }
  
  const dataFirma = new Date().toLocaleDateString('it-IT')
  
  const placeholderStudio: Record<string, string> = {
    '{studio_denominazione}': studio.studio_denominazione || '',
    '{studio_indirizzo}': studio.studio_indirizzo || '',
    '{studio_cap}': studio.studio_cap || '',
    '{studio_comune}': studio.studio_comune || '',
    '{studio_provincia}': studio.studio_provincia || '',
    '{studio_citta_provincia}': studioCittaProvincia,
    '{studio_indirizzo_completo}': studioIndirizzoCompleto,
    '{studio_telefono}': studio.studio_telefono || '',
    '{studio_email}': studio.studio_email || '',
    '{studio_pec}': studio.studio_pec || '',
    '{studio_portale_referti_url}': studio.studio_portale_referti_url || '',
    '{portale_referti_url}': studio.studio_portale_referti_url || '', // Alias per compatibilità
    '{titolare_cf}': studio.titolare_cf || '',
    '{titolare_piva}': studio.titolare_piva || '',
    '{titolare_qualifica}': studio.titolare_qualifica || '',
    '{titolare_nome_completo}': titolareNomeCompleto || studio.titolare_qualifica || '',
    '{data_firma}': dataFirma,
  }

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/7daa28b3-5a96-4a27-9829-ccaafb6fb3de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:101',message:'Prima sostituzione - placeholder paziente',data:{placeholderCount:Object.keys(placeholderPaziente).length,placeholderKeys:Object.keys(placeholderPaziente),testoBefore:testoPrivacy.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // Sostituisce tutti i placeholder (supporta sia {} che {{}})
  // Prima sostituisce i placeholder con doppie graffe, poi quelli con graffe singole
  const allPlaceholders = { ...placeholderPaziente, ...placeholderStudio }
  
  Object.entries(allPlaceholders).forEach(([key, value]) => {
    // Estrae il nome del placeholder senza graffe
    const placeholderName = key.replace(/[{}]/g, '')
    
    // Sostituisce {{placeholder}} (doppie graffe) - priorità alta
    const doubleBracePattern = new RegExp(`\\{\\{${placeholderName}\\}\\}`, 'g')
    testoPrivacy = testoPrivacy.replace(doubleBracePattern, value)
    
    // Sostituisce {placeholder} (graffe singole)
    const singleBracePattern = new RegExp(`\\{${placeholderName}\\}`, 'g')
    testoPrivacy = testoPrivacy.replace(singleBracePattern, value)
  })
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/7daa28b3-5a96-4a27-9829-ccaafb6fb3de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:130',message:'Dopo sostituzione tutti placeholder',data:{testoAfter:testoPrivacy.substring(0,500),remainingPlaceholders:testoPrivacy.match(/\{\{?[^}]+\}?\}/g)||[],remainingCount:testoPrivacy.match(/\{\{?[^}]+\}?\}/g)?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/7daa28b3-5a96-4a27-9829-ccaafb6fb3de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:115',message:'Dopo sostituzione placeholder studio',data:{testoAfter:testoPrivacy.substring(0,300),remainingPlaceholders:testoPrivacy.match(/\{\{?[^}]+\}?\}/g)||[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  // Flagga il checkbox "Acconsente all'utilizzo del servizio di invio dei referti On-Line"
  // Sostituisce ☐ con ☑ o aggiunge checked se è un input
  testoPrivacy = testoPrivacy.replace(
    /☐\s*Acconsente all'utilizzo del servizio di invio dei referti On-Line/gi,
    '☑ Acconsente all\'utilizzo del servizio di invio dei referti On-Line'
  )
  testoPrivacy = testoPrivacy.replace(
    /<input\s+type=["']checkbox["']\s*(?:[^>]*\s+)?id=["'][^"']*referti[^"']*["']\s*(?:[^>]*)?>/gi,
    '<input type="checkbox" checked id="referti-online">'
  )
  // Se c'è un checkbox non ancora flaggato vicino al testo
  testoPrivacy = testoPrivacy.replace(
    /(<input\s+type=["']checkbox["'][^>]*>)\s*Acconsente all'utilizzo del servizio di invio dei referti On-Line/gi,
    '<input type="checkbox" checked> Acconsente all\'utilizzo del servizio di invio dei referti On-Line'
  )

  // Estrae font-size e line-height dal testo HTML se presenti come attributi style inline
  // Cerca pattern come style="font-size: 14px; line-height: 1.6;"
  let extractedFontSize = '14px'
  let extractedLineHeight = '1.6'
  
  const fontSizeMatch = testoPrivacy.match(/font-size:\s*(\d+(?:\.\d+)?)px/i)
  if (fontSizeMatch) {
    extractedFontSize = `${fontSizeMatch[1]}px`
  }
  
  const lineHeightMatch = testoPrivacy.match(/line-height:\s*(\d+(?:\.\d+)?)/i)
  if (lineHeightMatch) {
    extractedLineHeight = lineHeightMatch[1]
  }

  // Genera HTML completo per il PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          font-size: ${extractedFontSize};
          line-height: ${extractedLineHeight};
          color: #333;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 20px;
          text-align: center;
        }
        .content {
          margin-top: 30px;
          font-size: ${extractedFontSize};
          line-height: ${extractedLineHeight};
        }
        .content p,
        .content div,
        .content span {
          font-size: ${extractedFontSize};
          line-height: ${extractedLineHeight};
        }
        .checkbox-section {
          margin-top: 20px;
          padding: 15px;
          border: 1px solid #ddd;
          background-color: #f9f9f9;
        }
        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          margin-right: 8px;
          vertical-align: middle;
        }
      </style>
    </head>
    <body>
      <h1>Informativa sulla Privacy</h1>
      <div class="content">
        ${testoPrivacy}
      </div>
    </body>
    </html>
  `

  try {
    // Genera PDF con puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    })
    await browser.close()

    // Aggiorna database: traccia che la privacy è stata acquisita
    const { error: updateError } = await supabase
      .from('pazienti')
      .update({
        privacy_firmata: true,
        privacy_firmata_il: new Date().toISOString(),
        privacy_acquisita_da: user.id
      })
      .eq('id', pazienteId)

    if (updateError) {
      console.error('Errore aggiornamento privacy:', updateError)
      // Non blocchiamo la generazione del PDF se l'update fallisce
    }

    // Restituisce il PDF
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="privacy_${paziente.cognome}_${paziente.nome}_${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Errore generazione PDF:', error)
    return NextResponse.json(
      { error: 'Errore durante la generazione del PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

