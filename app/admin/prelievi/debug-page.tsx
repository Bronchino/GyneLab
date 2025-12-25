import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-role'

export default async function DebugPrelieviPage() {
  await requireAdmin()
  
  const supabase = await createClient()

  // Test 1: Verifica auth user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // Test 2: Verifica RPC functions
  const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin')
  const { data: isStaffResult, error: staffError } = await supabase.rpc('is_staff')
  
  // Test 3: Prova query diretta con count
  const { count: count1, error: countError1 } = await supabase
    .from('prelievi')
    .select('*', { count: 'exact', head: true })

  // Test 4: Prova query con limit
  const { data: prelievi, error: prelieviError, count: count2 } = await supabase
    .from('prelievi')
    .select('*', { count: 'exact' })
    .limit(1)

  // Test 5: Verifica se può leggere profili_utenti
  const { data: profilo, error: profiloError } = await supabase
    .from('profili_utenti')
    .select('*')
    .eq('id', user?.id || '')
    .single()

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-2xl font-bold mb-4">Debug Prelievi Access</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-bold">Auth User:</h2>
          <pre className="mt-2 text-sm">
            {JSON.stringify({ 
              id: user?.id, 
              email: user?.email,
              error: authError?.message 
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-bold">Profilo Utente:</h2>
          <pre className="mt-2 text-sm">
            {JSON.stringify({ 
              profilo,
              error: profiloError?.message 
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-bold">RPC Functions:</h2>
          <pre className="mt-2 text-sm">
            {JSON.stringify({ 
              is_admin: { result: isAdminResult, error: adminError?.message },
              is_staff: { result: isStaffResult, error: staffError?.message }
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-bold">Query Prelievi (count only):</h2>
          <pre className="mt-2 text-sm">
            {JSON.stringify({ 
              count: count1,
              error: countError1?.message,
              code: countError1?.code
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-bold">Query Prelievi (with data):</h2>
          <pre className="mt-2 text-sm">
            {JSON.stringify({ 
              count: count2,
              hasData: !!prelievi?.[0],
              error: prelieviError?.message,
              code: prelieviError?.code,
              details: prelieviError?.details,
              hint: prelieviError?.hint
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}



