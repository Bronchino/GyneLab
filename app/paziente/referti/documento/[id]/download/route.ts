import { createClient } from '@/lib/supabase/server'
import { requirePaziente } from '@/lib/auth/require-role'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await requirePaziente()
  
  const supabase = await createClient()
  const documentoId = params.id

  // Ottiene il paziente corrente
  const { data: currentPazienteId } = await supabase.rpc('current_paziente_id')
  
  if (!currentPazienteId) {
    return NextResponse.json({ error: 'Paziente non trovato' }, { status: 404 })
  }

  // Verifica che il documento appartenga al paziente e sia disponibile
  // RLS già protegge, ma facciamo un controllo aggiuntivo
  const { data: documento, error: documentoError } = await supabase
    .from('pazienti_documenti')
    .select('*')
    .eq('id', documentoId)
    .eq('paziente_id', currentPazienteId)
    .not('pubblicato_at', 'is', null)
    .single()

  if (documentoError || !documento) {
    return NextResponse.json({ error: 'Documento non trovato' }, { status: 404 })
  }

  // Verifica scadenza
  if (documento.scade_at) {
    const scadeAt = new Date(documento.scade_at)
    if (scadeAt <= new Date()) {
      return NextResponse.json({ error: 'Documento scaduto' }, { status: 403 })
    }
  }

  // Verifica che ci sia un S3 key
  if (!documento.s3_key) {
    return NextResponse.json({ error: 'File non disponibile' }, { status: 404 })
  }

  // STUB: Redirect a endpoint API che gestisce il download firmato
  // Simile al referto, serve un endpoint server-side che genera signed URL S3
  
  return NextResponse.redirect(
    `/api/download/documento/${documentoId}?s3_key=${encodeURIComponent(documento.s3_key)}`
  )
}

