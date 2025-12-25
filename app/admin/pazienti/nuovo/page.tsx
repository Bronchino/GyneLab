import { requireAdmin } from '@/lib/auth/require-role'
import NuovoPazienteForm from './nuovo-paziente-form'

export default async function NuovoPazientePage() {
  await requireAdmin() // RLS: admin può INSERT

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">+ Nuovo Paziente</h1>
      </div>

      <NuovoPazienteForm />
    </div>
  )
}
