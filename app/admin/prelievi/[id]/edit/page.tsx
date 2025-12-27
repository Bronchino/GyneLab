import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-role'
import { Prelievo } from '@/lib/supabase/types'
import { notFound } from 'next/navigation'
import EditPrelievoForm from './edit-prelievo-form'

export default async function EditPrelievoPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdmin()
  
  const supabase = await createClient()

  // Carica il prelievo
  const { data: prelievo, error } = await supabase
    .from('prelievi')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !prelievo) {
    notFound()
  }

  // Carica dati paziente
  const { data: paziente } = await supabase
    .from('pazienti')
    .select('id, nome, cognome')
    .eq('id', prelievo.paziente_id)
    .single()

  // Carica laboratori, tipi prelievo e stati per i dropdown
  const [laboratoriResult, tipiPrelievoResult, statiResult] = await Promise.all([
    supabase.from('laboratori').select('*').order('nome', { ascending: true }),
    supabase.from('tipi_prelievo').select('*').eq('attivo', true).order('nome', { ascending: true }),
    supabase.from('stati_prelievo').select('*').order('ordine', { ascending: true }),
  ])

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 mb-2">
              Amministrazione / Esami / Modifica
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Modifica Esame</h1>
            <p className="mt-2 text-sm text-gray-600">
              Modifica i dati dell'esame
            </p>
          </div>
          <a
            href="/admin/elenco-esami"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ← Torna indietro
          </a>
        </div>
      </div>

      <EditPrelievoForm 
        prelievo={prelievo as Prelievo}
        paziente={paziente || null}
        laboratori={laboratoriResult.data || []}
        tipiPrelievo={tipiPrelievoResult.data || []}
        stati={statiResult.data || []}
      />
    </div>
  )
}

