import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-role'
import { TipoPrelievo } from '@/lib/supabase/types'
import { notFound } from 'next/navigation'
import EditTipoPrelievoForm from './edit-tipo-prelievo-form'

export default async function EditTipoPrelievoPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdmin() // RLS: admin può UPDATE
  
  const supabase = await createClient()

  // RLS: admin può SELECT tutti i tipi prelievo
  const { data: tipoPrelievo, error } = await supabase
    .from('tipi_prelievo')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !tipoPrelievo) {
    notFound()
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Modifica Tipologia d'Esame</h1>
        <p className="mt-2 text-sm text-gray-600">
          Modifica i dati della tipologia d'esame
        </p>
      </div>

      <EditTipoPrelievoForm tipoPrelievo={tipoPrelievo as TipoPrelievo} />
    </div>
  )
}

