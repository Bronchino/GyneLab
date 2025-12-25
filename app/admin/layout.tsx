import { requireAdmin } from '@/lib/auth/require-role'
import { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import AdminLayoutClient from './layout-client'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  // Verifica che l'utente sia admin
  await requireAdmin()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Ottieni il profilo per nome e cognome
  let nomeCompleto = user?.email || 'Admin'
  if (user) {
    const { data: profilo } = await supabase
      .from('profili_utenti')
      .select('nome, cognome')
      .eq('id', user.id)
      .single()
    
    if (profilo?.nome && profilo?.cognome) {
      nomeCompleto = `${profilo.nome} ${profilo.cognome}`
    }
  }

  return (
    <AdminLayoutClient nomeCompleto={nomeCompleto}>
      {children}
    </AdminLayoutClient>
  )
}
