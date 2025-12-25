import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Se già loggato, redirecta alla dashboard appropriata
  if (user) {
    const redirectTo = searchParams.redirect || '/'
    redirect(redirectTo)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Accesso Area Riservata
          </h2>
        </div>
        <LoginForm redirectTo={searchParams.redirect} />
      </div>
    </div>
  )
}

