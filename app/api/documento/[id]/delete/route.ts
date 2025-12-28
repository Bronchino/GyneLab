import { createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE documento paziente
 * Solo admin/staff può eliminare documenti
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verifica permessi: solo admin/staff
  await requireStaff()

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY non configurata' },
      { status: 500 }
    )
  }

  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()
  const documentoId = params.id

  // Recupera il documento per ottenere s3_key
  const { data: documento, error: documentoError } = await supabase
    .from('pazienti_documenti')
    .select('s3_key')
    .eq('id', documentoId)
    .single()

  if (documentoError || !documento) {
    return NextResponse.json(
      { error: 'Documento non trovato' },
      { status: 404 }
    )
  }

  // Elimina file da Supabase Storage se presente
  if (documento.s3_key) {
    try {
      const { error: storageError } = await supabaseAdmin.storage
        .from('documenti')
        .remove([documento.s3_key])

      if (storageError) {
        console.error('Errore eliminazione file Storage:', storageError)
        // Non blocchiamo l'operazione se il file non esiste più
        // ma loggiamo l'errore
      }
    } catch (error) {
      console.error('Errore durante eliminazione file Storage:', error)
      // Continuiamo comunque con l'eliminazione del record
    }
  }

  // Elimina record da pazienti_documenti
  const { error: deleteError } = await supabase
    .from('pazienti_documenti')
    .delete()
    .eq('id', documentoId)

  if (deleteError) {
    console.error('Errore eliminazione documento:', deleteError)
    return NextResponse.json(
      { error: 'Errore durante l\'eliminazione del documento' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}

