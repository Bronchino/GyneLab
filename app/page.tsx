import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/auth/get-user-role'

export default async function HomePage() {
  const role = await getUserRole()
  
  // Redirect alla dashboard appropriata in base al ruolo
  if (!role) {
    redirect('/login')
  }
  
  switch (role) {
    case 'admin':
      redirect('/admin/dashboard')
    case 'segretaria':
      redirect('/staff/pazienti')
    case 'paziente':
      redirect('/paziente/referti')
    default:
      redirect('/login')
  }
}

