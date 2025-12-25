import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * API route per aggiornare un operatore esistente
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin() // Solo admin può aggiornare operatori

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY non configurata' },
        { status: 500 }
      )
    }

    const { nome, cognome, email, password, ruolo, attivo } = await request.json()

    // Validazione
    if (!nome || !cognome || !email || !ruolo) {
      return NextResponse.json(
        { error: 'Nome, cognome, email e ruolo sono obbligatori' },
        { status: 400 }
      )
    }

    if (ruolo !== 'admin' && ruolo !== 'segretaria') {
      return NextResponse.json(
        { error: 'Ruolo non valido' },
        { status: 400 }
      )
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'La password deve essere di almeno 6 caratteri' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()
    const operatoreId = params.id

    // Verifica se l'utente esiste
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(operatoreId)
    
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Operatore non trovato' },
        { status: 404 }
      )
    }

    // Se l'email è cambiata, verifica che non esista già
    if (email !== userData.user.email) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase() && u.id !== operatoreId
      )

      if (existingUser) {
        return NextResponse.json(
          { error: 'Un utente con questa email esiste già' },
          { status: 400 }
        )
      }
    }

    // Aggiorna l'utente in Supabase Auth
    const updateData: any = {
      email,
    }

    if (password) {
      updateData.password = password
    }

    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      operatoreId,
      updateData
    )

    if (updateAuthError) {
      return NextResponse.json(
        { error: `Errore nell'aggiornamento utente: ${updateAuthError.message}` },
        { status: 400 }
      )
    }

    // Aggiorna il profilo nella tabella profili_utenti
    const { error: profileError } = await supabaseAdmin
      .from('profili_utenti')
      .update({
        nome,
        cognome,
        ruolo,
        attivo: attivo !== undefined ? attivo : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', operatoreId)

    if (profileError) {
      return NextResponse.json(
        { error: `Errore nell'aggiornamento profilo: ${profileError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Operatore aggiornato con successo',
    })
  } catch (error: any) {
    console.error('Errore nell\'aggiornamento dell\'operatore:', error)
    return NextResponse.json(
      {
        error: error.message || 'Errore durante l\'aggiornamento dell\'operatore',
      },
      { status: 500 }
    )
  }
}


