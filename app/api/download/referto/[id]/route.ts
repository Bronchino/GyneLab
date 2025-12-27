import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET download referto con signed URL S3
 * Genera signed URL temporaneo e aggiorna stato prelievo a "Scaricato"
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY non configurata' },
        { status: 500 }
      )
    }

    const prelievoId = params.id
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    // Carica il prelievo per ottenere s3_key e verificare permessi
    const { data: prelievo, error: prelievoError } = await supabase
      .from('prelievi')
      .select('id, esito_pdf_s3_key, stato_id, referto_pubblicato_at, referto_scade_at')
      .eq('id', prelievoId)
      .single()

    if (prelievoError || !prelievo) {
      return NextResponse.json(
        { error: 'Prelievo non trovato' },
        { status: 404 }
      )
    }

    // Verifica che ci sia un referto caricato
    if (!prelievo.esito_pdf_s3_key) {
      return NextResponse.json(
        { error: 'Referto non disponibile' },
        { status: 404 }
      )
    }

    // Verifica che il referto sia pubblicato e non scaduto (per pazienti)
    if (prelievo.referto_scade_at) {
      const scadeAt = new Date(prelievo.referto_scade_at)
      if (scadeAt <= new Date()) {
        return NextResponse.json(
          { error: 'Referto scaduto' },
          { status: 403 }
        )
      }
    }

    // Genera signed URL da Supabase Storage (valido per 1 ora)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('referti')
      .createSignedUrl(prelievo.esito_pdf_s3_key, 3600)

    if (signedUrlError || !signedUrlData) {
      console.error('Errore generazione signed URL:', signedUrlError)
      return NextResponse.json(
        { error: 'Errore durante la generazione del link di download' },
        { status: 500 }
      )
    }

    // Trova lo stato "Scaricato" dalla tabella stati_prelievo
    const { data: statoScaricato, error: statoError } = await supabase
      .from('stati_prelievo')
      .select('id')
      .ilike('nome', 'scaricato')
      .single()

    // Aggiorna stato a "Scaricato" se lo stato corrente è "Refertato" o "Visionato"
    // Non fallisce se lo stato non esiste o se già è "Scaricato"
    if (!statoError && statoScaricato) {
      // Verifica se lo stato corrente è "Refertato" o "Visionato" prima di aggiornare
      const { data: statoCorrente } = await supabase
        .from('stati_prelievo')
        .select('nome')
        .eq('id', prelievo.stato_id)
        .single()

      if (statoCorrente) {
        const nomeStatoCorrente = statoCorrente.nome.toLowerCase()
        if (nomeStatoCorrente === 'refertato' || nomeStatoCorrente === 'visionato') {
          // Aggiorna stato a "Scaricato"
          await supabase
            .from('prelievi')
            .update({
              stato_id: statoScaricato.id,
              referto_ultimo_download_at: new Date().toISOString(),
            })
            .eq('id', prelievoId)
        }
      }
    }

    // Redirect al signed URL
    return NextResponse.redirect(signedUrlData.signedUrl)
  } catch (error) {
    console.error('Errore download referto:', error)
    return NextResponse.json(
      { error: 'Errore durante il download del referto' },
      { status: 500 }
    )
  }
}

