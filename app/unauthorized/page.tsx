import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/auth/get-user-role'

export default async function UnauthorizedPage() {
  // Determina il ruolo per fare redirect alla dashboard corretta
  const role = await getUserRole()
  
  // Redirect alla dashboard appropriata invece di /login per evitare loop
  if (role === 'admin') {
    redirect('/admin/pazienti')
  } else if (role === 'segretaria') {
    redirect('/staff/pazienti')
  } else if (role === 'paziente') {
    redirect('/paziente/referti')
  }
  
  // Se non autenticato o ruolo non determinato, mostra la pagina
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">403 - Accesso Negato</h1>
        <p className="mt-2 text-gray-600">
          Non hai i permessi necessari per accedere a questa risorsa.
        </p>
        <a
          href="/login"
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          Torna al login
        </a>
      </div>
    </div>
  )
}

