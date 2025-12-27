import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  generateUsername,
  generatePassword,
  generatePatientEmail,
} from '@/lib/utils/generate-credentials'

/**
 * API route per generare credenziali per un paziente
 * Crea utente in Supabase Auth e aggiorna pazienti.auth_user_id
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireStaff() // Solo staff/admin può generare credenziali

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

    // Verifica se il paziente ha già credenziali
    if (paziente.auth_user_id) {
      // Verifica se l'utente esiste ancora in Supabase Auth
      const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(
        paziente.auth_user_id
      )

      if (existingUser.user) {
        return NextResponse.json(
          { error: 'Il paziente ha già delle credenziali' },
          { status: 400 }
        )
      }
    }

    // Genera username e password
    const username = generateUsername(paziente.codice_fiscale, pazienteId)
    const password = generatePassword(12)
    const email = generatePatientEmail(username)

    // Verifica se l'email esiste già in Supabase Auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utente con questo username esiste già' },
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

    // Aggiorna pazienti.auth_user_id
    const { error: updateError } = await supabase
      .from('pazienti')
      .update({ auth_user_id: newUser.user.id })
      .eq('id', pazienteId)

    if (updateError) {
      // Se l'update fallisce, elimina l'utente auth
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json(
        { error: `Errore nell'aggiornamento paziente: ${updateError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      username,
      password,
      email, // Solo per debug, non mostrare al paziente
    })
  } catch (error: any) {
    console.error('Errore nella generazione credenziali:', error)
    return NextResponse.json(
      {
        error: error.message || 'Errore durante la generazione delle credenziali',
      },
      { status: 500 }
    )
  }
}


