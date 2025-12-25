import { requireAdmin } from '@/lib/auth/require-role'
import NuovoTipoPrelievoForm from './nuovo-tipo-prelievo-form'

export default async function NuovoTipoPrelievoPage() {
  await requireAdmin() // RLS: admin può INSERT

  return (
    <div>
      <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">+ Nuova Tipologia d'Esame</h1>
        <p className="mt-2 text-sm text-gray-600">
          Aggiungi una nuova tipologia d'esame
        </p>
      </div>

      <NuovoTipoPrelievoForm />
    </div>
  )
}

