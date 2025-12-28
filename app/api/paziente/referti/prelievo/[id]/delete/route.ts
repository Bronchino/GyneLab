import { createClient } from '@/lib/supabase/server'
import { requirePaziente } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE referto paziente
 * Permette ai pazienti di eliminare i propri referti pubblicati
 * La verifica dei permessi è gestita lato server (policy RLS verrà aggiunta dopo)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verifica che l'utente sia un paziente
  await requirePaziente()
  
  const supabase = await createClient()
  const prelievoId = params.id

  // Ottiene l'ID del paziente corrente
  const { data: currentPazienteId } = await supabase.rpc('current_paziente_id')
  
  if (!currentPazienteId) {
    return NextResponse.json(
      { error: 'Paziente non trovato' },
      { status: 404 }
    )
  }

  // Verifica che il prelievo appartenga al paziente corrente e che il referto sia pubblicato
  const { data: prelievo, error: prelievoError } = await supabase
    .from('prelievi')
    .select('*')
    .eq('id', prelievoId)
    .eq('paziente_id', currentPazienteId)
    .not('referto_pubblicato_at', 'is', null)
    .single()

  if (prelievoError || !prelievo) {
    return NextResponse.json(
      { error: 'Referto non trovato o non autorizzato' },
      { status: 404 }
    )
  }

  // Verifica che il referto non sia scaduto (opzionale, ma meglio controllare)
  if (prelievo.referto_scade_at) {
    const scadeAt = new Date(prelievo.referto_scade_at)
    if (scadeAt <= new Date()) {
      return NextResponse.json(
        { error: 'Referto scaduto' },
        { status: 403 }
      )
    }
  }

  // Elimina file da Supabase Storage se presente
  if (prelievo.esito_pdf_s3_key) {
    try {
      // Usa admin client per eliminare il file (bypassa RLS Storage)
      const supabaseAdmin = createAdminClient()
      const { error: storageError } = await supabaseAdmin.storage
        .from('referti')
        .remove([prelievo.esito_pdf_s3_key])

      if (storageError) {
        console.error('Errore eliminazione file Storage:', storageError)
        // Non blocchiamo l'operazione se il file non esiste più
        // ma loggiamo l'errore
      }
    } catch (error) {
      console.error('Errore durante eliminazione file Storage:', error)
      // Continuiamo comunque con l'aggiornamento del record
    }
  }

  // Aggiorna record prelievi: rimuove i campi del referto ma mantiene il prelievo
  const { error: updateError } = await supabase
    .from('prelievi')
    .update({
      esito_pdf_s3_key: null,
      esito_pdf_mime: null,
      esito_pdf_size_bytes: null,
      esito_pdf_uploaded_at: null,
      esito_pdf_uploaded_by: null,
      referto_pubblicato_at: null,
      referto_scade_at: null,
    })
    .eq('id', prelievoId)

  if (updateError) {
    console.error('Errore aggiornamento prelievo:', updateError)
    return NextResponse.json(
      { error: 'Errore durante l\'eliminazione del referto' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}

