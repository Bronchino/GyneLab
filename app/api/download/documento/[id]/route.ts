import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * STUB: Endpoint per download documento con signed URL S3
 * Stesso stub del referto - vedi /api/download/referto/[id]/route.ts per dettagli
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
        setAll() {
          // Gestione cookie
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  const documentoId = params.id
  const s3Key = request.nextUrl.searchParams.get('s3_key')

  if (!s3Key) {
    return NextResponse.json({ error: 'S3 key mancante' }, { status: 400 })
  }

  // TODO: Implementare con service role (vedi stub referto)

  return NextResponse.json(
    {
      error: 'Endpoint non implementato',
      message: 'Serve service role key e configurazione Supabase Storage',
      stub: {
        documento_id: documentoId,
        s3_key: s3Key,
      },
    },
    { status: 501 }
  )
}

