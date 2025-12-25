import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * API route per creare un nuovo operatore
 * Crea l'utente in Supabase Auth e il profilo in profili_utenti
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin() // Solo admin può creare operatori

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY non configurata' },
        { status: 500 }
      )
    }

    const { nome, cognome, email, password, ruolo } = await request.json()

    // Validazione
    if (!nome || !cognome || !email || !password || !ruolo) {
      return NextResponse.json(
        { error: 'Tutti i campi sono obbligatori' },
        { status: 400 }
      )
    }

    if (ruolo !== 'admin' && ruolo !== 'segretaria') {
      return NextResponse.json(
        { error: 'Ruolo non valido' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La password deve essere di almeno 6 caratteri' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // Verifica se l'utente esiste già
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utente con questa email esiste già' },
        { status: 400 }
      )
    }

    // Crea l'utente in Supabase Auth
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (createError) {
      return NextResponse.json(
        { error: `Errore nella creazione utente: ${createError.message}` },
        { status: 400 }
      )
    }

    if (!newUser.user) {
      return NextResponse.json(
        { error: 'Utente non creato' },
        { status: 500 }
      )
    }

    // Crea il profilo nella tabella profili_utenti
    const { error: profileError } = await supabaseAdmin
      .from('profili_utenti')
      .insert({
        id: newUser.user.id,
        nome,
        cognome,
        ruolo,
        attivo: true,
      })

    if (profileError) {
      // Se il profilo non viene creato, elimina l'utente auth
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json(
        { error: `Errore nella creazione profilo: ${profileError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      userId: newUser.user.id,
      message: 'Operatore creato con successo',
    })
  } catch (error: any) {
    console.error('Errore nella creazione dell\'operatore:', error)
    return NextResponse.json(
      {
        error: error.message || 'Errore durante la creazione dell\'operatore',
      },
      { status: 500 }
    )
  }
}


