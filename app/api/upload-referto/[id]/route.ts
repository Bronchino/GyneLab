import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf']

/**
 * POST upload referto PDF per prelievo
 * Solo admin/staff può caricare referti
 * Aggiorna automaticamente lo stato del prelievo a "Refertato"
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica permessi: SOLO admin/staff
    await requireStaff()

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY non configurata' },
        { status: 500 }
      )
    }

    const prelievoId = params.id
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    // Verifica che il prelievo esista
    const { data: prelievo, error: prelievoError } = await supabase
      .from('prelievi')
      .select('id, paziente_id')
      .eq('id', prelievoId)
      .single()

    if (prelievoError || !prelievo) {
      return NextResponse.json(
        { error: 'Prelievo non trovato' },
        { status: 404 }
      )
    }

    // Recupera i dati del form (multipart/form-data)
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'File mancante' },
        { status: 400 }
      )
    }

    // Valida tipo file
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Solo file PDF sono consentiti' },
        { status: 400 }
      )
    }

    // Valida dimensione file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File troppo grande. Dimensione massima: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Genera path per Storage: referti/{prelievo_id}/{timestamp}-{filename}
    const timestamp = Date.now()
    const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_') // Sanitizza nome file
    const storagePath = `${prelievoId}/${timestamp}-${filename}`

    // Se esiste già un referto, elimina il vecchio file prima di caricare il nuovo
    const { data: prelievoConReferto } = await supabase
      .from('prelievi')
      .select('esito_pdf_s3_key')
      .eq('id', prelievoId)
      .single()

    if (prelievoConReferto?.esito_pdf_s3_key) {
      // Elimina il vecchio file (ignora errori se non esiste)
      await supabaseAdmin.storage.from('referti').remove([prelievoConReferto.esito_pdf_s3_key])
    }

    // Upload file a Supabase Storage (bucket `referti`)
    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('referti')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('Errore upload Storage:', uploadError)
      return NextResponse.json(
        { error: `Errore durante l'upload del file: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Recupera user_id corrente
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Se upload riuscito ma errore auth, elimina file caricato
      await supabaseAdmin.storage.from('referti').remove([storagePath])
      return NextResponse.json(
        { error: 'Utente non autenticato' },
        { status: 401 }
      )
    }

    // Calcola scadenza (45 giorni dopo pubblicazione)
    const pubblicatoAt = new Date()
    const scadeAt = new Date(pubblicatoAt)
    scadeAt.setDate(scadeAt.getDate() + 45)

    // Trova lo stato "Refertato" dalla tabella stati_prelievo
    const { data: statoRefertato, error: statoError } = await supabase
      .from('stati_prelievo')
      .select('id')
      .ilike('nome', 'refertato')
      .single()

    if (statoError || !statoRefertato) {
      console.error('Errore ricerca stato Refertato:', statoError)
      // Se non trova lo stato, elimina il file caricato
      await supabaseAdmin.storage.from('referti').remove([storagePath])
      return NextResponse.json(
        { error: 'Stato "Refertato" non trovato nel database' },
        { status: 500 }
      )
    }

    // Aggiorna prelievo con dati referto e cambia stato a "Refertato"
    const { data: prelievoAggiornato, error: updateError } = await supabase
      .from('prelievi')
      .update({
        esito_pdf_s3_key: storagePath,
        esito_pdf_mime: 'application/pdf',
        esito_pdf_size_bytes: file.size,
        esito_pdf_uploaded_at: pubblicatoAt.toISOString(),
        esito_pdf_uploaded_by: user.id,
        referto_pubblicato_at: pubblicatoAt.toISOString(),
        referto_scade_at: scadeAt.toISOString(),
        stato_id: statoRefertato.id, // Cambia stato a "Refertato"
      })
      .eq('id', prelievoId)
      .select()
      .single()

    if (updateError) {
      console.error('Errore aggiornamento prelievo:', updateError)
      // Se l'aggiornamento fallisce, elimina il file caricato
      await supabaseAdmin.storage.from('referti').remove([storagePath])
      return NextResponse.json(
        { error: `Errore durante il salvataggio del referto: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      prelievo: prelievoAggiornato,
      message: 'Referto caricato con successo',
    })
  } catch (error) {
    console.error('Errore upload referto:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'upload del referto' },
      { status: 500 }
    )
  }
}

