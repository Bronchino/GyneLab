import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE operatore
 * RLS: solo admin può DELETE
 * Elimina il profilo e opzionalmente l'utente auth
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await requireAdmin() // Solo admin può eliminare
  
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()
  const operatoreId = params.id

  // Verifica che non sia l'ultimo admin
  const { data: profiliAdmin } = await supabase
    .from('profili_utenti')
    .select('id')
    .eq('ruolo', 'admin')
    .eq('attivo', true)

  const { data: profiloCorrente } = await supabase
    .from('profili_utenti')
    .select('ruolo')
    .eq('id', operatoreId)
    .single()

  if (profiloCorrente?.ruolo === 'admin' && profiliAdmin && profiliAdmin.length <= 1) {
    return NextResponse.json(
      { error: 'Non è possibile eliminare l\'ultimo admin' },
      { status: 400 }
    )
  }

  // Elimina il profilo dalla tabella profili_utenti
  const { error: deleteError } = await supabaseAdmin
    .from('profili_utenti')
    .delete()
    .eq('id', operatoreId)

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 400 }
    )
  }

  // Opzionalmente elimina anche l'utente auth
  // (commentato per sicurezza - decommentare se necessario)
  // await supabaseAdmin.auth.admin.deleteUser(operatoreId)

  // Redirect alla lista
  return NextResponse.redirect(new URL('/admin/operatori', request.url))
}


