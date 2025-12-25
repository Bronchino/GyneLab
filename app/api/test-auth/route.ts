import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  // Verifica anche i cookie nella richiesta
  const cookieHeader = request.headers.get('cookie')
  
  return NextResponse.json({
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    authError: authError?.message,
    cookieHeader: cookieHeader ? 'Present' : 'Missing',
    cookiesCount: cookieHeader ? cookieHeader.split(';').length : 0,
  })
}



