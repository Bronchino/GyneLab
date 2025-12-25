import { createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/auth/require-role'
import PrelieviList from './prelievi-list'

export default async function StaffPrelieviPage() {
  await requireStaff()
  
  const supabase = await createClient()

  // RLS: staff può SELECT tutti i prelievi
  const { data: prelievi, error } = await supabase
    .from('prelievi')
    .select('*')
    .order('data_prelievo', { ascending: false })

  if (error) {
    // Test RPC functions per diagnosticare il problema
    const { data: isStaffResult, error: staffError } = await supabase.rpc('is_staff')
    
    // Se le funzioni restituiscono true ma c'è ancora errore, probabilmente mancano le RLS policies
    const isRlsPolicyIssue = isStaffResult && error.message.includes('permission denied')
    
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="rounded-md bg-red-50 p-4">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Errore nel caricamento dei prelievi
          </h3>
          <p className="text-red-700 mb-4">{error.message}</p>
          
          {isRlsPolicyIssue ? (
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200 mt-4">
              <p className="font-semibold text-yellow-800 mb-2">🔧 Problema Rilevato: RLS Policies Mancanti</p>
              <p className="text-yellow-700 text-sm mb-3">
                Le funzioni RPC funzionano correttamente, ma le RLS policies sulla tabella prelievi non sono configurate.
              </p>
              <div className="bg-white p-3 rounded border border-yellow-300">
                <p className="font-semibold text-sm mb-2">Soluzione:</p>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                  <li>Apri il SQL Editor in Supabase</li>
                  <li>Esegui lo script <code className="bg-yellow-100 px-1 rounded font-mono text-xs">fix-prelievi-rls-access.sql</code></li>
                  <li>Ricarica questa pagina</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="bg-white p-3 rounded border border-red-200">
              <p className="text-sm font-semibold mb-2">Debug RPC Functions:</p>
              <ul className="text-sm space-y-1">
                <li>is_staff(): {isStaffResult ? '✅ true' : '❌ false'} {staffError ? `(error: ${staffError.message})` : ''}</li>
              </ul>
              {(!isStaffResult || staffError) && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <p className="font-semibold text-yellow-800">Possibile soluzione:</p>
                  <p className="text-yellow-700 mt-1">
                    Se is_staff() ritorna false o ha errori, esegui lo script SQL <code className="bg-yellow-100 px-1 rounded">fix-functions-security-definer.sql</code> nel database Supabase.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prelievi</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestione prelievi e referti
          </p>
        </div>
        <a
          href="/staff/prelievi/nuovo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Nuovo Prelievo
        </a>
      </div>

      <PrelieviList prelievi={prelievi || []} />
    </div>
  )
}

