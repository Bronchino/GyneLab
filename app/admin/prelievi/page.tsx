import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-role'
import PrelieviList from './prelievi-list'

export default async function AdminPrelieviPage() {
  await requireAdmin()
  
  const supabase = await createClient()

  // Query tutti i prelievi
  // Nota: per semplicità mostriamo solo i dati base, le relazioni possono essere caricate separatamente se necessario
  const { data: prelievi, error } = await supabase
    .from('prelievi')
    .select('*')
    .order('data_prelievo', { ascending: false })

  if (error) {
    // Test RPC functions per diagnosticare il problema
    const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin')
    const { data: isStaffResult, error: staffError } = await supabase.rpc('is_staff')
    
    // Se le funzioni restituiscono true ma c'è ancora errore, probabilmente mancano le RLS policies
    const isRlsPolicyIssue = (isAdminResult || isStaffResult) && error.message.includes('permission denied')
    
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="rounded-md bg-red-50 p-4">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Errore nel caricamento dei prelievi
          </h3>
          <p className="text-red-700 mb-4">{error.message}</p>
          
          {isRlsPolicyIssue ? (
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200 mt-4">
              <p className="font-semibold text-yellow-800 mb-2">🔧 Problema Rilevato: Permessi Database</p>
              <p className="text-yellow-700 text-sm mb-3">
                Le funzioni RPC funzionano correttamente, ma c'è un problema di accesso alla tabella prelievi.
                Se RLS è disabilitato, verifica che:
              </p>
              <div className="bg-white p-3 rounded border border-yellow-300">
                <p className="font-semibold text-sm mb-2">Verifiche da fare:</p>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 mb-3">
                  <li>RLS è disabilitato sulla tabella prelievi</li>
                  <li>I permessi GRANT sono corretti per il ruolo 'authenticated'</li>
                  <li>Non ci sono policies residue attive</li>
                </ol>
                <p className="font-semibold text-sm mb-2">Soluzione:</p>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                  <li>Apri il SQL Editor in Supabase</li>
                  <li>Esegui lo script <code className="bg-yellow-100 px-1 rounded font-mono text-xs">verify-rls-disabled-and-remove-policies.sql</code></li>
                  <li>Oppure <code className="bg-yellow-100 px-1 rounded font-mono text-xs">disable-rls-and-fix-permissions.sql</code></li>
                  <li>Ricarica questa pagina</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="bg-white p-3 rounded border border-red-200">
              <p className="text-sm font-semibold mb-2">Debug RPC Functions:</p>
              <ul className="text-sm space-y-1">
                <li>is_admin(): {isAdminResult ? '✅ true' : '❌ false'} {adminError ? `(error: ${adminError.message})` : ''}</li>
                <li>is_staff(): {isStaffResult ? '✅ true' : '❌ false'} {staffError ? `(error: ${staffError.message})` : ''}</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Nota: il select con join potrebbe non funzionare come atteso con Supabase
  // Potremmo dover fare query separate. Per ora mostriamo i dati base.
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Prelievi</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gestione prelievi e referti
        </p>
      </div>

      <PrelieviList prelievi={prelievi || []} />
    </div>
  )
}

