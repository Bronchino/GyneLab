import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './login-form'
import Logo from '@/components/logo'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Se già loggato, redirecta alla dashboard appropriata in base al ruolo
  if (user) {
    // Determina il ruolo per fare redirect corretto
    const { getUserRole } = await import('@/lib/auth/get-user-role')
    const role = await getUserRole()
    
    let redirectTo = searchParams.redirect
    
    // Se non c'è redirect specifico, usa la dashboard in base al ruolo
    if (!redirectTo) {
      if (role === 'admin') {
        redirectTo = '/admin/pazienti'
      } else if (role === 'segretaria') {
        redirectTo = '/staff/pazienti'
      } else if (role === 'paziente') {
        redirectTo = '/paziente/referti'
      } else {
        // Se ruolo non determinato, vai alla home
        redirectTo = '/'
      }
    }
    
    redirect(redirectTo)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow">
        <div className="flex flex-col items-center space-y-4">
          <Logo />
          <h2 className="text-center text-2xl font-bold text-gray-900">
            Benvenuto in GyneLab - Referti on line!
          </h2>
          <p className="text-center text-sm text-gray-600">
            Accedi utilizzando le credenziali fornite dal tuo medico.
          </p>
        </div>
        <LoginForm redirectTo={searchParams.redirect} />
      </div>
    </div>
  )
}

