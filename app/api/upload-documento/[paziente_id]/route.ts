import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf']

/**
 * POST upload documento paziente
 * Solo admin/staff può caricare documenti
 * Il paziente NON può caricare documenti - questa funzionalità è riservata al medico
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { paziente_id: string } }
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

    const pazienteId = params.paziente_id
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    // Verifica che il paziente esista
    const { data: paziente, error: pazienteError } = await supabase
      .from('pazienti')
      .select('id')
      .eq('id', pazienteId)
      .single()

    if (pazienteError || !paziente) {
      return NextResponse.json(
        { error: 'Paziente non trovato' },
        { status: 404 }
      )
    }

    // Recupera i dati del form (multipart/form-data)
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const titolo = formData.get('titolo') as string | null
    const descrizione = formData.get('descrizione') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'File mancante' },
        { status: 400 }
      )
    }

    if (!titolo || titolo.trim() === '') {
      return NextResponse.json(
        { error: 'Titolo obbligatorio' },
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

    // Genera path per Storage: {paziente_id}/{timestamp}-{filename}
    const timestamp = Date.now()
    const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_') // Sanitizza nome file
    const storagePath = `${pazienteId}/${timestamp}-${filename}`

    // Upload file a Supabase Storage (bucket `documenti`)
    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documenti')
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

    // Calcola scadenza (45 giorni dopo pubblicazione)
    const pubblicatoAt = new Date()
    const scadeAt = new Date(pubblicatoAt)
    scadeAt.setDate(scadeAt.getDate() + 45)

    // Recupera user_id corrente da profili_utenti
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Utente non autenticato' },
        { status: 401 }
      )
    }

    // Inserisci record in pazienti_documenti
    const { data: documento, error: insertError } = await supabase
      .from('pazienti_documenti')
      .insert({
        paziente_id: pazienteId,
        titolo: titolo.trim(),
        descrizione: descrizione?.trim() || null,
        s3_key: storagePath,
        mime: 'application/pdf',
        size_bytes: file.size,
        uploaded_by: user.id,
        pubblicato_at: pubblicatoAt.toISOString(),
        scade_at: scadeAt.toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Errore inserimento documento:', insertError)
      // Se l'inserimento fallisce, elimina il file caricato
      await supabaseAdmin.storage.from('documenti').remove([storagePath])
      return NextResponse.json(
        { error: `Errore durante il salvataggio del documento: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      documento,
    })
  } catch (error) {
    console.error('Errore upload documento:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'upload del documento' },
      { status: 500 }
    )
  }
}

