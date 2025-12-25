import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-role'
import { Laboratorio } from '@/lib/supabase/types'
import { notFound } from 'next/navigation'
import EditLaboratorioForm from './edit-laboratorio-form'

export default async function EditLaboratorioPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdmin() // RLS: solo admin può UPDATE
  
  const supabase = await createClient()

  // RLS: solo admin può SELECT
  const { data: laboratorio, error } = await supabase
    .from('laboratori')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !laboratorio) {
    notFound()
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Modifica Laboratorio</h1>
        <p className="mt-2 text-sm text-gray-600">
          Modifica i dati del laboratorio
        </p>
      </div>

      <EditLaboratorioForm laboratorio={laboratorio as Laboratorio} />
    </div>
  )
}



