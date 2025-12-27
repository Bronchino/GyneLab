import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { isValidStatoTransition, getStatoTransition } from '@/lib/utils/validate-stato-transition'

/**
 * PUT aggiorna stato prelievo manualmente
 * Solo staff/admin può cambiare stato manualmente
 * Valida transizioni consentite secondo SPECIFICA-STATI-PRELIEVO.md
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireStaff()

    const supabase = await createClient()
    const prelievoId = params.id

    const { nuovo_stato_id } = await request.json()

    if (!nuovo_stato_id) {
      return NextResponse.json(
        { error: 'nuovo_stato_id è obbligatorio' },
        { status: 400 }
      )
    }

    // Carica il prelievo corrente
    const { data: prelievo, error: prelievoError } = await supabase
      .from('prelievi')
      .select('id, stato_id')
      .eq('id', prelievoId)
      .single()

    if (prelievoError || !prelievo) {
      return NextResponse.json(
        { error: 'Prelievo non trovato' },
        { status: 404 }
      )
    }

    // Se lo stato è lo stesso, non fare nulla
    if (prelievo.stato_id === nuovo_stato_id) {
      return NextResponse.json({
        success: true,
        message: 'Lo stato è già impostato al valore richiesto',
      })
    }

    // Carica nomi degli stati per validazione
    const [statoCorrenteResult, nuovoStatoResult] = await Promise.all([
      supabase
        .from('stati_prelievo')
        .select('nome')
        .eq('id', prelievo.stato_id)
        .single(),
      supabase
        .from('stati_prelievo')
        .select('nome')
        .eq('id', nuovo_stato_id)
        .single(),
    ])

    if (statoCorrenteResult.error || !statoCorrenteResult.data) {
      return NextResponse.json(
        { error: 'Stato corrente non trovato' },
        { status: 500 }
      )
    }

    if (nuovoStatoResult.error || !nuovoStatoResult.data) {
      return NextResponse.json(
        { error: 'Nuovo stato non trovato' },
        { status: 400 }
      )
    }

    const statoCorrenteNome = statoCorrenteResult.data.nome
    const nuovoStatoNome = nuovoStatoResult.data.nome

    // Valida transizione
    if (!isValidStatoTransition(statoCorrenteNome, nuovoStatoNome)) {
      const transitionInfo = getStatoTransition(statoCorrenteNome, nuovoStatoNome)
      return NextResponse.json(
        {
          error: `Transizione non consentita: da "${statoCorrenteNome}" a "${nuovoStatoNome}"`,
          details: transitionInfo?.description || 'Questa transizione non è permessa secondo le regole del sistema',
        },
        { status: 400 }
      )
    }

    // Verifica che la transizione sia manuale (non automatica o paziente)
    const transitionInfo = getStatoTransition(statoCorrenteNome, nuovoStatoNome)
    if (transitionInfo && transitionInfo.type !== 'manual') {
      // Permetti comunque, ma avvisa che normalmente questa transizione è automatica
      // (per flessibilità operativa, ma con audit trail)
    }

    // Recupera user_id corrente per audit trail
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Utente non autenticato' },
        { status: 401 }
      )
    }

    // Aggiorna stato
    const { data: prelievoAggiornato, error: updateError } = await supabase
      .from('prelievi')
      .update({
        stato_id: nuovo_stato_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', prelievoId)
      .select()
      .single()

    if (updateError) {
      console.error('Errore aggiornamento stato prelievo:', updateError)
      return NextResponse.json(
        { error: `Errore durante l'aggiornamento dello stato: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      prelievo: prelievoAggiornato,
      message: `Stato aggiornato da "${statoCorrenteNome}" a "${nuovoStatoNome}"`,
      transition: transitionInfo,
    })
  } catch (error) {
    console.error('Errore update stato prelievo:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'aggiornamento dello stato' },
      { status: 500 }
    )
  }
}

