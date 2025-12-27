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
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  const password = searchParams.get('password')

  // Recupera dati paziente
  const { data: paziente, error: pazienteError } = await supabase
    .from('pazienti')
    .select('*')
    .eq('id', pazienteId)
    .single()

  if (pazienteError || !paziente) {
    return NextResponse.json({ error: 'Paziente non trovato' }, { status: 404 })
  }

  // Verifica che il paziente abbia credenziali
  if (!paziente.auth_user_id) {
    return NextResponse.json(
      { error: 'Il paziente non ha credenziali generate' },
      { status: 400 }
    )
  }

  // Usa username e password passati come parametri, altrimenti recupera username dal DB
  const finalUsername =
    username ||
    (paziente.codice_fiscale
      ? paziente.codice_fiscale.toUpperCase()
      : `paziente_${pazienteId}`)
  const finalPassword = password || '[Password non disponibile]'

  // Recupera dati studio per logo/intestazione
  const { data: studioRaw, error: studioError } = await supabase
    .from('studio_impostazioni')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  const studio = studioRaw || {
    studio_nome: 'Studio Medico',
    studio_indirizzo: '',
    studio_telefono: '',
    studio_email: '',
  }

  // Genera HTML per il PDF (ottimizzato per una singola pagina)
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          padding: 15mm 10mm;
          font-size: 10px;
          line-height: 1.4;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 8mm;
          border-bottom: 1px solid #333;
          padding-bottom: 5mm;
        }
        .header h1 {
          font-size: 16px;
          margin: 0 0 2mm 0;
          color: #333;
        }
        .header p {
          margin: 1mm 0;
          font-size: 9px;
          color: #666;
        }
        .content {
          margin-top: 5mm;
        }
        .title {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 4mm;
        }
        .saluto {
          text-align: center;
          font-size: 10px;
          margin-bottom: 6mm;
        }
        .credentials-box {
          background-color: #f9f9f9;
          border: 1.5px solid #333;
          border-radius: 4px;
          padding: 8mm;
          margin: 6mm 0;
          text-align: center;
        }
        .credentials-box h2 {
          font-size: 12px;
          margin: 0 0 5mm 0;
          color: #333;
        }
        .credential-item {
          margin: 4mm 0;
          font-size: 10px;
        }
        .credential-label {
          font-weight: bold;
          color: #555;
          margin-bottom: 2mm;
          font-size: 10px;
        }
        .credential-value {
          font-size: 16px;
          font-weight: bold;
          color: #000;
          letter-spacing: 1px;
          font-family: 'Courier New', monospace;
          background-color: #fff;
          padding: 4mm;
          border: 1px solid #ddd;
          border-radius: 3px;
          display: inline-block;
          min-width: 150px;
        }
        .instructions {
          margin-top: 5mm;
          padding: 5mm;
          background-color: #e8f4f8;
          border-left: 3px solid #0066cc;
          border-radius: 3px;
          font-size: 9px;
        }
        .instructions h3 {
          margin: 0 0 3mm 0;
          color: #0066cc;
          font-size: 11px;
        }
        .instructions ol {
          margin: 2mm 0;
          padding-left: 15px;
        }
        .instructions li {
          margin: 2mm 0;
        }
        .warning {
          margin-top: 5mm;
          padding: 4mm;
          background-color: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 3px;
          font-size: 9px;
        }
        .footer {
          margin-top: 6mm;
          padding-top: 3mm;
          border-top: 1px solid #ddd;
          font-size: 8px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${studio.studio_nome || 'Studio Medico'}</h1>
        ${studio.studio_indirizzo ? `<p>${studio.studio_indirizzo}</p>` : ''}
        ${studio.studio_telefono ? `<p>Tel: ${studio.studio_telefono}</p>` : ''}
        ${studio.studio_email ? `<p>Email: ${studio.studio_email}</p>` : ''}
      </div>

      <div class="content">
        <div class="title">Credenziali di Accesso Area Pazienti</div>
        
        <div class="saluto">
          Gentile ${paziente.nome} ${paziente.cognome},<br>
          di seguito trovi le tue credenziali per accedere all'area riservata.
        </div>

        <div class="credentials-box">
          <h2>Le Tue Credenziali</h2>
          <div class="credential-item">
            <div class="credential-label">Username:</div>
            <div class="credential-value">${finalUsername}</div>
          </div>
          <div class="credential-item">
            <div class="credential-label">Password:</div>
            <div class="credential-value">${finalPassword}</div>
          </div>
        </div>

        <div class="instructions">
          <h3>Come accedere:</h3>
          <ol>
            <li>Vai alla pagina di login del portale</li>
            <li>Inserisci il tuo <strong>Username</strong> (codice fiscale) nel campo "Username"</li>
            <li>Inserisci la tua <strong>Password</strong> nel campo "Password"</li>
            <li>Clicca su "Accedi"</li>
          </ol>
        </div>

        <div class="warning">
          <strong>⚠️ Importante:</strong> Conserva questo documento in un luogo sicuro. 
          Se perdi la password, contatta lo studio per rigenerarla.
        </div>
      </div>

      <div class="footer">
        <p>Documento generato il ${new Date().toLocaleDateString('it-IT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })} - Informazioni riservate</p>
      </div>
    </body>
    </html>
  `

  try {
    // Genera PDF con puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
    })
    await browser.close()

    // Restituisce il PDF sempre come inline per permettere visualizzazione in iframe
    // Il browser gestirà automaticamente la visualizzazione
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="credenziali_${paziente.cognome}_${paziente.nome}_${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Errore generazione PDF:', error)
    return NextResponse.json(
      {
        error: 'Errore durante la generazione del PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

