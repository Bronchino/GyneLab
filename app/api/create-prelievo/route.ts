import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'

/**
 * API route per creare un nuovo prelievo (esame)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin() // Solo admin può creare prelievi

    const { paziente_id, laboratorio_id, tipo_prelievo_id, data_prelievo, data_stimata_referto, rif_interno, descrizione, report_medico } =
      await request.json()

    // Validazione campi obbligatori
    if (!paziente_id || !laboratorio_id) {
      return NextResponse.json(
        { error: 'paziente_id e laboratorio_id sono obbligatori' },
        { status: 400 }
      )
    }

    // Se data_prelievo non è fornita, usa la data corrente (oggi)
    const dataPrelievoFinale = data_prelievo || new Date().toISOString().split('T')[0]

    const supabase = await createClient()

    // Trova lo stato "Eseguito" dalla tabella stati_prelievo
    let { data: statoEseguito, error: statoError } = await supabase
      .from('stati_prelievo')
      .select('id')
      .ilike('nome', 'eseguito')
      .single()

    // Se non trova "Eseguito", usa il primo stato disponibile (ordinato per ordine)
    if (statoError || !statoEseguito) {
      const { data: statoAlternativo } = await supabase
        .from('stati_prelievo')
        .select('id')
        .order('ordine', { ascending: true })
        .limit(1)
        .single()

      if (!statoAlternativo) {
        return NextResponse.json(
          { error: 'Nessuno stato prelievo trovato nel database' },
          { status: 500 }
        )
      }

      statoEseguito = statoAlternativo
    }

    const statoId = statoEseguito.id

    // Gestisci tipo_prelievo_id
    let tipoPrelievoIdFinale = tipo_prelievo_id

    if (!tipoPrelievoIdFinale) {
      // Cerca tipo "Generico"
      const { data: tipoGenerico } = await supabase
        .from('tipi_prelievo')
        .select('id')
        .ilike('nome', 'generico')
        .single()

      if (tipoGenerico) {
        tipoPrelievoIdFinale = tipoGenerico.id
      } else {
        // Se non trova "Generico", usa il primo tipo disponibile
        const { data: primoTipo } = await supabase
          .from('tipi_prelievo')
          .select('id')
          .eq('attivo', true)
          .order('nome', { ascending: true })
          .limit(1)
          .single()

        if (!primoTipo) {
          return NextResponse.json(
            { error: 'Nessun tipo prelievo disponibile nel database' },
            { status: 500 }
          )
        }

        tipoPrelievoIdFinale = primoTipo.id
      }
    }

    // Prepara i dati per l'inserimento
    const insertData: any = {
      paziente_id,
      laboratorio_id,
      tipo_prelievo_id: tipoPrelievoIdFinale,
      stato_id: statoId,
      data_prelievo: dataPrelievoFinale,
    }

    if (data_stimata_referto) {
      insertData.data_stimata_referto = data_stimata_referto
    }

    if (rif_interno) {
      insertData.rif_interno = rif_interno.trim()
    }

    if (descrizione) {
      insertData.descrizione = descrizione.trim()
    }

    if (report_medico) {
      insertData.report_medico = report_medico.trim()
    }

    // Inserisci il prelievo
    const { data: nuovoPrelievo, error: insertError } = await supabase
      .from('prelievi')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: `Errore nella creazione del prelievo: ${insertError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      prelievo: nuovoPrelievo,
      message: 'Prelievo creato con successo',
    })
  } catch (error: any) {
    console.error('Errore nella creazione del prelievo:', error)
    return NextResponse.json(
      {
        error: error.message || 'Errore durante la creazione del prelievo',
      },
      { status: 500 }
    )
  }
}
