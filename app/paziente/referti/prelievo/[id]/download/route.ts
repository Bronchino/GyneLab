import { createClient } from '@/lib/supabase/server'
import { requirePaziente } from '@/lib/auth/require-role'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await requirePaziente()
  
  const supabase = await createClient()
  const prelievoId = params.id

  // Ottiene il paziente corrente
  const { data: currentPazienteId } = await supabase.rpc('current_paziente_id')
  
  if (!currentPazienteId) {
    return NextResponse.json({ error: 'Paziente non trovato' }, { status: 404 })
  }

  // Verifica che il prelievo appartenga al paziente e che il referto sia disponibile
  // RLS già protegge, ma facciamo un controllo aggiuntivo
  const { data: prelievo, error: prelievoError } = await supabase
    .from('prelievi')
    .select('*')
    .eq('id', prelievoId)
    .eq('paziente_id', currentPazienteId)
    .not('referto_pubblicato_at', 'is', null)
    .single()

  if (prelievoError || !prelievo) {
    return NextResponse.json({ error: 'Referto non trovato' }, { status: 404 })
  }

  // Verifica scadenza
  if (prelievo.referto_scade_at) {
    const scadeAt = new Date(prelievo.referto_scade_at)
    if (scadeAt <= new Date()) {
      return NextResponse.json({ error: 'Referto scaduto' }, { status: 403 })
    }
  }

  // Verifica che ci sia un S3 key
  if (!prelievo.esito_pdf_s3_key) {
    return NextResponse.json({ error: 'File non disponibile' }, { status: 404 })
  }

  // Log del download usando la funzione RLS
  // La RLS permette l'insert se is_staff() OR (paziente del prelievo AND referto pubblicato e non scaduto)
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
  const userAgent = request.headers.get('user-agent') || null

  await supabase
    .from('referti_download_logs')
    .insert({
      prelievo_id: prelievoId,
      user_id: (await supabase.auth.getUser()).data.user?.id || null,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

  // Genera URL firmato per S3 (STUB - da implementare con service role)
  // NOTA: Per generare URL firmati S3 serve:
  // 1. Service role key (non anon key)
  // 2. Endpoint API server-side che genera il signed URL
  // 3. Oppure usare storage.from('bucket').createSignedUrl() se Supabase Storage
  
  // STUB: Redirect a un endpoint API che gestisce il download firmato
  // In produzione, questo dovrebbe essere un server action o API route che:
  // - Usa service role per accedere a Supabase Storage
  // - Genera signed URL temporaneo (es. 1 ora)
  // - Redirecta al signed URL
  
  // Costruisci URL assoluto per il redirect (richiesto da Next.js)
  const baseUrl = request.nextUrl.origin
  const downloadUrl = new URL(`/api/download/referto/${prelievoId}`, baseUrl)
  
  return NextResponse.redirect(downloadUrl)
}

