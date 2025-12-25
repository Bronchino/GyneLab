import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { codice_fiscale } = await request.json()

    // Validazione input
    if (!codice_fiscale || typeof codice_fiscale !== 'string') {
      return NextResponse.json(
        { error: 'Codice fiscale non valido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const cfNormalizzato = codice_fiscale.trim().toUpperCase()

    // Chiama la funzione RPC parse_codice_fiscale per estrarre i dati base
    const { data: parseResult, error: parseError } = await supabase.rpc('parse_codice_fiscale', {
      p_cf: cfNormalizzato
    })

    if (parseError) {
      return NextResponse.json(
        { error: parseError.message },
        { status: 400 }
      )
    }

    if (!parseResult || parseResult.length === 0) {
      return NextResponse.json(
        { error: 'Impossibile parsare il codice fiscale' },
        { status: 400 }
      )
    }

    const parsed = parseResult[0]
    const luogoNascitaCodice = parsed.luogo_nascita_codice

    // Inizializza le variabili di risposta
    let luogoNascitaComune: string | null = null
    let luogoNascitaProvincia: string | null = null

    // Cerca sempre nella tabella codici_catastali per ottenere comune e provincia
    // Funziona per tutti i codici, sia italiani che estero (Z)
    if (luogoNascitaCodice) {
      const { data: codiceCatastale, error: codiceError } = await supabase
        .from('codici_catastali')
        .select('*')
        .eq('codice', luogoNascitaCodice)
        .maybeSingle()

      if (codiceCatastale && !codiceError) {
        luogoNascitaComune = codiceCatastale.luogo_nascita
        luogoNascitaProvincia = codiceCatastale.provincia

        // Se il codice inizia con Z, è un codice estero: forza provincia a "EE"
        if (luogoNascitaCodice.startsWith('Z')) {
          luogoNascitaProvincia = 'EE'
        }
      } else if (luogoNascitaCodice.startsWith('Z')) {
        // Se il codice inizia con Z ma non è stato trovato, imposta provincia a "EE"
        luogoNascitaProvincia = 'EE'
      }
    }

    // Formatta la data di nascita per l'input date (YYYY-MM-DD)
    const dataNascitaFormatted = parsed.birth_date
      ? new Date(parsed.birth_date).toISOString().split('T')[0]
      : null

    // Costruisci la risposta
    const response = {
      data_nascita: dataNascitaFormatted,
      sesso: parsed.sesso,
      luogo_nascita_codice: luogoNascitaCodice,
      luogo_nascita_comune: luogoNascitaComune,
      luogo_nascita_provincia: luogoNascitaProvincia,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Errore in parse-codice-fiscale:', error)
    return NextResponse.json(
      { error: error.message || 'Errore durante il parsing del codice fiscale' },
      { status: 500 }
    )
  }
}
