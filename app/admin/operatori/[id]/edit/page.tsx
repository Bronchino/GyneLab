import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import EditOperatoreForm from './edit-operatore-form'

export default async function EditOperatorePage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdmin() // RLS: solo admin può UPDATE
  
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  // Recupera il profilo
  const { data: profilo, error: profiloError } = await supabase
    .from('profili_utenti')
    .select('*')
    .eq('id', params.id)
    .in('ruolo', ['admin', 'segretaria'])
    .single()

  if (profiloError || !profilo) {
    notFound()
  }

  // Recupera l'email dall'utente auth
  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(params.id)
  const email = userData?.user?.email || ''

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Modifica Operatore</h1>
        <p className="mt-2 text-sm text-gray-600">
          Modifica i dati dell'operatore
        </p>
      </div>

      <EditOperatoreForm 
        profilo={{
          id: profilo.id,
          nome: profilo.nome,
          cognome: profilo.cognome,
          email,
          ruolo: profilo.ruolo as 'admin' | 'segretaria',
          attivo: profilo.attivo,
        }}
      />
    </div>
  )
}


