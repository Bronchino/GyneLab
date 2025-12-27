import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { generatePassword } from '@/lib/utils/generate-credentials'

/**
 * API route per rigenerare la password di un paziente
 * Genera nuova password e aggiorna Supabase Auth
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireStaff() // Solo staff/admin può rigenerare password

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY non configurata' },
        { status: 500 }
      )
    }

    const pazienteId = params.id
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    // Recupera dati paziente
    const { data: paziente, error: pazienteError } = await supabase
      .from('pazienti')
      .select('*')
      .eq('id', pazienteId)
      .single()

    if (pazienteError || !paziente) {
      return NextResponse.json(
        { error: 'Paziente non trovato' },
        { status: 404 }
      )
    }

    // Verifica che il paziente abbia credenziali
    if (!paziente.auth_user_id) {
      return NextResponse.json(
        { error: 'Il paziente non ha credenziali. Genera prima le credenziali.' },
        { status: 400 }
      )
    }

    // Verifica che l'utente esista in Supabase Auth
    const { data: authUser, error: authUserError } =
      await supabaseAdmin.auth.admin.getUserById(paziente.auth_user_id)

    if (authUserError || !authUser.user) {
      return NextResponse.json(
        { error: 'Utente di autenticazione non trovato' },
        { status: 404 }
      )
    }

    // Genera nuova password
    const newPassword = generatePassword(12)

    // Recupera username dal codice fiscale o fallback
    const username = paziente.codice_fiscale
      ? paziente.codice_fiscale.toUpperCase()
      : `paziente_${pazienteId}`

    // Aggiorna password in Supabase Auth
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      paziente.auth_user_id,
      {
        password: newPassword,
      }
    )

    if (updateError) {
      console.error('Errore nell\'aggiornamento password:', updateError)
      return NextResponse.json(
        { error: `Errore nell'aggiornamento password: ${updateError.message}` },
        { status: 400 }
      )
    }

    // Verifica che l'utente sia stato aggiornato correttamente
    if (!updatedUser || !updatedUser.user) {
      console.error('Errore: utente non aggiornato correttamente')
      return NextResponse.json(
        { error: 'Errore: utente non aggiornato correttamente' },
        { status: 500 }
      )
    }

    console.log(`Password rigenerata con successo per paziente ${pazienteId} (auth_user_id: ${paziente.auth_user_id})`)

    return NextResponse.json({
      success: true,
      username,
      password: newPassword,
    })
  } catch (error: any) {
    console.error('Errore nella rigenerazione password:', error)
    return NextResponse.json(
      {
        error: error.message || 'Errore durante la rigenerazione della password',
      },
      { status: 500 }
    )
  }
}


