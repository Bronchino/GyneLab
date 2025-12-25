import { requireAdmin } from '@/lib/auth/require-role'
import NuovoOperatoreForm from './nuovo-operatore-form'

export default async function NuovoOperatorePage() {
  await requireAdmin() // RLS: solo admin può INSERT

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Nuovo Operatore</h1>
        <p className="mt-2 text-sm text-gray-600">
          Inserisci i dati del nuovo operatore
        </p>
      </div>

      <NuovoOperatoreForm />
    </div>
  )
}


