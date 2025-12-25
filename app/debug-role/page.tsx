import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/auth/get-user-role'

export default async function DebugRolePage() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  let profiloResult = null
  let profiloError = null
  
  if (user) {
    const result = await supabase
      .from('profili_utenti')
      .select('*')
      .eq('id', user.id)
      .single()
    
    profiloResult = result.data
    profiloError = result.error
  }

  const role = await getUserRole()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Role</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="font-bold">Auth User:</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify({ user: user?.id, email: user?.email, authError: authError?.message }, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="font-bold">Profilo Query:</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify({ profilo: profiloResult, profiloError: profiloError?.message }, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="font-bold">getUserRole() Result:</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify({ role }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}



