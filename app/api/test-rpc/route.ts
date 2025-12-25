import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autenticato', authError: authError?.message })
  }

  // Testa le funzioni RPC
  const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin')
  const { data: isStaffResult, error: staffError } = await supabase.rpc('is_staff')
  const { data: isPazienteResult, error: pazienteError } = await supabase.rpc('is_paziente')

  return NextResponse.json({
    userId: user.id,
    rpcResults: {
      is_admin: { result: isAdminResult, error: adminError?.message },
      is_staff: { result: isStaffResult, error: staffError?.message },
      is_paziente: { result: isPazienteResult, error: pazienteError?.message },
    },
  })
}



