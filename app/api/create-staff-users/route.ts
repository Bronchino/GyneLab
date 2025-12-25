import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * API route per sincronizzare i profili degli utenti staff esistenti
 * 
 * Utenti da sincronizzare:
 * - Admin: claudio.rossi@me.com
 * - Segretaria: rossiginecologo@gmail.com
 * 
 * Questa route verifica che gli utenti esistano in Supabase Auth e sincronizza
 * i loro profili nella tabella profili_utenti. Se un utente non esiste, lo crea.
 */
export async function POST(request: NextRequest) {
  try {
    // Verifica che la service role key sia configurata
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY non configurata' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createAdminClient()

    const staffUsers = [
      {
        email: 'claudio.rossi@me.com',
        password: 'admin',
        nome: 'Claudio',
        cognome: 'Rossi',
        ruolo: 'admin' as const,
      },
      {
        email: 'rossiginecologo@gmail.com',
        password: 'segretaria',
        nome: 'Segretaria',
        cognome: 'Studio',
        ruolo: 'segretaria' as const,
      },
    ]

    // Ottieni tutti gli utenti esistenti
    const { data: existingUsersData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      return NextResponse.json(
        { error: `Errore nel recupero utenti: ${listError.message}` },
        { status: 500 }
      )
    }

    const existingUsers = existingUsersData?.users || []
    const results = []

    for (const userData of staffUsers) {
      try {
        // Cerca l'utente esistente
        const existingUser = existingUsers.find(
          (u) => u.email?.toLowerCase() === userData.email.toLowerCase()
        )

        let userId: string

        if (existingUser) {
          // Utente esiste già, usa il suo ID
          userId = existingUser.id
          results.push({
            email: userData.email,
            status: 'found',
            message: 'Utente trovato nel backend',
            userId,
          })
        } else {
          // Utente non esiste, crealo
          const { data: newUser, error: createError } =
            await supabaseAdmin.auth.admin.createUser({
              email: userData.email,
              password: userData.password,
              email_confirm: true,
            })

          if (createError) {
            results.push({
              email: userData.email,
              status: 'error',
              message: `Errore nella creazione utente: ${createError.message}`,
            })
            continue
          }

          if (!newUser.user) {
            results.push({
              email: userData.email,
              status: 'error',
              message: 'Utente non creato',
            })
            continue
          }

          userId = newUser.user.id
          results.push({
            email: userData.email,
            status: 'created',
            message: 'Utente creato (non esisteva nel backend)',
            userId,
          })
        }

        // Sincronizza il profilo nella tabella profili_utenti
        const { data: existingProfile, error: profileReadError } =
          await supabaseAdmin
            .from('profili_utenti')
            .select('*')
            .eq('id', userId)
            .single()

        if (profileReadError && profileReadError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, che è ok se il profilo non esiste
          results.push({
            email: userData.email,
            status: 'warning',
            message: `Errore nel controllo profilo: ${profileReadError.message}`,
          })
          continue
        }

        // Crea o aggiorna il profilo
        const profileData = {
          id: userId,
          nome: userData.nome,
          cognome: userData.cognome,
          ruolo: userData.ruolo,
          attivo: true,
        }

        const { error: profileError } = await supabaseAdmin
          .from('profili_utenti')
          .upsert(profileData, {
            onConflict: 'id',
          })

        if (profileError) {
          results.push({
            email: userData.email,
            status: 'error',
            message: `Errore nella sincronizzazione profilo: ${profileError.message}`,
          })
        } else {
          // Aggiorna il risultato
          const result = results.find((r) => r.email === userData.email)
          if (result) {
            if (existingProfile) {
              result.message = result.message + ' - Profilo sincronizzato'
            } else {
              result.message = result.message + ' - Profilo creato'
            }
          }
        }
      } catch (error: any) {
        results.push({
          email: userData.email,
          status: 'error',
          message: error.message || 'Errore sconosciuto',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sincronizzazione completata',
      results,
    })
  } catch (error: any) {
    console.error('Errore nella sincronizzazione degli utenti staff:', error)
    return NextResponse.json(
      {
        error: error.message || 'Errore durante la sincronizzazione degli utenti',
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint per verificare lo stato degli utenti staff
 * Verifica se gli utenti esistono in Supabase Auth e se hanno profili sincronizzati
 */
export async function GET() {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY non configurata' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createAdminClient()

    const staffEmails = ['claudio.rossi@me.com', 'rossiginecologo@gmail.com']

    const { data: usersData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      return NextResponse.json(
        { error: `Errore nel recupero utenti: ${listError.message}` },
        { status: 500 }
      )
    }

    const allUsers = usersData?.users || []
    const staffUsers = allUsers.filter((u) =>
      staffEmails.some((email) => email.toLowerCase() === u.email?.toLowerCase())
    )

    const profiles = []
    for (const email of staffEmails) {
      const user = staffUsers.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      )

      if (user) {
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profili_utenti')
          .select('*')
          .eq('id', user.id)
          .single()

        profiles.push({
          email: user.email,
          userId: user.id,
          existsInAuth: true,
          profile: profile || null,
          profileError: profileError
            ? {
                message: profileError.message,
                code: profileError.code,
              }
            : null,
        })
      } else {
        profiles.push({
          email,
          userId: null,
          existsInAuth: false,
          profile: null,
          profileError: null,
        })
      }
    }

    return NextResponse.json({
      staffUsers: profiles,
      summary: {
        total: staffEmails.length,
        foundInAuth: profiles.filter((p) => p.existsInAuth).length,
        withProfile: profiles.filter((p) => p.profile).length,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Errore durante la verifica',
      },
      { status: 500 }
    )
  }
}

