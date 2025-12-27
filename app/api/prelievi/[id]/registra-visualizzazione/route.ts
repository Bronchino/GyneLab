import { NextRequest, NextResponse } from 'next/server'
import { requirePaziente } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'

/**
 * POST registra visualizzazione referto da parte del paziente
 * Aggiorna stato prelievo a "Visionato" se corrente è "Refertato"
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePaziente()

    const supabase = await createClient()
    const prelievoId = params.id

    // Ottiene il paziente corrente
    const { data: currentPazienteId } = await supabase.rpc('current_paziente_id')

    if (!currentPazienteId) {
      return NextResponse.json(
        { error: 'Paziente non trovato' },
        { status: 404 }
      )
    }

    // Verifica che il prelievo appartenga al paziente e che il referto sia disponibile
    const { data: prelievo, error: prelievoError } = await supabase
      .from('prelievi')
      .select('id, stato_id, referto_pubblicato_at, referto_scade_at, referto_visionato_at')
      .eq('id', prelievoId)
      .eq('paziente_id', currentPazienteId)
      .not('referto_pubblicato_at', 'is', null)
      .single()

    if (prelievoError || !prelievo) {
      return NextResponse.json(
        { error: 'Referto non trovato' },
        { status: 404 }
      )
    }

    // Verifica scadenza
    if (prelievo.referto_scade_at) {
      const scadeAt = new Date(prelievo.referto_scade_at)
      if (scadeAt <= new Date()) {
        return NextResponse.json(
          { error: 'Referto scaduto' },
          { status: 403 }
        )
      }
    }

    // Se già visualizzato, non fare nulla (idempotente)
    if (prelievo.referto_visionato_at) {
      return NextResponse.json({
        success: true,
        message: 'Visualizzazione già registrata',
      })
    }

    // Trova lo stato corrente per verificare se è "Refertato"
    const { data: statoCorrente, error: statoCorrenteError } = await supabase
      .from('stati_prelievo')
      .select('nome')
      .eq('id', prelievo.stato_id)
      .single()

    if (statoCorrenteError || !statoCorrente) {
      return NextResponse.json(
        { error: 'Stato prelievo non trovato' },
        { status: 500 }
      )
    }

    const nomeStatoCorrente = statoCorrente.nome.toLowerCase()

    // Aggiorna solo se lo stato corrente è "Refertato" (non "Visionato" o "Scaricato")
    if (nomeStatoCorrente === 'refertato') {
      // Trova lo stato "Visionato"
      const { data: statoVisionato, error: statoVisionatoError } = await supabase
        .from('stati_prelievo')
        .select('id')
        .ilike('nome', 'visionato')
        .single()

      if (statoVisionatoError || !statoVisionato) {
        // Se lo stato "Visionato" non esiste, registra solo il timestamp
        await supabase
          .from('prelievi')
          .update({
            referto_visionato_at: new Date().toISOString(),
          })
          .eq('id', prelievoId)
      } else {
        // Aggiorna stato a "Visionato" e registra timestamp
        await supabase
          .from('prelievi')
          .update({
            stato_id: statoVisionato.id,
            referto_visionato_at: new Date().toISOString(),
          })
          .eq('id', prelievoId)
      }
    } else {
      // Se già in stato diverso da "Refertato", registra solo il timestamp (se non già presente)
      await supabase
        .from('prelievi')
        .update({
          referto_visionato_at: new Date().toISOString(),
        })
        .eq('id', prelievoId)
        .is('referto_visionato_at', null) // Solo se non già presente
    }

    return NextResponse.json({
      success: true,
      message: 'Visualizzazione registrata',
    })
  } catch (error) {
    console.error('Errore registrazione visualizzazione:', error)
    return NextResponse.json(
      { error: 'Errore durante la registrazione della visualizzazione' },
      { status: 500 }
    )
  }
}

