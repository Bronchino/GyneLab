import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * STUB: Endpoint per download referto con signed URL S3
 * 
 * IMPORTANTE: Questo è uno stub che descrive la logica necessaria.
 * Per implementare correttamente serve:
 * 
 * 1. Service Role Key (NON anon key) in variabile d'ambiente:
 *    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 * 
 * 2. Client Supabase con service role (bypassa RLS):
 *    const supabaseAdmin = createClient(
 *      process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *      process.env.SUPABASE_SERVICE_ROLE_KEY!,
 *      { auth: { autoRefreshToken: false, persistSession: false } }
 *    )
 * 
 * 3. Generazione signed URL da Supabase Storage:
 *    const { data, error } = await supabaseAdmin
 *      .storage
 *      .from('referti') // nome bucket
 *      .createSignedUrl(s3Key, 3600) // URL valido 1 ora
 * 
 * 4. Redirect al signed URL o stream del file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // Gestione cookie per middleware
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  const prelievoId = params.id
  const s3Key = request.nextUrl.searchParams.get('s3_key')

  if (!s3Key) {
    return NextResponse.json({ error: 'S3 key mancante' }, { status: 400 })
  }

  // TODO: Implementare con service role:
  // 1. Creare client Supabase con service role
  // 2. Verificare che l'utente abbia i permessi (già fatto nelle route chiamanti)
  // 3. Generare signed URL da Storage
  // 4. Redirect o stream del file

  return NextResponse.json(
    {
      error: 'Endpoint non implementato',
      message: 'Serve service role key e configurazione Supabase Storage',
      stub: {
        prelievo_id: prelievoId,
        s3_key: s3Key,
        required_steps: [
          'Creare client Supabase con SUPABASE_SERVICE_ROLE_KEY',
          'Usare supabaseAdmin.storage.from(bucket).createSignedUrl(s3Key, expiresIn)',
          'Redirect al signed URL generato',
        ],
      },
    },
    { status: 501 }
  )
}

