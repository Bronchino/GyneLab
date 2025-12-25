import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-role'
import { Paziente } from '@/lib/supabase/types'
import { notFound } from 'next/navigation'
import EditPazienteForm from './edit-paziente-form'

export default async function EditPazientePage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdmin() // RLS: admin può UPDATE
  
  const supabase = await createClient()

  // RLS: admin può SELECT tutti i pazienti
  const { data: paziente, error } = await supabase
    .from('pazienti')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !paziente) {
    notFound()
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Modifica Paziente</h1>
        <p className="mt-2 text-sm text-gray-600">
          Modifica i dati del paziente
        </p>
      </div>

      <EditPazienteForm paziente={paziente as Paziente} />
    </div>
  )
}



