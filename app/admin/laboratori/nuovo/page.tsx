import { requireAdmin } from '@/lib/auth/require-role'
import NuovoLaboratorioForm from './nuovo-laboratorio-form'

export default async function NuovoLaboratorioPage() {
  await requireAdmin() // RLS: solo admin può INSERT

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Nuovo Laboratorio</h1>
        <p className="mt-2 text-sm text-gray-600">
          Inserisci i dati del nuovo laboratorio
        </p>
      </div>

      <NuovoLaboratorioForm />
    </div>
  )
}



