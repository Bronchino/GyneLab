import { createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/auth/require-role'
import { Paziente, PazienteDocumento } from '@/lib/supabase/types'
import { format } from 'date-fns'
import { it } from 'date-fns/locale/it'
import { notFound } from 'next/navigation'
import UploadDocumentoForm from '@/app/admin/pazienti/[id]/upload-documento-form'
import DocumentiList from '@/app/admin/pazienti/[id]/documenti-list'

export default async function PazienteDetailPage({
  params,
}: {
  params: { id: string }
}) {
  await requireStaff()
  
  const supabase = await createClient()

  // RLS: staff può SELECT tutti i pazienti
  const { data: paziente, error } = await supabase
    .from('pazienti')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !paziente) {
    notFound()
  }

  // Carica documenti del paziente
  const { data: documenti, error: documentiError } = await supabase
    .from('pazienti_documenti')
    .select('*')
    .eq('paziente_id', params.id)
    .order('uploaded_at', { ascending: false })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: it })
    } catch {
      return dateString
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {paziente.nome} {paziente.cognome}
          </h1>
        </div>
        <div className="flex space-x-4">
          <a
            href={`/staff/pazienti/${params.id}/edit`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Modifica
          </a>
          <a
            href="/staff/pazienti"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Torna alla lista
          </a>
        </div>
      </div>

      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Cognome</dt>
              <dd className="mt-1 text-sm text-gray-900">{paziente.cognome}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Nome</dt>
              <dd className="mt-1 text-sm text-gray-900">{paziente.nome}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Data di Nascita</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(paziente.data_nascita)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Codice Fiscale</dt>
              <dd className="mt-1 text-sm text-gray-900">{paziente.codice_fiscale || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{paziente.email || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Cellulare</dt>
              <dd className="mt-1 text-sm text-gray-900">{paziente.cellulare || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Luogo di Nascita</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {paziente.luogo_nascita_comune || '-'}
                {paziente.luogo_nascita_provincia && ` (${paziente.luogo_nascita_provincia})`}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Sesso</dt>
              <dd className="mt-1 text-sm text-gray-900">{paziente.sesso || '-'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Sezione Documenti Paziente */}
      <div className="bg-white shadow rounded-lg mt-6">
        <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Documenti Paziente</h2>
        </div>
        <div className="px-4 py-5 sm:p-6 space-y-6">
          {/* Form Upload */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Carica Nuovo Documento</h3>
            <UploadDocumentoForm pazienteId={params.id} />
          </div>

          {/* Lista Documenti */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Documenti Caricati</h3>
            <DocumentiList documenti={(documenti || []) as PazienteDocumento[]} pazienteId={params.id} />
          </div>
        </div>
      </div>
    </div>
  )
}

