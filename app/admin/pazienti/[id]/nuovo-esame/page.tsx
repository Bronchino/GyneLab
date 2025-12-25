import { requireAdmin } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import NuovoEsameForm from './nuovo-esame-form'

export default async function NuovoEsamePage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdmin()

  const supabase = await createClient()

  // Verifica che il paziente esista
  const { data: paziente, error } = await supabase
    .from('pazienti')
    .select('id, nome, cognome')
    .eq('id', params.id)
    .single()

  if (error || !paziente) {
    notFound()
  }

  // Carica laboratori e tipi prelievo per i dropdown
  const { data: laboratori } = await supabase
    .from('laboratori')
    .select('*')
    .order('nome', { ascending: true })

  const { data: tipiPrelievo } = await supabase
    .from('tipi_prelievo')
    .select('*')
    .eq('attivo', true)
    .order('nome', { ascending: true })

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Breadcrumb e header */}
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-2">
          Amministrazione / Esami / Inserisci
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Nuovo Esame</h1>
          <a
            href={`/admin/pazienti/${params.id}`}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Torna agli Esami
          </a>
        </div>
      </div>

      <NuovoEsameForm
        pazienteId={params.id}
        pazienteNome={`${paziente.cognome} ${paziente.nome}`}
        laboratori={laboratori || []}
        tipiPrelievo={tipiPrelievo || []}
      />
    </div>
  )
}


