import { requireAdmin } from '@/lib/auth/require-role'
import { redirect } from 'next/navigation'

export default async function AdminDashboardPage() {
  await requireAdmin()
  
  // Reindirizza alla nuova dashboard "Situazione Esami"
  redirect('/admin/esami-in-attesa')
}

