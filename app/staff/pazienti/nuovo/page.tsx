import { requireStaff } from '@/lib/auth/require-role'
import NuovoPazienteForm from './nuovo-paziente-form'

export default async function NuovoPazientePage() {
  await requireStaff() // RLS: staff può INSERT

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Nuovo Paziente</h1>
        <p className="mt-2 text-sm text-gray-600">
          Inserisci i dati del nuovo paziente
        </p>
      </div>

      <NuovoPazienteForm />
    </div>
  )
}

