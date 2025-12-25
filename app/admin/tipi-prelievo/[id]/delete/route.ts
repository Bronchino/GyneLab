import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-role'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE tipologia di esame
 * RLS: solo admin può DELETE
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAdmin() // Solo admin può eliminare
  
  const supabase = await createClient()
  const tipoPrelievoId = params.id

  // RLS: solo admin può DELETE
  const { error } = await supabase
    .from('tipi_prelievo')
    .delete()
    .eq('id', tipoPrelievoId)

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  // Redirect alla lista
  return NextResponse.redirect(new URL('/admin/tipi-prelievo', request.url))
}


