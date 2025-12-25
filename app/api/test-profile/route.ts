import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autenticato', authError: authError?.message })
  }

  // Prova a leggere il profilo
  const { data: profilo, error: profiloError } = await supabase
    .from('profili_utenti')
    .select('*')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    userId: user.id,
    profilo,
    profiloError: profiloError ? {
      message: profiloError.message,
      code: profiloError.code,
      details: profiloError.details,
      hint: profiloError.hint,
    } : null,
  })
}



